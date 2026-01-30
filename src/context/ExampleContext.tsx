import { createContext, useContext, useState, ReactNode } from 'react'

interface ExampleContextType {
  selectedExample: string | null
  setSelectedExample: (formula: string) => void
}

const ExampleContext = createContext<ExampleContextType | undefined>(undefined)

export function ExampleProvider({ children }: { children: ReactNode }) {
  const [selectedExample, setSelectedExample] = useState<string | null>(null)

  return (
    <ExampleContext.Provider value={{ selectedExample, setSelectedExample }}>
      {children}
    </ExampleContext.Provider>
  )
}

export function useExampleContext() {
  const context = useContext(ExampleContext)
  if (!context) {
    // Return a safe default for testing or when provider is missing
    return {
      selectedExample: null,
      setSelectedExample: () => {},
    }
  }
  return context
}
