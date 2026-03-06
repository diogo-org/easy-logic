/**
 * Custom hook for managing proof state and actions
 * Handles ONLY proof logic - no UI concerns
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProofState, ApplicableRule, ProofStep as ProofStepType, RULE_KEYS, NaturalDeduction } from '../logic/proof'

export function useProofState(initialFormula: string, onProofComplete?: () => void) {
  const { t } = useTranslation()
  const proofSystem = useMemo(() => new NaturalDeduction(), [])

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
      if (!rule) {return}

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
        if (rule.id === 'assume' || rule.id === 'impl_intro') {
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

          // Notify parent that proof is complete (for celebration)
          if (onProofComplete) {
            onProofComplete()
          }
        }

        setProofState(newState)
        setSelectedSteps([])
        setErrorMessage(null)
      } catch (error) {
        console.error('Error applying rule:', error)
        setErrorMessage(t('errorApplyingRule'))
      }
    },
    [proofSystem, proofState, selectedSteps, t, onProofComplete]
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
      if (!step) {return}

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
        newDepth = lastStep.depth
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
    handleGoalSelect,
    handleCustomGoalSubmit,
    handleRuleSelect,
    handleToggleStepSelection,
    handleDeleteStep,
    handleReset,
  }
}
