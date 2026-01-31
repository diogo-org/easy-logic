/**
 * Component for displaying a single proof step
 */

import { Box, Paper, Typography, Checkbox } from '@mui/material'
import { ProofStep as ProofStepType } from '../types/proof'
import { FormulaDisplay } from './FormulaDisplay'
import { parseFormula } from '../utils/formulaParser'

interface ProofStepProps {
  step: ProofStepType
  isSelectable: boolean
  isSelected: boolean
  onToggleSelect: (id: number) => void
}

export default function ProofStep({
  step,
  isSelectable,
  isSelected,
  onToggleSelect,
}: ProofStepProps) {
  const indentation = step.depth * 16 // 16px per depth level (reduced from 24)
  const isPremise = step.rule === 'Premise'
  
  // Convert formula to LaTeX for proper rendering
  const { latex, error } = parseFormula(step.formula)

  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 1, sm: 2 },
        mb: 1,
        ml: { xs: `${indentation * 0.5}px`, sm: `${indentation}px` },
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        cursor: isSelectable ? 'pointer' : 'default',
        bgcolor: isSelected ? 'action.selected' : isPremise ? 'success.light' : 'background.paper',
        borderLeft: isPremise ? '4px solid' : 'none',
        borderLeftColor: isPremise ? 'success.main' : 'transparent',
        '&:hover': isSelectable
          ? {
              bgcolor: 'action.hover',
            }
          : {},
      }}
      onClick={() => isSelectable && onToggleSelect(step.id)}
    >
      {isSelectable && (
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleSelect(step.id)}
          onClick={(e) => e.stopPropagation()}
          size="small"
        />
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: 30, sm: 40 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {step.id}.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <FormulaDisplay latex={latex} error={error} />
      </Box>

      <Box sx={{ 
        textAlign: 'right', 
        minWidth: { xs: 'auto', sm: 120 },
        width: { xs: '100%', sm: 'auto' },
        mt: { xs: 0.5, sm: 0 },
        pl: { xs: isSelectable ? 4 : 0, sm: 0 }
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
          {step.justification}
        </Typography>
      </Box>
    </Paper>
  )
}
