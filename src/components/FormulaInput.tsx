import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Snackbar, Alert } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'

interface FormulaInputProps {
  onSubmit: (formula: string) => void
}

export function FormulaInput({ onSubmit }: FormulaInputProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [errorOpen, setErrorOpen] = useState(false)

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        onSubmit(input)
        setInput('')
        setErrorOpen(false)
      } else {
        setErrorOpen(true)
      }
    }
  }

  const handleClear = () => {
    setInput('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (errorOpen) {
      setErrorOpen(false)
    }
  }

  const handleErrorClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setErrorOpen(false)
  }

  return (
    <div className="formula-input-container">
      <label htmlFor="formula-input">{t('formulaInput')}:</label>
      <div className="formula-input-wrapper">
        <input
          id="formula-input"
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={t('formulaPlaceholder')}
          className="formula-input"
        />
        {input && (
          <Button
            onClick={handleClear}
            size="small"
            aria-label="Clear formula input"
            sx={{
              minWidth: 'auto',
              padding: '4px 8px',
              marginLeft: '8px'
            }}
            startIcon={<ClearIcon />}
          >
            {t('clear') || 'Clear'}
          </Button>
        )}
      </div>
      <div className="syntax-help">
        <p><strong>{t('syntaxHelp')}</strong></p>
      </div>
      <Snackbar
        open={errorOpen}
        autoHideDuration={3000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleErrorClose}
          severity="error"
          sx={{ width: '100%' }}
        >
          {t('emptyFormulaError')}
        </Alert>
      </Snackbar>
    </div>
  )
}
