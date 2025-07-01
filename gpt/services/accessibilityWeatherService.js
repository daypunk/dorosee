import weatherService from './weatherService';

class AccessibilityWeatherService {
  constructor() {
    this.weatherService = weatherService;
  }

  // 브라우저 위치 기반 간단한 날씨 정보 생성
  async getSimpleWeatherResponse(userInput = '', accessibilityProfile = {}) {
    try {
      // 1. 사용자 위치 감지
      const location = await this.detectUserLocation();
      
      // 2. 날씨 데이터 가져오기
      const weatherData = await this.weatherService.getCurrentWeather(
        location.lat, 
        location.lon
      );
      
      // 3. 강제로 간단한 응답만 생성 (다른 API 호출 방지)
      const response = this.generateSimpleWeatherOnly(weatherData, location, accessibilityProfile);
      console.log('🌤️ 날씨 서비스 최종 응답:', response, `(길이: ${response.length}자)`);
      return response;
      
    } catch (error) {
      console.error('접근성 날씨 서비스 오류:', error);
      return this.getDefaultWeatherResponse(accessibilityProfile);
    }
  }

  // 🎯 매우 간단한 날씨 응답만 생성 (최대 1줄, 30자 이내)
  generateSimpleWeatherOnly(weatherData, location, accessibilityProfile) {
    const { temp, condition } = weatherData;
    const emoji = this.getWeatherEmoji(condition);
    
    // 🎯 모든 경우에 대해 극도로 간단하게 (30자 이내)
    const response = `${condition} ${emoji} ${temp}°C`;
    
    return response;
  }

  // 브라우저 geolocation으로 위치 감지
  async detectUserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation 미지원, 서울 기본값 사용');
        resolve({ city: '서울', lat: 37.5665, lon: 126.9780 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // 좌표를 도시명으로 변환
            const cityName = await this.getCityFromCoordinates(latitude, longitude);
            resolve({
              city: cityName,
              lat: latitude,
              lon: longitude
            });
          } catch (error) {
            console.log('도시명 변환 실패, 좌표 그대로 사용');
            resolve({
              city: '현재 위치',
              lat: latitude,
              lon: longitude
            });
          }
        },
        (error) => {
          console.log('위치 접근 거부 또는 실패, 서울 기본값 사용');
          resolve({ city: '서울', lat: 37.5665, lon: 126.9780 });
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5분간 캐시
        }
      );
    });
  }

  // 좌표를 도시명으로 변환
  async getCityFromCoordinates(lat, lon) {
    try {
      // Kakao API 또는 기타 역지오코딩 서비스 사용
      // 여기서는 간단하게 서울 권역인지만 확인
      if (lat >= 37.4 && lat <= 37.7 && lon >= 126.8 && lon <= 127.2) {
        return '서울';
      } else if (lat >= 37.2 && lat <= 37.5 && lon >= 126.6 && lon <= 127.1) {
        return '인천';
      } else if (lat >= 37.1 && lat <= 37.8 && lon >= 126.7 && lon <= 127.5) {
        return '경기';
      }
      return '현재 위치';
    } catch (error) {
      return '현재 위치';
    }
  }

  // 날씨 상태에 따른 이모지
  getWeatherEmoji(condition) {
    const emojiMap = {
      '맑음': '☀️',
      '구름 조금': '⛅',
      '구름 많음': '☁️',
      '흐림': '☁️',
      '비': '🌧️',
      '소나기': '🌦️',
      '눈': '❄️',
      '안개': '🌫️',
      '뇌우': '⛈️'
    };
    
    return emojiMap[condition] || '🌤️';
  }

  // 간단한 날씨 조언 (한 단어)
  getSimpleAdvice(temp, condition) {
    if (condition.includes('비')) return '우산 필요';
    if (condition.includes('눈')) return '미끄러움 주의';
    if (temp < 5) return '따뜻하게 입으세요';
    if (temp > 28) return '시원하게 입으세요';
    if (condition === '맑음') return '외출하기 좋아요';
    
    return '좋은 하루';
  }

  // 🎯 기본 날씨 응답 (오류 시) - 극도로 간단하게
  getDefaultWeatherResponse(accessibilityProfile) {
    return "날씨 정보 없음";
  }

  // 날씨 질문 감지
  isWeatherQuery(userInput) {
    const weatherKeywords = [
      '날씨', '비', '눈', '맑음', '흐림', '기온', '온도',
      '날씨예보', '기상', '우산', '우비', '바람',
      '추워', '더워', '덥', '춥', '시원', '따뜻'
    ];
    
    const inputLower = userInput.toLowerCase();
    return weatherKeywords.some(keyword => inputLower.includes(keyword));
  }
}

const accessibilityWeatherService = new AccessibilityWeatherService();
export default accessibilityWeatherService;