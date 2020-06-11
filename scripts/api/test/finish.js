const voting = require("../lib/voting");
const { owner, accounts } = require("../../config/account.json");
const voting_id = process.argv[2];
// gas_usage
// 493469
async function main(voting_id) {
  const tx_result = await voting(owner.id, owner.secret_key).finish(voting_id);
  console.log(tx_result.status);
  console.log(tx_result.res);
}
main(voting_id);