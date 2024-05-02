import { Expression, Parser } from '@subsquid/manifest-expr';
import yaml from 'js-yaml';
import { cloneDeep, defaultsDeep, get, isNil, mapValues, omitBy, set } from 'lodash';

import { manifestSchema } from './schema';
import { ManifestValue, ManifestProcessor, ManifestDeploymentConfig } from './types';

export type ManifestParsingOptions = {
  validation?: { allowUnknown?: boolean };
};

export interface Manifest extends ManifestValue {
  manifestVersion?: never;
  deploy?: Omit<ManifestDeploymentConfig, 'processor' | 'migrate'> & {
    processor: ManifestProcessor[];
  };
}

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
      defaultsDeep(this, {
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

  eval(context: Record<string, any>): ManifestValue {
    const { error: parseError, value: parsed } = this.parse();
    if (parseError) {
      throw parseError;
    }

    const _eval = (env: Record<string, Expression> | undefined, path: string) => {
      return mapValues(env, (value, key) => {
        try {
          return value.eval(context);
        } catch (e) {
          throw new ManifestEvaluatingError('Evaluation error occurred', [
            getError(`${path}.${key}`, get(this as ManifestValue, `${path}.${key}`), e),
          ]);
        }
      });
    };

    const raw = this.toObject();

    return {
      ...raw,
      deploy: defaultsDeep(
        {
          env: _eval(parsed.env, 'deploy.env'),
          init: { env: _eval(parsed.init.env, 'deploy.init.env') },
          api: { env: _eval(parsed.api.env, 'deploy.api.env') },
          processor: parsed.processor.map((p, index) =>
            defaultsDeep(
              {
                env: _eval(p.env, `deploy.processor.[${index}].env`),
              },
              raw.deploy?.processor?.[index],
            ),
          ),
        },
        raw.deploy,
      ),
    };
  }

  variables(path?: string[]) {
    const res: Set<string> = new Set();

    const { error: parseError, value: parsed } = this.parse();
    if (parseError) {
      throw parseError;
    }

    const _variables = (env: Record<string, Expression> | undefined) => {
      mapValues(env, value => value.variables(path).forEach(v => res.add(v)));
    };

    _variables(parsed.env);
    _variables(parsed.init.env);
    _variables(parsed.api.env);
    parsed.processor?.forEach(p => _variables(p.env));

    return [...res];
  }

  private parse() {
    const parser = new Parser();
    const errors: string[] = [];

    const _parse = (env: Record<string, string> | undefined, path: string) => {
      return env
        ? mapValues(env, (value, key) => {
            try {
              return parser.parse(value);
            } catch (e: unknown) {
              errors.push(getError(`${path}.${key}`, value, e));
              return new Expression(['']);
            }
          })
        : undefined;
    };

    const res = {
      env: _parse(this.deploy?.env, 'deploy.env'),
      init: { env: _parse(this.deploy?.init?.env, 'deploy.init.env') },
      api: { env: _parse(this.deploy?.api?.env, 'deploy.api.env') },
      processor:
        this.deploy?.processor?.map((p, index) => ({
          env: _parse(p.env, `deploy.processor.[${index}].env`),
        })) || [],
    };

    return errors.length > 0
      ? { error: new ManifestEvaluatingError(`Evaluation error occurred`, errors) }
      : { value: res };
  }

  static validate(value: Partial<ManifestValue>, options: ManifestParsingOptions = {}) {
    const res = manifestSchema.validate(value, {
      allowUnknown: options.validation?.allowUnknown,
      abortEarly: false,
      convert: true,
    });

    if (res.error) {
      return {
        error: new ManifestParsingError(
          'Validation error occurred',
          res.error.details?.map(e => e.message),
        ),
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

      ['build', 'deploy.api', 'deploy.addons.postgres'].map(path => {
        if (get(raw, path) === null) {
          set(raw, path, {});
        }
      });

      const { error, value } = this.validate(raw, options);

      if (error) {
        return { error };
      }

      return {
        value: new Manifest(value),
      };
    } catch (e: unknown) {
      return {
        error: new ManifestParsingError(`Parsing error occurred`, [
          e instanceof Error ? e.message : String(e),
        ]),
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

export class ManifestEvaluatingError extends Error {
  constructor(message: string, details: string[] = []) {
    super([message + ':', ...details.map((v, i) => `  ${i + 1}) ${v}`)].join('\n'));
  }
}

export class ManifestParsingError extends Error {
  constructor(message: string, details: string[] = []) {
    super([message + ':', ...details.map((v, i) => `  ${i + 1}) ${v}`)].join('\n'));
  }
}
