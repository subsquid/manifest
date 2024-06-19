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
});
