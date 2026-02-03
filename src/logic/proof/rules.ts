/**
 * Natural Deduction proof rules configuration
 * Defines all available inference rules with metadata
 */

import { Rule } from './types'

export const naturalDeductionRules: Rule[] = [
  {
    id: 'assume',
    nameKey: 'ruleAssume',
    descriptionKey: 'ruleAssumeDesc',
    category: 'assumption',
    requiredSteps: 0,
  },
  {
    id: 'mp',
    nameKey: 'ruleModusPonens',
    descriptionKey: 'ruleModusPonensDesc',
    category: 'basic',
    requiredSteps: 2,
  },
  {
    id: 'mt',
    nameKey: 'ruleModusTollens',
    descriptionKey: 'ruleModusTollensDesc',
    category: 'basic',
    requiredSteps: 2,
  },
  {
    id: 'and_intro',
    nameKey: 'ruleAndIntro',
    descriptionKey: 'ruleAndIntroDesc',
    category: 'introduction',
    requiredSteps: 2,
  },
  {
    id: 'and_elim_left',
    nameKey: 'ruleAndElimLeft',
    descriptionKey: 'ruleAndElimLeftDesc',
    category: 'elimination',
    requiredSteps: 1,
  },
  {
    id: 'and_elim_right',
    nameKey: 'ruleAndElimRight',
    descriptionKey: 'ruleAndElimRightDesc',
    category: 'elimination',
    requiredSteps: 1,
  },
  {
    id: 'or_intro_left',
    nameKey: 'ruleOrIntroLeft',
    descriptionKey: 'ruleOrIntroLeftDesc',
    category: 'introduction',
    requiredSteps: 1,
  },
  {
    id: 'or_intro_right',
    nameKey: 'ruleOrIntroRight',
    descriptionKey: 'ruleOrIntroRightDesc',
    category: 'introduction',
    requiredSteps: 1,
  },
  {
    id: 'double_neg',
    nameKey: 'ruleDoubleNeg',
    descriptionKey: 'ruleDoubleNegDesc',
    category: 'basic',
    requiredSteps: 1,
  },
  {
    id: 'impl_intro',
    nameKey: 'ruleImplIntro',
    descriptionKey: 'ruleImplIntroDesc',
    category: 'introduction',
    requiredSteps: 1,
  },
  {
    id: 'or_elim',
    nameKey: 'ruleOrElim',
    descriptionKey: 'ruleOrElimDesc',
    category: 'elimination',
    requiredSteps: 1,
  },
  {
    id: 'lem',
    nameKey: 'ruleLEM',
    descriptionKey: 'ruleLEMDesc',
    category: 'basic',
    requiredSteps: 0,
  },
]
