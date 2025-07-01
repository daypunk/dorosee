#!/usr/bin/env node

// API 테스트 스크립트
const fs = require('fs');
const path = require('path');

// .env.local 파일 읽기
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envLines = envFile.split('\n');
  
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
  
  console.log('✅ .env.local 파일 로드됨');
} else {
  console.log('⚠️ .env.local 파일을 찾을 수 없습니다');
}

// 환경변수 확인
console.log('\n🔧 환경변수 확인:');
const checkVar = (name, envName) => {
  const value = process.env[envName];
  if (value) {
    console.log(`✅ ${name}: ${value.slice(0, 8)}...${value.slice(-4)}`);
    return true;
  } else {
    console.log(`❌ ${name}: 없음`);
    return false;
  }
};

const hasWeatherKey = checkVar('날씨 API', 'VITE_WEATHER_API_KEY');
const hasKakaoKey = checkVar('카카오 API', 'VITE_KAKAO_API_KEY');
const hasOpenaiKey = checkVar('OpenAI API', 'VITE_OPENAI_API_KEY');

// 날씨 API 테스트
async function testWeatherAPI() {
  console.log('\n🌤️ 날씨 API 테스트 시작...');
  
  if (!hasWeatherKey) {
    console.log('❌ 날씨 API 키가 없어서 테스트를 건너뜁니다');
    return;
  }
  
  try {
    // 기상청 API 테스트
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hour = String(today.getHours()).padStart(2, '0');
    const minute = String(today.getMinutes()).padStart(2, '0');
    
    const tm1 = `${year}${month}${day}${hour}${minute}`;
    const stn_id = '108'; // 서울
    const apiKey = process.env.VITE_WEATHER_API_KEY;
    
    const url = `https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min?tm1=${tm1}&tm2=${tm1}&stn=${stn_id}&disp=0&help=1&authKey=${apiKey}`;
    
    console.log('📡 기상청 API 호출 중...');
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ 기상청 API 응답 성공');
      console.log('📊 응답 데이터 샘플:', data.substring(0, 200) + '...');
      
      const lines = data.trim().split('\n');
      if (lines.length > 1) {
        const weatherData = lines[1].split(/\s+/);
        if (weatherData.length >= 3) {
          const temp = weatherData[2];
          console.log(`🌡️ 현재 서울 기온: ${temp}°C`);
        }
      }
    } else {
      console.log(`❌ 기상청 API 오류: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ 날씨 API 테스트 실패:', error.message);
  }
}

// 카카오맵 API 테스트
async function testKakaoAPI() {
  console.log('\n🗺️ 카카오맵 API 테스트 시작...');
  
  if (!hasKakaoKey) {
    console.log('❌ 카카오 API 키가 없어서 테스트를 건너뜁니다');
    return;
  }
  
  try {
    const lat = 37.5665; // 서울시청 위도
    const lng = 126.9780; // 서울시청 경도
    const apiKey = process.env.VITE_KAKAO_API_KEY;
    
    // 1. 좌표 → 주소 변환 테스트
    console.log('1️⃣ 좌표 → 주소 변환 테스트...');
    const addressUrl = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
    
    const addressResponse = await fetch(addressUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });
    
    if (addressResponse.ok) {
      const addressData = await addressResponse.json();
      if (addressData.documents && addressData.documents.length > 0) {
        const address = addressData.documents[0].address.address_name;
        console.log(`✅ 주소 변환 성공: ${address}`);
      } else {
        console.log('⚠️ 주소 변환 결과 없음');
      }
    } else {
      console.log(`❌ 주소 변환 API 오류: ${addressResponse.status}`);
    }
    
    // 2. 주변 지하철역 검색 테스트
    console.log('2️⃣ 주변 지하철역 검색 테스트...');
    const stationUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=SW8&x=${lng}&y=${lat}&radius=1000&sort=distance&size=5`;
    
    const stationResponse = await fetch(stationUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });
    
    if (stationResponse.ok) {
      const stationData = await stationResponse.json();
      console.log(`✅ 지하철역 검색 성공: ${stationData.documents.length}개 발견`);
      stationData.documents.slice(0, 3).forEach((station, index) => {
        console.log(`  ${index + 1}. ${station.place_name} (${station.distance}m)`);
      });
    } else {
      console.log(`❌ 지하철역 검색 API 오류: ${stationResponse.status}`);
    }
    
    // 3. 주변 편의점 검색 테스트
    console.log('3️⃣ 주변 편의점 검색 테스트...');
    const storeUrl = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CS2&x=${lng}&y=${lat}&radius=500&sort=distance&size=5`;
    
    const storeResponse = await fetch(storeUrl, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`
      }
    });
    
    if (storeResponse.ok) {
      const storeData = await storeResponse.json();
      console.log(`✅ 편의점 검색 성공: ${storeData.documents.length}개 발견`);
      storeData.documents.slice(0, 3).forEach((store, index) => {
        console.log(`  ${index + 1}. ${store.place_name} (${store.distance}m)`);
      });
    } else {
      console.log(`❌ 편의점 검색 API 오류: ${storeResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ 카카오맵 API 테스트 실패:', error.message);
  }
}

// OpenAI API 테스트
async function testOpenAIAPI() {
  console.log('\n🤖 OpenAI API 테스트 시작...');
  
  if (!hasOpenaiKey) {
    console.log('❌ OpenAI API 키가 없어서 테스트를 건너뜁니다');
    return;
  }
  
  try {
    const apiKey = process.env.VITE_OPENAI_API_KEY;
    
    console.log('📡 OpenAI API 호출 중...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 도로시라는 도시 안전 로봇입니다. 간단히 인사해주세요.'
          },
          {
            role: 'user',
            content: 'API 테스트 중입니다. 간단히 인사해주세요.'
          }
        ],
        max_tokens: 50
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const message = data.choices[0].message.content;
      console.log('✅ OpenAI API 성공');
      console.log(`🤖 도로시 응답: ${message}`);
    } else {
      console.log(`❌ OpenAI API 오류: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ OpenAI API 테스트 실패:', error.message);
  }
}

// 메인 테스트 실행
async function runAllTests() {
  console.log('🧪 도로시 API 종합 테스트 시작\n');
  console.log('=' .repeat(50));
  
  await testWeatherAPI();
  await testKakaoAPI();
  await testOpenAIAPI();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 모든 API 테스트 완료!');
  console.log('\n💡 브라우저에서도 테스트하려면:');
  console.log('  1. http://localhost:5173 접속');
  console.log('  2. 개발자 도구 → 콘솔 탭 열기');
  console.log('  3. doroseeTest.help() 명령어 실행');
}

// 스크립트 실행
runAllTests().catch(console.error); 