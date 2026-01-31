import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProofStep from './ProofStep'
import { ProofStep as ProofStepType } from '../types/proof'

describe('ProofStep', () => {
  const mockStep: ProofStepType = {
    id: 1,
    formula: 'p',
    rule: 'Assume',
    dependencies: [],
    justification: 'Assumption',
    depth: 0,
  }

  it('renders step number and formula', () => {
    render(
      <ProofStep
        step={mockStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    )

    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('Assumption')).toBeInTheDocument()
  })

  it('shows checkbox when selectable', () => {
    const { container } = render(
      <ProofStep
        step={mockStep}
        isSelectable={true}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    )

    const checkbox = container.querySelector('input[type="checkbox"]')
    expect(checkbox).toBeInTheDocument()
  })

  it('applies indentation based on depth', () => {
    const nestedStep = { ...mockStep, depth: 2 }
    const { container } = render(
      <ProofStep
        step={nestedStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    )

    const paper = container.querySelector('.MuiPaper-root')
    expect(paper).toHaveStyle({ marginLeft: '32px' }) // 2 * 16px (reduced for responsive design)
  })
})
