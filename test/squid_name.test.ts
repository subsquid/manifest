import { Manifest } from '../src';

describe('Squid name', () => {
  it('should require squid name and version', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) The squid name is required',
      '2) The squid version is required',
    ]);
  });

  it('should convert squid name as number to a string', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: 1
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(m.squidName()).toBe('1');
  });

  it('should validate number overflows in names', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: 12364656565656556565655665565665656
      version: 12364656565656556565655665565665656
      build:
      deploy:
        api:
          cmd: [ "npx", "squid-graphql-server" ]
        processor:
          cmd: [ "node", "lib/processor" ]
    `);

    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) The squid name "1.2364656565656557e+34" is invalid. Only lowercase latin letters, numbers and the dash symbol are allowed for the squid name. The squid name cannot start with a dash',
      '2) The squid version "1.2364656565656557e+34" is invalid. Must be a number from 1 to 1000000',
    ]);
  });

  it('should validate if squid name start with "-"', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: -testsquid
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(m.squidName()).toBe('-testsquid');
    expect(m.hasError()).toEqual(true);
    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      `1) The squid name "-testsquid" is invalid. Only lowercase latin letters, numbers and the dash symbol are allowed for the squid name. The squid name cannot start with a dash`,
    ]);
  });

  it('should ok on names staring with numbers', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: 1qwerty12
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(m.squidName()).toBe('1qwerty12');
    expect(m.hasError()).toEqual(false);
    expect(m.getErrors()).toEqual([]);
  });

  it('should restrict squid and version containing "/"', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: my/test
    version: my/1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(m.hasError()).toEqual(true);
    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      `1) The squid name "my/test" is invalid. Only lowercase latin letters, numbers and the dash symbol are allowed for the squid name. The squid name cannot start with a dash`,
      '2) "version" must be a number',
    ]);
  });

  it('should restrict squid name with uppercase letters', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: MYSQUID-TEST
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(m.hasError()).toEqual(true);
    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      `1) The squid name "MYSQUID-TEST" is invalid. Only lowercase latin letters, numbers and the dash symbol are allowed for the squid name. The squid name cannot start with a dash`,
    ]);
  });
});
