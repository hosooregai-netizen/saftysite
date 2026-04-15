import { ADMIN_FEATURE_CONTRACTS } from './contracts/adminContracts';
import { ERP_FEATURE_CONTRACTS } from './contracts/erpContracts';
import type { FeatureContract } from './contracts/shared';

export type FeatureContractId =
  | keyof typeof ADMIN_FEATURE_CONTRACTS
  | keyof typeof ERP_FEATURE_CONTRACTS;

export const FEATURE_CONTRACTS = {
  ...ADMIN_FEATURE_CONTRACTS,
  ...ERP_FEATURE_CONTRACTS,
} as const satisfies Record<FeatureContractId, FeatureContract>;

export const FEATURE_CONTRACT_IDS = Object.keys(FEATURE_CONTRACTS) as FeatureContractId[];

export function getFeatureContract(id: FeatureContractId) {
  return FEATURE_CONTRACTS[id];
}

export function isFeatureContractId(value: string): value is FeatureContractId {
  return value in FEATURE_CONTRACTS;
}
