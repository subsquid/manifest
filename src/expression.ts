import assert from 'assert';

export const EXPR_PATTERN = /(\${{[^}]*}})/;

const nums = new Set('0123456789'.split(''));
const alpha = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
const alphaNum = new Set([...nums, ...alpha]);
const identifiers = new Set([...alphaNum, '_', '-']);

export class ParsingError extends Error {
  readonly name = 'ParsingError';

  constructor(message: string, pos: number) {
    super(message + ` [${pos}]`);
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

export class UnexpectedTokenError extends ParsingError {
  constructor(token: string, pos: number) {
    super(`Unexpected token '${token}'`, pos);
  }
}

export class UnexpectedEndOfExpressionError extends ParsingError {
  constructor(pos: number) {
    super('Unexpected end of expression', pos);
  }
}

export class UnexpectedEndOfStringError extends ParsingError {
  constructor(str: string, pos: number) {
    super("Unexpected end of string: '${str}", pos);
  }
}

export class Parser {
  constructor() {}

  parse(str: string): Expression {
    const tokens: (string | Token)[] = [];

    let pos = 0;
    str.split(EXPR_PATTERN).map(i => {
      if (EXPR_PATTERN.test(i)) {
        tokens.push(new Tokenizer(i.slice(3, i.length - 2), pos + 3).tokenize());
      } else {
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

  private getPos(): number {
    return this.pos + this.offset;
  }

  tokenize(priority: TokenType = 0): Token {
    let token: Token | undefined;

    while (this.str[this.pos]) {
      while (this.str[this.pos] === ' ') {
        this.pos++;
      }

      switch (this.str[this.pos]) {
        case undefined:
          break;
        case "'":
          if (token) {
            throw new UnexpectedTokenError("'", this.getPos());
          }
          token = new Token(TokenType.StringLiteral, [this.string()]);
          break;
        case '.':
          if (!token) {
            throw new UnexpectedTokenError('.', this.getPos());
          }
          this.pos++;
          token = new Token(TokenType.MemberAccess, [token, this.tokenize(TokenType.MemberAccess)]);

          break;
        case '|':
          if (this.str[this.pos + 1] !== '|') {
            throw new UnexpectedTokenError('|', this.getPos());
          }
          if (!token) {
            throw new UnexpectedTokenError('||', this.getPos());
          }
          if (priority > TokenType.Or) return token;
          this.pos += 2;
          token = new Token(TokenType.Or, [token, this.tokenize(TokenType.Or)]);
          break;
        case '&':
          if (this.str[this.pos + 1] !== '&') {
            throw new UnexpectedTokenError('&', this.getPos());
          }
          if (!token) {
            throw new UnexpectedTokenError('&&', this.getPos());
          }
          if (priority > TokenType.And) return token;
          this.pos += 2;
          token = new Token(TokenType.And, [token, this.tokenize(TokenType.And)]);
          break;
        default:
          const value = this.id();
          if (!value) {
            throw new UnexpectedTokenError(this.str[this.pos], this.getPos());
          }
          if (nums.has(value[0])) {
            throw new UnexpectedTokenError(value[0], this.getPos());
          }
          if (value.endsWith('-')) {
            throw new UnexpectedTokenError('-', this.getPos() + value.length - 1);
          }
          token = new Token(TokenType.Identifier, [value]);
          break;
      }
    }

    if (!token) {
      throw new UnexpectedEndOfExpressionError(this.getPos());
    }

    return token;
  }

  string(): string {
    this.pos++; // Skip opening quote
    let result = '';
    let escaped = false;

    while (this.str[this.pos]) {
      if (escaped) {
        if (this.str[this.pos] === "'") {
          result += "'";
        } else {
          result += this.str[this.pos];
        }
        escaped = false;
      } else if (this.str[this.pos] === "'") {
        if (this.str[this.pos + 1] === "'") {
          escaped = true;
        } else {
          this.pos++; // Skip closing quote
          return result;
        }
      } else {
        result += this.str[this.pos];
      }
      this.pos++;
    }

    throw new UnexpectedEndOfStringError(result, this.getPos());
  }

  id() {
    const start = this.pos;
    while (identifiers.has(this.str[this.pos])) {
      if (this.pos === start && nums.has(this.str[this.pos])) break;
      if (this.str[this.pos] === '-' && !alphaNum.has(this.str[this.pos + 1])) break;

      this.pos++;
    }

    return this.pos > start ? this.str.slice(start, this.pos) : undefined;
  }

  error(msg: string) {
    return new UnexpectedEndOfExpressionError(this.getPos());
  }
}

export enum TokenType {
  Or,
  And,
  MemberAccess,
  StringLiteral,
  Identifier,
}

export class Token {
  constructor(
    readonly type: TokenType,
    readonly nodes: (string | Token)[],
  ) {}

  eval(ctx: any, ctxPath: string[]): { value: unknown; path: string[] } {
    switch (this.type) {
      case TokenType.Or: {
        const [left, right] = this.nodes;
        assert(left instanceof Token);
        assert(right instanceof Token);

        const leftResult = left.eval(ctx, [...ctxPath]);
        if (isTrue(leftResult.value)) {
          return leftResult;
        }

        return right.eval(ctx, [...ctxPath]);
      }
      case TokenType.And: {
        const [left, right] = this.nodes;
        assert(left instanceof Token);
        assert(right instanceof Token);

        const leftResult = left.eval(ctx, [...ctxPath]);
        if (!isTrue(leftResult.value)) {
          return leftResult;
        }

        return right.eval(ctx, [...ctxPath]);
      }
      case TokenType.MemberAccess: {
        const [n0, n1] = this.nodes;
        assert(n0 instanceof Token);
        assert(n1 instanceof Token);

        const { value, path } = n0.eval(ctx, [...ctxPath]);

        return n1.eval(value, [...path]);
      }
      case TokenType.Identifier: {
        const [n0] = this.nodes;
        assert(typeof n0 === 'string');

        if (ctx === undefined || ctx === null) {
          throw new UndefinedVariableError(ctxPath, n0);
        }

        const path = [...ctxPath, n0];
        if (!!ctx?.hasOwnProperty(n0)) {
          return { value: ctx[n0], path };
        } else if (ctxPath.length === 0) {
          throw new UndefinedVariableError(path);
        } else {
          return { value: undefined, path };
        }
      }
      case TokenType.StringLiteral: {
        const [n0] = this.nodes;
        assert(typeof n0 === 'string');
        return { value: n0, path: ctxPath };
      }
    }
  }

  variables(path: string[] = []): string[] {
    const res: Set<string> = new Set();

    switch (this.type) {
      case TokenType.Or: {
        const [left, right] = this.nodes;
        assert(left instanceof Token);
        assert(right instanceof Token);

        left.variables(path).forEach(v => res.add(v));
        right.variables(path).forEach(v => res.add(v));
        break;
      }
      case TokenType.And: {
        const [left, right] = this.nodes;
        assert(left instanceof Token);
        assert(right instanceof Token);

        left.variables(path).forEach(v => res.add(v));
        right.variables(path).forEach(v => res.add(v));
        break;
      }
      case TokenType.MemberAccess: {
        const [n0, n1] = this.nodes;
        assert(n0 instanceof Token);
        assert(n1 instanceof Token);

        const obj = n0.variables()[0];
        if (obj && path.length === 0) {
          res.add(obj);
        } else if (obj === path[0]) {
          n1.variables(path.slice(1)).forEach(v => res.add(v));
        }

        break;
      }
      case TokenType.Identifier: {
        const [n0] = this.nodes;
        assert(typeof n0 === 'string');

        if (path.length === 0) {
          res.add(n0);
        }

        break;
      }
    }

    return [...res];
  }
}

export class EvaluationError extends Error {}

export class UndefinedVariableError extends EvaluationError {
  constructor(path: string[], child?: string) {
    super(`"${path.join('.')}" is not defined${child ? ` (reading '${child}')` : ''}`);
    this.name = 'UndefinedVariableError';
  }
}

export class Expression {
  constructor(readonly tokens: (string | Token)[]) {}

  eval(context: Record<string, any> = {}): string {
    const res: (string | undefined)[] = [];

    for (const token of this.tokens) {
      if (typeof token === 'string') {
        res.push(token);
      } else {
        const { value } = token.eval(context, []);
        res.push(value === undefined || value === null ? '' : String(value));
      }
    }

    return res.join('');
  }

  variables(path: string[] = []) {
    const res: Set<string> = new Set();

    for (const token of this.tokens) {
      if (typeof token === 'string') {
      } else {
        token.variables(path).forEach(v => res.add(v));
      }
    }

    return [...res];
  }
}
