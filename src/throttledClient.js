const { createNanoEvents } = require("nanoevents");
const fetchData = require("./server");

const events = createNanoEvents();

const delay = (ms, ...data) =>
  new Promise((res) => setTimeout(res, ms, ...data));

module.exports.on = (id, cb) => events.on(id, cb);
module.exports.once = (id, cb) => {
  const unbind = events.on(id, (...args) => {
    unbind(); // instant unbind
    cb(...args);
  });
  return unbind;
};

let headers = {};
const headerThrottleKeys = Object.freeze(["calls", "time", "cpu"]);
function headersReducer(_headers) {
  return (map, k) => {
    if (headerThrottleKeys.indexOf(k) > -1) {
      map[k] = _headers[k];
    }
    return map;
  };
}

function emitEventsForResponse(response) {
  // console.log({ response });
  events.emit("response.headers", response.headers);
  events.emit("response.ok", response.ok);
  return response; // chainable
}

events.on("response.headers", (_headers) => {
  // filter for important headers, store for throttle logic
  // console.log({ _headers })
  headers = Object.keys(_headers).reduce(headersReducer(_headers), {});
});

// **********************

// Note: Much more advanced/statistical logic could happen here!
function isFetchThrottled(maxPercentage = 70) {
  if (!thunkStartedRecently) {
    return false;
  }
  // try to keep client calls below maxPercentage limit/capacity
  return Object.keys(headers).some((k) => headers[k] >= maxPercentage);
}

// **********************

// The purpose: On an interval basis, a thunk MUST be allowed to call API,
// and return with latest API limit status in headers,
// or else a dead-lock could happen.
let thunkStartedRecently = false;
function setThunkStartedRecently(val = true) {
  thunkStartedRecently = val;
}

let timerId;
module.exports.startTimer = function startTimer(intervalMs = 2000) {
  if (timerId !== undefined) return;

  timerId = setInterval(() => {
    if (thunkStartedRecently === false) return;
    console.log("THUNK FREE PASSTHU LOCK!");
    setThunkStartedRecently(false);
  }, intervalMs);
  // timerId.unref(); // this would make clearTimer() unneeded!

  return () => clearTimer();
};

module.exports.clearTimer = function clearTimer() {
  if (timerId === undefined) return;

  clearInterval(timerId);
  timerId = undefined;
};


// **********************

// Note: Can be an "unfair" thunk LOCK! Could lead to some bias/starvation.
// But at least all thunks keep trying, until eventaully done
async function waitForThunkThrottleLock() {
  let saltMs = Math.random() * 100;
  await delay(saltMs); // 0-100ms

  while (isFetchThrottled()) {
    console.log("THUNK: wait and check lock again...!");
    saltMs = Math.random() * 100;
    await delay(500 + saltMs); // 500-600ms
  }

  setThunkStartedRecently(true);
}

module.exports.fetcher = async function fetcher(...args) {
  // Note: `fetchData` could be substituted for another "fetcher" client wrapper
  // that return a fetch result, or whatever is prefered - just needs to align with
  // `emitEventsForResponse` API.
  const thunk = () => fetchData(...args);

  await waitForThunkThrottleLock();

  // Note: this would typically be an http/network/fetch request!
  // But it's just a "mock" Promisified response, for demo purposes
  const response = await thunk();

  return emitEventsForResponse(response);
};
