import weatherService from '../services/weatherService';
import kakaoLocationService from '../services/kakaoLocationService';
import alternativeWeatherService from '../services/alternativeWeatherService';

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
  console.log('🎤 TTSMAKER_API_KEY:', import.meta.env.VITE_TTSMAKER_API_KEY ? 
    `${import.meta.env.VITE_TTSMAKER_API_KEY.slice(0, 8)}...${import.meta.env.VITE_TTSMAKER_API_KEY.slice(-4)}` : 
    '❌ 없음');
};

// 날씨 API 테스트
const testWeather = async (lat = 37.5665, lon = 126.9780) => {
  console.log('🌤️ 날씨 API 테스트 시작...');
  console.log(`📍 테스트 위치: ${lat}, ${lon}`);
  
  try {
    // 먼저 주소 정보 가져오기
    let address = null;
    try {
      address = await kakaoLocationService.getCurrentAddress(lat, lon);
      console.log('📍 주소 정보:', address);
    } catch (error) {
      console.log('⚠️ 주소 정보 가져오기 실패');
    }
    
    const result = await weatherService.getCurrentWeather(lat, lon, address);
    console.log('✅ 날씨 API 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ 날씨 API 실패:', error);
    throw error;
  }
};

// 대안 날씨 서비스 테스트
const testAlternativeWeather = async (lat = 37.5665, lon = 126.9780) => {
  console.log('🌈 대안 날씨 서비스 테스트 시작...');
  console.log(`📍 테스트 위치: ${lat}, ${lon}`);
  
  try {
    // 1. 주소 정보 가져오기
    let address = null;
    try {
      address = await kakaoLocationService.getCurrentAddress(lat, lon);
      console.log('📍 주소 정보:', address);
    } catch (error) {
      console.log('⚠️ 주소 정보 가져오기 실패');
    }
    
    // 2. 대안 날씨 서비스 테스트
    const weather = await alternativeWeatherService.updateWeatherByLocation(lat, lon, address);
    console.log('✅ 대안 날씨 서비스 성공:', weather);
    
    // 3. 날씨 조언 생성
    const advice = alternativeWeatherService.getWeatherAdvice(weather);
    console.log('💡 날씨 조언:', advice);
    
    // 4. 계절별 추정 테스트
    const seasonal = alternativeWeatherService.getSeasonalWeather(lat, lon, '테스트 위치');
    console.log('🌤️ 계절별 추정:', seasonal);
    
    return { weather, advice, seasonal };
  } catch (error) {
    console.error('❌ 대안 날씨 서비스 실패:', error);
    throw error;
  }
};

// 카카오맵 API 테스트
const testKakao = async (lat = 37.5665, lng = 126.9780) => {
  console.log('🗺️ 카카오맵 API 테스트 시작...');
  console.log(`📍 테스트 위치: ${lat}, ${lng}`);
  
  try {
    // 1. 좌표 → 주소 변환
    console.log('1️⃣ 좌표 → 주소 변환 테스트...');
    const address = await kakaoLocationService.getCurrentAddress(lat, lng);
    console.log('📍 주소 변환 결과:', address);
    
    // 2. 주변 지하철역 검색
    console.log('2️⃣ 주변 지하철역 검색 테스트...');
    const stations = await kakaoLocationService.searchNearbyByCategory(lat, lng, 'SW8', 1000);
    console.log('🚇 지하철역 검색 결과:', stations.slice(0, 5));
    
    // 3. 주변 편의점 검색
    console.log('3️⃣ 주변 편의점 검색 테스트...');
    const stores = await kakaoLocationService.searchNearbyByCategory(lat, lng, 'CS2', 500);
    console.log('🏪 편의점 검색 결과:', stores.slice(0, 5));
    
    console.log('✅ 카카오맵 API 모든 테스트 성공!');
    
    return {
      address,
      stations: stations.slice(0, 5),
      stores: stores.slice(0, 5)
    };
  } catch (error) {
    console.error('❌ 카카오맵 API 실패:', error);
    throw error;
  }
};

// 특정 위치의 상세 정보 테스트
const testLocation = async (lat, lng, name = '테스트 위치') => {
  console.log(`🎯 ${name} (${lat}, ${lng}) 상세 테스트`);
  
  try {
    const weatherPromise = testWeather(lat, lng);
    const kakaoPromise = testKakao(lat, lng);
    
    const [weather, kakao] = await Promise.all([weatherPromise, kakaoPromise]);
    
    console.log(`✅ ${name} 종합 테스트 완료!`);
    console.log('📊 결과 요약:');
    console.log(`  🌡️ 날씨: ${weather.temp}°C, ${weather.condition}`);
    console.log(`  📍 주소: ${kakao.address?.fullAddress || '주소 불명'}`);
    console.log(`  🚇 가장 가까운 역: ${kakao.stations[0]?.name || '없음'} (${kakao.stations[0]?.distance || 0}m)`);
    console.log(`  🏪 가장 가까운 편의점: ${kakao.stores[0]?.name || '없음'} (${kakao.stores[0]?.distance || 0}m)`);
    
    return { weather, kakao };
  } catch (error) {
    console.error(`❌ ${name} 테스트 실패:`, error);
    throw error;
  }
};

// 주요 도시들 테스트
const testMajorCities = async () => {
  const cities = [
    { name: '서울시청', lat: 37.5665, lng: 126.9780 },
    { name: '부산시청', lat: 35.1796, lng: 129.0756 },
    { name: '대구시청', lat: 35.8714, lng: 128.6014 },
    { name: '인천시청', lat: 37.4563, lng: 126.7052 },
    { name: '광주시청', lat: 35.1595, lng: 126.8526 }
  ];
  
  console.log('🏙️ 주요 도시 API 테스트 시작...');
  
  for (const city of cities) {
    try {
      await testLocation(city.lat, city.lng, city.name);
      console.log('---');
    } catch (error) {
      console.error(`❌ ${city.name} 테스트 실패:`, error);
    }
  }
  
  console.log('🏁 주요 도시 테스트 완료!');
};

// 전역 객체에 테스트 함수들 등록
if (typeof window !== 'undefined') {
  window.doroseeTest = {
    checkEnv,
    testWeather,
    testAlternativeWeather,
    testKakao,
    testLocation,
    testMajorCities,
    
    // 빠른 테스트 함수들
    seoul: () => testLocation(37.5665, 126.9780, '서울시청'),
    busan: () => testLocation(35.1796, 129.0756, '부산시청'),
    gangnam: () => testLocation(37.5173, 127.0473, '강남역'),
    hongdae: () => testLocation(37.5563, 126.9236, '홍대입구역'),
    
    // 도움말
    help: () => {
      console.log('🧪 도로시 API 테스트 도구');
      console.log('');
      console.log('📋 사용 가능한 명령어:');
      console.log('  doroseeTest.checkEnv()        - 환경변수 확인');
      console.log('  doroseeTest.testWeather()     - 날씨 API 테스트');
      console.log('  doroseeTest.testAlternativeWeather() - 대안 날씨 서비스 테스트');
      console.log('  doroseeTest.testKakao()       - 카카오맵 API 테스트');
      console.log('  doroseeTest.testLocation(lat, lng, name) - 특정 위치 테스트');
      console.log('  doroseeTest.testMajorCities() - 주요 도시 테스트');
      console.log('');
      console.log('🏙️ 빠른 도시 테스트:');
      console.log('  doroseeTest.seoul()           - 서울시청');
      console.log('  doroseeTest.busan()           - 부산시청');
      console.log('  doroseeTest.gangnam()         - 강남역');
      console.log('  doroseeTest.hongdae()         - 홍대입구역');
      console.log('');
      console.log('💡 예시: doroseeTest.seoul()');
    }
  };
  
  // 초기 실행 시 도움말 표시
  console.log('🧪 도로시 API 테스트 도구가 로드되었습니다!');
  console.log('💡 doroseeTest.help() 를 실행하여 사용법을 확인하세요.');
}

export {
  checkEnv,
  testWeather,
  testAlternativeWeather,
  testKakao,
  testLocation,
  testMajorCities
}; 