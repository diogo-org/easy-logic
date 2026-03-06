import { Box, List, ListItem, ListItemButton, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { EXAMPLES } from '../constants/examples'

interface ExamplesSidebarProps {
  onExampleClick: (formula: string) => void
}

export function ExamplesSidebar({ onExampleClick }: ExamplesSidebarProps) {
  const { t } = useTranslation()

  return (
    <Box sx={{ overflow: 'auto', p: 2 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2,
          fontWeight: 700,
          fontSize: '1rem',
          color: '#2a1f35',
        }}
      >
        {t('examples')}
      </Typography>
      <List sx={{ p: 0 }}>
        {EXAMPLES.map((example, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => onExampleClick(example.formula)}
              title={t(example.descriptionKey)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5,
                backgroundColor: '#e8e4f0',
                borderRadius: 1,
                py: 1,
                px: 1.5,
                '&:hover': {
                  backgroundColor: '#d8d0e8',
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ 
                  fontWeight: 700, 
                  color: '#2a1f35',
                  fontSize: '0.85rem',
                }}
              >
                {t(example.labelKey)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  lineHeight: 1.5,
                }}
              >
                {example.formula}
              </Typography>
              <Typography
                variant="caption"
                sx={{ 
                  color: '#555',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {t(example.descriptionKey)}
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
