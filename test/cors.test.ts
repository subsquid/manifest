import { Manifest } from '../src';

describe('Cors', () => {
  it('should allow empty cors object', () => {
    const { error, value } = Manifest.parse(`
      manifest_version: subsquid.io/v0.1
      name: test
      version: 1
      build:
      deploy:
        cors:
        processor:
          cmd: [ "node", "lib/processor" ]
      `);

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      deploy: {
        cors: {
          enabled: true,
        },
      },
    });
  });
});