export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type ManifestProcessor = {
  name: string;
  cmd?: string[];
  env?: Record<string, string>;
};

export type ManifestDeploymentCors = {
  enabled: boolean;
  allow_origin?: string[];
  allow_methods?: string[];
  allow_headers?: string[];
  expose_headers?: string[];
  allow_credentials?: boolean;
  max_age?: number;
};

export type ManifestDeploymentConfig = {
  /**
   * @deprecated
   */
  secrets?: string[];

  cors?: ManifestDeploymentCors;

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
    neon?: {
      version: string;
    };
    hasura?: {
      version?: string;
      env?: Record<string, string>;
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
      storage?: string;
      autoresize?: boolean;
      autoresize_limit?: string;
      profile: 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge';
      default_storage?: boolean;
    };
    hasura?: {
      profile: 'small' | 'medium' | 'large';
      replicas?: number;
    };
    neon?: {
      autoscaling_limit_min_cu: string;
      autoscaling_limit_max_cu: string;
    };
  };
  api?: {
    replicas?: number;
    profile: 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge';
  };
  processor?: {
    profile: 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge';
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
  /**
   * @deprecated
   */
  version?: number;

  manifest_version: string;
  name?: string;
  slot?: string;
  tag?: string;
  description?: string;
  queries?: Record<string, string>;

  build?: ManifestBuildConfig;
  deploy?: ManifestDeploymentConfig;
  scale?: ManifestScaleConfig;
};
