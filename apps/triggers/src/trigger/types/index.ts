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

export type TriggerContractWriter = {
  addTrigger: (condition: TriggerConditionPayload) => Promise<{
    hash: string;
    wait: () => Promise<unknown>;
  }>;
};
