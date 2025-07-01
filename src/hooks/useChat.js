import { useState, useCallback } from 'react'
import aiService from '../services/aiService'

export const useChat = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return null

    // 사용자 메시지 추가
    const userMsg = {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      // 위치 정보 가져오기
      const location = await getCurrentLocation()
      
      // AI 서비스로 응답 생성
      const response = location 
        ? await aiService.generateLocationBasedResponse(userMessage, location)
        : await aiService.generateResponse(userMessage)

      // AI 응답 추가
      const aiMsg = {
        type: 'ai',
        content: response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMsg])
      setIsLoading(false)
      
      return response
    } catch (error) {
      console.error('채팅 메시지 전송 오류:', error)
      
      const errorMsg = {
        type: 'ai',
        content: '죄송해요, 지금 응답하기 어려워요. 다시 말씀해 주세요.',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMsg])
      setIsLoading(false)
      
      return errorMsg.content
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          () => {
            resolve(null)
          }
        )
      } else {
        resolve(null)
      }
    })
  }

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading
  }
} 