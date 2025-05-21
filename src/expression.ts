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
  Or,
  And,
  MemberAccess,
  Identifier,
  StringLiteral,
  Parentheses,
}

interface OperatorConfig {
  type: OpType;
  associativity: 'left' | 'right';
}

export type Token =
  | [OpType.Or, Token, Token]
  | [OpType.And, Token, Token]
  | [OpType.MemberAccess, Token, Token]
  | [OpType.Identifier, string]
  | [OpType.StringLiteral, string]
  | [OpType.Parentheses, Token];

export const EXPR_PATTERN = /(\${{[^}]*}})/;

export class Parser {
  constructor() {}

  parse(str: string): Expression {
    const tokens: (string | Token)[] = [];

    let pos = 0;
    str.split(EXPR_PATTERN).map(i => {
      if (EXPR_PATTERN.test(i)) {
        const token = new Tokenizer(i.slice(3, i.length - 2), pos + 3).parse();
        if (token) {
          tokens.push(token);
        }
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

  parse(): Token | undefined {
    const res = this.next(0);
    if (this.pos < this.str.length) {
      throw this.unexpectedToken(this.str[this.pos], this.pos);
    }
    return res;
  }

  private next(precedence: number): Token | undefined {
    let left = this.atom();
    if (left === undefined) {
      return undefined;
    }

    while (this.whitespace()) {
      const start = this.pos;
      const operator = this.operator();
      if (!operator || operator.type < precedence) {
        break;
      }
      const nextPrecedence = operator.associativity === 'left' ? operator.type + 1 : operator.type;
      this.pos += operator.length;
      const right = this.next(nextPrecedence);
      if (right === undefined) {
        throw this.unexpectedToken(this.str.slice(start, this.pos), start);
      }
      left = [operator.type, left, right] as Token;
    }

    return left;
  }

  private operator() {
    switch (this.str[this.pos]) {
      case '|':
        if (this.str[this.pos + 1] === '|') {
          return { type: OpType.Or, associativity: 'left', length: 2 };
        }
        break;
      case '.':
        return { type: OpType.MemberAccess, associativity: 'left', length: 1 };
      default:
        return undefined;
    }

    return undefined;
  }

  private atom(): Token | undefined {
    this.whitespace();
    return this.paren() || this.string() || this.id();
  }

  private paren(): Token | undefined {
    if (this.str[this.pos] !== '(') return;

    const start = this.pos;
    this.pos++;
    const expr = this.next(0);
    this.whitespace();
    if (expr === undefined) return;
    if (this.str[this.pos] !== ')') {
      throw this.unexpectedToken(this.str.slice(start, this.pos), start);
    }
    this.pos++;
    return [OpType.Parentheses, expr];
  }

  private string(): Token | undefined {
    if (this.str[this.pos] !== "'") return;

    this.pos++;
    let result = '';

    while (this.str[this.pos]) {
      if (this.str[this.pos] === "'") {
        this.pos++;
        if (this.str[this.pos] !== "'") {
          this.pos++;
          return [OpType.StringLiteral, result];
        }
      }
      result += this.str[this.pos];
      this.pos++;
    }

    throw this.unexpectedToken("'" + result, this.pos - result.length - 1);
  }

  private id(): Token | undefined {
    const start = this.pos;
    while (identifiers.has(this.str[this.pos])) {
      if (this.str[this.pos] === '-' && !alphaNum.has(this.str[this.pos + 1])) {
        throw this.unexpectedToken('-', this.pos);
      }
      this.pos++;
    }

    if (this.pos === start) return;

    return [OpType.Identifier, this.str.slice(start, this.pos)];
  }

  private whitespace(): boolean {
    while (whitespace.has(this.str[this.pos])) {
      this.pos++;
    }
    return !!this.str[this.pos];
  }

  private unexpectedToken(token: string, pos: number) {
    return new UnexpectedTokenError(token, pos + this.offset);
  }
}

export class Expression {
  constructor(readonly tokens: (string | Token | null)[]) {}

  eval(context: Record<string, any> = {}): string {
    const res: unknown[] = [];

    for (const token of this.tokens) {
      if (token === null) {
        res.push('');
      } else if (typeof token === 'string') {
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
        const leftValue = this.evalToken(args[0], ctx, path);
        return isTrue(leftValue.value) ? leftValue : this.evalToken(args[1], ctx, path);
      }
      case OpType.And: {
        assert(Array.isArray(args[0]) && Array.isArray(args[1]), 'And must have two tokens');
        const leftValue = this.evalToken(args[0], ctx, path);
        return isTrue(leftValue.value) ? this.evalToken(args[1], ctx, path) : leftValue;
      }
      case OpType.MemberAccess: {
        assert(
          Array.isArray(args[0]) && Array.isArray(args[1]),
          'MemberAccess must have two tokens',
        );
        const obj = this.evalToken(args[0], ctx, path);
        return this.evalToken(args[1], obj.value, [...path, ...obj.path]);
      }
      case OpType.Identifier: {
        assert(typeof args[0] === 'string', 'Identifier must be a string');
        const id = args[0];

        if (ctx === undefined || ctx === null) {
          throw new UndefinedVariableError(path, id);
        }

        const newPath = [...path, id];
        if (ctx.hasOwnProperty(id)) {
          return { value: ctx[id], path: newPath };
        } else if (path.length === 0) {
          throw new UndefinedVariableError(newPath);
        } else {
          return { value: undefined, path: newPath };
        }
      }
      case OpType.StringLiteral: {
        assert(typeof args[0] === 'string', 'StringLiteral must be a string');
        return { value: args[0], path };
      }
      case OpType.Parentheses: {
        assert(Array.isArray(args[0]), 'Parentheses must have one token');
        return this.evalToken(args[0], ctx, path);
      }
    }
  }

  variables(prefix: string[] = []): string[] {
    const result = new Set<string>();

    for (const token of this.tokens) {
      if (token && typeof token !== 'string') {
        this.collectVariables(token, result, prefix);
      }
    }

    return [...result];
  }

  private collectVariables(node: Token, result: Set<string>, path: string[] = []): void {
    const [type, ...args] = node;

    switch (type) {
      case OpType.Or:
      case OpType.And: {
        assert(Array.isArray(args[0]) && Array.isArray(args[1]), 'Or and And must have two tokens');
        this.collectVariables(args[0], result, path);
        this.collectVariables(args[1], result, path);
        break;
      }
      case OpType.MemberAccess: {
        assert(
          Array.isArray(args[0]) && Array.isArray(args[1]),
          'MemberAccess must have two tokens',
        );
        if (path.length > 0) {
          const memberExpr = args[0];
          if (memberExpr[0] === OpType.Identifier && memberExpr[1] === path[0]) {
            this.collectVariables(args[1], result, path.slice(1));
          }
        } else {
          const memberExpr = args[0];
          if (memberExpr[0] === OpType.Identifier) {
            result.add(memberExpr[1]);
          } else {
            this.collectVariables(memberExpr, result, path);
          }
        }
        break;
      }
      case OpType.Identifier: {
        assert(typeof args[0] === 'string', 'Identifier must be a string');
        const id = args[0];
        if (path.length === 0) {
          result.add(id);
        } else if (path.length === 1 && path[0] === id) {
        } else if (path.length > 0 && path[0] !== id) {
        } else {
          result.add(id);
        }
        break;
      }
    }
  }
}
