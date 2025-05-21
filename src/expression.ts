import assert from 'assert';

export class ParsingError extends Error {
  readonly name = 'ParsingError';
  constructor(message: string, pos: number) {
    super(message + ` [${pos}]`);
  }
}

export class UnexpectedTokenError extends ParsingError {
  constructor(token: string, pos: number) {
    super(`Unexpected token '${token}'`, pos);
  }
}

export class EvaluationError extends Error {
  readonly name = 'EvaluationError';
}

export class UndefinedVariableError extends EvaluationError {
  constructor(path: string | string[], child?: string) {
    const pathStr = Array.isArray(path) ? path.join('.') : path;
    super(`"${pathStr}" is not defined${child ? ` (reading '${child}')` : ''}`);
  }
}

export function isTrue(value: unknown): boolean {
  switch (value) {
    case undefined:
    case null:
    case '':
    case 0:
    case false:
      return false;
    default:
      return true;
  }
}

export enum OpType {
  Or,
  And,
  MemberAccess,
  Identifier,
  StringLiteral,
  Parentheses,
}

interface Token {
  type: OpType;
  eval: (ctx: any, path: string[]) => { value: unknown; path: string[] };
}

export const EXPR_PATTERN = /(\${{[^}]*}})/;

export class Parser {
  parse(str: string): Expression {
    const tokens: (string | Token)[] = [];
    let pos = 0;

    str.split(EXPR_PATTERN).forEach(i => {
      if (EXPR_PATTERN.test(i)) {
        const token = new Tokenizer(i.slice(3, i.length - 2), pos + 3).parse();
        if (token) {
          tokens.push(token);
        }
      } else if (i) {
        tokens.push(i);
      }
      pos += i.length;
    });

    return new Expression(tokens);
  }
}

export class Tokenizer {
  private pos = 0;

  constructor(
    private str: string,
    private offset = 0,
  ) {}

  parse(): Token | undefined {
    const res = this.next(0);
    if (this.pos < this.str.length) {
      throw this.unexpectedToken(this.str[this.pos], this.pos);
    }
    return res;
  }

  private next(precedence: number): Token | undefined {
    this.whitespace();
    let res = this.unary();

    while (this.whitespace()) {
      const token = this.binary(res, precedence);
      if (!token) break;
      res = token;
    }

    return res;
  }

  private binary(left: Token | undefined, precedence: number): Token | undefined {
    return this.or(left, precedence) || this.access(left, precedence);
  }

  private or(left: Token | undefined, precedence: number): Token | undefined {
    if (!this.match('||') || precedence > OpType.Or) return;
    if (!left) throw this.unexpectedToken('||', this.pos);

    const start = this.pos;
    this.pos += 2;

    const right = this.next(OpType.Or + 1);
    if (!right) throw this.unexpectedToken('||', start);

    return {
      type: OpType.Or,
      eval: (ctx, path) => {
        const leftValue = left.eval(ctx, path);
        return isTrue(leftValue.value) ? leftValue : right.eval(ctx, path);
      },
    };
  }

  private access(left: Token | undefined, precedence: number): Token | undefined {
    if (!this.match('.') || precedence > OpType.MemberAccess) return;
    if (!left) throw this.unexpectedToken('.', this.pos);

    const start = this.pos;
    this.pos++;

    const right = this.next(OpType.MemberAccess + 1);
    if (!right) throw this.unexpectedToken('.', start);

    return {
      type: OpType.MemberAccess,
      eval: (ctx, path) => {
        const leftValue = left.eval(ctx, path);
        return right.eval(leftValue.value, leftValue.path);
      },
    };
  }

  private unary(): Token | undefined {
    return this.paren() || this.string() || this.id();
  }

  private paren(): Token | undefined {
    if (!this.match('(')) return;

    const start = this.pos;
    this.pos++;

    const expr = this.next(0);
    this.whitespace();

    if (!expr) return;
    if (!this.match(')')) {
      throw this.unexpectedToken(this.str.slice(start, this.pos), start);
    }

    this.pos++;
    return {
      type: OpType.Parentheses,
      eval: (ctx, path) => expr.eval(ctx, path),
    };
  }

  private string(): Token | undefined {
    if (!this.match("'")) return;
    this.pos++;

    let result = '';
    while (this.pos < this.str.length) {
      if (this.match("'")) {
        this.pos++;
        if (!this.match("'")) {
          this.pos++;
          return {
            type: OpType.StringLiteral,
            eval: (_, path) => ({ value: result, path }),
          };
        }
      }
      result += this.str[this.pos++];
    }

    throw this.unexpectedToken("'" + result, this.pos - result.length - 1);
  }

  private id(): Token | undefined {
    const start = this.pos;
    while (this.isIdentifierChar(this.str[this.pos])) {
      if (this.str[this.pos] === '-' && !this.isAlphaNum(this.str[this.pos + 1])) {
        throw this.unexpectedToken('-', this.pos);
      }
      this.pos++;
    }
    if (this.pos === start) return;

    const id = this.str.slice(start, this.pos);
    return {
      type: OpType.Identifier,
      eval: (ctx, path) => {
        if (ctx === undefined || ctx === null) {
          throw new UndefinedVariableError(path, id);
        }

        const newPath = [...path, id];
        if (ctx.hasOwnProperty(id)) {
          return { value: ctx[id], path: newPath };
        } else if (path.length === 0) {
          throw new UndefinedVariableError(newPath);
        }
        return { value: undefined, path: newPath };
      },
    };
  }

  private whitespace(): boolean {
    while (this.isWhitespace(this.str[this.pos])) {
      this.pos++;
    }
    return this.pos < this.str.length;
  }

  private match(expected: string): boolean {
    return this.str.slice(this.pos, this.pos + expected.length) === expected;
  }

  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }

  private isAlphaNum(char: string): boolean {
    return this.isDigit(char) || this.isAlpha(char);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private isIdentifierChar(char: string): boolean {
    return this.isAlphaNum(char) || char === '_' || char === '-';
  }

  private unexpectedToken(token: string, pos: number) {
    return new UnexpectedTokenError(token, pos + this.offset);
  }
}

export class Expression {
  constructor(readonly tokens: (string | Token)[]) {}

  eval(context: Record<string, any> = {}): string {
    return this.tokens
      .map(token => (typeof token === 'string' ? token : token.eval(context, []).value))
      .join('');
  }
}
