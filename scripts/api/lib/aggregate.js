const IOST = require("@kunroku/iost");
const { address } = require("../../config/contract.json");
const iost_config = require("../../config/iost.json");

module.exports = async (voting_id) => {
  const iost = new IOST(iost_config);
  const { data } = await iost.rpc.blockchain.getContractStorage(address, "voting", voting_id);
  if (data == "null")
    return { status: "failed", error_code: 1007 };
    // throw `invalid_voting_id: ${voting_id}`;
  const voting = JSON.parse(data);
  if (voting.finish === undefined)
    return { status: "failed", error_code: 1014 };
    // throw `voting_not_finished: ${voting_id}`;
  const finish_tx_receipts = await iost.rpc.transaction.getTxReceiptByTxHash(voting.finish);
  const create_tx_receipts = await iost.rpc.transaction.getTxReceiptByTxHash(voting.create);
  for (const finish_receipt of finish_tx_receipts.receipts) {
    if (finish_receipt.func_name === `${address}/finish`) {
      for (const create_receipt of create_tx_receipts.receipts) {
        if (create_receipt.func_name === `${address}/create`) {
          const vote_to = JSON.parse(finish_receipt.content);
          const rule = JSON.parse(create_receipt.content);
          const voter_length = vote_to["#length"];
          delete vote_to["#length"];
          const result = {};
          const invalid_voter_list = [];
          const amount = Array(rule.selection_list.length).fill(0);
          const voter_turnout = Object.keys(vote_to).length / voter_length;
          result.voter_turnout = voter_turnout;
          result.voter_turnout_clear = rule.voter_turnout < voter_turnout;

          function result_of(voter, delegate_chain) {
            if (delegate_chain.indexOf(voter) !== -1)
              return undefined;
            delegate_chain.push(voter);
            if (typeof vote_to[voter] === "number") {
              return vote_to[voter];
            } else if (typeof vote_to[voter] === "string") {
              vote_to[voter] = result_of(vote_to[voter], delegate_chain);
              return vote_to[voter];
            } else {
              return undefined;
            }
          }
          for (const voter of Object.keys(vote_to)) {
            result_of(voter, []);
            if (typeof vote_to[voter] !== "number")
              invalid_voter_list.push(voter);
            else
              amount[vote_to[voter]]++;
          }
          const most_supported = [];
          const approval_rate_list = amount.map((num, index)=> {
            const approval_rate = num / voter_length;
            if (Math.max(...amount) === num) {
              result.approval_rate = approval_rate;
              result.approval_rate_clear = rule.approval_rate <= approval_rate;
              most_supported.push(index);
            }
            return approval_rate;
          });
          result.approval_rate_list = approval_rate_list;
          if (rule.selection_list.length === 2) {
            result.deny_rate = approval_rate_list[1];
            result.deny_rate_clear = approval_rate_list[1] < rule.config.deny_rate;
          }
          result.invalid_voter_list = invalid_voter_list;
          result.amount = amount;
          result.most_supported = most_supported;
          if ((result.voter_turnout_clear) && (result.approval_rate_clear) && ((result.deny_rate === undefined) || (result.deny_rate_clear))) {
            if (most_supported.length === 0)
              result.decision = rule.selection_list[most_supported[0]];
          }
          return { status: "success", rule, result };
        }
      }
    }
  }
}