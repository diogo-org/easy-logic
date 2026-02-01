/**
 * Proof Assistant Page - Manual proof construction using Natural Deduction
 */

import { useState, useEffect, useCallback } from 'react'
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
  keyframes,
  Backdrop,
} from '@mui/material'
import { ArrowBack, Refresh, HelpOutline, Celebration, Star, AutoAwesome } from '@mui/icons-material'
import { CELEBRATION, ANIMATION_MS, PROOF_HINT_STEPS } from '../constants/ui'

// 🎆 EPIC CELEBRATION ANIMATIONS 🎆

// Confetti falling with spinning
const confettiFall = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(1080deg) scale(0.5);
    opacity: 0;
  }
`

// Stars twinkling
const twinkle = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
`

// Pulse heartbeat
const heartbeat = keyframes`
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.15); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
`

// Shake the screen!
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
`

// Firework burst
const fireworkBurst = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
`

// Rainbow color cycle
const rainbowGlow = keyframes`
  0% { filter: hue-rotate(0deg) drop-shadow(0 0 20px gold); }
  100% { filter: hue-rotate(360deg) drop-shadow(0 0 40px gold); }
`

// Big bang entrance
const bounceIn = keyframes`
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(5deg); }
  70% { transform: scale(0.9) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`

// Float up
const floatUp = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
`

const confettiColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00', '#ff0088', '#00ff88', '#gold', '#silver']
const shapes = ['●', '■', '▲', '★', '♦', '♥', '✦', '✧']
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProofState, ApplicableRule, ProofStep as ProofStepType, RULE_KEYS } from '../logic/proof'
import { NaturalDeduction } from '../logic/proof'
import ProofStep from '../components/ProofStep'
import RuleSelector from '../components/RuleSelector'

export default function ProofAssistantPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const proofSystem = new NaturalDeduction()

  // Check if a formula was passed from navigation state
  const initialFormula = (location.state as { formula?: string })?.formula || ''

  const [goalDialogOpen, setGoalDialogOpen] = useState(!initialFormula)
  const [customGoal, setCustomGoal] = useState('')
  const [selectedKB, setSelectedKB] = useState<string>('empty')
  const [proofState, setProofState] = useState<ProofState>({
    goal: initialFormula,
    premises: [],
    steps: [],
    currentDepth: 0,
    currentSubproofId: '',
    nextStepInSubproof: [1],
    isComplete: false,
  })
  const [selectedSteps, setSelectedSteps] = useState<number[]>([])
  const [applicableRules, setApplicableRules] = useState<ApplicableRule[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)

  // Generate EPIC confetti pieces - MORE OF THEM!
  const generateConfetti = useCallback(() => {
    return Array.from({ length: CELEBRATION.CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * CELEBRATION.SCALE_PERCENT,
      delay: Math.random() * CELEBRATION.MAX_DELAY_S,
      duration: CELEBRATION.MIN_DURATION_S + Math.random() * CELEBRATION.MAX_DURATION_EXTRA_S,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: CELEBRATION.CONFETTI_SIZE_MIN + Math.random() * CELEBRATION.CONFETTI_SIZE_RANGE,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * CELEBRATION.FULL_ROTATION_DEG,
    }))
  }, [])

  // Generate fireworks
  const generateFireworks = useCallback(() => {
    return Array.from({ length: CELEBRATION.FIREWORK_COUNT }, (_, i) => ({
      id: i,
      left: CELEBRATION.MIN_POSITION_PERCENT + Math.random() * CELEBRATION.MAX_X_POSITION_PERCENT,
      top: CELEBRATION.MIN_POSITION_PERCENT + Math.random() * CELEBRATION.MAX_Y_POSITION_PERCENT,
      delay: Math.random() * CELEBRATION.FIREWORK_DELAY_S,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: CELEBRATION.FIREWORK_SIZE_MIN + Math.random() * CELEBRATION.FIREWORK_SIZE_RANGE,
    }))
  }, [])

  // Generate floating emojis
  const generateFloatingEmojis = useCallback(() => {
    const emojis = ['🎉', '🎊', '🌟', '⭐', '✨', '💫', '🎆', '🎇', '🏆', '👏', '🙌', '💯', '🔥', '💪']
    return Array.from({ length: CELEBRATION.FLOATING_EMOJI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * CELEBRATION.SCALE_PERCENT,
      bottom: Math.random() * CELEBRATION.MAX_BOTTOM_PERCENT,
      delay: Math.random() * CELEBRATION.MAX_DELAY_S,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size: CELEBRATION.EMOJI_SIZE_MIN + Math.random() * CELEBRATION.EMOJI_SIZE_RANGE,
    }))
  }, [])

  const [confetti, setConfetti] = useState(generateConfetti())
  const [fireworks, setFireworks] = useState(generateFireworks())
  const [floatingEmojis, setFloatingEmojis] = useState(generateFloatingEmojis())

  // Update applicable rules whenever proof state changes
  useEffect(() => {
    if (proofState.goal) {
      const rules = proofSystem.getRules()
      const applicable = rules.map((rule) => proofSystem.checkApplicability(rule, proofState))
      setApplicableRules(applicable)
    }
  }, [proofState])

  const handleGoalSelect = (formula: string, kbId?: string) => {
    const kb = kbId ? proofSystem.getKnowledgeBases().find(k => k.id === kbId) : 
                      proofSystem.getKnowledgeBases().find(k => k.id === selectedKB)
    const kbPremises = kb?.premises || []
    
    const premiseSteps: ProofStepType[] = kbPremises.map((premise, index) => ({
      id: index + 1,
      lineNumber: String(index + 1),
      formula: premise,
      ruleKey: RULE_KEYS.PREMISE,
      dependencies: [],
      justificationKey: 'justificationPremise',
      depth: 0,
    }))

    setProofState({
      goal: formula,
      premises: kbPremises,
      steps: premiseSteps,
      currentDepth: 0,
      currentSubproofId: '',
      nextStepInSubproof: [premiseSteps.length + 1],
      isComplete: false,
    })
    setGoalDialogOpen(false)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleCustomGoalSubmit = () => {
    if (customGoal.trim()) {
      handleGoalSelect(customGoal.trim())
    }
  }

  const handleRuleSelect = (ruleId: string, userInput?: string) => {
    const rule = proofSystem.getRules().find((r) => r.id === ruleId)
    if (!rule) return

    try {
      const newStep = proofSystem.applyRule(rule, proofState, selectedSteps, userInput)

      if (!newStep) {
        setErrorMessage(t('couldNotApplyRule'))
        return
      }

      const newSteps = [...proofState.steps, newStep]
      let newDepth = proofState.currentDepth

      // Update depth based on rule
      if (rule.id === 'assume') {
        newDepth = newStep.depth
      } else if (rule.id === 'impl_intro') {
        newDepth = newStep.depth
      }

      const newState = {
        ...proofState,
        steps: newSteps,
        currentDepth: newDepth,
        isComplete: false,
      }

      // Check if proof is complete
      if (proofSystem.validateProof(newState)) {
        newState.isComplete = true
        setSuccessMessage(t('proofCompleteMessage'))
        
        // 🎆 TRIGGER THE BIG BANG! 🎆
        setShowCelebration(true)
        setConfetti(generateConfetti())
        setFireworks(generateFireworks())
        setFloatingEmojis(generateFloatingEmojis())
        
        // Phase 2: More fireworks after 1 second
        setTimeout(() => {
          setFireworks(generateFireworks())
        }, ANIMATION_MS.FAST)
        
        // Phase 3: Even more after 2 seconds
        setTimeout(() => {
          setConfetti(generateConfetti())
        }, ANIMATION_MS.MEDIUM)
        
        // Auto-hide celebration after 6 seconds (more time to enjoy!)
        setTimeout(() => setShowCelebration(false), ANIMATION_MS.SLOW)
      }

      setProofState(newState)
      setSelectedSteps([])
      setErrorMessage(null)
    } catch (error) {
      console.error('Error applying rule:', error)
      setErrorMessage(t('errorApplyingRule'))
    }
  }

  const handleToggleStepSelection = (stepId: number) => {
    setSelectedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]
    )
  }

  const handleDeleteStep = (stepId: number) => {
    const step = proofState.steps.find(s => s.id === stepId)
    if (!step) return

    // Don't allow deleting premises
    if (step.ruleKey === RULE_KEYS.PREMISE) {
      setErrorMessage(t('cannotDeletePremise'))
      return
    }

    // Check if any other steps depend on this one
    const dependentSteps = proofState.steps.filter(s => 
      s.dependencies.includes(stepId)
    )
    if (dependentSteps.length > 0) {
      setErrorMessage(t('cannotDeleteDependency'))
      return
    }

    // Find all steps that should be deleted (this step and any steps after it at same or higher depth)
    const stepIndex = proofState.steps.findIndex(s => s.id === stepId)
    const stepsToKeep = proofState.steps.slice(0, stepIndex)
    
    // Recalculate current depth based on remaining steps
    let newDepth = 0
    if (stepsToKeep.length > 0) {
      const lastStep = stepsToKeep[stepsToKeep.length - 1]
      newDepth = lastStep.ruleKey === RULE_KEYS.ASSUME ? lastStep.depth : lastStep.depth
    }

    setProofState({
      ...proofState,
      steps: stepsToKeep,
      currentDepth: newDepth,
      currentSubproofId: proofState.currentSubproofId,
      nextStepInSubproof: proofState.nextStepInSubproof,
      isComplete: false,
    })
    setSelectedSteps(selectedSteps.filter(id => id < stepId))
    setSuccessMessage(t('stepDeleted'))
    setErrorMessage(null)
  }

  const handleReset = () => {
    const premiseSteps: ProofStepType[] = proofState.premises.map((premise, index) => ({
      id: index + 1,
      lineNumber: String(index + 1),
      formula: premise,
      ruleKey: RULE_KEYS.PREMISE,
      dependencies: [],
      justificationKey: 'justificationPremise',
      depth: 0,
    }))

    setProofState({
      goal: proofState.goal,
      premises: proofState.premises,
      steps: premiseSteps,
      currentDepth: 0,
      currentSubproofId: '',
      nextStepInSubproof: [premiseSteps.length + 1],
      isComplete: false,
    })
    setSelectedSteps([])
    setErrorMessage(null)
    setSuccessMessage(null)
  }

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
            onClick={() => setShowCelebration(false)}
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
