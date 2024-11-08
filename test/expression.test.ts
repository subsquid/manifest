import { ParsingError, Parser, EvaluationError } from '../src/expression';

describe('Expression', () => {
  const parser = new Parser();

  it('string', () => {
    const value = parser.parse('hello').eval();
    expect(value).toEqual('hello');
  });

  it('should resolve identifier', () => {
    const value = parser.parse('${{foo}}').eval({ foo: 'foo' });
    expect(value).toEqual('foo');
  });

  it('should throw on not defined identifier', () => {
    expect(() => parser.parse('${{foo}}').eval({})).toThrow(
      new EvaluationError('"foo" is not defined'),
    );
  });

  it('should resolve member access', () => {
    const value = parser.parse('${{foo.bar}}').eval({ foo: { bar: 'bar' } });
    expect(value).toEqual('bar');
  });

  it('should resolve chained member access', () => {
    const value = parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: { baz: 'baz' } } });
    expect(value).toEqual('baz');
  });

  it('should resolve member access with spaces', () => {
    const value = parser.parse('${{foo  .    bar}}').eval({ foo: { bar: 'bar' } });
    expect(value).toEqual('bar');
  });

  it('should throw on member access with not defined child', () => {
    expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: { bar: {} } })).toThrow(
      new EvaluationError('"foo.bar.baz" is not defined'),
    );
  });

  it('should throw on member access with not defined parent', () => {
    expect(() => parser.parse('${{foo.bar.baz}}').eval({ foo: {} })).toThrow(
      new EvaluationError('"foo.bar" is not defined'),
    );
  });

  it('should throw on unexpected char', () => {
    expect(() => parser.parse('${{foo @ bar}}')).toThrow(
      new ParsingError(`Unexpected '@'`, [0, 7]),
    );
  });

  it('should throw on unexpected char 2', () => {
    expect(() => parser.parse('${{foo.9bar}}')).toThrow(new ParsingError(`Unexpected '9'`, [0, 7]));
  });

  it('should throw on unexpected char', () => {
    expect(() => parser.parse('${{.foo}}')).toThrow(new ParsingError(`Unexpected '.'`, [0, 3]));
  });

  it('should throw on unexpected EOF', () => {
    expect(() => parser.parse('${{foo.}}')).toThrow(new ParsingError(`Unexpected EOF`, [0, 7]));
  });

  it('should throw on empty expression', () => {
    expect(() => parser.parse('${{    }}')).toThrow(new ParsingError(`Unexpected EOF`, [0, 7]));
  });

  it('should resolve wrapped expression', () => {
    const value = parser.parse('hello ${{foo}} world').eval({ foo: 'foo' });
    expect(value).toEqual('hello foo world');
  });

  it('should resolve double expression', () => {
    const value = parser.parse('${{foo}} ${{bar}}').eval({ foo: 'foo', bar: 'bar' });
    expect(value).toEqual('foo bar');
  });

  it('should resolve variables', () => {
    const variables = parser.parse('${{foo.bar}}').variables();
    expect(variables).toEqual(['foo']);
  });

  it('should resolve variables with path', () => {
    const variables = parser.parse('${{foo.bar}}').variables(['foo']);
    expect(variables).toEqual(['bar']);
  });
});
