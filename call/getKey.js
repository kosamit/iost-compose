// let nacl = require('tweetnacl');
let bs58 = require('bs58');
const { SHA3 } = require('sha3');
const hash = new SHA3(256);
hash.update(JSON.stringify({ [process.argv[2]]: process.argv[3] }));
console.log(bs58.encode(Buffer.from(hash.digest())));