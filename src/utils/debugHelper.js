// 브라우저 콘솔에서 사용할 디버깅 헬퍼

// OpenAI API 직접 테스트
window.testOpenAI = async (message = "코엑스 가는 법 알려줘") => {
  console.log('🔍 OpenAI API 직접 테스트...');
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  console.log('API 키 상태:', apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : '❌ 없음');
  
  if (!apiKey || !apiKey.startsWith('sk-')) {
    console.error('❌ OpenAI API 키가 없거나 형식이 잘못됨');
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
    
    console.log('📡 응답 상태:', response.status, response.statusText);
    
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

// 카카오맵 API 테스트
window.testKakaoMap = async () => {
  console.log('🗺️ 카카오맵 API 테스트...');
  
  const apiKey = import.meta.env.VITE_KAKAO_API_KEY;
  console.log('카카오 API 키 상태:', apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '❌ 없음');
  
  if (!apiKey) {
    console.error('❌ 카카오 API 키가 없음');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=코엑스&x=127.0276&y=37.5665&radius=50000&sort=distance&size=5`,
      {
        headers: {
          'Authorization': `KakaoAK ${apiKey}`
        }
      }
    );
    
    console.log('📡 카카오맵 응답 상태:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 카카오맵 성공:', data.documents.length, '개 결과');
      console.log('첫 번째 결과:', data.documents[0]?.place_name);
      return data;
    } else {
      const errorText = await response.text();
      console.error('❌ 카카오맵 오류:', errorText);
      return null;
    }
  } catch (error) {
    console.error('💥 카카오맵 예외:', error);
    return null;
  }
};

// aiService 직접 테스트
window.testAiService = async (message = "코엑스 가는 법 알려줘") => {
  console.log('🤖 aiService 직접 테스트...');
  
  try {
    const { default: aiService } = await import('../services/aiService.js');
    console.log('📝 입력:', message);
    
    const response = await aiService.generateResponse(message);
    console.log('✅ aiService 응답:', response);
    return response;
  } catch (error) {
    console.error('💥 aiService 오류:', error);
    console.error('세부 오류:', error.message, error.stack);
    return null;
  }
};

// 통합 진단
window.runDiagnostics = async () => {
  console.log('🔧 도로시 통합 진단 시작...');
  console.log('='.repeat(50));
  
  // 1. 환경변수 체크
  console.log('1️⃣ 환경변수 체크');
  const envVars = {
    'OPENAI_API_KEY': import.meta.env.VITE_OPENAI_API_KEY,
    'KAKAO_API_KEY': import.meta.env.VITE_KAKAO_API_KEY,
    'WEATHER_API_KEY': import.meta.env.VITE_WEATHER_API_KEY
  };
  
  for (const [name, value] of Object.entries(envVars)) {
    if (value) {
      console.log(`✅ ${name}: ${value.slice(0, 8)}...${value.slice(-4)}`);
    } else {
      console.log(`❌ ${name}: 없음`);
    }
  }
  
  console.log('\n2️⃣ OpenAI API 테스트');
  await window.testOpenAI();
  
  console.log('\n3️⃣ 카카오맵 API 테스트'); 
  await window.testKakaoMap();
  
  console.log('\n4️⃣ aiService 통합 테스트');
  await window.testAiService();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 진단 완료');
};

console.log('🛠️ 디버깅 헬퍼 로드됨');
console.log('사용법:');
console.log('- window.testOpenAI() - OpenAI API 테스트');
console.log('- window.testKakaoMap() - 카카오맵 API 테스트');  
console.log('- window.testAiService() - aiService 테스트');
console.log('- window.runDiagnostics() - 전체 진단'); 