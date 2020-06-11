const IOST = require("@kunroku/iost");
const fs = require("fs");

const iost_config = require("../config/iost.json");
const { owner } = require("../config/account.json");
const { name, address } = require("../config/contract.json");
Object.assign(iost_config, { "gasLimit": 4000000 });

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
  const tx = iost.contract.system.updateCode(source, abi, address, "");

  const handler = iost.signAndSend(tx);
  handler.listen();
  handler.onPending(console.log);
  handler.onSuccess(console.log);
  handler.onFailed(console.log)
}
main()
