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
          },
        },
      },
      scale: {
        addons: {
          hasura: {
            replicas: 1,
            profile: 'small',
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
              HASURA_ADMIN_SECRET: '${{secrets.admin_secret }}',
            },
          },
        },
        processor: {
          name: 'processor',
        },
      },
    }).eval({
      secrets: { admin_secret: 'mysecret' },
    });

    expect(res).toMatchObject({
      manifest_version: 'subsquid.io/v0.1',
      name: 'test',
      version: 1,
      deploy: {
        addons: {
          hasura: {
            env: {
              HASURA_ADMIN_SECRET: 'mysecret',
            },
          },
        },
        processor: [{ name: 'processor' }],
      },
    });
  });
});
