import { 
  DOROSE_SPECIALTY_KEYWORDS,
  API_ENDPOINTS 
} from '../utils/constants';
import { retryOperation } from '../utils/helpers';
import kakaoLocationService from './kakaoLocationService';
import accessibilityWeatherService from './accessibilityWeatherService';

class AIService {
  constructor() {
    // 🎯 매우 짧고 간결한 기본 응답으로 변경
    this.defaultResponses = {
      안녕: ["안녕하세요! 도로시입니다~"],
      날씨: ["24도로 맑아요!"],
      길: ["어디로 가시나요?"],
      지하철: ["어느 역으로 가시나요?"],
      기능: ["응급상황 감지, 날씨 정보, 길 안내를 도와드려요!"],
      고마워: ["천만에요!"],
      안전: ["주변을 잘 살피시고 안전하게 다니세요!"]
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

    // 🎯 짧은 거절 메시지
    this.quickRejections = [
      "그건 전문이 아니에요!",
      "안전 질문 해주세요!",
      "길안내나 날씨는 가능해요!"
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
            return `${closest.name} 도보${walkTime}분`;
          }
          return "주변 지하철역 없음";
        }
        
        // 편의점 검색 - 가장 가까운 1개만
        if (inputLower.includes('편의점')) {
          const stores = await kakaoLocationService.searchNearbyByCategory(
            location.latitude, location.longitude, 'CS2', 800
          );
          
          if (stores.length > 0) {
            const closest = stores[0];
            const walkTime = kakaoLocationService.calculateWalkingTime(closest.distance);
            return `${closest.name} 도보${walkTime}분`;
          }
          return "주변 편의점 없음";
        }
        
        // 위치 정보
        if (inputLower.includes('위치') || inputLower.includes('어디')) {
          const address = await kakaoLocationService.getCurrentAddress(location.latitude, location.longitude);
          const shortAddress = kakaoLocationService.getShortAddress(address);
          return `현재 ${shortAddress}`;
        }
        
      } catch (error) {
        console.error('위치 서비스 오류:', error);
        return "위치 정보 없음";
      }
    }
    
    return await this.generateResponse(userInput);
  }

  async generateResponse(userInput, accessibilityProfile = {}) {
    const inputLower = userInput.toLowerCase();

    // 1. 이름 질문 - 간단한 응답
    if (this.isNameQuestion(inputLower)) {
      return "도로시 안전 로봇이에요!";
    }

    // 2. 날씨 질문 - 응답 길이 제한
    if (accessibilityWeatherService.isWeatherQuery(userInput)) {
      try {
        const weatherResponse = await accessibilityWeatherService.getSimpleWeatherResponse(userInput, accessibilityProfile);
        return weatherResponse;
      } catch (error) {
        console.error('날씨 서비스 오류:', error);
        return "날씨 정보 없음";
      }
    }

    // 3. 🚫 Perplexity 비활성화 - OpenAI로 대체
    const isRealTimeQuery = this.needsRealTimeInfo(inputLower);
    if (isRealTimeQuery) {
      // Perplexity 대신 OpenAI로 실시간 정보 처리
      const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
      if (openaiKey && openaiKey.startsWith('sk-')) {
        try {
          const response = await this.callOpenAIForRealtime(userInput);
          return response;
        } catch (error) {
          console.error('OpenAI 실시간 정보 오류:', error);
          return "실시간 정보를 가져올 수 없어요";
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
    const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;
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
    return DOROSE_SPECIALTY_KEYWORDS.some(keyword => inputLower.includes(keyword));
  }

  needsRealTimeInfo(inputLower) {
    const realtimeKeywords = [
      '오늘', '지금', '현재', '최신', '요즘', '이번주', '이번달',
      '뉴스', '시세', '주식', '환율', '비트코인',
      '상황', '운행', '고장', '지연', '영업시간', '운영시간'
    ];
    
    return realtimeKeywords.some(keyword => inputLower.includes(keyword));
  }

  // 🎯 OpenAI API - 실시간 정보용 (2-3줄 응답)
  async callOpenAIForRealtime(userInput) {
    const response = await fetch(API_ENDPOINTS.OPENAI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `당신은 도로시라는 도시 안전 로봇입니다. 2-3줄로 친근하고 도움이 되는 정보를 제공하세요. 안전 관련 조언도 포함해주세요.`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 200, // 2-3줄 정도
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content.trim();
    }
    throw new Error('OpenAI 실시간 정보 API 호출 실패');
  }

  // 🎯 OpenAI API - 기본 질문용 (간결한 응답)
  async callOpenAI(userInput, isSpecialty) {
    const response = await fetch(API_ENDPOINTS.OPENAI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: isSpecialty ? 
              `도로시 안전 로봇입니다. 전문 분야(안전, 길안내, 날씨)에 대해 1-2문장으로 친근하게 답변하세요.` :
              `도로시 로봇입니다. 비전문 질문에는 재치있게 거절하고 안전 분야로 유도하세요.`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        max_tokens: 100, // 간결한 응답
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

    return "안전과 관련된 질문이 있으시면 언제든 말숨해주세요!";
  }
}

const aiService = new AIService();
export default aiService;