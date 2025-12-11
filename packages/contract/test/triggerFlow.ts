import { expect } from "chai";
import { network } from "hardhat";

describe("Trigger Contract", async function () {
  let oracle: any;
  let trigger: any;
  let triggerId: bigint;

  const { ethers } = await network.connect();

  const log = (msg: string) => console.log(`\x1b[36m${msg}\x1b[0m`);

  // ---------------------------------------------------------------------------
  // 1. DEPLOY SOURCE ORACLE + CREATE SOURCES
  // ---------------------------------------------------------------------------
  it("Should deploy SourceOracle and create 5 sources", async function () {
    oracle = await ethers.deployContract("SourceOracle");
    await oracle.waitForDeployment();
    log("✅ Deploying SourceOracle contract: Success");

    // create 5 sources
    for (let i = 0; i < 5; i++) {
      const tx = await oracle.createSource({
        name: `source-${i}`,
        value: 0,
        unit: "unit",
        decimal: 0,
      });
      await tx.wait();
    }

    // update values → 10, 20, 30, 40, 50
    for (let i = 1; i <= 5; i++) {
      await oracle.updateSourceValue(i, i * 10);
    }

    log("✅ Created 5 sources and updated values");
  });

  // ---------------------------------------------------------------------------
  // 2. DEPLOY TRIGGER CONTRACT
  // ---------------------------------------------------------------------------
  it("Should deploy Trigger contract", async function () {
    trigger = await ethers.deployContract("TriggerContract", [oracle.target]);
    await trigger.waitForDeployment();
    log("✅ Deploying Trigger contract: Success");
  });

  // ---------------------------------------------------------------------------
  // 3. CREATE TRIGGER (sourceId = 3)
  // ---------------------------------------------------------------------------
  it("Should add trigger with threshold", async function () {
    const sourceId = 3; // value = 30
    const threshold = 35;

    const tx = await trigger.createTrigger(sourceId, threshold, "FloodAlert");
    const receipt = await tx.wait();

    const event = receipt!.logs
      .map((log: any) => {
        try {
          return trigger.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "TriggerCreated");

    triggerId = event?.args?.id;
    expect(triggerId).to.not.be.undefined;

    const t = await trigger.triggers(triggerId);
    expect(t.sourceId).to.equal(sourceId);
    expect(t.triggered).to.be.false;

    log(`✅ Added trigger (triggerId: ${triggerId})`);
  });

  // ---------------------------------------------------------------------------
  // 4. FAIL ACTIVATION (value lower than threshold)
  // ---------------------------------------------------------------------------
  it("Should fail to activate trigger when source value is below threshold", async function () {
    // sourceId=3 → value=30, threshold=35
    await expect(trigger.activateTrigger(triggerId)).to.be.revertedWith(
      "threshold not reached"
    );

    log("✅ Reverted correctly when source value < threshold");
  });

  // ---------------------------------------------------------------------------
  // 5. PASS ACTIVATION (value higher after update)
  // ---------------------------------------------------------------------------
  it("Should activate trigger when source value exceeds threshold", async function () {
    // Update value above threshold
    await oracle.updateSourceValue(3, 40);

    await expect(trigger.activateTrigger(triggerId))
      .to.emit(trigger, "TriggerActivated")
      .withArgs(triggerId);

    const t = await trigger.triggers(triggerId);
    expect(t.triggered).to.be.true;

    log("✅ Trigger activated successfully");
  });

  // ---------------------------------------------------------------------------
  // 6. PREVENT DOUBLE-TRIGGERING
  // ---------------------------------------------------------------------------
  it("Should not allow activating trigger twice", async function () {
    await expect(trigger.activateTrigger(triggerId)).to.be.revertedWith(
      "already triggered"
    );

    log("✅ Prevented double-triggering");
  });

  // ---------------------------------------------------------------------------
  // 7. INVALID TRIGGER ID
  // ---------------------------------------------------------------------------
  it("Should fail with invalid trigger ID", async function () {
    const invalidId = 999;

    await expect(trigger.activateTrigger(invalidId)).to.be.revertedWith(
      "trigger not found"
    );

    log("✅ Invalid trigger ID check works correctly");
  });
});
