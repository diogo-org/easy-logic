import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('should render header', () => {
    render(<App />)
    
    expect(screen.getByText('Easy Logic')).toBeInTheDocument()
    expect(screen.getByText('Propositional Logic Formula Renderer')).toBeInTheDocument()
  })

  it('should render formula input', () => {
    render(<App />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('should display formula after submission', async () => {
    render(<App />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q{Enter}')
    
    // The formula should be in the code element
    const codeElements = document.querySelectorAll('code')
    const found = Array.from(codeElements).some(el => el.textContent === 'p ^ q')
    expect(found).toBe(true)
  })

  it('should display multiple formulas', async () => {
    render(<App />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    
    await userEvent.type(input, 'p{Enter}')
    expect(input.value).toBe('')
    
    // Give React time to update
    await new Promise(resolve => setTimeout(resolve, 10))
    
    await userEvent.type(input, 'q{Enter}')
    expect(input.value).toBe('')
    
    // Both formulas should be in the code elements
    const codeElements = document.querySelectorAll('code')
    const formulas = Array.from(codeElements).map(el => el.textContent)
    expect(formulas).toContain('p')
    expect(formulas).toContain('q')
  })

  it('should display error for invalid formula', async () => {
    render(<App />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p &{Enter}')
    
    expect(screen.getByText(/Error:/i)).toBeInTheDocument()
  })

  it('should clear input after each submission', async () => {
    render(<App />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    
    await userEvent.type(input, 'p ^ q{Enter}')
    expect(input.value).toBe('')
  })

  it('should render formulas in history section', async () => {
    const { container } = render(<App />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p{Enter}')
    
    const history = container.querySelector('.formulas-history')
    expect(history).toBeInTheDocument()
    expect(history?.children.length).toBeGreaterThan(0)
  })

  it('should display LaTeX rendered formula', async () => {
    render(<App />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q{Enter}')
    
    // The KaTeX component should be rendered
    const katex = screen.getByTestId('react-katex')
    expect(katex).toBeInTheDocument()
  })

  it('should handle tautology formulas', async () => {
    render(<App />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '(p -> q) ^ (q -> r) -> (p -> r){Enter}')
    
    // Find the code element specifically (not in the sidebar)
    const codeElements = document.querySelectorAll('code')
    const found = Array.from(codeElements).some(el => el.textContent === '(p -> q) ^ (q -> r) -> (p -> r)')
    expect(found).toBe(true)
  })

  it('should display latest formula first', async () => {
    render(<App />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    
    await userEvent.type(input, 'first{Enter}')
    expect(input.value).toBe('')
    
    await userEvent.type(input, 'second{Enter}')
    expect(input.value).toBe('')
    
    // Check that both formulas are displayed
    const codeElements = document.querySelectorAll('code')
    const formulas = Array.from(codeElements).map(el => el.textContent)
    expect(formulas).toContain('first')
    expect(formulas).toContain('second')
    
    // Second should appear first (newest first)
    expect(codeElements[0].textContent).toBe('second')
  })
})
