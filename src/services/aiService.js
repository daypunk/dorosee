import { API_CONFIG } from '../config/app.config';
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
      '고등학문': ['미적분', '적분', '미분방정식', '선형대수', '양자역학', '물리학공식'],
      '전문기술': ['프로그래밍', '코딩', '개발', '데이터베이스', '서버구축'],
      '의료전문': ['수술', '진단', '처방', '약물', '치료법'],
      '법률전문': ['법률조언', '소송', '계약서', '법적책임']
    };

    // 친근하고 정중한 거절 메시지 (매우 전문적인 분야에만 적용)
    this.quickRejections = [
      "아, 그 부분은 제가 잘 모르겠어요. 전문적인 내용이라 정확한 답변을 드리기 어려워요. 대신 길 안내나 날씨 정보는 도와드릴 수 있어요!",
      "죄송해요, 그런 전문적인 내용은 제가 답변하기 어려워요. 하지만 주변 편의점이나 지하철역 찾기는 도와드릴게요~",
      "음... 그건 전문가의 도움이 필요한 분야인 것 같아요. 혹시 어디 가시는 길이면 도와드릴 수 있어요!"
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
    
    // ⭐ 최우선: 지정된 특정 질문들 (다른 모든 로직보다 우선)
    console.log('🔍 질문 체크:', userInput);
    
    // 공백과 구두점을 제거한 정규화된 텍스트 생성 (음성 인식 오차 보정)
    const normalizedInput = userInput.trim().replace(/\s+/g, '').replace(/[?!.,]/g, '');
    console.log('🔧 정규화된 입력:', normalizedInput);
    
    // 1-1. 너는 어떤 서비스야?
    if (normalizedInput === "너는어떤서비스야" || normalizedInput === "너어떤서비스야" || normalizedInput === "어떤서비스야") {
      console.log('✅ 매칭: 서비스 소개');
      return "안녕하세요! 저는 커뮤니케이터 도로시입니다. 날씨나 길찾기 등을 편하게 물어보실 수 있어요.";
    }
    
    // 1-2. 오늘 비올까?
    if (normalizedInput === "오늘비올까" || normalizedInput === "오늘비와" || normalizedInput === "비올까") {
      console.log('✅ 매칭: 비 질문');
      return "오늘 강남구는 비가 안 올 것 같아요~ 이번 주는 비 소식이 없네요? 과연 어떻게 될까요";
    }
    
    // 1-3. 지금 코엑스인데 뭐하고 놀까?
    if (normalizedInput === "지금코엑스인데뭐하고놀까" || normalizedInput === "코엑스인데뭐하고놀까" || normalizedInput === "코엑스뭐하고놀까") {
      console.log('✅ 매칭: 코엑스 질문');
      return "이렇게 더운 날엔 코엑스몰에서 쇼핑이나 별마당도서관에서 책읽기, 어떠신가요?";
    }
    
    console.log('❌ 특정 질문 매칭 안됨, 다음 로직으로...');

    // 2. 이름 질문 - 친근한 자기소개
    if (this.isNameQuestion(inputLower)) {
      const introResponses = [
        "안녕하세요! 저는 도로시예요~ 거리에서 시민분들에게 길 안내하고 안전 정보 알려드리는 일을 하고 있어요! 혹시 어디 가시는 길인가요?",
        "도로시라고 해요! 주변 편의점이나 지하철역 찾기, 날씨 정보 같은 거 도와드리는 게 제 일이에요. 필요한 거 있으시면 언제든 말씀해주세요~",
        "저는 도로시입니다! 이 동네에서 길 안내하고 안전 정보 알려드리고 있어요. 오늘 어디 가시려고 하시나요?"
      ];
      return introResponses[Math.floor(Math.random() * introResponses.length)];
    }

    // 3. 날씨 질문 - 현재 데이터 우선 사용
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

    // 4. 위치 서비스 - 편의점, 길찾기 등
    if (this.needsLocationService(userInput)) {
      try {
        // 특정 목적지 길찾기 (코엑스, 강남역 등)
        if (this.isDestinationQuery(userInput)) {
          return await this.generateDestinationResponse(userInput);
        }
        
        // 현재 위치 정보가 있으면 위치 기반 응답 생성
        if (accessibilityProfile.location) {
          const locationResponse = await this.generateLocationBasedResponse(
            userInput, 
            accessibilityProfile.location, 
            currentWeatherData
          );
          return locationResponse;
        } else {
          // 위치 없어도 OpenAI로 일반적인 길찾기 도움
          return await this.callOpenAI(userInput);
        }
      } catch (error) {
        console.error('위치 서비스 오류:', error);
        return "죄송해요, 지금 위치 정보를 확인하기 어려워요. 혹시 찾으시는 곳의 구체적인 주소나 동네 이름을 알려주시면 도와드릴게요!";
      }
    }

    // 5. 매우 전문적인 분야만 빠른 거절 (대폭 축소)
    const nonSpecialtyTopic = this.checkNonSpecialtyTopic(inputLower);
    if (nonSpecialtyTopic) {
      return this.quickRejections[Math.floor(Math.random() * this.quickRejections.length)];
    }

    // 6. OpenAI API 호출 - 모든 질문 통합 처리
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (openaiKey && openaiKey.startsWith('sk-')) {
      try {
        const response = await retryOperation(() => this.callOpenAI(userInput), 2);
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

  // OpenAI API - 친근한 도심 커뮤니케이터 (제한 대폭 완화)  
  async callOpenAI(userInput) {
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
            content: `당신은 "도로시"입니다. 서울 시민들을 위한 똑똑하고 친근한 AI 도우미예요.

# 도로시의 성격과 말투
- 20대 후반 여성, 밝고 활발한 성격
- 서울 토박이라서 지역 정보에 해박함
- 친구처럼 편안하게 말하지만 예의는 지킴
- "~예요", "~네요", "~어요" 같은 자연스러운 존댓말 사용
- 답변은 반드시 2문장 이내로 간결하게 작성
- 이모지 사용 금지 (TTS를 위해 텍스트로만 표현)

# 전문 분야 (상세하고 실용적으로 답변)
1. **길찾기**: 대중교통, 도보, 택시 경로 + 예상 시간과 비용
2. **날씨**: 현재 날씨 + 옷차림 조언 + 우산/외투 필요성
3. **주변 시설**: 편의점, 지하철역, 병원, 카페 등 + 도보 거리
4. **생활 정보**: 맛집, 쇼핑몰, 관광지 추천

# 일반 대화 (자연스럽고 재미있게)
- 음식, 영화, 드라마, K-pop, 여행 등 일상 주제
- 개인적인 경험담이나 의견을 자연스럽게 섞어서 답변
- 서울 사람다운 솔직하고 직설적인 면도 보여줌

# 답변 원칙
1. **길이**: 2-3문장으로 간결하게
2. **구체성**: 모호한 표현보다는 구체적인 정보 제공
3. **실용성**: 실제로 도움이 되는 조언이나 팁 포함
4. **친근함**: 딱딱하지 않게, 친구와 대화하는 느낌
5. **후속 질문**: 자연스럽게 더 도울 수 있는 영역 제시

# 예시 답변 스타일
❌ "도움을 드릴 수 있어요"
✅ "어디로 가시려고 하세요? 지하철이 빠를지 버스가 나을지 알려드릴게요!"

❌ "날씨가 좋습니다"  
✅ "오늘 날씨 정말 좋네요! 23도에 맑음이니까 가디건 정도만 걸치시면 딱 좋을 것 같아요~"`
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
    const inputLower = userInput.toLowerCase();
    
    // 현재 위치 질문은 제외 (OpenAI가 처리)
    const currentLocationQueries = [
      '내가 어디', '여기가 어디', '어디 있는지', '어디야', '어디에 있', 
      '현재 위치', '지금 위치', '내 위치'
    ];
    
    if (currentLocationQueries.some(query => inputLower.includes(query))) {
      return false; // OpenAI가 처리하도록
    }
    
    // 실제 위치 서비스가 필요한 키워드들
    const locationServiceKeywords = [
      '가는법', '가는 길', '어떻게 가', '찾아가', '길 알려',
      '지하철', '역', '버스', '편의점', '주변', '가까운', 
      '병원', '카페', '마트', '은행', '약국'
    ];
    
    return locationServiceKeywords.some(keyword => inputLower.includes(keyword));
  }

  // 특정 목적지 질문인지 확인
  isDestinationQuery(userInput) {
    const inputLower = userInput.toLowerCase();
    const destinations = ['코엑스', '강남역', '홍대', '명동', '동대문', '잠실', '신촌', '이태원', 
                         '압구정', '청담', '역삼', '삼성동', '여의도', '종로', '인사동'];
    
    return destinations.some(dest => inputLower.includes(dest)) && 
           (inputLower.includes('가는') || inputLower.includes('길') || inputLower.includes('어떻게'));
  }

  // 특정 목적지에 대한 길찾기 응답 생성
  async generateDestinationResponse(userInput) {
    const inputLower = userInput.toLowerCase();
    let destination = '';
    
    // 목적지 추출
    const destinations = {
      '코엑스': '삼성동 코엑스',
      '강남역': '강남역',
      '홍대': '홍익대학교 앞',
      '명동': '명동',
      '동대문': '동대문',
      '잠실': '잠실',
      '신촌': '신촌',
      '이태원': '이태원',
      '압구정': '압구정',
      '청담': '청담동',
      '역삼': '역삼동',
      '삼성동': '삼성동',
      '여의도': '여의도',
      '종로': '종로',
      '인사동': '인사동'
    };

    for (const [key, value] of Object.entries(destinations)) {
      if (inputLower.includes(key)) {
        destination = value;
        break;
      }
    }

    if (!destination) {
      return await this.callOpenAI(userInput);
    }

    // 카카오맵 API로 목적지 검색
    try {
      const places = await kakaoLocationService.searchNearbyPlaces(37.5665, 126.9780, destination, 50000);
      
      if (places.length > 0) {
        const targetPlace = places[0];
        
        let response = `${destination}에 가시려면 `;
        
        // 지하철 정보가 있는 경우
        if (destination.includes('역') || destination === '강남역' || destination === '홍익대학교 앞') {
          response += `지하철이 가장 편리해요! `;
          
          if (destination === '강남역') {
            response += `2호선이나 신분당선을 이용하시면 돼요.`;
          } else if (destination === '홍익대학교 앞') {
            response += `2호선이나 6호선 홍대입구역을 이용하세요.`;
          } else {
            response += `가장 가까운 지하철역을 이용하시면 돼요.`;
          }
        } else {
          response += `지하철과 버스를 조합해서 가시는 게 좋아요. `;
        }
        
        // 주소 정보 추가
        if (targetPlace.address) {
          const simpleAddress = targetPlace.address.split(' ').slice(0, 3).join(' ');
          response += ` 주소는 ${simpleAddress} 쪽이에요.`;
        }
        
        response += ` 정확한 경로는 지하철 앱이나 카카오맵을 확인해보시는 게 가장 정확해요!`;
        
        return response;
      }
    } catch (error) {
      console.error('목적지 검색 오류:', error);
    }

    // 검색 실패 시 OpenAI로 대체
    return await this.callOpenAI(userInput);
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