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

export class ExpressionNotResolvedError extends EvaluationError {
  constructor(expr: string) {
    super(`${expr} was not resolved to any value`);
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

export function isNull(value: unknown): boolean {
  return value === null || value === undefined;
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function isAlphaNum(char: string): boolean {
  return isDigit(char) || isAlpha(char);
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isAlpha(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}

function isIdentifierChar(char: string): boolean {
  return isAlphaNum(char) || char === '_' || char === '-';
}

export enum OpType {
  Or,
  And,
  MemberAccess,
  Identifier,
  StringLiteral,
  Parentheses,
}

const operators: Record<
  OpType,
  {
    create: (...args: any[]) => Token;
    eval: (token: Token, ctx: any, path: string[]) => { value: unknown; path: string[] };
  }
> = {
  [OpType.Or]: {
    create: (left: Token, right: Token) =>
      left[0] === OpType.Or
        ? [OpType.Or, left[1], [OpType.Or, left[2], right]]
        : [OpType.Or, left, right],
    eval: (token: Token, ctx: any, path: string[]) => {
      const [type, left, right] = token;
      assert(type === OpType.Or);
      const leftValue = operators[left[0]].eval(left, ctx, path);
      return isTrue(leftValue.value) ? leftValue : operators[right[0]].eval(right, ctx, path);
    },
  },
  [OpType.And]: {
    create: (left: Token, right: Token) =>
      left[0] === OpType.And
        ? [OpType.And, left[1], [OpType.And, left[2], right]]
        : [OpType.And, left, right],
    eval: (token: Token, ctx: any, path: string[]) => {
      const [type, left, right] = token;
      assert(type === OpType.And);
      const leftValue = operators[left[0]].eval(left, ctx, path);
      return isTrue(leftValue.value) ? operators[right[0]].eval(right, ctx, path) : leftValue;
    },
  },
  [OpType.MemberAccess]: {
    create: (left: Token, right: Token) => [OpType.MemberAccess, left, right],
    eval: (token: Token, ctx: any, path: string[]) => {
      const [type, left, right] = token;
      assert(type === OpType.MemberAccess);
      const leftValue = operators[left[0]].eval(left, ctx, path);
      return operators[right[0]].eval(right, leftValue.value, leftValue.path);
    },
  },
  [OpType.Identifier]: {
    create: (id: string) => [OpType.Identifier, id],
    eval: (token: Token, ctx: any, path: string[]) => {
      const [type, id] = token;
      assert(type === OpType.Identifier);

      if (isNull(ctx)) {
        throw new UndefinedVariableError(path, id);
      }

      if (ctx.hasOwnProperty(id)) {
        return { value: ctx[id], path: [...path, id] };
      }

      if (path.length === 0) {
        throw new UndefinedVariableError([id]);
      }

      return { value: undefined, path: [...path, id] };
    },
  },
  [OpType.StringLiteral]: {
    create: (str: string) => [OpType.StringLiteral, str],
    eval: (token: Token, _: any, path: string[]) => {
      const [type, str] = token;
      assert(type === OpType.StringLiteral);
      return { value: str, path };
    },
  },
  [OpType.Parentheses]: {
    create: (expr: Token) => [OpType.Parentheses, expr],
    eval: (token: Token, ctx: any, path: string[]) => {
      const [type, expr] = token;
      assert(type === OpType.Parentheses);
      return operators[expr[0]].eval(expr, ctx, path);
    },
  },
};

type Token =
  | [OpType.Or | OpType.And, Token, Token]
  | [OpType.MemberAccess, Token, Token]
  | [OpType.Identifier, string]
  | [OpType.StringLiteral, string]
  | [OpType.Parentheses, Token];

export const EXPR_PATTERN = /(\${{[^}]*}})/g;

export class Parser {
  parse(str: string): Expression {
    const parts: (string | { token: Token; expr: string })[] = [];
    let lastIndex = 0;

    for (const match of str.matchAll(EXPR_PATTERN)) {
      const index = match.index || 0;

      if (index > lastIndex) {
        parts.push(str.slice(lastIndex, index));
      }

      const expr = match[1];
      if (expr && expr.length > 4) {
        const token = new Tokenizer(expr.slice(3, expr.length - 2), index + 3).parse();
        if (token) {
          parts.push({ token, expr: match[1] });
        }
      }

      lastIndex = index + match[0].length;
    }

    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }

    return new Expression(parts);
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
    return this.access(left, precedence) || this.and(left, precedence) || this.or(left, precedence);
  }

  private or(left: Token | undefined, precedence: number): Token | undefined {
    if (!this.match('||') || precedence > OpType.Or) return;
    if (!left) throw this.unexpectedToken('||', this.pos);

    const start = this.pos;
    this.pos += 2;

    const right = this.next(OpType.Or);
    if (!right) throw this.unexpectedToken('||', start);

    return operators[OpType.Or].create(left, right);
  }

  private and(left: Token | undefined, precedence: number): Token | undefined {
    if (!this.match('&&') || precedence > OpType.And) return;
    if (!left) throw this.unexpectedToken('&&', this.pos);

    const start = this.pos;
    this.pos += 2;

    const right = this.next(OpType.And);
    if (!right) throw this.unexpectedToken('&&', start);

    return operators[OpType.And].create(left, right);
  }

  private access(left: Token | undefined, precedence: number): Token | undefined {
    if (!this.match('.') || precedence > OpType.MemberAccess) return;
    if (!left) throw this.unexpectedToken('.', this.pos);

    const start = this.pos;
    this.pos++;

    const right = this.next(OpType.MemberAccess);
    if (!right) throw this.unexpectedToken('.', start);

    return operators[OpType.MemberAccess].create(left, right);
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
    return operators[OpType.Parentheses].create(expr);
  }

  private string(): Token | undefined {
    if (!this.match("'")) return;

    const start = this.pos;
    this.pos++;

    while (this.pos < this.str.length) {
      if (this.match("'")) {
        this.pos++;
        if (!this.match("'")) {
          const value = this.str.slice(start + 1, this.pos - 1).replace(/''/g, "'");
          return operators[OpType.StringLiteral].create(value);
        }
      }
      this.pos++;
    }

    throw this.unexpectedToken(this.str.slice(start, this.pos), start);
  }

  private id(): Token | undefined {
    const start = this.pos;
    while (isIdentifierChar(this.str[this.pos])) {
      if (this.str[this.pos] === '-' && !isAlphaNum(this.str[this.pos + 1])) {
        throw this.unexpectedToken('-', this.pos);
      }
      this.pos++;
    }
    if (this.pos === start) return;

    const id = this.str.slice(start, this.pos);
    return operators[OpType.Identifier].create(id);
  }

  private whitespace(): boolean {
    while (isWhitespace(this.str[this.pos])) {
      this.pos++;
    }
    return this.pos < this.str.length;
  }

  private match(expected: string): boolean {
    return this.str.startsWith(expected, this.pos);
  }

  private unexpectedToken(token: string, pos: number) {
    return new UnexpectedTokenError(token, pos + this.offset);
  }
}

export class Expression {
  constructor(readonly parts: (string | { token: Token; expr: string })[]) {}

  eval(context: Record<string, any> = {}): string {
    const result = this.parts
      .map(part => {
        if (typeof part === 'string') return part;
        const { token, expr } = part;
        const evaluated = operators[token[0]].eval(token, context, []).value;
        if (isNull(evaluated)) {
          throw new ExpressionNotResolvedError(expr);
        }
        return evaluated;
      })
      .join('');

    return result;
  }
}
