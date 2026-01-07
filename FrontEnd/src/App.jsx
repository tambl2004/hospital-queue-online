import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          BenhVien Project
        </h1>
        <p className="text-gray-600 mb-6">
          Frontend React với Vite và Tailwind CSS
        </p>
        <button
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Count is {count}
        </button>
      </div>
    </div>
  )
}

export default App

