interface Example {
  label: string
  formula: string
  description: string
}

export const EXAMPLES: Example[] = [
  {
    label: 'Simple Variable',
    formula: 'p',
    description: 'A single proposition',
  },
  {
    label: 'Negation',
    formula: '~p',
    description: 'NOT operator (¬)',
  },
  {
    label: 'AND',
    formula: 'p ^ q',
    description: 'Conjunction (∧)',
  },
  {
    label: 'OR',
    formula: 'p | q',
    description: 'Disjunction (∨)',
  },
  {
    label: 'Implication',
    formula: 'p -> q',
    description: 'If-then (→)',
  },
  {
    label: 'Biconditional',
    formula: 'p <-> q',
    description: 'If and only if (↔)',
  },
  {
    label: 'Operator Precedence',
    formula: 'p | q ^ r',
    description: 'Shows AND > OR (same as p | (q ^ r))',
  },
  {
    label: 'Complex Precedence',
    formula: '~p ^ q | r',
    description: 'Shows NOT > AND > OR precedence',
  },
  {
    label: 'Override Precedence',
    formula: '(p | q) ^ r',
    description: 'Parentheses override precedence',
  },
  {
    label: 'Tautology',
    formula: 'p | ~p',
    description: 'Always true (law of excluded middle)',
  },
  {
    label: 'Contradiction',
    formula: 'p ^ ~p',
    description: 'Always false',
  },
  {
    label: 'De Morgan\'s Law',
    formula: '~(p ^ q) <-> (~p | ~q)',
    description: 'NOT (AND) = (NOT) OR (NOT)',
  },
  {
    label: 'Transitive Property',
    formula: '(p -> q) ^ (q -> r) -> (p -> r)',
    description: 'If p→q and q→r, then p→r',
  },
  {
    label: 'Modus Ponens',
    formula: '(p -> q) ^ p -> q',
    description: 'If p→q and p, then q',
  },
]
