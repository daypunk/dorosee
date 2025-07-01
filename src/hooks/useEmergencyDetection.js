import { useCallback } from 'react';
import { KEYWORDS } from '../config/app.config';

const useEmergencyDetection = () => {
  // 비전문 키워드와 '사고' 조합 예외 처리
  const isNonEmergencyAccident = useCallback((text) => {
    return KEYWORDS.NON_EMERGENCY.some(keyword => text.includes(keyword));
  }, []);

  const detectEmergency = useCallback((text) => {
    // 비전문 분야의 '사고' 표현은 응급상황이 아니다
    if (isNonEmergencyAccident(text)) {
      return false;
    }

    // 응급상황 키워드 검사
    return KEYWORDS.EMERGENCY.some(keyword => text.includes(keyword));
  }, [isNonEmergencyAccident]);

  const getEmergencyResponse = useCallback(() => {
    return "🚨 응급상황 감지! 119 연결합니다."; // 🎯 짧게 수정
  }, []);

  return {
    detectEmergency,
    getEmergencyResponse
  };
};

export default useEmergencyDetection;