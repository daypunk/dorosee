import coordinateConverter from '../utils/coordinateConverter';

class WeatherService {
  constructor() {
    // 환경에 따른 API 엔드포인트 설정
    this.baseUrl = window.location.hostname === 'localhost'
      ? '/weather-api/1360000/VilageFcstInfoService_2.0/getVilageFcst'  // 로컬: 프록시 사용
      : 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';  // 프로덕션: 직접 호출
    
    this.defaultWeather = {
      temp: 24,
      condition: '확인 중...',
      location: '서울'
    };
  }

  async getCurrentWeather(lat = 37.5665, lon = 126.9780, address = null) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    
    console.log('기상청 날씨 정보 가져오기 시작:', { lat, lon, hasApiKey: !!apiKey });
    
    if (!apiKey || apiKey === 'your_weather_api_key_here') {
      throw new Error('기상청 API 키가 설정되지 않았습니다');
    }

    console.log('✅ 기상청 API 키 확인됨 (길이:', apiKey.length, '자)');

    try {
      console.log('기상청 단기예보 API 호출...');
      const kmaResult = await this.getKMAWeather(lat, lon, apiKey);
      console.log('기상청 API 성공:', kmaResult);
      return kmaResult;
      
    } catch (error) {
      console.error('기상청 API 실패:', error.message);
      throw error; // 기본값 반환하지 않고 오류 그대로 전파
    }
  }

  async getKMAWeather(lat, lon, apiKey) {
    try {
      // GPS 좌표를 기상청 격자 좌표로 변환
      const { nx, ny } = coordinateConverter.convertToGrid(lat, lon);
      const { baseDate, baseTime } = coordinateConverter.getBaseDateTime();
      
      console.log('기상청 API 요청 파라미터:', { nx, ny, baseDate, baseTime });
      
      // API 키 사용 (원본 키가 .env.local에 저장됨)
      const processedApiKey = apiKey; // 디코딩 과정 없이 바로 사용
      console.log('원본 API 키 사용 - URLSearchParams가 자동 인코딩 처리');
      
      // 기상청 단기예보 API 호출
      const params = new URLSearchParams({
        serviceKey: processedApiKey,
        numOfRows: '1000',
        pageNo: '1',
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: nx.toString(),
        ny: ny.toString()
      });
      
      const apiUrl = `${this.baseUrl}?${params}`;
      console.log('기상청 API 요청 URL (키 마스킹):', apiUrl.replace(processedApiKey, '***API_KEY***'));
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('기상청 API 응답 상태:', response.status, response.statusText);
      console.log('응답 헤더 Content-Type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('기상청 API 오류 응답 (첫 500자):', errorText.substring(0, 500));
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
      }
      
      // 응답 텍스트를 먼저 확인
      const responseText = await response.text();
      console.log('기상청 API 응답 텍스트 (첫 300자):', responseText.substring(0, 300));
      
      // HTML 응답 체크
      if (responseText.includes('<html>') || responseText.includes('<OpenAPI_S')) {
        console.error('❌ HTML 응답 감지! API 키나 요청 방식에 문제가 있습니다.');
        console.log('전체 HTML 응답:', responseText);
        throw new Error('기상청 API가 HTML을 반환했습니다. API 키를 확인하세요.');
      }
      
      // JSON 파싱 시도
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON 파싱 실패:', jsonError);
        console.log('파싱 실패한 응답 전체:', responseText);
        throw new Error('기상청 API 응답이 유효한 JSON이 아닙니다');
      }
      
      console.log('기상청 API 파싱 성공:', data);
      
      // API 응답 체크
      if (data.response?.header?.resultCode !== '00') {
        const errorCode = data.response?.header?.resultCode;
        const errorMsg = data.response?.header?.resultMsg || 'Unknown error';
        console.error(`기상청 API 오류: ${errorCode} - ${errorMsg}`);
        throw new Error(`기상청 API 오류: ${errorCode} - ${errorMsg}`);
      }
      
      const items = data.response?.body?.items?.item || [];
      if (items.length === 0) {
        throw new Error('기상청 API에서 데이터를 찾을 수 없습니다');
      }
      
      console.log(`기상청 API 데이터 ${items.length}개 항목 수신`);
      
      // 현재 시간에 가장 가까운 예보 데이터 파싱
      const weatherData = this.parseKMAData(items);
      
      return {
        temp: weatherData.temperature,
        condition: weatherData.condition,
        location: this.getLocationName(lat, lon),
        source: '기상청',
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        precipitationType: weatherData.precipitationType
      };
      
    } catch (error) {
      console.error('기상청 API 호출 오류:', error.message);
      throw error;
    }
  }

  // 기상청 API 응답 데이터 파싱
  parseKMAData(items) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 현재 시간에 가장 가까운 예보 시간 찾기
    let targetTime = String(currentHour).padStart(2, '0') + '00';
    
    // 각 항목별 최신 데이터 추출
    const weatherInfo = {
      temperature: null,
      sky: null,
      pty: null,
      humidity: null,
      windSpeed: null
    };
    
    for (const item of items) {
      const fcstTime = item.fcstTime;
      const category = item.category;
      const fcstValue = item.fcstValue;
      
      // 현재 시간 또는 가장 가까운 미래 시간 데이터 우선 사용
      if (fcstTime >= targetTime) {
        switch (category) {
          case 'TMP': // 1시간 기온
            if (weatherInfo.temperature === null) {
              weatherInfo.temperature = parseInt(fcstValue);
            }
            break;
          case 'SKY': // 하늘상태
            if (weatherInfo.sky === null) {
              weatherInfo.sky = parseInt(fcstValue);
            }
            break;
          case 'PTY': // 강수형태
            if (weatherInfo.pty === null) {
              weatherInfo.pty = parseInt(fcstValue);
            }
            break;
          case 'REH': // 습도
            if (weatherInfo.humidity === null) {
              weatherInfo.humidity = parseInt(fcstValue);
            }
            break;
          case 'WSD': // 풍속
            if (weatherInfo.windSpeed === null) {
              weatherInfo.windSpeed = parseFloat(fcstValue);
            }
            break;
        }
      }
    }
    
    // 날씨 상태 결정 (강수형태 우선, 하늘상태 보조)
    const condition = this.getWeatherCondition(weatherInfo.pty, weatherInfo.sky);
    
    return {
      temperature: weatherInfo.temperature || 20,
      condition: condition,
      humidity: weatherInfo.humidity || 50,
      windSpeed: weatherInfo.windSpeed || 0,
      precipitationType: this.getPrecipitationType(weatherInfo.pty)
    };
  }

  // 강수형태와 하늘상태로 날씨 조건 결정
  getWeatherCondition(pty, sky) {
    // 강수형태 우선 판단
    if (pty !== null && pty > 0) {
      switch (pty) {
        case 1: return '비';
        case 2: return '비/눈';
        case 3: return '눈';
        case 4: return '소나기';
        default: return '비';
      }
    }
    
    // 강수가 없으면 하늘상태로 판단 (기상청 API 문서 기준)
    if (sky !== null) {
      if (sky >= 0 && sky <= 5) {
        return '맑음';
      } else if (sky >= 6 && sky <= 8) {
        return '구름많음';
      } else if (sky >= 9 && sky <= 10) {
        return '흐림';
      }
    }
    
    return '맑음';
  }

  // 강수형태 텍스트 변환
  getPrecipitationType(pty) {
    const types = {
      0: '없음',
      1: '비',
      2: '비/눈',
      3: '눈',
      4: '소나기'
    };
    return types[pty] || '없음';
  }

  // 위치명 추정
  getLocationName(lat, lon) {
    const cityCoords = coordinateConverter.getCityGridCoords();
    const { nx, ny } = coordinateConverter.convertToGrid(lat, lon);
    
    // 가장 가까운 도시 찾기
    let minDistance = Infinity;
    let closestCity = '현재 위치';
    
    for (const [cityName, coords] of Object.entries(cityCoords)) {
      const distance = Math.sqrt(Math.pow(coords.nx - nx, 2) + Math.pow(coords.ny - ny, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = cityName;
      }
    }
    
    return closestCity;
  }

  // 디버깅용 - API 키와 설정 확인
  checkApiConfig() {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    console.log('기상청 API 설정 확인:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'
    });
    return {
      configured: !!apiKey && apiKey !== 'your_weather_api_key_here',
      service: '기상청 단기예보 API'
    };
  }

  // 테스트용 직접 API 호출
  async testKMAApi(lat, lon) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('기상청 API 키가 설정되지 않았습니다');
    }

    // API 키 사용 (원본 키가 .env.local에 저장됨)
    const processedApiKey = apiKey; // 디코딩 과정 없이 바로 사용

    const { nx, ny } = coordinateConverter.convertToGrid(lat, lon);
    const { baseDate, baseTime } = coordinateConverter.getBaseDateTime();

    const params = new URLSearchParams({
      serviceKey: processedApiKey,
      numOfRows: '10',
      pageNo: '1',
      dataType: 'JSON',
      base_date: baseDate,
      base_time: baseTime,
      nx: nx.toString(),
      ny: ny.toString()
    });

    // 환경에 따른 URL 설정 (constructor와 동일)
    const testUrl = window.location.hostname === 'localhost'
      ? '/weather-api/1360000/VilageFcstInfoService_2.0/getVilageFcst'
      : 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

    const response = await fetch(`${testUrl}?${params}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // HTML 응답인 경우 그대로 반환
      data = { error: 'HTML Response', response: responseText };
    }

    return {
      status: response.status,
      statusText: response.statusText,
      data: data,
      params: { nx, ny, baseDate, baseTime },
      usedProxy: window.location.hostname === 'localhost'
    };
  }
}

const weatherService = new WeatherService();
export default weatherService;