import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PWA from './pages/PWA'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pwa" element={<PWA />} />
    </Routes>
  )
}

export default App
