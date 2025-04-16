import { ParsingError, Parser, EvaluationError } from '../src/expression';

describe('Expression', () => {
  const parser = new Parser();

  it('should parse string literal', () => {
    const value = parser.parse('hello').eval();
    expect(value).toEqual('hello');
  });

  describe('identifiers', () => {
    it('should resolve basic identifier', () => {
      const value = parser.parse('${{foo}}').eval({ foo: 'foo' });
      expect(value).toEqual('foo');
    });

    it('should resolve identifiers with special characters', () => {
      expect(parser.parse('${{foo-bar}}').eval({ ['foo-bar']: 'value' })).toEqual('value');
      expect(parser.parse('${{foo_bar}}').eval({ ['foo_bar']: 'value' })).toEqual('value');
      expect(parser.parse('${{foo1337}}').eval({ ['foo1337']: 'value' })).toEqual('value');
    });

    it('should throw on invalid identifiers', () => {
      expect(() => parser.parse('${{foo-}}').eval({})).toThrow(
        new EvaluationError("Unexpected '-' [0,6]"),
      );
      expect(() => parser.parse('${{9foo}}').eval({})).toThrow(
        new EvaluationError("Unexpected '9' [0,3]"),
      );
    });

    it('should throw on not defined identifier', () => {
      expect(() => parser.parse('${{foo}}').eval({})).toThrow(
        new EvaluationError('"foo" is not defined'),
      );
    });
  });

  describe('member access', () => {
    it('should resolve member access', () => {
      const value = parser.parse('${{foo.bar}}').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should resolve chained member access', () => {
      const value = parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: { baz: 'baz' } } });
      expect(value).toEqual('baz');
    });

    it('should handle whitespace in member access', () => {
      const value = parser.parse('${{foo  .    bar}}').eval({ foo: { bar: 'bar' } });
      expect(value).toEqual('bar');
    });

    it('should throw on undefined members', () => {
      expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: {} } })).toThrow(
        new EvaluationError('"foo.bar.baz" is not defined'),
      );
      expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: {} })).toThrow(
        new EvaluationError('"foo.bar" is not defined'),
      );
    });

    it('should throw on invalid syntax', () => {
      expect(() => parser.parse('${{.foo}}')).toThrow(new ParsingError("Unexpected '.'", [0, 3]));
      expect(() => parser.parse('${{foo.}}')).toThrow(new ParsingError('Unexpected EOF', [0, 7]));
    });
  });

  describe('parsing errors', () => {
    it('should throw on unexpected characters', () => {
      expect(() => parser.parse('${{foo @ bar}}')).toThrow(
        new ParsingError("Unexpected '@'", [0, 7]),
      );
      expect(() => parser.parse('${{foo.9bar}}')).toThrow(
        new ParsingError("Unexpected '9'", [0, 7]),
      );
    });

    it('should throw on empty expression', () => {
      expect(() => parser.parse('${{    }}')).toThrow(new ParsingError('Unexpected EOF', [0, 7]));
    });
  });

  describe('value handling', () => {
    it('should handle falsy values', () => {
      expect(parser.parse('${{undefined}}').eval({ undefined: undefined })).toEqual('');
      expect(parser.parse('${{null}}').eval({ null: null })).toEqual('');
      expect(parser.parse('${{false}}').eval({ false: false })).toEqual('false');
      expect(parser.parse('${{zero}}').eval({ zero: 0 })).toEqual('0');
      expect(parser.parse('${{empty}}').eval({ empty: '' })).toEqual('');
    });
  });

  describe('complex expressions', () => {
    it('should resolve wrapped expression', () => {
      const value = parser.parse('hello ${{foo}} world').eval({ foo: 'foo' });
      expect(value).toEqual('hello foo world');
    });

    it('should resolve multiple expressions', () => {
      const value = parser.parse('${{foo}} ${{bar}}').eval({ foo: 'foo', bar: 'bar' });
      expect(value).toEqual('foo bar');
    });
  });

  describe('variables', () => {
    it('should resolve root variables', () => {
      const variables = parser.parse('${{foo.bar}}').variables();
      expect(variables).toEqual(['foo']);
    });

    it('should resolve nested variables', () => {
      const variables = parser.parse('${{foo.bar}}').variables(['foo']);
      expect(variables).toEqual(['bar']);
    });
  });
});
