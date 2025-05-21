import { Parser, UnexpectedTokenError, UndefinedVariableError } from '../src/expression';

describe('Expression', () => {
  const parser = new Parser();

  it('should parse and evaluate string literal', () => {
    const value = parser.parse('hello').eval();
    expect(value).toEqual('hello');
  });

  describe('identifiers', () => {
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

  describe('member access', () => {
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
      expect(parser.parse('${{foo.toString}}').eval({ foo: 'bar' })).toEqual('');
      expect(parser.parse('${{foo.valueOf}}').eval({ foo: 123 })).toEqual('');
      expect(parser.parse('${{foo.prototype}}').eval({ foo: {} })).toEqual('');
      expect(parser.parse('${{foo.constructor}}').eval({ foo: {} })).toEqual('');
    });

    it('should access properties if explicitly passed', () => {
      expect(parser.parse('${{foo.toString}}').eval({ foo: { toString: 'custom' } })).toEqual(
        'custom',
      );
      expect(parser.parse('${{foo.valueOf}}').eval({ foo: { valueOf: 'custom' } })).toEqual(
        'custom',
      );
    });
  });

  describe('parsing errors', () => {
    it('should throw error for invalid characters', () => {
      expect(() => parser.parse('${{foo @ bar}}')).toThrow(new UnexpectedTokenError('@', 7));
    });

    it('should evaluate empty to empty string', () => {
      expect(parser.parse('${{    }}').eval()).toEqual('');
    });
  });

  describe('value handling', () => {
    it('should convert null, undefined and empty to empty string', () => {
      expect(parser.parse('${{undefined}}').eval({ undefined: undefined })).toEqual('');
      expect(parser.parse('${{null}}').eval({ null: null })).toEqual('');
      expect(parser.parse('${{empty}}').eval({ empty: '' })).toEqual('');
    });
  });

  describe('complex expressions', () => {
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

  describe('variables', () => {
    it('should extract root level', () => {
      const variables = parser.parse('${{foo.bar}}').variables();
      expect(variables).toEqual(['foo']);
    });

    it('should extract all from complex', () => {
      const variables = parser.parse('${{foo.bar}} ${{baz}}').variables();
      expect(variables).toContain('foo');
      expect(variables).toContain('baz');
    });

    it('should extract nested with given prefix', () => {
      const variables = parser.parse('${{foo.bar}}').variables(['foo']);
      expect(variables).toEqual(['bar']);
    });
  });

  describe('string literals', () => {
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

  describe('error messages', () => {
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

  describe('logical OR operator', () => {
    it('should return first non-falsy', () => {
      expect(parser.parse('${{foo || bar}}').eval({ foo: 'first', bar: 'second' })).toEqual(
        'first',
      );
      expect(parser.parse('${{foo || bar}}').eval({ foo: null, bar: 'second' })).toEqual('second');
      expect(parser.parse('${{foo || bar}}').eval({ foo: undefined, bar: 'second' })).toEqual(
        'second',
      );
      expect(parser.parse('${{foo || bar}}').eval({ foo: '', bar: 'second' })).toEqual('second');
      expect(parser.parse('${{foo || bar}}').eval({ foo: 0, bar: 'second' })).toEqual('second');
      expect(parser.parse('${{foo || bar}}').eval({ foo: false, bar: 'second' })).toEqual('second');
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
          bar: 0,
          baz: 'third',
        }),
      ).toEqual('third');

      expect(
        parser.parse('${{foo || bar || baz}}').eval({
          foo: 'first',
          bar: 'second',
          baz: 'third',
        }),
      ).toEqual('first');
    });

    it('should handle with string literals', () => {
      expect(parser.parse("${{foo || 'default'}}").eval({ foo: 'value' })).toEqual('value');
      expect(parser.parse("${{foo || 'default'}}").eval({ foo: null })).toEqual('default');
    });
  });

  describe('parentheses operator', () => {
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
  });

  describe('leading operators', () => {
    it('should throw error for logical OR', () => {
      expect(() => parser.parse('${{|| foo}}')).toThrow(new UnexpectedTokenError('||', 3));
    });

    it('should throw error for member access', () => {
      expect(() => parser.parse('${{.foo}}')).toThrow(new UnexpectedTokenError('.', 3));
    });
  });
});
