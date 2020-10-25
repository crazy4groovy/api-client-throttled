const handlePublisher = require("./handlePublisher");
const client = require("./throttledClient");

const publisherIds = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110];

let unbindEvtOn;

function setup() {
  client.startTimer();
  unbindEvtOn = client.on("response.ok", (ok) => {
    if (!ok)
      console.log("!!!!!!!SERVER ERROR!!!!!!!!!!!", new Date().toISOString());
  });
}

function tearDown() {
  client.clearTimer();
  unbindEvtOn();
}

(async function main() {
  setup();

  const data = await Promise.all(publisherIds.map((id) => handlePublisher(id)));

  console.log("ALL PUB DATA", data);

  tearDown();
})();
