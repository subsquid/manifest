import { Manifest, ManifestParsingError } from '../src';

describe('Addon RPC', () => {
  it('should accept rpc with dots', () => {
    const { error } = Manifest.parse(`
    manifestVersion: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        name: test
        cmd: [ "node", "lib/processor" ]
      addons:
        rpc:
          - acala.http
    `);

    expect(error).toBeUndefined();
  });

  it('should restrict unknown network', () => {
    const { error } = Manifest.parse(`
    manifestVersion: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        name: test
        cmd: [ "node", "lib/processor" ]
      addons:
        rpc:
          - unknown
    `);

    expect(error).toBeInstanceOf(ManifestParsingError);
  });
});
