# API Promise Throttle

This repo is a demo of one approach to rate-limit repeated calls to an API with limits (Specifically: limits identified in the response headers, such as Facebook Graph API).

## index.js

This is the "main" method, that identifies the `pubIds` we want to scrape.

It calls into `handlePublisher.js`.

## handlePublisher.js

This handles a `pubId` by paginating over the server calls for data (until there is no more response cursor).

It calls into `throttledClient.js`.

## throttledClient.js

*This is the meat of this repo.* It implements a throttle strategy that reads the headers of previous responses to the API, to determine if enqueued requests should be sent or should wait and ask again later (like a lock). It also publishes every response result (eg. `headers`, `ok`) via a simple event emitter, to allow for processing by registered listeners (eg. analytics, logging, etc).

It calls into `server.js`.

## server.js

This is a MOCK http server like express. There is no actual HTTP call, or routing, etc. However it is Promise-based, has artificial delays, and returns a payload that mimiks a typcial `fetch` response. It tracks (inc/decr) various throttle/limit types for calling it, which is sends back as headers of each response.

## Module/Function Call Stack

```bash
index ==> handlePublisher ==> throttledClient ==> server
```
