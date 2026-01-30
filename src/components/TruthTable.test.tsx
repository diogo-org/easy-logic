import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TruthTable } from './TruthTable'
import type { TruthTableRow } from '../utils/truthTableGenerator'

describe('TruthTable', () => {
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

  it('displays page info', () => {
    render(<TruthTable variables={['A', 'B']} rows={mockRows} />)
    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument()
  })

  it('handles pagination with many rows', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 25 }, (_, i) => ({
      assignment: { A: i % 2 === 0, B: i % 3 === 0 },
      result: (i % 2 === 0) && (i % 3 === 0),
    }))

    render(<TruthTable variables={['A', 'B']} rows={manyRows} />)
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument()
  })

  it('navigates to next page', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)
    const nextBtn = screen.getByText('Next')
    
    await user.click(nextBtn)
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()
  })

  it('navigates to previous page', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)
    const nextBtn = screen.getByText('Next')
    const prevBtn = screen.getByText('Previous')
    
    await user.click(nextBtn)
    await user.click(prevBtn)
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    render(<TruthTable variables={['A']} rows={mockRows} />)
    const prevBtn = screen.getByText('Previous')
    expect(prevBtn).toBeDisabled()
  })

  it('disables next button on last page', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 15 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)
    const nextBtn = screen.getByText('Next')
    
    await user.click(nextBtn)
    expect(nextBtn).toBeDisabled()
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
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)
    await user.click(nextButton)

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

    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeDisabled()
    expect(screen.getByText('Next')).toBeDisabled()
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
    const nextButton = screen.getByText('Next')
    await user.click(nextButton)
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()
    expect(nextButton).toBeDisabled()
  })

  it('renders truth table with multiple pages', () => {
    const manyRows: TruthTableRow[] = Array.from({ length: 35 }, (_, i) => ({
      assignment: { A: i % 2 === 0, B: i % 4 < 2 },
      result: i % 3 === 0,
    }))

    render(<TruthTable variables={['A', 'B']} rows={manyRows} />)

    expect(screen.getByText(/Page 1 of 4/)).toBeInTheDocument()
  })

  it('maintains correct page after multiple navigations', async () => {
    const user = userEvent.setup()
    const manyRows: TruthTableRow[] = Array.from({ length: 35 }, (_, i) => ({
      assignment: { A: i % 2 === 0 },
      result: i % 2 === 0,
    }))

    render(<TruthTable variables={['A']} rows={manyRows} />)

    const nextButton = screen.getByText('Next')
    const previousButton = screen.getByText('Previous')

    await user.click(nextButton)
    await user.click(nextButton)
    expect(screen.getByText(/Page 3 of 4/)).toBeInTheDocument()

    await user.click(previousButton)
    expect(screen.getByText(/Page 2 of 4/)).toBeInTheDocument()

    await user.click(nextButton)
    expect(screen.getByText(/Page 3 of 4/)).toBeInTheDocument()
  })
})
