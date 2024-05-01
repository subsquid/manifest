export type ManifestProcessor = {
  name: string;
  cmd?: string[];
  env?: Record<string, string>;
};

export type ManifestDeploymentConfig = {
  /**
   * @deprecated
   */
  secrets?: string[];

  env?: Record<string, string>;
  addons?: {
    postgres?: {
      version: string;
      config?: {
        statement_timeout: number;
        log_min_duration_statement: number;
        max_locks_per_transaction: number;
        max_pred_locks_per_transaction: number;
      };
    };
    rpc?: string[];
  };
  api?: {
    cmd?: string[];
    env?: Record<string, string>;
  };
  init?: {
    cmd?: string[];
    env?: Record<string, string>;
  };
  processor: ManifestProcessor | ManifestProcessor[];

  /** @deprecated */
  migrate?: ManifestDeploymentConfig['init'];
};

export type ManifestScaleConfig = {
  dedicated?: boolean;
  addons?: {
    postgres?: {
      storage: string;
      profile: 'small' | 'medium' | 'large';
      default_storage?: boolean;
    };
  };
  api?: {
    replicas?: number;
    profile: 'small' | 'medium' | 'large';
  };
  processor?: {
    profile: 'small' | 'medium' | 'large';
  };
};

export type ManifestBuildConfig = {
  dockerfile: string;
  // target: string;
  node_version: '16' | '18' | '20' | '21';
  package_manager: 'auto' | PackageManager;
  install?: {
    cmd: string[];
  };
  cmd?: string[];
};

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export type ManifestValue = {
  /**
   * @deprecated
   */
  manifestVersion?: string;

  manifest_version: string;
  name: string;
  version: number;
  description?: string;
  queries?: Record<string, string>;

  build?: ManifestBuildConfig;
  deploy?: ManifestDeploymentConfig;
  scale?: ManifestScaleConfig;
};
