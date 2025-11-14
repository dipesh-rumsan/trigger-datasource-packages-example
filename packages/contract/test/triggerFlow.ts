import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Trigger → Phased Condition Flow", function () {
  let trigger: any;
  let triggerId: bigint;

  const log = (msg: string) => console.log(`\x1b[36m${msg}\x1b[0m`);

  it("Should deploy Trigger contract", async function () {
    trigger = await ethers.deployContract("TriggerContract", []);
    await trigger.waitForDeployment();
    log("✅ Deploying Trigger contract: Success");
  });

  it("Should add new trigger with Preparedness phase", async function () {
    const conditionStruct = {
      value: 5,
      operator: ">=",
      source: "water_level_m",
      expression: "water_level_m >= 5",
      sourceSubType: "warning_level",
    };

    const tx = await trigger.addTrigger(conditionStruct);
    const receipt = await tx.wait();

    const event = receipt!.logs
      .map((log: any) => {
        try {
          return trigger.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "TriggerAdded");

    triggerId = event?.args?.triggerId;
    expect(triggerId).to.not.be.undefined;

    const t = await trigger.getTrigger(triggerId);
    expect(t.phase).to.equal("Preparedness");

    log(`✅ Added trigger in Preparedness phase (triggerId: ${triggerId})`);
  });

  it("Should move trigger phase from Preparedness → Readiness", async function () {
    const tx = await trigger.updatePhase(triggerId, "Readiness");
    await tx.wait();

    const t = await trigger.getTrigger(triggerId);
    expect(t.phase).to.equal("Readiness");

    log("✅ Trigger phase updated to Readiness");
  });

  it("Should fail to activate trigger in Readiness phase if condition not met", async function () {
    const observedValue = 2;
    await expect(
      trigger.setTrigger(triggerId, observedValue)
    ).to.be.revertedWith("Condition not met");

    const t = await trigger.getTrigger(triggerId);
    expect(t.phase).to.equal("Readiness");

    log("✅ Condition check failed correctly during Readiness phase");
  });

  it("Should activate trigger when condition is met → Activation phase", async function () {
    const observedValue = 6;
    await expect(trigger.setTrigger(triggerId, observedValue))
      .to.emit(trigger, "TriggerActivated")
      .withArgs(triggerId, observedValue);

    const t = await trigger.getTrigger(triggerId);
    expect(t.isTriggered).to.be.true;
    expect(t.phase).to.equal("Activation");

    log("✅ Trigger successfully activated and phase updated to Activation");
  });

  it("Should not allow phase downgrade once Activated", async function () {
    await expect(
      trigger.updatePhase(triggerId, "Readiness")
    ).to.be.revertedWith("Cannot downgrade phase after activation");

    log("✅ Phase downgrade prevented after activation");
  });
});
