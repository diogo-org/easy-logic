import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormulaInput } from './FormulaInput'

describe('FormulaInput', () => {
  it('should render input field', () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toBeInTheDocument()
    // Placeholder can be in English or Portuguese depending on i18n
    expect(input.placeholder).toMatch(/Example|Exemplo/i)
  })

  it('should render label', () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const label = screen.getByLabelText(/Enter Formula/i)
    expect(label).toBeInTheDocument()
  })

  it('should render syntax help', () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const help = screen.getByText(/Operators:/i)
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

  it('should not show clear button when input is empty', () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const clearButton = screen.queryByRole('button', { name: /clear/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('should show clear button when input has text', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q')
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('should clear input when clear button is clicked', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    await userEvent.type(input, 'p ^ q')
    expect(input.value).toBe('p ^ q')
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await userEvent.click(clearButton)
    
    expect(input.value).toBe('')
  })

  it('should hide clear button after clearing input', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q')
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    expect(clearButton).toBeInTheDocument()
    
    await userEvent.click(clearButton)
    
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
  })

  it('should have proper ARIA label on clear button', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'test')
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    expect(clearButton).toHaveAttribute('aria-label', expect.stringMatching(/clear/i))
  })

  it('should not call onSubmit when clear button is clicked', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q')
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await userEvent.click(clearButton)
    
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('should display error message when submitting empty input', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '{Enter}')
    
    const errorMessage = await screen.findByText(/please enter a formula/i)
    expect(errorMessage).toBeInTheDocument()
  })

  it('should display error message when submitting whitespace-only input', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '   {Enter}')
    
    const errorMessage = await screen.findByText(/please enter a formula/i)
    expect(errorMessage).toBeInTheDocument()
  })

  it('should dismiss error message when user starts typing', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '{Enter}')
    
    const errorMessage = await screen.findByText(/please enter a formula/i)
    expect(errorMessage).toBeInTheDocument()
    
    await userEvent.type(input, 'p')
    
    // Wait for the error message to be removed (Snackbar has exit animation)
    await waitFor(() => {
      const dismissedError = screen.queryByText(/please enter a formula/i)
      expect(dismissedError).not.toBeInTheDocument()
    })
  })

  it('should not display error message on successful submission', async () => {
    const mockSubmit = vi.fn()
    render(<FormulaInput onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'p ^ q{Enter}')
    
    const errorMessage = screen.queryByText(/please enter a formula/i)
    expect(errorMessage).not.toBeInTheDocument()
  })
})
