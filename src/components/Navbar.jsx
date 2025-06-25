import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-lg fixed top-0 w-full z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="text-2xl font-bold text-blue-600" onClick={closeMenu}>
            Dorosee
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={closeMenu}
            >
              A페이지
            </Link>
            <Link 
              to="/about" 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === '/about' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={closeMenu}
            >
              B페이지
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <Link 
              to="/" 
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={closeMenu}
            >
              A페이지
            </Link>
            <Link 
              to="/about" 
              className={`block px-4 py-2 rounded-lg font-medium transition-colors mt-2 ${
                location.pathname === '/about' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={closeMenu}
            >
              B페이지
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar 