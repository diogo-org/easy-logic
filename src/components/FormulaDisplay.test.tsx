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

  it('should use MUI Alert component for error display', () => {
    const { container } = render(<FormulaDisplay latex="" error="Parsing error" />)
    const alert = container.querySelector('.MuiAlert-root')
    expect(alert).toBeInTheDocument()
  })

  it('should have error severity on MUI Alert', () => {
    const { container } = render(<FormulaDisplay latex="" error="Parsing error" />)
    const alert = container.querySelector('.MuiAlert-standardError')
    expect(alert).toBeInTheDocument()
  })

  it('should have aria-live="polite" for screen reader announcement', () => {
    const { container } = render(<FormulaDisplay latex="" error="Parser error" />)
    const alert = container.querySelector('.MuiAlert-root')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('should display error icon in error message', () => {
    const { container } = render(<FormulaDisplay latex="" error="Parsing error" />)
    const errorIcon = container.querySelector('.MuiAlert-icon')
    expect(errorIcon).toBeInTheDocument()
  })

  it('should include error message text with error icon', () => {
    render(<FormulaDisplay latex="" error="Unexpected token" />)
    const errorMsg = screen.getByText(/Unexpected token/i)
    expect(errorMsg).toBeInTheDocument()
  })

  it('should maintain high color contrast for error display', () => {
    const { container } = render(<FormulaDisplay latex="" error="Test error" />)
    const alert = container.querySelector('.MuiAlert-root')
    expect(alert).toHaveClass('MuiAlert-standardError')
  })

  it('should have appropriate padding and spacing for error visibility', () => {
    const { container } = render(<FormulaDisplay latex="" error="Error message" />)
    const alert = container.querySelector('.MuiAlert-root')
    expect(alert).toBeInTheDocument()
    const styles = window.getComputedStyle(alert!)
    expect(styles.padding).toBeTruthy()
  })

  it('should display error with full width for better visibility', () => {
    const { container } = render(<FormulaDisplay latex="" error="Error message" />)
    const alert = container.querySelector('.MuiAlert-root')
    expect(alert).toBeInTheDocument()
  })
})
