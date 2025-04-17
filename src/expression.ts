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

export class UnexpectedEndOfExpressionError extends ParsingError {
  constructor(pos: number) {
    super('Unexpected end of expression', pos);
  }
}

export class UnexpectedEndOfStringError extends ParsingError {
  constructor(str: string, pos: number) {
    super(`Unexpected end of string: '${str}'`, pos);
  }
}

export class UndefinedVariableError extends Error {
  readonly name = 'UndefinedVariableError';
  constructor(path: string[], child?: string) {
    super(`"${path.join('.')}" is not defined${child ? ` (reading '${child}')` : ''}`);
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
  Or = '||',
  And = '&&',
  MemberAccess = '.',
  StringLiteral = 'str',
  Identifier = 'id',
}

export type Token =
  | [OpType.Or, Token, Token]
  | [OpType.And, Token, Token]
  | [OpType.MemberAccess, Token, Token]
  | [OpType.Identifier, string]
  | [OpType.StringLiteral, string];

export const EXPR_PATTERN = /(\${{[^}]*}})/;

export class Parser {
  constructor() {}

  parse(str: string): Expression {
    const tokens: (string | Token)[] = [];

    let pos = 0;
    str.split(EXPR_PATTERN).map(i => {
      if (EXPR_PATTERN.test(i)) {
        tokens.push(new Tokenizer(i.slice(3, i.length - 2), pos + 3).parse());
      } else {
        tokens.push(i);
      }
      pos += i.length;
    });

    return new Expression(tokens);
  }
}

const nums = new Set([...'0123456789']);
const alpha = new Set([...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']);
const alphaNum = new Set([...nums, ...alpha]);
const identifiers = new Set([...alphaNum, '_', '-']);
const whitespace = new Set([...' \t\n\r']);

export class Tokenizer {
  private pos = 0;

  constructor(
    private str: string,
    private offset = 0,
  ) {}

  private getPos(): number {
    return this.pos + this.offset;
  }

  parse(): Token {
    const res = this.or();
    if (this.pos !== this.str.length) {
      throw new UnexpectedTokenError(this.str[this.pos], this.getPos());
    }
    return res;
  }

  private or(): Token {
    let left = this.and();

    while (this.whitespace()) {
      if (this.str[this.pos] !== '|' || this.str[this.pos + 1] !== '|') break;
      this.pos += 2;
      const right = this.and();
      left = [OpType.Or, left, right];
    }

    return left;
  }

  private and(): Token {
    let left = this.access();

    while (this.whitespace()) {
      if (this.str[this.pos] !== '&' || this.str[this.pos + 1] !== '&') break;
      this.pos += 2;
      const right = this.access();
      left = [OpType.And, left, right];
    }

    return left;
  }

  private access(): Token {
    let left = this.atom();

    while (this.whitespace()) {
      if (this.str[this.pos] !== '.') break;
      this.pos++;
      const right = this.atom();
      left = [OpType.MemberAccess, left, right];
    }

    return left;
  }

  private atom(): Token {
    this.whitespace();

    if (!this.str[this.pos]) {
      throw new UnexpectedEndOfExpressionError(this.getPos());
    }

    if (this.str[this.pos] === "'") {
      return [OpType.StringLiteral, this.string()];
    }

    const id = this.id();
    if (!id) {
      throw new UnexpectedTokenError(this.str[this.pos], this.getPos());
    }

    return [OpType.Identifier, id];
  }

  private string(): string {
    this.pos++;
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
          this.pos++;
          return result;
        }
      } else {
        result += this.str[this.pos];
      }
      this.pos++;
    }

    throw new UnexpectedEndOfStringError(result, this.getPos());
  }

  private id(): string | undefined {
    const start = this.pos;
    while (identifiers.has(this.str[this.pos])) {
      if (this.str[this.pos] === '-' && !alphaNum.has(this.str[this.pos + 1])) {
        throw new UnexpectedTokenError('-', this.getPos());
      }
      this.pos++;
    }

    if (this.pos > start) {
      return this.str.slice(start, this.pos);
    }

    return undefined;
  }

  private whitespace(): boolean {
    while (whitespace.has(this.str[this.pos])) {
      this.pos++;
    }
    return !!this.str[this.pos];
  }
}

export class Expression {
  constructor(readonly tokens: (string | Token)[]) {}

  eval(context: Record<string, any> = {}): string {
    const res: unknown[] = [];

    for (const token of this.tokens) {
      if (typeof token === 'string') {
        res.push(token);
      } else {
        const { value } = this.evalToken(token, context, []);
        res.push(value);
      }
    }

    return res.join('');
  }

  private evalToken(node: Token, ctx: any, path: string[]): { value: unknown; path: string[] } {
    const [type, ...args] = node;

    switch (type) {
      case OpType.Or: {
        assert(Array.isArray(args[0]) && Array.isArray(args[1]), 'Or must have two tokens');
        const leftValue = this.evalToken(args[0], ctx, [...path]);
        return isTrue(leftValue.value) ? leftValue : this.evalToken(args[1], ctx, [...path]);
      }
      case OpType.And: {
        assert(Array.isArray(args[0]) && Array.isArray(args[1]), 'And must have two tokens');
        const leftValue = this.evalToken(args[0], ctx, [...path]);
        return isTrue(leftValue.value) ? this.evalToken(args[1], ctx, [...path]) : leftValue;
      }
      case OpType.MemberAccess: {
        assert(
          Array.isArray(args[0]) && Array.isArray(args[1]),
          'MemberAccess must have two tokens',
        );
        const obj = this.evalToken(args[0], ctx, [...path]);
        return this.evalToken(args[1], obj.value, [...path, ...obj.path]);
      }
      case OpType.Identifier: {
        const id = args[0] as string;
        const newPath = [...path, id];

        if (ctx === undefined || ctx === null) {
          throw new UndefinedVariableError(path, id);
        }

        if (ctx.hasOwnProperty(id)) {
          return { value: ctx[id], path: newPath };
        } else if (path.length === 0) {
          throw new UndefinedVariableError(newPath);
        } else {
          return { value: undefined, path: newPath };
        }
      }
      case OpType.StringLiteral:
        return { value: args[0], path };
    }
  }

  variables(prefix: string[] = []): string[] {
    const result = new Set<string>();

    for (const token of this.tokens) {
      if (typeof token !== 'string') {
        this.collectVariables(token, result, prefix);
      }
    }

    return [...result];
  }

  private collectVariables(node: Token, result: Set<string>, path: string[] = []): void {
    const [type, ...args] = node;

    switch (type) {
      case OpType.Or:
      case OpType.And:
        this.collectVariables(args[0] as Token, result, path);
        this.collectVariables(args[1] as Token, result, path);
        break;

      case OpType.MemberAccess:
        // If we have a prefix path, check if it matches the current path
        if (path.length > 0) {
          const memberExpr = args[0] as Token;
          if (memberExpr[0] === OpType.Identifier && memberExpr[1] === path[0]) {
            // If matched first segment of prefix, continue with the rest
            this.collectVariables(args[1] as Token, result, path.slice(1));
          }
        } else {
          // No prefix, so collect top-level identifiers
          const memberExpr = args[0] as Token;
          if (memberExpr[0] === OpType.Identifier) {
            result.add(memberExpr[1] as string);
          } else {
            this.collectVariables(memberExpr, result, path);
          }
        }
        break;

      case OpType.Identifier:
        const id = args[0] as string;
        if (path.length === 0) {
          // No prefix, collect top-level identifiers
          result.add(id);
        } else if (path.length === 1 && path[0] === id) {
          // This identifier matches our prefix
          // Don't add it to results because we're looking for children
        } else if (path.length > 0 && path[0] !== id) {
          // Not in the path we're looking for
        } else {
          // Add the identifier if we're looking for nested props
          result.add(id);
        }
        break;
    }
  }
}
