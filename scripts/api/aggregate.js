const aggregate = require("./lib/aggregate");

const voting_id = process.argv[2];

aggregate(voting_id).then(res => {
  console.log(JSON.stringify(res));
});