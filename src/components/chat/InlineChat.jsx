import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff } from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import useAdvancedTTS from '../../hooks/useAdvancedTTS'

const InlineChat = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const { messages, sendMessage, isLoading } = useChat()
  const { speakText, stopSpeaking, initializeSpeech } = useAdvancedTTS()
  const recognitionRef = useRef(null)

  useEffect(() => {
    // TTS 초기화
    initializeSpeech()
    
    if (isOpen) {
      startListening()
    } else {
      stopListening()
    }
    
    return () => {
      stopListening()
    }
  }, [isOpen, initializeSpeech])

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
    const response = await sendMessage(message)
    if (response) {
      // TTS로 응답 읽어주기
      speakText(response)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="absolute bottom-28 left-1/2 transform -translate-x-1/2 w-80 max-w-sm"
        >
          {/* 말풍선 */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* 헤더 */}
            <div className="bg-slate-800 text-white p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">도로시와 대화중</span>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-300 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* 메시지 영역 */}
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm">
                  안녕하세요! 무엇을 도와드릴까요?
                </div>
              )}
              
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs rounded-lg p-3 text-sm ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {message.content}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-500">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 음성 인식 상태 */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={toggleListening}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                
                <div className="flex-1 text-center">
                  {isListening ? (
                    <div className="text-red-500 text-sm font-medium">
                      듣고 있어요...
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm">
                      마이크를 클릭해서 말해보세요
                    </div>
                  )}
                </div>
              </div>
              
              {transcript && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                  "{transcript}"
                </div>
              )}
            </div>
          </div>

          {/* 말풍선 꼬리 */}
          <div className="flex justify-center">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InlineChat 