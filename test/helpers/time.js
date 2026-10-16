// Ganache-only test helper. Wait for both RPC calls before returning.
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send({ jsonrpc: "2.0", method, params, id: Date.now() }, (error, result) => {
      if (error || result.error) reject(error || new Error(result.error.message));
      else resolve(result.result);
    });
  });
}
async function increase(seconds) {
  await rpc("evm_increaseTime", [seconds]);
  await rpc("evm_mine", []);
}
const duration = { days: value => value * 86400 };
module.exports = { increase, duration };
