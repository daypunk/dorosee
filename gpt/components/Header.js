import React from 'react';
import weatherService from '../services/weatherService';

const Header = ({ weatherData, location, locationError, locationLoading, ttsMode, onTTSModeChange }) => {
  const getLocationStatus = () => {
    if (locationLoading) return '📍 위치 확인중...';
    if (locationError) return '⚠️ 위치 오류';
    if (location) return `📍 ${weatherData.location}`;
    return '📍 위치 미확인';
  };

  const getTimeString = () => {
    return new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 날씨 API 테스트 버튼 클릭
  const handleWeatherTest = async () => {
    console.log('날씨 API 수동 테스트 시작...');
    
    // API 설정 확인
    const config = weatherService.checkApiConfig();
    console.log('API 설정:', config);
    
    // 기상청 API 테스트
    const testResult = await weatherService.testKMAApi();
    console.log('기상청 API 테스트 결과:', testResult);
    
    // 전체 날씨 서비스 테스트
    if (location) {
      try {
        const weather = await weatherService.getCurrentWeather(location.latitude, location.longitude);
        console.log('전체 날씨 서비스 결과:', weather);
      } catch (error) {
        console.error('전체 날씨 서비스 오류:', error);
      }
    }
  };

  return (
    <header className="header">
      <h1>🤖 도로시 Enhanced</h1>
      <div className="status-bar">
        <span>{getLocationStatus()}</span>
        <span>🌡️ {weatherData.condition}</span>
        <span>⏰ {getTimeString()}</span>
      </div>
      
      {/* 시스템 상태 표시 */}
      <div style={{
        marginTop: '0.5rem',
        padding: '0.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: 'rgba(255, 255, 255, 0.8)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🤖 도로시 시스템이 활성화되었습니다. 시민 여러분의 안전을 지켜가겠습니다.</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => onTTSModeChange(ttsMode === 'web' ? 'openai' : 'web')}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.7rem',
                background: ttsMode === 'openai' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                border: `1px solid ${ttsMode === 'openai' ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🎙️ {ttsMode === 'openai' ? 'AI TTS' : 'Web TTS'}
            </button>
            <button 
              onClick={handleWeatherTest}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.7rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🌡️ API 테스트
            </button>
          </div>
        </div>
        <div style={{ 
          marginTop: '0.3rem',
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          날씨: {weatherData.temp}°C {weatherData.condition} | 위치: {getLocationStatus()}
        </div>
      </div>
    </header>
  );
};

export default Header;