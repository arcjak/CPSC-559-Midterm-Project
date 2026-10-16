const ZombieOwnership = artifacts.require("ZombieOwnership");
const { shouldThrow } = require("./helpers/utils");
const time = require("./helpers/time");

contract("ZombieOwnership", accounts => {
  const [alice, bob, carol] = accounts;
  const ZERO = "0x0000000000000000000000000000000000000000";
  let game;
  async function create(name, from) {
    const result = await game.createRandomZombie(name, { from });
    assert.equal(result.receipt.status, true);
    return result.logs.find(log => log.event === "NewZombie").args.zombieId.toString();
  }
  beforeEach(async () => { game = await ZombieOwnership.new(); });

  it("creates and reads each account's starter zombie", async () => {
    const a = await create("Professor Brains", alice);
    const b = await create("Lab Assistant", bob);
    assert.equal((await game.zombies(a)).name, "Professor Brains");
    assert.equal((await game.zombies(a)).level.toString(), "1");
    assert.deepEqual((await game.getZombiesByOwner(alice)).map(String), [a]);
    assert.deepEqual((await game.getZombiesByOwner(bob)).map(String), [b]);
  });
  it("allows only one starter while an account owns zombies", async () => {
    await create("First", alice);
    await shouldThrow(game.createRandomZombie("Second", { from: alice }));
  });
  it("levels a specific zombie for the existing 0.001 ETH fee", async () => {
    const id = await create("Scholar", alice);
    await game.levelUp(id, { from: alice, value: web3.utils.toWei("0.001", "ether") });
    assert.equal((await game.zombies(id)).level.toString(), "2");
    await shouldThrow(game.levelUp(id, { from: alice, value: 0 }));
  });
  it("transfers A to B and updates both armies and balances", async () => {
    const a = await create("Alice", alice);
    const b = await create("Bob", bob);
    await game.transferFrom(alice, bob, a, { from: alice });
    assert.equal(await game.ownerOf(a), bob);
    assert.deepEqual((await game.getZombiesByOwner(alice)).map(String), []);
    assert.deepEqual((await game.getZombiesByOwner(bob)).map(String), [a, b]);
    assert.equal((await game.balanceOf(alice)).toString(), "0");
    assert.equal((await game.balanceOf(bob)).toString(), "2");
    await create("Alice returns", alice);
  });
  it("supports approved callers without debiting their token balance", async () => {
    const id = await create("Approved", alice);
    await game.approve(bob, id, { from: alice });
    await game.transferFrom(alice, carol, id, { from: bob });
    assert.equal(await game.ownerOf(id), carol);
    assert.equal((await game.balanceOf(alice)).toString(), "0");
    assert.equal((await game.balanceOf(bob)).toString(), "0");
    assert.equal((await game.balanceOf(carol)).toString(), "1");
    await shouldThrow(game.transferFrom(carol, bob, id, { from: bob }));
  });
  it("clears approvals even when the original owner initiates transfer", async () => {
    const id = await create("Approval cleanup", alice);
    await game.approve(bob, id, { from: alice });
    await game.transferFrom(alice, carol, id, { from: alice });
    await shouldThrow(game.transferFrom(carol, bob, id, { from: bob }));
  });
  it("rejects unauthorized, zero-address, and incorrect-from transfers", async () => {
    const id = await create("Protected", alice);
    await shouldThrow(game.transferFrom(alice, carol, id, { from: bob }));
    await shouldThrow(game.transferFrom(alice, ZERO, id, { from: alice }));
    await shouldThrow(game.transferFrom(bob, carol, id, { from: alice }));
    assert.equal(await game.ownerOf(id), alice);
  });
  it("battles after cooldown and verifies the actual on-chain outcome", async () => {
    const a = await create("Fighter", alice), b = await create("Enemy", bob);
    await shouldThrow(game.attack(a, b, { from: bob }));
    await time.increase(time.duration.days(1) + 1);
    const result = await game.attack(a, b, { from: alice });
    assert.equal(result.receipt.status, true);
    const fighter = await game.zombies(a), enemy = await game.zombies(b);
    const won = fighter.winCount.toNumber() === 1;
    assert.equal(fighter.winCount.toNumber() + fighter.lossCount.toNumber(), 1);
    assert.equal(enemy.winCount.toNumber() + enemy.lossCount.toNumber(), 1);
    assert.equal(fighter.level.toNumber(), won ? 2 : 1);
    assert.equal(enemy.lossCount.toNumber(), won ? 1 : 0);
    assert.equal((await game.getZombiesByOwner(alice)).length, won ? 2 : 1);
    const block = await web3.eth.getBlock(result.receipt.blockNumber);
    assert.isAbove(fighter.readyTime.toNumber(), Number(block.timestamp));
  });
});
