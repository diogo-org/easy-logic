/**
 * Custom hook for managing proof state and actions
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ProofState, ApplicableRule, ProofStep as ProofStepType, RULE_KEYS } from '../logic/proof'
import { NaturalDeduction } from '../logic/proof'
import { confettiColors, shapes } from '../constants/animations'
import { CELEBRATION, ANIMATION_MS } from '../constants/ui'

export function useProofState(initialFormula: string) {
  const { t } = useTranslation()
  const proofSystem = new NaturalDeduction()

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

  // Generate EPIC confetti pieces
  const generateConfetti = useCallback(() => {
    return Array.from({ length: CELEBRATION.CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * CELEBRATION.SCALE_PERCENT,
      delay: Math.random() * CELEBRATION.MAX_DELAY_S,
      duration:
        CELEBRATION.MIN_DURATION_S +
        Math.random() * CELEBRATION.MAX_DURATION_EXTRA_S,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size:
        CELEBRATION.CONFETTI_SIZE_MIN +
        Math.random() * CELEBRATION.CONFETTI_SIZE_RANGE,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * CELEBRATION.FULL_ROTATION_DEG,
    }))
  }, [])

  // Generate fireworks
  const generateFireworks = useCallback(() => {
    return Array.from({ length: CELEBRATION.FIREWORK_COUNT }, (_, i) => ({
      id: i,
      left:
        CELEBRATION.MIN_POSITION_PERCENT +
        Math.random() * CELEBRATION.MAX_X_POSITION_PERCENT,
      top:
        CELEBRATION.MIN_POSITION_PERCENT +
        Math.random() * CELEBRATION.MAX_Y_POSITION_PERCENT,
      delay: Math.random() * CELEBRATION.FIREWORK_DELAY_S,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size:
        CELEBRATION.FIREWORK_SIZE_MIN +
        Math.random() * CELEBRATION.FIREWORK_SIZE_RANGE,
    }))
  }, [])

  // Generate floating emojis
  const generateFloatingEmojis = useCallback(() => {
    const emojis = [
      '🎉',
      '🎊',
      '🌟',
      '⭐',
      '✨',
      '💫',
      '🎆',
      '🎇',
      '🏆',
      '👏',
      '🙌',
      '💯',
      '🔥',
      '💪',
    ]
    return Array.from({ length: CELEBRATION.FLOATING_EMOJI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * CELEBRATION.SCALE_PERCENT,
      bottom: Math.random() * CELEBRATION.MAX_BOTTOM_PERCENT,
      delay: Math.random() * CELEBRATION.MAX_DELAY_S,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      size:
        CELEBRATION.EMOJI_SIZE_MIN +
        Math.random() * CELEBRATION.EMOJI_SIZE_RANGE,
    }))
  }, [])

  const [confetti, setConfetti] = useState(generateConfetti())
  const [fireworks, setFireworks] = useState(generateFireworks())
  const [floatingEmojis, setFloatingEmojis] = useState(generateFloatingEmojis())

  // Update applicable rules whenever proof state changes
  useEffect(() => {
    if (proofState.goal) {
      const rules = proofSystem.getRules()
      const applicable = rules.map((rule) =>
        proofSystem.checkApplicability(rule, proofState)
      )
      setApplicableRules(applicable)
    }
  }, [proofState, proofSystem])

  const handleGoalSelect = useCallback(
    (formula: string, kbId?: string) => {
      const kb = kbId
        ? proofSystem.getKnowledgeBases().find((k) => k.id === kbId)
        : proofSystem.getKnowledgeBases().find((k) => k.id === selectedKB)
      const kbPremises = kb?.premises || []

      const premiseSteps: ProofStepType[] = kbPremises.map(
        (premise, index) => ({
          id: index + 1,
          lineNumber: String(index + 1),
          formula: premise,
          ruleKey: RULE_KEYS.PREMISE,
          dependencies: [],
          justificationKey: 'justificationPremise',
          depth: 0,
        })
      )

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
      setSelectedSteps([])
      setShowHint(true)
    },
    [proofSystem, selectedKB]
  )

  const handleCustomGoalSubmit = useCallback(() => {
    if (customGoal.trim()) {
      handleGoalSelect(customGoal.trim())
    }
  }, [customGoal, handleGoalSelect])

  const handleRuleSelect = useCallback(
    (ruleId: string, userInput?: string) => {
      const rule = proofSystem.getRules().find((r) => r.id === ruleId)
      if (!rule) return

      try {
        const newStep = proofSystem.applyRule(
          rule,
          proofState,
          selectedSteps,
          userInput
        )

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

          // Auto-hide celebration after 6 seconds
          setTimeout(
            () => setShowCelebration(false),
            ANIMATION_MS.SLOW
          )
        }

        setProofState(newState)
        setSelectedSteps([])
        setErrorMessage(null)
      } catch (error) {
        console.error('Error applying rule:', error)
        setErrorMessage(t('errorApplyingRule'))
      }
    },
    [
      proofSystem,
      proofState,
      selectedSteps,
      t,
      generateConfetti,
      generateFireworks,
      generateFloatingEmojis,
    ]
  )

  const handleToggleStepSelection = useCallback((stepId: number) => {
    setSelectedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    )
  }, [])

  const handleDeleteStep = useCallback(
    (stepId: number) => {
      const step = proofState.steps.find((s) => s.id === stepId)
      if (!step) return

      // Don't allow deleting premises
      if (step.ruleKey === RULE_KEYS.PREMISE) {
        setErrorMessage(t('cannotDeletePremise'))
        return
      }

      // Check if any other steps depend on this one
      const dependentSteps = proofState.steps.filter((s) =>
        s.dependencies.includes(stepId)
      )
      if (dependentSteps.length > 0) {
        setErrorMessage(t('cannotDeleteDependency'))
        return
      }

      // Find all steps that should be deleted
      const stepIndex = proofState.steps.findIndex((s) => s.id === stepId)
      const stepsToKeep = proofState.steps.slice(0, stepIndex)

      // Recalculate current depth
      let newDepth = 0
      if (stepsToKeep.length > 0) {
        const lastStep = stepsToKeep[stepsToKeep.length - 1]
        newDepth =
          lastStep.ruleKey === RULE_KEYS.ASSUME
            ? lastStep.depth
            : lastStep.depth
      }

      setProofState({
        ...proofState,
        steps: stepsToKeep,
        currentDepth: newDepth,
        currentSubproofId: proofState.currentSubproofId,
        nextStepInSubproof: proofState.nextStepInSubproof,
        isComplete: false,
      })
      setSelectedSteps(selectedSteps.filter((id) => id < stepId))
      setSuccessMessage(t('stepDeleted'))
      setErrorMessage(null)
    },
    [proofState, selectedSteps, t]
  )

  const handleReset = useCallback(() => {
    setGoalDialogOpen(true)
    setCustomGoal('')
    setSelectedKB('empty')
    setProofState({
      goal: '',
      premises: [],
      steps: [],
      currentDepth: 0,
      currentSubproofId: '',
      nextStepInSubproof: [1],
      isComplete: false,
    })
    setSelectedSteps([])
    setErrorMessage(null)
    setSuccessMessage(null)
    setShowHint(true)
    setShowCelebration(false)
  }, [])

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false)
  }, [])

  return {
    proofSystem,
    goalDialogOpen,
    setGoalDialogOpen,
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
  }
}
