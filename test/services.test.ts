import { Manifest } from '../src';

describe('Services', () => {
  it('should require processor in build section', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      api:
        cmd: ["test"]
    `);

    expect(m.hasError()).toEqual(true);
    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) "deploy.processor" is required',
    ]);
  });

  it('should add defaults to minimal manifest', () => {
    const m = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(m.hasError()).toEqual(false);
    expect(m.values()).toEqual({
      manifest_version: 'subsquid.io/v0.1',
      name: 'test',
      version: 1,
      build: {
        dockerfile: 'Dockerfile',
        node_version: '20',
        package_manager: 'auto',
      },
      deploy: {
        api: {
          cmd: ['npx', 'squid-graphql-server'],
        },
        processor: [
          {
            name: 'processor',
            cmd: ['node', 'lib/processor'],
          },
        ],
      },
      scale: {
        api: {
          replicas: 1,
          profile: 'small',
        },
        processor: {
          profile: 'small',
        },
      },
    });
  });

  it('should require api & processor cmd commands', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
        processor:
    `);

    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) "deploy.processor" must contain at least 1 items',
      '2) "deploy.api.cmd" is required',
    ]);
  });

  it('should restrict envs in cmd', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
          cmd: [ "ENV=test", "npx", "squid-graphql-server" ]
        processor:
          cmd: [ "ENV=test", "node", "lib/processor" ]
    `);

    expect(m.hasError()).toEqual(true);
    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) "deploy.processor[0].cmd[0]" with value "ENV=test" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
      '2) "deploy.api.cmd[0]" with value "ENV=test" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
    ]);
  });

  it('should allow special chars in cmd', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
          cmd: [ "sqd", "test:command" ]
        processor:
          cmd: [ "sqd", "node", "." ]
    `);

    expect(m.hasError()).toEqual(false);
  });

  it('should disallow && in cmd', () => {
    const m = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
          cmd: [ "cd", "test", "&&", "sqd", "test:command" ]
        processor:
          cmd: [ "sqd", "node", "." ]
    `);

    expect(m.hasError()).toEqual(true);
    expect(m.getErrors()).toEqual([
      'Validation error occurred:',
      '1) "deploy.api.cmd[2]" with value "&&" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
    ]);
  });
});
