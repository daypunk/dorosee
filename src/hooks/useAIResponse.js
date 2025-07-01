import { useCallback } from 'react';
import aiService from '../services/aiService';

const useAIResponse = () => {
  const generateResponse = useCallback(async (userInput, location = null, accessibilityProfile = {}, currentWeatherData = null) => {
    // 위치 정보가 있으면 위치 기반 응답 생성
    if (location) {
      return await aiService.generateLocationBasedResponse(userInput, location, currentWeatherData);
    }
    
    // 위치 정보가 없으면 기본 응답 (접근성 프로필 + 현재 날씨 데이터 포함)
    return await aiService.generateResponse(userInput, accessibilityProfile, currentWeatherData);
  }, []);

  return {
    generateResponse
  };
};

export default useAIResponse;