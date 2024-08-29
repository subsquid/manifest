import { Manifest } from '../src';

describe('Output', () => {
  describe('toYaml', () => {
    it('should return valid yaml', () => {
      const value = Manifest.replace(
        `
    manifest_version: subsquid.io/v0.1
    name: squid
    description: The very first evm squid from manifest
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `,
        { name: 'my-squid' },
      );

      expect(value).toEqual(
        `
manifest_version: subsquid.io/v0.1
name: my-squid
description: The very first evm squid from manifest
version: 1
build: 
deploy:
  api:
    cmd:
      - npx
      - squid-graphql-server
  processor:
    cmd:
      - node
      - lib/processor
`.trimStart(),
      );
    });
  });
});
