import {
  ParsingError,
  Parser,
  EvaluationError,
  UnexpectedTokenError,
  UnexpectedEndOfExpressionError,
  UnexpectedEndOfStringError,
  UndefinedVariableError,
} from '../src/expression';

describe('Expression', () => {
  const parser = new Parser();

  it('should parse string literal', () => {
    const value = parser.parse('hello').eval();
    expect(value).toEqual('hello');
  });

  describe('identifiers', () => {
    it('should evaluate defined identifier to its value', () => {
      const value = parser.parse('${{foo}}').eval({ foo: 'foo' });
      expect(value).toEqual('foo');
    });

    it('should reject undefined top-level identifier', () => {
      expect(() => parser.parse('${{foo}}').eval({})).toThrow(new UndefinedVariableError(['foo']));
    });

    it('should reject undefined nested identifier with parent context', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: null })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should reject undefined nested identifier with undefined parent', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: undefined })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should evaluate identifiers with hyphens and underscores', () => {
      expect(parser.parse('${{foo-bar}}').eval({ ['foo-bar']: 'value' })).toEqual('value');
      expect(parser.parse('${{foo_bar}}').eval({ ['foo_bar']: 'value' })).toEqual('value');
      expect(parser.parse('${{foo1337}}').eval({ ['foo1337']: 'value' })).toEqual('value');
    });

    it('should reject identifiers starting with numbers or ending with hyphens', () => {
      expect(() => parser.parse('${{foo-}}').eval({})).toThrow(new UnexpectedTokenError('-', 6));
      expect(() => parser.parse('${{9foo}}').eval({})).toThrow(new UnexpectedTokenError('9', 3));
    });
  });

  describe('member access', () => {
    it('should evaluate single level property access', () => {
      const value = parser.parse('${{foo.bar}}').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should evaluate multi-level property access', () => {
      const value = parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: { baz: 'baz' } } });
      expect(value).toEqual('baz');
    });

    it('should ignore whitespace around dot operator', () => {
      const value = parser.parse('${{foo  .    bar}}').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should reject undefined nested properties with parent context', () => {
      expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: null } })).toThrow(
        new UndefinedVariableError(['foo', 'bar'], 'baz'),
      );
    });

    it('should reject properties on null/undefined with parent context', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: null })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: undefined })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should reject deep nested properties on null/undefined', () => {
      expect(() => parser.parse('${{foo.bar.baz.qux}}').eval({ foo: { bar: null } })).toThrow(
        new UndefinedVariableError(['foo', 'bar'], 'baz'),
      );
    });

    it('should reject invalid member access syntax', () => {
      expect(() => parser.parse('${{.foo}}')).toThrow(new UnexpectedTokenError('.', 3));
      expect(() => parser.parse('${{foo.}}')).toThrow(new UnexpectedEndOfExpressionError(7));
    });
  });

  describe('parsing errors', () => {
    it('should reject expressions with invalid characters', () => {
      expect(() => parser.parse('${{foo @ bar}}')).toThrow(new UnexpectedTokenError('@', 7));
      expect(() => parser.parse('${{foo.9bar}}')).toThrow(new UnexpectedTokenError('9', 7));
    });

    it('should reject empty expressions', () => {
      expect(() => parser.parse('${{    }}')).toThrow(new UnexpectedEndOfExpressionError(7));
    });
  });

  describe('value handling', () => {
    it('should convert null and undefined values to empty string', () => {
      expect(parser.parse('${{undefined}}').eval({ undefined: undefined })).toEqual('');
      expect(parser.parse('${{null}}').eval({ null: null })).toEqual('');
      expect(parser.parse('${{empty}}').eval({ empty: '' })).toEqual('');
    });
  });

  describe('complex expressions', () => {
    it('should evaluate expressions mixed with static text', () => {
      const value = parser.parse('hello ${{foo}} world').eval({ foo: 'foo' });
      expect(value).toEqual('hello foo world');
    });

    it('should evaluate multiple expressions in sequence', () => {
      const value = parser.parse('${{foo}} ${{bar}}').eval({ foo: 'foo', bar: 'bar' });
      expect(value).toEqual('foo bar');
    });

    it('should reject undefined top-level identifiers in complex expressions', () => {
      expect(() => parser.parse('hello ${{foo}} world').eval({})).toThrow(
        new UndefinedVariableError(['foo']),
      );
    });

    it('should reject undefined nested properties in complex expressions', () => {
      expect(() => parser.parse('hello ${{foo.bar}} world').eval({ foo: null })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });

    it('should handle multiple nested expressions with errors', () => {
      expect(() => parser.parse('${{foo.bar}} ${{baz.qux}}').eval({ foo: null, baz: {} })).toThrow(
        new UndefinedVariableError(['foo'], 'bar'),
      );
    });
  });

  describe('variables', () => {
    it('should extract root level variable names', () => {
      const variables = parser.parse('${{foo.bar}}').variables();
      expect(variables).toEqual(['foo']);
    });

    it('should extract nested variable names with prefix', () => {
      const variables = parser.parse('${{foo.bar}}').variables(['foo']);
      expect(variables).toEqual(['bar']);
    });
  });

  describe('string literals', () => {
    it('should evaluate simple string literals', () => {
      const value = parser.parse("${{'hello'}}").eval();
      expect(value).toEqual('hello');
    });

    it('should handle escaped quotes in string literals', () => {
      const value = parser.parse("${{'hello''world'}}").eval();
      expect(value).toEqual("hello'world");
    });

    it('should reject unclosed string literals', () => {
      expect(() => parser.parse("${{'hello}}")).toThrow(new UnexpectedEndOfStringError('hello', 9));
    });

    it('should reject string literals after identifiers', () => {
      expect(() => parser.parse("${{foo'bar'}}")).toThrow(new UnexpectedTokenError("'", 6));
    });
  });

  describe('error messages', () => {
    it('should include full path in top-level error messages', () => {
      expect(() => parser.parse('${{foo}}').eval({})).toThrow('"foo" is not defined');
    });

    it('should include parent context and property in nested error messages', () => {
      expect(() => parser.parse('${{foo.bar}}').eval({ foo: null })).toThrow(
        '"foo" is not defined (reading \'bar\')',
      );
    });

    it('should include full path and property in deep nested error messages', () => {
      expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: null } })).toThrow(
        '"foo.bar" is not defined (reading \'baz\')',
      );
    });
  });
});
