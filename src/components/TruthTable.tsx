import { useState } from 'react'
import { TruthTableRow } from '../utils/truthTableGenerator'
import './TruthTable.css'

interface TruthTableProps {
  variables: string[]
  rows: TruthTableRow[]
}

const ROWS_PER_PAGE = 10

export function TruthTable({ variables, rows }: TruthTableProps) {
  const [currentPage, setCurrentPage] = useState(0)

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE)
  const startIdx = currentPage * ROWS_PER_PAGE
  const endIdx = Math.min(startIdx + ROWS_PER_PAGE, rows.length)
  const pageRows = rows.slice(startIdx, endIdx)

  const handlePrevious = () => {
    setCurrentPage(Math.max(0, currentPage - 1))
  }

  const handleNext = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
  }

  return (
    <div className="truth-table-container">
      <div className="truth-table-header">
        <h2>Truth Table</h2>
      </div>

      <div className="truth-table-wrapper">
        <table className="truth-table">
          <thead>
            <tr>
              {variables.map((variable) => (
                <th key={variable}>{variable}</th>
              ))}
              <th className="result-column">Result</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => (
              <tr key={startIdx + idx}>
                {variables.map((variable) => (
                  <td key={variable} className="value-cell">
                    {row.assignment[variable] ? 'T' : 'F'}
                  </td>
                ))}
                <td className="result-cell">
                  <span className={`result-value ${row.result ? 'true' : 'false'}`}>
                    {row.result ? 'T' : 'F'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          className="pagination-button"
          onClick={handlePrevious}
          disabled={currentPage === 0}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          className="pagination-button"
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  )
}
