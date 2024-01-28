import Joi from 'joi';

export const extendedJoi = Joi.extend(
  joi => ({
    type: 'string',
    base: joi.string().meta({ type: 'string' }),
    coerce: {
      from: 'number',
      method(value: unknown) {
        return { value: String(value) };
      },
    },
  }),
  joi => ({
    type: 'envString',
    base: joi.string().meta({ type: 'string' }),
    coerce: {
      from: ['number', 'boolean'],
      method(value: unknown) {
        return { value: String(value) };
      },
    },
  }),
);

interface Joi extends Joi.Root {
  envString(): Joi.StringSchema;
}
