import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pagination } from '@mui/material'
import { TruthTableRow } from '../logic/truthTable'
import './TruthTable.css'

interface TruthTableProps {
  variables: string[]
  rows: TruthTableRow[]
}

const ROWS_PER_PAGE = 10

export function TruthTable({ variables, rows }: TruthTableProps) {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(rows.length / ROWS_PER_PAGE)
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE
  const endIdx = Math.min(startIdx + ROWS_PER_PAGE, rows.length)
  const pageRows = rows.slice(startIdx, endIdx)

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' && currentPage < totalPages) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
      event.preventDefault()
    } else if (event.key === 'ArrowLeft' && currentPage > 1) {
      setCurrentPage((prev) => Math.max(prev - 1, 1))
      event.preventDefault()
    }
  }, [currentPage, totalPages])

  return (
    <div className="truth-table-container">
      <div className="truth-table-header">
        <h2>{t('truthTable')}</h2>
      </div>

      <div className="truth-table-wrapper" onKeyDown={handleKeyDown} tabIndex={0}>
        <table className="truth-table" role="table">
          <thead>
            <tr>
              {variables.map((variable) => (
                <th key={variable}>{variable}</th>
              ))}
              <th className="result-column">{t('result')}</th>
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

      {totalPages > 1 && (
        <div className="pagination-container">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="medium"
            className="pagination"
            aria-label="table pagination"
          />
        </div>
      )}
    </div>
  )
}
