import { API_CONFIG, KEYWORDS } from '../config/app.config';
import { retryOperation } from '../utils/helpers';
import kakaoLocationService from './kakaoLocationService';
import accessibilityWeatherService from './accessibilityWeatherService';

class AIService {
  constructor() {
    // 친근하고 따뜻한 기본 응답
    this.defaultResponses = {
      안녕: [
        "안녕하세요! 저는 도로시예요~ 오늘 어디 가시는 길인가요?",
        "안녕하세요! 도로시입니다. 길 안내나 날씨 정보 같은 거 도움이 필요하시면 언제든 말씀해주세요!",
        "안녕하세요~ 도로시예요! 혹시 주변에 찾는 곳이 있으시면 도와드릴게요!"
      ],
      날씨: [
        "지금 날씨 정보가 필요하시군요! 어느 지역 날씨가 궁금하신가요?",
        "날씨 확인해드릴게요! 현재 위치 날씨를 알려드릴까요?"
      ],
      길: [
        "어디로 가시려고 하시나요? 길 안내 도와드릴게요!",
        "목적지를 알려주시면 가는 방법을 찾아드릴게요~"
      ],
      지하철: [
        "어느 역으로 가시나요? 가장 가까운 지하철역을 찾아드릴게요!",
        "지하철 정보 필요하시군요! 어느 방향으로 가시는지 알려주세요~"
      ],
      기능: [
        "저는 길 안내, 날씨 정보, 주변 편의시설 찾기를 도와드려요! 안전한 이동도 항상 신경 쓰고 있어요~",
        "주변 지하철역이나 편의점 찾기, 날씨 정보 제공이 제 전문이에요! 필요한 게 있으시면 언제든 말씀해주세요!"
      ],
      고마워: [
        "천만에요! 또 도움이 필요하시면 언제든 불러주세요~",
        "별말씀을요! 안전하게 잘 다니세요!",
        "도움이 되었다니 다행이에요! 좋은 하루 되세요~"
      ],
      안전: [
        "네, 주변을 잘 살피시고 안전하게 다니세요! 혹시 어두운 길이면 밝은 곳으로 다니시는 게 좋아요.",
        "안전이 가장 중요하죠! 낯선 길에서는 항상 주의하시고, 필요하면 도움을 요청하세요."
      ]
    };

    this.nonSpecialtyTopics = {
      '고등학문': ['미적분', '적분', '미분방정식', '선형대수', '확률통계', '물리학', '양자역학'],
      '전문역사': ['중세사', '고대사', '근현대사', '세계대전', '한국전쟁', '조선왕조'],
      '전문언어': ['라틴어', '그리스어', '아랍어', '러시아어', '독일어'],
      '전문문학': ['서양문학', '고전문학', '현대문학', '시문학', '소설창작'],
      '전문철학': ['서양철학', '동양철학', '인식론', '존재론', '윤리학'],
      '전문요리': ['프랑스요리', '이탈리아요리', '일식요리', '중식요리', '베이킹'],
      '전문스포츠': ['프로스포츠', '올림픽', '월드컵', '전술분석', '선수데이터'],
      '전문게임': ['게임개발', '유니티', '언리얼엔진', '게임디자인', '롤'],
      '개인정보': ['연애', '남친', '여친', '결혼', '애인', '사랑'],
      '오락': ['영화', '드라마', '아이돌', '연예인', '케이팝']
    };

    // 친근하고 정중한 거절 메시지
    this.quickRejections = [
      "아, 그 부분은 제가 잘 모르겠어요. 대신 길 안내나 날씨 정보는 도와드릴 수 있어요!",
      "죄송해요, 그런 건 잘 모르지만 주변 편의점이나 지하철역 찾기는 도와드릴게요~",
      "음... 그건 제 전문 분야가 아니네요. 혹시 어디 가시는 길이면 도와드릴 수 있어요!",
      "제가 그런 건 잘 모르겠어요. 하지만 안전한 길 찾기나 날씨 정보는 언제든 물어보세요!"
    ];
  }

  // 🎯 짧은 위치 기반 응답 생성
  async generateLocationBasedResponse(userInput, location, currentWeatherData = null) {
    try {
      // 날씨 관련 위치 질문
      if (accessibilityWeatherService.isWeatherQuery(userInput)) {
        if (currentWeatherData) {
          return this.generateWeatherResponseFromData(currentWeatherData, userInput);
        }
        return await accessibilityWeatherService.getSimpleWeatherResponse(userInput);
      }
        
      // 주변 정보 검색 (편의점, 지하철역 등)
      return await kakaoLocationService.searchNearbyWithAdvice(userInput, location.latitude, location.longitude);
        
    } catch (error) {
      console.error('위치 기반 응답 오류:', error);
      return "죄송해요, 지금 그 정보를 확인하기 어려워요. 혹시 찾으시는 곳의 구체적인 주소나 동네 이름을 알려주시면 도와드릴게요!";
    }
  }

  async generateResponse(userInput, accessibilityProfile = {}, currentWeatherData = null) {
    const inputLower = userInput.toLowerCase();

    // 1. 이름 질문 - 친근한 자기소개
    if (this.isNameQuestion(inputLower)) {
      const introResponses = [
        "안녕하세요! 저는 도로시예요~ 거리에서 시민분들에게 길 안내하고 안전 정보 알려드리는 일을 하고 있어요! 혹시 어디 가시는 길인가요?",
        "도로시라고 해요! 주변 편의점이나 지하철역 찾기, 날씨 정보 같은 거 도와드리는 게 제 일이에요. 필요한 거 있으시면 언제든 말씀해주세요~",
        "저는 도로시입니다! 이 동네에서 길 안내하고 안전 정보 알려드리고 있어요. 오늘 어디 가시려고 하시나요?"
      ];
      return introResponses[Math.floor(Math.random() * introResponses.length)];
    }

    // 2. 날씨 질문 - 현재 데이터 우선 사용
    if (accessibilityWeatherService.isWeatherQuery(userInput)) {
      try {
        // 전달받은 현재 날씨 데이터가 있으면 우선 사용
        if (currentWeatherData) {
          const response = this.generateWeatherResponseFromData(currentWeatherData, userInput);
          return response;
        }
        // 없으면 기존 방식 사용
        const weatherResponse = await accessibilityWeatherService.getSimpleWeatherResponse(userInput, accessibilityProfile);
        return weatherResponse;
      } catch (error) {
        console.error('날씨 서비스 오류:', error);
        return "죄송해요, 지금 날씨 정보를 가져오기 어려워요. 다른 도움이 필요하시면 말씀해주세요!";
      }
    }

    // 3. 위치 서비스 - 편의점, 길찾기 등
    if (this.needsLocationService(userInput)) {
      try {
        // 현재 위치 정보가 있으면 위치 기반 응답 생성
        if (accessibilityProfile.location) {
          const locationResponse = await this.generateLocationBasedResponse(
            userInput, 
            accessibilityProfile.location, 
            currentWeatherData
          );
          return locationResponse;
        } else {
          return "위치 정보를 받을 수 있다면 더 정확한 길 안내를 해드릴 수 있어요! 혹시 현재 계시는 동네나 주소를 알려주시겠어요?";
        }
      } catch (error) {
        console.error('위치 서비스 오류:', error);
        return "죄송해요, 지금 위치 정보를 확인하기 어려워요. 혹시 찾으시는 곳의 구체적인 주소나 동네 이름을 알려주시면 도와드릴게요!";
      }
    }

    // 4. 비전문 분야 - 빠른 거절 (유지)
    const nonSpecialtyTopic = this.checkNonSpecialtyTopic(inputLower);
    if (nonSpecialtyTopic) {
      return this.quickRejections[Math.floor(Math.random() * this.quickRejections.length)];
    }

    // 5. 전문 분야 체크
    const isSpecialty = this.isSpecialtyTopic(inputLower);

    // 6. OpenAI API 호출 - 모든 질문 통합 처리
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (openaiKey && openaiKey.startsWith('sk-')) {
      try {
        const response = await retryOperation(() => this.callOpenAI(userInput, isSpecialty), 2);
        return response;
      } catch (error) {
        console.error('OpenAI API 호출 오류:', error.message);
      }
    }

    // 7. 로컬 응답
    return this.getLocalResponse(inputLower);
  }

  isNameQuestion(inputLower) {
    const nameKeywords = ['이름', '누구', '자기소개', '네이름', '니이름', '이름이'];
    return nameKeywords.some(keyword => inputLower.includes(keyword)) && 
           (inputLower.includes('뭐') || inputLower.includes('누구') || inputLower.includes('소개'));
  }

  checkNonSpecialtyTopic(inputLower) {
    for (const [topic, keywords] of Object.entries(this.nonSpecialtyTopics)) {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        return topic;
      }
    }
    return null;
  }

  isSpecialtyTopic(inputLower) {
    return KEYWORDS.SPECIALTY.some(keyword => inputLower.includes(keyword));
  }

  // OpenAI API - 기본 질문용 (친근한 도심 커뮤니케이터)  
  async callOpenAI(userInput, isSpecialty) {
    const response = await fetch(API_CONFIG.OPENAI.ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: API_CONFIG.OPENAI.MODEL,
        messages: [
          {
            role: 'system',
            content: isSpecialty ? 
              `당신은 '도로시'라는 친근한 도심 커뮤니케이터입니다. 시민들에게 도움을 주는 것이 목표예요.

전문 분야 (안전, 길안내, 날씨, 실시간 정보 등):
- 따뜻하고 도움이 되는 답변을 해주세요
- 실용적인 팁이나 안전 조언도 함께 제공해주세요  
- 마치 친근한 이웃이 조언해주는 것처럼 자연스럽게 말하세요
- 추가 도움이 필요한지 물어보는 배려를 보여주세요
- 실시간 정보를 모르는 경우, 솔직하게 말하되 대안을 제시해주세요` :
              `당신은 '도로시'라는 친근한 도심 커뮤니케이터입니다. 

일반적인 대화나 질문:
- 자연스럽고 친근하게 대화하세요
- 도움이 될 만한 정보가 있다면 제공해주세요
- 모르는 것은 솔직하게 인정하되, 내가 도울 수 있는 분야를 안내해주세요
- 존댓말을 사용하되 딱딱하지 않게, 편안한 느낌으로 말하세요
- 궁금한 게 더 있는지 물어보며 계속 도움을 주려는 자세를 보여주세요`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 350,
        temperature: 0.8
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const result = data.choices[0].message.content.trim();
      return result;
    } else {
      const errorText = await response.text();
      console.error('OpenAI API 오류:', response.status, errorText);
      throw new Error(`OpenAI API 호출 실패: ${response.status} ${response.statusText}`);
    }
  }

  // 🎯 로컬 응답 - 자연스러운 길이
  getLocalResponse(inputLower) {
    for (const [keyword, responseArray] of Object.entries(this.defaultResponses)) {
      if (inputLower.includes(keyword)) {
        let response = responseArray[Math.floor(Math.random() * responseArray.length)];
        return response; // 길이 제한 제거
      }
    }

    const defaultHelp = [
      "혹시 길 안내나 날씨 정보가 필요하시면 언제든 말씀해주세요!",
      "주변에 찾는 곳이 있으시거나 날씨가 궁금하시면 도와드릴게요~",
      "안전한 길 찾기나 편의시설 위치 같은 거 필요하시면 알려주세요!",
      "어디 가시는 길인지 알려주시면 도움이 될만한 정보 찾아드릴게요!"
    ];
    return defaultHelp[Math.floor(Math.random() * defaultHelp.length)];
  }

  // 전달받은 날씨 데이터로 친근한 응답 생성
  generateWeatherResponseFromData(weatherData, userInput) {
    const { temp, condition, location } = weatherData;
    const advice = this.getWeatherAdvice(temp, condition);
    
    // 친근하고 도움이 되는 응답
    const responses = [
      `${location} 날씨는 ${condition}이고 ${temp}도예요. ${advice} 어디 가시는 길인가요?`,
      `지금 ${condition}에 ${temp}도네요! ${advice} 안전하게 다니세요~`,
      `현재 ${condition}, 기온은 ${temp}도입니다. ${advice} 도움이 더 필요하시면 말씀해주세요!`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 위치 서비스가 필요한 질문인지 확인
  needsLocationService(userInput) {
    const locationKeywords = ['길', '가는법', '지하철', '역', '버스', '편의점', '위치', '어디', '주변'];
    const inputLower = userInput.toLowerCase();
    return locationKeywords.some(keyword => inputLower.includes(keyword));
  }

  // 날씨별 조언 생성
  getWeatherAdvice(temp, condition) {
    let advice = '';
    
    // 온도별 조언
    if (temp >= 28) {
      advice = '매우 더워요! 시원한 옷을 입고 수분 섭취를 충분히 하세요.';
    } else if (temp >= 23) {
      advice = '따뜻해요. 얇은 긴팔이나 반팔이 좋겠어요.';
    } else if (temp >= 17) {
      advice = '선선해요. 가벼운 외투를 준비하세요.';
    } else if (temp >= 10) {
      advice = '쌀쌀해요. 따뜻한 옷을 입으세요.';
    } else {
      advice = '춥습니다! 두꺼운 옷과 목도리를 챙기세요.';
    }
    
    // 날씨 상태별 추가 조언
    if (condition.includes('비') || condition.includes('소나기')) {
      advice += ' 우산을 꼭 챙기세요!';
    } else if (condition.includes('눈')) {
      advice += ' 미끄러우니 조심히 다니세요!';
    } else if (condition.includes('맑음')) {
      advice += ' 좋은 날씨네요!';
    }
    
    return advice;
  }
}

const aiService = new AIService();
export default aiService;