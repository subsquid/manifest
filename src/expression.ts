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

interface OperatorConfig {
  type: OpType;
  associativity: 'left' | 'right';
}

interface Token {
  type: OpType;
  eval: (ctx: any, path: string[]) => { value: unknown; path: string[] };
  //variables: (prefix: string[]) => string[];
}

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
      } else if (!!i) {
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
    this.whitespace();
    let res = this.unary();

    while (this.whitespace()) {
      const token = this.binary(res, precedence);
      if (!token) {
        break;
      }
      res = token;
    }

    return res;
  }

  private binary(left: Token | undefined, precedence: number): Token | undefined {
    return this.or(left, precedence) || this.access(left, precedence);
  }

  private or(left: Token | undefined, precedence: number): Token | undefined {
    if (this.str[this.pos] !== '|' || this.str[this.pos + 1] !== '|') return;
    if (precedence > OpType.Or) return;

    const start = this.pos;

    if (!left) {
      throw this.unexpectedToken('||', start);
    }
    this.pos += 2;
    const right = this.next(OpType.Or + 1);
    if (!right) {
      throw this.unexpectedToken('||', start);
    }
    return {
      type: OpType.Or,
      eval: (ctx, path) => {
        const leftValue = left.eval(ctx, path);
        return isTrue(leftValue.value) ? leftValue : right.eval(ctx, path);
      },
    };
  }

  private access(left: Token | undefined, precedence: number): Token | undefined {
    if (this.str[this.pos] !== '.') return;
    if (precedence > OpType.MemberAccess) return;

    if (!left) {
      throw this.unexpectedToken('.', this.pos);
    }

    const start = this.pos;
    this.pos++;
    const right = this.next(OpType.MemberAccess + 1);
    if (!right) {
      throw this.unexpectedToken('.', start);
    }

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
    return {
      type: OpType.Parentheses,
      eval: (ctx, path) => expr.eval(ctx, path),
    };
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
          return {
            type: OpType.StringLiteral,
            eval: (_, path) => ({ value: result, path }),
          };
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
        } else {
          return { value: undefined, path: newPath };
        }
      },
    };
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
  constructor(readonly tokens: (string | Token)[]) {}

  eval(context: Record<string, any> = {}): string {
    const res: unknown[] = [];

    for (const token of this.tokens) {
      if (typeof token === 'string') {
        res.push(token);
      } else {
        const { value } = token.eval(context, []);
        res.push(value);
      }
    }

    return res.join('');
  }

  //variables(prefix: string[] = []): string[] {
  //  const result = new Set<string>();
  //
  //  for (const token of this.tokens) {
  //    if (token && typeof token !== 'string') {
  //      this.collectVariables(token, result, prefix);
  //    }
  //  }
  //
  //  return [...result];
  //}

  // private collectVariables(node: Token, result: Set<string>, path: string[] = []): void {
  //   const [type, ...args] = node;
  //
  //   switch (type) {
  //     case OpType.Or:
  //     case OpType.And: {
  //       assert(Array.isArray(args[0]) && Array.isArray(args[1]), 'Or and And must have two tokens');
  //       this.collectVariables(args[0], result, path);
  //       this.collectVariables(args[1], result, path);
  //       break;
  //     }
  //     case OpType.MemberAccess: {
  //       assert(
  //         Array.isArray(args[0]) && Array.isArray(args[1]),
  //         'MemberAccess must have two tokens',
  //       );
  //       if (path.length > 0) {
  //         const memberExpr = args[0];
  //         if (memberExpr[0] === OpType.Identifier && memberExpr[1] === path[0]) {
  //           this.collectVariables(args[1], result, path.slice(1));
  //         }
  //       } else {
  //         const memberExpr = args[0];
  //         if (memberExpr[0] === OpType.Identifier) {
  //           result.add(memberExpr[1]);
  //         } else {
  //           this.collectVariables(memberExpr, result, path);
  //         }
  //       }
  //       break;
  //     }
  //     case OpType.Identifier: {
  //       assert(typeof args[0] === 'string', 'Identifier must be a string');
  //       const id = args[0];
  //       if (path.length === 0) {
  //         result.add(id);
  //       } else if (path.length === 1 && path[0] === id) {
  //       } else if (path.length > 0 && path[0] !== id) {
  //       } else {
  //         result.add(id);
  //       }
  //       break;
  //     }
  //   }
  // }
}
