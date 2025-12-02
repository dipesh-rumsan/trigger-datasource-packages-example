export type TriggerWithPhase = {
  uuid: string;
  triggerStatement: Record<string, any> | null;
  source: string;
  phase: {
    name: string;
    riverBasin: string | null;
  };
};

export type TriggerConditionPayload = {
  value: bigint;
  source: string;
  operator: string;
  expression: string;
  sourceSubType: string;
};

export type SerializedCondition = {
  value: string;
  source: string;
  operator: string;
  expression: string;
  sourceSubType: string;
};

export type BlockchainJobPayload = {
  triggerUuid: string;
  condition: SerializedCondition;
};

export type BlockchainUpdatePhasePayload = {
  triggerId: string;
  observedValue: string;
};

export type TriggerContractWriter = {
  addTrigger: (condition: TriggerConditionPayload) => Promise<{
    hash: string;
    wait: () => Promise<unknown>;
  }>;
  updateTriggerPhase: (
    triggerId: bigint,
    observedValue: bigint,
  ) => Promise<{
    hash: string;
    wait: () => Promise<unknown>;
  }>;
};
