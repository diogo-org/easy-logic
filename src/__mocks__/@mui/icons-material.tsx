// Mock for @mui/icons-material to avoid EMFILE (too many open files) on Windows
// This provides simple mock components for all icon imports

import React from 'react'

// Create a factory function that returns a mock icon component
const createMockIcon = (name: string) => {
  const MockIcon = (props: any) => (
    <svg data-testid={`icon-${name}`} {...props}>
      <text>{name}</text>
    </svg>
  )
  MockIcon.displayName = name
  return MockIcon
}

// Export commonly used icons
export const Menu = createMockIcon('Menu')
export const Delete = createMockIcon('Delete')
export const Clear = createMockIcon('Clear')
export const ArrowBack = createMockIcon('ArrowBack')
export const Refresh = createMockIcon('Refresh')
export const HelpOutline = createMockIcon('HelpOutline')
export const Celebration = createMockIcon('Celebration')
export const Star = createMockIcon('Star')
export const AutoAwesome = createMockIcon('AutoAwesome')

// Default export for default imports
export default Menu
