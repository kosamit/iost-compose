const voting = require("./lib/voting");
const can_delegate = require("./lib/can_delegate");

const id = process.argv[2];
const secret_key = process.argv[3];
const voting_id = process.argv[4],
  target_id = process.argv[5];

can_delegate(voting_id, id, target_id).then(bool => {
  if (bool)
    voting(id, secret_key).delegate(voting_id, target_id).then(res => {
      console.log(JSON.stringify(res));
    });
  else
    console.log(JSON.stringify({ status: "failed", error_code: 1201 }));
});
