import { Manifest, ManifestParsingError } from '../src';

describe('Validation options', () => {
  it('should should not allow unknown by default', () => {
    const { error } = Manifest.parse(
      `
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    test: 1
    build:
    deploy:
      addons:
        postgres:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `,
    );

    expect(error).toBeInstanceOf(ManifestParsingError);
  });

  it('should should allow unknown', () => {
    const { error, value } = Manifest.parse(
      `
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    test: 1
    build:
    deploy:
     
      addons:
        postgres:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `,
      { validation: { allowUnknown: true } },
    );

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      test: 1,
    });
  });
});
