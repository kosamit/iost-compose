const IOST = require("@kunroku/iost");
const { owner, accounts } = require("../../config/account.json");
const { address } = require("../../config/contract.json");
const iost_config = require("../../config/iost.json");
Object.assign(iost_config, { gasLimit: 2000000 });

function sign_up(account) {
  return new Promise(function (resolve) {
    const new_id = account.id;
    const new_kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(account.secret_key));

    const iost = new IOST(iost_config);
    const publisher = new IOST.Account(owner.id);
    const kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(owner.secret_key));
    publisher.addKeyPair("active", kp);
    iost.setPublisher(publisher);

    const tx = iost.contract.auth.signUp(new_id, IOST.Bs58.encode(new_kp.publicKey), IOST.Bs58.encode(new_kp.publicKey));
    iost.contract.gas.pledge(owner.id, new_id, 1000, tx);
    iost.contract.ram.buy(owner.id, new_id, 1024, tx);

    const handler = iost.signAndSend(tx, false);
    handler.listen({ interval: 250, times: 100, irreversible: true });
    handler.onSuccess(res => {
      resolve(JSON.stringify({
        status: "success",
        secret_key: IOST.Bs58.encode(new_kp.secretKey)
      }));
    });
    handler.onFailed(res => {
      resolve(JSON.stringify({
        status: "failed",
        res
      }));
    });
  });
}
async function main() {
  for (const account of accounts) {
    const res = await sign_up(account);
    console.log(res);
  }
}
main();