import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TruthTablePage } from './TruthTablePage'
import userEvent from '@testing-library/user-event'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('TruthTablePage', () => {
  it('renders error when no formula is provided', () => {
    render(
      <MemoryRouter>
        <TruthTablePage />
      </MemoryRouter>
    )
    expect(screen.getByText(/Formula not found/)).toBeInTheDocument()
  })

  it('renders back button', () => {
    const formula = { original: 'A ^ B', latex: 'A \\land B' }
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )
    
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('navigates back on button click', async () => {
    const user = userEvent.setup()
    const formula = { original: 'A ^ B', latex: 'A \\land B' }
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )
    
    const backBtn = screen.getByText('Back')
    await user.click(backBtn)
    
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('renders formula display for valid formula', () => {
    const formula = { original: 'A ^ B', latex: 'A \\land B' }
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )
    
    expect(screen.getByText('Formula:')).toBeInTheDocument()
    expect(screen.getByText('A ^ B')).toBeInTheDocument()
  })

  it('renders truth table for valid formula', () => {
    const formula = { original: 'A ^ B', latex: 'A \\land B' }
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )
    
    expect(screen.getByText('Truth Table')).toBeInTheDocument()
    expect(screen.getByText('Result')).toBeInTheDocument()
  })

  it('handles invalid formula with error message', () => {
    const formula = { original: 'invalid!!!', latex: '' }
    
    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Error generating truth table/)).toBeInTheDocument()
  })

  it('shows back button even when error occurs', () => {
    const formula = { original: 'p & & q', latex: 'invalid' }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('navigates back from error page', async () => {
    const user = userEvent.setup()
    const formula = { original: 'p & & q', latex: 'invalid' }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    const backButton = screen.getByText('Back')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('renders complex formula with multiple variables', () => {
    const formula = { original: 'A->B', latex: 'A \\rightarrow B' }

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    const codeElement = container.querySelector('code')
    expect(codeElement).toHaveTextContent('A->B')
    expect(screen.getByText('Truth Table')).toBeInTheDocument()
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(3) // A, B, Result
  })

  it('displays pagination for large truth tables', () => {
    const formula = { original: 'A ^ B ^ C ^ D', latex: 'A \\land B \\land C \\land D' }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
  })

  it('handles formula with single variable', () => {
    const formula = { original: '~A', latex: '\\neg A' }

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    expect(screen.getByText('~A')).toBeInTheDocument()
    const tableHeaders = container.querySelectorAll('thead th')
    expect(tableHeaders[0]).toHaveTextContent('A')
    expect(screen.getByText('Truth Table')).toBeInTheDocument()
  })

  it('sorts variables alphabetically', () => {
    const formula = { original: 'z | a | m', latex: 'z \\lor a \\lor m' }

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    const headers = container.querySelectorAll('thead th')
    expect(headers[0]).toHaveTextContent('a')
    expect(headers[1]).toHaveTextContent('m')
    expect(headers[2]).toHaveTextContent('z')
  })

  it('renders all truth table rows correctly', () => {
    const formula = { original: 'A | B', latex: 'A \\lor B' }

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows).toHaveLength(4) // 2^2 = 4 rows for 2 variables
  })

  it('displays correct formula title', () => {
    const formula = { original: 'test', latex: 'test' }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    expect(screen.getByText('Formula:')).toBeInTheDocument()
  })

  it('renders the original formula code', () => {
    const formula = { original: 'my_formula', latex: 'latex' }

    const { container } = render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    const codeElement = container.querySelector('code')
    expect(codeElement).toHaveTextContent('my_formula')
  })

  it('handles navigation state correctly', () => {
    const formula = { original: 'A -> B', latex: 'A \\rightarrow B' }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/truth-table', state: { formula } }]}>
        <TruthTablePage />
      </MemoryRouter>
    )

    expect(screen.getByText('A -> B')).toBeInTheDocument()
    expect(screen.getByText('Truth Table')).toBeInTheDocument()
  })
})
