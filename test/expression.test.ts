import assert from 'assert';

import {
  Parser,
  UnexpectedTokenError,
  UndefinedVariableError,
  ExpressionNotResolvedError,
  ParsingError,
} from '../src/expression';

describe('Expression Parser', () => {
  const parser = new Parser();

  describe('Basic parsing', () => {
    it('should parse and evaluate string literal', () => {
      const value = parser.parse("'hello'").eval();
      expect(value).toEqual('hello');
    });

    it('should throw error for empty', () => {
      expect(() => parser.parse('').eval()).toThrow(ParsingError);
    });
  });

  describe('Identifiers', () => {
    it('should evaluate defined identifier', () => {
      const value = parser.parse('foo').eval({ foo: 'foo' });
      expect(value).toEqual('foo');
    });

    it('should throw error for undefined top-level', () => {
      expect(() => parser.parse('foo').eval({})).toThrow(new UndefinedVariableError(['foo']));
    });

    it('should evaluate with hyphens, underscores and numbers', () => {
      expect(parser.parse('foo-bar').eval({ ['foo-bar']: 'value' })).toEqual('value');
      expect(parser.parse('foo_bar').eval({ ['foo_bar']: 'value' })).toEqual('value');
      expect(parser.parse('foo1337').eval({ ['foo1337']: 'value' })).toEqual('value');
    });

    it('should throw error for ending with hyphen', () => {
      expect(() => parser.parse('foo-').eval({})).toThrow(new UnexpectedTokenError('-', 3));
    });

    it('should evaluate starting with numbers', () => {
      expect(parser.parse('1337foo').eval({ ['1337foo']: 'value' })).toEqual('value');
    });
  });

  describe('Member access', () => {
    it('should evaluate single level', () => {
      const value = parser.parse('foo.bar').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should evaluate multi-level', () => {
      const value = parser.parse('foo.bar.baz').eval({ foo: { bar: { baz: 'baz' } } });
      expect(value).toEqual('baz');
    });

    it('should handle whitespace around dot', () => {
      const value = parser.parse('foo  .    bar').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should throw error for invalid syntax', () => {
      expect(() => parser.parse('.foo')).toThrow(new UnexpectedTokenError('.', 0));
      expect(() => parser.parse('foo.')).toThrow(new UnexpectedTokenError('.', 3));
    });

    it('should not access built-in properties', () => {
      expect(() => parser.parse('foo.toString').eval({ foo: 'bar' })).toThrow(
        new ExpressionNotResolvedError('foo.toString'),
      );
      expect(() => parser.parse('foo.valueOf').eval({ foo: 123 })).toThrow(
        new ExpressionNotResolvedError('foo.valueOf'),
      );
      expect(() => parser.parse('foo.prototype').eval({ foo: {} })).toThrow(
        new ExpressionNotResolvedError('foo.prototype'),
      );
      expect(() => parser.parse('foo.constructor').eval({ foo: {} })).toThrow(
        new ExpressionNotResolvedError('foo.constructor'),
      );
    });

    it('should access properties if explicitly passed', () => {
      expect(parser.parse('foo.toString').eval({ foo: { toString: 'custom' } })).toEqual('custom');
      expect(parser.parse('foo.valueOf').eval({ foo: { valueOf: 'custom' } })).toEqual('custom');
    });

    it('should handle with nested property access', () => {
      expect(
        parser.parse('foo.bar && foo.baz').eval({
          foo: {
            bar: 'first',
            baz: 'second',
          },
        }),
      ).toEqual('second');

      expect(() =>
        parser.parse('foo.bar && foo.baz').eval({
          foo: {
            bar: null,
            baz: 'second',
          },
        }),
      ).toThrow(new ExpressionNotResolvedError('foo.bar && foo.baz'));
    });
  });

  describe('String literals', () => {
    it('should evaluate simple', () => {
      const value = parser.parse("'hello'").eval();
      expect(value).toEqual('hello');
    });

    it('should handle escaped single quotes', () => {
      const value = parser.parse("'hello''world'").eval();
      expect(value).toEqual("hello'world");
    });

    it('should throw error for unclosed', () => {
      expect(() => parser.parse("'hello")).toThrow(new UnexpectedTokenError("'hello", 0));
    });

    it('should throw error after identifiers', () => {
      expect(() => parser.parse("foo'bar'")).toThrow(new UnexpectedTokenError("'", 3));
    });
  });

  describe('Value handling', () => {
    it('should throw error for null, undefined and empty', () => {
      expect(() => parser.parse('undefined').eval({ undefined: undefined })).toThrow(
        new ExpressionNotResolvedError('undefined'),
      );
      expect(() => parser.parse('null').eval({ null: null })).toThrow(
        new ExpressionNotResolvedError('null'),
      );
    });

    it('should not throw for empty string', () => {
      expect(parser.parse('empty').eval({ empty: '' })).toEqual('');
    });

    it('should preserve boolean and number values as strings', () => {
      expect(parser.parse('zero').eval({ zero: 0 })).toEqual('0');
      expect(parser.parse('falseVal').eval({ falseVal: false })).toEqual('false');
      expect(parser.parse('trueVal').eval({ trueVal: true })).toEqual('true');
      expect(parser.parse('num').eval({ num: 123 })).toEqual('123');
    });
  });

  describe('Parsing errors', () => {
    it('should throw error for invalid characters', () => {
      expect(() => parser.parse('foo @ bar')).toThrow(new UnexpectedTokenError('@', 4));
    });

    it('should throw error for invalid syntax combinations', () => {
      expect(() => parser.parse('foo..bar')).toThrow(new UnexpectedTokenError('.', 4));
      expect(() => parser.parse('foo&&')).toThrow(new UnexpectedTokenError('&&', 3));
      expect(() => parser.parse('||foo')).toThrow(new UnexpectedTokenError('||', 0));
    });
  });

  describe('Variables', () => {
    it('returns variables for a simple expression', () => {
      const expr = parser.parse('a || b');
      expect(expr.variables()).toEqual(['a', 'b']);
    });

    it('returns variables with member access', () => {
      const expr = parser.parse('a.b || c.d');
      expect(expr.variables()).toEqual(['a', 'c']);
    });

    it('returns variables under prefix', () => {
      const expr = parser.parse('a.b || a.c || d');
      expect(expr.variables(['a'])).toEqual(['b', 'c']);
    });

    it('returns empty array for non-matching prefix', () => {
      const expr = parser.parse('a.b || c.d');
      expect(expr.variables(['x'])).toEqual([]);
    });

    it('handles complex expressions with prefix', () => {
      const expr = parser.parse('a.b || a || b.a');
      expect(expr.variables(['a'])).toEqual(['b']);
    });

    it('handles nested member access with prefix', () => {
      const expr = parser.parse('a.b.c || a.d');
      expect(expr.variables(['a'])).toEqual(['b', 'd']);
      expect(expr.variables(['a', 'b'])).toEqual(['c']);
    });
  });

  describe('Error messages', () => {
    it('should include full path in top-level', () => {
      expect(() => parser.parse('foo').eval({})).toThrow('"foo" is not defined');
    });

    it('should throw on correct possition after binary operator', () => {
      expect(() => parser.parse('foo || "bar"')).toThrow(new UnexpectedTokenError('"', 7));
    });
  });

  describe('Parentheses operator', () => {
    it('should handle with member access and OR', () => {
      expect(
        parser.parse('(foo.bar) || baz').eval({
          foo: { bar: 'value' },
          baz: 'fallback',
        }),
      ).toEqual('value');
    });

    it('should handle with nested member access', () => {
      expect(
        parser.parse('(foo.bar).baz').eval({
          foo: { bar: { baz: 'nested' } },
        }),
      ).toEqual('nested');
    });

    it('should throw error for unclosed', () => {
      expect(() => parser.parse('(foo')).toThrow(new UnexpectedTokenError('(foo', 0));
    });

    it('should throw error for unclosed in OR', () => {
      expect(() => parser.parse('(foo || bar')).toThrow(new UnexpectedTokenError('(foo || bar', 0));
    });

    it('should override normal operator precedence', () => {
      expect(
        parser.parse('(foo || bar) && baz').eval({
          foo: '',
          bar: 'second',
          baz: 'third',
        }),
      ).toEqual('third');

      expect(
        parser.parse('(foo || bar) && baz').eval({
          foo: '',
          bar: '',
          baz: 'third',
        }),
      ).toEqual('');
    });
  });

  describe('Leading operators', () => {
    it('should throw error for logical OR', () => {
      expect(() => parser.parse('|| foo')).toThrow(new UnexpectedTokenError('||', 0));
    });

    it('should throw error for logical AND', () => {
      expect(() => parser.parse('&& foo')).toThrow(new UnexpectedTokenError('&&', 0));
    });

    it('should throw error for member access', () => {
      expect(() => parser.parse('.foo')).toThrow(new UnexpectedTokenError('.', 0));
    });
  });

  describe('Logical operators', () => {
    describe('OR operator', () => {
      it('should return first truthy value', () => {
        expect(
          parser.parse('foo || bar').eval({
            foo: 'first',
            bar: 'second',
          }),
        ).toEqual('first');
      });

      it('should skip falsy values', () => {
        expect(
          parser.parse('foo || bar || baz').eval({
            foo: '',
            bar: null,
            baz: 'third',
          }),
        ).toEqual('third');
      });

      it('should skip falsy values with parenthesized expression', () => {
        expect(
          parser.parse('(foo || bar) || baz').eval({
            foo: '',
            bar: null,
            baz: 'third',
          }),
        ).toEqual('third');
      });

      it('should handle multiple OR operators', () => {
        expect(
          parser.parse('foo || bar || baz || qux').eval({
            foo: '',
            bar: '',
            baz: '',
            qux: 'last',
          }),
        ).toEqual('last');
      });

      it('should return empty string if all values are falsy', () => {
        expect(
          parser.parse('foo || bar').eval({
            foo: '',
            bar: '',
          }),
        ).toEqual('');
      });
    });

    describe('AND operator', () => {
      it('should return last value if all truthy', () => {
        expect(
          parser.parse('foo && bar').eval({
            foo: 'first',
            bar: 'second',
          }),
        ).toEqual('second');
      });

      it('should return first falsy value', () => {
        expect(
          parser.parse('foo && bar && baz').eval({
            foo: 'first',
            bar: '',
            baz: 'third',
          }),
        ).toEqual('');
      });

      it('should handle multiple AND operators', () => {
        expect(
          parser.parse('foo && bar && baz && qux').eval({
            foo: 'first',
            bar: 'second',
            baz: 'third',
            qux: 'last',
          }),
        ).toEqual('last');
      });

      it('should handle multiple AND operators with parenthesized expression', () => {
        expect(
          parser.parse('(foo && bar) && baz').eval({
            foo: 'first',
            bar: 'second',
            baz: 'third',
          }),
        ).toEqual('third');
      });

      it('should handle null values', () => {
        expect(() =>
          parser.parse('foo && bar').eval({
            foo: 'first',
            bar: null,
          }),
        ).toThrow(new ExpressionNotResolvedError('foo && bar'));
      });
    });

    describe('Mixed operators', () => {
      it('should handle AND and OR together', () => {
        expect(
          parser.parse('foo && bar || baz').eval({
            foo: 'first',
            bar: 'second',
            baz: 'third',
          }),
        ).toEqual('second');
      });

      it('should respect operator precedence (AND before OR)', () => {
        expect(
          parser.parse('foo || bar && baz').eval({
            foo: '',
            bar: 'second',
            baz: 'third',
          }),
        ).toEqual('third');
      });

      it('should handle complex expressions', () => {
        expect(
          parser.parse('foo.prop || bar && baz.value').eval({
            foo: { prop: '' },
            bar: 'second',
            baz: { value: 'third' },
          }),
        ).toEqual('third');
      });
    });
  });
});
