import { Manifest, ManifestEvaluatingError } from '../src';

describe('Env Evaluation', () => {
  describe('eval', () => {
    it('success', () => {
      const res = new Manifest({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          env: {
            foo: '${{foo}}',
            bar: 'bar',
            baz: '${{baz',
          },
          processor: {
            name: 'processor',
          },
        },
      }).eval({
        foo: 'foo',
      });

      expect(res).toMatchObject({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          env: {
            foo: 'foo',
            bar: 'bar',
            baz: '${{baz',
          },
          processor: [{ name: 'processor' }],
        },
      });
    });

    it('parsing error', () => {
      const manifest = new Manifest({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          env: {
            foo: '${{foo.}}',
            bar: 'bar',
            baz: '${{baz}}',
          },
          processor: {
            name: 'processor',
          },
        },
      });

      expect(() =>
        manifest.eval({
          foo: 'foo',
          baz: 'baz',
        }),
      ).toThrow(
        new ManifestEvaluatingError([
          'Manifest env variable "deploy.env.foo" can not be mapped for "${{foo.}}" expression: Unexpected EOF [0,7]',
        ]),
      );
    });

    it('evaluation error', () => {
      const manifest = new Manifest({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          env: {
            foo: '${{foo}}',
            bar: 'bar',
            baz: '${{baz}}',
          },
          processor: {
            name: 'processor',
          },
        },
      });

      expect(() =>
        manifest.eval({
          foo: 'foo',
        }),
      ).toThrow(
        new ManifestEvaluatingError([
          'Manifest env variable "deploy.env.baz" can not be mapped for "${{baz}}" expression: "baz" is not found in the context',
        ]),
      );
    });
  });

  describe('variables', () => {
    it('secrets', () => {
      const manifest = new Manifest({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          env: { GLOBAL: '${{secrets.GLOBAL}}' },
          processor: {
            name: 'processor',
            env: { PROCESSOR: '${{secrets.PROCESSOR}}' },
          },
          api: {
            env: { API: '${{secrets.API}}' },
          },
          init: {
            env: { INIT: '${{secrets.INIT}}' },
          },
        },
      });

      expect(manifest.variables(['secrets'])).toEqual(
        expect.arrayContaining(['GLOBAL', 'PROCESSOR', 'API', 'INIT']),
      );
    });
  });
});
