import { Manifest } from '../src';

describe('Outdated', () => {
  it('should accept old "manifestVersion" props and convert it to "manifest_version"', () => {
    const m = Manifest.parse(`
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
    `);

    expect(m.hasError()).toEqual(false);
  });

  it('should accept rpc with semicolons', () => {
    const m = Manifest.parse(`
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
          - acala:http
    `);

    expect(m.hasError()).toEqual(false);
  });
});
