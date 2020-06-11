const voting = require("./lib/voting");

const id = process.argv[2];
const secret_key = process.argv[3];
const target_iost_id = process.argv[4];

voting(id, secret_key).add_admin(target_iost_id).then(res => {
  console.log(JSON.stringify(res));
});