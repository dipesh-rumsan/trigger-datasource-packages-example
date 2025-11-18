import TriggerContract from "../artifacts/contracts/src/trigger.sol/TriggerContract.json";

export type ContractArtifact = typeof TriggerContract;
export type ContractArtifactMap = Record<string, ContractArtifact>;

const artifacts: ContractArtifactMap = {
  TriggerContract,
};

export { TriggerContract };
export default artifacts;


