// 🎛️ 도로시 V3 중앙 설정 파일

// API 엔드포인트 설정
export const API_CONFIG = {
  OPENAI: {
    ENDPOINT: 'https://api.openai.com/v1/chat/completions',
    TTS_ENDPOINT: 'https://api.openai.com/v1/audio/speech',
    MODEL: 'gpt-4o',
    TTS_MODEL: 'tts-1'
  },
  PERPLEXITY: {
    ENDPOINT: 'https://api.perplexity.ai/chat/completions',
    MODEL: 'llama-3.1-sonar-small-128k-online'
  },
  WEATHER: {
    KMA_ENDPOINT: 'https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min',
    OPENWEATHER_ENDPOINT: 'https://api.openweathermap.org/data/2.5/weather'
  }
};

// TTS 설정
export const TTS_CONFIG = {
  VOICES: {
    ACTIVE: 'shimmer',      // 활발한 여성 음성
    ALTERNATIVES: ['nova', 'alloy', 'echo', 'fable', 'onyx']
  },
  SETTINGS: {
    SPEED: 1.1,             // 조금 빠르게
    TEMPERATURE: 0.8,       // 활발한 표현
    MAX_TOKENS: {
      WEATHER: 50,          // 🎯 날씨는 매우 간결하게
      SPECIALTY: 60,        // 🎯 전문분야도 짧게
      GENERAL: 60           // 🎯 일반 대화도 짧게
    }
  }
};

// 음성인식 설정
export const STT_CONFIG = {
  LANGUAGE: 'ko-KR',
  CONTINUOUS: false,
  INTERIM_RESULTS: false,
  MAX_ALTERNATIVES: 1
};

// 캐릭터 설정
export const CHARACTER_CONFIG = {
  NAME: '도로시',
  AGE: '20대',
  PERSONALITY: '활발하고 에너지 넘치는',
  ENDINGS: ['ㅎ', '요~', '!!'],
  TONE: 'friendly_energetic'
};

// 키워드 설정
export const KEYWORDS = {
  EMERGENCY: [
    '화재', '불', '사고', '쓰러진', '쓰러져', '심장마비', '지진', 
    '응급', '도움', '실종', '구조', '위험', '다쳤', '다쳐', 
    '의식불명', '출혈', '응급실', '구급차'
  ],
  NON_EMERGENCY: [
    '양자역학', '양자', '비과학', '자유낙하', '사고실험', '실험',
    '개발자', '프로그래밍', '코딩', '소프트웨어', '논리', '철학',
    '사고방식', '사고력', '사고실험', '사고법'
  ],
  WEATHER: [
    '날씨', '비', '눈', '맑음', '흐림', '기온', '온도',
    '날씨예보', '기상', '우산', '우비', '태풍', '바람',
    '추워', '더워', '반팔', '선크림', '자외선',
    '어떨', '어떤', '날씩', '오늘'
  ],
  SPECIALTY: [
    '안전', '위험', '주의', '조심', '길', '가는법', '어떻게가', 
    '지하철', '버스', '도보', '교통', '역', '정류장',
    '날씨', '비', '예보', '기온', '온도', '태풍', '홍수', '눈', '바람', 
    '도로시', '기능', '도움', '안내', '서비스',
    '안녕', '반가', '고마워', '고맙다', '처음', '나이', '몇살'
  ],
  REALTIME: [
    '오늘', '지금', '현재', '최신', '요즘', '이번주', '이번달',
    '상황', '전상', '운행', '고장', '지연',
    '영업시간', '운영시간', '몇시', '언제'
  ]
};

// 앱 설정
export const APP_CONFIG = {
  NAME: '도로시 Enhanced v3.0',
  VERSION: '3.0.0',
  DESCRIPTION: 'AI & 무인이동체 활용 시민 안전 서비스',
  MAX_MESSAGE_LENGTH: 500,
  CACHE_DURATION: 5 * 60 * 1000, // 5분
  DEFAULT_LOCATION: {
    latitude: 37.5665,
    longitude: 126.9780,
    name: '서울시청'
  }
};

// 환경 변수 검증
export const validateEnvironment = () => {
  const required = [
    'VITE_OPENAI_API_KEY',
    'VITE_PERPLEXITY_API_KEY', 
    'VITE_WEATHER_API_KEY',
    'VITE_KAKAO_API_KEY'
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️ 누락된 환경 변수:', missing);
    return false;
  }
  
  console.log('✅ 모든 환경 변수 설정 완료');
  return true;
};

// API 키 검증
export const validateApiKeys = () => {
  const patterns = {
    VITE_OPENAI_API_KEY: /^sk-[a-zA-Z0-9-]{40,}$/,
    VITE_PERPLEXITY_API_KEY: /^pplx-[a-zA-Z0-9]{32,}$/,
    VITE_WEATHER_API_KEY: /^[a-zA-Z0-9]{16,}$/,
    VITE_KAKAO_API_KEY: /^[a-zA-Z0-9]{32}$/
  };
  
  const results = {};
  
  Object.entries(patterns).forEach(([key, pattern]) => {
    const value = import.meta.env[key];
    results[key] = {
      exists: !!value,
      valid: value ? pattern.test(value) : false,
      masked: value ? `${value.slice(0, 8)}...${value.slice(-4)}` : 'N/A'
    };
  });
  
  return results;
};