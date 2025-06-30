import React from 'react';

function PWAThankYou() {
  return (
    <div className="h-screen bg-white text-gray-800 flex justify-center">
      <div className="w-full max-w-md flex flex-col justify-center items-center px-6">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-green-600">제보가 완료되었습니다</h1>
            <p className="text-gray-600 leading-relaxed">
              소중한 정보를 제공해 주셔서 감사합니다.<br />
              빠르게 실종자를 찾을 수 있도록 노력하겠습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAThankYou; 