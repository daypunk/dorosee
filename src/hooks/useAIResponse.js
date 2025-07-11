import { useCallback } from 'react';
import aiService from '../services/aiService';

const useAIResponse = () => {
  const generateResponse = useCallback(async (userInput, location = null, accessibilityProfile = {}, currentWeatherData = null) => {
    if (location) {
      return await aiService.generateLocationBasedResponse(userInput, location, currentWeatherData);
    }
    
    return await aiService.generateResponse(userInput, accessibilityProfile, currentWeatherData);
  }, []);

  return {
    generateResponse
  };
};

export default useAIResponse;