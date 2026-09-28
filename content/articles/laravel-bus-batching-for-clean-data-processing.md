---
title: "Laravel Bus Batching for Clean Data Processing"
description: "How I utilized Snowflake & Laravel job batches to track data push statuses with no loss"
date: 2026-09-28
kind: challenge
tags: [laravel, snowflake, queue]
draft: true
devto: false
---
## The Feature

Over 10k subscribed users are paying to have updates to contact lists in a CRM application. In a time interval set between each day and every 7 days, we will push updated and new contacts from our lead sourcing to the CRM.\
These datasets are on average in the hundreds of contacts per user, but for some users reach into the thousands.\
If any failures occur in the process of creating a prospect record, we want to know which records fail in the source data. If there is additional user setup that is required as well before we can begin pushing these contacts to the users' CRM, we also need to know about that. If a failure should arise, we need to be aware that the failed data could be corrected and should be retried at a future time interval. Once a failure threshold has occurred for a single contact record, we can move it out of the process.

## The Path Forward

To begin, we create batches of 1k contacts each to process at a time. These batches may consist entirely of leads that belong to the same user, or there may be multiple users in ownership. The trick is that we know which user's specific contact list settings they are identified by. Each user may have multiple lists that leads get assigned to, each with it's own delivery settings and preferences (delivery time, intervals, text vs. email, etc.). Validated data is proceeded to send to the CRM application, and failed data is returned early without blocking the rest of the user's leads or other users' leads in the same batch.

## Challenge #1 - Framing Multi-service architecture

4 separate services were involved in this feature.\
1. Snowflake as lead delta data store\
2. Laravel scheduler/base queue worker (kernel driver)\
3. Laravel web service (HTTP Clients & bus batch )\
4. CRM web service (HTTP Server)\
\
The lead list deltas are pulled in the scheduler each hour, 1k records at a time (1 batch). From there, we begin validation and begin mapping the associated user's list settings, pulling them from the Laravel web service \
We store an auth token by which we identify their CRM app account, and need to attach it to each request.
