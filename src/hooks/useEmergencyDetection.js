import { useCallback } from 'react';
import { KEYWORDS } from '../config/app.config';

const useEmergencyDetection = () => {
  const isNonEmergencyAccident = useCallback((text) => {
    return KEYWORDS.NON_EMERGENCY.some(keyword => text.includes(keyword));
  }, []);

  const detectEmergency = useCallback((text) => {
    if (isNonEmergencyAccident(text)) {
      return false;
    }

    return KEYWORDS.EMERGENCY.some(keyword => text.includes(keyword));
  }, [isNonEmergencyAccident]);

  const getEmergencyResponse = useCallback(() => {
    return "🚨 응급상황 감지! 119 연결합니다.";
  }, []);

  return {
    detectEmergency,
    getEmergencyResponse
  };
};

export default useEmergencyDetection;