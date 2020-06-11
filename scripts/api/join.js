const voting = require("./lib/voting");

const id = process.argv[2];
const secret_key = process.argv[3];
const name = process.argv[4],
  description = process.argv[5];


voting(id, secret_key).join(name, description).then(res => {
  console.log(JSON.stringify(res));
});