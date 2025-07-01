import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import alternativeWeatherService from '../../services/alternativeWeatherService.js';
import weatherService from '../../services/weatherService.js';
import kakaoLocationService from '../../services/kakaoLocationService.js';

const UnifiedTester = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const cleanMessage = message.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    
    console.log('Adding log:', { message: cleanMessage, type, timestamp });
    
    setLogs(prev => [...prev, { 
      id: Date.now() + Math.random(), 
      timestamp, 
      message: cleanMessage,
      type 
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const runAllTests = async () => {
    console.log('runAllTests called');
    setIsRunning(true);
    clearLogs();
    
    // 기본 시스템 로그
    addLog('SYSTEM INITIALIZATION...', 'system');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    addLog('Loading Dorosee Test Suite v2.0', 'system');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ENV 테스트 - 즉시 실행
    addLog('> Checking environment variables...', 'test');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const envVars = [
      { name: 'WEATHER_API_KEY', value: import.meta.env.VITE_WEATHER_API_KEY },
      { name: 'KAKAO_API_KEY', value: import.meta.env.VITE_KAKAO_API_KEY },
      { name: 'OPENAI_API_KEY', value: import.meta.env.VITE_OPENAI_API_KEY },
      { name: 'TTSMAKER_API_KEY', value: import.meta.env.VITE_TTSMAKER_API_KEY }
    ];
    
    for (const env of envVars) {
      if (env.value && env.value !== 'your_api_key_here') {
        addLog(`${env.name}: ${env.value.slice(0, 8)}...${env.value.slice(-4)}`, 'success');
      } else {
        addLog(`${env.name}: NOT_FOUND`, 'warn');
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 기본 위치 테스트 (서울시청)
    addLog('> Testing basic location services...', 'test');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const lat = 37.5665, lon = 126.9780;
      addLog(`Using default location: ${lat}, ${lon}`, 'info');
      
      // 카카오맵 테스트
      addLog('> Testing Kakao Maps API...', 'test');
      const address = await kakaoLocationService.getCurrentAddress(lat, lon);
      addLog(`ADDRESS: ${address.fullAddress}`, 'success');
      
      // 날씨 테스트
      addLog('> Testing weather services...', 'test');
      const weather = await weatherService.getCurrentWeather(lat, lon, address);
      addLog(`WEATHER: ${weather.temp}C ${weather.condition}`, 'success');
      
      addLog('> Test sequence completed', 'system');
      addLog('SYSTEM STATUS: OPERATIONAL', 'system');
      
    } catch (error) {
      addLog(`ERROR: ${error.message}`, 'warn');
      addLog('SYSTEM STATUS: PARTIAL', 'system');
    }
    
    setIsRunning(false);
  };

  const handleChatOpen = () => {
    // 부모 컴포넌트에 챗봇 테스트 신호 전달
    window.dispatchEvent(new CustomEvent('openChatBot'));
  };

  if (!isOpen) {
    return (
      <div className="hidden lg:block fixed top-4 left-4 z-50">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-black text-green-400 px-3 py-1 rounded text-xs font-mono border border-green-500 hover:bg-gray-900 transition-all"
          >
            Test
          </button>
          <button
            onClick={() => navigate('/pwa')}
            className="bg-slate-700 text-white px-3 py-1 rounded text-xs font-mono border border-slate-500 hover:bg-slate-600 transition-all"
          >
            실종자 제보
          </button>
          <button
            onClick={handleChatOpen}
            className="bg-blue-700 text-white px-3 py-1 rounded text-xs font-mono border border-blue-500 hover:bg-blue-600 transition-all"
          >
            챗봇 테스트
          </button>
        </div>
      </div>
    );
  }

      return (
      <div className="hidden lg:block fixed top-4 left-4 bg-black text-green-400 w-96 max-h-96 rounded border border-green-500 font-mono text-xs overflow-hidden z-50">
        {/* 헤더 */}
        <div className="bg-black p-2 flex justify-between items-center border-b border-green-500">
          <span className="text-green-400">DOROSEE_TEST_SUITE</span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-green-400 hover:text-green-300"
          >
            [X]
          </button>
        </div>

              {/* 컨트롤 */}
        <div className="p-2 border-b border-green-500 bg-black">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="w-full bg-black text-green-400 py-1 rounded border border-green-500 hover:bg-gray-900 disabled:opacity-50 mr-2"
        >
          {isRunning ? 'RUNNING...' : 'RUN_ALL_TESTS'}
        </button>
        <button
          onClick={clearLogs}
          className="w-full mt-1 bg-black text-green-400 py-1 rounded border border-green-500 hover:bg-gray-900"
        >
          CLEAR_LOGS
        </button>
      </div>

              {/* 로그 영역 */}
        <div className="max-h-64 overflow-y-auto p-2 bg-black">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="mb-1 text-green-400"
          >
            <span className="text-green-500">[{log.timestamp}]</span> {log.message}
          </div>
        ))}
        
        {logs.length === 0 && (
          <div className="text-green-400 text-center py-8">
            AWAITING_COMMANDS...
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedTester; 