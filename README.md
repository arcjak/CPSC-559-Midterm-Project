# CryptoZombies Midterm Project

## Team Members

- Daniel Lee
  - CWID: 884418989
  - Email: arcjak@csu.fullerton.edu
- Team Member 2
  - CWID: TODO
  - Email: TODO

## Project Description

This project extends the provided CryptoZombies starter into a local Ethereum DApp. Players connect MetaMask, create a named zombie, view their army, pay to level up a selected zombie, battle another account's zombie, and transfer ownership between accounts. Cards display deterministic DNA-based artwork and live contract data.

The frontend uses plain HTML and CSS with TypeScript compiled into ordinary JavaScript. It retains Web3.js and Truffle. No React, Vite, Webpack, Hardhat, ethers.js, database, application backend, public blockchain, or external avatar API was added.

**The improvements are already implemented in this project.** `localhost:3000` is just the address used to serve the website; the improvements are its interface, contract integration, visualizations, and error handling.

## Architecture and Important Files

```text
index.html + css/style.css
           |
src/app.ts --TypeScript compiler--> js/app.js
                                      |
                              Web3 + MetaMask
                                      |
                         Ganache RPC on port 7545
                                      |
                               ZombieOwnership
```

The website is served at **http://localhost:3000**. Ganache is a separate blockchain service at **http://127.0.0.1:7545**. Both must remain running for the complete demo.

| File or directory | Purpose |
| --- | --- |
| `index.html` | Dashboard markup, wallet information, creation/battle forms, and zombie-card template. |
| `css/style.css` | Theme, cards, responsive layout, status styles, and form styling. |
| `src/app.ts` | Frontend source: wallet connection, artifact discovery, contract calls, avatars, and transaction handling. Edit this file for frontend logic changes. |
| `js/app.js` | Generated browser JavaScript loaded by `index.html`. Compile TypeScript instead of editing this file manually. |
| `tsconfig.json` | Strict TypeScript configuration; emits ES2017 JavaScript with no module loader. |
| `web3.min.js` | Supplied local Web3 1.2.7-rc.0 browser bundle. |
| `contracts/` | Solidity contracts and inheritance layers. |
| `migrations/` | Actual Truffle deployment scripts. |
| `build/contracts/ZombieOwnership.json` | Generated ABI and deployment addresses, read by the frontend. Created by compilation/migration. |
| `test/CryptoZombies.js` | Eight contract regression tests targeting ZombieOwnership. |
| `scripts/advance-time.js` | Optional Ganache-only helper to prepare battle cooldowns. |
| `package.json` / `package-lock.json` | Commands and locked dependencies. |

The frontend uses **ZombieOwnership**, which inherits:

```text
ZombieOwnership -> ZombieAttack -> ZombieHelper -> ZombieFeeding -> ZombieFactory -> Ownable
       + ERC721 interface                 + local SafeMath libraries
```

The migrations also deploy intermediate contracts, but those deployments have separate state. Creating a zombie directly on ZombieFactory does not create one in the ZombieOwnership instance used by the website.

Two original files are retained but unused: `cryptozombies_abi.js` contains a stale handwritten ABI, and `contracts/2_crypto_zombies.js` references a nonexistent CryptoZombies contract outside the actual migrations directory. Neither is the active frontend or deployment entry point.

## Environment

| Component | Version/configuration verified in this workspace |
| --- | --- |
| Node.js | 24.16.0 for the original full compile/deploy/test workflow; 14.16.0 also tested for dependency installation, frontend type checking/building, and frontend startup. |
| npm | 11.13.0 on the main host; **6.14.11 used for reproducible dependency installation**. |
| Truffle | **5.11.5**, globally installed. |
| Ganache | **7.9.1**, bundled with that Truffle installation. |
| Solidity | **0.4.25+commit.59dbf8f1**, configured in `truffle-config.js`. |
| Browser Web3 | Supplied local **1.2.7-rc.0** bundle. |
| npm Web3 | Existing locked dependency **1.6.1**; the browser does not import it. |
| BrowserSync | **2.27.7**, the local HTTP server. |
| TypeScript | **4.9.5**, pinned development dependency. |
| openzeppelin-solidity | Existing locked dependency **4.4.1**; the app contracts use their local Solidity files. |
| truffle-hdwallet-provider | Existing locked dependency **1.0.17**; unused in the local workflow. |

The assignment describes an older starter environment: Node 14.16.0, Truffle 5.4.25, Ganache 2.5.4, Solidity 0.8.11, and Web3 1.2.7. The actual supplied game contracts use Solidity `^0.4.25` and the compiler was already configured for 0.4.25. This project preserves that compiler and source syntax. The professor's exact older Truffle/Ganache combination was not verified; the frontend compiler and server were verified on Node 14.16.0.

All pre-existing dependency declarations and lockfile entries were retained. TypeScript 4.9.5 is the only added development dependency.

## Setup — Step by Step

These commands use the current macOS project location. On another computer, replace the `cd` path with the extracted project folder. Initial package/tool/compiler downloads require internet access; core gameplay runs locally afterward.

### Step 1: Check the tools

Open a terminal:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
node --version
npm --version
truffle version
```

On the current development machine, Node 24.16.0 and Truffle 5.11.5 are already installed. There is no need to reinstall them for each demo.

On a new machine using an existing nvm installation, the full-workflow Node version can be selected with:

```sh
nvm install 24.16.0
nvm use 24.16.0
```

If Truffle is missing, install the version used for validation:

```sh
npm install --global truffle@5.11.5
truffle version
```

Use Chrome with the MetaMask browser extension installed and unlocked. The browser extension and the DApp must be in the same browser profile.

### Step 2: Install the project dependencies

Run once after extracting the project or whenever dependencies need to be reinstalled:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
npx --yes --package=npm@6.14.11 npm ci --ignore-scripts --no-audit
```

This runs npm 6 without replacing the host's npm installation. The clean install may take several minutes because the starter contains old dependencies. The command installs the TypeScript development compiler as well as the existing runtime packages.

If the active npm version is already 6.14.11, use this equivalent command instead:

```sh
npm ci --ignore-scripts --no-audit
```

The original v1 lockfile fails npm 11's `npm ci` validation on old websocket dependency metadata. Use npm 6 rather than regenerating the whole lockfile. Optional native dependency install scripts are unnecessary for the tested local frontend workflow, so the installation uses `--ignore-scripts`.

### Step 3: Start Ganache — Terminal 1

Run:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
node "$(npm root -g)/truffle/node_modules/ganache/dist/node/cli.js" \
  --server.host 127.0.0.1 \
  --server.port 7545 \
  --chain.networkId 1337 \
  --chain.chainId 1337 \
  --wallet.totalAccounts 10 \
  --logging.quiet
```

This uses the Ganache bundled with the installed Truffle 5.11.5. No separate project Ganache dependency is required.

Expected output includes funded **Available Accounts**, corresponding **Private Keys**, and:

```text
Chain
Id: 1337

RPC Listening on 127.0.0.1:7545
```

**Leave Terminal 1 running.** The CLI command creates an in-memory chain: stopping and restarting it creates a new chain and normally new accounts. Keep this instance alive throughout setup, testing, and recording.

A µWS native-module warning under Node 24 may say Ganache is falling back to a JavaScript implementation. That fallback was observed during successful tests. Confirm the final `RPC Listening` message before proceeding.

If using the installed Ganache GUI instead, configure RPC host `127.0.0.1`, port `7545`, network ID `1337`, and chain ID `1337`. Some GUI defaults use network ID 5777. Run either the GUI or the CLI on this port, not both. The CLI above is the exact configuration used for validation.

### Step 4: Compile and deploy — Terminal 2

Open a second terminal, leaving Ganache running:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
npm run compile
npm run migrate
```

These scripts run:

```sh
truffle compile
truffle migrate --reset --network development
```

Expected result: successful Solidity compilation and a migration summary including **ZombieOwnership**. The migrations deploy Migrations, SafeMath, ZombieFactory, ZombieFeeding, ZombieHelper, ZombieAttack, and ZombieOwnership.

To check the saved deployment without editing anything:

```sh
node -e 'const a=require("./build/contracts/ZombieOwnership.json"); console.log(a.networks["1337"] && a.networks["1337"].address);'
```

An address here confirms that Truffle saved a deployment entry. The frontend additionally checks that code exists at that address on the currently running chain, because a saved entry can outlive a restarted Ganache session.

**`npm run migrate` deploys fresh contracts.** Do not rerun it in the middle of a prepared demo: the website will discover a new ownership contract and show its initially empty collection. It does not erase the old contract's state on a still-running chain, but the app will use the latest deployment.

### Step 5: Start the website — Terminal 2

After migration finishes, run:

```sh
npm start
```

`npm start` first runs `npm run build` through `prestart`, then starts BrowserSync. Expected output includes:

```text
Local: http://localhost:3000
Serving files from: ./
```

**Leave Terminal 2 running.** Open **http://localhost:3000** in Chrome. Do not open `index.html` directly with `file://`, and do not use port 7545 as the website address.

The server must serve the project root so the frontend can fetch `build/contracts/ZombieOwnership.json`. No contract address needs to be pasted into frontend code.

### Step 6: Add the Ganache network in MetaMask

In MetaMask, open the menu, choose **Networks**, and choose **Add a custom network**. Enter:

| Field | Value |
| --- | --- |
| Network name | `Ganache Local` |
| RPC URL / Default RPC URL | `http://127.0.0.1:7545` |
| Chain ID | `1337` |
| Currency symbol | `ETH` |
| Block explorer URL | Leave empty |

If the RPC field opens a separate form, use **Add RPC URL**, enter the URL, and save it. Save the custom network.

See [MetaMask's network setup instructions](https://support.metamask.io/configure/networks/how-to-add-a-custom-network-rpc).

### Step 7: Import two funded Ganache accounts

In Terminal 1, find **Private Keys**. Use entry `(0)` for Account A and entry `(1)` for Account B from this currently running chain.

In MetaMask:

1. Open the account selector at the top.
2. Click **Add wallet**.
3. Select **Import an account** and the **Private key** type.
4. Copy the complete key after `(0)` in Ganache's **Private Keys** section and paste it into the import field. Exclude the `(0)` label and any whitespace.
5. Click **Import**. Match its account address against Ganache's **Available Accounts → (0)**.
6. Repeat with private key `(1)`, matching the address against Available Accounts `(1)`.
7. Label the imported accounts Account A and Account B for the demo if desired. The address, not the display name, identifies each account.

| Ganache output | Purpose |
| --- | --- |
| Available Accounts | Public addresses; use them to verify an account or choose a transfer recipient. An address is 40 hexadecimal characters, or 42 including `0x`. |
| Private Keys | Values used in MetaMask's private-key import field. A key is 64 hexadecimal characters, or 66 including `0x`. |

Pasting an **account address** into the private-key field produces an invalid-private-key error. Copy the matching entry from **Private Keys** instead. Use the local test keys in your own MetaMask; do not put them in the README or submission.

Select the Ganache network when inspecting balances. The CLI accounts initially have approximately 1000 test ETH each, minus any transactions already sent. A newly created ordinary MetaMask account is not automatically funded on Ganache.

See [MetaMask's account import instructions](https://support.metamask.io/start/use-an-existing-wallet#import-using-a-private-key).

### Step 8: Connect the website to Ganache and Account A

1. Open **http://localhost:3000** and click **Connect MetaMask**.
2. Approve the localhost connection using the imported Account A. If account permissions are offered, make both imported demo accounts available.
3. Make sure the **website connection itself** uses Ganache Local. In MetaMask's side panel, look at the connection row showing `localhost:3000` near the bottom. Click its current-network dropdown, select **Ganache Local**, and approve if prompted.
4. Return to the website and click **Reconnect wallet** if necessary.

MetaMask can use different networks for different websites. The **Network: Ganache Local** filter in the Tokens section only controls the portfolio view; it does not prove that localhost is connected to Ganache. See [MetaMask's per-DApp network instructions](https://support.metamask.io/configure/networks/how-to-change-networks/).

The CryptoZombies command center should now display:

```text
Wallet:   your imported Account A address, abbreviated
Network:  Network 1337 · Chain 1337
Contract: a deployed ZombieOwnership address, abbreviated
```

The status should say **“Wallet connected. Your local zombie lab is ready.”** If it displays Network 1 / Chain 1, change the localhost connection's network in Step 8 rather than merely changing the Tokens filter.

## Manual Test and Demo Workflow

For this full sequence, start with the fresh deployment from Step 4. If continuing an existing collection, use its actual IDs and skip creation for accounts that already own zombies. Contract IDs and Ethereum account addresses are different kinds of input.

### 1. Create and display ZombieA

With Account A connected, enter `ZombieA` in the **Zombie name** field, click **Create Zombie**, and confirm the transaction in MetaMask. Open the extension if the approval window does not appear automatically.

After confirmation, one card should display its name, ID, DNA, level 1, zero wins/losses, avatar, and cooldown. On a fresh deployment, its ID is normally `0`; write down the actual displayed ID. Click **Show Zombies** and refresh the browser to verify the data remains.

The existing contract permits a starter only while `ownerZombieCount[msg.sender] == 0`. The creation button is disabled when the connected account owns zombies; battles and transfers can grow the collection.

### 2. Level Up ZombieA

Click **Level Up** on ZombieA's card and approve in MetaMask. Its level should increase from 1 to 2. The existing fee is **0.001 ETH**, plus gas. The frontend sends one selected zombie ID instead of the starter's incorrect owned-ID array.

### 3. Switch to Account B and create ZombieB

Switch to the imported Account B in MetaMask and confirm the website's displayed account changes. If it remains on A, check the accounts connected to localhost in MetaMask and reconnect with B.

B should have its own empty army. Create `ZombieB` and confirm. On a fresh deployment its ID is normally `1`; record the actual ID. Creation must happen with Account B selected, not by typing ZombieB while still connected to A.

### 4. Prepare a battle without waiting one day

New zombies are recovering. Open **Terminal 3**, leaving Ganache and BrowserSync running:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
truffle exec scripts/advance-time.js --network development
```

Expected output:

```text
Ganache advanced one day. Click Show Zombies to refresh cooldowns.
```

This explicit local helper checks for Ganache network 1337, advances time by **86,401 seconds** using `evm_increaseTime`, and mines a block using `evm_mine`. It does not change the Solidity cooldown or fabricate battle results. It affects the local chain's clock, so timestamps may become later than wall-clock time. It is never called automatically by the website.

### 5. Battle A's zombie against B's zombie

Switch back to Account A and click **Show Zombies**. ZombieA should show **Ready**.

In the Battle section, choose ZombieA under **Your fighter**. In **Enemy zombie ID**, enter B's numeric ID, for example `1`, not `ZombieB`, not a wallet address, and not your fighter's own ID. Click **Battle** and confirm in MetaMask.

| Result | Expected contract state |
| --- | --- |
| Victory | A's fighter gains a win and a level; B's target gains a loss; A receives a child named NoName. |
| Defeat | A's fighter gains a loss; B's target gains a win. |

Either result demonstrates the battle feature. Following a successful battle, the fighter enters cooldown again. If another battle is needed, run the time helper and reload readiness again.

The result message is read from confirmed contract state. The browser does not randomly choose a win. A victorious level-2 ZombieA becomes level 3, and its new child is normally ID `2` in this fresh two-account sequence.

### 6. Transfer ZombieA from A to B

Copy Account B's **full public address** from MetaMask, then switch back to A. Click **Transfer** on ZombieA's card, paste B's address, click **Confirm transfer**, and confirm in MetaMask.

Expected result: ZombieA's ID disappears from A. If A won the battle, its NoName child remains with A. Switch to B and click **Show Zombies**; B should display both ZombieA and ZombieB. Stats and DNA remain attached to the transferred zombie. Cooldown does not prevent transfer.

Use a recipient account address here, not a private key or zombie ID.

### 7. Demonstrate error handling and responsiveness

Try an invalid transfer address, reject a transaction in MetaMask, or switch the localhost connection away from Ganache. The app should show a readable error and disable unavailable actions. Return to Ganache and reconnect afterward. Reduce the browser width to show the responsive layout. Refresh to show that avatars stay consistent for the same DNA.

## Improvements and Code Changes

The starter already included creation, level-up, ownership lookup, transfer, approval, and battle methods in Solidity. Most improvements expose those existing methods through a usable frontend. The only game-contract source changed was `contracts/zombieownership.sol` for transfer correctness.

| Improvement | What changed in the code | What to demonstrate |
| --- | --- | --- |
| 1. Redesigned dashboard | `index.html` supplies wallet information, structured forms, shared status area, and card template. `css/style.css` supplies the game theme, card/grid layout, and media queries. | Show the dashboard and narrow the browser. |
| 2. Army cards and multiple ownership | `loadArmy()` in `src/app.ts` reads `getZombiesByOwner(account)`, fetches each `zombies(id)` with `Promise.all`, and calls `renderCard()`. The original getter already supported multiple zombies; rendering and interaction were improved. | Show all zombies for A/B, including multiple cards after battle/transfer. |
| 3. Deterministic DNA avatars | `avatar(dna)` selects skin, shirt, eyes, and scar variations from DNA digits and builds local SVG. The same DNA always gives the same artwork; different DNA can share some traits. | Compare cards and refresh to show stable artwork. |
| 4. Dynamic contract discovery | `connect()` fetches the ZombieOwnership artifact, gets the wallet network ID, reads `artifact.networks[networkId].address`, checks deployed code, and instantiates the artifact ABI. The handwritten ABI and hard-coded deployment address are no longer used. | Show `connect()` and the displayed deployment address. No frontend address edit is needed after migration. |
| 5. Transfer UI | Each card has recipient/confirm/cancel controls. Validation checks address format, nonzero recipient, and ownership before invoking the existing `transferFrom` through `transact()`. The contract still enforces authorization. | Transfer A's zombie to B and show both collections. |
| 6. Battle UI | The battle form selects an owned fighter and numeric enemy ID, checks ownership/existence/readiness, sends the existing `attack`, and compares stats read before the transaction and at the receipt block. | Show real wins/losses/level and a child if victorious. |
| 7. Named creation and selected Level Up | Creation validates a 1–32-character name instead of using the account address as a name. Per-card Level Up passes one zombie ID and the original fee. | Create a named zombie and level up its card. |
| 8. Wallet and transaction handling | Uses `window.ethereum.request`, account/network/disconnect events, invalidation of stale reads, loading controls, gas estimation, confirmation, hashes, readable errors, and post-transaction refresh. The starter already had unguarded reload listeners; these were replaced with safer application updates. | Switch A/B, show a rejection or wrong-network message, and show a transaction hash. |

The transfer contract fix debits `_from` instead of `msg.sender`, so approved callers do not incorrectly lose their own balance. It also validates the actual owner and nonzero recipient and deletes the previous token approval after transfer. See `_transfer()` and `transferFrom()` in `contracts/zombieownership.sol`.

An additional development change converts the frontend to TypeScript with explicit `Zombie`, `ContractArtifact`, `ContractDeployment`, receipt/options, and DOM interfaces. Blockchain IDs and DNA remain strings to avoid JavaScript number precision loss. Legacy Web3/MetaMask methods and ABI/error boundaries use `any` where appropriate. TypeScript improves development checks; it does not change blockchain execution.

Read-only contract getters use `.call()`. Creation, level-up, battle, and transfer use `.send()` inside `transact()`, triggering MetaMask approval and a gas-paying blockchain transaction. The UI reloads state after confirmation.

For a more detailed code walkthrough and speaker notes, see [docs/PRESENTATION_GUIDE.md](docs/PRESENTATION_GUIDE.md).

## Commands and Development Workflow

Run commands from the project root:

| Command | Purpose |
| --- | --- |
| `npm run compile` | Compile Solidity with Truffle. |
| `npm run migrate` | Redeploy fresh contracts on development network 1337 and update artifacts. |
| `npm run typecheck` | Strictly check frontend TypeScript without emitting files. |
| `npm run build` | Compile `src/app.ts` into browser-ready `js/app.js`. |
| `npm start` | Build the frontend first, then serve through BrowserSync on port 3000. |
| `npm run watch:ts` | Recompile TypeScript automatically as source changes. |
| `npm test` | Run the eight contract tests against running Ganache. |
| `truffle exec scripts/advance-time.js --network development` | Advance Ganache's local battle cooldowns. |

Edit `src/app.ts` and run `npm run build`, or leave the compiler watcher running in a spare terminal:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
npm run watch:ts
```

BrowserSync watches emitted `js/*.js` and the HTML/CSS. It does not compile TypeScript itself. `npm start` builds at startup; continued TypeScript editing requires the watcher or another build. `noEmitOnError` prevents emitting a broken build, and type errors stop the prestart build before the HTTP server launches.

`js/app.js` remains a plain script loaded after `web3.min.js`, with ES2017 output and `module: none`. There are no generated imports, module loader, or bundler. Migrations, contract tests, and helper scripts remain JavaScript. Solidity source remains Solidity.

## Testing and Verification

With Ganache running, run these in a spare terminal:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
npm run typecheck
npm run build
node --check js/app.js
npm test
```

The eight contract tests cover separate-account creation, starter restrictions, level-up fees, transfers and both ownership lists, approved-caller accounting, approval invalidation, invalid/unauthorized transfers, and actual battle state after advancing time. Test instances are separate from the frontend's deployed game. Tests advance shared Ganache time, so run them before preparing the final presentation sequence.

Verification recorded during development:

- Original contracts compiled and original migrations succeeded before feature changes.
- Updated contracts compiled and deployed with Solidity 0.4.25; the contract suite passed **8 tests**.
- Automated Chrome integration checks used the supplied Web3 bundle, real Ganache transactions, and an injected test wallet. They covered A/B creation, Level Up, battle, transfer, multiple cards, avatars, rejected transactions, invalid addresses, wallet/network changes, cooldown feedback, and 390px mobile layout. The final browser run had no uncaught exceptions; its transactions were reverted afterward.
- The TypeScript conversion passed clean installation, strict type checking, build, output syntax checking, and frontend startup under **Node 14.16.0 / npm 6.14.11**. Emitted executable logic matched the preceding JavaScript, apart from harmless declaration grouping, parentheses, and formatting.
- Subsequent manual testing with the **actual MetaMask extension** demonstrated account/network connection, zombie creation, Level Up, a confirmed victory producing a child, and Account B showing both its original zombie and A's transferred zombie. These manual screenshots supplement the earlier injected-wallet tests.

See [docs/AUDIT.md](docs/AUDIT.md) for the starter audit and [docs/REPORT.md](docs/REPORT.md) for the earlier implementation/testing history.

## Troubleshooting

| Symptom | What to check or do |
| --- | --- |
| Browser cannot open localhost:3000 | The website server must be running. From the project root run `npm start` and leave the terminal open. Wait for BrowserSync's URL. |
| Port already in use / EADDRINUSE | An instance may already be running. Use the existing server; do not launch a second Ganache on port 7545 or a second frontend unnecessarily. |
| Truffle cannot connect to the node | Start Ganache and verify `127.0.0.1:7545`, network ID 1337. |
| Network 1 / Chain 1 or a wrong-network message | Switch the **localhost DApp connection** in MetaMask to Ganache Local. The Tokens network filter is separate. Reconnect afterward. |
| Invalid private key | Import the full value under Ganache's **Private Keys**, not an address under Available Accounts. Exclude the numeric label and whitespace. |
| Zero balance / insufficient funds | Select an imported funded account from the currently running Ganache instance and check the DApp network. Old accounts may not be funded after restarting the CLI chain. |
| Artifact missing / HTTP 404 | Run `npm run compile` and `npm run migrate`, then serve the project root with `npm start`. The build directory is generated and may be absent in a fresh extraction. |
| ZombieOwnership not deployed / no bytecode at saved address | Ganache may have restarted. Redeploy once on the current chain using `npm run migrate`, then reconnect. A saved artifact address alone does not prove code exists on the new chain. |
| Create Zombie is disabled | The connected account already owns zombies, the wallet/contract is unavailable, or a transaction is pending. Use another funded account for its starter or grow the army through battle/transfer. |
| Fighter recovering | Run the explicit Ganache time helper or wait for cooldown, then click Show Zombies. |
| Enemy input rejected | Enter an existing enemy's numeric zombie ID, not its name or account address. Select an owned fighter and a different owner's target. |
| Switching account does not change the app | Check which imported accounts MetaMask has connected to localhost. Enable/select the intended account for that connection, then reconnect. |
| MetaMask transaction request is already pending | Open MetaMask and approve or reject the pending request before retrying. |
| Nonce/pending-transaction problems after restarting Ganache | MetaMask may retain activity from the previous chain. Clear activity/nonce data for the disposable local test account using your MetaMask version's settings, then reconnect. |
| TypeScript edits do not appear | Edit `src/app.ts`, run `npm run build` or `npm run watch:ts`, and check compiler errors. The browser loads `js/app.js`. |
| npm 11 refuses the old lockfile | Use the npm 6 clean-install command in Step 2. |
| µWS fallback warning | Node 24 lacks the optional native binary used by this Ganache build. The JavaScript fallback worked during validation; verify the RPC listening line. |
| MaxListenersExceededWarning in Ganache | This warning was observed while the RPC continued to work. If actions fail or Ganache becomes unresponsive, inspect its terminal before restarting; restarting this in-memory chain requires new setup/deployment. |

To inspect which process is listening on the two ports on macOS:

```sh
lsof -nP -iTCP:3000 -iTCP:7545 -sTCP:LISTEN
```

## Restarting or Continuing the Demo

If Ganache is still running and you only stopped the website, restart just the website:

```sh
cd "/Users/arcjak/Desktop/Cryptozombie demo package"
npm start
```

Reconnect the same imported account. The deployed game state remains on the running chain. A browser refresh alone does not delete zombies.

If you stopped and restarted the in-memory Ganache CLI, repeat deployment and import/use its new funded accounts. Reconnect MetaMask to the new deployment. If you deliberately want a fresh game on an existing chain, run `npm run migrate` once and reconnect; do not do that while demonstrating an existing army.

## Class Demo and Submission

Prepare the chain, contract deployment, wallet permissions, and website before class. The assignment says installation/deployment does not need to be demonstrated. Keep the presentation under **10 minutes**; this sequence takes approximately 6–8 minutes:

| Time | Show |
| --- | --- |
| 0:00–0:45 | Briefly explain the local architecture; show the redesigned dashboard and ready wallet/contract. |
| 0:45–1:45 | Create a named zombie for A, show its avatar/card, and Level Up. |
| 1:45–2:30 | Switch to B and create its starter. |
| 2:30–4:00 | Prepare cooldown, switch to A, battle B's ID, and show confirmed stats and a child if victorious. |
| 4:00–5:15 | Transfer A's original zombie to B; show B's multiple cards and A's remaining collection. |
| 5:15–6:30 | Show `connect()` artifact discovery, `avatar()`, and the transfer Solidity correction in the editor. |
| 6:30–8:00 | Briefly show a handled error/responsive layout, then explain the TypeScript build and testing. |

The six clearest improvements to demonstrate separately are the dashboard, army cards, avatars, dynamic deployment discovery, transfer UI, and battle UI. Named creation and improved wallet handling provide additional examples. The instructor decides grading credit; existing smart-contract functions should be described as existing methods that the improved interface exposes.

Before submitting:

- Fill in every team member's name, CWID, and email above.
- Record the required video showing the working DApp and improvements.
- Package the DApp, README, video, and slides if used into one `.rar` file. The assignment permits a repository link in the README instead of including the code; supply the actual link if using that option.
- Include the frontend TypeScript source, generated browser JavaScript, Solidity, migrations, tests, scripts, configuration, package files, and documentation. `node_modules/` and `build/` are regenerated by the documented installation/compile/deploy steps and need not be packaged.
- Have one team member submit the team's copy, and follow the class's in-person attendance/sign-up instructions.
- Follow the Canvas due date and bring the laptop/adapter required for the in-person demo.

## Known Limitations

- The starter's ownership interface is a partial ERC721-style implementation. It has `transferFrom` and `approve`, but no `safeTransferFrom`, receiver callbacks, operator approvals, or interface detection. Use local demo accounts as recipients.
- The existing battle randomness uses block time, sender, and a nonce. It is educational and unsuitable for valuable assets. The original contract enforces cooldown on its victory/multiplication path; the frontend consistently checks readiness before sending a battle. The battle mechanics were preserved.
- `feedOnKitty` exists in Solidity, but no local CryptoKitties implementation is configured. Kitty feeding, public testnet deployment, and a marketplace were not implemented and should not be claimed in the demo.
- The level-up fee is private and owner-configurable without a getter. The frontend retains the starter's 0.001 ETH default. If changed externally, restore the contract fee to `1000000000000000` wei for the documented UI workflow.
- Incoming transfers initiated elsewhere become visible after Show Zombies, reconnection, or the next own transaction. The app handles wallet account/network events and does not use constant polling or blockchain log subscriptions.
- Ready status uses the latest loaded chain timestamp; refresh the army after advancing time.
- The HTTP server serves static files. The application requires no separate application backend or public-chain service, but still requires the local Ganache RPC and MetaMask provider.
