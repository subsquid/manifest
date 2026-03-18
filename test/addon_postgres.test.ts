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

  it.each(['us', 'ms', 's', 'min', 'h', 'd'])(
    'should allow idle_in_transaction_session_timeout with %s unit',
    unit => {
      const { error, value } = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        addons:
          postgres:
            config:
              idle_in_transaction_session_timeout: 60${unit}
        api:
          cmd: [ "npx", "squid-graphql-server" ]
        processor:
          cmd: [ "node", "lib/processor" ]
      `);

      expect(error).toBeUndefined();
      expect(value?.deploy?.addons?.postgres?.config?.idle_in_transaction_session_timeout).toEqual(
        `60${unit}`,
      );
    },
  );

  it.each(['us', 'ms', 's', 'min', 'h', 'd'])(
    'should allow idle_session_timeout with %s unit',
    unit => {
      const { error, value } = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        addons:
          postgres:
            config:
              idle_session_timeout: 300${unit}
        api:
          cmd: [ "npx", "squid-graphql-server" ]
        processor:
          cmd: [ "node", "lib/processor" ]
      `);

      expect(error).toBeUndefined();
      expect(value?.deploy?.addons?.postgres?.config?.idle_session_timeout).toEqual(`300${unit}`);
    },
  );

  it('should allow idle_in_transaction_session_timeout without unit', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            idle_in_transaction_session_timeout: 60000
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.config?.idle_in_transaction_session_timeout).toEqual(
      60000,
    );
  });

  it('should allow idle_session_timeout without unit', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            idle_session_timeout: 300000
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.config?.idle_session_timeout).toEqual(300000);
  });

  it('should not allow idle_session_timeout with invalid unit', () => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            idle_session_timeout: 300x
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toEqual(
      new ManifestParsingError([
        '"deploy.addons.postgres.config.idle_session_timeout" with value "300x" is invalid. Must be a number optionally followed by a unit. Valid units are "us", "ms", "s", "min", "h" and "d"',
      ]),
    );
  });

  it('should allow both timeout settings together', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            idle_in_transaction_session_timeout: 60s
            idle_session_timeout: 5min
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.config?.idle_in_transaction_session_timeout).toEqual(
      '60s',
    );
    expect(value?.deploy?.addons?.postgres?.config?.idle_session_timeout).toEqual('5min');
  });

  it('should allow statement_timeout as a number (backward compatible)', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            statement_timeout: 60000
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.config?.statement_timeout).toEqual(60000);
  });

  it('should allow log_min_duration_statement as a number (backward compatible)', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            log_min_duration_statement: 5000
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.config?.log_min_duration_statement).toEqual(5000);
  });

  it('should allow statement_timeout with a unit', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            statement_timeout: 60s
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.config?.statement_timeout).toEqual('60s');
  });

  it('should allow log_min_duration_statement with a unit', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            log_min_duration_statement: 5min
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.config?.log_min_duration_statement).toEqual('5min');
  });

  it('should allow all postgres config options together', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          config:
            statement_timeout: 60s
            log_min_duration_statement: 5min
            idle_in_transaction_session_timeout: 120s
            idle_session_timeout: 10min
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    const config = value?.deploy?.addons?.postgres?.config;
    expect(config?.statement_timeout).toEqual('60s');
    expect(config?.log_min_duration_statement).toEqual('5min');
    expect(config?.idle_in_transaction_session_timeout).toEqual('120s');
    expect(config?.idle_session_timeout).toEqual('10min');
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

  it('should allow max_connections in postgres external_access', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          external_access:
            max_connections: 50
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value?.deploy?.addons?.postgres?.external_access?.max_connections).toBe(50);
  });

  it('should reject max_connections greater than 100', () => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          external_access:
            max_connections: 101
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeDefined();
  });

  it('should reject max_connections less than 0', () => {
    const { error } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        postgres:
          external_access:
            max_connections: -1
      api:
        cmd: [ "npx", "squid-graphql-server" ]
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeDefined();
  });
});
