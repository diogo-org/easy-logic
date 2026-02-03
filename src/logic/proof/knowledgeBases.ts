/**
 * Knowledge base configurations for Natural Deduction
 * Contains pre-configured premise sets with suggested goals
 */

import { KnowledgeBase } from './types'

export const knowledgeBases: KnowledgeBase[] = [
  {
    id: 'empty',
    nameKey: 'kbEmpty',
    descriptionKey: 'kbEmptyDesc',
    premises: [],
    suggestedGoals: [
      {
        labelKey: 'goalIdentity',
        formula: 'p -> p',
        descriptionKey: 'goalIdentityDesc',
      },
    ],
  },
  {
    id: 'modus-ponens',
    nameKey: 'kbModusPonens',
    descriptionKey: 'kbModusPonensDesc',
    premises: ['p', 'p -> q'],
    suggestedGoals: [
      {
        labelKey: 'goalDeriveQ',
        formula: 'q',
        descriptionKey: 'goalDeriveQDesc',
      },
    ],
  },
  {
    id: 'conjunction',
    nameKey: 'kbConjunction',
    descriptionKey: 'kbConjunctionDesc',
    premises: ['p', 'q'],
    suggestedGoals: [
      {
        labelKey: 'goalCombineAnd',
        formula: 'p ^ q',
        descriptionKey: 'goalCombineAndDesc',
      },
      {
        labelKey: 'goalCommutative',
        formula: 'q ^ p',
        descriptionKey: 'goalCommutativeDesc',
      },
    ],
  },
  {
    id: 'disjunction',
    nameKey: 'kbDisjunction',
    descriptionKey: 'kbDisjunctionDesc',
    premises: ['p'],
    suggestedGoals: [
      {
        labelKey: 'goalAddOr',
        formula: 'p | q',
        descriptionKey: 'goalAddOrDesc',
      },
    ],
  },
  {
    id: 'syllogism',
    nameKey: 'kbSyllogism',
    descriptionKey: 'kbSyllogismDesc',
    premises: ['p', 'p -> q', 'q -> r'],
    suggestedGoals: [
      {
        labelKey: 'goalDeriveR',
        formula: 'r',
        descriptionKey: 'goalDeriveRDesc',
      },
      {
        labelKey: 'goalDirectImpl',
        formula: 'p -> r',
        descriptionKey: 'goalDirectImplDesc',
      },
    ],
  },
  {
    id: 'elimination',
    nameKey: 'kbElimination',
    descriptionKey: 'kbEliminationDesc',
    premises: ['p ^ q'],
    suggestedGoals: [
      {
        labelKey: 'goalExtractLeft',
        formula: 'p',
        descriptionKey: 'goalExtractLeftDesc',
      },
      {
        labelKey: 'goalExtractRight',
        formula: 'q',
        descriptionKey: 'goalExtractRightDesc',
      },
    ],
  },
]
