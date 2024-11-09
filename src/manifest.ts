import yaml from 'js-yaml';
import { cloneDeep, defaultsDeep, get, mapValues, set } from 'lodash';

import { ManifestEvaluatingError, ManifestParsingError } from './errors';
import { Expression, Parser } from './expression';
import { manifestSchema } from './schema';
import { DeepPartial, ManifestDeploymentConfig, ManifestProcessor, ManifestValue } from './types';

export type ManifestParsingOptions = {
  validation?: { allowUnknown?: boolean };
};

export interface Manifest extends ManifestValue {
  manifestVersion?: never;
  deploy?: Omit<ManifestDeploymentConfig, 'processor' | 'migrate'> & {
    processor: ManifestProcessor[];
  };
}

const DEFAULT_MIGRATION = ['npx', 'squid-typeorm-migration', 'apply'];

export class Manifest {
  constructor(value: ManifestValue) {
    defaultsDeep(this, value);

    if (this.manifestVersion) {
      this.manifest_version = this.manifestVersion;
      delete this.manifestVersion;
    }

    // Duck typings and legacy manifests
    if (this.deploy?.processor === null) {
      this.deploy.processor = [];
    } else if (this.deploy?.processor && !Array.isArray(this.deploy?.processor)) {
      const proc = this.deploy?.processor as ManifestProcessor;
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
      defaultsDeep(this, <DeepPartial<ManifestValue>>{
        scale: {
          dedicated: false,
        },
      });
    }

    if (this.deploy?.api) {
      defaultsDeep(this, <DeepPartial<ManifestValue>>{
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
      defaultsDeep(this, <DeepPartial<ManifestValue>>{
        deploy: {
          addons: {
            postgres: {
              config: {},
            },
          },
          init: {
            cmd: [...DEFAULT_MIGRATION],
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

    if (this.deploy?.addons?.neon) {
      defaultsDeep(this, <DeepPartial<ManifestValue>>{
        deploy: {
          addons: {
            neon: {},
          },
          init: {
            cmd: [...DEFAULT_MIGRATION],
          },
        },
        scale: {
          addons: {
            neon: {
              autoscaling_limit_min_cu: '0.25',
              autoscaling_limit_max_cu: '0.25',
            },
          },
        },
      });
    }

    if (this.deploy?.addons?.hasura) {
      defaultsDeep(this, {
        deploy: {
          addons: {
            hasura: {},
          },
        },
        scale: {
          addons: {
            hasura: {
              replicas: 1,
              profile: 'small',
            },
          },
        },
      });
    }
  }

  squidName() {
    return this.name;
  }

  slotName() {
    return this.slot || (this.version ? `v${this.version}` : undefined);
  }

  values(): ManifestValue {
    return this.toObject();
  }

  toObject() {
    return {
      manifest_version: this.manifest_version,
      name: this.name,
      description: this.description,
      version: this.version,
      build: cloneDeep(this.build),
      deploy: cloneDeep(this.deploy),
      scale: cloneDeep(this.scale),
      queries: cloneDeep(this.queries),
    };
  }

  toString(pretty = false) {
    return yaml.dump(this.values(), { indent: pretty ? 2 : undefined });
  }

  toYaml(): string {
    return yaml.dump(this.values());
  }

  private getAllEnvPaths() {
    return [
      'deploy.env',
      'deploy.init.env',
      'deploy.api.env',
      'deploy.addons.hasura.env',
      ...(this.deploy?.processor.map((p, index) => `deploy.processor.[${index}].env`) || []),
    ];
  }

  eval(context: Record<string, unknown>): ManifestValue {
    const raw = this.toObject();
    const paths = this.getAllEnvPaths();
    const parser = new Parser();
    const errors: string[] = [];

    for (const path of paths) {
      const envObject = get(raw, path);
      if (!envObject) continue;

      set(
        raw,
        path,
        mapValues(envObject, (value, key) => {
          let expr: Expression;
          try {
            expr = parser.parse(value);
          } catch (e) {
            errors.push(getError(`${path}.${key}`, value, e));
            return value;
          }

          try {
            return expr.eval(context);
          } catch (e) {
            errors.push(getError(`${path}.${key}`, value, e));
            return value;
          }
        }),
      );
    }

    if (errors.length) {
      throw new ManifestEvaluatingError(errors);
    }

    return raw;
  }

  variables(prefix: string[] = []): string[] {
    const raw = this.toObject();
    const paths = this.getAllEnvPaths();
    const parser = new Parser();
    const errors: string[] = [];
    const result = new Set<string>();

    for (const path of paths) {
      const envObject: Record<string, string> = get(raw, path);
      if (!envObject) continue;

      for (const [key, value] of Object.entries(envObject)) {
        let expr: Expression;
        try {
          expr = parser.parse(value);
        } catch (e) {
          errors.push(getError(`${path}.${key}`, value, e));
          continue;
        }

        for (const name of expr.variables(prefix)) {
          result.add(name);
        }
      }
    }

    if (errors.length) {
      throw new ManifestParsingError(errors);
    }

    return Array.from(result);
  }

  static validate(value: Partial<ManifestValue>, options: ManifestParsingOptions = {}) {
    const res = manifestSchema.validate(value, {
      allowUnknown: options.validation?.allowUnknown,
      abortEarly: false,
      convert: true,
    });

    if (res.error) {
      return {
        error: new ManifestParsingError(res.error.details?.map(e => e.message)),
      };
    } else {
      return {
        value: res.value as ManifestValue,
      };
    }
  }

  static parse(str: string, options: ManifestParsingOptions = {}) {
    try {
      const raw = yaml.load(str || '{}') as Partial<ManifestValue>;

      [
        'build',
        'deploy.api',
        'deploy.cors',
        'deploy.addons.postgres',
        'deploy.addons.hasura',
        'deploy.addons.neon',
      ].map(path => {
        if (get(raw, path) === null) {
          set(raw, path, {});
        }
      });

      const { error, value } = this.validate(raw, options);
      if (error) return { error };

      return {
        value: new Manifest(value),
      };
    } catch (e: unknown) {
      return {
        error: new ManifestParsingError([e instanceof Error ? e.message : String(e)]),
      };
    }
  }

  static replace(str: string, { name, slot, tag }: { name?: string; slot?: string; tag?: string }) {
    const manifest = yaml.load(str) as Partial<ManifestValue>;

    if (name) {
      manifest.name = name;
    }

    if (slot) {
      manifest.slot = slot;
      delete manifest.tag;
      delete manifest.version;
    } else if (tag) {
      manifest.tag = tag;
      delete manifest.slot;
      delete manifest.version;
    }

    return yaml.dump(manifest, {
      lineWidth: -1,
      styles: {
        'tag:yaml.org,2002:null': 'empty',
      },
    });
  }
}

function getError(path: string, expression: string | undefined, error: any) {
  const exprIn = expression ? ` for "${expression}" expression` : '';

  return [
    `Manifest env variable "${path}" can not be mapped${exprIn}`,
    error instanceof Error ? error.message : error.toString(),
  ].join(': ');
}
