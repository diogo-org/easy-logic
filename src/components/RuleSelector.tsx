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
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ApplicableRule } from '../types/proof'

interface RuleSelectorProps {
  rules: ApplicableRule[]
  onRuleSelect: (ruleId: string, userInput?: string) => void
  disabled?: boolean
}

export default function RuleSelector({ rules, onRuleSelect, disabled = false }: RuleSelectorProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ApplicableRule | null>(null)
  const [userInput, setUserInput] = useState('')

  const handleRuleClick = (rule: ApplicableRule) => {
    if (!rule.applicable || disabled) return

    // Rules that need user input
    const needsInput = ['assume', 'or_intro_left', 'or_intro_right'].includes(rule.id)

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
      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        {t('availableRules')}
      </Typography>

      {categories.map((category) => {
        const categoryRules = rules.filter((r) => r.category === category.id)
        if (categoryRules.length === 0) return null

        return (
          <Box key={category.id} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                      variant={rule.applicable ? 'contained' : 'outlined'}
                      size="small"
                      disabled={!rule.applicable || disabled}
                      onClick={() => handleRuleClick(rule)}
                      sx={{
                        minWidth: isSmallScreen ? 'auto' : '120px',
                        opacity: rule.applicable ? 1 : 0.5,
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userInput.trim()) {
                handleConfirm()
              }
            }}
            sx={{ mt: 2 }}
          />

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
          <Button onClick={handleConfirm} variant="contained" disabled={!userInput.trim()}>
            {t('apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
