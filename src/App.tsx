import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>Easy Logic</h1>
        <p>A modern React + TypeScript frontend</p>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Count: {count}
        </button>
      </div>
    </>
  )
}

export default App
