import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { FormulaInput } from '../components/FormulaInput'
import { FormulaDisplay } from '../components/FormulaDisplay'
import { parseFormula } from '../utils/formulaParser'
import { FormulaResult } from '../App'
import { useExampleContext } from '../context/ExampleContext'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formulas, setFormulas] = useState<FormulaResult[]>([])
  const { selectedExample, setSelectedExample } = useExampleContext()
  
  // Wrap the hook with a try-catch for testing environments
  let isMobile = false
  try {
    const theme = useTheme()
    isMobile = useMediaQuery(theme.breakpoints.down('md'))
  } catch {
    // In test environment without ThemeProvider, default to false
    isMobile = false
  }

  const handleFormulaSubmit = (formula: string) => {
    const result = parseFormula(formula)
    setFormulas([
      {
        original: formula,
        latex: result.latex,
        error: result.error,
      },
      ...formulas,
    ])
  }

  // Handle when an example is selected from the sidebar
  useEffect(() => {
    if (selectedExample) {
      handleFormulaSubmit(selectedExample)
      setSelectedExample('')
    }
  }, [selectedExample, setSelectedExample])

  const handleRemoveFormula = (index: number) => {
    setFormulas(formulas.filter((_, i) => i !== index))
  }

  const handleTruthTable = (formula: FormulaResult) => {
    navigate('/truth-table', { state: { formula } })
  }

  const handleProve = (formula: FormulaResult) => {
    navigate('/proof-assistant', { state: { formula: formula.original } })
  }

  return (
    <div className="app-container">
      {!isMobile && (
        <div className="header">
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
      )}

      <FormulaInput onSubmit={handleFormulaSubmit} />

      <div className="formulas-history">
        {formulas.map((formula, index) => (
          <div key={index} className="formula-item">
            <div className="formula-header">
              <div className="formula-original">
                <code>{formula.original}</code>
              </div>
              <button
                className="remove-button"
                onClick={() => handleRemoveFormula(index)}
                title={t('remove')}
              >
                <DeleteIcon sx={{ fontSize: '1.2rem' }} />
              </button>
            </div>
            <FormulaDisplay latex={formula.latex} error={formula.error} />
            {!formula.error && (
              <div className="formula-actions">
                <button
                  className="truth-table-button"
                  onClick={() => handleTruthTable(formula)}
                >
                  {t('truthTable')}
                </button>
                <button
                  className="truth-table-button"
                  onClick={() => handleProve(formula)}
                >
                  {t('prove')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
