import { Manifest, ManifestParsingError } from '../src';

describe('Addon Postgres', () => {
  it('should add defaults to postgres addon', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
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
        init: {
          cmd: ['npx', 'squid-typeorm-migration', 'apply'],
        },
        api: {
          cmd: ['npx', 'squid-graphql-server'],
        },
        processor: [
          {
            name: 'processor',
            cmd: ['node', 'lib/processor'],
          },
        ],
        addons: {
          postgres: {
            version: '14',
            config: {},
          },
        },
      },
      scale: {
        addons: {
          postgres: {
            storage: '10Gi',
            profile: 'small',
            default_storage: true,
          },
        },
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

  it('should add not add default true to postgres addon if storage specified', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    scale:
       addons:
         postgres:
           storage: 50Gi
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
        init: {
          cmd: ['npx', 'squid-typeorm-migration', 'apply'],
        },
        api: {
          cmd: ['npx', 'squid-graphql-server'],
        },
        processor: [
          {
            name: 'processor',
            cmd: ['node', 'lib/processor'],
          },
        ],
        addons: {
          postgres: {
            version: '14',
            config: {},
          },
        },
      },
      scale: {
        dedicated: true,
        addons: {
          postgres: {
            storage: '50Gi',
            profile: 'small',
            default_storage: false,
          },
        },
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

  it('should not add migrate service if not specified postgres addon', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
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
            name: 'test',
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

  it('should not override disabled migration', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      init: false
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
        init: false,
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

  it('should transform migrate to init', () => {
    const { error, value } = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        migrate:
          cmd: [ "npx", "squid-typeorm-migration", "apply" ]
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
        init: {
          cmd: ['npx', 'squid-typeorm-migration', 'apply'],
        },
        processor: [
          {
            name: 'processor',
            cmd: ['node', 'lib/processor'],
          },
        ],
      },
      scale: {
        processor: {
          profile: 'small',
        },
      },
    });
  });

  it('should do not allow storage size values w/o units', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    scale:
       addons:
         postgres:
           storage: 50
    `);

    expect(error).toEqual(
      new ManifestParsingError([
        '"scale.addons.postgres.storage" with value "50" is invalid. Size must be a number followed by unit. Valid units are "G", "Gi", "T" and "Ti"',
      ]),
    );
  });

  it.each(['G', 'Gi', 'T', 'Ti'])(`should allow %v unit`, unit => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    scale:
       addons:
         postgres:
           storage: 100${unit}
    `);

    expect(error).toBeUndefined();
  });
});
