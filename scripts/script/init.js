const IOST = require("@kunroku/iost");

const iost_config = require("../config/iost.json");
const { owner, accounts } = require("../config/account.json");

Object.assign(iost_config, { gasLimit: 1500000 })

async function main() {
  function sec2pub(secret_key_str) {
    const kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(secret_key_str));
    return IOST.Bs58.encode(kp.publicKey)
  }
  const publisher = new IOST.Account(owner.id);
  const publisher_kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(owner.secret_key));
  publisher.addKeyPair("active", publisher_kp);
  function signup(publisher, account) {
    return new Promise(function (resolve) {
      const iost = new IOST(iost_config);
      const id = account.id;
      const public_key_str = sec2pub(account.secret_key);
    
      const tx = iost.contract.auth.signUp(id, public_key_str, public_key_str);
      iost.contract.token.transfer("iost", publisher.id, id, "300000", "signup", tx);
      iost.contract.gas.pledge(publisher.id, id, 1000, tx);
      iost.contract.ram.buy(publisher.id, id, 1024, tx);
    
      iost.setPublisher(publisher);
      const handler = iost.signAndSend(tx);
      handler.listen();
      handler.onSuccess(resolve);
      handler.onFailed(resolve);
    });
  }
  const iost = new IOST(iost_config);
  const tx = iost.contract.gas.pledge(publisher.id, publisher.id, 20000);
  iost.contract.ram.buy(publisher.id, publisher.id, 1024**2, tx);
  
  iost.setPublisher(publisher);
  const handler = iost.signAndSend(tx);
  handler.listen();
  handler.onSuccess(console.log);
  handler.onFailed(console.log);
  // for (const account of accounts) {
  //   console.log(await signup(publisher, account));
  // }
}
main()
