import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TTSModeSelector = ({ currentMode, availableModes, onModeChange, isSpeaking }) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentModeInfo = availableModes.find(mode => mode.id === currentMode);

  const handleModeSelect = (modeId) => {
    onModeChange(modeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 현재 모드 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          isSpeaking 
            ? 'bg-green-600 text-white' 
            : 'bg-slate-600 hover:bg-slate-500 text-white'
        }`}
        disabled={isSpeaking}
      >
        <span className="text-lg">{currentModeInfo?.icon || '🔊'}</span>
        <span>{currentModeInfo?.name || 'TTS'}</span>
        {isSpeaking && (
          <motion.div
            className="w-2 h-2 bg-green-300 rounded-full"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 모드 선택 드롭다운 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 bg-slate-700 rounded-lg shadow-lg z-50 min-w-[200px]"
          >
            <div className="p-2">
              <div className="text-xs text-slate-300 mb-2 px-2">TTS 모드 선택</div>
              {availableModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors ${
                    mode.id === currentMode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  <span className="text-lg">{mode.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-xs opacity-70">{mode.description}</div>
                  </div>
                  {mode.id === currentMode && (
                    <div className="w-2 h-2 bg-blue-300 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            
            {/* 하단 정보 */}
            <div className="border-t border-slate-600 p-2">
              <div className="text-xs text-slate-400 text-center">
                사용 가능한 모드: {availableModes.length}개
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TTSModeSelector; 