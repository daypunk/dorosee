import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import VoicePanel from './components/VoicePanel';
import EmergencyAlert from './components/EmergencyAlert';
import useVoiceRecognition from './hooks/useVoiceRecognition';
import useTextToSpeech from './hooks/useTextToSpeech';
import useEmergencyDetection from './hooks/useEmergencyDetection';
import useAIResponse from './hooks/useAIResponse';
import useGeolocation from './hooks/useGeolocation';
import useAccessibilityProfile from './hooks/useAccessibilityProfile';
import kakaoLocationService from './services/kakaoLocationService';
import weatherService from './services/weatherService';

const App = () => {
  // 상태 관리
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 도로시입니다~ 무엇을 도와드릴까요?", // 🎯 짧게 수정
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isEmergency: false
    }
  ]);
  
  const [showEmergency, setShowEmergency] = useState(false);
  const [weatherData, setWeatherData] = useState({ 
    temp: 24, 
    condition: '확인 중...', 
    location: '서울' 
  });
  
  const messagesEndRef = useRef(null);

  // Custom hooks 사용
  const {
    isListening,
    voiceStatus,
    initializeRecognition,
    startListening,
    isSupported
  } = useVoiceRecognition();

  const {
    isSpeaking,
    ttsMode,
    initializeSpeech,
    speakText,
    stopSpeaking,
    switchTTSMode
  } = useTextToSpeech();

  const { detectEmergency, getEmergencyResponse } = useEmergencyDetection();
  const { generateResponse } = useAIResponse();
  
  // 위치 정보 훅 추가
  const { location, error: locationError, loading: locationLoading } = useGeolocation();
  
  // 접근성 프로필 훅 추가
  const { 
    profile: accessibilityProfile, 
    handleVoiceCommand, 
    handleTextInput 
  } = useAccessibilityProfile();

  // 초기화
  useEffect(() => {
    initializeRecognition();
    initializeSpeech();
    scrollToBottom();
  }, [initializeRecognition, initializeSpeech]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 위치 기반 주소 업데이트
  useEffect(() => {
    if (location) {
      // 주소 업데이트
      kakaoLocationService.getCurrentAddress(
        location.latitude,
        location.longitude
      ).then(address => {
        if (address) {
          const shortLocation = kakaoLocationService.getShortAddress(address);
          setWeatherData(prev => ({
            ...prev,
            location: shortLocation
          }));
          console.log('위치 업데이트:', shortLocation);
        }
      }).catch(error => {
        console.error('주소 변환 오류:', error);
      });
      
      // 날씨 정보 업데이트
      console.log('날씨 API 호출 시작:', { lat: location.latitude, lon: location.longitude });
      
      // 날씨 API 설정 확인
      const apiConfig = weatherService.checkApiConfig();
      console.log('날씨 API 설정:', apiConfig);
      
      weatherService.getCurrentWeather(
        location.latitude,
        location.longitude
      ).then(weather => {
        console.log('날씨 API 성공:', weather);
        setWeatherData(prev => ({
          ...prev,
          temp: weather.temp,
          condition: weather.condition
        }));
      }).catch(error => {
        console.error('날씨 정보 오류:', error);
        // 에러 시 기본값 유지
      });
    } else {
      // 위치 정보가 없을 때도 날씨 시도
      console.log('위치 없이 날씨 API 호출 시도');
      weatherService.getCurrentWeather().then(weather => {
        console.log('기본 날씨 정보:', weather);
        setWeatherData(prev => ({
          ...prev,
          temp: weather.temp,
          condition: weather.condition
        }));
      }).catch(error => {
        console.error('기본 날씨 오류:', error);
      });
    }
  }, [location]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 사용자 메시지 처리
  const handleUserMessage = async (text, isVoiceInput = false) => {
    const startTime = Date.now();
    
    // 상호작용 기록 (접근성 분석용)
    if (isVoiceInput) {
      handleVoiceCommand(text, 0); // 음성 명령은 응답시간 0
    } else {
      // 텍스트 입력은 나중에 응답시간과 함께 기록
    }
    // 🎯 메시지 길이 제한 함수 - 제거
    const limitMessageLength = (text) => {
      return text; // 길이 제한 제거
    };

    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isEmergency: false
    };
    
    setMessages(prev => [...prev, userMessage]);

    // 응급상황 감지
    if (detectEmergency(text)) {
      const emergencyResponse = getEmergencyResponse();
      
      const botMessage = {
        id: Date.now() + 1,
        text: emergencyResponse,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isEmergency: true
      };
      
      setMessages(prev => [...prev, botMessage]);
      setShowEmergency(true);
      speakText(emergencyResponse);
      return;
    }

    // 일반 응답 생성
    try {
      // 위치 정보와 접근성 프로필과 함께 응답 생성
      const response = await generateResponse(text, location, accessibilityProfile);
      
      const botMessage = {
        id: Date.now() + 1,
        text: limitMessageLength(response), // 🎯 응답 길이 제한
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isEmergency: false
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // 접근성 프로필에 따른 TTS 조정
      if (accessibilityProfile.visualImpairment || accessibilityProfile.elderly) {
        // 시각장애인이나 고령자는 항상 음성 안내
        speakText(response);
      } else if (!accessibilityProfile.hearingImpairment) {
        // 청각장애인이 아닌 경우만 음성 안내
        speakText(response);
      }
      
      // 텍스트 입력이었다면 응답시간 기록
      if (!isVoiceInput) {
        const responseTime = Date.now() - startTime;
        handleTextInput(text, responseTime);
      }
      
    } catch (error) {
      console.error('응답 생성 오류:', error);
      const errorMessage = "죄송합니다. 일시적인 오류가 발생했습니다. 다시 말씀해 주세요.";
      
      const botMessage = {
        id: Date.now() + 1,
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isEmergency: false
      };
      
      setMessages(prev => [...prev, botMessage]);
      speakText(errorMessage);
    }
  };

  // 음성 인식 토글
  const handleVoiceToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    startListening((text) => handleUserMessage(text, true)); // 음성 입력임을 표시
  };

  // 빠른 액션 처리
  const handleQuickAction = (text) => {
    handleUserMessage(text);
  };

  // 개발자 입력 처리
  const handleDevSubmit = (e) => {
    e.preventDefault();
    const input = e.target.devInput;
    if (input.value.trim()) {
      handleUserMessage(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="app">
      {/* 상단 헤더 */}
      <Header 
        weatherData={weatherData} 
        location={location}
        locationError={locationError}
        locationLoading={locationLoading}
        ttsMode={ttsMode}
        onTTSModeChange={switchTTSMode}
      />

      {/* 메인 컨테이너 - 세로형 레이아웃 */}
      <div className="main-container">
        {/* 채팅 패널 */}
        <ChatPanel 
          messages={messages}
          onQuickAction={handleQuickAction}
          onDevSubmit={handleDevSubmit}
          messagesEndRef={messagesEndRef}
        />

        {/* 하단 음성 패널 */}
        <VoicePanel 
          isListening={isListening}
          isSpeaking={isSpeaking}
          voiceStatus={voiceStatus}
          onVoiceToggle={handleVoiceToggle}
          isSupported={isSupported}
        />
      </div>

      {/* 응급상황 알림 모달 */}
      <EmergencyAlert 
        show={showEmergency}
        onClose={() => setShowEmergency(false)}
      />
      
      {/* 위치 권한 요청 알림 */}
      {locationError && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'rgba(255, 107, 107, 0.95)',
          color: 'white',
          padding: '1rem',
          borderRadius: '15px',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <strong>위치 서비스 알림</strong>
          </div>
          <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {locationError}
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
            위치 기반 서비스를 사용하려면 브라우저 설정에서 위치 권한을 허용해주세요.
          </p>
        </div>
      )}

      {/* 실시간 안전 정보 (필요시 표시) */}
      <div className="safety-info-section" id="safetyInfo">
        <div className="safety-info-content">
          <strong>⚠️ 실시간 안전 정보</strong>
          <p>안전 정보를 불러오는 중...</p>
        </div>
      </div>
    </div>
  );
};

export default App;