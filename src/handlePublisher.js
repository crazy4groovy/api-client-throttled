const client = require("./throttledClient");

module.exports = async (pubId) => {
  let cursor = null;
  let data = [];

  while (cursor !== undefined) {
    const result = await fetchOnePage(pubId, cursor);
    data = data.concat(result.data);
    cursor = result.cursor;
  }

  console.log("RESULTS: ", pubId, data.length);
  return data;
};

async function fetchOnePage(pubId, cursor) {
  const response = await client.fetcher(pubId, cursor);
  const json = await response.json();
  return { cursor: json.cursor, data: json.data };
}
