import { API_CONFIG } from '../config/app.config';
import alternativeWeatherService from './alternativeWeatherService.js';

class WeatherService {
  constructor() {
    this.defaultWeather = {
      temp: 24,
      condition: '확인 중...',
      location: '서울'
    };
  }

  async getCurrentWeather(lat = 37.5665, lon = 126.9780, address = null) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    
    console.log('날씨 정보 가져오기 시작:', { lat, lon, hasApiKey: !!apiKey });
    
    try {
      // 1단계: OpenWeatherMap API 시도 (API 키가 있을 때)
      if (apiKey && apiKey !== 'your_weather_api_key_here') {
        console.log('OpenWeatherMap API 시도...');
        const owmResult = await this.getOpenWeatherMap(lat, lon, apiKey);
        if (owmResult) {
          console.log('OpenWeatherMap API 성공:', owmResult);
          return owmResult;
        }
      } else {
        console.log('날씨 API 키가 없습니다');
      }
      
      // 2단계: 대안 날씨 서비스 사용 (마지막 폴백)
      console.log('대안 날씨 서비스 사용...');
      const alternativeResult = await alternativeWeatherService.updateWeatherByLocation(lat, lon, address);
      console.log('대안 서비스 성공:', alternativeResult);
      return alternativeResult;
      
    } catch (error) {
      console.error('모든 날씨 서비스 실패:', error);
      
      // 3단계: 최종 기본값 (추정 날씨)
      console.log('최종 기본값 사용...');
      const fallbackWeather = alternativeWeatherService.getSeasonalWeather(lat, lon, address?.region2 || '알 수 없는 위치');
      console.log('기본값 날씨:', fallbackWeather);
      return fallbackWeather;
    }
  }

  async getOpenWeatherMap(lat, lon, apiKey) {
    try {
      const response = await fetch(
        `${API_CONFIG.WEATHER.OPENWEATHER_ENDPOINT}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`
      );
      
      if (!response.ok) {
        throw new Error('OpenWeatherMap API 호출 실패');
      }
      
      const data = await response.json();
      
      return {
        temp: Math.round(data.main.temp),
        condition: this.translateCondition(data.weather[0].description),
        location: data.name || '서울'
      };
    } catch (error) {
      console.error('OpenWeatherMap API 오류:', error);
      throw error;
    }
  }

  getPtyCondition(ptyValue) {
    const conditions = {
      '0': '맑음',
      '1': '비',
      '2': '비/눈',
      '3': '눈',
      '4': '소나기'
    };
    return conditions[ptyValue] || '맑음';
  }

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
      'mist': '안개'
    };
    
    return translations[description] || description;
  }

  // 디버깅용 - API 키와 설정 확인
  checkApiConfig() {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    console.log('날씨 API 설정 확인:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'N/A'
    });
    return {
      configured: !!apiKey && apiKey !== 'your_weather_api_key_here',
      service: 'OpenWeatherMap + Alternative Weather'
    };
  }
}

const weatherService = new WeatherService();
export default weatherService;