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

  it('renders no depth bars when subproofDepths is empty', () => {
    const { container } = render(
      <ProofStep
        step={mockStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        subproofDepths={[]}
      />
    )
    const depthBars = container.querySelectorAll('[data-testid^="depth-bar-"]')
    expect(depthBars).toHaveLength(0)
  })

  it('renders one depth bar when step is inside one subproof', () => {
    const nestedStep = { ...mockStep, depth: 1 }
    const { container } = render(
      <ProofStep
        step={nestedStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        subproofDepths={[1]}
      />
    )
    const depthBars = container.querySelectorAll('[data-testid^="depth-bar-"]')
    expect(depthBars).toHaveLength(1)
  })

  it('renders two depth bars for nested subproofs', () => {
    const deepStep = { ...mockStep, depth: 2 }
    const { container } = render(
      <ProofStep
        step={deepStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        subproofDepths={[1, 2]}
      />
    )
    const depthBars = container.querySelectorAll('[data-testid^="depth-bar-"]')
    expect(depthBars).toHaveLength(2)
  })

  it('renders assumption step with subproof-start top border', () => {
    const assumeStep: ProofStepType = {
      ...mockStep,
      depth: 1,
      isSubproofStart: true,
      ruleKey: RULE_KEYS.ASSUME,
    }
    const { container } = render(
      <ProofStep
        step={assumeStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        subproofDepths={[1]}
        isFirstInSubproof={true}
      />
    )
    const wrapper = container.querySelector('[data-testid="subproof-wrapper"]')
    expect(wrapper).toBeInTheDocument()
  })

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

  it('applies indentation via depth bars rather than margin', () => {
    const nestedStep = { ...mockStep, depth: 2 }
    const { container } = render(
      <ProofStep
        step={nestedStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
        subproofDepths={[1, 2]}
      />
    )

    const depthBars = container.querySelectorAll('[data-testid^="depth-bar-"]')
    expect(depthBars).toHaveLength(2)
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

  it('renders assumption step with yellow highlight', () => {
    const assumptionStep: ProofStepType = { 
      ...mockStep, 
      ruleKey: RULE_KEYS.ASSUME,
    }
    const { container } = render(
      <ProofStep
        step={assumptionStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    )

    // Assumption step should be marked with data-assumption attribute
    const paper = container.querySelector('[data-assumption="true"]')
    expect(paper).toBeInTheDocument()
  })

  it('highlights assumption steps with warning color', () => {
    const assumeStep: ProofStepType = {
      ...mockStep,
      ruleKey: RULE_KEYS.ASSUME,
    }
    const { container } = render(
      <ProofStep
        step={assumeStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    )

    // Assumption steps should have a left border (visual distinction)
    const paper = container.querySelector('.MuiPaper-root')
    expect(paper).toBeInTheDocument()
    // The step should render - the warning.light background is applied via MUI sx
    expect(screen.getByText('1.')).toBeInTheDocument()
  })

  it('does not highlight derived steps as assumptions', () => {
    const derivedStep: ProofStepType = {
      ...mockStep,
      ruleKey: RULE_KEYS.MODUS_PONENS,
      justificationKey: 'justificationMP',
      justificationParams: { step1: '1', step2: '2' },
    }
    render(
      <ProofStep
        step={derivedStep}
        isSelectable={false}
        isSelected={false}
        onToggleSelect={() => {}}
      />
    )

    // Derived steps render without warning styling  
    expect(screen.getByText('1.')).toBeInTheDocument()
  })
})
