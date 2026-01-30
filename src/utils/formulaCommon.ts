/**
 * Shared tokenizer and parser for propositional logic formulas
 */

export type Token = {
  type: 'LPAREN' | 'RPAREN' | 'AND' | 'OR' | 'IMPLIES' | 'IFF' | 'NOT' | 'VAR' | 'TRUE' | 'FALSE' | 'EOF'
  value: string
}

export type Formula = {
  type: 'var' | 'true' | 'false' | 'not' | 'and' | 'or' | 'implies' | 'iff'
  value?: string
  left?: Formula
  right?: Formula
}

export class Tokenizer {
  private input: string
  private pos: number

  constructor(input: string) {
    this.input = input.trim()
    this.pos = 0
  }

  private peek(): string | null {
    if (this.pos >= this.input.length) return null
    return this.input[this.pos]
  }

  private peekTwo(): string | null {
    if (this.pos + 1 >= this.input.length) return null
    return this.input.substring(this.pos, this.pos + 2)
  }

  private peekThree(): string | null {
    if (this.pos + 2 >= this.input.length) return null
    return this.input.substring(this.pos, this.pos + 3)
  }

  private advance(): void {
    this.pos++
  }

  private skipWhitespace(): void {
    while (this.peek() && /\s/.test(this.peek()!)) {
      this.advance()
    }
  }

  nextToken(): Token {
    this.skipWhitespace()

    const peek = this.peek()

    if (!peek) {
      return { type: 'EOF', value: '' }
    }

    if (peek === '(') {
      this.advance()
      return { type: 'LPAREN', value: '(' }
    }

    if (peek === ')') {
      this.advance()
      return { type: 'RPAREN', value: ')' }
    }

    if (peek === '^') {
      this.advance()
      return { type: 'AND', value: '^' }
    }

    if (peek === '|') {
      this.advance()
      return { type: 'OR', value: '|' }
    }

    if (peek === '~') {
      this.advance()
      return { type: 'NOT', value: '~' }
    }

    const threeCharOp = this.peekThree()

    if (threeCharOp === '<->') {
      this.advance()
      this.advance()
      this.advance()
      return { type: 'IFF', value: '<->' }
    }

    const twoCharOp = this.peekTwo()

    if (twoCharOp === '->') {
      this.advance()
      this.advance()
      return { type: 'IMPLIES', value: '->' }
    }

    if (peek === 'T') {
      this.advance()
      return { type: 'TRUE', value: 'T' }
    }

    if (peek === 'F') {
      this.advance()
      return { type: 'FALSE', value: 'F' }
    }

    if (/[a-zA-Z0-9_]/.test(peek)) {
      let value = ''
      while (this.peek() && /[a-zA-Z0-9_]/.test(this.peek()!)) {
        value += this.peek()
        this.advance()
      }
      return { type: 'VAR', value }
    }

    throw new Error(`Unexpected character: ${peek}`)
  }
}

export class Parser {
  private tokens: Token[]
  private pos: number

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.pos = 0
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private advance(): void {
    this.pos++
  }

  private expect(type: Token['type']): void {
    const token = this.peek()
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`)
    }
    this.advance()
  }

  parse(): Formula {
    const formula = this.parseIff()
    this.expect('EOF')
    return formula
  }

  private parseIff(): Formula {
    let left = this.parseImplies()

    while (this.peek().type === 'IFF') {
      this.advance()
      const right = this.parseImplies()
      left = { type: 'iff', left, right }
    }

    return left
  }

  private parseImplies(): Formula {
    let left = this.parseOr()

    while (this.peek().type === 'IMPLIES') {
      this.advance()
      const right = this.parseOr()
      left = { type: 'implies', left, right }
    }

    return left
  }

  private parseOr(): Formula {
    let left = this.parseAnd()

    while (this.peek().type === 'OR') {
      this.advance()
      const right = this.parseAnd()
      left = { type: 'or', left, right }
    }

    return left
  }

  private parseAnd(): Formula {
    let left = this.parseNot()

    while (this.peek().type === 'AND') {
      this.advance()
      const right = this.parseNot()
      left = { type: 'and', left, right }
    }

    return left
  }

  private parseNot(): Formula {
    if (this.peek().type === 'NOT') {
      this.advance()
      const formula = this.parseNot()
      return { type: 'not', left: formula }
    }

    return this.parsePrimary()
  }

  private parsePrimary(): Formula {
    const token = this.peek()

    if (token.type === 'TRUE') {
      this.advance()
      return { type: 'true' }
    }

    if (token.type === 'FALSE') {
      this.advance()
      return { type: 'false' }
    }

    if (token.type === 'VAR') {
      this.advance()
      return { type: 'var', value: token.value }
    }

    if (token.type === 'LPAREN') {
      this.advance()
      const formula = this.parseIff()
      this.expect('RPAREN')
      return formula
    }

    throw new Error(`Unexpected token: ${token.type}`)
  }
}

export function tokenizeAndParse(input: string): Formula {
  const tokenizer = new Tokenizer(input)
  const tokens: Token[] = []

  let token: Token
  do {
    token = tokenizer.nextToken()
    tokens.push(token)
  } while (token.type !== 'EOF')

  const parser = new Parser(tokens)
  return parser.parse()
}
