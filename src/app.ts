// Browser globals are supplied by the existing local Web3 bundle and MetaMask.
// Keep these legacy boundaries flexible instead of importing newer Web3 typings.
declare const Web3: any;
interface Window { ethereum?: any; }

interface Zombie {
  id: string;
  name: string;
  dna: string;
  level: string;
  readyTime: string;
  winCount: string;
  lossCount: string;
}

interface ContractDeployment {
  address: string;
}

interface ContractArtifact {
  // Web3 1.2.7 consumes Truffle ABI objects directly.
  abi: any[];
  networks: { [networkId: string]: ContractDeployment | undefined };
}

interface TransactionOptions { value?: string; }
interface TransactionReceipt {
  status: boolean | string;
  transactionHash: string;
  blockNumber: number | string;
}
interface AppError extends Error { userMessage?: string; }
type StatusKind = "info" | "success" | "pending" | "error";

// Each ID has a known element type in index.html. No browser module loader needed.
interface AppElements {
  message: HTMLElement;
  status: HTMLElement;
  txHash: HTMLElement;
  connect: HTMLButtonElement;
  createForm: HTMLFormElement;
  battleForm: HTMLFormElement;
  account: HTMLElement;
  deployment: HTMLElement;
  armyCount: HTMLElement;
  fighter: HTMLSelectElement;
  battleResult: HTMLElement;
  zombies: HTMLElement;
  network: HTMLElement;
  zombieTemplate: HTMLTemplateElement;
  refresh: HTMLButtonElement;
  zombieName: HTMLInputElement;
  enemy: HTMLInputElement;
}

(() => {
  const $ = <K extends keyof AppElements>(id: K): AppElements[K] =>
    document.getElementById(id) as AppElements[K];
  const ZERO = "0x0000000000000000000000000000000000000000";
  // Contract methods and PromiEvents vary across legacy Web3 releases.
  let web3: any, contract: any, account: string | null | undefined;
  let army: Zombie[] = [], generation = 0, busy = false;
  const short = (address: string): string => `${address.slice(0, 6)}…${address.slice(-4)}`;
  const same = (a: string | null | undefined, b: string | null | undefined) =>
    a && b && a.toLowerCase() === b.toLowerCase();
  function status(message: string, kind: StatusKind = "info", hash = ""): void {
    $("message").textContent = message;
    $("status").dataset.kind = kind;
    $("txHash").textContent = hash ? `Transaction: ${hash}` : "";
  }
  function controls() {
    document.querySelectorAll<HTMLButtonElement | HTMLSelectElement>("[data-contract]").forEach(button => {
      button.disabled = busy || !contract || !account;
    });
    $("connect").disabled = busy;
    $("createForm").querySelector("button")!.disabled = busy || !contract || !account || army.length > 0;
    $("battleForm").querySelector("button")!.disabled = busy || !contract || !account || !army.length;
  }
  function friendly(error: any): string {
    console.error(error);
    const code = error.code || (error.data && error.data.originalError && error.data.originalError.code);
    if (Number(code) === 4001 || /denied|rejected/i.test(error.message || "")) return "Transaction or wallet request rejected. You can try again when ready.";
    if (Number(code) === -32002) return "A wallet request is already pending. Open MetaMask to finish it.";
    if (/revert|gas|insufficient funds/i.test(error.message || "")) return "Transaction failed. Check ownership, cooldown, level-up fee, and your Ganache ETH balance, then refresh your army.";
    return error.userMessage || "Could not contact the wallet or contract. Check Ganache, the selected network, and your deployment, then try again.";
  }
  function fail(message: string): never { const error: AppError = new Error(message); error.userMessage = message; throw error; }
  async function guard(action: () => Promise<void>): Promise<void> {
    if (busy) return;
    try { await action(); } catch (error) { status(friendly(error), "error"); } finally { controls(); }
  }
  function requireConnection() {
    if (!account || !contract) fail("Connect MetaMask to your deployed Ganache network first.");
  }
  function empty(title: string, detail: string): void {
    $("zombies").replaceChildren();
    const div = document.createElement("div"); div.className = "empty";
    const h = document.createElement("h3"); h.textContent = title;
    const p = document.createElement("p"); p.textContent = detail;
    div.append(h, p); $("zombies").append(div);
  }
  function reset() {
    contract = null; account = null; army = [];
    $("account").textContent = "Not connected";
    $("deployment").textContent = "Not loaded";
    $("armyCount").textContent = "0";
    $("fighter").replaceChildren(new Option("No fighters loaded", ""));
    $("battleResult").textContent = "Results come directly from confirmed contract state.";
    empty("The lab is quiet.", "Connect your wallet and load your local deployment.");
    controls();
  }
  // MetaMask access is requested only from the Connect button. No account polling.
  async function connect(requestAccounts = false) {
    const ticket = ++generation;
    reset();
    if (!window.ethereum) fail("MetaMask is not installed. Install MetaMask, add local Ganache, and reload this page.");
    if (typeof Web3 === "undefined") fail("The local Web3 bundle could not load. Serve this project over HTTP and reload.");
    busy = true; controls();
    try {
      // Preserve the starter's Web3 1.2.7 API and use the injected wallet provider.
      web3 = new Web3(window.ethereum);
      const accounts: string[] = await window.ethereum.request({ method: requestAccounts ? "eth_requestAccounts" : "eth_accounts" });
      const [networkId, chainId] = await Promise.all([web3.eth.net.getId(), window.ethereum.request({ method: "eth_chainId" })]);
      if (ticket !== generation) return;
      $("network").textContent = `Network ${networkId} · Chain ${parseInt(chainId, 16)}`;
      if (!accounts.length) { status("MetaMask is not connected. Click Connect MetaMask to choose a Ganache account."); return; }
      account = accounts[0];
      $("account").textContent = short(account); $("account").title = account;
      $("connect").textContent = "Reconnect wallet ↗";
      if (Number(networkId) !== 1337 || parseInt(chainId, 16) !== 1337) fail("Wrong network. Select local Ganache at http://127.0.0.1:7545 with network ID 1337 and chain ID 1337.");
      // Load both ABI and deployment from Truffle's current ZombieOwnership artifact.
      const response = await fetch("build/contracts/ZombieOwnership.json", { cache: "no-store" });
      if (!response.ok) fail("ZombieOwnership artifact is missing. Run truffle compile and truffle migrate --reset, then serve the project root.");
      const artifact: ContractArtifact = await response.json();
      if (ticket !== generation) return;
      const deployment = artifact.networks && artifact.networks[String(networkId)];
      if (!deployment || !deployment.address) fail("ZombieOwnership is not deployed on the selected network.");
      const code = await web3.eth.getCode(deployment.address);
      if (ticket !== generation) return;
      if (!code || /^0x0*$/.test(code)) fail("ZombieOwnership is not deployed on the selected network. Ganache may have restarted; run truffle migrate --reset and reconnect.");
      contract = new web3.eth.Contract(artifact.abi, deployment.address);
      $("deployment").textContent = short(deployment.address); $("deployment").title = deployment.address;
      await loadArmy(ticket);
      if (ticket === generation) status("Wallet connected. Your local zombie lab is ready.", "success");
    } finally { if (ticket === generation) { busy = false; controls(); } }
  }
  // Read every owned zombie and chain time; never convert DNA or token IDs to Number.
  async function loadArmy(ticket = generation) {
    requireConnection();
    const instance = contract, owner = account;
    const ids: string[] = await instance.methods.getZombiesByOwner(owner).call();
    const [zombies, block] = await Promise.all([
      Promise.all(ids.map(async (id): Promise<Zombie> => ({ id: String(id), ...await instance.methods.zombies(id).call() }))),
      web3.eth.getBlock("latest")
    ]);
    if (ticket !== generation) return;
    army = zombies; $("armyCount").textContent = String(army.length);
    $("fighter").replaceChildren(new Option("Choose your fighter", ""));
    $("zombies").replaceChildren();
    if (!army.length) empty("Your army starts here.", "Give your first zombie a name in the Genesis panel.");
    army.forEach(zombie => {
      $("fighter").append(new Option(`#${zombie.id} · ${zombie.name}`, zombie.id));
      renderCard(zombie, Number(block.timestamp));
    });
    controls();
  }
  // Local SVG avatar: DNA controls skin, eyes, scar, shirt, and background.
  function avatar(dna: string): string {
    const digits = String(dna).padStart(16, "0");
    const part = (i: number): number => parseInt(digits.slice(i, i + 2), 10);
    const skin = ["#a4ca7b", "#7ac5aa", "#a6a6d8", "#c4b576"][part(0) % 4];
    const shirt = ["#826eaa", "#c8806d", "#7599bd", "#cab873"][part(2) % 4];
    const eye = 5 + part(4) % 5, scar = 50 + part(6) % 20;
    return `<svg viewBox="0 0 180 180" role="img" aria-label="Zombie avatar generated from DNA"><ellipse cx="90" cy="163" rx="60" ry="8" fill="#101b16"/><path d="M38 164v-22q2-28 52-28t52 28v22" fill="${shirt}"/><path d="M78 108h24v24H78z" fill="${skin}"/><rect x="39" y="60" width="102" height="29" rx="10" fill="${skin}"/><rect x="50" y="26" width="80" height="92" rx="24" fill="${skin}"/><path d="M51 54V38q8-24 36-20l8 8 14-5 18 16 3 20-18-13-8 8-23-11-15 14z" fill="#263429"/><circle cx="72" cy="73" r="${eye + 4}" fill="#e9edcf"/><circle cx="108" cy="73" r="${eye + 4}" fill="#e9edcf"/><circle cx="74" cy="75" r="4" fill="#24372c"/><circle cx="106" cy="75" r="4" fill="#24372c"/><path d="M75 97h31" stroke="#344330" stroke-width="4"/><path d="M82 96v8h7v-8" fill="#fff6dc"/><path d="M${scar} 55l14-9m-12-1 4 9m1-13 4 9" stroke="#526d46" stroke-width="2"/><path d="M64 143l8 10 8-10m32 0-8 10-8-10" fill="none" stroke="#333a36" stroke-width="3"/></svg>`;
  }
  function renderCard(zombie: Zombie, chainTime: number): void {
    const card = $("zombieTemplate").content.firstElementChild!.cloneNode(true) as HTMLElement;
    card.querySelector<HTMLElement>(".portrait")!.innerHTML = avatar(zombie.dna);
    card.querySelector<HTMLElement>(".token")!.textContent = `ZOMBIE #${zombie.id}`;
    card.querySelector<HTMLElement>(".zombie-name")!.textContent = zombie.name;
    for (const [selector, value] of [[".level", zombie.level], [".wins", zombie.winCount], [".losses", zombie.lossCount]]) card.querySelector<HTMLElement>(selector)!.textContent = value;
    const ready = Number(zombie.readyTime) <= chainTime;
    card.querySelector<HTMLElement>(".readiness")!.textContent = ready ? "● Ready" : "◷ Recovering";
    card.querySelector<HTMLElement>(".ready-time")!.textContent = ready ? "Ready for the arena" : `Ready ${new Date(Number(zombie.readyTime) * 1000).toLocaleString()}`;
    card.querySelector<HTMLElement>(".dna")!.textContent = `DNA / ${zombie.dna}`;
    card.querySelector<HTMLElement>(".level-up")!.addEventListener("click", () => guard(async () => {
      requireConnection(); await owns(zombie.id);
      await transact(() => contract.methods.levelUp(zombie.id), "Leveling up your zombie", { value: web3.utils.toWei("0.001", "ether") });
    }));
    const form = card.querySelector<HTMLFormElement>(".transfer-form")!;
    card.querySelector<HTMLElement>(".transfer-toggle")!.addEventListener("click", () => { form.hidden = false; form.querySelector("input")!.focus(); });
    card.querySelector<HTMLElement>(".cancel")!.addEventListener("click", () => { form.hidden = true; });
    // Use the existing transferFrom, checking ownership and recipient before sending.
    form.addEventListener("submit", event => {
      event.preventDefault();
      guard(async () => {
        requireConnection();
        const recipient = form.querySelector("input")!.value.trim();
        if (!web3.utils.isAddress(recipient) || same(recipient, ZERO)) fail("Enter a valid, nonzero Ethereum recipient address.");
        if (same(recipient, account)) fail("Choose a different recipient account.");
        await owns(zombie.id);
        await transact(() => contract.methods.transferFrom(account, recipient, zombie.id), `Transferring zombie #${zombie.id}`);
      });
    });
    $("zombies").append(card);
  }
  async function owns(id: string): Promise<void> {
    const ticket = generation;
    const owner = await contract.methods.ownerOf(id).call();
    if (ticket !== generation) fail("Wallet changed. Please retry with your current account.");
    if (!same(owner, account)) fail("This wallet no longer owns that zombie. Click Show Zombies to refresh.");
  }
  // One transaction path provides estimate, confirmation, hash, and refresh feedback.
  async function transact(
    makeMethod: () => any,
    label: string,
    options: TransactionOptions = {},
    resultText?: (receipt: TransactionReceipt) => Promise<string>
  ): Promise<void> {
    requireConnection();
    const ticket = generation, sender = account;
    busy = true; controls();
    let hash = "";
    try {
      status(`${label}. Checking transaction…`, "pending");
      const method = makeMethod();
      const gas = await method.estimateGas({ from: sender, ...options });
      if (ticket !== generation) fail("Wallet changed. Please retry with your current account.");
      status(`${label}. Confirm in MetaMask…`, "pending");
      const receipt: TransactionReceipt = await method.send({ from: sender, ...options, gas: Math.ceil(Number(gas) * 1.2) }).on("transactionHash", (value: string) => {
        hash = value;
        if (ticket === generation) status(`${label}. Waiting for confirmation…`, "pending", hash);
      // Web3 1.2.7 also emits errors; attach a listener so the awaited rejection
      // is handled below without an additional uncaught EventEmitter error.
      }).on("error", () => {});
      if (receipt.status === false || receipt.status === "0x0") fail("Transaction failed on the blockchain. Refresh and try again.");
      if (ticket !== generation) return;
      let text = `${label}: confirmed.`;
      if (resultText) {
        try { text = await resultText(receipt); }
        catch (error) {
          console.error(error);
          text += " Result read failed; click Show Zombies to inspect updated state.";
        }
      }
      if (ticket !== generation) return;
      status(text, "success", hash || receipt.transactionHash);
      try { await loadArmy(ticket); } catch (error) {
        if (ticket === generation) status(`${text} Refresh failed; click Show Zombies to retry.`, "success", hash || receipt.transactionHash);
        console.error(error);
      }
    } catch (error) {
      if (ticket === generation) status(friendly(error), "error", hash);
    } finally { if (ticket === generation) { busy = false; controls(); } }
  }
  $("connect").addEventListener("click", () => guard(() => connect(true)));
  $("refresh").addEventListener("click", () => guard(async () => {
    busy = true; controls(); status("Loading your army…", "pending");
    try { await loadArmy(); status(army.length ? "Your army is up to date." : "No zombies owned yet. Create your first zombie in the Genesis panel."); }
    finally { busy = false; controls(); }
  }));
  $("createForm").addEventListener("submit", event => {
    event.preventDefault();
    guard(async () => {
      requireConnection();
      const name = $("zombieName").value.trim();
      if (!name || Array.from(name).length > 32) fail("Enter a zombie name between 1 and 32 characters.");
      if (army.length) fail("You already own zombies. Win a battle or receive a transfer to grow your army.");
      await transact(() => contract.methods.createRandomZombie(name), `Creating ${name}`);
    });
  });
  // Battle outcomes are computed from before/after chain state at the receipt block.
  $("battleForm").addEventListener("submit", event => {
    event.preventDefault();
    guard(async () => {
      requireConnection();
      const ticket = generation, instance = contract, id = $("fighter").value, enemy = $("enemy").value.trim();
      if (!id) fail("Choose one of your zombies to battle.");
      if (!/^\d+$/.test(enemy) || !web3.utils.toBN(enemy).lt(web3.utils.toBN(2).pow(web3.utils.toBN(256)))) fail("Enter a valid enemy zombie ID.");
      if (web3.utils.toBN(id).eq(web3.utils.toBN(enemy))) fail("A zombie cannot battle itself.");
      await owns(id);
      const enemyOwner = await instance.methods.ownerOf(enemy).call();
      if (ticket !== generation) fail("Wallet changed. Please retry.");
      if (same(enemyOwner, ZERO)) fail("That enemy zombie does not exist.");
      if (same(enemyOwner, account)) fail("Choose an enemy owned by another account.");
      const [before, block] = await Promise.all([instance.methods.zombies(id).call(), web3.eth.getBlock("latest")]);
      if (ticket !== generation) fail("Wallet changed. Please retry.");
      if (Number(before.readyTime) > Number(block.timestamp)) fail(`Your fighter is recovering until ${new Date(Number(before.readyTime) * 1000).toLocaleString()}. Refresh after the cooldown.`);
      await transact(() => instance.methods.attack(id, enemy), `Battling zombie #${enemy}`, {}, async receipt => {
        const after = await instance.methods.zombies(id).call({}, receipt.blockNumber);
        const won = web3.utils.toBN(after.winCount).gt(web3.utils.toBN(before.winCount));
        const text = `${won ? "Victory!" : "Defeat."} Zombie #${id}: level ${after.level}, ${after.winCount} wins / ${after.lossCount} losses.`;
        if (ticket === generation) $("battleResult").textContent = text;
        return text;
      });
    });
  });
  // Invalidate pending reads on wallet changes and rediscover the selected deployment.
  if (window.ethereum && window.ethereum.on) {
    window.ethereum.on("accountsChanged", () => { busy = false; guard(() => connect()); });
    window.ethereum.on("chainChanged", () => { busy = false; guard(() => connect()); });
    window.ethereum.on("disconnect", () => { ++generation; busy = false; reset(); status("Wallet disconnected. Reconnect MetaMask to continue.", "error"); });
  }
  controls();
  guard(() => connect());
})();
