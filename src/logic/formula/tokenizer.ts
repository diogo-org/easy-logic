/**
 * Tokenizer for propositional logic formulas
 * Converts formula strings into token streams
 */

import { Token, TokenType, TWO_CHAR_OPERATOR_LENGTH, THREE_CHAR_OPERATOR_LENGTH } from './types'

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
