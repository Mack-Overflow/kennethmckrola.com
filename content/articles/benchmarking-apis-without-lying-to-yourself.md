---
title: "Benchmarking APIs without lying to yourself"
description: "Why I built Benchmarkr, and the handful of measurement mistakes it exists to stop me from making."
date: 2026-09-20
kind: project
tags: [benchmarking, http, performance, api-bench]
draft: true
devto: false
---

Most API benchmarks are wrong in the same three ways. Not "a little off" wrong. Wrong in ways that make you ship the slower version.

## The three lies

**Averages.** A mean latency of 42 ms hides a p99 of 1.8 s. Users do not experience the mean. They experience the tail, and the tail is where your database pool exhausts and your retries stack.

**Warm caches.** Run one: 400 ms. Run two: 12 ms. Which number goes in the slide deck? If you did not decide *before* the run, you already know the answer.

**Single runs.** Any single measurement on a shared box is noise. You need the distribution, not the point.

## What Benchmarkr does about it

[Benchmarkr](https://benchmarkr-1.onrender.com/) (source: [api-bench](https://github.com/Mack-Overflow/api-bench)) is the tool I built so I would stop doing the above by accident.

- Concurrency is a flag, not a shell script full of `&` and `wait`.
- Every endpoint in a service is described once, in YAML, and benchmarked together.
- Results round-trip to a dashboard, so "is this faster than yesterday?" is a comparison, not a memory.
- It speaks MCP, so an agent can run the same benchmarks you do.

It installs like any other CLI and runs without a server:

```bash
brew tap mack-overflow/tap
brew install benchmarkr
benchmarkr run --url https://api.example.com/health
```

Or describe every endpoint in a YAML file next to your code and loop through all of them in CI.

## The uncomfortable part

The biggest change was not in the tool. It was writing the hypothesis down first. "I expect the indexed query to cut p95 by at least 30%." Then run. Then compare against *that*, not against whatever number looks best after the fact.

> A benchmark you cannot be wrong about is not a benchmark. It is marketing.

More on the internals, including how the histogram is bucketed and why I stopped using `Date.now()`, in a follow-up.
