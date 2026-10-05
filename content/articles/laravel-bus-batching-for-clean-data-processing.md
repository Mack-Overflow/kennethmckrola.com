---
title: Laravel Bus Batching for Clean Data Processing
description: >-
  How I utilized Snowflake & Laravel job batches to track data push statuses
  with no loss
date: 2026-09-28T00:00:00.000Z
kind: challenge
tags:
  - laravel
  - snowflake
  - queue
draft: false
devto: true
devto_id: 4803050
devto_url: >-
  https://dev.to/mackoverflow/laravel-bus-batching-for-clean-data-processing-1oeh
devto_hash: 2d57a17f9798
---
## The Feature

Over 10k subscribed users are paying to have updates to contact lists in a CRM application. In a time interval set between each day and every 7 days, we will push updated and new contacts from our lead sourcing to the CRM.\
These datasets are on average in the hundreds of contacts per user, but for some users reach into the thousands.\
If any failures occur in the process of creating a prospect record, we want to know which records fail in the source data. If there is additional user setup that is required as well before we can begin pushing these contacts to the users' CRM, we also need to know about that. If a failure should arise, we need to be aware that the failed data could be corrected and should be retried at a future time interval. Once a failure threshold has occurred for a single contact record, we can move it out of the process.

## The Path Forward

To begin, we create batches of 1k contacts each to process at a time. These batches may consist entirely of leads that belong to the same user, or there may be multiple users in ownership. The trick is that we know which user's specific contact list settings they are identified by. Each user may have multiple lists that leads get assigned to, each with it's own delivery settings and preferences (delivery time, intervals, text vs. email, etc.). Validated data is proceeded to send to the CRM application, and failed data is returned early without blocking the rest of the user's leads or other users' leads in the same batch.

## Challenge - Framing Multi-service architecture

4 separate services were involved in this feature.

1. Snowflake as lead delta data store
2. Laravel scheduler/base queue worker (kernel driver)
3. Main Laravel web service (HTTP Clients & bus batch )

CRM web service (HTTP Server)\
\
The lead list deltas are pulled in the scheduler each hour, 1k records at a time (1 batch). From there, we begin validation and begin mapping the associated user's list settings, pulling them from the Laravel web service where they live, and checking if the lead deltas are due to sync based on their CRM-sync timing configuration. Validation on correct user contact info, push a bulk POST request to the web service.\
The bulk endpoint in the web service handles additional pre-flight validation, determines users CRM account, and pushes their leads to be created as prospects there.

### Constraint: Throttling requests per second to CRM app

The main CRM destination limits to 10 requests/second per user, which could mean an entire batch with 1000 leads under a single would the request to block for almost 2 minutes, with many cases taking on average 1 minute. Not acceptable waiting on this during the Laravel base queue worker's handler, and introduces potential network timeout or connection dropped issues when many of these requests are made in quick succession. Failure rate could be expected to climb and look messy.\
\
At this point, I begin to explore an async approach, putting the leads into a job, and making the request from the queue worker service to the web service a fire-and-forget request. If the request goes through, we return a 202 response, and the queue worker moves on to the next batch of 1k records to process.

### Constraint: Updating lead status independently of batch

The batch update functionality is designed to update all leads in the batch via this Snowflake proc call: `LEADS.UPDATEBATCH($batchId, 'STATUS', [$exceptionLeadId1, $exceptionLeadId2, ... ])`. This means if some leads fail during pre-flight validation, and others continue, we have to leave those in processing as 'LOCKED', while keeping track of which failed prior to our job dispatch, as the job handler won't have access to the context of the request lifecycle. However, I also needed to be mindful of the leads that could fail to be created in the CRM in that request itself.

To account for our 2 constraints, 2 solutions were in order

1. Use Bus Batching to process CRM requests per lead.
2. Use Redis to cache lead ids that have failed across jobs.

In order to account for delayed requests, tracking all failed jobs across job dispatches that don't have information about one another, and eventually updating all job statuses, we create one job per request to be made, and dispatch all via `Bus::batch()` \
\
It ends up looking like this:

```php
Bus::batch($jobs)
->allowFailures()
->finally(function (Batch $batch) use ($batchId, $cacheKey) {
        $failed = Cache::get($cacheKey, []);
        $failedNum = count($failed);
	\Log::notice("Failed id for batchId: $batchId, $failedNum");
	self::updateSnowflakeJobStatus('SYNCED', $jobId, $failed);
	Cache::forget($cacheKey);
})
->dispatch();
```

Note the usage above of `Cache::get() / Cache::forget()`. Upon completion of all jobs, we log the number of failed jobs, post an update to the Snowflake proc to list all non-failed job ids as synced (successful) and then clear the cache. Inside of the job handler, we store failed job ids under the correct batch this way:

```php
$cacheKey = "dl_sync:{$batchId}:failed_ids";
Cache::put($cacheKey, $jobId, 3600);
```

## Conclusion & Reflection

Batching jobs through Laravel's Bus isn't always the right tool. For a handful of jobs, or when the caller needs to report status synchronously in the same request, it's overkill. It earns its keep when hundreds or thousands of jobs are in play and the client doesn't need the full outcome inside a single request lifecycle.

That's exactly my situation. The upstream service that pulls tens to hundreds of thousands of contacts out of Snowflake finishes its part in under a minute, hands the records to the API, and gets a `202 Accepted` back immediately. The API runs a quick pre-flight (missing tokens, missing profiles, missing list settings), then dispatches one batch holding a single-contact job for every record that survived. `allowFailures()` means one bad push to the CRM service doesn't cancel the rest of the list.

The Redis cache is what makes the reporting honest. A `Batch` knows how many jobs failed, not which contacts failed, and the `finally` callback can't see individual job payloads. So each job's `failed()` hook appends its identifier to a per-job cache key under a short lock, the pre-flight failures are seeded into that same key before dispatch, and `finally` reads the key once, calls the Snowflake stored procedure to mark the job `SYNCED` with the failed id list, and forgets the key. One write to Snowflake per job, covering both synchronous and asynchronous failures.

Two tradeoffs I'm living with: the one-hour TTL on that key bounds how long a batch can run before failures silently disappear, and with `tries = 1` a transient CRM timeout counts as a permanent failure for that contact. Both are acceptable at today's volume, and both are easy to tune when they stop being.
