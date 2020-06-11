const IOST = require("@kunroku/iost");
const log4js = require("log4js");
const { address } = require("../../config/contract.json");
const iost_config = require("../../config/iost.json");

log4js.configure({
  appenders: {
    logFile: { type: "file", filename: `${__dirname}/log/tx.log` }
  },
  categories: {
    default: { appenders: [ "logFile" ], level: "all" }
  }
});

const logger = log4js.getLogger("errLog");
// logger.level = "all";

function call(publisher_iost_id, secret_key, abi, args) {
  return new Promise(function (resolve) {
    try {
      const iost = new IOST(iost_config);
      const publisher = new IOST.Account(publisher_iost_id);
      const kp = new IOST.KeyPair.Ed25519(IOST.Bs58.decode(secret_key));
      publisher.addKeyPair("active", kp);
      iost.setPublisher(publisher);
      const tx = iost.call(address, abi, args);
      const handler = iost.signAndSend(tx, false);
      handler.listen({ interval: 250, times: 100, irreversible: true });
      handler.onSuccess(res => {
        logger.info(JSON.stringify(res));
        resolve({ status: "success", gas_usage: res.gas_usage });
      });
      handler.onFailed(res => {
        if (typeof res === "object")
          logger.error(JSON.stringify(res));
        else
          logger.error(res);
        if (res.message) {
          const error_code = Number(res.message.substr(res.message.indexOf("Uncaught exception: ERROR:") + 26, 4));
          if (!Number.isNaN(error_code)) 
            resolve({ status: "failed", error_code });
          else if (res.message.indexOf("prepare contract: contract") !== -1 && res.message.indexOf("not found"))
            resolve({ status: "failed", error_code: 1301 });
          else
            resolve({ status: "failed", error_code: 1399, message: res.message, tx_hash: res.tx_hash });
        } else {
          const tx_failed_msg = "send tx failed: Error: ";
          if (res.indexOf(tx_failed_msg) !== -1) {
            const verify_err_msg = "VerifyError publisher error";
            const gas_err_msg = "gas not enough";
            if (res.indexOf(verify_err_msg) !== -1)
              resolve({ status: "failed", error_code: 1401, message: res.message, tx_hash: res.tx_hash });
            else if (res.indexOf(gas_err_msg) !== -1)
              resolve({ status: "failed", error_code: 1402, message: res.message, tx_hash: res.tx_hash });
            else
              resolve({ status: "failed", error_code: 1499, message: res.message, tx_hash: res.tx_hash });
          }
        }
      });
    } catch (message) {
      logger.error(message);
      resolve({ status: "failed", error_code: 1599, message });
    }
  });
}
module.exports = call;