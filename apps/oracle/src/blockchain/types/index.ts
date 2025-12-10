export type SourceInput = {
  title: string;
  sourceSubType: string;
  value: bigint;
};

export type SourceOracleContractWriter = {
  createSource: (input: SourceInput) => Promise<{
    hash: string;
    wait: () => Promise<unknown>;
  }>;
  updateSourceValue: (
    sourceId: bigint,
    newValue: bigint,
  ) => Promise<{
    hash: string;
    wait: () => Promise<unknown>;
  }>;
};
