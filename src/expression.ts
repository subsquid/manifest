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
  constructor(expr?: string) {
    super(`${expr ? `"${expr}"` : 'Expression'} was not resolved to any value`);
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

export type OpConfig<T extends Token> = {
  parse: (tkzr: Tokenizer, precedence: number, left?: Token) => Token | undefined;
  eval: (token: T, ctx: any, path: string[]) => { value: unknown; path: string[] };
  variables: (token: T, path: string[]) => string[];
};

const operators: Record<OpType, OpConfig<Token>> = {
  [OpType.Or]: {
    parse: (tkzr: Tokenizer, precedence: number, left?: Token) => {
      if (!tkzr.str.startsWith('||', tkzr.pos) || precedence > OpType.Or) return;
      if (!left) throw tkzr.unexpectedToken('||', tkzr.pos);

      const start = tkzr.pos;
      tkzr.pos += 2;

      const right = tkzr.next(OpType.Or);
      if (!right) throw tkzr.unexpectedToken('||', start);

      return left[0] === OpType.Or
        ? [OpType.Or, left[1], [OpType.Or, left[2], right]]
        : [OpType.Or, left, right];
    },
    eval: (token, ctx, path) => {
      const [type, left, right] = token;
      assert(type === OpType.Or);
      const leftValue = operators[left[0]].eval(left, ctx, path);
      return isTrue(leftValue.value) ? leftValue : operators[right[0]].eval(right, ctx, path);
    },
    variables: (token, path) => {
      const [type, left, right] = token;
      assert(type === OpType.Or);
      return [
        ...operators[left[0]].variables(left, path),
        ...operators[right[0]].variables(right, path),
      ];
    },
  },
  [OpType.And]: {
    parse: (tkzr: Tokenizer, precedence: number, left?: Token) => {
      if (!tkzr.str.startsWith('&&', tkzr.pos) || precedence > OpType.And) return;
      if (!left) throw tkzr.unexpectedToken('&&', tkzr.pos);

      const start = tkzr.pos;
      tkzr.pos += 2;

      const right = tkzr.next(OpType.And);
      if (!right) throw tkzr.unexpectedToken('&&', start);

      return left[0] === OpType.And
        ? [OpType.And, left[1], [OpType.And, left[2], right]]
        : [OpType.And, left, right];
    },
    eval: (token, ctx, path) => {
      const [type, left, right] = token;
      assert(type === OpType.And);
      const leftValue = operators[left[0]].eval(left, ctx, path);
      return isTrue(leftValue.value) ? operators[right[0]].eval(right, ctx, path) : leftValue;
    },
    variables: (token, path) => {
      const [type, left, right] = token;
      assert(type === OpType.And);
      return [
        ...operators[left[0]].variables(left, path),
        ...operators[right[0]].variables(right, path),
      ];
    },
  },
  [OpType.MemberAccess]: {
    parse: (tkzr: Tokenizer, precedence: number, left?: Token) => {
      if (!tkzr.str.startsWith('.', tkzr.pos) || precedence > OpType.MemberAccess) return;
      if (!left) throw tkzr.unexpectedToken('.', tkzr.pos);

      const start = tkzr.pos;
      tkzr.pos += 1;

      const right = tkzr.next(OpType.MemberAccess);
      if (!right) throw tkzr.unexpectedToken('.', start);

      return [OpType.MemberAccess, left, right];
    },
    eval: (token, ctx, path) => {
      const [type, left, right] = token;
      assert(type === OpType.MemberAccess);
      const leftValue = operators[left[0]].eval(left, ctx, path);
      return operators[right[0]].eval(right, leftValue.value, leftValue.path);
    },
    variables: (token, path) => {
      const [type, left, right] = token;
      assert(type === OpType.MemberAccess);

      const leftVars = operators[left[0]].variables(left, []);

      if (path.length === 0) {
        return leftVars;
      }

      return leftVars.some(v => v === path[0])
        ? operators[right[0]].variables(right, path.slice(1))
        : [];
    },
  },
  [OpType.Identifier]: {
    parse: (tkzr: Tokenizer, precedence: number) => {
      const start = tkzr.pos;
      while (isIdentifierChar(tkzr.str[tkzr.pos])) {
        if (tkzr.str[tkzr.pos] === '-' && !isAlphaNum(tkzr.str[tkzr.pos + 1])) {
          throw tkzr.unexpectedToken('-', tkzr.pos);
        }
        tkzr.pos += 1;
      }
      if (tkzr.pos === start) return;

      const id = tkzr.str.slice(start, tkzr.pos);
      return [OpType.Identifier, id];
    },
    eval: (token, ctx, path) => {
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
    variables: (token, prefix) => {
      const [type, id] = token;
      assert(type === OpType.Identifier);

      return prefix.length === 0 ? [id] : [];
    },
  },
  [OpType.StringLiteral]: {
    parse: (tkzr: Tokenizer) => {
      if (!tkzr.str.startsWith("'", tkzr.pos)) return;

      const start = tkzr.pos;
      tkzr.pos += 1;

      while (tkzr.str[tkzr.pos]) {
        if (tkzr.str[tkzr.pos] === "'") {
          tkzr.pos += 1;
          if (tkzr.str[tkzr.pos] !== "'") {
            const value = tkzr.str.slice(start + 1, tkzr.pos - 1).replace(/''/g, "'");
            return [OpType.StringLiteral, value];
          }
        }
        tkzr.pos += 1;
      }

      throw tkzr.unexpectedToken(tkzr.str.slice(start), start);
    },
    eval: token => {
      const [type, str] = token;
      assert(type === OpType.StringLiteral);
      return { value: str, path: [] };
    },
    variables: token => {
      const [type] = token;
      assert(type === OpType.StringLiteral);
      return [];
    },
  },
  [OpType.Parentheses]: {
    parse: (tkzr: Tokenizer, precedence: number) => {
      if (!tkzr.str.startsWith('(', tkzr.pos) || precedence > OpType.Parentheses) return;

      const start = tkzr.pos;
      tkzr.pos += 1;

      const expr = tkzr.next(0);
      tkzr.whitespace();

      if (!expr) return;
      if (!tkzr.str.startsWith(')', tkzr.pos)) {
        throw tkzr.unexpectedToken(tkzr.str.slice(start), start);
      }

      tkzr.pos += 1;
      return [OpType.Parentheses, expr];
    },
    eval: (token, ctx, path) => {
      const [type, expr] = token;
      assert(type === OpType.Parentheses);
      return operators[expr[0]].eval(expr, ctx, path);
    },
    variables: (token, prefix) => {
      const [type, expr] = token;
      assert(type === OpType.Parentheses);
      return operators[expr[0]].variables(expr, prefix);
    },
  },
};

type Token =
  | [OpType.Or | OpType.And, Token, Token]
  | [OpType.MemberAccess, Token, Token]
  | [OpType.Identifier, string]
  | [OpType.StringLiteral, string]
  | [OpType.Parentheses, Token];

export class Parser {
  parse(str: string, start = 0, end = str.length): Expression {
    const expr = start === 0 && end === str.length ? str : str.slice(start, end);

    const token = new Tokenizer(expr, start).next(0, true);
    if (!token) {
      throw new ParsingError('Expression expected', start);
    }

    return new Expression(token, expr);
  }
}

export class Tokenizer {
  public pos = 0;

  constructor(
    readonly str: string,
    private offset = 0,
  ) {}

  next(precedence: number, checkEnd = false): Token | undefined {
    this.whitespace();
    let res = this.unary();

    while (this.whitespace()) {
      const token = this.binary(res, precedence);
      if (!token) break;
      res = token;
    }

    if (checkEnd && this.pos < this.str.length) {
      throw this.unexpectedToken(this.str[this.pos], this.pos);
    }

    return res;
  }

  binary(left: Token | undefined, precedence: number): Token | undefined {
    return (
      operators[OpType.MemberAccess].parse(this, precedence, left) ||
      operators[OpType.And].parse(this, precedence, left) ||
      operators[OpType.Or].parse(this, precedence, left)
    );
  }

  unary(): Token | undefined {
    return (
      operators[OpType.Parentheses].parse(this, 0) ||
      operators[OpType.StringLiteral].parse(this, 0) ||
      operators[OpType.Identifier].parse(this, 0)
    );
  }

  whitespace(): boolean {
    while (isWhitespace(this.str[this.pos])) {
      this.pos += 1;
    }
    return this.pos < this.str.length;
  }

  unexpectedToken(token: string, pos: number) {
    return new UnexpectedTokenError(token, pos + this.offset);
  }
}

export class Expression {
  constructor(
    readonly token: Token,
    readonly str?: string,
  ) {}

  eval(context: Record<string, any> = {}): string {
    const evaluated = operators[this.token[0]].eval(this.token, context, []).value;
    if (isNull(evaluated)) {
      throw new ExpressionNotResolvedError(this.str);
    }
    return String(evaluated);
  }

  variables(path: string[] = []): string[] {
    const vars = operators[this.token[0]].variables(this.token, path);
    return [...new Set(vars)];
  }
}
