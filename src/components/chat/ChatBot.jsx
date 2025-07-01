import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useVoiceRecognition from '../../hooks/useVoiceRecognition';
import useAdvancedTTS from '../../hooks/useAdvancedTTS';
import useEmergencyDetection from '../../hooks/useEmergencyDetection';
import useAIResponse from '../../hooks/useAIResponse';
import useGeolocation from '../../hooks/useGeolocation';
import useAccessibilityProfile from '../../hooks/useAccessibilityProfile';
import kakaoLocationService from '../../services/kakaoLocationService';
import weatherService from '../../services/weatherService';
import TTSModeSelector from './TTSModeSelector';

const ChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 도로시입니다~ 무엇을 도와드릴까요?",
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
  const [inputValue, setInputValue] = useState('');
  
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
    switchTTSMode,
    getAvailableModes
  } = useAdvancedTTS();

  const { detectEmergency, getEmergencyResponse } = useEmergencyDetection();
  const { generateResponse } = useAIResponse();
  
  const { location, error: locationError, loading: locationLoading } = useGeolocation();
  
  const { 
    profile: accessibilityProfile, 
    handleVoiceCommand, 
    handleTextInput 
  } = useAccessibilityProfile();

  // 초기화
  useEffect(() => {
    if (isOpen) {
      initializeRecognition();
      initializeSpeech();
      scrollToBottom();
    }
  }, [isOpen, initializeRecognition, initializeSpeech]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 위치 기반 정보 업데이트
  useEffect(() => {
    if (location) {
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
        }
      }).catch(error => {
        console.error('주소 변환 오류:', error);
      });
      
      weatherService.getCurrentWeather(
        location.latitude,
        location.longitude
      ).then(weather => {
        setWeatherData(prev => ({
          ...prev,
          temp: weather.temp,
          condition: weather.condition
        }));
      }).catch(error => {
        console.error('날씨 정보 오류:', error);
        // 기상청 API 오류 시 최소한의 기본값만 설정
        setWeatherData(prev => ({
          ...prev,
          temp: '?',
          condition: 'API 오류'
        }));
      });
    }
  }, [location]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 사용자 메시지 처리
  const handleUserMessage = async (text, isVoiceInput = false) => {
    if (!text.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isEmergency: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

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
      const response = await generateResponse(text, location, accessibilityProfile, weatherData);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isEmergency: false
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // 모든 응답에 대해 TTS 실행 (사용자가 TTS 모드를 선택한 경우)
      speakText(response);
    } catch (error) {
      console.error('응답 생성 오류:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        isEmergency: false
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUserMessage(inputValue);
  };

  const handleQuickAction = (text) => {
    handleUserMessage(text);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      // 음성 인식 중지 로직
    } else {
      startListening((transcript) => {
        handleUserMessage(transcript, true);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
        <motion.div 
          className="bg-slate-800 rounded-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="bg-slate-700 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">도</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">도로시</h3>
                  <p className="text-slate-300 text-xs">{weatherData.location} • {weatherData.temp}°C</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* TTS 모드 선택기 */}
            <div className="flex items-center justify-between">
              <TTSModeSelector
                currentMode={ttsMode}
                availableModes={getAvailableModes()}
                onModeChange={switchTTSMode}
                isSpeaking={isSpeaking}
              />
              
              {/* 상태 표시 */}
              <div className="flex items-center space-x-2 text-xs">
                {isSpeaking && (
                  <div className="flex items-center space-x-1 text-green-400">
                    <motion.div
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <span>음성 출력 중</span>
                  </div>
                )}
                
                {isListening && (
                  <div className="flex items-center space-x-1 text-red-400">
                    <motion.div
                      className="w-2 h-2 bg-red-400 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                    <span>음성 인식 중</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : message.isEmergency 
                      ? 'bg-red-600 text-white' 
                      : 'bg-slate-600 text-white'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.sender === 'bot' ? '도로시' : '시민'} • {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 빠른 액션 버튼들 */}
          <div className="px-4 py-2 border-t border-slate-600">
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <button 
                onClick={() => handleQuickAction('현재 날씨 알려줘')}
                className="px-3 py-1 bg-slate-600 text-white rounded-full text-sm whitespace-nowrap hover:bg-slate-500 transition-colors"
              >
                날씨
              </button>
              <button 
                onClick={() => handleQuickAction('지하철역 가는 길 알려줘')}
                className="px-3 py-1 bg-slate-600 text-white rounded-full text-sm whitespace-nowrap hover:bg-slate-500 transition-colors"
              >
                교통
              </button>
              <button 
                onClick={() => handleQuickAction('주변 병원 찾아줘')}
                className="px-3 py-1 bg-slate-600 text-white rounded-full text-sm whitespace-nowrap hover:bg-slate-500 transition-colors"
              >
                병원
              </button>
              <button 
                onClick={() => speakText(`안녕하세요! 도로시의 ${ttsMode} TTS 테스트입니다. 음성이 잘 들리시나요?`)}
                className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm whitespace-nowrap hover:bg-purple-500 transition-colors"
              >
                TTS 테스트
              </button>
              <button 
                onClick={() => handleQuickAction('도움이 필요해')}
                className="px-3 py-1 bg-red-600 text-white rounded-full text-sm whitespace-nowrap hover:bg-red-500 transition-colors"
              >
                도움
              </button>
            </div>
          </div>

          {/* 입력 영역 */}
          <div className="p-4 border-t border-slate-600">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`p-2 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-600 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  🎤
                </button>
              )}
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatBot; 