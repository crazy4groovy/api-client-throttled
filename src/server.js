const delay = (ms, ...data) =>
  new Promise((res) => setTimeout(res, ms, ...data));
const { log } = console;

// create API LIMITS
const limits = {
  calls: 0,
  time: 0,
  cpu: 0,
};

// reduce API LIMITS (on a timer)
const timerId = setInterval(() => {
  limits.calls -= 2;
  limits.calls = Math.max(limits.calls, 0);
  limits.time /= 1.1;
  limits.cpu /= 1.2;
}, 1000);
timerId.unref();

// increase API LIMITS (per call)
// Note: arbitrary algorithm!
function incLimits() {
  limits.calls = limits.calls + 1;
  limits.time = Math.round(limits.time + Math.random() * 3);
  limits.cpu = Math.round(limits.cpu + Math.random() * 6);
  log("INC LIMIT %'s TO:", limits);
}

function checkCallLimitsExceeded() {
  if (Object.keys(limits).some((k) => limits[k] >= 100)) {
    throw new Error("Limit exceeded");
  }
}

module.exports = async (publisherId, cursor) => {
  console.log("SERVER", { publisherId, cursor });
  await delay(500);

  try {
    checkCallLimitsExceeded();
  } catch (err) {
    const fetchResponse = {
      ok: false, // Bad Caller! Bad!
      headers: limits,
      json: async () => ({ error: err.message }),
    };
    log("!!!!!SERVER ERROR: ", { publisherId, response: fetchResponse });
    await delay(5 * 1000);
    return fetchResponse;
  }

  incLimits();

  cursor = Math.random();

  const fetchResponse = {
    ok: true,
    headers: limits,
    json: async () => ({
      data: [Math.random() + publisherId],
      // each call has random 10% chance of ending the cursor pagination
      cursor: cursor > 0.1 ? cursor : undefined,
    }),
  };

  // log("SERVER", { response, publisherId });
  return fetchResponse;
};
