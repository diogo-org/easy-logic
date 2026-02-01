/**
 * Component for displaying a single proof step
 */

import { Box, Paper, Typography, Checkbox, IconButton, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { ProofStep as ProofStepType, RULE_KEYS } from '../logic/proof'
import { FormulaDisplay } from './FormulaDisplay'
import { parseFormula } from '../logic/formula'
import { LAYOUT, OPACITY } from '../constants/ui'

interface ProofStepProps {
  step: ProofStepType
  isSelectable: boolean
  isSelected: boolean
  onToggleSelect: (id: number) => void
  onDelete?: (id: number) => void
  canDelete?: boolean
}

export default function ProofStep({
  step,
  isSelectable,
  isSelected,
  onToggleSelect,
  onDelete,
  canDelete = false,
}: ProofStepProps) {
  const { t } = useTranslation()
  const indentation = step.depth * LAYOUT.DEPTH_INDENT_PX
  const isPremise = step.ruleKey === RULE_KEYS.PREMISE
  const isBranchStart = step.ruleKey === RULE_KEYS.OR_ELIM
  
  // Convert formula to LaTeX for proper rendering
  const { latex, error } = parseFormula(step.formula)

  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 1, sm: 2 },
        mb: 1,
        ml: { xs: `${indentation * OPACITY.HALF}px`, sm: `${indentation}px` },
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        cursor: isSelectable ? 'pointer' : 'default',
        bgcolor: isSelected 
          ? 'action.selected' 
          : isPremise 
            ? 'success.light' 
            : isBranchStart 
              ? 'warning.light' 
              : 'background.paper',
        borderLeft: isPremise ? '4px solid' : isBranchStart ? '4px solid' : 'none',
        borderLeftColor: isPremise ? 'success.main' : isBranchStart ? 'warning.main' : 'transparent',
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: 30, sm: 50 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {step.lineNumber || step.id}.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <FormulaDisplay latex={latex} error={error} />
      </Box>

      <Box sx={{ 
        textAlign: 'right', 
        minWidth: { xs: 'auto', sm: LAYOUT.RULE_BUTTON_MIN_WIDTH },
        width: { xs: '100%', sm: 'auto' },
        mt: { xs: OPACITY.HALF, sm: 0 },
        pl: { xs: isSelectable ? LAYOUT.SMALL_SPACING_PX : 0, sm: 0 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
          {t(step.justificationKey, step.justificationParams)}
        </Typography>
        {canDelete && onDelete && (
          <Tooltip title={t('deleteStep')}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(step.id)
              }}
              sx={{ 
                opacity: 0.6, 
                '&:hover': { opacity: 1, color: 'error.main' },
                p: 0.5,
              }}
              aria-label={t('deleteStep')}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  )
}
