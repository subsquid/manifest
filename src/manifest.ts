import { ValidationError } from 'joi';
import yaml from 'js-yaml';
import { defaultsDeep, get, isPlainObject, set } from 'lodash';

import { manifestSchema } from './schema';

export type ManifestProcessor = {
  name: string;
  cmd?: string[];
  env?: Record<string, string>;
};

export type ManifestOptions = {
  validation?: { allowUnknown?: boolean };
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
  processor?: ManifestProcessor[];
};

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export type ManifestValue = {
  /**
   * @deprecated
   */
  manifestVersion: string;

  manifest_version: string;
  name: string;
  version: number;
  description: string;
  queries: Record<string, string>;

  build: {
    dockerfile: string;
    // target: string;
    node_version: '16' | '18' | '20' | '21';
    package_manager: 'auto' | PackageManager;
    install?: {
      cmd: string[];
    };
    cmd?: string[];
  };
  deploy: ManifestDeploymentConfig;
  scale: {
    dedicated: boolean;
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
};

export class Manifest {
  protected error: string[];

  constructor(
    protected value: Partial<ManifestValue> = {},
    protected options: ManifestOptions = {},
  ) {
    if (value?.manifestVersion) {
      value.manifest_version = value.manifestVersion;
      delete value.manifestVersion;
    }

    // Duck typings and legacy manifests
    if (value?.deploy?.processor === null) {
      value.deploy.processor = [];
    } else if (value?.deploy?.processor && isPlainObject(value?.deploy?.processor)) {
      const proc = value?.deploy?.processor as unknown as ManifestProcessor;
      if (!proc.name) {
        proc.name = 'processor';
      }

      value.deploy.processor = [proc];
    }

    if (value?.deploy && !value?.deploy?.init && 'migrate' in value.deploy) {
      value.deploy.init = value.deploy.migrate as ManifestDeploymentConfig['init'];
      delete value.deploy.migrate;
    }

    this.value = value ?? {};

    this.validate();
  }

  validate() {
    const { error, value } = manifestSchema.validate(this.value, {
      allowUnknown: this.options.validation?.allowUnknown,
      abortEarly: false,
      convert: true,
    });

    this.value = value;

    if (this.value?.scale) {
      this.value = defaultsDeep(this.value, {
        scale: {
          dedicated: false,
        },
      });
    }

    if (this.value?.deploy?.api) {
      this.value = defaultsDeep(this.value, {
        scale: {
          api: {
            replicas: 1,
            profile: 'small',
          },
        },
      });
    }
    if (this.value?.deploy?.processor) {
      this.value = defaultsDeep(this.value, {
        scale: {
          processor: {
            profile: 'small',
          },
        },
      });
    }
    if (this.value?.deploy?.addons?.postgres) {
      this.value = defaultsDeep(this.value, {
        deploy: {
          addons: {
            postgres: {
              config: {},
            },
          },
          init: {
            cmd: ['npx', 'squid-typeorm-migration', 'apply'],
          },
        },
        scale: {
          addons: {
            postgres: {
              storage: '10Gi',
              profile: 'small',
              default_storage: !this.value?.scale?.addons?.postgres?.storage,
            },
          },
        },
      });
    }
    // if (this.value?.deploy?.addons?.redis) {
    //   this.value = defaultsDeep(this.value, {
    //     scale: {
    //       addons: {
    //         redis: {
    //           profile: 'small',
    //         },
    //       },
    //     },
    //   });
    // }

    this.setError(error);

    return error;
  }

  setError(error: ValidationError | Error | any) {
    if (!error) return;

    if ('details' in error) {
      this.error = [
        'Validation error occurred:',
        ...(error as ValidationError).details?.map((e, i) => {
          return `${i + 1}) ${e.message}`;
        }),
      ];
      return;
    }

    if (error instanceof Error) {
      this.error = ['Validation error occurred:', '1) ' + error.message];
      return;
    }

    this.error = ['Validation error occurred:', error.toString()];
  }

  getErrors(): string[] {
    return this.error || [];
  }

  hasError() {
    return Boolean(this.error);
  }

  squidName() {
    return this.value?.name?.toString();
  }

  versionName() {
    return this.value?.version ? `v${this.value?.version}` : undefined;
  }

  values(): Partial<ManifestValue> {
    return this.value;
  }

  toString(pretty = false) {
    return yaml.dump(this.value, { indent: pretty ? 2 : undefined });
  }

  toYaml(): string {
    return yaml.dump(this.value);
  }

  static parse(str: string, options: ManifestOptions = {}) {
    try {
      const value = yaml.load(str || '{}') as object;

      ['build', 'deploy.api', 'deploy.addons.postgres'].map(path => {
        if (get(value, path) === null) {
          set(value, path, {});
        }
      });

      return new Manifest(value, options);
    } catch (e) {
      const m = new Manifest({});
      m.setError(e as Error);

      return m;
    }
  }

  static isEmpty(manifest: Manifest) {
    if (!manifest) return true;
    else if (Object.keys(manifest.values()).length === 0) return true;

    return false;
  }
}
