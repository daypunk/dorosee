/**
 * Thank You Page for PWA Report Submission
 * Displays success message after report submission and handles viewport reset for mobile.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function PWAThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    const resetViewport = () => {
      let viewport = document.querySelector('meta[name="viewport"]');
      
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        
        setTimeout(() => {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }, 100);
      }
    };

    resetViewport();
  }, []);

  return (
    <div className="h-screen bg-white text-gray-800 flex justify-center" style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
      <div className="w-full max-w-md flex flex-col justify-center items-center px-6">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src="/dorosee_logo2.svg" alt="Dorosee Logo" className="h-8 mx-auto mb-8" />
          
          <div className="mb-8">
            <motion.div 
              className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </motion.div>
            <h1 className="text-xl font-bold mb-4 text-gray-900">제보가 완료되었습니다</h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              소중한 정보를 제공해 주셔서 감사합니다.<br />
              빠르게 실종자를 찾을 수 있도록 노력하겠습니다.
            </p>
            <button 
              onClick={() => navigate('/pwa')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-md font-medium transition-colors text-sm"
            >
              다른 실종자 보기
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PWAThankYou; 