import { Link } from 'react-router-dom'

function PWA() {
  return (
    <div className="min-h-screen bg-slate-900 text-white px-6 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">PWA 페이지</h1>
          <Link 
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
          >
            메인으로 돌아가기
          </Link>
        </div>
        
        {/* 스크롤 가능한 콘텐츠 */}
        <div className="space-y-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">PWA 기능 1</h2>
            <p className="text-slate-300">프로그레시브 웹 앱의 첫 번째 기능입니다.</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">PWA 기능 2</h2>
            <p className="text-slate-300">프로그레시브 웹 앱의 두 번째 기능입니다.</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">PWA 기능 3</h2>
            <p className="text-slate-300">프로그레시브 웹 앱의 세 번째 기능입니다.</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">PWA 기능 4</h2>
            <p className="text-slate-300">프로그레시브 웹 앱의 네 번째 기능입니다.</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">PWA 기능 5</h2>
            <p className="text-slate-300">프로그레시브 웹 앱의 다섯 번째 기능입니다.</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">PWA 기능 6</h2>
            <p className="text-slate-300">더 많은 콘텐츠로 스크롤을 테스트할 수 있습니다.</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">PWA 기능 7</h2>
            <p className="text-slate-300">스크롤이 정상적으로 작동하는지 확인해보세요.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWA 