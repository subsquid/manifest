import yaml from 'js-yaml';
import { defaultsDeep, get, isPlainObject, mapValues, set } from 'lodash';

import { manifestSchema } from './schema';
import {
  ManifestValue,
  ManifestProcessor,
  ManifestDeploymentConfig,
  ManifestOptions,
} from './types';

export interface Manifest extends ManifestValue {}

export class Manifest {
  constructor(value: Partial<ManifestValue> = {}) {
    defaultsDeep(this, value);

    if (this.manifestVersion) {
      value.manifest_version = value.manifestVersion;
      delete value.manifestVersion;
    }

    // Duck typings and legacy manifests
    if (this.deploy?.processor === null) {
      this.deploy.processor = [];
    } else if (this.deploy?.processor && isPlainObject(this.deploy?.processor)) {
      const proc = value?.deploy?.processor as unknown as ManifestProcessor;
      if (!proc.name) {
        proc.name = 'processor';
      }

      this.deploy.processor = [proc];
    }

    if (this.deploy && !this.deploy?.init && 'migrate' in this.deploy) {
      this.deploy.init = this.deploy.migrate as ManifestDeploymentConfig['init'];
      delete this.deploy.migrate;
    }

    if (this.scale) {
      value = defaultsDeep(value, {
        scale: {
          dedicated: false,
        },
      });
    }

    if (this.deploy?.api) {
      defaultsDeep(this, {
        scale: {
          api: {
            replicas: 1,
            profile: 'small',
          },
        },
      });
    }
    if (this.deploy?.processor) {
      defaultsDeep(this, {
        scale: {
          processor: {
            profile: 'small',
          },
        },
      });
    }
    if (this.deploy?.addons?.postgres) {
      defaultsDeep(this, {
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
              default_storage: !this.scale?.addons?.postgres?.storage,
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
  }

  squidName() {
    return this.name;
  }

  versionName() {
    return `v${this.version}`;
  }

  values(): ManifestValue {
    return defaultsDeep(
      {},
      {
        manifest_version: this.manifest_version,
        name: this.name,
        description: this.description,
        version: this.version,
        build: this.build,
        deploy: this.deploy,
        scale: this.scale,
        queries: this.queries,
      },
    );
  }

  toString(pretty = false) {
    return yaml.dump(this.values(), { indent: pretty ? 2 : undefined });
  }

  toYaml(): string {
    return yaml.dump(this.values());
  }

  static validate(value: Partial<ManifestValue>, options: ManifestOptions = {}) {
    const res = manifestSchema.validate(value, {
      allowUnknown: options.validation?.allowUnknown,
      abortEarly: false,
      convert: true,
    });

    if (res.error) {
      return {
        error: [
          'Validation error occurred:',
          ...res.error.details?.map((e, i) => {
            return `  ${i + 1}) ${e.message}`;
          }),
        ].join('\n'),
      };
    } else {
      return {
        value: res.value,
      };
    }
  }

  static parse(str: string, options: ManifestOptions = {}) {
    try {
      const value = yaml.load(str || '{}') as object;

      ['build', 'deploy.api', 'deploy.addons.postgres'].map(path => {
        if (get(value, path) === null) {
          set(value, path, {});
        }
      });

      const res = this.validate(value, options);

      if (res.error) {
        return res.error;
      }

      return {
        value: new Manifest(res.value),
      };
    } catch (e: unknown) {
      return {
        error: e instanceof Error ? [e.message] : [String(e)],
      };
    }
  }

  static isEmpty(manifest: Partial<ManifestValue> | null | undefined) {
    if (!manifest) return true;

    return Object.keys(manifest).length === 0;
  }
}

function getError(path: string, expression: string | undefined, error: any) {
  const exprIn = expression ? ` for "${expression}" expression` : '';

  return [
    `Manifest env variable "${path}" can not be mapped${exprIn}`,
    error instanceof Error ? error.message : error.toString(),
  ].join(': ');
}
