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
      new ManifestParsingError('Validation error occurred', [
        `Processor names must be unique within a squid`,
      ]),
    );
  });
});
