/**
 * Component for displaying a single proof step with Fitch-style boxing
 */

import { Box, Paper, Typography, Checkbox, IconButton, Tooltip } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { ProofStep as ProofStepType, RULE_KEYS } from '../logic/proof'
import { FormulaDisplay } from './FormulaDisplay'
import { parseFormula } from '../logic/formula'
import { OPACITY, FITCH, LAYOUT } from '../constants/ui'

function getBgColor(isSelected: boolean, isPremise: boolean, isAssumption: boolean): string {
  if (isSelected) {return 'action.selected'}
  if (isPremise) {return 'success.light'}
  if (isAssumption) {return 'warning.light'}
  return 'background.paper'
}

function getBorderColor(isPremise: boolean, isAssumption: boolean): string {
  if (isPremise) {return 'success.main'}
  if (isAssumption) {return 'warning.main'}
  return 'transparent'
}

function getBarBorderRadius(
  isFirst: boolean,
  isLast: boolean,
  depth: number,
  depths: readonly number[],
): string | number {
  const isInnermost = depth === depths[depths.length - 1]
  if (isFirst && isInnermost) {
    return `${FITCH.BAR_RADIUS_PX}px ${FITCH.BAR_RADIUS_PX}px 0 0`
  }
  if (isLast && isInnermost) {
    return `0 0 ${FITCH.BAR_RADIUS_PX}px ${FITCH.BAR_RADIUS_PX}px`
  }
  return 0
}

interface ProofStepProps {
  readonly step: ProofStepType
  readonly isSelectable: boolean
  readonly isSelected: boolean
  readonly onToggleSelect: (id: number) => void
  readonly onDelete?: (id: number) => void
  readonly canDelete?: boolean
  /** Depth levels of subproofs containing this step (e.g. [1] or [1, 2]) */
  readonly subproofDepths?: number[]
  /** True if this step is the first step in its innermost subproof */
  readonly isFirstInSubproof?: boolean
  /** True if this step is the last step in its innermost subproof */
  readonly isLastInSubproof?: boolean
}

export default function ProofStep({
  step,
  isSelectable,
  isSelected,
  onToggleSelect,
  onDelete,
  canDelete = false,
  subproofDepths = [],
  isFirstInSubproof = false,
  isLastInSubproof = false,
}: ProofStepProps) {
  const { t } = useTranslation()
  const isPremise = step.ruleKey === RULE_KEYS.PREMISE
  const isAssumption = step.ruleKey === RULE_KEYS.ASSUME
  
  // Convert formula to LaTeX for proper rendering
  const { latex, error } = parseFormula(step.formula)

  const hasSubproofBars = subproofDepths.length > 0

  return (
    <Box
      data-testid="subproof-wrapper"
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        mb: FITCH.STEP_GAP_PX,
        ...(isFirstInSubproof && {
          mt: FITCH.SUBPROOF_SPACING_PX,
        }),
        ...(isLastInSubproof && {
          mb: FITCH.SUBPROOF_SPACING_PX,
        }),
      }}
    >
      {/* Fitch-style depth bars */}
      {subproofDepths.map((depth) => (
        <Box
          key={depth}
          data-testid={`depth-bar-${depth}`}
          sx={{
            width: FITCH.BAR_WIDTH_PX,
            minHeight: '100%',
            bgcolor: FITCH.COLORS[(depth - 1) % FITCH.COLORS.length],
            mr: FITCH.BAR_GAP_PX,
            borderRadius: getBarBorderRadius(isFirstInSubproof, isLastInSubproof, depth, subproofDepths),
            flexShrink: 0,
          }}
        />
      ))}

      {/* Main step card */}
      <Paper
        elevation={hasSubproofBars ? 0 : 1}
        {...(isAssumption && { 'data-assumption': 'true' })}
        sx={{
          p: { xs: 1, sm: 2 },
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          cursor: isSelectable ? 'pointer' : 'default',
          bgcolor: getBgColor(isSelected, isPremise, isAssumption),
          borderLeft: (isPremise || isAssumption) ? '4px solid' : 'none',
          borderLeftColor: getBorderColor(isPremise, isAssumption),
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
          minWidth: { xs: 'auto', sm: 120 },
          width: { xs: '100%', sm: 'auto' },
          mt: { xs: OPACITY.HALF, sm: 0 },
          pl: { xs: isSelectable ? LAYOUT.CHECKBOX_PADDING : 0, sm: 0 },
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
    </Box>
  )
}
