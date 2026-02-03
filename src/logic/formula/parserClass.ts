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

import { Token, TokenType, Formula, FormulaType } from './types'

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
