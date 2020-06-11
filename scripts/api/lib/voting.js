const call = require("./async_call");
module.exports = (publisher_iost_id, secret_key) => {
  return {
    // invite(iost_id) {
    //   return call(publisher_iost_id, secret_key, "invite", [iost_id]);
    // },
    join(name, description) {
      return call(publisher_iost_id, secret_key, "join", [name, description]);
    },
    add_admin(target_iost_id) {
      return call(publisher_iost_id, secret_key, "add_admin", [target_iost_id]);
    },
    create(voting_id, begin, end, selection_list, voter_turnout, approval_rate, deny_rate = undefined) {
      return call(publisher_iost_id, secret_key, "create", [voting_id, begin, end, JSON.stringify(selection_list), String(voter_turnout), String(approval_rate), JSON.stringify({ deny_rate })]);
    },
    vote(voting_id, index) {
      return call(publisher_iost_id, secret_key, "vote", [voting_id, index]);
    },
    delegate(voting_id, iost_id) {
      return call(publisher_iost_id, secret_key, "delegate", [voting_id, iost_id]);
    },
    finish(voting_id) {
      return call(publisher_iost_id, secret_key, "finish", [voting_id]);
    }
  }
}
