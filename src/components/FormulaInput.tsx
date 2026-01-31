import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FormulaInputProps {
  onSubmit: (formula: string) => void
}

export function FormulaInput({ onSubmit }: FormulaInputProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        onSubmit(input)
        setInput('')
      }
    }
  }

  return (
    <div className="formula-input-container">
      <label htmlFor="formula-input">{t('formulaInput')}:</label>
      <input
        id="formula-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={t('formulaPlaceholder')}
        className="formula-input"
      />
      <div className="syntax-help">
        <p><strong>{t('syntaxHelp')}</strong></p>
      </div>
    </div>
  )
}
