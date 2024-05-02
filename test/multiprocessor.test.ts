import { Manifest, ManifestParsingError } from '../src';

describe('Multiprocessor', () => {
  it('should check processor name uniqueness', () => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: 1qwerty12
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
      - name: proc1
        cmd: [ "node", "lib/processor" ]
      - name: proc1
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toEqual(
      new ManifestParsingError([`Processor names must be unique within a squid`]),
    );
  });

  it('should validate both processors and print errors with indexes', () => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: 1qwerty12
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
      - name: proc1
        cmd: [ "ENV=test", "node", "lib/processor" ]
      - name: proc2
        cmd: [ "ENV=test", "node", "lib/processor" ]
    `);

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.processor[0].cmd[0]" with value "ENV=test" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
        '"deploy.processor[1].cmd[0]" with value "ENV=test" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
      ]),
    );
  });
});
