import { Manifest } from '../src';

describe('Addon Hasura', () => {
  it('should add hasura defaults', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        hasura:
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      deploy: {
        addons: {
          hasura: {
            version: 'latest',
            config: {},
          },
        },
      },
      scale: {
        addons: {
          hasura: {
            replicas: 1,
          },
        },
      },
    });
  });

  it('should add secrtes', () => {
    const res = new Manifest({
      manifest_version: 'subsquid.io/v0.1',
      name: 'test',
      version: 1,
      deploy: {
        addons: {
          hasura: {
            env: {
              HASURA_ADMIN_SECRET: '${{secrets.HASURA_ADMIN_SECRET}}',
            },
          },
        },
        processor: {
          name: 'processor',
        },
      },
    }).eval({
      HASURA_ADMIN_SECRET: 'mysecret',
    });

    expect(res).toMatchObject({
      manifest_version: 'subsquid.io/v0.1',
      name: 'test',
      version: 1,
      deploy: {
        env: {
          HASURA_ADMIN_SECRET: 'mysecret',
        },
        processor: [{ name: 'processor' }],
      },
    });
  });
});
