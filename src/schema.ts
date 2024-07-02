import { extendedJoi as Joi } from './joi';
import { RPC_ENDPOINT_NAMES } from './rpc_networks';
import { ManifestProcessor, ManifestValue } from './types';

export const SECRET_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
export const SQUID_NAME_PATTERN = /^[a-z0-9][a-z0-9\-]*[a-z0-9]$/;
export const DEFAULT_NODE_VERSION = '20';
export const DEFAULT_PACKAGE_MANAGER = 'auto';
export const ENV_NAME_PATTERN = SECRET_NAME_PATTERN;
export const AVAILABLE_MANIFEST_VERSIONS = ['subsquid.io/v0.1'];

const NEON_VALID_CU = ['0.25', '0.5', '1', '2', '3', '4', '8'];

export const JoiSquidName = Joi.string()
  .min(3)
  .max(30)
  .pattern(SQUID_NAME_PATTERN)
  .required()
  .messages({
    'any.required': 'The squid name is required',
    'string.min': 'The squid name must contain at least {#limit} symbol(s)',
    'string.max': 'The squid name must contain no more than {#limit} symbol(s)',
    'string.pattern.base':
      'The squid name "{#value}" is invalid. Only lowercase latin letters, numbers and the dash symbol are allowed for the squid name. The squid name cannot start with a dash',
  });

export const JoiSquidVersionName = Joi.number()
  .integer()
  .max(1000000)
  .positive()
  .required()
  .messages({
    'any.required': 'The squid version is required',
    'number.unsafe': `The squid version "{#value}" is invalid. Must be a number from 1 to 1000000`,
  });

const envSchema = Joi.object().pattern(ENV_NAME_PATTERN, Joi.envString().required());

const cmdSchema = Joi.string()
  .regex(/^[:\-\/\w.]+$/)
  .required()
  .messages({
    'string.pattern.base':
      '{#label} with value "{#value}" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
  });

export const processorSchema = (multi = true) => {
  let nameSchema = Joi.string()
    .regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/)
    .max(63)
    .messages({
      'string.pattern.base':
        '{#label} with value "{#value}" is invalid. Only latin letters, numbers, "-" symbols are allowed.',
    });
  if (multi) {
    nameSchema = nameSchema.required();
  }

  return Joi.object<ManifestProcessor>({
    name: nameSchema,
    env: envSchema,
    cmd: Joi.array().items(cmdSchema).min(1).required(),
  });
};

export const manifestSchema = Joi.object<ManifestValue>({
  manifest_version: Joi.string().valid(...AVAILABLE_MANIFEST_VERSIONS),
  name: JoiSquidName,
  version: JoiSquidVersionName,
  description: Joi.string().trim(),
  queries: Joi.object(),
  build: Joi.object({
    dockerfile: Joi.string().trim().default('Dockerfile'),
    // target: Joi.string().trim().default('squid'),
    node_version: Joi.string().valid('18', '20', '21').default(DEFAULT_NODE_VERSION),
    package_manager: Joi.string()
      .valid('auto', 'npm', 'pnpm', 'yarn')
      .default(DEFAULT_PACKAGE_MANAGER),
    install: Joi.object({
      cmd: Joi.array().items(cmdSchema).min(1).required(),
    }),
    cmd: Joi.array().items(cmdSchema).min(1),
  }).allow(null),

  deploy: Joi.object({
    addons: Joi.object({
      postgres: Joi.object({
        version: Joi.string().valid('14').default('14'),
        config: Joi.object({
          statement_timeout: Joi.number().integer().positive(),
          log_min_duration_statement: Joi.number().integer().positive(),
          max_locks_per_transaction: Joi.number().integer().positive(),
          max_pred_locks_per_transaction: Joi.number().integer().positive(),
        }),
      }).allow(null),

      neon: Joi.object({
        version: Joi.string().valid('16').default('16'),
      }),

      hasura: Joi.object({
        version: Joi.string().default('latest'),
        env: envSchema,
      }).allow(null),

      rpc: Joi.array().items(
        Joi.string()
          .valid(
            ...RPC_ENDPOINT_NAMES,
            // temporary add rpc names with semicolons for backward compatability
            ...RPC_ENDPOINT_NAMES.map(r => r.replace('.', ':')),
          )
          .required(),
      ),
    }),

    env: envSchema,

    init: Joi.object({
      env: envSchema,
      cmd: Joi.array().items(cmdSchema).min(1).required(),
    }).allow(false),

    migrate: Joi.object({
      env: envSchema,
      cmd: Joi.array().items(cmdSchema).min(1).required(),
    })
      .description('[DEPRECATED] Please use "deploy.init" instead')
      .allow(false),

    processor: Joi.alternatives()
      .conditional(Joi.array(), {
        then: Joi.array()
          .items(processorSchema(true))
          .unique((a, b) => a.name === b.name)
          .messages({
            'array.unique': 'Processor names must be unique within a squid',
          })
          .min(1),
        otherwise: processorSchema(false),
      })
      .required(),

    api: Joi.object({
      env: envSchema,
      cmd: Joi.array().items(cmdSchema).min(1).required(),
    }),

    /** @deprecated **/
    secrets: Joi.array()
      .items(Joi.string().regex(SECRET_NAME_PATTERN))
      .description(
        '[DEPRECATED] Please use secrets context https://docs.subsquid.io/cloud/resources/env-variables/#secrets',
      )
      .meta({
        deprecated: true,
      }),
  }).required(),

  scale: Joi.object({
    dedicated: Joi.boolean(),
    addons: Joi.object({
      postgres: Joi.object({
        storage: Joi.string(),
        autoresize: Joi.bool(),
        autoresize_limit: Joi.string(),
        profile: Joi.string().valid('small', 'medium', 'large'),
      }),

      hasura: Joi.object({
        replicas: Joi.number().integer().positive().max(5),
        profile: Joi.string().valid('small', 'medium', 'large'),
      }),

      neon: Joi.object({
        autoscaling_limit_min_cu: Joi.string()
          .valid()
          .default(NEON_VALID_CU[0])
          .valid(...NEON_VALID_CU),

        autoscaling_limit_max_cu: Joi.string()
          .default(NEON_VALID_CU[0])
          .valid(...NEON_VALID_CU),
        // TODO Validate that is equals or higher tha  autoscaling_limit_min_cu
        // .custom((value, helper) => {
        //   helper.schema.;
        //
        //   if (value.length < 8) {
        //     return helper.error(
        //       'autoscaling_limit_max_cu must be equals or greater than "autoscaling_limit_min_cu"',
        //     );
        //   }
        //
        //   return true;
        // }, 'custom validation'),
      }),

      /** @deprecated **/
      rpc: Joi.object({
        'monthly-cap': Joi.string().regex(/\d+[km]/),
        'max-rate': Joi.string().regex(/\d+rp[sm]/),
      })
        .description('[DEPRECATED] Please use billing settings in Cloud UI')
        .meta({
          deprecated: true,
        }),
    }),
    processor: Joi.object({
      profile: Joi.string().valid('small', 'medium', 'large'),
    }).default({ profile: 'small' }),
    api: Joi.object({
      replicas: Joi.number().integer().positive().max(5),
      profile: Joi.string().valid('small', 'medium', 'large'),
    }),
  }),

  /** @deprecated **/
  manifestVersion: Joi.string()
    .description('[DEPRECATED] Please use "manifest_version" instead.')
    .valid(...AVAILABLE_MANIFEST_VERSIONS)
    .meta({ deprecated: true }),
});
