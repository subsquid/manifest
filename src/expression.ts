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

export type OpConfig<T extends Token> = {
  parse: (tokenizer: Tokenizer, precedence: number, left?: Token) => Token | undefined;
  eval: (token: T, ctx: any, path: string[]) => { value: unknown; path: string[] };
  variables: (token: T, path: string[]) => string[];
};

const operators: Record<OpType, OpConfig<Token>> = {
  [OpType.Or]: {
    parse: (tokenizer: Tokenizer, precedence: number, left?: Token) => {
      if (!tokenizer.match('||') || precedence > OpType.Or) return;
      if (!left) throw tokenizer.unexpectedToken('||', tokenizer.pos);

      const start = tokenizer.pos;
      tokenizer.pos += 2;

      const right = tokenizer.next(OpType.Or);
      if (!right) throw tokenizer.unexpectedToken('||', start);

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
    parse: (tokenizer: Tokenizer, precedence: number, left?: Token) => {
      if (!tokenizer.match('&&') || precedence > OpType.And) return;
      if (!left) throw tokenizer.unexpectedToken('&&', tokenizer.pos);

      const start = tokenizer.pos;
      tokenizer.pos += 2;

      const right = tokenizer.next(OpType.And);
      if (!right) throw tokenizer.unexpectedToken('&&', start);

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
    parse: (tokenizer: Tokenizer, precedence: number, left?: Token) => {
      if (!tokenizer.match('.') || precedence > OpType.MemberAccess) return;
      if (!left) throw tokenizer.unexpectedToken('.', tokenizer.pos);

      const start = tokenizer.pos;
      tokenizer.pos += 1;

      const right = tokenizer.next(OpType.MemberAccess);
      if (!right) throw tokenizer.unexpectedToken('.', start);

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
    parse: (tokenizer: Tokenizer, precedence: number) => {
      const start = tokenizer.pos;
      while (isIdentifierChar(tokenizer.str[tokenizer.pos])) {
        if (tokenizer.str[tokenizer.pos] === '-' && !isAlphaNum(tokenizer.str[tokenizer.pos + 1])) {
          throw tokenizer.unexpectedToken('-', tokenizer.pos);
        }
        tokenizer.pos += 1;
      }
      if (tokenizer.pos === start) return;

      const id = tokenizer.slice(start);
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
    parse: (tokenizer: Tokenizer, precedence: number) => {
      if (!tokenizer.match("'")) return;

      const start = tokenizer.pos;
      tokenizer.pos += 1;

      while (tokenizer.pos < tokenizer.str.length) {
        if (tokenizer.match("'")) {
          tokenizer.pos += 1;
          if (!tokenizer.match("'")) {
            const value = tokenizer.slice(start + 1, tokenizer.pos - 1).replace(/''/g, "'");
            return [OpType.StringLiteral, value];
          }
        }
        tokenizer.pos += 1;
      }

      throw tokenizer.unexpectedToken(tokenizer.slice(start), start);
    },
    eval: token => {
      const [type, str] = token;
      assert(type === OpType.StringLiteral);
      return { value: str, path: [] };
    },
    variables: token => {
      const [type] = token;
      assert(type === OpType.StringLiteral);
      // String literals don't contain any variables
      return [];
    },
  },
  [OpType.Parentheses]: {
    parse: (tokenizer: Tokenizer, precedence: number) => {
      if (!tokenizer.match('(')) return;

      const start = tokenizer.pos;
      tokenizer.pos += 1;

      const expr = tokenizer.next(0);
      tokenizer.whitespace();

      if (!expr) return;
      if (!tokenizer.match(')')) {
        throw tokenizer.unexpectedToken(tokenizer.slice(start), start);
      }

      tokenizer.pos += 1;
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
      // Delegate to the contained expression with the same prefix
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
        const tokenizer = new Tokenizer(expr.slice(3, expr.length - 2), index + 3);
        try {
          const token = tokenizer.next(0, true);
          if (token) {
            parts.push({ token, expr: match[1] });
          }
        } catch (error) {
          if (error instanceof ParsingError) {
            throw error;
          }
          throw new ParsingError(String(error), index + 3);
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
  public pos = 0;

  constructor(
    public str: string,
    public offset = 0,
  ) {}

  next(precedence: number, consumeAll = false): Token | undefined {
    this.whitespace();
    let res = this.unary();

    while (this.whitespace()) {
      const token = this.binary(res, precedence);
      if (!token) break;
      res = token;
    }

    if (consumeAll && this.pos < this.str.length) {
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

  match(expected: string): boolean {
    return this.str.startsWith(expected, this.pos);
  }

  unexpectedToken(token: string, pos: number) {
    return new UnexpectedTokenError(token, pos + this.offset);
  }

  slice(start: number, end?: number): string {
    return this.str.slice(start, end !== undefined ? end : this.pos);
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

  variables(path: string[] = []): string[] {
    const result = this.parts.flatMap(part => {
      if (typeof part !== 'string') {
        const { token } = part;
        return operators[token[0]].variables(token, path);
      }
      return [];
    });

    return [...new Set(result)];
  }
}
