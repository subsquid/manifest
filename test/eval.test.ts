import { Manifest, ManifestEvaluatingError } from '../src';

describe('Env Evaluation', () => {
  describe('eval', () => {
    it('should not add an objects if it does not exist in the source manifest', () => {
      const res = new Manifest({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          processor: {
            name: 'processor',
          },
        },
      }).eval({});

      expect(res.deploy?.env).toEqual(undefined);
      expect(res.deploy?.api).toEqual(undefined);
      expect(res.deploy?.init).toEqual(undefined);
      expect(res.scale?.api).toEqual(undefined);
    });

    it('should override manifest', () => {
      const manifest = new Manifest({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          env: {
            foo: '${{foo}}',
          },
          processor: {
            name: 'processor',
          },
        },
      });

      const res = manifest.eval({
        foo: 'value1',
      });

      expect(res.deploy?.env?.foo).toEqual('value1');
      expect(manifest.deploy?.env?.foo).toEqual('${{foo}}');
    });

    it('should skip unclosed branches', () => {
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
        foo: 'value1',
      });

      expect(res).toMatchObject({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          env: {
            foo: 'value1',
            bar: 'bar',
            baz: '${{baz',
          },
          processor: [{ name: 'processor' }],
        },
      });
    });

    it('should return parsing error for an invalid template', () => {
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
          foo: 'value1',
          baz: 'value2',
        }),
      ).toThrow(
        new ManifestEvaluatingError([
          'Manifest env variable "deploy.env.foo" can not be mapped for "${{foo.}}" expression: Unexpected end of input [7]',
        ]),
      );
    });

    it('should add processor index on invalid env template', () => {
      const manifest = new Manifest({
        manifest_version: 'subsquid.io/v0.1',
        name: 'test',
        version: 1,
        deploy: {
          processor: [
            {
              name: 'processor',
              env: {
                foo: '${{foo.}}',
              },
            },
          ],
        },
      });

      expect(() =>
        manifest.eval({
          foo: 'value1',
          baz: 'value2',
        }),
      ).toThrow(
        new ManifestEvaluatingError([
          'Manifest env variable "deploy.processor.[0].env.foo" can not be mapped for "${{foo.}}" expression: Unexpected end of input [7]',
        ]),
      );
    });

    it('should return evaluation error if variable is missing in context', () => {
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
          foo: 'value1',
        }),
      ).toThrow(
        new ManifestEvaluatingError([
          'Manifest env variable "deploy.env.baz" can not be mapped for "${{baz}}" expression: "baz" is not defined',
        ]),
      );
    });
  });

  describe('variables', () => {
    it('should return only secrets related variables', () => {
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
            env: {
              INIT: '${{secrets.INIT}}',
              MISSING: '${{rpc.INIT_DOWN}}',
            },
          },
        },
      });

      expect(manifest.variables(['secrets']).sort()).toEqual(
        ['GLOBAL', 'PROCESSOR', 'API', 'INIT'].sort(),
      );
    });
  });
});
