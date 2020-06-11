const aggregate = require("../lib/aggregate");
const voting_id = process.argv[2];

async function main(voting_id) {
  const result = await aggregate(voting_id);
  console.log(result);
}
main(voting_id);