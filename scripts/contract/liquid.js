const _min_voter_turnout = 0;
const _min_approval_rate = 0;
const _max_voter_turnout = 100;
const _max_approval_rate = 100;
const _min_voting_time_range_to_begin = 0;
const _min_voting_time_range_to_end = 10 * 1e9;
const _max_voting_time_range_to_begin = 7 * 24 * 60 * 60 * 1e9;
const _max_voting_time_range_to_end = 7 * 24 * 60 * 60 * 1e9;

// function assert_valid_account_name(account_name) {
//   if (account_name.length < 5 || 30 < account_name.length)
//     throw `accuont_id_length_should_be_between_5_and_30: ${account_name.length}`;
//   for (const ch of account_name)
//     if (!('a' <= ch && ch <= 'z' || '0' <= ch && ch <= '9' || ch === '_'))
//       throw `invalid_char: ${ch}`;
// }
function assert_valid_voting_id(voting_id) {
  if (voting_id.length < 5 || 30 < voting_id.length)
    throw "ERROR:1101";
    // throw `voting_id_length_should_be_between_5_and_30: ${voting_id.length}`;
  for (const ch of voting_id)
    if (!('a' <= ch && ch <= 'z' || '0' <= ch && ch <= '9' || ch === '_'))
      throw "ERROR:1102";
      // throw `invalid_char: ${ch}`;
}
function assert_valid_rule(voter_turnout, approval_rate) {
  if (voter_turnout < _min_voter_turnout || _max_voter_turnout < voter_turnout)
    throw "ERROR:1103";
    // throw `voter_turnout_should_be_between_${_min_voter_turnout}_and_${_max_voter_turnout}: ${voter_turnout}`;
  if (approval_rate < _min_approval_rate || _max_approval_rate < approval_rate)
    throw "ERROR:1104";
    // throw `approval_rate_should_be_between_${_min_approval_rate}_and_${_max_approval_rate}: ${approval_rate}`;
}
function assert_valid_time(begin, end) {
  const time_diff_to_begin = begin - block.time;
  const time_diff_to_end = end - begin;
  if (time_diff_to_begin < _min_voting_time_range_to_begin || _max_voting_time_range_to_begin < time_diff_to_begin)
    throw "ERROR:1105";
    // throw `voting_time_to_begin_should_be_between_${_min_voting_time_range_to_begin}_and_${_max_voting_time_range_to_begin}: ${time_diff_to_begin}`;
  if (time_diff_to_end < _min_voting_time_range_to_end || _max_voting_time_range_to_end < time_diff_to_end)
    throw "ERROR:1106";
    // throw `voting_time_to_end_should_be_between_${_min_voting_time_range_to_end}_and_${_max_voting_time_range_to_end}: ${time_diff_to_end}`;
}
// function assert_valid_iost_account(iost_id) {
//   if (iost_id.startsWith("Contract"))
//     throw `contract_id: ${iost_id}`;
//   if (!storage.globalMapHas('auth.iost', 'auth', iost_id))
//     throw `account_not_exists: ${iost_id}`;
// }

class Liquid {
  init() {
    storage.put("error", JSON.stringify({
      "1001": "投票者として既に登録されているname",
      "1002": "投票者として既に登録されているiost_id",
      "1003": "投票者として登録されていないアカウントからのトランザクション",
      "1004": "Adminとして登録されているアカウントからのトランザクションが要求されている",
      "1005": "対象がAdminとして登録されていることが要求されている",
      "1006": "投票作成時に，既に使われているvoting_idを使おうとした",
      "1007": "投票が作成されていない",
      "1008": "既に終了した投票",
      "1009": "直接投票の選択肢インデックスが無効な値",
      "1010": "投票の開始時間がまだ来ていない",
      "1011": "投票の終了時間を超えている",
      "1012": "Delegate先として指定したiost_idが投票者として登録されていない",
      "1013": "投票の終了時間がまだ来ていない",
      "1101": "voting_idが長すぎる若しくは短すぎる(5-30)",
      "1102": "voting_idに無効な文字列が含まれている(a-z,0-9,_)",
      "1103": "最低参加率が指定範囲を超えている(0-100)",
      "1104": "最低賛成率が指定範囲を超えている(0-100)",
      "1105": "投票の作成から開始時間までの指定が無効な値(0秒-7日)",
      "1106": "投票の開始から終了までの時間の指定が無効(10秒-7日)"
    }));
    storage.mapPut("voting", "#running", JSON.stringify([]));
    storage.mapPut("voting", "#finished", JSON.stringify([]));
    storage.mapPut("account", tx.publisher, tx.hash);
    storage.mapPut("admin", tx.publisher, tx.hash);
    storage.put("account_list", JSON.stringify([tx.publisher]));
  }
  can_update(data) {
    return blockchain.requireAuth(blockchain.contractOwner(), "active");
  }
  // member api
  // /**
  //  * 
  //  * @param {string} iost_id 
  //  */
  // invite(iost_id) {
  //   assert_valid_iost_account(iost_id);
  //   if (!storage.mapHas("admin", tx.publisher))
  //     throw `not_admin: ${tx.publisher}`;
  //   if (storage.mapHas("account", iost_id))
  //     throw `already_joined_${iost_id}`;
  //   if (storage.mapHas("invited_account", iost_id))
  //     throw `already_invited_${iost_id}`;
  //   storage.mapPut("invited_account", iost_id, tx.hash);
  // }
  /**
   * 
   * @param {string} name
   * @param {string} description 
   */
  join(name, description) {
    // assert_valid_account_name(name);
    // if (!storage.mapHas("invited_account", tx.publisher))
    //   throw `not_invited: ${tx.publisher}`;
    if (storage.mapHas("iost_id", name))
      throw "ERROR:1001";
      // throw `account_name_already_in_used: ${name}`;
    if (storage.mapHas("name", tx.publisher))
      throw "ERROR:1002";
      // throw `account_already_registered: ${tx.publisher}`;
    const account_list = JSON.parse(storage.get("account_list"));
    account_list.push(tx.publisher);
    storage.put("account_list", JSON.stringify(account_list));
    storage.mapPut("account", tx.publisher, tx.hash);
    storage.mapPut("iost_id", name, tx.publisher);
    storage.mapPut("name", tx.publisher, name);
    // storage.mapDel("invited_account", tx.publisher);
    blockchain.receipt(description);
  }
  /**
   * 
   */
  quit() {
    if (!storage.mapHas("account", tx.publisher))
      throw "ERROR:1003";
      // throw `not_joined: ${tx.publisher}`;
    const name = storage.mapGet("name", tx.publisher);
    const account_list = JSON.parse(storage.get("account_list"));
    account_list.splice(account_list.indexOf(tx.publisher), 1);
    storage.put("account_list", JSON.stringify(account_list));
    storage.mapDel("account", tx.publisher);
    storage.mapDel("name", tx.publisher);
    storage.mapDel("iost_id", name);
    storage.mapDel("admin", tx.publisher);
    const running = JSON.parse(storage.mapGet("voting", "#running"));
    for (const voting_id in running)
      storage.mapDel(`vote.${voting_id}`, tx.publisher);
  }
  /**
   * 
   * @param {string} iost_id 
   */
  add_admin(iost_id) {
    if (!storage.mapHas("account", iost_id))
      throw "ERROR:1003";
    if (!storage.mapHas("admin", tx.publisher))
      throw "ERROR:1004";
    if (storage.mapHas("admin", iost_id))
      throw "ERROR:1005";
    storage.mapPut("admin", iost_id, tx.hash);
  }
  /**
   * 
   * @param {string} iost_id 
   */
  remove_admin(iost_id) {
    if (!storage.mapHas("admin", tx.publisher))
      throw "ERROR:1004";
    if (!storage.mapHas("admin", iost_id))
      throw "ERROR:1005";
    storage.mapDel("admin", iost_id);
  }
  // voting api
  /**
   * 
   * @param {string} voting_id 
   * @param {number} begin 
   * @param {number} end 
   * @param {string} selection_list
   * @param {string} voter_turnout 
   * @param {string} approval_rate 
   * @param {string} config 
   */
  create(voting_id, begin, end, selection_list, voter_turnout, approval_rate, config) {
    if (!storage.mapHas("admin", tx.publisher))
      throw "ERROR:1004";
    if (storage.mapHas("voting", voting_id))
      throw "ERROR:1006";
    selection_list = JSON.parse(selection_list);
    voter_turnout = Number(voter_turnout);
    approval_rate = Number(approval_rate);
    config = JSON.parse(config);
    assert_valid_time(begin, end);
    assert_valid_rule(voter_turnout, approval_rate);
    const running = JSON.parse(storage.mapGet("voting", "#running"));
    running.push(voting_id);
    storage.mapPut("voting", "#running", JSON.stringify(running));
    storage.mapPut("voting", voting_id, JSON.stringify({ begin, end, selection_length: selection_list.length, create: tx.hash }));
    blockchain.receipt(JSON.stringify({ selection_list, voter_turnout, approval_rate, config }));
  }
  /**
   * 
   * @param {string} voting_id 
   * @param {number} to 
   */
  vote(voting_id, to) {
    assert_valid_voting_id(voting_id);
    if (!storage.mapHas("account", tx.publisher))
      throw "ERROR:1004";
    const voting = JSON.parse(storage.mapGet("voting", voting_id));
    if (voting === null)
      throw "ERROR:1007";
    if (voting.finish !== undefined)
      throw "ERROR:1008";
    if (voting.selection_length - 1 < to)
      throw "ERROR:1009";
    if (block.time < voting.begin)
      throw "ERROR:1010";
    if (voting.end < block.time)
      throw "ERROR:1011";
    storage.mapPut(`vote.${voting_id}`, tx.publisher, JSON.stringify({ to }));
  }
  /**
   * 
   * @param {string} voting_id 
   * @param {string} to 
   */
  delegate(voting_id, to) {
    if (!storage.mapHas("account", tx.publisher))
      throw "ERROR:1003";
    if (!storage.mapHas("account", to))
      throw "ERROR:1012";
    const voting = JSON.parse(storage.mapGet("voting", voting_id));
    if (voting === null)
      throw "ERROR:1007";
    if (voting.finish !== undefined)
      throw "ERROR:1008";
    if (block.time < voting.begin)
      throw "ERROR:1010";
    if (voting.end < block.time)
      throw "ERROR:1011";
    storage.mapPut(`vote.${voting_id}`, tx.publisher, JSON.stringify({ to }));
  }
  /**
   * 
   * @param {string} voting_id 
   */
  finish(voting_id) {
    if (!storage.mapHas("admin", tx.publisher))
      throw "ERROR:1004";
    const voting = JSON.parse(storage.mapGet("voting", voting_id));
    if (voting === null)
      throw "ERROR:1007";
    if (voting.finish !== undefined)
      throw "ERROR:1008";
    if (block.time < voting.end)
      throw "ERROR:1013";
    const vote_to = {};
    const account_list = JSON.parse(storage.get("account_list"));
    for (const id of account_list) {
      const vote_data = JSON.parse(storage.mapGet(`vote.${voting_id}`, id));
      if (vote_data !== null) {
        vote_to[id] = vote_data.to;
        storage.mapDel(`vote.${voting_id}`, id);  
      }
    }
    vote_to["#length"] = account_list.length;
    const running = JSON.parse(storage.mapGet("voting", "#running"));
    const finished = JSON.parse(storage.mapGet("voting", "#finished"));
    running.splice(running.indexOf(voting_id), 1);
    finished.push(voting_id);
    storage.mapPut("voting", "#running", JSON.stringify(running));
    storage.mapPut("voting", "#finished", JSON.stringify(finished));
    storage.mapPut("voting", voting_id, JSON.stringify({ create: voting.create, finish: tx.hash }));
    blockchain.receipt(JSON.stringify(vote_to));
  }
}
module.exports = Liquid;