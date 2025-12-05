import type { ImpactValue, NodeResult, Result } from "axe-core";

export interface ViolationNodeDetails {
  html: string;
  target: string[];
  failureSummary?: string;
  xpath?: string[];
}

export interface ViolationItemDetails {
  id: string;
  impact?: ImpactValue;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: ViolationNodeDetails[];
}

export interface ViolationDetailsReport {
  stepName: string;
  timestamp: string;
  violations: ViolationItemDetails[];
}
