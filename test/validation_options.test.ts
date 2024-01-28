import { Manifest } from '../src';

describe('Validation options', () => {
  it('should should not allow unknown by default', () => {
    const m = Manifest.parse(
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

    expect(m.hasError()).toEqual(true);
  });

  it('should should allow unknown', () => {
    const m = Manifest.parse(
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

    expect(m.hasError()).toEqual(false);
    expect(m.values()).toMatchObject({
      test: 1,
    });
  });
});
