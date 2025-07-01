// ⚠️ DEPRECATED: 이 파일은 src/config/app.config.js로 이전되었습니다.
// 하위 호환성을 위해 임시로 유지됩니다.

import { API_CONFIG, KEYWORDS } from '../config/app.config';

// 기존 코드와의 호환성을 위한 export
export const VOICE_STATUS = {
  READY: '준비됨',
  LISTENING: '듣는 중...',
  SPEAKING: '말하는 중...',
  THINKING: '생각하는 중...',
  ERROR: '오류 발생'
};

export const MESSAGE_TYPES = {
  USER: 'user',
  BOT: 'bot'
};

// config에서 가져온 키워드들
export const EMERGENCY_KEYWORDS = KEYWORDS.EMERGENCY;
export const NON_EMERGENCY_KEYWORDS = KEYWORDS.NON_EMERGENCY;
export const DOROSE_SPECIALTY_KEYWORDS = KEYWORDS.SPECIALTY;

// config에서 가져온 API 엔드포인트들 
export const API_ENDPOINTS = {
  OPENAI: API_CONFIG.OPENAI.ENDPOINT,
  PERPLEXITY: API_CONFIG.PERPLEXITY.ENDPOINT,
  WEATHER: API_CONFIG.WEATHER.OPENWEATHER_ENDPOINT,
  WEATHER_KMA: API_CONFIG.WEATHER.KMA_ENDPOINT,
  TTSMAKER: 'https://api.ttsmaker.com/v1/speech'
};