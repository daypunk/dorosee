import { useState, useCallback } from 'react'
import aiService from '../services/aiService'

export const useChat = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return null

    const userMsg = {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    const startTime = Date.now()
    const minThinkingTime = 2000

    try {
      const location = await getCurrentLocation()
      
      const accessibilityProfile = location ? { location } : {}
      
      const response = await aiService.generateResponse(userMessage, accessibilityProfile)

      const elapsedTime = Date.now() - startTime
      const remainingTime = minThinkingTime - elapsedTime
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }

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
      
      const elapsedTime = Date.now() - startTime
      const remainingTime = minThinkingTime - elapsedTime
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }
      
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
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
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