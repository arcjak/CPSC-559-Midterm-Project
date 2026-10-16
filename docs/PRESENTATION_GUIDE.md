# CryptoZombies presentation guide

## Main explanation

“We extended the provided CryptoZombies starter into a usable local game dashboard. We preserved the contract inheritance and existing game rules, connected more contract functions to the frontend, replaced hard-coded deployment information, and improved wallet and transaction handling.”

The six clearest improvements to demonstrate are the dashboard, zombie cards/multiple ownership, DNA avatars, dynamic contract discovery, transfers, and battles. Named creation, wallet lifecycle handling, and TypeScript are additional changes. The instructor determines whether improvements receive separate credit.

The starter already contained creation, level-up, ownership lookup, transfer, approval, and attack functions. Explain that the new transfer and battle interfaces expose existing blockchain functionality. The original getter already supported multiple owned zombies; the improvement is the structured army display and its integration with battles and transfers.

## Architecture to explain in 30 seconds

```text
index.html + css/style.css
          |
          v
src/app.ts --TypeScript compiler--> js/app.js (browser script)
                                      |
                                      v
                             Web3 + MetaMask provider
                                      |
                                      v
                        Ganache RPC 127.0.0.1:7545
                                      |
                                      v
                               ZombieOwnership
```

ZombieOwnership inherits ZombieAttack → ZombieHelper → ZombieFeeding → ZombieFactory → Ownable, plus the starter's partial ERC721 interface. This is why one deployed frontend contract exposes both gameplay and ownership methods.

The local HTTP server serves the files. Port 3000 is the website; port 7545 is the blockchain RPC. Running on localhost is not itself one of the improvements.

## 1. Redesigned dashboard

**Code:** `index.html`, especially the wallet section, collection, creation/battle forms, and `zombieTemplate`; `css/style.css` for layout, colors, card styles, and media queries.

**Before:** a bare page with three buttons and unordered lists.

**After:** a responsive dashboard with account/network/contract information, action forms, cards, empty states, and a shared transaction status area.

**Show:** the interface, then reduce browser width to show the responsive layout.

**Say:** “We separated markup, styling, and application logic. The dashboard makes wallet status and game actions visible without adding a frontend framework.”

## 2. Zombie army cards

**Code:** `src/app.ts`, `loadArmy()` around line 148 and `renderCard()` around line 176; `index.html`, `zombieTemplate` around line 40.

The loader reads the active account's owned IDs:

```ts
const ids: string[] = await instance.methods.getZombiesByOwner(owner).call();
```

It then calls `zombies(id)` for every ID, using `Promise.all` to fetch independent data together. `renderCard()` clones the HTML template and fills its name, ID, DNA, level, wins, losses, and ready status. Readiness is compared with the latest loaded blockchain timestamp.

**Show:** Account B displaying both its original zombie and the transferred zombie. Switching back to A should show its remaining child.

**Say:** “Ownership and stats come from contract reads. We render a card for every owned ID and reload after confirmed transactions.”

## 3. DNA-based avatars

**Code:** `src/app.ts`, `avatar()` around line 168.

DNA remains a string. The function selects numeric sections of that string and uses modulo operations to choose SVG characteristics:

```ts
const digits = String(dna).padStart(16, "0");
const part = (i: number): number => parseInt(digits.slice(i, i + 2), 10);
const skin = ["#a4ca7b", "#7ac5aa", "#a6a6d8", "#c4b576"][part(0) % 4];
```

Other sections select shirt color, eye size, and scar position. The resulting SVG is generated locally. Different DNA values may share some visual traits; the guarantee is that the same DNA produces the same avatar.

**Show:** two different avatars; refresh the page and show they remain the same.

**Say:** “The artwork is deterministic and based on contract DNA. We do not need an image API or store image files on-chain.”

## 4. Dynamic deployment discovery

**Code:** `src/app.ts`, `connect()` around lines 123–141.

The starter pasted a fixed address into JavaScript and loaded a handwritten ABI. The current code gets the wallet's network ID and fetches the compiled artifact:

```ts
const response = await fetch("build/contracts/ZombieOwnership.json", { cache: "no-store" });
const artifact: ContractArtifact = await response.json();
const deployment = artifact.networks[String(networkId)];
```

After checking that a deployment exists and has bytecode, it instantiates:

```ts
contract = new web3.eth.Contract(artifact.abi, deployment.address);
```

**Show:** these code lines and the dashboard's deployment address. A live redeployment is unnecessary and starts a new collection, so do not interrupt the main demo to redeploy.

**Say:** “Truffle records deployment addresses by network ID. The frontend reads that address and ABI, so we no longer edit the frontend after each deployment.”

The local RPC and allowed network IDs are still deliberately configured. Dynamic address discovery does not mean the application has no configuration.

## 5. Transfer interface and Solidity correction

**Frontend code:** `src/app.ts`, the transfer form listener around line 194 and `owns()` around line 207.

The form validates the recipient with `web3.utils.isAddress`, rejects the zero address and self-transfers, and reads `ownerOf` before requesting a transaction. The actual method passed to the shared transaction helper is:

```ts
contract.methods.transferFrom(account, recipient, zombie.id)
```

**Solidity code:** `contracts/zombieownership.sol`, `_transfer()` around line 21 and `transferFrom()` around line 30.

The starter subtracted from `ownerZombieCount[msg.sender]`. That is incorrect when an approved account initiates the transfer: the caller may not own the token. We changed it to subtract from the actual sender:

```solidity
ownerZombieCount[_from] = ownerZombieCount[_from].sub(1);
```

We also validate `_from`, reject a zero recipient, and clear the old approval:

```solidity
require(_to != address(0));
require(zombieToOwner[_tokenId] == _from);
// Inside _transfer, after updating ownership:
delete zombieApprovals[_tokenId];
```

**Show:** transfer #0 from A to B. Show #0 disappear from A and appear alongside #1 in B.

**Say:** “We added an interface to the existing transfer method and corrected balance accounting for approved callers. The contract enforces authorization; frontend checks improve the user experience.”

This remains the starter's partial ERC721-style ownership interface. Do not describe it as a full modern ERC721 implementation or call it `safeTransferFrom`.

## 6. Battle interface

**Frontend code:** `src/app.ts`, the `battleForm` listener around line 273.

The form selects an owned fighter, takes an enemy's numeric ID, checks ownership/existence/cooldown, and sends the existing `attack(id, enemy)` method through `transact()`.

**Existing backend:** `contracts/zombieattack.sol`, `attack()` around line 14. That original code determines the result, updates stats, and creates a child on victory. We did not rewrite the battle algorithm.

The UI reads the fighter's stats before the transaction and again at the confirmed receipt's block:

```ts
const after = await instance.methods.zombies(id).call({}, receipt.blockNumber);
const won = web3.utils.toBN(after.winCount).gt(web3.utils.toBN(before.winCount));
```

**Show:** a battle against the other account's zombie. Your successful test showed ZombieA move from level 2 to level 3, gain one win, and create NoName #2.

**Say:** “The browser submits the action, but the smart contract determines the result. We display updated blockchain state rather than generating a win in the browser.”

Battle outcomes are variable; defeat is also a valid demonstration. The starter's timestamp/sender randomness is educational, not suitable for valuable assets.

## Other changes to mention if asked

- **Named creation:** `src/app.ts` around line 262 reads and validates the form name before calling the existing `createRandomZombie(name)`. The starter passed the account address as the name.
- **Level Up correction:** the handler around line 186 passes a single selected zombie ID and the existing 0.001 ETH fee. The starter passed the owned-ID array to `levelUp`.
- **Transaction feedback:** `transact()` around line 214 estimates gas, requests MetaMask approval, displays a hash, waits for a receipt, and reloads the army. Rejections/failures produce readable messages. Display state is not updated as successful before blockchain confirmation.
- **Wallet handling:** `connect()` uses `window.ethereum.request`. Account/network events near the end of `src/app.ts` rediscover the contract and reload ownership. The starter already had event listeners, but they reloaded the page and were unguarded when MetaMask was absent. A generation counter prevents old reads from overwriting the newly selected wallet context.
- **TypeScript:** interfaces at the top of `src/app.ts` describe app data. `tsconfig.json` emits ordinary JavaScript to `js/app.js`. `package.json` adds build/typecheck/watch commands and a prestart build. Web3/MetaMask boundaries use `any` for legacy compatibility. TypeScript changes development checks, not blockchain execution.
- **Tests:** `test/CryptoZombies.js` now targets the actual ZombieOwnership contract and covers creation, the starter restriction, level-up, ownership changes, invalid/approved transfers, approval cleanup, and battle state. The earlier automated run passed eight tests.
- **Demo helper:** `scripts/advance-time.js` calls Ganache's `evm_increaseTime` and `evm_mine`. It advances local chain time rather than changing the Solidity cooldown or fabricating results.

## Seven-minute presentation plan

| Time | Show and explain |
| --- | --- |
| 0:00–0:30 | Introduce the starter, local architecture, and final ZombieOwnership contract. |
| 0:30–1:15 | Dashboard, wallet status, and responsive layout. |
| 1:15–2:00 | Create A's named zombie, show its card/avatar, and Level Up. |
| 2:00–2:45 | Switch to B and create its opponent; explain wallet ownership. |
| 2:45–4:00 | Advance local cooldown, switch to A, battle B, and show real stats/child if victorious. |
| 4:00–5:00 | Transfer A's original zombie to B and show both accounts' updated collections. |
| 5:00–6:15 | Show dynamic artifact loading and the transfer Solidity fix in the editor. |
| 6:15–7:00 | Show the typed source/build configuration and summarize the tested behavior. |

Have contracts deployed and the website running before class. The professor says setup/deployment does not need to be demonstrated. Prepare the cooldown in advance or briefly explain the local helper. Avoid repeatedly advancing time, redeploying, or running tests during the live walkthrough.

Open editor tabs for `src/app.ts`, `index.html`, `css/style.css`, and `contracts/zombieownership.sol`. The existing `contracts/2_crypto_zombies.js` tab is an unused starter file; it is not the active frontend or actual migration script. Actual deployment scripts are under `migrations/` and were preserved.

## Questions you should be ready to answer

**Why use `.call()` and `.send()`?** Read-only getters use `.call()`. Creation, level-up, battle, and transfer change blockchain state and use `.send()` through the shared transaction helper, requiring a signed transaction and gas.

**Where is data stored?** Zombie fields and ownership are in Ganache contract storage. Avatars and card layouts are generated in the browser from those fields. There is no application database.

**Why does winning create NoName?** The existing battle victory path calls `feedAndMultiply`, whose original implementation creates a child named NoName. This behavior was preserved.

**Why is creation disabled when an account already owns a zombie?** The original `createRandomZombie` requires `ownerZombieCount[msg.sender] == 0`. Battles and transfers grow the collection after the starter.

**What did you change in Solidity?** Only ownership transfer correctness: debit `_from`, validate the sender/recipient, and clear approvals. The remaining game contracts and compiler version were preserved.

**Does localhost:3000 run the blockchain?** No. It serves the website. Ganache runs separately at 127.0.0.1:7545. MetaMask supplies the account and transaction signing/approval interface.
