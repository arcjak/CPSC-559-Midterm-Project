# Starter audit — completed before edits

## Structure and configuration

- `contracts/`: nine Solidity files plus an unused JavaScript migration referencing nonexistent CryptoZombies.sol.
- `migrations/`: Migrations deployment and deployments for all zombie layers plus SafeMath.
- `test/`: older CryptoZombies tests and two helper modules.
- Root: index.html with inline JS, cryptozombies_abi.js, local web3.min.js, favicon.ico, package.json/package-lock.json, truffle-config.js. No README, CSS directory, avatars, framework, or compiled artifacts initially.
- package.json declared browser-sync `^2.27.7`, openzeppelin-solidity `^4.4.1`, truffle-hdwallet-provider `^1.0.17`, and web3 `^1.6.1`. Lockfile direct versions: 2.27.7, 4.4.1, 1.0.17, and 1.6.1 respectively. No functional npm test script, local Truffle dependency, or frontend start script.
- Compiler: solc **0.4.25**. Eight source files use `^0.4.25`; Migrations permits `>=0.4.22 <0.9.0`.
- Development RPC: `127.0.0.1:7545`, network ID `1337`.

## Contracts and inheritance

```text
Ownable + SafeMath libraries
  └─ ZombieFactory
       └─ ZombieFeeding (KittyInterface)
            └─ ZombieHelper
                 └─ ZombieAttack
                      └─ ZombieOwnership + ERC721
Migrations (independent)
```

SafeMath/SafeMath32/SafeMath16 are local arithmetic libraries. Ownable implements contract administration. ERC721 is an older partial abstract interface.

| Contract | Confirmed functions/state |
| --- | --- |
| ZombieFactory | `createRandomZombie`, `zombies`, `zombieToOwner`, NewZombie event; internal DNA generation and creation |
| ZombieFeeding | `feedOnKitty`, `setKittyContractAddress`; internal multiplication and one-day cooldown; external KittyInterface dependency |
| ZombieHelper | `getZombiesByOwner`, payable `levelUp`, `setLevelUpFee`, `changeName`, `changeDna`, `withdraw` |
| ZombieAttack | `attack`; timestamp/sender/nonce randomness; victory levels up and multiplies |
| ZombieOwnership | `balanceOf`, `ownerOf`, `transferFrom`, `approve`; Transfer and Approval events |
| Ownable | `owner`, `isOwner`, `transferOwnership`, `renounceOwnership` |

There is **no `safeTransferFrom`, `getAllZombies`, or `AttackResult` event** in the source. The handwritten ABI incorrectly includes the latter two and disagrees with event indexing. The frontend's final target is ZombieOwnership, not an intermediate deployment.

## Existing frontend and baseline

The starter uses CDN jQuery 3.3.1 and CDN Web3 1.2.7-rc.0. The unused local Web3 bundle was separately verified as **1.2.7-rc.0**. Inline JS instantiates the handwritten ABI at a fixed ownership address, calls `ethereum.enable()`, reloads on wallet events, and subscribes to incoming Transfer events. It has raw unordered-list zombie output and three buttons.

Confirmed problems:

- Show Zombies logic can call the existing getters, but relies on wallet/deployment alignment; no deployed artifacts existed initially.
- Create Zombie passes the account address as the zombie name.
- Level Up receives an entire array from `getZombiesByOwner`, rather than a selected ID.
- Unconditional `ethereum.on` throws without MetaMask; denied access is silently ignored.
- Stale ABI and fixed deployment address can silently mismatch source/network.
- HTTP wallet subscriptions are less reliable than explicit refresh for this demo.
- Tests require nonexistent `CryptoZombies`; the old battle test asserts the previous creation receipt instead of battle state; time helper does not reliably await RPC callbacks.
- Approved transfer subtracts from `msg.sender` instead of `_from`. Approval is not cleared on transfer. `_from` and zero recipient are not validated.

The original contracts compiled successfully with solc 0.4.25 and both original migrations deployed successfully on Ganache network 1337 **before feature implementation**. Original frontend behavior was not claimed to be working end to end with real MetaMask.

## Improvement feasibility

All eight requested UI improvements can use existing contract methods. No new Solidity methods or upgrade is necessary. Safe transfers, a public fee getter, stronger randomness, a new battle event, or a local kitty mock would require Solidity changes and are outside the selected scope. Only transfer correctness was changed, with regression coverage; inheritance, battle rules, compiler, migrations, and dependency declarations were preserved.
