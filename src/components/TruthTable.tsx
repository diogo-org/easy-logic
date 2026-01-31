import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TruthTableRow } from '../utils/truthTableGenerator'
import './TruthTable.css'

interface TruthTableProps {
  variables: string[]
  rows: TruthTableRow[]
}

const ROWS_PER_PAGE = 10

export function TruthTable({ variables, rows }: TruthTableProps) {
  const { t } = useTranslation()
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
        <h2>{t('truthTable')}</h2>
      </div>

      <div className="truth-table-wrapper">
        <table className="truth-table">
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

      <div className="pagination">
        <button
          className="pagination-button"
          onClick={handlePrevious}
          disabled={currentPage === 0}
        >
          {t('previous')}
        </button>
        <span className="pagination-info">
          {t('pageOf', { current: currentPage + 1, total: totalPages })}
        </span>
        <button
          className="pagination-button"
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
