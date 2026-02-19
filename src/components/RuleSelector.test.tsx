import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RuleSelector from './RuleSelector'
import { ApplicableRule } from '../logic/proof'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n/config'

describe('RuleSelector', () => {
  const mockRules: ApplicableRule[] = [
    {
      id: 'assume',
      nameKey: 'assume',
      descriptionKey: 'assumeDesc',
      applicable: true,
      category: 'assumption',
      reason: '',
      requiredSteps: 0,
    },
    {
      id: 'modus_ponens',
      nameKey: 'modusPonens',
      descriptionKey: 'modusPonensDesc',
      applicable: true,
      category: 'basic',
      reason: '',
      requiredSteps: 2,
    },
    {
      id: 'or_intro_left',
      nameKey: 'orIntroLeft',
      descriptionKey: 'orIntroLeftDesc',
      applicable: true,
      category: 'introduction',
      reason: '',
      requiredSteps: 1,
    },
  ]

  const mockOnRuleSelect = vi.fn()

  const renderComponent = () => {
    return render(
      <I18nextProvider i18n={i18n}>
        <RuleSelector rules={mockRules} onRuleSelect={mockOnRuleSelect} />
      </I18nextProvider>
    )
  }

  beforeEach(() => {
    mockOnRuleSelect.mockClear()
  })

  describe('Dialog rendering', () => {
    it('should render rule buttons', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /assume/i })).toBeInTheDocument()
    })

    it('should open dialog when rule requiring input is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /formula/i })).toBeInTheDocument()
    })

    it('should not open dialog when rule not requiring input is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      const mpButton = screen.getByRole('button', { name: /modus\s+ponens/i })
      await user.click(mpButton)

      expect(mockOnRuleSelect).toHaveBeenCalledWith('modus_ponens')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Disabled Apply button feedback', () => {
    it('should display disabled Apply button when input is empty', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const applyButton = screen.getByRole('button', { name: /apply/i })
      expect(applyButton).toBeDisabled()
      expect(applyButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should show helper text when input is empty', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      // The helper text should be visible and contain guidance
      const helperText = screen.getByText(/enter a formula/i)
      expect(helperText).toBeInTheDocument()
    })

    it('should enable Apply button when input has content', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      await user.type(inputField, 'p')

      const applyButton = screen.getByRole('button', { name: /apply/i })
      expect(applyButton).not.toBeDisabled()
      expect(applyButton).toHaveAttribute('aria-disabled', 'false')
    })

    it('should update helper text when input has content', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      await user.type(inputField, 'p')

      // Helper text should change to "Press Enter or click Apply"
      const helperText = screen.getByText(/press enter|click apply/i)
      expect(helperText).toBeInTheDocument()
    })

    it('should have aria-describedby connecting input and helper text', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const applyButton = screen.getByRole('button', { name: /apply/i })

      // MUI TextField might render aria-describedby on the input itself or a wrapper
      // Check that the helper text exists with the expected ID
      const helperText = document.getElementById('input-helper-text')
      expect(helperText).toBeInTheDocument()
      
      // The apply button should have aria-describedby
      expect(applyButton).toHaveAttribute('aria-describedby', 'input-helper-text')
    })

    it('should disable Apply button again when input is cleared', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      await user.type(inputField, 'p')

      const applyButton = screen.getByRole('button', { name: /apply/i })
      expect(applyButton).not.toBeDisabled()

      // Clear input
      await user.clear(inputField)

      expect(applyButton).toBeDisabled()
    })

    it('should ignore whitespace-only input', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      await user.type(inputField, '   ')

      const applyButton = screen.getByRole('button', { name: /apply/i })
      expect(applyButton).toBeDisabled()
    })
  })

  describe('Form interactions', () => {
    it('should call onRuleSelect when Apply is clicked with valid input', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      await user.type(inputField, 'p')

      const applyButton = screen.getByRole('button', { name: /apply/i })
      await user.click(applyButton)

      expect(mockOnRuleSelect).toHaveBeenCalledWith('assume', 'p')
      
      // Wait for dialog to close (MUI uses animations)
      await screen.findByRole('button', { name: /assume/i })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should call onRuleSelect when Enter key is pressed in input', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      await user.type(inputField, 'p{Enter}')

      expect(mockOnRuleSelect).toHaveBeenCalledWith('assume', 'p')
    })

    it('should not call onRuleSelect when Enter is pressed with empty input', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      fireEvent.keyDown(inputField, { key: 'Enter', code: 'Enter' })

      expect(mockOnRuleSelect).not.toHaveBeenCalled()
    })

    it('should close dialog when Cancel is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Wait for dialog to close (MUI uses animations)
      await screen.findByRole('button', { name: /assume/i })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should clear input when dialog is closed', async () => {
      const user = userEvent.setup()
      renderComponent()

      // First interaction
      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      const inputField = screen.getByRole('textbox', { name: /formula/i })
      await user.type(inputField, 'p')

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Wait for dialog to close
      await screen.findByRole('button', { name: /assume/i })
      
      // Second interaction - input should be cleared
      const assumeButton2 = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton2)

      const newInputField = screen.getByRole('textbox', { name: /formula/i })
      expect(newInputField).toHaveValue('')
    })
  })

  describe('Disabled rules', () => {
    it('should not open dialog for disabled rules', async () => {
      const disabledRules = [
        {
          ...mockRules[0],
          applicable: false,
          reason: 'Rule not applicable',
        },
      ]

      render(
        <I18nextProvider i18n={i18n}>
          <RuleSelector rules={disabledRules} onRuleSelect={mockOnRuleSelect} />
        </I18nextProvider>
      )

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      expect(assumeButton).toBeDisabled()

      // Disabled buttons should not allow interaction
      // No need to try clicking - just verify it's disabled
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should not apply rules when component is disabled', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <RuleSelector rules={mockRules} onRuleSelect={mockOnRuleSelect} disabled={true} />
        </I18nextProvider>
      )

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      expect(assumeButton).toBeDisabled()

      // Disabled buttons should not allow interaction
      // Verify that the button is disabled and won't trigger the callback
      expect(mockOnRuleSelect).not.toHaveBeenCalled()
    })
  })

  describe('Syntax help display', () => {
    it('should display syntax help chips in dialog', async () => {
      const user = userEvent.setup()
      renderComponent()

      const assumeButton = screen.getByRole('button', { name: /assume/i })
      await user.click(assumeButton)

      // Check for syntax help chips
      expect(screen.getByText(/~\s*\(not\)/i)).toBeInTheDocument()
      expect(screen.getByText(/\^\s*\(and\)/i)).toBeInTheDocument()
      expect(screen.getByText(/\|\s*\(or\)/i)).toBeInTheDocument()
    })
  })
})
