declare module 'react-katex' {
  import { ReactNode } from 'react'

  interface KatexProps {
    math: string
    errorColor?: string
    renderError?: (error: Error) => ReactNode
  }

  export const InlineMath: React.FC<KatexProps>
  export const BlockMath: React.FC<KatexProps>
}
