import weatherService from '../services/weatherService';
import kakaoLocationService from '../services/kakaoLocationService';

// 환경변수 확인 함수
const checkEnv = () => {
  console.log('🔧 환경변수 확인:');
  console.log('📦 NODE_ENV:', import.meta.env.MODE);
  console.log('🌤️ WEATHER_API_KEY:', import.meta.env.VITE_WEATHER_API_KEY ? 
    `${import.meta.env.VITE_WEATHER_API_KEY.slice(0, 8)}...${import.meta.env.VITE_WEATHER_API_KEY.slice(-4)}` : 
    '❌ 없음');
  console.log('🗺️ KAKAO_API_KEY:', import.meta.env.VITE_KAKAO_API_KEY ? 
    `${import.meta.env.VITE_KAKAO_API_KEY.slice(0, 8)}...${import.meta.env.VITE_KAKAO_API_KEY.slice(-4)}` : 
    '❌ 없음');
  console.log('🤖 OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? 
    `${import.meta.env.VITE_OPENAI_API_KEY.slice(0, 8)}...${import.meta.env.VITE_OPENAI_API_KEY.slice(-4)}` : 
    '❌ 없음');
};

// 날씨 API 테스트 (기상청만)
const testWeather = async (lat = 37.5665, lon = 126.9780) => {
  console.log('🌤️ 기상청 날씨 API 테스트 시작...');
  console.log(`📍 테스트 위치: ${lat}, ${lon}`);
  
  try {
    const result = await weatherService.getCurrentWeather(lat, lon);
    console.log('✅ 기상청 API 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ 기상청 API 실패:', error);
    throw error;
  }
};

// 카카오맵 API 테스트 (위치 정보만)
const testKakao = async (lat = 37.5665, lng = 126.9780) => {
  console.log('🗺️ 카카오맵 API 테스트 시작...');
  console.log(`📍 테스트 위치: ${lat}, ${lng}`);
  
  try {
    // 좌표 → 주소 변환
    const address = await kakaoLocationService.getCurrentAddress(lat, lng);
    console.log('📍 주소 변환 결과:', address);
    
    // 주변 지하철역 검색
    const stations = await kakaoLocationService.searchNearbyByCategory(lat, lng, 'SW8', 1000);
    console.log('🚇 지하철역 검색 결과:', stations.slice(0, 3));
    
    console.log('✅ 카카오맵 API 테스트 성공!');
    
    return { address, stations: stations.slice(0, 3) };
  } catch (error) {
    console.error('❌ 카카오맵 API 실패:', error);
    throw error;
  }
};

// OpenAI API 직접 테스트
window.testOpenAI = async (message = "안녕하세요") => {
  console.log('🧪 OpenAI API 직접 테스트 시작...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 100
      })
    });
    
    console.log('📡 OpenAI 응답 상태:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI 성공:', data.choices[0].message.content);
      return data.choices[0].message.content;
    } else {
      const errorText = await response.text();
      console.error('❌ OpenAI 오류:', errorText);
      return null;
    }
  } catch (error) {
    console.error('💥 OpenAI 예외:', error);
    return null;
  }
};

// aiService를 통한 테스트
window.testAiService = async (message = "안녕하세요") => {
  console.log('🤖 aiService 테스트 시작...');
  
  try {
    const { default: aiService } = await import('../services/aiService.js');
    const response = await aiService.generateResponse(message);
    console.log('🎯 aiService 응답:', response);
    return response;
  } catch (error) {
    console.error('💥 aiService 오류:', error);
    return null;
  }
};

// 전역 테스트 함수들을 window 객체에 추가
if (typeof window !== 'undefined') {
  window.doroseeTest = {
    checkEnv,
    testWeather,
    testKakao,
    
    // 빠른 테스트
    seoul: () => testWeather(37.5665, 126.9780),
    gangnam: () => testWeather(37.5173, 127.0473),
    
    help: () => {
      console.log('🧪 도로시 API 테스트 도구 (기상청 전용)');
      console.log('📋 사용 가능한 명령어:');
      console.log('  doroseeTest.checkEnv()     - 환경변수 확인');
      console.log('  doroseeTest.testWeather()  - 기상청 API 테스트');
      console.log('  doroseeTest.testKakao()    - 카카오맵 API 테스트');
      console.log('  doroseeTest.seoul()        - 서울 날씨 테스트');
      console.log('  doroseeTest.gangnam()      - 강남 날씨 테스트');
    }
  };
  
  console.log('🧪 도로시 기상청 API 테스트 도구가 로드되었습니다!');
  console.log('💡 doroseeTest.help() 를 실행하여 사용법을 확인하세요.');
}

export { checkEnv, testWeather, testKakao };