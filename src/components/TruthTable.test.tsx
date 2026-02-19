import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TruthTable } from './TruthTable'
import type { TruthTableRow } from '../logic/truthTable'

describe('TruthTable', () => {
  beforeEach(() => {
    // Reset any state before each test
  })
  const mockRows: TruthTableRow[] = [
    { assignment: { A: false, B: false }, result: false },
    { assignment: { A: false, B: true }, result: false },
    { assignment: { A: true, B: false }, result: false },
    { assignment: { A: true, B: true }, result: true },
  ]

  it('renders table headers correctly', () => {
    render(<TruthTable variables={['A', 'B']} rows={mockRows} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('Result')).toBeInTheDocument()
  })

  it('renders truth values as T/F', () => {
    render(<TruthTable variables={['A', 'B']} rows={mockRows} />)
    const cells = screen.getAllByText(/^[TF]$/)
    expect(cells.length).toBeGreaterThan(0)
  })

  it('does not display pagination for single page', () => {
    render(<TruthTable variables={['A', 'B']} rows={mockRows} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('handles pagination with many rows', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0, B: i % 3 === 0 },
      result: (i % 2 === 0) && (i % 3 === 0),
    }))

    render(<TruthTable variables={['A', 'B']} rows={manyRows} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('navigates to next page with mouse click', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)
    const page2Button = screen.getByLabelText('Go to page 2')
    
    await user.click(page2Button)
    const selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('2')
  })

  it('navigates to previous page', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)
    const page2Button = screen.getByLabelText('Go to page 2')
    
    await user.click(page2Button)
    // Verify we're on page 2
    let selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('2')
    
    // Navigate back to page 1
    const page1Button = screen.getByLabelText('Go to page 1')
    await user.click(page1Button)
    
    // Verify we're back on page 1
    selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('1')
  })

  it('disables previous button on first page', () => {
    render(<TruthTable variables={['A']} rows={mockRows} />)
    // No pagination shown on first page with few rows
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('previous button is properly disabled on first page', async () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)
    const prevButton = screen.getByLabelText('Go to previous page')
    expect(prevButton).toHaveAttribute('disabled')
  })

  it('next button is properly disabled on last page', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)
    const page2Button = screen.getByLabelText('Go to page 2')
    
    await user.click(page2Button)
    const nextButton = screen.getByLabelText('Go to next page')
    expect(nextButton).toHaveAttribute('disabled')
  })

  it('displays exactly 10 rows per page', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0, B: i % 4 < 2 },
      result: i % 3 === 0,
    }))

    const { container } = render(<TruthTable variables={['A', 'B']} rows={manyRows} />)

    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows).toHaveLength(10)
  })

  it('displays remaining rows on last page', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0, B: i % 4 < 2 },
      result: i % 3 === 0,
    }))

    const { container } = render(<TruthTable variables={['A', 'B']} rows={manyRows} />)

    // Navigate to last page (page 3)
    const page3Button = screen.getByLabelText('Go to page 3')
    await user.click(page3Button)

    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows).toHaveLength(5) // 25 % 10 = 5 rows on last page
  })

  it('renders empty table when no rows provided', () => {
    const { container } = render(<TruthTable variables={['A', 'B']} rows={[]} />)

    const bodyRows = container.querySelectorAll('tbody tr')
    expect(bodyRows).toHaveLength(0)
  })

  it('displays correct result styling for true values', () => {
    const rows = [{ assignment: { A: true }, result: true }]
    const { container } = render(<TruthTable variables={['A']} rows={rows} />)

    const resultCell = container.querySelector('.result-value.true')
    expect(resultCell).toBeInTheDocument()
  })

  it('displays correct result styling for false values', () => {
    const rows = [{ assignment: { A: false }, result: false }]
    const { container } = render(<TruthTable variables={['A']} rows={rows} />)

    const resultCell = container.querySelector('.result-value.false')
    expect(resultCell).toBeInTheDocument()
  })

  it('handles single row correctly', () => {
    const singleRow = [{ assignment: { A: true }, result: true }]
    render(<TruthTable variables={['A']} rows={singleRow} />)

    // No pagination for single page
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('renders all variables in correct order', () => {
    const variables = ['a', 'b', 'c']
    const rows = [{ assignment: { a: true, b: false, c: true }, result: false }]
    const { container } = render(<TruthTable variables={variables} rows={rows} />)

    const headers = container.querySelectorAll('thead th')
    expect(headers[0]).toHaveTextContent('a')
    expect(headers[1]).toHaveTextContent('b')
    expect(headers[2]).toHaveTextContent('c')
    expect(headers[3]).toHaveTextContent('Result')
  })

  it('cannot navigate beyond last page', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)

    // Navigate to last page
    const page2Button = screen.getByLabelText('Go to page 2')
    await user.click(page2Button)
    const nextButton = screen.getByLabelText('Go to next page')
    expect(nextButton).toHaveAttribute('disabled')
  })

  it('renders truth table with multiple pages', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 35 }, (_, i) => ({
      assignment: { A: i % 2 === 0, B: i % 4 < 2 },
      result: i % 3 === 0,
    }))

    render(<TruthTable variables={['A', 'B']} rows={manyRows} />)

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('maintains correct page after multiple navigations', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 35 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)

    const page3Button = screen.getByLabelText('Go to page 3')
    const page2Button = screen.getByLabelText('Go to page 2')

    await user.click(page3Button)
    let selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('3')

    await user.click(page2Button)
    selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('2')

    await user.click(page3Button)
    selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('3')
  })

  it('highlights current page number visually', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)
    const currentPageIndicator = container.querySelector('[aria-current="page"]')
    expect(currentPageIndicator).toBeInTheDocument()
  })

  it('supports keyboard navigation with arrow keys', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)
    const tableWrapper = container.querySelector('.truth-table-wrapper') as HTMLElement

    // Focus and press right arrow to go to next page
    tableWrapper.focus()
    await user.keyboard('{ArrowRight}')
    let selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('2')

    // Press left arrow to go to previous page
    await user.keyboard('{ArrowLeft}')
    selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('1')
  })

  it('pagination container is responsive', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)
    const paginationContainer = container.querySelector('.pagination-container')
    expect(paginationContainer).toBeInTheDocument()
  })

  it('current page indicator has accessible label', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)
    const pageIndicator = screen.getByLabelText('table pagination')
    expect(pageIndicator).toBeInTheDocument()
  })

  it('current page button has distinct visual styling from other pages', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)
    const selectedPageButton = container.querySelector('[aria-current="page"]') as HTMLElement
    const otherPageButton = screen.getByLabelText('Go to page 2') as HTMLElement

    expect(selectedPageButton).toBeInTheDocument()
    // The selected page should have aria-current="page" attribute
    expect(selectedPageButton).toHaveAttribute('aria-current', 'page')
    // The other page button should not have this attribute
    expect(otherPageButton).not.toHaveAttribute('aria-current', 'page')
  })

  it('selected page button is visually prominent with higher color intensity', async () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)
    const selectedPageButton = container.querySelector(
      '.MuiPaginationItem-page.Mui-selected'
    ) as HTMLElement

    expect(selectedPageButton).toBeInTheDocument()
    // Verify the selected button has the Mui-selected class for visual styling
    expect(selectedPageButton.classList.contains('Mui-selected')).toBe(true)
  })

  it('pagination state changes visually when navigating to different pages', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    const { container } = render(<TruthTable variables={['A']} rows={manyRows} />)

    // Initially page 1 should be selected
    let selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('1')

    // Click to page 2
    const page2Button = screen.getByLabelText('Go to page 2')
    await user.click(page2Button)

    // Now page 2 should be selected
    selectedPage = container.querySelector('[aria-current="page"]')
    expect(selectedPage).toHaveTextContent('2')

    // The Mui-selected class should move to page 2
    const selectedPageElement = container.querySelector('.MuiPaginationItem-page.Mui-selected')
    expect(selectedPageElement).toHaveTextContent('2')
  })

  it('shows pagination with clear visual feedback for large datasets', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 50 }, (_, i) => ({
      assignment: { A: i % 2 === 0, B: i % 3 === 0 },
      result: i % 5 === 0,
    }))

    const { container } = render(<TruthTable variables={['A', 'B']} rows={manyRows} />)

    // Verify pagination container exists and is visible
    const paginationContainer = container.querySelector('.pagination-container')
    expect(paginationContainer).toBeInTheDocument()

    // Verify the pagination component with proper ARIA attributes
    const pagination = screen.getByLabelText('table pagination')
    expect(pagination).toBeInTheDocument()

    // Verify current page is marked
    const currentPage = container.querySelector('[aria-current="page"]')
    expect(currentPage).toBeInTheDocument()
    expect(currentPage).toHaveTextContent('1')
  })
})
