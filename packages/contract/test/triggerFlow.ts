import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Trigger Contract", function () {
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
    expect(t.isTriggered).to.be.false;

    log(`✅ Added trigger in Preparedness phase (triggerId: ${triggerId})`);
  });

  it("Should set trigger to triggered state", async function () {
    const observedValue = 6;
    await expect(trigger.setTriggered(triggerId, observedValue))
      .to.emit(trigger, "TriggerActivated")
      .withArgs(triggerId, observedValue);

    const t = await trigger.getTrigger(triggerId);
    expect(t.isTriggered).to.be.true;

    const storedValue = await trigger.getTriggerValue(triggerId);
    expect(storedValue).to.equal(observedValue);

    log("✅ Trigger successfully set to triggered state");
  });

  it("Should not allow setting trigger to triggered state twice", async function () {
    const observedValue = 7;
    await expect(
      trigger.setTriggered(triggerId, observedValue)
    ).to.be.revertedWith("Trigger already activated");

    log("✅ Prevented double-triggering");
  });

  it("Should fail with invalid trigger ID", async function () {
    const invalidTriggerId = 999;
    await expect(trigger.setTriggered(invalidTriggerId, 5)).to.be.revertedWith(
      "Invalid trigger ID"
    );

    log("✅ Invalid trigger ID check works correctly");
  });
});
