/**
 * Component for selecting inference rules
 */

import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
  FormHelperText,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ApplicableRule } from '../logic/proof'
import { LAYOUT } from '../constants/ui'

interface RuleSelectorProps {
  readonly rules: ApplicableRule[]
  readonly onRuleSelect: (ruleId: string, userInput?: string) => void
  readonly disabled?: boolean
}

export default function RuleSelector({ rules, onRuleSelect, disabled = false }: RuleSelectorProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ApplicableRule | null>(null)
  const [userInput, setUserInput] = useState('')

  const handleRuleClick = (rule: ApplicableRule) => {
    if (!rule.applicable || disabled) {return}

    // Rules that need user input
    const needsInput = ['assume', 'or_intro_left', 'or_intro_right', 'lem'].includes(rule.id)

    if (needsInput) {
      setSelectedRule(rule)
      setUserInput('')
      setDialogOpen(true)
    } else {
      onRuleSelect(rule.id)
    }
  }

  const handleConfirm = () => {
    if (selectedRule && userInput.trim()) {
      onRuleSelect(selectedRule.id, userInput.trim())
      setDialogOpen(false)
      setUserInput('')
      setSelectedRule(null)
    }
  }

  const handleCancel = () => {
    setDialogOpen(false)
    setUserInput('')
    setSelectedRule(null)
  }

  // Group rules by category
  const categories = [
    { id: 'assumption', label: t('categoryAssumption') },
    { id: 'basic', label: t('categoryBasic') },
    { id: 'introduction', label: t('categoryIntroduction') },
    { id: 'elimination', label: t('categoryElimination') },
  ]

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 700, color: '#2a1f35' }}>
        {t('availableRules')}
      </Typography>

      {categories.map((category) => {
        const categoryRules = rules.filter((r) => r.category === category.id)
        if (categoryRules.length === 0) {return null}

        return (
          <Box key={category.id} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#666', fontWeight: 600, mb: 1.5, fontSize: '0.875rem' }}>
              {category.label}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {categoryRules.map((rule) => (
                <Tooltip
                  key={rule.id}
                  title={
                    rule.applicable ? t(rule.descriptionKey) : rule.reason || t('notApplicable')
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!rule.applicable || disabled}
                      onClick={() => handleRuleClick(rule)}
                      sx={{
                        minWidth: isSmallScreen ? 'auto' : `${LAYOUT.RULE_BUTTON_MIN_WIDTH}px`,
                        bgcolor: rule.applicable ? '#6b5b87' : '#e8e3f0',
                        color: rule.applicable ? '#fff' : '#8a7b9e',
                        fontWeight: 700,
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        px: 1.5,
                        py: 0.75,
                        border: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: rule.applicable ? '#5a4a76' : '#e8e3f0',
                          boxShadow: 'none',
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#e8e3f0',
                          color: '#8a7b9e',
                          fontWeight: 700,
                          opacity: 0.5,
                          filter: 'grayscale(0.4)',
                        },
                      }}
                    >
                      {t(rule.nameKey)}
                    </Button>
                  </span>
                </Tooltip>
              ))}
            </Box>
          </Box>
        )
      })}

      {/* Dialog for rules that need input */}
      <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedRule ? t(selectedRule.nameKey) : ''}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectedRule ? t(selectedRule.descriptionKey) : ''}
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label={t('formula')}
            fullWidth
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={t('formulaInputPlaceholder')}
            error={!userInput.trim() && userInput !== ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userInput.trim()) {
                handleConfirm()
              }
            }}
            sx={{ mt: 2 }}
            aria-describedby="input-helper-text"
          />

          <FormHelperText id="input-helper-text" sx={{ mt: 1 }}>
            {userInput.trim()
              ? t('pressEnterToApply') || 'Press Enter or click Apply to continue'
              : t('enterFormulaToApply') || 'Enter a formula above to enable the Apply button'}
          </FormHelperText>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {t('syntaxHelpLabel')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              <Chip label={t('notOperator')} size="small" />
              <Chip label={t('andOperator')} size="small" />
              <Chip label={t('orOperator')} size="small" />
              <Chip label={t('impliesOperator')} size="small" />
              <Chip label={t('iffOperator')} size="small" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>{t('cancel')}</Button>
          <Tooltip
            title={
              userInput.trim()
                ? ''
                : t('applyDisabledTooltip') || 'Enter a formula to continue'
            }
            disableHoverListener={userInput.trim() !== ''}
          >
            <span>
              <Button
                onClick={handleConfirm}
                variant="contained"
                disabled={!userInput.trim()}
                aria-disabled={!userInput.trim()}
                aria-describedby="input-helper-text"
                sx={{
                  bgcolor: '#6b5b87',
                  color: '#fff',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: '#5a4a76',
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#e8e3f0',
                    color: '#8a7b9e',
                    fontWeight: 700,
                    opacity: 0.5,
                    filter: 'grayscale(0.4)',
                  },
                }}
              >
                {t('apply')}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
