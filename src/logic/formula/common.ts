/**
 * Shared tokenizer and parser for propositional logic formulas
 * 
 * This is pure business logic - no React or UI dependencies.
 */

// Operator string lengths
const TWO_CHAR_OPERATOR_LENGTH = 2
const THREE_CHAR_OPERATOR_LENGTH = 3

/** Enum for formula node types */
export const FormulaType = {
  VAR: 'var',
  TRUE: 'true',
  FALSE: 'false',
  NOT: 'not',
  AND: 'and',
  OR: 'or',
  IMPLIES: 'implies',
  IFF: 'iff',
} as const

export type FormulaTypeValue = typeof FormulaType[keyof typeof FormulaType]

/** Enum for token types */
export const TokenType = {
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  AND: 'AND',
  OR: 'OR',
  IMPLIES: 'IMPLIES',
  IFF: 'IFF',
  NOT: 'NOT',
  VAR: 'VAR',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  EOF: 'EOF',
} as const

export type TokenTypeValue = typeof TokenType[keyof typeof TokenType]

export type Token = {
  type: TokenTypeValue
  value: string
}

export type Formula = {
  type: FormulaTypeValue
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
    if (this.pos + TWO_CHAR_OPERATOR_LENGTH >= this.input.length) return null
    return this.input.substring(this.pos, this.pos + THREE_CHAR_OPERATOR_LENGTH)
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

    if (this.pos >= this.input.length) {
      return { type: TokenType.EOF, value: '' }
    }

    const ch = this.peek()!
    const two = this.peekTwo()
    const three = this.peekThree()

    // Check for three-character operators first
    if (three === '<->') {
      this.pos += 3
      return { type: TokenType.IFF, value: '<->' }
    }

    // Check for two-character operators
    if (two === '->') {
      this.pos += 2
      return { type: TokenType.IMPLIES, value: '->' }
    }

    // Alternative symbols for operators
    if (two === '/\\' || two === '&&') {
      this.pos += 2
      return { type: TokenType.AND, value: two }
    }

    if (two === '\\/' || two === '||') {
      this.pos += 2
      return { type: TokenType.OR, value: two }
    }

    // Single character tokens
    switch (ch) {
      case '(':
        this.advance()
        return { type: TokenType.LPAREN, value: '(' }
      case ')':
        this.advance()
        return { type: TokenType.RPAREN, value: ')' }
      case '^':
      case '∧':
        this.advance()
        return { type: TokenType.AND, value: ch }
      case '|':
      case '∨':
        this.advance()
        return { type: TokenType.OR, value: ch }
      case '~':
      case '¬':
      case '!':
        this.advance()
        return { type: TokenType.NOT, value: ch }
      case '→':
        this.advance()
        return { type: TokenType.IMPLIES, value: '→' }
      case '↔':
        this.advance()
        return { type: TokenType.IFF, value: '↔' }
    }

    // Check for TRUE/FALSE constants
    if (ch === 'T' || ch === '⊤') {
      this.advance()
      return { type: TokenType.TRUE, value: ch }
    }

    if (ch === 'F' || ch === '⊥') {
      this.advance()
      return { type: TokenType.FALSE, value: ch }
    }

    // Variables (single letters or multi-character identifiers)
    if (/[a-zA-Z_]/.test(ch)) {
      let value = ''
      while (this.peek() && /[a-zA-Z0-9_]/.test(this.peek()!)) {
        value += this.peek()
        this.advance()
      }
      return { type: TokenType.VAR, value }
    }

    throw new Error(`Unexpected character: ${ch}`)
  }

  tokenize(): Token[] {
    const tokens: Token[] = []
    let token = this.nextToken()
    while (token.type !== TokenType.EOF) {
      tokens.push(token)
      token = this.nextToken()
    }
    tokens.push(token) // Include EOF
    return tokens
  }
}

/**
 * Recursive descent parser for propositional logic
 * 
 * Grammar (precedence from lowest to highest):
 * 1. IFF (<->)
 * 2. IMPLIES (->)
 * 3. OR (|)
 * 4. AND (^)
 * 5. NOT (~)
 * 6. Atoms (variables, constants, parenthesized expressions)
 */
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

  private advance(): Token {
    return this.tokens[this.pos++]
  }

  private match(type: Token['type']): boolean {
    if (this.peek().type === type) {
      this.advance()
      return true
    }
    return false
  }

  parse(): Formula {
    const result = this.parseIff()
    if (this.peek().type !== TokenType.EOF) {
      throw new Error(`Unexpected token: ${this.peek().value}`)
    }
    return result
  }

  private parseIff(): Formula {
    let left = this.parseImplies()
    while (this.peek().type === TokenType.IFF) {
      this.advance()
      const right = this.parseImplies()
      left = { type: FormulaType.IFF, left, right }
    }
    return left
  }

  private parseImplies(): Formula {
    const left = this.parseOr()
    // Right-associative
    if (this.peek().type === TokenType.IMPLIES) {
      this.advance()
      const right = this.parseImplies()
      return { type: FormulaType.IMPLIES, left, right }
    }
    return left
  }

  private parseOr(): Formula {
    let left = this.parseAnd()
    while (this.peek().type === TokenType.OR) {
      this.advance()
      const right = this.parseAnd()
      left = { type: FormulaType.OR, left, right }
    }
    return left
  }

  private parseAnd(): Formula {
    let left = this.parseNot()
    while (this.peek().type === TokenType.AND) {
      this.advance()
      const right = this.parseNot()
      left = { type: FormulaType.AND, left, right }
    }
    return left
  }

  private parseNot(): Formula {
    if (this.peek().type === TokenType.NOT) {
      this.advance()
      const operand = this.parseNot()
      return { type: FormulaType.NOT, left: operand }
    }
    return this.parseAtom()
  }

  private parseAtom(): Formula {
    const token = this.peek()

    if (token.type === TokenType.VAR) {
      this.advance()
      return { type: FormulaType.VAR, value: token.value }
    }

    if (token.type === TokenType.TRUE) {
      this.advance()
      return { type: FormulaType.TRUE }
    }

    if (token.type === TokenType.FALSE) {
      this.advance()
      return { type: FormulaType.FALSE }
    }

    if (token.type === TokenType.LPAREN) {
      this.advance()
      const expr = this.parseIff()
      if (!this.match(TokenType.RPAREN)) {
        throw new Error('Expected closing parenthesis')
      }
      return expr
    }

    throw new Error(`Unexpected token: ${token.value || token.type}`)
  }
}

/**
 * Convenience function to tokenize and parse a formula string
 */
export function tokenizeAndParse(input: string): Formula {
  const tokenizer = new Tokenizer(input)
  const tokens = tokenizer.tokenize()
  const parser = new Parser(tokens)
  return parser.parse()
}

/**
 * Extract all unique variable names from a formula
 */
export function extractVariables(formula: Formula): string[] {
  const vars = new Set<string>()

  function traverse(f: Formula) {
    if (f.type === FormulaType.VAR && f.value) {
      vars.add(f.value)
    }
    if (f.left) traverse(f.left)
    if (f.right) traverse(f.right)
  }

  traverse(formula)
  return Array.from(vars).sort()
}
