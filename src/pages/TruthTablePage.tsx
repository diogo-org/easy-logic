import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { TruthTable } from '../components/TruthTable'
import { generateTruthTable } from '../utils/truthTableGenerator'
import { FormulaResult } from '../App'

export function TruthTablePage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { formula: FormulaResult } | null

  if (!state?.formula) {
    return (
      <div className="app-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>{t('formulaNotFound')}</p>
        </div>
      </div>
    )
  }

  const { formula } = state
  const { original, latex } = formula

  try {
    const rows = generateTruthTable(original)
    const variables = Object.keys(rows[0]?.assignment || {}).sort()

    return (
      <div className="app-container">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          title={t('backToHome')}
        >
          <ArrowBackIcon sx={{ fontSize: '1.2rem' }} />
          {t('back')}
        </button>

        <div className="truth-table-page">
          <h2 className="formula-title">{t('formulaLabel')}</h2>
          <div className="formula-display-large">
            <InlineMath math={latex} />
          </div>

          <div className="formula-code">
            <code>{original}</code>
          </div>

          <TruthTable variables={variables} rows={rows} />
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="app-container">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          title={t('backToHome')}
        >
          <ArrowBackIcon sx={{ fontSize: '1.2rem' }} />
          {t('back')}
        </button>

        <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
          <p>{t('errorGeneratingTruthTable', { message: error instanceof Error ? error.message : t('unknownError') })}</p>
        </div>
      </div>
    )
  }
}
