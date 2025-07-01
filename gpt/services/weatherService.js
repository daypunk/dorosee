import { API_ENDPOINTS } from '../utils/constants';

class WeatherService {
  constructor() {
    this.defaultWeather = {
      temp: 24,
      condition: '확인 중...',
      location: '서울'
    };
  }

  // 위경도를 기상청 격자 좌표로 변환
  convertToGrid(lat, lon) {
    const RE = 6371.00877; // 지구 반경(km)
    const GRID = 5.0; // 격자 간격(km)
    const SLAT1 = 30.0; // 투영 위도1(degree)
    const SLAT2 = 60.0; // 투영 위도2(degree)
    const OLON = 126.0; // 기준점 경도(degree)
    const OLAT = 38.0; // 기준점 위도(degree)
    const XO = 43; // 기준점 X좌표(GRID)
    const YO = 136; // 기준점 Y좌표(GRID)

    const DEGRAD = Math.PI / 180.0;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    const x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return { x, y };
  }

  async getCurrentWeather(lat = 37.5665, lon = 126.9780) {
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    
    if (!apiKey || apiKey === 'your_weather_api_key_here') {
      console.log('날씨 API 키가 없어서 기본값 사용');
      return this.defaultWeather;
    }

    try {
      // 기상청 API 사용
      const result = await this.getKMAWeather(lat, lon, apiKey);
      if (result) {
        return result;
      }

      // 기상청 API 실패시 OpenWeatherMap 시도
      return await this.getOpenWeatherMap(lat, lon, apiKey);
    } catch (error) {
      console.error('날씨 정보 가져오기 실패:', error);
      return this.defaultWeather;
    }
  }

  async getKMAWeather(lat, lon, apiKey) {
    try {
      // 기상청 API는 지역 코드 기반이므로 서울(108) 사용
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hour = String(today.getHours()).padStart(2, '0');
      const minute = String(today.getMinutes()).padStart(2, '0');
      
      const tm1 = `${year}${month}${day}${hour}${minute}`;
      const tm2 = tm1; // 동일 시간으로 설정
      
      // 서울 지역 코드 (108)
      const stn_id = '108';
      
      const url = `${API_ENDPOINTS.WEATHER_KMA}?` +
        `tm1=${tm1}&` +
        `tm2=${tm2}&` +
        `stn=${stn_id}&` +
        `disp=0&` +
        `help=1&` +
        `authKey=${apiKey}`;

      console.log('기상청 API 호출 시도:', {
        url: url,
        tm1: tm1,
        tm2: tm2,
        stn_id: stn_id
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain, application/json',
          'User-Agent': 'DoroseeWeatherApp/1.0'
        }
      });
      
      console.log('기상청 API 응답 상태:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error(`기상청 API 호출 실패: ${response.status} - ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('기상청 API 응답 텍스트:', responseText);
      
      // 기상청 API는 텍스트 형식으로 데이터를 반환
      const lines = responseText.trim().split('\n');
      
      if (lines.length > 1) {
        // 두 번째 라인에 데이터가 있음
        const data = lines[1].split(/\s+/);
        
        if (data.length >= 8) {
          // 데이터 구조: 역코드 시간 기온 습도 기압 풍향 풍속 강수량
          const temp = parseFloat(data[2]); // 기온
          const humidity = parseFloat(data[3]); // 습도
          const rainfall = parseFloat(data[7]); // 강수량
          
          let condition = '맑음';
          if (rainfall > 0) {
            condition = '비';
          } else if (humidity > 80) {
            condition = '흐림';
          } else if (humidity < 40) {
            condition = '맑음';
          } else {
            condition = '구름 조금';
          }
          
          if (!isNaN(temp)) {
            console.log('기상청 날씨 데이터 파싱 성공:', { temp, condition, humidity, rainfall });
            return {
              temp: Math.round(temp),
              condition: condition,
              location: '서울'
            };
          }
        }
      }
      
      // 데이터 구조 체크
      console.warn('기상청 API 데이터 구조 이상:', {
        responseLength: responseText.length,
        lineCount: lines.length,
        firstLine: lines[0],
        secondLine: lines[1] || 'N/A'
      });
      
      throw new Error('기상청 데이터 파싱 실패');
    } catch (error) {
      console.error('기상청 API 오류 상세:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getOpenWeatherMap(lat, lon, apiKey) {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.WEATHER}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=kr`
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
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    console.log('날씨 API 설정 확인:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'N/A'
    });
    return {
      configured: !!apiKey && apiKey !== 'your_weather_api_key_here',
      service: '기상청 + OpenWeatherMap 백업'
    };
  }

  // 기상청 API 단순 테스트
  async testKMAApi() {
    const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
    if (!apiKey) {
      console.log('테스트 실패: API 키 없음');
      return false;
    }

    try {
      // 서울 시청 코드로 테스트
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hour = String(today.getHours()).padStart(2, '0');
      const minute = String(today.getMinutes()).padStart(2, '0');
      
      const tm1 = `${year}${month}${day}${hour}${minute}`;
      const stn_id = '108'; // 서울
      
      const testUrl = `${API_ENDPOINTS.WEATHER_KMA}?` + 
        `tm1=${tm1}&` +
        `tm2=${tm1}&` +
        `stn=${stn_id}&` +
        `disp=0&` +
        `help=1&` +
        `authKey=${apiKey}`;
      
      console.log('기상청 API 테스트 URL:', testUrl);
      
      const response = await fetch(testUrl);
      const data = await response.text();
      
      console.log('기상청 API 테스트 결과:', {
        status: response.status,
        ok: response.ok,
        responseText: data,
        dataLines: data.split('\n').length
      });
      
      return response.ok;
    } catch (error) {
      console.error('기상청 API 테스트 오류:', error);
      return false;
    }
  }
}

const weatherService = new WeatherService();
export default weatherService;