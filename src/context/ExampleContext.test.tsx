import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { ExampleProvider, useExampleContext } from './ExampleContext'

function TestComponent() {
  const { selectedExample, setSelectedExample } = useExampleContext()

  return (
    <div>
      <p data-testid="selected-example">{selectedExample || 'none'}</p>
      <button onClick={() => setSelectedExample('p & q')}>Set Example</button>
      <button onClick={() => setSelectedExample('p | q')}>Set Different Example</button>
    </div>
  )
}

describe('ExampleContext', () => {
  it('provides initial null value', () => {
    render(
      <ExampleProvider>
        <TestComponent />
      </ExampleProvider>
    )

    expect(screen.getByTestId('selected-example')).toHaveTextContent('none')
  })

  it('updates selected example when setSelectedExample is called', async () => {
    const user = userEvent.setup()
    render(
      <ExampleProvider>
        <TestComponent />
      </ExampleProvider>
    )

    const button = screen.getByText('Set Example')
    await user.click(button)

    expect(screen.getByTestId('selected-example')).toHaveTextContent('p & q')
  })

  it('allows changing selected example multiple times', async () => {
    const user = userEvent.setup()
    render(
      <ExampleProvider>
        <TestComponent />
      </ExampleProvider>
    )

    const firstButton = screen.getByText('Set Example')
    await user.click(firstButton)
    expect(screen.getByTestId('selected-example')).toHaveTextContent('p & q')

    const secondButton = screen.getByText('Set Different Example')
    await user.click(secondButton)
    expect(screen.getByTestId('selected-example')).toHaveTextContent('p | q')
  })

  it('returns safe default when used outside provider', () => {
    render(<TestComponent />)

    // Should not crash and should show initial value
    expect(screen.getByTestId('selected-example')).toHaveTextContent('none')
  })

  it('does not crash when setSelectedExample is called outside provider', async () => {
    const user = userEvent.setup()
    render(<TestComponent />)

    const button = screen.getByText('Set Example')
    await user.click(button)

    // Should not crash, but value should not change
    expect(screen.getByTestId('selected-example')).toHaveTextContent('none')
  })

  it('shares state between multiple consumers', async () => {
    const user = userEvent.setup()
    
    function ConsumerA() {
      const { selectedExample, setSelectedExample } = useExampleContext()
      return (
        <div>
          <p data-testid="consumer-a">{selectedExample || 'none'}</p>
          <button onClick={() => setSelectedExample('from A')}>Update from A</button>
        </div>
      )
    }

    function ConsumerB() {
      const { selectedExample } = useExampleContext()
      return <p data-testid="consumer-b">{selectedExample || 'none'}</p>
    }

    render(
      <ExampleProvider>
        <ConsumerA />
        <ConsumerB />
      </ExampleProvider>
    )

    expect(screen.getByTestId('consumer-a')).toHaveTextContent('none')
    expect(screen.getByTestId('consumer-b')).toHaveTextContent('none')

    const button = screen.getByText('Update from A')
    await user.click(button)

    expect(screen.getByTestId('consumer-a')).toHaveTextContent('from A')
    expect(screen.getByTestId('consumer-b')).toHaveTextContent('from A')
  })

  it('handles empty string as valid value', async () => {
    const user = userEvent.setup()
    
    function TestEmptyString() {
      const { selectedExample, setSelectedExample } = useExampleContext()
      return (
        <div>
          <p data-testid="value">{selectedExample === '' ? 'empty' : selectedExample || 'null'}</p>
          <button onClick={() => setSelectedExample('')}>Set Empty</button>
        </div>
      )
    }

    render(
      <ExampleProvider>
        <TestEmptyString />
      </ExampleProvider>
    )

    expect(screen.getByTestId('value')).toHaveTextContent('null')

    const button = screen.getByText('Set Empty')
    await user.click(button)

    expect(screen.getByTestId('value')).toHaveTextContent('empty')
  })

  it('preserves context value across re-renders', async () => {
    const user = userEvent.setup()
    
    function TestRerender() {
      const { selectedExample, setSelectedExample } = useExampleContext()
      const [counter, setCounter] = useState(0)
      
      return (
        <div>
          <p data-testid="example">{selectedExample || 'none'}</p>
          <p data-testid="counter">{counter}</p>
          <button onClick={() => setSelectedExample('test')}>Set Example</button>
          <button onClick={() => setCounter(c => c + 1)}>Increment</button>
        </div>
      )
    }

    render(
      <ExampleProvider>
        <TestRerender />
      </ExampleProvider>
    )

    const setButton = screen.getByText('Set Example')
    await user.click(setButton)
    expect(screen.getByTestId('example')).toHaveTextContent('test')

    const incrementButton = screen.getByText('Increment')
    await user.click(incrementButton)
    expect(screen.getByTestId('counter')).toHaveTextContent('1')
    expect(screen.getByTestId('example')).toHaveTextContent('test')
  })
})
