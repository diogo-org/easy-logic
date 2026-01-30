import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Drawer, AppBar, Toolbar, IconButton, useMediaQuery, useTheme } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DeleteIcon from '@mui/icons-material/Delete'
import { FormulaInput } from './components/FormulaInput'
import { FormulaDisplay } from './components/FormulaDisplay'
import { ExamplesSidebar } from './components/ExamplesSidebar'
import { parseFormula } from './utils/formulaParser'
import './App.css'

interface FormulaResult {
  original: string
  latex: string
  error?: string
}

const DRAWER_WIDTH = 300

function App() {
  const { t } = useTranslation()
  const [formulas, setFormulas] = useState<FormulaResult[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  const handleExampleClick = (formula: string) => {
    handleFormulaSubmit(formula)
    if (isMobile) {
      setDrawerOpen(false)
    }
  }

  const handleRemoveFormula = (index: number) => {
    setFormulas(formulas.filter((_, i) => i !== index))
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <h1 style={{ margin: 0, fontSize: '1.5rem', flex: 1 }}>{t('title')}</h1>
          </Toolbar>
        </AppBar>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <ExamplesSidebar onExampleClick={handleExampleClick} />
      </Drawer>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: isMobile ? '64px' : 0,
        }}
      >
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
              </div>
            ))}
          </div>
        </div>
      </Box>
    </Box>
  )
}

export default App
