import { useTranslation } from 'react-i18next'
import { InlineMath } from 'react-katex'
import { Alert } from '@mui/material'
import 'katex/dist/katex.min.css'

interface FormulaDisplayProps {
  latex: string
  error?: string
}

export function FormulaDisplay({ latex, error }: FormulaDisplayProps) {
  const { t } = useTranslation()

  if (error) {
    return (
      <Alert 
        severity="error" 
        className="formula-display error"
        aria-live="polite"
        role="alert"
      >
        {t('errorPrefix')} {error}
      </Alert>
    )
  }

  if (!latex) {
    return null
  }

  return (
    <div className="formula-display">
      <InlineMath math={latex} />
    </div>
  )
}
