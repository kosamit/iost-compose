const readlineSync = require('readline-sync');
const fs = require('fs');
const IOST = require('iost');
const bs58 = require('bs58');

const account_info = require('./account.json');
const contract_info = require('./cname.json');
const rpc_config = require('./rpc_config.json');

let account_id = process.argv[2];
let contract_name = process.argv[3];

if (account_info[account_id] === undefined) {
    throw new Error('invalid publisher')
}
if (contract_info[contract_name] === undefined) {
    throw new Error('invalid contract_name')
}
let dir = '../contracts/'.concat(contract_name);
let abiFile = fs.readFileSync(dir.concat('.js.abi'), 'utf8');
if (typeof abiFile !== 'string') {
    throw new Error('invalid abi file')
}
const info = JSON.parse(abiFile);
console.log('[selection]')
info.abi.forEach(abiInfo => {
    process.stdout.write(`${abiInfo.name} `)
})
console.log('');
// 呼び出すメソッドの読み取り
let action = readlineSync.question('action? ');
info.abi.forEach(abiInfo => {
    if (abiInfo.name === action) {
        let args = [];
        console.log(`[args length require: ${abiInfo.args.length}]`);
        for (let i = 0; i < abiInfo.args.length; i++) {
            let arg = readlineSync.question(`arg ${i}? `);
            if (abiInfo.args[i] === 'string') args.push(arg);
            else args.push(Number(arg));
        }
        let secretkey = account_info[account_id];
        console.log(`contract_id: ${contract_info[contract_name]}`);
        console.log(`account_id: ${account_id}`);
        console.log(`secret_key: ${secretkey}`);
        console.log(`action: ${action}`);
        console.log(`args: ${args}`);
        let iostConfig = {
            gasRatio: 1,
            gasLimit: 2000000,
            delay: 0,
            expiration: 90,
        }
        // generate account object
        const account = new IOST.Account(account_id);
        const kp = new IOST.KeyPair(bs58.decode(secretkey));
        account.addKeyPair(kp, 'owner');
        account.addKeyPair(kp, 'active');
        // create tx object
        // const tx = new IOST.Tx(iostConfig.gasRatio, iostConfig.gasLimit);
        // tx.addAction(contract_info[contract_name], action, JSON.stringify(args));
        // tx.setTime(iostConfig.expiration, iostConfig.delay, 0);
        let iost = new IOST.IOST(iostConfig);
        let tx = iost.callABI(contract_info[contract_name], action, args);
        tx.setChainID(rpc_config["chain_id"]);
        account.signTx(tx);
        // create handler
        const iostRPC = new IOST.RPC(new IOST.HTTPProvider(rpc_config["url"]));
        const handler = new IOST.TxHandler(tx, iostRPC);
        console.log(tx)
        // send tx
        handler.send().listen(300, 15);
        handler.onPending(response => {
            console.log('pending')
            console.log(response)
        })
        handler.onSuccess(response => {
            console.log(response)
            console.log(`return: ${JSON.parse(response.returns[0])[0]}`)
        })
        handler.onFailed(response => {
            console.log('failed')
            console.log(response)
        })
    }
})
