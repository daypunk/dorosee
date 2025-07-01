import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import weatherService from '../../services/weatherService';
import kakaoLocationService from '../../services/kakaoLocationService';

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
    addLog(`Environment: ${window.location.hostname}`, 'system');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ENV 테스트 - 더 상세한 진단
    addLog('> Checking environment variables...', 'test');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const envVars = [
      { name: 'WEATHER_API_KEY', value: import.meta.env.VITE_WEATHER_API_KEY },
      { name: 'KAKAO_API_KEY', value: import.meta.env.VITE_KAKAO_API_KEY },
      { name: 'OPENAI_API_KEY', value: import.meta.env.VITE_OPENAI_API_KEY },
      { name: 'TTSMAKER_API_KEY', value: import.meta.env.VITE_TTSMAKER_API_KEY },
      { name: 'MISSING_PERSON_ESNTL_ID', value: import.meta.env.VITE_MISSING_PERSON_ESNTL_ID },
      { name: 'MISSING_PERSON_AUTH_KEY', value: import.meta.env.VITE_MISSING_PERSON_AUTH_KEY }
    ];
    
    let envOkCount = 0;
    for (const env of envVars) {
      if (env.value && env.value !== 'your_api_key_here') {
        const maskedValue = env.value.length > 8 
          ? `${env.value.slice(0, 8)}...${env.value.slice(-4)}`
          : '***';
        
        // 기상청 API 키 형식 체크 (특별 처리)
        if (env.name === 'WEATHER_API_KEY') {
          const keyAnalysis = analyzeWeatherApiKey(env.value);
          addLog(`${env.name}: ${maskedValue} [${keyAnalysis}]`, keyAnalysis === 'OK_KMA' ? 'success' : 'warn');
        } else {
          addLog(`${env.name}: ${maskedValue} [OK]`, 'success');
        }
        envOkCount++;
      } else {
        addLog(`${env.name}: NOT_FOUND [FAIL]`, 'warn');
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // API 키 분석 함수
    function analyzeWeatherApiKey(key) {
      if (!key || key === 'your_weather_api_key_here') return 'NOT_SET';
      
      // OpenWeatherMap 형식: 32자 영숫자 (예: xXPRF8dG...)
      if (key.length === 32 && /^[a-f0-9]+$/i.test(key)) {
        return 'OPENWEATHER_FORMAT';
      }
      
      // 기상청 API 키: 보통 더 길고 다양한 문자 포함
      if (key.length > 40) {
        return 'OK_KMA';
      }
      
      return 'UNKNOWN_FORMAT';
    }
    
    addLog(`Environment Status: ${envOkCount}/${envVars.length} variables found`, envOkCount > 0 ? 'success' : 'warn');

    // 실제 위치 서비스 테스트
    addLog('> Testing real location services...', 'test');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let lat, lon, locationSource;
    
    // 위치 권한 상태 확인
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({name: 'geolocation'});
        addLog(`Location permission: ${permission.state}`, 'info');
        
        if (permission.state === 'denied') {
          addLog('⚠️ Location permission denied in browser settings', 'warn');
          addLog('💡 Enable in: Browser Settings > Privacy > Location', 'info');
        }
      } catch (permError) {
        addLog('Could not check location permission status', 'info');
      }
    }
    
    try {
      // 1단계: 실제 사용자 위치 가져오기 시도
      addLog('Requesting user location permission...', 'info');
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            enableHighAccuracy: false,  // 더 빠른 응답을 위해 false로 변경
            timeout: 10000,             // 10초로 줄임
            maximumAge: 300000          // 5분간 캐시 허용
          }
        );
      });
      
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      locationSource = 'GPS';
      addLog(`GPS Location: ${lat.toFixed(4)}, ${lon.toFixed(4)} [REAL]`, 'success');
      addLog(`Accuracy: ±${Math.round(position.coords.accuracy)}m`, 'info');
      
    } catch (locationError) {
      // 2단계: 위치 권한 실패 시 기본값 사용
      addLog(`Location Error: ${locationError.message}`, 'warn');
      
      // 구체적인 해결 방법 제안
      if (locationError.code === 1) {
        addLog('🔒 User denied location access', 'warn');
        addLog('💡 Click location icon in address bar to allow', 'info');
      } else if (locationError.code === 2) {
        addLog('📍 Location unavailable (GPS issue)', 'warn');
      } else if (locationError.code === 3) {
        addLog('⏰ Location request timeout', 'warn');
        addLog('💡 Try refreshing or check GPS signal', 'info');
      }
      
      addLog('Falling back to default location (Seoul City Hall)...', 'warn');
      lat = 37.5665;
      lon = 126.9780;
      locationSource = 'DEFAULT_FALLBACK';
      addLog(`Using fallback location: ${lat}, ${lon} [FALLBACK]`, 'warn');
    }
    
    try {
      // 카카오맵 테스트 - 더 상세한 에러 정보
      addLog('> Testing Kakao Maps API...', 'test');
      try {
        const address = await kakaoLocationService.getCurrentAddress(lat, lon);
        if (address && address.fullAddress) {
          addLog(`ADDRESS: ${address.fullAddress} [${locationSource}]`, 'success');
          
          // 지하철역 검색 테스트
          const stations = await kakaoLocationService.searchNearbyByCategory(lat, lon, 'SW8', 1000);
          addLog(`SUBWAY_STATIONS: Found ${stations.length} stations [${locationSource}]`, 'success');
          
          if (locationSource === 'DEFAULT_FALLBACK') {
            addLog('WARNING: Using fallback location, not your real location!', 'warn');
          }
          
        } else {
          throw new Error('Invalid address response');
        }
      } catch (kakaoError) {
        addLog(`KAKAO_API_ERROR: ${kakaoError.message}`, 'warn');
        if (window.location.hostname === 'localhost') {
          addLog(`Local dev: Check if KAKAO_API_KEY is valid`, 'warn');
        } else {
          addLog(`Production: Check if KAKAO_API_KEY is set in Vercel`, 'warn');
        }
      }
      
      // 날씨 테스트 - 더 상세한 에러 정보
      addLog('> Testing weather services...', 'test');
      
      // weatherApiKey를 try 블록 밖에서 선언하여 스코프 문제 해결
      const weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY;
      
      try {
        // 기상청 단기예보 API 직접 테스트
        if (weatherApiKey && weatherApiKey !== 'your_weather_api_key_here') {
          addLog('Testing KMA Weather API directly...', 'info');
          addLog(`API Key format: ${weatherApiKey.substring(0, 10)}... (${weatherApiKey.length} chars)`, 'info');
          addLog(`Using ${window.location.hostname === 'localhost' ? 'PROXY' : 'DIRECT'} connection`, 'info');
          
          try {
            const kmaTestResult = await weatherService.testKMAApi(lat, lon);
            
            if (kmaTestResult.status === 200) {
              const resultCode = kmaTestResult.data.response?.header?.resultCode;
              if (resultCode === '00') {
                const itemCount = kmaTestResult.data.response?.body?.items?.item?.length || 0;
                addLog(`KMA_API: ${itemCount} weather items received [REAL_API]`, 'success');
                addLog(`Grid coords: nx=${kmaTestResult.params.nx}, ny=${kmaTestResult.params.ny}`, 'info');
                addLog(`Proxy used: ${kmaTestResult.usedProxy ? 'YES' : 'NO'}`, 'info');
              } else {
                const errorMsg = kmaTestResult.data.response?.header?.resultMsg || 'Unknown error';
                addLog(`KMA_API_ERROR: ${resultCode} - ${errorMsg}`, 'warn');
              }
            } else {
              addLog(`KMA_API_HTTP_ERROR: ${kmaTestResult.status} ${kmaTestResult.statusText}`, 'warn');
            }
            
            // API 응답 샘플 출력 (디버깅용)
            if (kmaTestResult.data.error === 'HTML Response') {
              addLog(`XML_ERROR_RESPONSE: ${kmaTestResult.data.response.substring(0, 500)}`, 'warn');
              
              // SERVICE_KEY 관련 오류 체크
              if (kmaTestResult.data.response.includes('SERVICE_KEY')) {
                addLog(`🔑 API KEY ERROR: Check if your WEATHER_API_KEY is correct`, 'warn');
                addLog(`📝 Current key length: ${weatherApiKey.length} chars`, 'info');
                addLog(`💡 KMA API key should be much longer (usually 100+ chars)`, 'info');
                addLog(`🌐 Visit: data.go.kr → "기상청_단기예보 조회서비스"`, 'info');
              }
            } else {
              const responseText = JSON.stringify(kmaTestResult.data).substring(0, 150);
              addLog(`API Response: ${responseText}...`, 'info');
            }
            
          } catch (kmaError) {
            addLog(`KMA_FETCH_ERROR: ${kmaError.message}`, 'warn');
            // 기상청 API 키 가이드 표시
            if (kmaError.message.includes('not valid JSON') || kmaError.message.includes('<OpenAPI_S')) {
              addLog('❌ Still getting HTML instead of JSON!', 'warn');
              addLog('💡 Try: 1) Check API key encoding/decoding', 'warn');
              addLog('💡 Try: 2) Restart dev server (npm run dev)', 'warn');
              addLog('💡 Try: 3) Check CORS/Proxy settings', 'warn');
            }
          }
        } else {
          addLog('KMA API key not configured', 'warn');
        }
        
        // 기존 날씨 서비스 테스트
        const weather = await weatherService.getCurrentWeather(lat, lon);
        const weatherSource = weather.source || 'UNKNOWN';
        addLog(`WEATHER: ${weather.temp}°C ${weather.condition} [${weatherSource}]`, 'success');
        
        if (weatherSource === '계절별 추정') {
          addLog('INFO: Weather API not available, using smart estimation', 'info');
        } else if (weatherSource === '기상청') {
          addLog('SUCCESS: Using real KMA weather data!', 'success');
        }
        
      } catch (weatherError) {
        addLog(`WEATHER_ERROR: ${weatherError.message}`, 'warn');
        addLog(`Weather API completely failed`, 'info');
      }
      
      // 종합 결과
      addLog('> Test sequence completed', 'system');
      
      if (locationSource === 'GPS') {
        addLog('SYSTEM STATUS: FULLY_OPERATIONAL (Real location)', 'system');
      } else {
        addLog('SYSTEM STATUS: PARTIAL (Fallback location)', 'system');
        addLog('TIP: Allow location permission for better accuracy', 'info');
      }
      
      // 문제 해결 가이드
      if (weatherApiKey && weatherApiKey.length === 32) {
        addLog('> SETUP GUIDE:', 'system');
        addLog('🌤️ Weather: Need KMA API key (not OpenWeatherMap)', 'info');
        addLog('📝 Visit: data.go.kr → Search "기상청_단기예보"', 'info');
        addLog('📋 Replace VITE_WEATHER_API_KEY in .env.local', 'info');
      }
      
      if (locationSource === 'DEFAULT_FALLBACK') {
        addLog('> LOCATION HELP:', 'system');
        addLog('📍 Click 🔒 icon in address bar', 'info');
        addLog('📍 Select "Allow" for location access', 'info');
        addLog('📍 Refresh page and test again', 'info');
      }
      
    } catch (error) {
      addLog(`CRITICAL_ERROR: ${error.message}`, 'warn');
      addLog('SYSTEM STATUS: DEGRADED', 'system');
      if (window.location.hostname !== 'localhost') {
        addLog('TIP: Check Vercel environment variables', 'info');
      }
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