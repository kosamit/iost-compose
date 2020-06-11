const voting = require("./lib/voting");

const id = process.argv[2];
const secret_key = process.argv[3];
const voting_id = process.argv[4],
  index = Number(process.argv[5]);

voting(id, secret_key).vote(voting_id, index).then(res => {
  console.log(JSON.stringify(res));
});