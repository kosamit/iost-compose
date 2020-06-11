const IOST = require("@kunroku/iost");
const fs = require("fs");

const iost_config = require("../config/iost.json");
const { owner } = require("../config/account.json");
const { name } = require("../config/contract.json");

function main() {
  const iost = new IOST(iost_config);

  const id = owner.id;
  const secret_key = owner.secret_key;
  const account = new IOST.Account(id);
  const kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(secret_key));
  account.addKeyPair('active', kp);
  iost.setPublisher(account);

  const source = fs.readFileSync(`contract/${name}.min.js`, "utf-8");
  const abi = JSON.parse(fs.readFileSync(`contract/${name}.js.abi`, "utf-8"));
  const tx = iost.contract.system.setCode(source, abi);

  const handler = iost.signAndSend(tx);
  handler.listen();
  handler.onPending(console.log);
  handler.onSuccess(res => {
    const address = JSON.parse(res.returns[0])[0];
    fs.writeFileSync("config/contract.json", JSON.stringify({ name, address }), "utf-8");
    console.log(res)
  });
  handler.onFailed(console.log);
}
main();
