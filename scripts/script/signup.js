const IOST = require("@kunroku/iost");
const fs = require("fs");

const iost_config = require("../config/iost.json");
const { owner, accounts } = require("../config/account.json");

async function signup(new_id) {
  await new Promise(function (resolve) {
    const iost = new IOST(iost_config);

    const id = owner.id;
    const secret_key = owner.secret_key;
    const publisher = new IOST.Account(id);
    const kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(secret_key));
    publisher.addKeyPair('active', kp);
    iost.setPublisher(publisher);
  
    const new_kp = IOST.KeyPair.Ed25519.randomKeyPair();
    const secret_key_str = IOST.Bs58.encode(Buffer.from(new_kp.secretKey));
    const public_key_str = IOST.Bs58.encode(Buffer.from(new_kp.publicKey));
    const tx = iost.contract.auth.signUp(new_id, public_key_str, public_key_str);
    iost.contract.token.transfer("iost", publisher.id, new_id, "300000", "signup", tx);
    iost.contract.gas.pledge(publisher.id, new_id, 1000, tx);
    iost.contract.ram.buy(publisher.id, id, 1024, tx);

    const handler = iost.signAndSend(tx);
    handler.listen();
    handler.onSuccess(res => {
      accounts.push({ id: new_id, secret_key: secret_key_str });
      fs.writeFileSync("config/account.json", JSON.stringify({ owner, accounts }), "utf-8");
      console.log(res);
      resolve();
    });
    handler.onFailed(res => {
      console.log(res);
      resolve();
    });
  });
}
signup(process.argv[2]);
