export type ChartDatum = {
  label: string;
  value: number;
  other?: boolean;
};

export type FlowDatum = {
  label: string;
  value: number;
};

export type FlowHighlight = {
  index: number;
  top?: string;
  bottom?: string;
};
