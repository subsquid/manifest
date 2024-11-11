import assert from 'assert';

export const EXPR_PATTERN = /(\${{[^}]*}})/;

const nums = new Set('0123456789'.split(''));
const alpha = new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
const alphaNum = new Set([...nums, ...alpha]);
const identifiers = new Set([...alphaNum, '_', '-']);

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

  tokenize(): Token {
    let token: Token | undefined;

    while (this.str[this.pos]) {
      while (this.str[this.pos] === ' ') {
        this.pos++;
      }

      switch (this.str[this.pos]) {
        case undefined:
          break;
        case '.':
          if (token) {
            this.pos++;
            token = new Token(TokenType.MemberAccess, [token, this.tokenize()]);
          } else {
            throw this.error("Unexpected '.'");
          }
          break;
        default:
          const value = this.id();
          if (value) {
            token = new Token(TokenType.Identifier, [value]);
          } else {
            throw this.error(`Unexpected '${this.str[this.pos]}'`);
          }
          break;
      }
    }

    if (!token) {
      throw this.error(`Unexpected EOF`);
    }

    return token;
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
    return new ParsingError(msg, [0, this.pos + this.offset]);
  }
}

export class ParsingError extends Error {
  constructor(message: string, pos: [number, number]) {
    super(message + ` [${pos}]`);
  }
}

export enum TokenType {
  Identifier,
  MemberAccess,
}

export class Token {
  constructor(
    private type: TokenType,
    private nodes: (string | Token)[],
  ) {}

  eval(ctx: any, ctxPath: string[]): { value: unknown; path: string[] } {
    switch (this.type) {
      case TokenType.MemberAccess: {
        const [n0, n1] = this.nodes;
        assert(n0 instanceof Token);
        assert(n1 instanceof Token);

        const { value, path } = n0.eval(ctx, ctxPath);

        return n1.eval(value, path);
      }
      case TokenType.Identifier: {
        const [n0] = this.nodes;
        assert(typeof n0 === 'string');

        const path = [...ctxPath, n0];
        const value = !!ctx?.hasOwnProperty(n0) ? ctx[n0] : undefined;

        if (value) {
          return { value, path };
        } else {
          throw new EvaluationError(`"${path.join('.')}" is not defined`);
        }
      }
    }
  }

  variables(path: string[] = []): string[] {
    const res: Set<string> = new Set();

    switch (this.type) {
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

export class Expression {
  constructor(readonly tokens: (string | Token)[]) {}

  eval(context: Record<string, any> = {}): string {
    const res: (string | undefined)[] = [];

    for (const token of this.tokens) {
      if (typeof token === 'string') {
        res.push(token);
      } else {
        res.push(token.eval(context, []).value?.toString() ?? '');
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
