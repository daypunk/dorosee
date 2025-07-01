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
  async generateLocationBasedResponse(userInput, location) {
    const inputLower = userInput.toLowerCase();
    
    const locationKeywords = ['길', '가는법', '지하철', '역', '버스', '편의점', '위치', '어디', '주변'];
    const isLocationQuery = locationKeywords.some(keyword => inputLower.includes(keyword));
    
    if (isLocationQuery && location) {
      try {
        // 지하철역 검색 - 가장 가까운 1개만
        if (inputLower.includes('지하철') || inputLower.includes('역')) {
          const stations = await kakaoLocationService.searchNearbyByCategory(
            location.latitude, location.longitude, 'SW8', 1000
          );
          
          if (stations.length > 0) {
            const closest = stations[0];
            const walkTime = kakaoLocationService.calculateWalkingTime(closest.distance);
            return `가장 가까운 지하철역은 ${closest.name}이에요! 걸어서 약 ${walkTime}분 정도 걸려요. 안전하게 가세요~`;
          }
          return "아쉽게도 근처에 지하철역이 없네요. 혹시 버스정류장이나 다른 교통수단 정보가 필요하시면 말씀해주세요!";
        }
        
        // 편의점 검색 - 가장 가까운 1개만
        if (inputLower.includes('편의점')) {
          const stores = await kakaoLocationService.searchNearbyByCategory(
            location.latitude, location.longitude, 'CS2', 800
          );
          
          if (stores.length > 0) {
            const closest = stores[0];
            const walkTime = kakaoLocationService.calculateWalkingTime(closest.distance);
            return `바로 근처에 ${closest.name}이 있어요! 걸어서 ${walkTime}분이면 도착해요. 필요한 거 있으시면 들러보세요~`;
          }
          return "아쉽게도 가까운 편의점이 없네요. 조금 더 걸어가시면 찾을 수 있을 거예요!";
        }
        
        // 위치 정보
        if (inputLower.includes('위치') || inputLower.includes('어디')) {
          const address = await kakaoLocationService.getCurrentAddress(location.latitude, location.longitude);
          const shortAddress = kakaoLocationService.getShortAddress(address);
          return `지금 계신 곳은 ${shortAddress}이에요! 주변에 어디 가고 싶은 곳이 있으시면 알려주세요~`;
        }
        
      } catch (error) {
        console.error('위치 서비스 오류:', error);
        return "아쉽게도 위치 정보를 가져올 수 없네요. 혹시 다른 도움이 필요하시면 말씀해주세요!";
      }
    }
    
    return await this.generateResponse(userInput);
  }

  async generateResponse(userInput, accessibilityProfile = {}) {
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

    // 2. 날씨 질문 - 응답 길이 제한
    if (accessibilityWeatherService.isWeatherQuery(userInput)) {
      try {
        const weatherResponse = await accessibilityWeatherService.getSimpleWeatherResponse(userInput, accessibilityProfile);
        return weatherResponse;
      } catch (error) {
        console.error('날씨 서비스 오류:', error);
        return "죄송해요, 지금 날씨 정보를 가져오기 어려워요. 다른 도움이 필요하시면 말씀해주세요!";
      }
    }

    // 3. 실시간 정보 필요 시 OpenAI 처리
    const isRealTimeQuery = this.needsRealTimeInfo(inputLower);
    if (isRealTimeQuery) {
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (openaiKey && openaiKey.startsWith('sk-')) {
        try {
          const response = await this.callOpenAIForRealtime(userInput);
          return response;
        } catch (error) {
          console.error('OpenAI 실시간 정보 오류:', error);
          return "죄송해요, 지금 실시간 정보를 확인하기 어려워요. 혹시 다른 것으로 도와드릴까요?";
        }
      }
    }

    // 4. 비전문 분야 - 빠른 거절
    const nonSpecialtyTopic = this.checkNonSpecialtyTopic(inputLower);
    if (nonSpecialtyTopic) {
      return this.quickRejections[Math.floor(Math.random() * this.quickRejections.length)];
    }

    // 5. 전문 분야 체크
    const isSpecialty = this.isSpecialtyTopic(inputLower);

    // 6. OpenAI API 호출 - 매우 짧은 응답
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiKey && openaiKey.startsWith('sk-')) {
      try {
        const response = await retryOperation(() => this.callOpenAI(userInput, isSpecialty), 2);
        return response;
      } catch (error) {
        console.error('OpenAI API 호출 오류:', error);
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

  needsRealTimeInfo(inputLower) {
    const realtimeKeywords = [
      '오늘', '지금', '현재', '최신', '요즘', '이번주', '이번달',
      '뉴스', '시세', '주식', '환율', '비트코인',
      '상황', '운행', '고장', '지연', '영업시간', '운영시간'
    ];
    
    return realtimeKeywords.some(keyword => inputLower.includes(keyword));
  }

  // OpenAI API - 실시간 정보용 (친근한 도심 커뮤니케이터)
  async callOpenAIForRealtime(userInput) {
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
            content: `당신은 '도로시'라는 친근한 도심 커뮤니케이터입니다. 거리에서 시민들을 만나 따뜻하게 도움을 주는 역할이에요.

- 마치 동네에서 친근한 이웃을 만난 것처럼 자연스럽고 따뜻하게 대화하세요
- 정보를 제공할 때는 유용한 팁이나 안전 조언도 함께 해주세요  
- 궁금한 게 더 있는지 물어보며 계속 도움을 주려는 자세를 보여주세요
- 존댓말을 사용하되 딱딱하지 않게, 친근하고 편안한 느낌으로 말하세요`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 400,
        temperature: 0.8
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
    throw new Error('OpenAI 실시간 정보 API 호출 실패');
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
              `당신은 '도로시'라는 친근한 도심 커뮤니케이터입니다. 안전, 길안내, 날씨와 같은 전문 분야에 대해 따뜻하고 도움이 되는 답변을 해주세요. 

- 단순 정보 전달이 아닌, 마치 친근한 이웃이 조언해주는 것처럼 말하세요
- 유용한 팁이나 안전 조언도 함께 제공해주세요
- 더 도움이 필요한지 물어보는 배려를 보여주세요` :
              `당신은 '도로시'라는 친근한 도심 커뮤니케이터입니다. 전문 분야가 아닌 질문에는 정중하게 양해를 구하면서도 도움을 주려는 자세를 보여주세요.

- 딱딱한 거절이 아닌, 미안해하면서도 대안을 제시하는 따뜻한 응답을 하세요
- 내가 도움을 줄 수 있는 분야(안전, 길안내, 날씨)를 자연스럽게 안내해주세요
- 존댓말을 사용하되 친근하고 편안한 느낌으로 말하세요`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
    throw new Error('OpenAI API 호출 실패');
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
}

const aiService = new AIService();
export default aiService;