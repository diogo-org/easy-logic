interface Example {
  label: string
  labelKey: string
  formula: string
  description: string
  descriptionKey: string
}

export const EXAMPLES: Example[] = [
  {
    label: 'Simple Variable',
    labelKey: 'simpleVariable',
    formula: 'p',
    description: 'A single proposition',
    descriptionKey: 'simpleVariableDesc',
  },
  {
    label: 'Negation',
    labelKey: 'negation',
    formula: '~p',
    description: 'NOT operator (¬)',
    descriptionKey: 'negationDesc',
  },
  {
    label: 'AND',
    labelKey: 'and',
    formula: 'p ^ q',
    description: 'Conjunction (∧)',
    descriptionKey: 'andDesc',
  },
  {
    label: 'OR',
    labelKey: 'or',
    formula: 'p | q',
    description: 'Disjunction (∨)',
    descriptionKey: 'orDesc',
  },
  {
    label: 'Implication',
    labelKey: 'implication',
    formula: 'p -> q',
    description: 'If-then (→)',
    descriptionKey: 'implicationDesc',
  },
  {
    label: 'Biconditional',
    labelKey: 'biconditional',
    formula: 'p <-> q',
    description: 'If and only if (↔)',
    descriptionKey: 'biconditionalDesc',
  },
  {
    label: 'Operator Precedence',
    labelKey: 'operatorPrecedence',
    formula: 'p | q ^ r',
    description: 'Shows AND > OR (same as p | (q ^ r))',
    descriptionKey: 'operatorPrecedenceDesc',
  },
  {
    label: 'Complex Precedence',
    labelKey: 'complexPrecedence',
    formula: '~p ^ q | r',
    description: 'Shows NOT > AND > OR precedence',
    descriptionKey: 'complexPrecedenceDesc',
  },
  {
    label: 'Override Precedence',
    labelKey: 'overridePrecedence',
    formula: '(p | q) ^ r',
    description: 'Parentheses override precedence',
    descriptionKey: 'overridePrecedenceDesc',
  },
  {
    label: 'Tautology',
    labelKey: 'tautology',
    formula: 'p | ~p',
    description: 'Always true (law of excluded middle)',
    descriptionKey: 'tautologyDesc',
  },
  {
    label: 'Contradiction',
    labelKey: 'contradiction',
    formula: 'p ^ ~p',
    description: 'Always false',
    descriptionKey: 'contradictionDesc',
  },
  {
    label: 'De Morgan\'s Law',
    labelKey: 'deMorgansLaw',
    formula: '~(p ^ q) <-> (~p | ~q)',
    description: 'NOT (AND) = (NOT) OR (NOT)',
    descriptionKey: 'deMorgansLawDesc',
  },
  {
    label: 'Transitive Property',
    labelKey: 'transitiveProperty',
    formula: '(p -> q) ^ (q -> r) -> (p -> r)',
    description: 'If p→q and q→r, then p→r',
    descriptionKey: 'transitivePropertyDesc',
  },
  {
    label: 'Modus Ponens',
    labelKey: 'modusPonens',
    formula: '(p -> q) ^ p -> q',
    description: 'If p→q and p, then q',
    descriptionKey: 'modusPonensDesc',
  },
  {
    label: 'Complex Formula',
    labelKey: 'complexFormula',
    formula: '((p ^ q) | (r ^ s)) -> ((t | u) <-> (p ^ r))',
    description: 'Large formula with 6 variables',
    descriptionKey: 'complexFormulaDesc',
  },
]
