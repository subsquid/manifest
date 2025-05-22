import assert from 'assert';

import {
  Parser,
  UnexpectedTokenError,
  UndefinedVariableError,
  ExpressionNotResolvedError,
} from '../src/expression';

describe('Expression Parser', () => {
  const parser = new Parser();

  describe('Basic parsing', () => {
    it('should parse and evaluate string literal', () => {
      const value = parser.parse('hello').eval();
      expect(value).toEqual('hello');
    });

    it('should evaluate empty to empty string', () => {
      expect(parser.parse('${{    }}').eval()).toEqual('');
    });
  });

  describe('Identifiers', () => {
    it('should evaluate defined identifier', () => {
      const value = parser.parse('${{foo}}').eval({ foo: 'foo' });
      expect(value).toEqual('foo');
    });

    it('should throw error for undefined top-level', () => {
      expect(() => parser.parse('${{foo}}').eval({})).toThrow(new UndefinedVariableError(['foo']));
    });

    it('should throw error for undefined nested with null parent', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: null })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should throw error for undefined nested with undefined parent', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: undefined })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should evaluate with hyphens, underscores and numbers', () => {
      expect(parser.parse('${{foo-bar}}').eval({ ['foo-bar']: 'value' })).toEqual('value');
      expect(parser.parse('${{foo_bar}}').eval({ ['foo_bar']: 'value' })).toEqual('value');
      expect(parser.parse('${{foo1337}}').eval({ ['foo1337']: 'value' })).toEqual('value');
    });

    it('should throw error for ending with hyphen', () => {
      expect(() => parser.parse('${{foo-}}').eval({})).toThrow(new UnexpectedTokenError('-', 6));
    });

    it('should evaluate starting with numbers', () => {
      expect(parser.parse('${{1337foo}}').eval({ ['1337foo']: 'value' })).toEqual('value');
    });
  });

  describe('Member access', () => {
    it('should evaluate single level', () => {
      const value = parser.parse('${{foo.bar}}').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should evaluate multi-level', () => {
      const value = parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: { baz: 'baz' } } });
      expect(value).toEqual('baz');
    });

    it('should handle whitespace around dot', () => {
      const value = parser.parse('${{foo  .    bar}}').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should throw error for undefined nested with null parent', () => {
      expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: null } })).toThrow(
        new UndefinedVariableError(['foo', 'bar'], 'baz'),
      );
    });

    it('should throw error for null or undefined parent', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: null })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: undefined })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should throw error for deep nested on null parent', () => {
      expect(() => parser.parse('${{foo.bar.baz.qux}}').eval({ foo: { bar: null } })).toThrow(
        new UndefinedVariableError(['foo', 'bar'], 'baz'),
      );
    });

    it('should throw error for invalid syntax', () => {
      expect(() => parser.parse('${{.foo}}')).toThrow(new UnexpectedTokenError('.', 3));
      expect(() => parser.parse('${{foo.}}')).toThrow(new UnexpectedTokenError('.', 6));
    });

    it('should not access built-in properties', () => {
      expect(() => parser.parse('${{foo.toString}}').eval({ foo: 'bar' })).toThrow(
        new ExpressionNotResolvedError('${{foo.toString}}'),
      );
      expect(() => parser.parse('${{foo.valueOf}}').eval({ foo: 123 })).toThrow(
        new ExpressionNotResolvedError('${{foo.valueOf}}'),
      );
      expect(() => parser.parse('${{foo.prototype}}').eval({ foo: {} })).toThrow(
        new ExpressionNotResolvedError('${{foo.prototype}}'),
      );
      expect(() => parser.parse('${{foo.constructor}}').eval({ foo: {} })).toThrow(
        new ExpressionNotResolvedError('${{foo.constructor}}'),
      );
    });

    it('should access properties if explicitly passed', () => {
      expect(parser.parse('${{foo.toString}}').eval({ foo: { toString: 'custom' } })).toEqual(
        'custom',
      );
      expect(parser.parse('${{foo.valueOf}}').eval({ foo: { valueOf: 'custom' } })).toEqual(
        'custom',
      );
    });

    it('should handle with nested property access', () => {
      expect(
        parser.parse('${{foo.bar && foo.baz}}').eval({
          foo: {
            bar: 'first',
            baz: 'second',
          },
        }),
      ).toEqual('second');

      expect(() =>
        parser.parse('${{foo.bar && foo.baz}}').eval({
          foo: {
            bar: null,
            baz: 'second',
          },
        }),
      ).toThrow(new ExpressionNotResolvedError('${{foo.bar && foo.baz}}'));
    });
  });

  describe('String literals', () => {
    it('should evaluate simple', () => {
      const value = parser.parse("${{'hello'}}").eval();
      expect(value).toEqual('hello');
    });

    it('should handle escaped single quotes', () => {
      const value = parser.parse("${{'hello''world'}}").eval();
      expect(value).toEqual("hello'world");
    });

    it('should throw error for unclosed', () => {
      expect(() => parser.parse("${{'hello}}")).toThrow(new UnexpectedTokenError("'hello", 3));
    });

    it('should throw error after identifiers', () => {
      expect(() => parser.parse("${{foo'bar'}}")).toThrow(new UnexpectedTokenError("'", 6));
    });
  });

  describe('Value handling', () => {
    it('should throw error for null, undefined and empty', () => {
      expect(() => parser.parse('${{undefined}}').eval({ undefined: undefined })).toThrow(
        new ExpressionNotResolvedError('${{undefined}}'),
      );
      expect(() => parser.parse('${{null}}').eval({ null: null })).toThrow(
        new ExpressionNotResolvedError('${{null}}'),
      );
    });

    it('should not throw for empty string', () => {
      expect(parser.parse('${{empty}}').eval({ empty: '' })).toEqual('');
    });

    it('should preserve boolean and number values as strings', () => {
      expect(parser.parse('${{zero}}').eval({ zero: 0 })).toEqual('0');
      expect(parser.parse('${{falseVal}}').eval({ falseVal: false })).toEqual('false');
      expect(parser.parse('${{trueVal}}').eval({ trueVal: true })).toEqual('true');
      expect(parser.parse('${{num}}').eval({ num: 123 })).toEqual('123');
    });
  });

  describe('Parsing errors', () => {
    it('should throw error for invalid characters', () => {
      expect(() => parser.parse('${{foo @ bar}}')).toThrow(new UnexpectedTokenError('@', 7));
    });

    it('should throw error for invalid syntax combinations', () => {
      expect(() => parser.parse('${{foo..bar}}')).toThrow(new UnexpectedTokenError('.', 7));
      expect(() => parser.parse('${{foo&&}}')).toThrow(new UnexpectedTokenError('&&', 6));
      expect(() => parser.parse('${{||foo}}')).toThrow(new UnexpectedTokenError('||', 3));
    });
  });

  describe('Complex expressions', () => {
    it('should evaluate mixed with static text', () => {
      const value = parser.parse('hello ${{foo}} world').eval({ foo: 'foo' });
      expect(value).toEqual('hello foo world');
    });

    it('should evaluate multiple in sequence', () => {
      const value = parser.parse('${{foo}} ${{bar}}').eval({ foo: 'foo', bar: 'bar' });
      expect(value).toEqual('foo bar');
    });

    it('should throw error for undefined in mixed', () => {
      expect(() => parser.parse('hello ${{foo}} world').eval({})).toThrow(
        new UndefinedVariableError(['foo']),
      );
    });

    it('should throw error for undefined nested in mixed', () => {
      expect(() => parser.parse('hello ${{foo.bar}} world').eval({ foo: null })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should throw error for first undefined in multiple', () => {
      expect(() => parser.parse('${{foo.bar}} ${{baz.qux}}').eval({ foo: null, baz: {} })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });
  });

  describe('Variables', () => {
    it('returns variables for a simple expression', () => {
      const expr = parser.parse('${{ a || b }}');
      expect(expr.variables()).toEqual(['a', 'b']);
    });

    it('returns variables with member access', () => {
      const expr = parser.parse('${{ a.b || c.d }}');
      expect(expr.variables()).toEqual(['a', 'c']);
    });

    it('returns variables under prefix', () => {
      const expr = parser.parse('${{ a.b || a.c || d }}');
      expect(expr.variables(['a'])).toEqual(['b', 'c']);
    });

    it('returns empty array for non-matching prefix', () => {
      const expr = parser.parse('${{ a.b || c.d }}');
      expect(expr.variables(['x'])).toEqual([]);
    });

    it('handles complex expressions with prefix', () => {
      const expr = parser.parse('${{ a.b || a || b.a }}');
      expect(expr.variables(['a'])).toEqual(['b']);
    });

    it('handles nested member access with prefix', () => {
      const expr = parser.parse('${{ a.b.c || a.d }}');
      expect(expr.variables(['a'])).toEqual(['b', 'd']);
      expect(expr.variables(['a', 'b'])).toEqual(['c']);
    });
  });

  describe('Error messages', () => {
    it('should include full path in top-level', () => {
      expect(() => parser.parse('${{foo}}').eval({})).toThrow('"foo" is not defined');
    });

    it('should include parent context and property', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: null })).toThrow(
        '"foo" is not defined (reading \'bar\')',
      );
    });

    it('should include full path and property in deep nested', () => {
      expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: null } })).toThrow(
        '"foo.bar" is not defined (reading \'baz\')',
      );
    });
  });

  describe('Logical operators', () => {
    describe('AND operator', () => {
      it('should return second value if first is truthy', () => {
        expect(parser.parse('${{foo && bar}}').eval({ foo: 'first', bar: 'second' })).toEqual(
          'second',
        );
        expect(parser.parse('${{foo && bar}}').eval({ foo: true, bar: 'second' })).toEqual(
          'second',
        );
        expect(parser.parse('${{foo && bar}}').eval({ foo: 1, bar: 'second' })).toEqual('second');
      });

      it('should return first value if it is falsy', () => {
        expect(() => parser.parse('${{foo && bar}}').eval({ foo: null, bar: 'second' })).toThrow(
          new ExpressionNotResolvedError('${{foo && bar}}'),
        );
        expect(() =>
          parser.parse('${{foo && bar}}').eval({ foo: undefined, bar: 'second' }),
        ).toThrow(new ExpressionNotResolvedError('${{foo && bar}}'));
        expect(parser.parse('${{foo && bar}}').eval({ foo: '', bar: 'second' })).toEqual('');
        expect(parser.parse('${{foo && bar}}').eval({ foo: 0, bar: 'second' })).toEqual('0');
        expect(parser.parse('${{foo && bar}}').eval({ foo: false, bar: 'second' })).toEqual(
          'false',
        );
      });

      it('should handle with nested property access', () => {
        expect(
          parser.parse('${{foo.bar && baz.qux}}').eval({
            foo: { bar: 'first' },
            baz: { qux: 'second' },
          }),
        ).toEqual('second');

        expect(() =>
          parser.parse('${{foo.bar && baz.qux}}').eval({
            foo: { bar: null },
            baz: { qux: 'second' },
          }),
        ).toThrow(new ExpressionNotResolvedError('${{foo.bar && baz.qux}}'));
      });

      it('should handle multiple in sequence', () => {
        expect(
          parser.parse('${{foo && bar && baz}}').eval({
            foo: 'first',
            bar: 'second',
            baz: 'third',
          }),
        ).toEqual('third');

        expect(
          parser.parse('${{foo && bar && baz}}').eval({
            foo: 'first',
            bar: '',
            baz: 'third',
          }),
        ).toEqual('');
      });
    });

    describe('OR operator', () => {
      it('should return first value if it is truthy', () => {
        expect(parser.parse('${{foo || bar}}').eval({ foo: 'first', bar: 'second' })).toEqual(
          'first',
        );
        expect(parser.parse('${{foo || bar}}').eval({ foo: true, bar: 'second' })).toEqual('true');
        expect(parser.parse('${{foo || bar}}').eval({ foo: 1, bar: 'second' })).toEqual('1');
      });

      it('should return second value if first is falsy', () => {
        expect(parser.parse('${{foo || bar}}').eval({ foo: null, bar: 'second' })).toEqual(
          'second',
        );
        expect(parser.parse('${{foo || bar}}').eval({ foo: undefined, bar: 'second' })).toEqual(
          'second',
        );
        expect(parser.parse('${{foo || bar}}').eval({ foo: '', bar: 'second' })).toEqual('second');
        expect(parser.parse('${{foo || bar}}').eval({ foo: 0, bar: 'second' })).toEqual('second');
        expect(parser.parse('${{foo || bar}}').eval({ foo: false, bar: 'second' })).toEqual(
          'second',
        );
      });

      it('should handle with nested property access', () => {
        expect(
          parser.parse('${{foo.bar || baz.qux}}').eval({
            foo: { bar: 'first' },
            baz: { qux: 'second' },
          }),
        ).toEqual('first');

        expect(
          parser.parse('${{foo.bar || baz.qux}}').eval({
            foo: { bar: null },
            baz: { qux: 'second' },
          }),
        ).toEqual('second');
      });

      it('should handle multiple in sequence', () => {
        expect(
          parser.parse('${{foo || bar || baz}}').eval({
            foo: '',
            bar: '',
            baz: 'third',
          }),
        ).toEqual('third');

        expect(
          parser.parse('${{foo || bar || baz}}').eval({
            foo: 'first',
            bar: '',
            baz: '',
          }),
        ).toEqual('first');
      });
    });

    describe('Operator precedence', () => {
      it('should evaluate AND before OR', () => {
        expect(
          parser.parse('${{foo || bar && baz}}').eval({
            foo: '',
            bar: 'second',
            baz: 'third',
          }),
        ).toEqual('third');

        expect(
          parser.parse('${{foo || bar && baz}}').eval({
            foo: '',
            bar: 'second',
            baz: '',
          }),
        ).toEqual('');

        expect(
          parser.parse('${{foo || bar && baz}}').eval({
            foo: 'first',
            bar: 'second',
            baz: '',
          }),
        ).toEqual('first');
      });
    });
  });

  describe('Parentheses operator', () => {
    it('should handle with member access and OR', () => {
      expect(
        parser.parse('${{(foo.bar) || baz}}').eval({
          foo: { bar: 'value' },
          baz: 'fallback',
        }),
      ).toEqual('value');
    });

    it('should handle with nested member access', () => {
      expect(
        parser.parse('${{(foo.bar).baz}}').eval({
          foo: { bar: { baz: 'nested' } },
        }),
      ).toEqual('nested');
    });

    it('should throw error for unclosed', () => {
      expect(() => parser.parse('${{(foo}}')).toThrow(new UnexpectedTokenError('(foo', 3));
    });

    it('should throw error for unclosed in OR', () => {
      expect(() => parser.parse('${{(foo || bar}}')).toThrow(
        new UnexpectedTokenError('(foo || bar', 3),
      );
    });

    it('should override normal operator precedence', () => {
      expect(
        parser.parse('${{(foo || bar) && baz}}').eval({
          foo: '',
          bar: 'second',
          baz: 'third',
        }),
      ).toEqual('third');

      expect(
        parser.parse('${{(foo || bar) && baz}}').eval({
          foo: '',
          bar: '',
          baz: 'third',
        }),
      ).toEqual('');
    });
  });

  describe('Leading operators', () => {
    it('should throw error for logical OR', () => {
      expect(() => parser.parse('${{|| foo}}')).toThrow(new UnexpectedTokenError('||', 3));
    });

    it('should throw error for logical AND', () => {
      expect(() => parser.parse('${{&& foo}}')).toThrow(new UnexpectedTokenError('&&', 3));
    });

    it('should throw error for member access', () => {
      expect(() => parser.parse('${{.foo}}')).toThrow(new UnexpectedTokenError('.', 3));
    });
  });
});
