import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProofStep from './ProofStep'
import { ProofStep as ProofStepType, RULE_KEYS } from '../logic/proof'

describe('ProofStep', () => {
  const mockStep: ProofStepType = {
    id: 1,
    lineNumber: '1',
    formula: 'p',
    ruleKey: RULE_KEYS.ASSUME,
    dependencies: [],
    justificationKey: 'justificationAssumption',
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

  it('shows delete button when canDelete is true', () => {
    render(
      <ProofStep
        step={mockStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        onDelete={() => {}}
        canDelete={true}
      />
    )

    expect(screen.getByLabelText('Delete step')).toBeInTheDocument()
  })

  it('does not show delete button when canDelete is false', () => {
    render(
      <ProofStep
        step={mockStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        onDelete={() => {}}
        canDelete={false}
      />
    )

    expect(screen.queryByLabelText('Delete step')).not.toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn()
    render(
      <ProofStep
        step={mockStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        onDelete={mockOnDelete}
        canDelete={true}
      />
    )

    fireEvent.click(screen.getByLabelText('Delete step'))
    expect(mockOnDelete).toHaveBeenCalledWith(1)
  })

  it('renders branch start step', () => {
    const branchStep: ProofStepType = { 
      ...mockStep, 
      ruleKey: RULE_KEYS.OR_ELIM,
    }
    render(
      <ProofStep
        step={branchStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    )

    // Branch start step renders correctly
    expect(screen.getByText('1.')).toBeInTheDocument()
  })
})
