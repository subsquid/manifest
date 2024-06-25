import { Manifest } from '../src';

describe('Addon Neon', () => {
  it('should add defaults to neon addon', () => {
    const { error, value } = Manifest.parse(`
    manifest_version: subsquid.io/v0.1
    name: test
    version: 1
    build:
    deploy:
      addons:
        neon:
      processor:
        cmd: [ "node", "lib/processor" ]
    `);

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      manifest_version: 'subsquid.io/v0.1',
      name: 'test',
      version: 1,
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
        addons: {
          neon: {
            version: '16',
          },
        },
      },
      scale: {
        addons: {
          neon: {
            autoscaling_limit_min_cu: '0.25',
            autoscaling_limit_max_cu: '0.25',
          },
        },
        processor: {
          profile: 'small',
        },
      },
    });
  });
});
