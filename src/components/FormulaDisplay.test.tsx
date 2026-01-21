import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormulaDisplay } from './FormulaDisplay'

describe('FormulaDisplay', () => {
  it('should render nothing when latex is empty', () => {
    const { container } = render(<FormulaDisplay latex="" />)
    expect(container.firstChild).toBeNull()
  })

  it('should render LaTeX formula', () => {
    render(<FormulaDisplay latex="p \\land q" />)
    
    const display = screen.getByTestId('react-katex')
    expect(display).toBeInTheDocument()
  })

  it('should have formula-display class', () => {
    const { container } = render(<FormulaDisplay latex="p \\land q" />)
    const div = container.querySelector('.formula-display')
    expect(div).toBeInTheDocument()
  })

  it('should render error message when error is provided', () => {
    render(<FormulaDisplay latex="" error="Unexpected token" />)
    
    const errorMsg = screen.getByText(/Error: Unexpected token/i)
    expect(errorMsg).toBeInTheDocument()
  })

  it('should have error class when error exists', () => {
    const { container } = render(<FormulaDisplay latex="" error="Test error" />)
    const div = container.querySelector('.formula-display.error')
    expect(div).toBeInTheDocument()
  })

  it('should not render LaTeX when error exists', () => {
    const { container } = render(<FormulaDisplay latex="p \\land q" error="Some error" />)
    const katexDiv = container.querySelector('.katex')
    expect(katexDiv).not.toBeInTheDocument()
  })

  it('should prioritize error display over formula', () => {
    render(<FormulaDisplay latex="p \\land q" error="Parsing failed" />)
    
    expect(screen.getByText(/Error: Parsing failed/i)).toBeInTheDocument()
  })

  it('should render complex LaTeX', () => {
    render(<FormulaDisplay latex="\\neg p \\lor (q \\to r)" />)
    
    const display = screen.getByTestId('react-katex')
    expect(display).toBeInTheDocument()
  })

  it('should handle LaTeX with special characters', () => {
    render(<FormulaDisplay latex="\\top \\land \\bot \\leftrightarrow p" />)
    
    const display = screen.getByTestId('react-katex')
    expect(display).toBeInTheDocument()
  })

  it('should have correct error styling', () => {
    const { container } = render(<FormulaDisplay latex="" error="Error message" />)
    const div = container.querySelector('.formula-display')
    expect(div).toHaveClass('error')
  })

  it('should handle long formulas', () => {
    const longFormula = '((p \\land q) \\lor (r \\land s)) \\to ((t \\lor u) \\land (v \\leftrightarrow w))'
    render(<FormulaDisplay latex={longFormula} />)
    
    const display = screen.getByTestId('react-katex')
    expect(display).toBeInTheDocument()
  })
})
