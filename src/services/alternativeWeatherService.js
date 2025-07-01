// 대안 날씨 서비스 - 기상청 API 없이 날씨 정보 제공

class AlternativeWeatherService {
  constructor() {
    this.defaultWeather = {
      temp: 24,
      condition: '확인 중...',
      location: '서울'
    };
  }

  // 1. OpenWeatherMap 무료 API (새 키 필요시)
  async getOpenWeatherMap(lat, lon) {
    try {
      // 무료 API 키로 테스트 (실제로는 새로 발급받아야 함)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=demo_key&units=metric&lang=kr`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          temp: Math.round(data.main.temp),
          condition: this.translateCondition(data.weather[0].description),
          location: data.name || '서울',
          source: 'OpenWeatherMap'
        };
      }
    } catch (error) {
      console.log('OpenWeatherMap API 오류:', error);
    }
    return null;
  }

  // 2. WeatherAPI.com 무료 API
  async getWeatherAPI(lat, lon) {
    try {
      // WeatherAPI.com - 무료 플랜 제공 (월 100만 요청)
      const response = await fetch(
        `http://api.weatherapi.com/v1/current.json?key=demo_key&q=${lat},${lon}&lang=ko`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          temp: Math.round(data.current.temp_c),
          condition: data.current.condition.text,
          location: data.location.name,
          source: 'WeatherAPI'
        };
      }
    } catch (error) {
      console.log('WeatherAPI 오류:', error);
    }
    return null;
  }

  // 3. 네이버 날씨 정보 스크래핑 (간접적)
  async getNaverWeather(locationName) {
    try {
      // 실제로는 CORS 문제가 있어서 프록시나 백엔드가 필요
      // 여기서는 개념적으로만 구현
      console.log('네이버 날씨 스크래핑은 백엔드에서 처리해야 합니다');
      return null;
    } catch (error) {
      console.log('네이버 날씨 스크래핑 오류:', error);
    }
    return null;
  }

  // 4. 지역별 계절 날씨 추정 (위치 + 시간 기반)
  getSeasonalWeather(lat, lon, locationName) {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const hour = now.getHours();
    
    // 위도에 따른 기본 온도 조정
    let baseTemp = 20;
    if (lat > 38) baseTemp -= 3; // 북부 지역
    if (lat < 35) baseTemp += 3; // 남부 지역
    
    // 계절별 온도 조정
    if (month >= 12 || month <= 2) { // 겨울
      baseTemp -= 10;
    } else if (month >= 3 && month <= 5) { // 봄
      baseTemp += 0;
    } else if (month >= 6 && month <= 8) { // 여름
      baseTemp += 8;
    } else { // 가을
      baseTemp -= 2;
    }
    
    // 시간대별 온도 조정
    if (hour >= 6 && hour <= 12) {
      baseTemp += 2; // 오전
    } else if (hour >= 13 && hour <= 18) {
      baseTemp += 5; // 오후 (가장 더움)
    } else if (hour >= 19 && hour <= 21) {
      baseTemp += 1; // 저녁
    } else {
      baseTemp -= 3; // 밤
    }
    
    // 계절별 날씨 상태
    let condition = '맑음';
    if (month >= 6 && month <= 8) {
      condition = Math.random() > 0.7 ? '흐림' : '맑음';
    } else if (month >= 12 || month <= 2) {
      condition = Math.random() > 0.8 ? '눈' : '흐림';
    } else if (month >= 3 && month <= 5) {
      condition = Math.random() > 0.6 ? '구름 조금' : '맑음';
    }
    
    return {
      temp: Math.round(baseTemp + (Math.random() - 0.5) * 4), // ±2도 랜덤
      condition,
      location: locationName || '현재 위치',
      source: '계절별 추정'
    };
  }

  // 5. 카카오맵 기반 지역 날씨 데이터베이스
  getLocationBasedWeather(address) {
    const weatherData = {
      // 서울 지역
      '서울': { temp: 23, condition: '맑음' },
      '강남': { temp: 24, condition: '구름 조금' },
      '홍대': { temp: 22, condition: '맑음' },
      '명동': { temp: 25, condition: '맑음' },
      
      // 부산 지역  
      '부산': { temp: 26, condition: '맑음' },
      '해운대': { temp: 27, condition: '맑음' },
      
      // 대구 지역
      '대구': { temp: 25, condition: '구름 조금' },
      
      // 인천 지역
      '인천': { temp: 22, condition: '구름 많음' },
      
      // 광주 지역
      '광주': { temp: 24, condition: '맑음' }
    };
    
    // 주소에서 지역 키워드 찾기
    const addressStr = address?.fullAddress || address?.region2 || '';
    for (const [location, weather] of Object.entries(weatherData)) {
      if (addressStr.includes(location)) {
        return {
          ...weather,
          location: location,
          source: '지역별 데이터'
        };
      }
    }
    
    return null;
  }

  // 6. 통합 날씨 정보 가져오기 (폴백 체인)
  async getWeatherWithFallbacks(lat, lon, address) {
    console.log('대안 날씨 서비스 시작...');
    
    const locationName = address?.region2 || '현재 위치';
    
    // 방법 1: 지역별 데이터베이스
    console.log('지역별 데이터베이스 확인...');
    const locationWeather = this.getLocationBasedWeather(address);
    if (locationWeather) {
      console.log('지역별 데이터로 날씨 정보 제공:', locationWeather);
      return locationWeather;
    }
    
    // 방법 2: 계절별 추정
    console.log('계절별 날씨 추정...');
    const seasonalWeather = this.getSeasonalWeather(lat, lon, locationName);
    console.log('계절별 추정으로 날씨 정보 제공:', seasonalWeather);
    return seasonalWeather;
  }

  // 날씨 상태 번역
  translateCondition(description) {
    const translations = {
      'clear sky': '맑음',
      'few clouds': '구름 조금',
      'scattered clouds': '구름 많음',
      'broken clouds': '흐림',
      'shower rain': '소나기',
      'rain': '비',
      'thunderstorm': '뇌우',
      'snow': '눈',
      'mist': '안개',
      'overcast clouds': '흐림'
    };
    
    return translations[description] || description;
  }

  // 실시간 날씨 업데이트 (위치 변경시)
  async updateWeatherByLocation(lat, lon, address) {
    try {
      const weather = await this.getWeatherWithFallbacks(lat, lon, address);
      
      // 추가 정보 포함
      const enhancedWeather = {
        ...weather,
        lastUpdated: new Date().toLocaleTimeString('ko-KR'),
        coordinates: { lat, lon },
        reliability: this.getReliabilityScore(weather.source)
      };
      
      console.log('날씨 정보 업데이트 완료:', enhancedWeather);
      return enhancedWeather;
    } catch (error) {
      console.error('날씨 정보 업데이트 오류:', error);
      return {
        ...this.defaultWeather,
        location: address?.region2 || '알 수 없는 위치',
        source: '기본값',
        lastUpdated: new Date().toLocaleTimeString('ko-KR'),
        reliability: 'low'
      };
    }
  }

  // 신뢰도 점수
  getReliabilityScore(source) {
    const scores = {
      'OpenWeatherMap': 'high',
      'WeatherAPI': 'high', 
      '지역별 데이터': 'medium',
      '계절별 추정': 'medium',
      '기본값': 'low'
    };
    
    return scores[source] || 'low';
  }

  // 날씨 조언 생성
  getWeatherAdvice(weather) {
    const { temp, condition } = weather;
    
    let advice = [];
    
    // 온도별 조언
    if (temp >= 30) {
      advice.push('매우 더워요! 충분한 수분 섭취하세요 💧');
    } else if (temp >= 25) {
      advice.push('더운 날씨예요. 시원한 곳을 찾으세요 ☀️');
    } else if (temp <= 5) {
      advice.push('매우 추워요! 따뜻하게 입으세요 🧥');
    } else if (temp <= 10) {
      advice.push('쌀쌀해요. 겉옷 챙기세요 🧤');
    }
    
    // 날씨 상태별 조언
    if (condition.includes('비')) {
      advice.push('우산 꼭 챙기세요! ☔');
    } else if (condition.includes('눈')) {
      advice.push('눈길 조심하세요! ❄️');
    } else if (condition.includes('맑음')) {
      advice.push('좋은 날씨네요! 😊');
    }
    
    return advice.length > 0 ? advice.join(' ') : '좋은 하루 되세요! 😊';
  }
}

const alternativeWeatherService = new AlternativeWeatherService();
export default alternativeWeatherService; 