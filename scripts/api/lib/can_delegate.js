const IOST = require("@kunroku/iost");
const { address } = require("../../config/contract.json");
const iost_config = require("../../config/iost.json");

async function can_delegate(voting_id, from, to) {
  const iost = new IOST(iost_config);
  const delegate_chain = [from];
  async function result_of(iost_id) {
    if (delegate_chain.indexOf(iost_id) !== -1)
      return false;
    delegate_chain.push(iost_id);
    const { data } = await iost.rpc.blockchain.getContractStorage(address, `vote.${voting_id}`, iost_id);
    if (data === "null")
      return true;
    if (typeof JSON.parse(data).to === "number")
      return true;
    return await result_of(JSON.parse(data).to);
  }
  return await result_of(to);
}
module.exports = can_delegate;