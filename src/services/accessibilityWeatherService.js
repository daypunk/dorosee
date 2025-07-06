import kakaoLocationService from './kakaoLocationService';
import weatherService from './weatherService';

class AccessibilityWeatherService {
  constructor() {
    this.weatherService = weatherService;
  }

  // 브라우저 위치 기반 간단한 날씨 정보 생성 (빠른 응답 우선)
  async getSimpleWeatherResponse(userInput = '', accessibilityProfile = {}) {
    try {
      // 1. 사용자 위치 감지
      const location = await this.detectUserLocation();
      console.log('감지된 위치:', location);
      
      // 2. 즉시 기본 응답 생성 (API 대기 없이)
      const quickResponse = this.generateQuickWeatherResponse(location);
      
      // 3. 백그라운드에서 실제 API 시도 (비동기)
      this.updateWeatherInBackground(location, accessibilityProfile);
      
      return quickResponse;
      
    } catch (error) {
      console.error('접근성 날씨 서비스 오류:', error);
      // 완전 fallback
      return this.generateDefaultWeatherResponse();
    }
  }
  
  // 즉시 응답용 스마트 날씨 추정
  generateQuickWeatherResponse(location) {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // 1-12월
    
    // 계절별 평균 기온 추정
    let estimatedTemp;
    if (month >= 12 || month <= 2) { // 겨울
      estimatedTemp = hour < 6 ? '영하 2' : hour > 18 ? '3' : '8';
    } else if (month >= 3 && month <= 5) { // 봄
      estimatedTemp = hour < 6 ? '8' : hour > 18 ? '15' : '18';
    } else if (month >= 6 && month <= 8) { // 여름
      estimatedTemp = hour < 6 ? '22' : hour > 18 ? '28' : '32';
    } else { // 가을
      estimatedTemp = hour < 6 ? '12' : hour > 18 ? '18' : '22';
    }
    
    // 시간대별 날씨 패턴
    const timeBasedCondition = hour >= 6 && hour <= 18 ? '대체로 맑음' : '맑음';
    
    const cityName = location.city || '현재 지역';
    
    const responses = [
      `${cityName} 날씨는 ${timeBasedCondition}이고 ${estimatedTemp}도 정도 예상돼요! 정확한 정보는 날씨 앱을 확인해보세요~`,
      `지금 ${timeBasedCondition}에 ${estimatedTemp}도 정도 될 것 같아요! 외출하시기 전에 날씨 앱도 한 번 체크해보세요.`,
      `${cityName}은 ${timeBasedCondition}, ${estimatedTemp}도 정도로 예상돼요. 실시간 정보는 기상청 앱에서 확인하시는 게 가장 정확해요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // 완전 fallback 응답
  generateDefaultWeatherResponse() {
    const responses = [
      "죄송해요, 지금 날씨 정보를 확인하기 어려워요. 날씨 앱이나 창밖을 한 번 보시는 게 어떨까요?",
      "실시간 날씨 정보를 가져오지 못했어요. 기상청 앱이나 포털 사이트에서 확인해보세요!",
      "날씨 서비스에 일시적인 문제가 있는 것 같아요. 외출 전에는 날씨 앱을 꼭 확인해보세요~"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // 백그라운드에서 실제 날씨 업데이트 (UI 블로킹 없음)
  async updateWeatherInBackground(location, accessibilityProfile) {
    try {
      console.log('🌤️ 백그라운드에서 실제 날씨 정보 가져오는 중...');
      
      // 카카오맵 주소 정보
      let address = null;
      try {
        address = await kakaoLocationService.getCurrentAddress(location.lat, location.lon);
      } catch (error) {
        console.log('주소 정보 가져오기 실패:', error);
      }
      
      // 실제 기상청 API 호출
      const weatherData = await this.weatherService.getCurrentWeather(
        location.lat, 
        location.lon,
        address
      );
      
      console.log('✅ 백그라운드 날씨 업데이트 성공:', weatherData);
      // 필요시 캐시에 저장하거나 다음 요청에 활용
      
    } catch (error) {
      console.log('⚠️ 백그라운드 날씨 업데이트 실패 (무시됨):', error.message);
    }
  }

  // 친절하고 유용한 날씨 응답 생성
  generateSimpleWeatherOnly(weatherData, location, accessibilityProfile) {
    const { temp, condition } = weatherData;
    const advice = this.getWeatherAdvice(temp, condition);
    const locationName = location.city || '현재 위치';
    
    // 친근하고 도움이 되는 응답
    const responses = [
      `${locationName} 날씨는 ${condition}이고 ${temp}도예요. ${advice} 어디 가시는 길인가요?`,
      `지금 ${condition}에 ${temp}도네요! ${advice} 안전하게 다니세요~`,
      `현재 ${condition}, 기온은 ${temp}도입니다. ${advice} 도움이 더 필요하시면 말씀해주세요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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

  // 따뜻하고 유용한 날씨 조언
  getWeatherAdvice(temp, condition) {
    if (condition.includes('비')) return '우산 꼭 챙기시고';
    if (condition.includes('눈')) return '길이 미끄러우니 조심히 걸으세요';
    if (temp < 5) return '정말 추우니까 따뜻하게 입으세요';
    if (temp > 30) return '너무 더우니 수분 섭취 잊지 마세요';
    if (temp > 25) return '더운 날씨네요, 시원한 곳에서 쉬셔도 좋을 것 같아요';
    if (temp < 10) return '쌀쌀하니 겉옷 하나 더 챙기세요';
    if (condition === '맑음') return '날씨가 정말 좋네요!';
    
    return '좋은 하루 되세요';
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

  // ChatBot 프로필용 - 날씨 데이터만 반환 (응답 문자열 아님)
  async getWeatherData(userLat, userLon) {
    try {
      // 1. 사용자 위치 감지 (파라미터가 없으면 자동 감지)
      let location;
      if (userLat && userLon) {
        location = { lat: userLat, lon: userLon, city: '현재 위치' };
      } else {
        location = await this.detectUserLocation();
      }
      
      // 2. 카카오맵으로 상세 주소 정보 가져오기
      let address = null;
      try {
        address = await kakaoLocationService.getCurrentAddress(location.lat, location.lon);
      } catch (error) {
        console.log('주소 정보 가져오기 실패:', error);
      }
      
      // 3. 기상청 API로 날씨 데이터 가져오기
      const weatherData = await this.weatherService.getCurrentWeather(
        location.lat, 
        location.lon,
        address
      );
      
      // 4. 위치 정보 추가하여 반환
      return {
        ...weatherData,
        location: address ? kakaoLocationService.getShortAddress(address) : location.city
      };
      
    } catch (error) {
      console.error('날씨 데이터 가져오기 오류:', error);
      throw error; // 기본값 반환하지 않고 오류 전파
    }
  }
}

const accessibilityWeatherService = new AccessibilityWeatherService();
export default accessibilityWeatherService;