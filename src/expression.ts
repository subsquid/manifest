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

export class ExpressionExpectedError extends ParsingError {
  constructor(pos: number) {
    super('Expression expected', pos);
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

export class ExpressionNotSerializableError extends EvaluationError {
  constructor(expr?: string) {
    super(`${expr ? `"${expr}"` : 'Expression'} is not serializable`);
  }
}

function isTrue(value: unknown): boolean {
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

function isNull(value: unknown): boolean {
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

function isPrimitive(value: unknown): boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

export enum TokenType {
  Identifier,
  Literal,
  Operator,
}

export enum OpType {
  Or,
  And,
  MemberAccess,
  Parentheses,
}

export interface Token {
  type: TokenType;
  eval: (ctx: any, path: string[]) => { value: unknown; path: string[] };
  variables: (path: string[]) => string[];
}

export type LiteralValue = string;

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Operator {
  export class Or implements Token {
    readonly type = TokenType.Operator;

    constructor(readonly value: [Token, Token]) {}

    add(right: Token) {
      this.value[1] = new Operator.Or([this.value[1], right]);
    }

    eval(ctx: any, path: string[]) {
      const [left, right] = this.value;
      const leftValue = left.eval(ctx, path);
      return isTrue(leftValue.value) ? leftValue : right.eval(ctx, path);
    }

    variables(path: string[]) {
      const [left, right] = this.value;
      return [...left.variables(path), ...right.variables(path)];
    }
  }

  export class And implements Token {
    readonly type = TokenType.Operator;

    constructor(readonly value: [Token, Token]) {}

    add(right: Token) {
      this.value[1] = new Operator.And([this.value[1], right]);
    }

    eval(ctx: any, path: string[]) {
      const [left, right] = this.value;
      const leftValue = left.eval(ctx, path);
      return isTrue(leftValue.value) ? right.eval(ctx, path) : leftValue;
    }

    variables(path: string[]) {
      const [left, right] = this.value;
      return [...left.variables(path), ...right.variables(path)];
    }
  }

  export class MemberAccess implements Token {
    readonly type = TokenType.Operator;

    constructor(readonly value: [Token, Token]) {}

    eval(ctx: any, path: string[]) {
      const [left, right] = this.value;
      const leftValue = left.eval(ctx, path);
      return right.eval(leftValue.value, leftValue.path);
    }

    variables(path: string[]) {
      const [left, right] = this.value;

      const leftVars = left.variables([]);
      if (path.length === 0) {
        return leftVars;
      }

      return leftVars.some(v => v === path[0]) ? right.variables(path.slice(1)) : [];
    }
  }
}

const operators = {
  [OpType.Or]: (tkzr: Tokenizer, precedence: number, left?: Token) => {
    if (!tkzr.str.startsWith('||', tkzr.pos) || precedence > OpType.Or) return;
    if (!left) throw tkzr.unexpectedToken('||', tkzr.pos);

    const start = tkzr.pos;
    tkzr.pos += 2;

    const right = tkzr.next(OpType.Or);
    if (!right) throw tkzr.unexpectedToken('||', start);

    return left instanceof Operator.Or ? left.add(right) : new Operator.Or([left, right]);
  },
  [OpType.And]: (tkzr: Tokenizer, precedence: number, left?: Token) => {
    if (!tkzr.str.startsWith('&&', tkzr.pos) || precedence > OpType.And) return;
    if (!left) throw tkzr.unexpectedToken('&&', tkzr.pos);

    const start = tkzr.pos;
    tkzr.pos += 2;

    const right = tkzr.next(OpType.And);
    if (!right) throw tkzr.unexpectedToken('&&', start);

    return left instanceof Operator.And ? left.add(right) : new Operator.And([left, right]);
  },
  [OpType.MemberAccess]: (tkzr: Tokenizer, precedence: number, left?: Token) => {
    if (!tkzr.str.startsWith('.', tkzr.pos) || precedence > OpType.MemberAccess) return;
    if (!left) throw tkzr.unexpectedToken('.', tkzr.pos);

    const start = tkzr.pos;
    tkzr.pos += 1;

    const right = tkzr.next(OpType.MemberAccess);
    if (!right) throw tkzr.unexpectedToken('.', start);

    return new Operator.MemberAccess([left, right]);
  },
  [OpType.Parentheses]: (tkzr: Tokenizer, precedence: number, left?: Token) => {
    if (!tkzr.str.startsWith('(', tkzr.pos) || precedence > OpType.Parentheses) return;

    if (left) {
      throw new UnexpectedTokenError('(', tkzr.pos);
    }

    const start = tkzr.pos;
    tkzr.pos += 1;

    const expr = tkzr.next(0);
    tkzr.whitespace();

    if (!expr) return;
    if (!tkzr.str.startsWith(')', tkzr.pos)) {
      throw tkzr.unexpectedToken(tkzr.str.slice(start), start);
    }

    tkzr.pos += 1;
    return expr;
  },
};

class Identifier implements Token {
  readonly type = TokenType.Identifier;

  constructor(readonly value: string) {}

  eval(ctx: any, path: string[]) {
    const id = this.value;

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
  }

  variables(path: string[]) {
    return path.length === 0 ? [this.value] : [];
  }
}

class StringLiteral implements Token {
  readonly type = TokenType.Literal;

  constructor(readonly value: string) {}

  eval() {
    return { value: this.value, path: [] };
  }

  variables() {
    return [];
  }
}

const tokens = {
  [TokenType.Identifier]: (tkzr: Tokenizer) => {
    const start = tkzr.pos;
    while (isIdentifierChar(tkzr.str[tkzr.pos])) {
      if (tkzr.str[tkzr.pos] === '-' && !isAlphaNum(tkzr.str[tkzr.pos + 1])) {
        throw tkzr.unexpectedToken('-', tkzr.pos);
      }
      tkzr.pos += 1;
    }
    if (tkzr.pos === start) return;

    const id = tkzr.str.slice(start, tkzr.pos);
    return new Identifier(id);
  },
  [TokenType.Literal]: (tkzr: Tokenizer) => {
    if (!tkzr.str.startsWith("'", tkzr.pos)) return;

    const start = tkzr.pos;
    tkzr.pos += 1;

    while (tkzr.str[tkzr.pos]) {
      if (tkzr.str[tkzr.pos] === "'") {
        tkzr.pos += 1;
        if (tkzr.str[tkzr.pos] !== "'") {
          const value = tkzr.str.slice(start + 1, tkzr.pos - 1).replace(/''/g, "'");
          return new StringLiteral(value);
        }
      }
      tkzr.pos += 1;
    }

    throw tkzr.unexpectedToken(tkzr.str.slice(start), start);
  },
  [TokenType.Operator]: (tkzr: Tokenizer, precedence: number, left?: Token) => {
    for (const op in operators) {
      const res = operators[op](tkzr, precedence, left);
      if (res) return res;
    }
    return;
  },
};

export class Tokenizer {
  public pos = 0;

  constructor(
    readonly str: string,
    private offset = 0,
  ) {}

  next(precedence: number, checkEnd = false): Token | undefined {
    this.whitespace();
    let res = this.literal() || this.identifier();

    while (this.whitespace()) {
      const operator = this.operator(precedence, res);
      if (!operator) break;
      res = operator;
    }

    if ((checkEnd || !res) && this.pos < this.str.length) {
      throw this.unexpectedToken(this.str[this.pos], this.pos);
    }

    return res;
  }

  operator(precedence: number, left?: Token): Token | undefined {
    return tokens[TokenType.Operator](this, precedence, left);
  }

  literal(): Token | undefined {
    return tokens[TokenType.Literal](this);
  }

  identifier(): Token | undefined {
    return tokens[TokenType.Identifier](this);
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
    const evaluated = this.token.eval(context, []).value;
    if (isNull(evaluated)) {
      throw new ExpressionNotResolvedError(this.str);
    }

    if (!isPrimitive(evaluated)) {
      throw new ExpressionNotSerializableError(this.str);
    }

    return String(evaluated);
  }

  variables(path: string[] = []): string[] {
    const vars = this.token.variables(path);
    return [...new Set(vars)];
  }
}

export class Parser {
  parse(str: string, start = 0, end = str.length): Expression {
    const expr = start === 0 && end === str.length ? str : str.slice(start, end);

    const token = new Tokenizer(expr, start).next(0, true);
    if (!token) {
      throw new ExpressionExpectedError(start);
    }

    return new Expression(token, expr);
  }
}
