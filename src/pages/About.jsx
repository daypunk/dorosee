import { Link } from 'react-router-dom'

function About() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-8">
          B페이지
        </h1>
        <Link 
          to="/"
          className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          A페이지로 이동
        </Link>
      </div>
    </div>
  )
}

export default About 