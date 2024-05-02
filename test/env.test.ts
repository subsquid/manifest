import { Manifest, ManifestParsingError } from '../src';

describe('Env', () => {
  it('should return validation error if env is array / object', () => {
    const { error } = Manifest.parse(`
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

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.processor.env.ARRAY" must be a string',
        '"deploy.processor.env.OBJECT" must be a string',
        '"deploy.api.env.ARRAY" must be a string',
        '"deploy.api.env.OBJECT" must be a string',
      ]),
    );
  });

  it('should require env name', () => {
    const { error } = Manifest.parse(`
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

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.processor.env.-invalid" is not allowed',
        '"deploy.api.env.0invalid" is not allowed',
      ]),
    );
  });

  it('should convert env booleans and numbers to strings', () => {
    const { value } = Manifest.parse(`
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

    expect(value).toMatchObject({
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
