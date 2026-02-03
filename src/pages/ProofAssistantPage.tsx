/**
 * Proof Assistant Page - Manual proof construction using Natural Deduction
 */

import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Snackbar,
  Chip,
  Backdrop,
} from '@mui/material'
import {
  ArrowBack,
  Refresh,
  HelpOutline,
  Celebration,
  Star,
  AutoAwesome,
} from '@mui/icons-material'
import { CELEBRATION, PROOF_HINT_STEPS } from '../constants/ui'
import {
  confettiFall,
  twinkle,
  heartbeat,
  shake,
  fireworkBurst,
  rainbowGlow,
  bounceIn,
  floatUp,
} from '../constants/animations'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RULE_KEYS } from '../logic/proof'
import { useProofState } from '../hooks/useProofState'
import ProofStep from '../components/ProofStep'
import RuleSelector from '../components/RuleSelector'

export default function ProofAssistantPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  // Check if a formula was passed from navigation state
  const initialFormula = (location.state as { formula?: string })?.formula || ''

  // Use the custom hook for proof state management
  const {
    proofSystem,
    goalDialogOpen,
    customGoal,
    setCustomGoal,
    selectedKB,
    setSelectedKB,
    proofState,
    selectedSteps,
    applicableRules,
    errorMessage,
    setErrorMessage,
    successMessage,
    setSuccessMessage,
    showHint,
    setShowHint,
    showCelebration,
    confetti,
    fireworks,
    floatingEmojis,
    handleGoalSelect,
    handleCustomGoalSubmit,
    handleRuleSelect,
    handleToggleStepSelection,
    handleDeleteStep,
    handleReset,
    handleCloseCelebration,
  } = useProofState(initialFormula)

  const knowledgeBases = proofSystem.getKnowledgeBases()

  // Provide guided hints based on the current state
  const getNextHint = (): string | null => {
    // Modus Ponens KB: select p and p→q, then apply MP
    if (selectedKB === 'modus-ponens') {
      if (proofState.steps.length === 2 && selectedSteps.length === 0) {
        return t('hintSelectBothPremises')
      }
      if (selectedSteps.length === 2) {
        return t('hintClickModusPonens')
      }
      if (proofState.steps.length > 2) {
        return null // They're done or making progress
      }
    }

    // Conjunction KB: select p and q, then apply ∧I
    if (selectedKB === 'conjunction') {
      if (proofState.steps.length === 2 && selectedSteps.length === 0) {
        return t('hintSelectBothPremises')
      }
      if (selectedSteps.length === 2) {
        return t('hintClickAndIntro')
      }
    }

    // Conjunction Elimination KB: select p∧q, then apply ∧E
    if (selectedKB === 'elimination') {
      if (proofState.steps.length === 1 && selectedSteps.length === 0) {
        return t('hintSelectPremise')
      }
      if (selectedSteps.length === 1) {
        const goalIsP = proofState.goal === 'p'
        return goalIsP 
          ? t('hintClickAndElimLeft')
          : t('hintClickAndElimRight')
      }
    }

    // Disjunction KB: select p, then apply ∨I
    if (selectedKB === 'disjunction') {
      if (proofState.steps.length === 1 && selectedSteps.length === 0) {
        return t('hintSelectPremise')
      }
      if (selectedSteps.length === 1) {
        return t('hintClickOrIntro')
      }
    }

    // Hypothetical Syllogism: needs 2 MP applications
    if (selectedKB === 'syllogism' && proofState.goal === 'r') {
      if (proofState.steps.length === PROOF_HINT_STEPS.SYLLOGISM_INITIAL && selectedSteps.length === 0) {
        return t('hintSelectForMP1')
      }
      if (proofState.steps.length === PROOF_HINT_STEPS.SYLLOGISM_INITIAL && selectedSteps.length === PROOF_HINT_STEPS.STEPS_REQUIRED) {
        return t('hintClickMP')
      }
      if (proofState.steps.length === PROOF_HINT_STEPS.SYLLOGISM_AFTER_MP && selectedSteps.length === 0) {
        return t('hintSelectForMP2')
      }
      if (proofState.steps.length === PROOF_HINT_STEPS.SYLLOGISM_AFTER_MP && selectedSteps.length === PROOF_HINT_STEPS.STEPS_REQUIRED) {
        return t('hintClickMPAgain')
      }
    }

    return null
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3 }, gap: { xs: 1, sm: 2 } }}>
        <IconButton onClick={() => navigate('/')} aria-label={t('ariaBack')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          {t('proofAssistant')}
        </Typography>
      </Box>

      {/* Goal Selection Dialog */}
      <Dialog
        open={goalDialogOpen}
        onClose={() => {}}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{t('chooseGoal')}</Typography>
            <IconButton size="small">
              <HelpOutline fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            {t('selectKBAndGoal')}
          </Typography>

          {/* Knowledge Base Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {knowledgeBases.map((kb) => (
                <Button
                  key={kb.id}
                  variant={selectedKB === kb.id ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setSelectedKB(kb.id)}
                >
                  {t(kb.nameKey)}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Selected KB Info */}
          {knowledgeBases.find(kb => kb.id === selectedKB) && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                {t(knowledgeBases.find(kb => kb.id === selectedKB)!.nameKey)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t(knowledgeBases.find(kb => kb.id === selectedKB)!.descriptionKey)}
              </Typography>
              {knowledgeBases.find(kb => kb.id === selectedKB)!.premises.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('premises')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {knowledgeBases.find(kb => kb.id === selectedKB)!.premises.map((premise, idx) => (
                      <Chip key={idx} label={premise} size="small" sx={{ fontFamily: 'monospace' }} />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* Goals for Selected KB */}
          <Typography variant="subtitle2" gutterBottom>
            {t('suggestedGoals')}
          </Typography>
          <List>
            {knowledgeBases.find(kb => kb.id === selectedKB)?.suggestedGoals.map((goal, index) => (
              <ListItemButton
                key={index}
                onClick={() => handleGoalSelect(goal.formula, selectedKB)}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText
                  primary={t(goal.labelKey)}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace' }}>
                        {goal.formula}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {t(goal.descriptionKey)}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {t('orCustomGoal')}
            </Typography>
          </Divider>

          <TextField
            fullWidth
            label={t('customGoal')}
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder={t('customGoalPlaceholder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customGoal.trim()) {
                handleCustomGoalSubmit()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/')}>{t('cancel')}</Button>
          <Button
            onClick={handleCustomGoalSubmit}
            variant="contained"
            disabled={!customGoal.trim()}
          >
            {t('startProof')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      {proofState.goal && (
        <Box>
          {/* Goal Display */}
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {t('goalToProve')}
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: 'monospace', fontSize: { xs: '1.1rem', sm: '1.5rem' }, wordBreak: 'break-word' }}>
              {proofState.goal}
            </Typography>
            {proofState.premises.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  {t('givenPremises')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {proofState.premises.map((premise, index) => (
                    <Chip
                      key={index}
                      label={premise}
                      size="small"
                      sx={{ fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.2)' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {proofState.isComplete && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: { xs: 1, sm: 3 }, 
                  mt: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 3 },
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  border: '3px solid rgba(255,255,255,0.5)',
                }}
              >
                <Star sx={{ fontSize: { xs: 30, sm: 50 }, color: 'gold', display: { xs: 'none', sm: 'block' } }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)', fontSize: { xs: '1.2rem', sm: '2.125rem' } }}>
                    🎉🎊 {t('proofComplete')} 🎊🎉
                  </Typography>
                  <Typography variant="h2" sx={{ my: 1, fontSize: { xs: '2rem', sm: '3.75rem' } }}>
                    😄🏆😄
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                    {t('logicMaster')} ⭐
                  </Typography>
                </Box>
                <Star sx={{ fontSize: { xs: 30, sm: 50 }, color: 'gold', display: { xs: 'none', sm: 'block' } }} />
              </Box>
            )}
          </Paper>

          {/* 🎆🎆🎆 THE BIG BANG CELEBRATION OVERLAY 🎆🎆🎆 */}
          <Backdrop
            open={showCelebration}
            onClick={handleCloseCelebration}
            sx={{ 
              zIndex: 9999, 
              bgcolor: 'rgba(0,0,0,0.7)',
              flexDirection: 'column',
              gap: 2,
              animation: showCelebration ? `${shake} 0.5s ease-in-out` : 'none',
              overflow: 'hidden',
            }}
          >
            {/* ⭐ Background Stars ⭐ */}
            {Array.from({ length: CELEBRATION.STAR_COUNT }).map((_, i) => (
              <AutoAwesome
                key={`star-${i}`}
                sx={{
                  position: 'fixed',
                  left: `${Math.random() * CELEBRATION.SCALE_PERCENT}%`,
                  top: `${Math.random() * CELEBRATION.SCALE_PERCENT}%`,
                  fontSize: CELEBRATION.STAR_SIZE_MIN + Math.random() * CELEBRATION.STAR_SIZE_RANGE,
                  color: 'gold',
                  animation: `${twinkle} ${CELEBRATION.TWINKLE_BASE_DURATION + Math.random()}s ease-in-out infinite ${Math.random()}s`,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* 🎆 Firework Bursts 🎆 */}
            {fireworks.map((fw) => (
              <Box
                key={`fw-${fw.id}`}
                sx={{
                  position: 'fixed',
                  left: `${fw.left}%`,
                  top: `${fw.top}%`,
                  width: fw.size,
                  height: fw.size,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${fw.color} 0%, transparent 70%)`,
                  animation: `${fireworkBurst} 1.5s ease-out ${fw.delay}s forwards`,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* 🎊 EPIC Confetti Rain 🎊 */}
            {confetti.map((piece) => (
              <Typography
                key={piece.id}
                sx={{
                  position: 'fixed',
                  left: `${piece.left}%`,
                  top: 0,
                  fontSize: piece.size,
                  color: piece.color,
                  animation: `${confettiFall} ${piece.duration}s ease-out ${piece.delay}s forwards`,
                  pointerEvents: 'none',
                  textShadow: `0 0 10px ${piece.color}`,
                }}
              >
                {piece.shape}
              </Typography>
            ))}

            {/* 🎈 Floating Emojis 🎈 */}
            {floatingEmojis.map((emoji) => (
              <Typography
                key={`emoji-${emoji.id}`}
                sx={{
                  position: 'fixed',
                  left: `${emoji.left}%`,
                  bottom: `${emoji.bottom}%`,
                  fontSize: emoji.size,
                  animation: `${floatUp} 4s ease-out ${emoji.delay}s forwards`,
                  pointerEvents: 'none',
                }}
              >
                {emoji.emoji}
              </Typography>
            ))}

            {/* 🏆 THE MAIN CELEBRATION CARD 🏆 */}
            <Paper
              elevation={24}
              sx={{
                p: { xs: 3, sm: 6 },
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                color: 'white',
                borderRadius: 4,
                animation: `${bounceIn} 0.8s ease-out, ${rainbowGlow} 3s linear infinite`,
                border: '4px solid gold',
                boxShadow: '0 0 60px rgba(255,215,0,0.5), 0 0 100px rgba(255,215,0,0.3)',
                position: 'relative',
                overflow: 'visible',
                maxWidth: { xs: '90vw', sm: '500px' },
                maxHeight: { xs: '85vh', sm: 'auto' },
                overflowY: { xs: 'auto', sm: 'visible' },
              }}
            >
              {/* Corner decorations - hidden on mobile */}
              <Celebration sx={{ position: 'absolute', top: -20, left: -20, fontSize: 60, transform: 'rotate(-30deg)', display: { xs: 'none', sm: 'block' } }} />
              <Celebration sx={{ position: 'absolute', top: -20, right: -20, fontSize: 60, transform: 'rotate(30deg)', display: { xs: 'none', sm: 'block' } }} />
              <Celebration sx={{ position: 'absolute', bottom: -20, left: -20, fontSize: 60, transform: 'rotate(-150deg)', display: { xs: 'none', sm: 'block' } }} />
              <Celebration sx={{ position: 'absolute', bottom: -20, right: -20, fontSize: 60, transform: 'rotate(150deg)', display: { xs: 'none', sm: 'block' } }} />
              
              <Typography 
                variant="h1" 
                sx={{ 
                  mb: { xs: 1, sm: 2 }, 
                  fontWeight: 'bold',
                  textShadow: '4px 4px 8px rgba(0,0,0,0.4), 0 0 40px gold',
                  animation: `${heartbeat} 1s ease-in-out infinite`,
                  fontSize: { xs: '2.5rem', sm: '6rem' },
                }}
              >
                🎆 BOOM! 🎆
              </Typography>
              
              <Typography 
                variant="h2" 
                sx={{ 
                  mb: { xs: 1, sm: 3 },
                  textShadow: '3px 3px 6px rgba(0,0,0,0.3)',
                  fontSize: { xs: '1.5rem', sm: '3.75rem' },
                }}
              >
                🌟 {t('congratulations')} 🌟
              </Typography>
              
              <Box sx={{ my: { xs: 1, sm: 3 } }}>
                <Typography 
                  variant="h1" 
                  sx={{ 
                    fontSize: { xs: '3rem', sm: '6rem' },
                    animation: `${heartbeat} 0.8s ease-in-out infinite`,
                  }}
                >
                  😄
                </Typography>
              </Box>
              
              <Typography 
                variant="h3" 
                sx={{ 
                  mb: { xs: 1, sm: 2 },
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  fontSize: { xs: '1.2rem', sm: '3rem' },
                }}
              >
                🏆 {t('youProvedIt')} 🏆
              </Typography>
              
              <Paper 
                sx={{ 
                  p: { xs: 1, sm: 2 }, 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  borderRadius: 2,
                  mb: { xs: 1, sm: 3 },
                }}
              >
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontFamily: 'monospace',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    fontSize: { xs: '1rem', sm: '2.125rem' },
                    wordBreak: 'break-word',
                  }}
                >
                  {proofState.goal}
                </Typography>
              </Paper>
              
              <Typography variant="h5" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                ⭐ {t('logicMaster')} ⭐
              </Typography>
              
              <Typography variant="body1" sx={{ opacity: 0.8, fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                ✨ {t('clickToDismiss')} ✨
              </Typography>
            </Paper>
          </Backdrop>

          {/* Error/Success Messages */}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {/* Proof Steps */}
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, minHeight: { xs: 150, sm: 200 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{t('proofSteps')}</Typography>
              <Button
                size="small"
                onClick={handleReset}
                disabled={proofState.steps.length === 0}
                startIcon={<Refresh />}
              >
                {t('reset')}
              </Button>
            </Box>

            {proofState.steps.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {t('noStepsYet')}
              </Typography>
            ) : (
              <Box>
                {proofState.steps.map((step) => (
                  <ProofStep
                    key={step.id}
                    step={step}
                    isSelectable={step.depth === proofState.currentDepth && !proofState.isComplete}
                    isSelected={selectedSteps.includes(step.id)}
                    onToggleSelect={handleToggleStepSelection}
                    onDelete={handleDeleteStep}
                    canDelete={step.ruleKey !== RULE_KEYS.PREMISE && !proofState.isComplete}
                  />
                ))}
              </Box>
            )}

            {selectedSteps.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('selectedSteps', { count: selectedSteps.length })} {selectedSteps.join(', ')}
              </Alert>
            )}

            {proofState.currentDepth > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('inAssumption', { depth: proofState.currentDepth })}
              </Alert>
            )}

            {/* Guided Hints */}
            {showHint && !proofState.isComplete && getNextHint() && (
              <Alert 
                severity="success" 
                sx={{ mt: 2 }}
                onClose={() => setShowHint(false)}
              >
                <Typography variant="subtitle2">💡 {t('hint')}</Typography>
                <Typography variant="body2">{getNextHint()}</Typography>
              </Alert>
            )}
          </Paper>

          {/* Rule Selector */}
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <RuleSelector
              rules={applicableRules}
              onRuleSelect={handleRuleSelect}
              disabled={proofState.isComplete}
            />
          </Paper>
        </Box>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Container>
  )
}
