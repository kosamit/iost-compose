const voting = require("../lib/voting");
const can_delegate = require("../lib/can_delegate");
const { owner, accounts } = require("../../config/account.json");

function gen_random(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// gas_usage
// vote = 35899 or 35901
// delegate = 35464
async function main(voting_id) {
  console.log(voting_id);
  console.log((await voting(owner.id, owner.secret_key).create(voting_id, (new Date().getTime() + 1000) * 1e6, (new Date().getTime() + accounts.length * 550) * 1e6, ["yes","no"], 0.7, 0.5, 0.3)).res.receipts);
  await sleep(1500);
  for (const { id, secret_key } of accounts) {
    const random = gen_random(3);
    if (random === 2) {
      const index = gen_random(100);
      const to = accounts[index].id;
      if (await can_delegate(voting_id, id, to)) {
        const result = await voting(id, secret_key).delegate(voting_id, to);
        console.log(`${id} => ${to}: ${result.status}, gas: ${result.res.gas_usage}`);  
      } else {
        console.log(`${id} => ${to}: failed (cannot_delegate)`);
      }
    } else {
      const to = random;
      const result = await voting(id, secret_key).vote(voting_id, to);
      console.log(`${id} => ${to}: ${result.status}, gas: ${result.res.gas_usage}`);
    }
  }
  console.log(voting_id);
}
main(`tvid_${("00000000" + gen_random(1e8)).slice(-8)}`);
