import { Manifest } from '../src';

describe('Syntax errors', () => {
  it('should return indentation error', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: sasdasd
      version: 1
       build:
      deploy:
        api:
          cmd: [ "npx", "squid-graphql-server" ]
        processor:
          cmd: [ "node", "lib/processor" ]
    `);

    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      `1) bad indentation of a mapping entry (5:13)

 2 |       manifest_version: subsquid.io/v0.1
 3 |       name: sasdasd
 4 |       version: 1
 5 |        build:
-----------------^
 6 |       deploy:
 7 |         api:`,
    ]);
  });
});
