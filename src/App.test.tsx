import { describe, it, expect, vi } from 'vitest'
import * as React from 'react'

// Mock MUI icons BEFORE any other imports to avoid EMFILE (too many open files) on Windows
vi.mock('@mui/icons-material', async () => {
  const createMockIcon = (name: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MockIcon = React.forwardRef<SVGSVGElement, any>((props, ref) =>
      React.createElement('svg', { ...props, ref, 'data-testid': `icon-${name}` })
    )
    MockIcon.displayName = name
    return MockIcon
  }
  
  return {
    Menu: createMockIcon('Menu'),
    Delete: createMockIcon('Delete'),
    Clear: createMockIcon('Clear'),
    ArrowBack: createMockIcon('ArrowBack'),
    Refresh: createMockIcon('Refresh'),
    HelpOutline: createMockIcon('HelpOutline'),
    Celebration: createMockIcon('Celebration'),
    Star: createMockIcon('Star'),
    AutoAwesome: createMockIcon('AutoAwesome'),
  }
})

vi.mock('@mui/icons-material/Menu', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MenuIcon = React.forwardRef<SVGSVGElement, any>((props, ref) =>
    React.createElement('svg', { ...props, ref, 'data-testid': 'icon-Menu' })
  )
  MenuIcon.displayName = 'Menu'
  return { default: MenuIcon }
})

vi.mock('@mui/icons-material/Delete', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DeleteIcon = React.forwardRef<SVGSVGElement, any>((props, ref) =>
    React.createElement('svg', { ...props, ref, 'data-testid': 'icon-Delete' })
  )
  DeleteIcon.displayName = 'Delete'
  return { default: DeleteIcon }
})

vi.mock('@mui/icons-material/Clear', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ClearIcon = React.forwardRef<SVGSVGElement, any>((props, ref) =>
    React.createElement('svg', { ...props, ref, 'data-testid': 'icon-Clear' })
  )
  ClearIcon.displayName = 'Clear'
  return { default: ClearIcon }
})

vi.mock('@mui/icons-material/ArrowBack', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ArrowBackIcon = React.forwardRef<SVGSVGElement, any>((props, ref) =>
    React.createElement('svg', { ...props, ref, 'data-testid': 'icon-ArrowBack' })
  )
  ArrowBackIcon.displayName = 'ArrowBack'
  return { default: ArrowBackIcon }
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const App = (await import('./App')).default

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

  it('should render drawer and sidebar examples', () => {
    render(<App />)
    
    // The examples should be rendered somewhere in the document (drawer or sidebar)
    const exampleHeaders = screen.getAllByText(/Simple Variable|Negation|AND/)
    expect(exampleHeaders.length).toBeGreaterThan(0)
  })

  it('should render all example items in sidebar', () => {
    render(<App />)
    
    // Check for example labels - they should be visible regardless of drawer state
    const exampleLabels = screen.getAllByText(/Simple Variable|Negation|AND|OR|Implication/)
    expect(exampleLabels.length).toBeGreaterThan(0)
  })

  it('should allow clicking examples to submit formulas', async () => {
    render(<App />)
    
    // Get the first example button and click it
    const exampleButtons = screen.getAllByRole('button')
    const exampleButton = exampleButtons.find(btn => btn.textContent?.includes('Simple Variable'))
    
    if (exampleButton) {
      await userEvent.click(exampleButton)
      
      // The formula 'p' should be submitted and appear in history
      const codeElements = document.querySelectorAll('code')
      const found = Array.from(codeElements).some(el => el.textContent === 'p')
      expect(found).toBe(true)
    }
  })
})
