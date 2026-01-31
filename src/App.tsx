import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Drawer, AppBar, Toolbar, IconButton, useMediaQuery, useTheme } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { ExamplesSidebar } from './components/ExamplesSidebar'
import { ExampleProvider, useExampleContext } from './context/ExampleContext'
import { HomePage } from './pages/HomePage'
import { TruthTablePage } from './pages/TruthTablePage'
import ProofAssistantPage from './pages/ProofAssistantPage'
import './App.css'

export interface FormulaResult {
  original: string
  latex: string
  error?: string
}

const DRAWER_WIDTH = 300

function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { setSelectedExample } = useExampleContext()
  const location = useLocation()

  // Only show sidebar on home page
  const showSidebar = location.pathname === '/'

  const handleExampleClick = (formula: string) => {
    setSelectedExample(formula)
    if (isMobile) {
      setDrawerOpen(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile && showSidebar && (
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

      {showSidebar && (
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
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: isMobile && showSidebar ? '64px' : 0,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/truth-table" element={<TruthTablePage />} />
      <Route path="/proof-assistant" element={<ProofAssistantPage />} />
    </Routes>
  )
}

function App() {
  // Use production basename only when built for production (check if DEV mode is false)
  const basename = import.meta.env.DEV ? '/' : '/easy-logic'
  
  return (
    <BrowserRouter basename={basename}>
      <ExampleProvider>
        <AppLayout>
          <AppContent />
        </AppLayout>
      </ExampleProvider>
    </BrowserRouter>
  )
}

export default App
