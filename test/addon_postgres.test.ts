import { Manifest } from '../src';

describe('Addon Postgres', () => {
  it('should accept rpc with dots', () => {
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
          - acala.http
    `);

    expect(m.hasError()).toEqual(false);
  });

  it('should restrict unknown network', () => {
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
          - unknown
    `);

    expect(m.hasError()).toEqual(true);
  });
});
