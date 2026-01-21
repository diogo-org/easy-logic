import { Box, List, ListItem, ListItemButton, Typography } from '@mui/material'
import { EXAMPLES } from '../constants/examples'

interface ExamplesSidebarProps {
  onExampleClick: (formula: string) => void
}

export function ExamplesSidebar({ onExampleClick }: ExamplesSidebarProps) {
  return (
    <Box sx={{ overflow: 'auto', p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Examples
      </Typography>
      <List sx={{ p: 0 }}>
        {EXAMPLES.map((example, index) => (
          <ListItem key={index} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => onExampleClick(example.formula)}
              title={example.description}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.5,
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: 1,
                py: 1,
                px: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: '#1976d2' }}
              >
                {example.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  p: 0.5,
                  borderRadius: 0.5,
                  width: '100%',
                }}
              >
                {example.formula}
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.7, fontSize: '0.75rem' }}
              >
                {example.description}
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default ExamplesSidebar
