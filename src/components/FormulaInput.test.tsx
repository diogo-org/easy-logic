import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormulaInput } from './FormulaInput'

describe('FormulaInput', () => {
  it('should render input field', () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.placeholder).toContain('Example')
  })

  it('should render label', () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const label = screen.getByLabelText(/Enter a propositional logic formula/i)
    expect(label).toBeInTheDocument()
  })

  it('should render syntax help', () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const help = screen.getByText(/Syntax:/i)
    expect(help).toBeInTheDocument()
  })

  it('should update input value when typing', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    await userEvent.type(input, 'p ^ q')
    
    expect(input.value).toBe('p ^ q')
  })

  it('should call onSubmit when Enter is pressed', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q{Enter}')
    
    expect(mockSubmit).toHaveBeenCalledWith('p ^ q')
  })

  it('should clear input after submission', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    await userEvent.type(input, 'p -> q{Enter}')
    
    expect(input.value).toBe('')
  })

  it('should not submit empty input', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
    
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('should not submit whitespace-only input', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '   {Enter}')
    
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('should not submit on other keys', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q')
    fireEvent.keyPress(input, { key: 'a', code: 'KeyA' })
    
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('should handle multiple submissions', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    
    await userEvent.type(input, 'p{Enter}')
    expect(mockSubmit).toHaveBeenCalledWith('p')
    expect(input.value).toBe('')
    
    await userEvent.type(input, 'q{Enter}')
    expect(mockSubmit).toHaveBeenCalledWith('q')
    expect(input.value).toBe('')
  })
})
