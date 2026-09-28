---
title: "Laravel Bus Batching for Clean Data Processing"
description: "How I utilized Snowflake & Laravel job batches to track data push statuses with no loss"
date: 2026-09-28
kind: challenge
tags: [laravel, snowflake, queue]
draft: true
devto: false
---
\# The Challenge\
Over 10k subscribed users are paying to have updates to contact lists in a CRM application. In a time interval set between each day and every 7 days, we will push updated and new contacts from our lead sourcing to the CRM.\
These datasets are on average in the hundreds of contacts per user, but for some users reach into the thousands.\
If any failures occur in the process of creating a prospect record, we want to know which records fail in the source data. If there is additional user setup that is required as well before we can begin pushing these contacts to the users' CRM, we also need to know about that. If a failure should arise, we need to be aware that the failed data could be corrected and should be retried at a future time interval. Once a failure threshold has occurred for a single contact record, we can move it out of the process.

\
# The path forward\
We store an auth token by which we identify their CRM app account, and need to attach it to each request.
