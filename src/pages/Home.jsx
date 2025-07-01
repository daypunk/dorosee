import { useNavigate } from 'react-router-dom'
import { useRive } from '@rive-app/react-canvas'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import ChatBot from '../components/chat/ChatBot'
import UnifiedTester from '../components/debug/UnifiedTester'
import { useChat } from '../hooks/useChat'
import useAdvancedTTS from '../hooks/useAdvancedTTS'

function Home() {
  const navigate = useNavigate()
  const [isChatBotOpen, setIsChatBotOpen] = useState(false)
  const [isChatMode, setIsChatMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  
  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)
  
  const { messages, sendMessage, isLoading, clearMessages } = useChat()
  const { speakText, stopSpeaking, initializeSpeech } = useAdvancedTTS()
  
  const { RiveComponent } = useRive({
    src: '/chat_dorosee.riv',
    autoplay: true,
    useOffscreenRenderer: true,
    shouldDisableRiveListeners: false,
  });

  const handleReportClick = () => {
    navigate('/pwa')
  }

  const handleChatBotToggle = () => {
    if (!isChatMode) {
      setIsChatMode(true)
      // TTS 초기화
      initializeSpeech()
      // 음성 인식 자동 시작
      startListening()
      // 타이머는 첫 번째 도로시 응답 완료 후에 시작됨
    } else {
      exitChatMode()
    }
  }

  const exitChatMode = () => {
    setIsChatMode(false)
    stopListening()
    clearMessages()
    clearInactivityTimer()
  }

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'ko-KR'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
      }

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript)
          handleSendMessage(finalTranscript)
          setTranscript('')
          // 타이머는 handleSendMessage에서 도로시 응답 완료 후에 시작됨
        }
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleSendMessage = async (message) => {
    clearInactivityTimer() // 도로시가 응답하는 동안 타이머 정지
    const response = await sendMessage(message)
    if (response) {
      await speakText(response)
    }
    // 도로시 응답 완료 후 6초 타이머 시작
    resetInactivityTimer()
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
    // 마이크 토글만으로는 타이머 리셋하지 않음
  }

  // 6초 비활성 타이머 (도로시 응답 후)
  const resetInactivityTimer = () => {
    clearInactivityTimer()
    timeoutRef.current = setTimeout(() => {
      exitChatMode()
    }, 6000) // 6초
  }

  const clearInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // 챗봇 테스트 이벤트 리스너
  useEffect(() => {
    const handleOpenChatBot = () => {
      setIsChatBotOpen(true)
    }

    window.addEventListener('openChatBot', handleOpenChatBot)
    return () => {
      window.removeEventListener('openChatBot', handleOpenChatBot)
    }
  }, [])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      clearInactivityTimer()
      stopListening()
    }
  }, [])

  return (
    <>
      {/* 통합 테스터 */}
      <UnifiedTester />
      
      <div className="h-screen bg-slate-900 flex flex-col justify-between items-center px-6 py-8 overflow-hidden">
      {/* 빈 공간 */}
      <div></div>
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 일반 모드 - 중앙 정렬 */}
        <motion.div 
          className="flex flex-col items-center justify-center flex-1"
          animate={{ 
            opacity: isChatMode ? 0 : 1,
            pointerEvents: isChatMode ? 'none' : 'auto'
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* 메인 로고/애니메이션 */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div style={{ width: '180px', height: '180px' }}>
              <RiveComponent 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  imageRendering: 'auto',
                }}
              />
            </div>
          </motion.div>
          
          {/* 타이틀 */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h1 className="text-4xl font-bold leading-snug text-white">
              도로시에게<br />
              인사해 주세요!
            </h1>
          </motion.div>
        </motion.div>

        {/* 채팅 모드 */}
        <motion.div 
          className="flex-1 px-4 py-6"
          animate={{ 
            opacity: isChatMode ? 1 : 0,
            pointerEvents: isChatMode ? 'auto' : 'none'
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="h-full flex flex-col space-y-4 max-w-4xl mx-auto">
            {/* 채팅 메시지들 */}
            <div className="flex-1 space-y-4 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center text-slate-300 text-lg">
                  안녕하세요! 무엇을 도와드릴까요?
                </div>
              )}
              
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start items-start space-x-4'}`}
                >
                  {/* AI 응답의 경우 도로시 애니메이션 표시 */}
                  {message.type === 'ai' && (
                    <motion.div 
                      className="flex-shrink-0"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div style={{ width: '60px', height: '60px' }}>
                        <RiveComponent 
                          style={{ 
                            width: '100%', 
                            height: '100%',
                            imageRendering: 'auto',
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  {/* 메시지 말풍선 */}
                  <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white ml-12' 
                      : 'bg-white text-slate-800 shadow-lg'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* 로딩 표시 */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start items-start space-x-4"
                >
                  {/* 도로시 애니메이션 */}
                  <div style={{ width: '60px', height: '60px' }}>
                    <RiveComponent 
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        imageRendering: 'auto',
                      }}
                    />
                  </div>
                  
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 음성 인식 상태 표시 */}
            <motion.div 
              className="bg-slate-800 bg-opacity-80 rounded-2xl p-4 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={toggleListening}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-slate-600 hover:bg-slate-500 text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <div className="text-white">
                  {isListening ? (
                    <div className="text-sm font-medium">
                      듣고 있어요... 🎤
                    </div>
                  ) : (
                    <div className="text-sm">
                      마이크를 클릭해서 말해보세요
                    </div>
                  )}
                </div>
              </div>
              
              {transcript && (
                <div className="mt-3 p-2 bg-blue-900 bg-opacity-50 rounded-lg text-sm text-blue-200">
                  "{transcript}"
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* 마이크 버튼 - 하단 중앙 */}
      <motion.div 
        className="relative flex justify-center pb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >

        
        <button 
          onClick={handleChatBotToggle}
          className={`group relative w-20 h-20 bg-gradient-to-r transition-all duration-300 transform border-2 flex items-center justify-center rounded-full shadow-xl ${
            isChatMode 
              ? 'from-red-600 to-red-500 border-red-400 scale-105' 
              : 'from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 border-slate-500 hover:scale-110'
          }`}
        >
          <Mic className="w-8 h-8 text-white" />
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-300"></div>
          
          {/* 펄스 효과 */}
          {isChatMode && (
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30"></div>
          )}
          {!isChatMode && (
            <div className="absolute inset-0 rounded-full bg-slate-600 animate-pulse opacity-20"></div>
          )}
          
          {/* 툴팁 */}
          {!isChatMode && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              도로시와 대화하기
            </div>
          )}
        </button>
      </motion.div>

      {/* 챗봇 모달 */}
      <ChatBot 
        isOpen={isChatBotOpen} 
        onClose={() => setIsChatBotOpen(false)} 
      />
      </div>
    </>
  )
}

export default Home 