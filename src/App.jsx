import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PWA from './pages/PWA'
import PWADetail from './pages/pwa/Detail'
import PWAThankYou from './pages/pwa/ThankYou'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pwa" element={<PWA />} />
      <Route path="/pwa/detail/:id" element={<PWADetail />} />
      <Route path="/pwa/thankyou" element={<PWAThankYou />} />
    </Routes>
  )
}

export default App
