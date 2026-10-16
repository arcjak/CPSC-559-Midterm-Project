// Optional LOCAL GANACHE demo helper: advance cooldowns without changing contracts.
module.exports = async function (callback) {
  function rpc(method, params) {
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({ jsonrpc: "2.0", method, params, id: Date.now() }, (error, result) => {
        if (error || result.error) reject(error || new Error(result.error.message));
        else resolve(result.result);
      });
    });
  }
  try {
    const client = await web3.eth.getNodeInfo();
    if (!/ganache|testrpc/i.test(client) || Number(await web3.eth.net.getId()) !== 1337) throw new Error("This helper is only for local Ganache network 1337.");
    await rpc("evm_increaseTime", [86401]);
    await rpc("evm_mine", []);
    console.log("Ganache advanced one day. Click Show Zombies to refresh cooldowns.");
    callback();
  } catch (error) { callback(error); }
};
