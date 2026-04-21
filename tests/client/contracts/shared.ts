export interface FeatureContract {
  apis: string[];
  criticalActions: string[];
  description: string;
  id: string;
  markers: string[];
  routes: string[];
}

export type FeatureContractScope = 'admin' | 'erp';
export type RecoverySliceStatus = 'done' | 'seed';

export interface FeatureContractSmokeScope {
  ids: string[];
  kind: 'client-smoke';
}

export interface RecoverySliceManifest {
  criticalInvariants: string[];
  goal: string;
  id: string;
  ownedGlobs: string[];
  reverseSpecPath: string;
  status: RecoverySliceStatus;
  targetedChecks: string[];
}

export interface FeatureContractMetadata {
  enforceRecoverySlices: boolean;
  ownedGlobs: string[];
  recoverySlices: RecoverySliceManifest[];
  scope: FeatureContractScope;
  smokeScope: FeatureContractSmokeScope;
}

export interface FeatureContractMetadataManifest {
  contracts: Record<string, FeatureContractMetadata>;
  guardedGlobsByScope: Record<FeatureContractScope, string[]>;
}
