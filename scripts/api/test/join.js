const voting = require("../lib/voting");
const { owner, accounts } = require("../../config/account.json");

// メンバーが1人増えると参加するための必要gasが185増える
// gas_usage
// 1 = 36335
// 501 = 128557
async function main() {
  for (const { id, secret_key } of accounts) {
    console.log(JSON.stringify(await voting(id, secret_key).join(`name_${id}`, `test_account`)));
  }
}
main();
