const IOST = require("@kunroku/iost");
const log4js = require("log4js");

log4js.configure({
  appenders: {
    logFile: { type: "file", filename: `${__dirname}/lib/log/tx.log` }
  },
  categories: {
    default: { appenders: [ "logFile" ], level: "all" }
  }
});
const logger = log4js.getLogger("errLog");

const { owner } = require("../config/account.json");

const new_id = process.argv[2];

const new_kp = IOST.KeyPair.Ed25519.randomKeyPair();

const iost = new IOST();
const publisher = new IOST.Account(owner.id);
const kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(owner.secret_key));
publisher.addKeyPair("active", kp);
iost.setPublisher(publisher);

const tx = iost.contract.auth.signUp(new_id, IOST.Bs58.encode(new_kp.publicKey), IOST.Bs58.encode(new_kp.publicKey));
iost.contract.gas.pledge(owner.id, new_id, 1000, tx);
iost.contract.ram.buy(owner.id, new_id, 1024, tx);

const handler = iost.signAndSend(tx);
handler.listen({ interval: 250, times: 100, irreversible: true });
handler.onSuccess(res => {
  logger.info(JSON.stringify(res));
  console.log(JSON.stringify({
    status: "success",
    secret_key: IOST.Bs58.encode(new_kp.secretKey)
  }));
});
handler.onFailed(res => {
  if (typeof res === "object")
    logger.error(JSON.stringify(res));
  else
    logger.error(res);
  if (res.message) {
    if (res.message.indexOf("id existed") !== -1) {
      console.log(JSON.stringify({
        status: "failed",
        error_code: 1201
      }));
    } else {
      console.log(JSON.stringify({
        status: "failed",
        error_code: 1299
      }));
    }
  } else {
    if (res.message) {
      const error_code = Number(res.message.substr(res.message.indexOf("Uncaught exception: ERROR:") + 26, 4));
      if (!Number.isNaN(error_code)) 
        console.log(JSON.stringify({ status: "failed", error_code }));
      else if (res.message.indexOf("prepare contract: contract") !== -1 && res.message.indexOf("not found"))
        console.log(JSON.stringify({ status: "failed", error_code: 1301 }));
      else
        console.log(JSON.stringify({ status: "failed", error_code: 1399, message: res.message, tx_hash: res.tx_hash }));
    } else {
      const tx_failed_msg = "send tx failed: Error: ";
      if (res.indexOf(tx_failed_msg) !== -1) {
        const verify_err_msg = "VerifyError publisher error";
        const gas_err_msg = "gas not enough";
        if (res.indexOf(verify_err_msg) !== -1)
          console.log(JSON.stringify({ status: "failed", error_code: 1401 }));
        else if (res.indexOf(gas_err_msg) !== -1)
          console.log(JSON.stringify({ status: "failed", error_code: 1402 }));
        else
          console.log(JSON.stringify({ status: "failed", error_code: 1499, message: res.message, tx_hash: res.tx_hash }));
      } else {
        console.log({ status: "failed", error_code: 1699, message: res.message, tx_hash: res.tx_hash });
      }
    }
}
});
