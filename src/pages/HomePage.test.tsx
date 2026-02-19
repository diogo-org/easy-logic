import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { HomePage } from './HomePage'
import { ExampleProvider } from '../context/ExampleContext'

// Mock react-router-dom navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock MUI icons
vi.mock('@mui/icons-material/Delete', async () => {
  const React = await import('react')
  const DeleteIcon = React.forwardRef<SVGSVGElement, any>((props, ref) =>
    React.createElement('svg', { ...props, ref, 'data-testid': 'icon-Delete' })
  )
  DeleteIcon.displayName = 'Delete'
  return { default: DeleteIcon }
})

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ExampleProvider>
        <HomePage />
      </ExampleProvider>
    </BrowserRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render the formula input', () => {
    renderComponent()
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('should submit a formula and display it', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'p ^ q{Enter}')
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      const found = Array.from(codeElements).some(el => el.textContent === 'p ^ q')
      expect(found).toBe(true)
    })
  })

  it('should display multiple formulas', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    
    await user.type(input, 'p{Enter}')
    await user.type(input, 'q{Enter}')
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      const formulas = Array.from(codeElements).map(el => el.textContent)
      expect(formulas).toContain('p')
      expect(formulas).toContain('q')
    })
  })

  it('should remove a formula when delete button is clicked', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'p{Enter}')
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      expect(Array.from(codeElements).some(el => el.textContent === 'p')).toBe(true)
    })
    
    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('[data-testid="icon-Delete"]')
    )
    
    expect(deleteButtons.length).toBeGreaterThan(0)
    await user.click(deleteButtons[0])
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      expect(Array.from(codeElements).some(el => el.textContent === 'p')).toBe(false)
    })
  })

  it('should navigate to truth table when button is clicked', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'p{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText('Truth Table')).toBeInTheDocument()
    })
    
    const truthTableButton = screen.getByRole('button', { name: /Truth Table/i })
    await user.click(truthTableButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/truth-table', expect.objectContaining({
      state: expect.objectContaining({
        formula: expect.objectContaining({
          original: 'p'
        })
      })
    }))
  })

  it('should navigate to proof assistant when Prove button is clicked', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'p -> q{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText('Prove')).toBeInTheDocument()
    })
    
    const proveButton = screen.getByRole('button', { name: /Prove/i })
    await user.click(proveButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/proof-assistant', expect.objectContaining({
      state: expect.objectContaining({
        formula: 'p -> q'
      })
    }))
  })

  it('should display error for invalid formula', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'p &{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument()
    })
  })

  it('should not show action buttons for formulas with errors', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'invalid & &{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument()
    })
    
    // Truth Table and Prove buttons should not be visible for error formulas
    const truthTableButtons = screen.queryAllByRole('button', { name: /Truth Table/i })
    const proveButtons = screen.queryAllByRole('button', { name: /Prove/i })
    
    // These might be 0 if only error formula exists
    expect(truthTableButtons.length).toBe(0)
    expect(proveButtons.length).toBe(0)
  })

  it('should clear input after formula submission', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    await user.type(input, 'p ^ q{Enter}')
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('should display formulas in reverse chronological order', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'first{Enter}')
    await user.type(input, 'second{Enter}')
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      expect(codeElements[0].textContent).toBe('second')
      expect(codeElements[1].textContent).toBe('first')
    })
  })

  it('should handle complex formulas', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, '(p -> q) ^ (q -> r) -> (p -> r){Enter}')
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      const found = Array.from(codeElements).some(
        el => el.textContent === '(p -> q) ^ (q -> r) -> (p -> r)'
      )
      expect(found).toBe(true)
    })
  })

  it('should remove specific formula without affecting others', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'p{Enter}')
    await user.type(input, 'q{Enter}')
    await user.type(input, 'r{Enter}')
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      expect(codeElements.length).toBeGreaterThanOrEqual(3)
    })
    
    // Remove the second formula (index 1, which is 'q')
    const deleteButtons = screen.getAllByRole('button').filter(
      btn => btn.querySelector('[data-testid="icon-Delete"]')
    )
    
    if (deleteButtons.length >= 2) {
      await user.click(deleteButtons[1])
      
      await waitFor(() => {
        const codeElements = document.querySelectorAll('code')
        const formulas = Array.from(codeElements).map(el => el.textContent)
        expect(formulas).toContain('r')
        expect(formulas).toContain('p')
        expect(formulas).not.toContain('q')
      })
    }
  })

  it('should handle formula with all operators', async () => {
    const user = userEvent.setup()
    renderComponent()
    
    const input = screen.getByRole('textbox')
    await user.type(input, '~p ^ q | r -> s <-> t{Enter}')
    
    await waitFor(() => {
      const codeElements = document.querySelectorAll('code')
      const found = Array.from(codeElements).some(
        el => el.textContent === '~p ^ q | r -> s <-> t'
      )
      expect(found).toBe(true)
    })
  })

  it('should render without theme provider in test environment', () => {
    renderComponent()
    
    // Component should render even without MUI theme
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
