import { Manifest } from '../src';

describe('Multiprocessor', () => {
  it('should check processor name uniqueness', () => {
    const m = Manifest.parse(`
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

    expect(m.hasError()).toEqual(true);
    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      `1) Processor names must be unique within a squid`,
    ]);
  });
});
