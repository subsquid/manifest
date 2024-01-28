import { Manifest } from '../src';

describe('Env', () => {
  it('should return validation error if env is array / object', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
          cmd: [ "npx", "squid-graphql-server" ]
          env:
            ARRAY: []
            OBJECT: {}
        processor:
          cmd: [ "node", "lib/processor" ]
          env:
            ARRAY: []
            OBJECT: {}
      `);

    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) "deploy.processor[0].env.ARRAY" must be a string',
      '2) "deploy.processor[0].env.OBJECT" must be a string',
      '3) "deploy.api.env.ARRAY" must be a string',
      '4) "deploy.api.env.OBJECT" must be a string',
    ]);
  });

  it('should require env name', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
          cmd: [ "npx", "squid-graphql-server" ]
          env:
            valid: VALID
            VALID: VALID
            0invalid: TEST
        processor:
          cmd: [ "node", "lib/processor" ]
          env:
            valid: VALID
            VALID: VALID
            -invalid: TEST
      `);

    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) "deploy.processor[0].env.-invalid" is not allowed',
      '2) "deploy.api.env.0invalid" is not allowed',
    ]);
  });

  it('should convert env booleans and numbers to strings', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
          cmd: [ "npx", "squid-graphql-server" ]
          env:
            BOOL: true
            NUMBER: 1
            STRING: 1
        processor:
          cmd: [ "node", "lib/processor" ]
          env:
            BOOL: true
            NUMBER: 1
            STRING: 1
      `);

    expect(m.values()).toMatchObject({
      deploy: {
        api: {
          env: {
            BOOL: 'true',
            NUMBER: '1',
            STRING: '1',
          },
        },
        processor: [
          {
            env: {
              BOOL: 'true',
              NUMBER: '1',
              STRING: '1',
            },
          },
        ],
      },
    });
  });
});
