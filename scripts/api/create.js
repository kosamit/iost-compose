const voting = require("./lib/voting");

const id = process.argv[2];
const secret_key = process.argv[3];
const voting_id = process.argv[4],
  begin = Number(process.argv[5]),
  end = Number(process.argv[6]),
  selection_list = JSON.parse(process.argv[7]),
  voter_turnout = Number(process.argv[8]),
  approval_rate = Number(process.argv[9]),
  deny_rate = Number(process.argv[10]);

voting(id, secret_key).create(voting_id, begin, end, selection_list, voter_turnout, approval_rate, deny_rate).then(res => {
  console.log(JSON.stringify(res));
});
