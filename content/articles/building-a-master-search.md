---
title: "Building a 'Master Search'"
description: "Developing a free-text search component that spans multiple tables and database connections"
date: 2026-09-24
kind: project
tags: [nuxt, laravel, snowflake, mysql]
draft: true
devto: true
---
## The opportunity - stop putting so much data in the users' hands, *without* showing them how to use it

\
One issue with lightning-fast releases is that you oftentimes outpace adoption by your own users and administrators. This was something my team was encountering increasingly with our sales and customer success members as they brought new users into our integrated, all-in-one platform. We had more features rolling out weekly, with the intention of empowering our internal admins to have access to more data as they supported users in adoption of this platform, and in debugging any issues. But like any software, learning a new platform, as well as how to navigate it, what to make sense of, can be like drinking from a fire hose. We quickly had dozens of different pages, each with it's own customer tables, billing status checks, and purchase order lookups.\
\
As the saying goes, you can lead a horse to water, but you can't make it drink. In the case of my engineering team, our proverbial horses were overwhelmed by the number of separate streams they had to drink from, and would benefit from a single source.

---

## The path: one search component to rule them all

The concept of a single, "master" search component is not a new concept in web development. It is increasingly common across all sorts of applications. The inspiration in our case was derived primarily from Stripe, with the ability to lookup by any customer fields, as well as purchase order ids, billing information, etc. This can involve a wide range of challenges at the outset, some of which in my case were

- Multiple tables to search, which are unassociated by key relationships
- Missing indexes on free-text searched fields
- Tables in separate entire databases with shared columns to query
- Missing queryable data which needs to be backfilled before a single source of truth can be truthfully presented

to name just a few.\
\
The end result would give multiple response data type objects (DTOs) based on all different table matches on provided

---

### Challenge 1: Different tables, different models, different DTOs

Each table returns data in a different structure, but
