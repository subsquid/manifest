import { Manifest, ManifestParsingError } from '../src';

describe('Services', () => {
  it('should require processor in deploy section', () => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      api:
        cmd: ["test"]
    `);

    expect(error).toEqual(new ManifestParsingError(['"deploy.processor" is required']));
  });

  it('should allow deploy w/o api', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      processor:
        cmd: ["test"]
    scale:
      processor:
        profile: medium
    `);

    expect(error).toEqual(undefined);
    expect(value?.deploy?.api).toEqual(undefined);
    expect(value?.scale?.api).toEqual(undefined);
  });

  it('should add defaults to minimal manifest', () => {
    const { error, value } = Manifest.parse(`
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

    expect(error).toBeUndefined();
    expect(value).toEqual({
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
    const { error } = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        api:
        processor:
          name: processor
    `);

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.processor.cmd" is required',
        '"deploy.api.cmd" is required',
      ]),
    );
  });

  it('should restrict envs in cmd', () => {
    const { error } = Manifest.parse(`
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

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.processor.cmd[0]" with value "ENV=test" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
        '"deploy.api.cmd[0]" with value "ENV=test" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
      ]),
    );
  });

  it('should allow special chars in cmd', () => {
    const { error } = Manifest.parse(`
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

    expect(error).toBeUndefined();
  });

  it('should disallow "&&" in cmd', () => {
    const { error } = Manifest.parse(`
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

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.api.cmd[2]" with value "&&" is invalid. Only latin letters, numbers, ".", "-", "_", "/" and ":" symbols are allowed.',
      ]),
    );
  });

  it('should disallow ":" in processor name', () => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      processor:
      - name: x3:test
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.processor[0].name" with value "x3:test" is invalid. Only latin letters, numbers, "-" symbols are allowed.',
      ]),
    );
  });
});
