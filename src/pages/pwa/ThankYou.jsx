import React from 'react';
import { Link } from 'react-router-dom';

function PWAThankYou() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Dorosee</h1>
        
        <div className="bg-slate-800 rounded-lg p-8 shadow-lg">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-400">제보가 완료되었습니다</h2>
            <p className="text-slate-300 leading-relaxed">
              소중한 정보를 제공해 주셔서 감사합니다.<br />
              빠르게 실종자를 찾을 수 있도록 노력하겠습니다.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link 
              to="/pwa"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              실종자 목록으로
            </Link>
            <Link 
              to="/"
              className="block w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAThankYou; 