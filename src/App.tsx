import { useState } from 'react'
import { Box, Drawer, AppBar, Toolbar, IconButton, useMediaQuery, useTheme } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
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
            <h1 style={{ margin: 0, fontSize: '1.5rem', flex: 1 }}>Easy Logic</h1>
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
          mt: isMobile ? '64px' : 0,
        }}
      >
        <div className="app-container">
          {!isMobile && (
            <div className="header">
              <h1>Easy Logic</h1>
              <p>Propositional Logic Formula Renderer</p>
            </div>
          )}

          <FormulaInput onSubmit={handleFormulaSubmit} />

          <div className="formulas-history">
            {formulas.map((formula, index) => (
              <div key={index} className="formula-item">
                <div className="formula-original">
                  <code>{formula.original}</code>
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
