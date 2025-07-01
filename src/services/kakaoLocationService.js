import { retryOperation } from '../utils/helpers';

class KakaoLocationService {
  constructor() {
    this.apiKey = import.meta.env.VITE_KAKAO_API_KEY;
  }

  // 좌표를 주소로 변환
  async getCurrentAddress(lat, lng) {
    if (!this.apiKey) {
      console.warn('Kakao API 키가 설정되지 않았습니다.');
      return null;
    }

    try {
      return await retryOperation(async () => {
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
          {
            headers: {
              'Authorization': `KakaoAK ${this.apiKey}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Kakao API 오류: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.documents && data.documents.length > 0) {
          const address = data.documents[0].address;
          const roadAddress = data.documents[0].road_address;
          
          return {
            fullAddress: address.address_name,
            region1: address.region_1depth_name, // 시/도
            region2: address.region_2depth_name, // 구/군
            region3: address.region_3depth_name, // 동/면
            roadAddress: roadAddress?.address_name || '',
            buildingName: roadAddress?.building_name || '',
            zonecode: roadAddress?.zone_no || ''
          };
        }
        
        return null;
      }, 2);
    } catch (error) {
      console.error('Kakao 주소 변환 오류:', error);
      return null;
    }
  }

  // 주변 장소 검색
  async searchNearbyPlaces(lat, lng, query = '지하철역', radius = 1000) {
    if (!this.apiKey) {
      console.warn('Kakao API 키가 설정되지 않았습니다.');
      return [];
    }

    try {
      return await retryOperation(async () => {
        const response = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15`,
          {
            headers: {
              'Authorization': `KakaoAK ${this.apiKey}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Kakao API 오류: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.documents.map(place => ({
          name: place.place_name,
          address: place.address_name,
          roadAddress: place.road_address_name,
          distance: parseInt(place.distance),
          category: place.category_name,
          phone: place.phone,
          url: place.place_url,
          x: parseFloat(place.x),
          y: parseFloat(place.y)
        }));
      }, 2);
    } catch (error) {
      console.error('Kakao 주변 검색 오류:', error);
      return [];
    }
  }

  // 특정 카테고리 주변 검색
  async searchNearbyByCategory(lat, lng, category = 'SW8', radius = 1000) {
    // 카테고리 코드:
    // SW8: 지하철역, BK9: 은행, HP8: 병원, SC4: 학교, CS2: 편의점
    // MT1: 대형마트, CT1: 문화시설, AT4: 관광명소, PK6: 주차장
    
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${category}&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15`,
        {
          headers: {
            'Authorization': `KakaoAK ${this.apiKey}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Kakao API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.documents.map(place => ({
        name: place.place_name,
        address: place.address_name,
        roadAddress: place.road_address_name,
        distance: parseInt(place.distance),
        category: place.category_name,
        phone: place.phone,
        url: place.place_url
      }));
    } catch (error) {
      console.error('Kakao 카테고리 검색 오류:', error);
      return [];
    }
  }

  // 거리 계산 (미터)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  }

  // 도보 시간 계산 (분)
  calculateWalkingTime(distance) {
    // 평균 도보 속도: 시속 4km (분당 67m)
    return Math.ceil(distance / 67);
  }

  // 주소 단축
  getShortAddress(addressInfo) {
    if (!addressInfo) return '위치 확인 중';
    
    const { region2, region3 } = addressInfo;
    
    if (region3 && region3 !== '') {
      return `${region2} ${region3}`;
    }
    
    return region2 || '알 수 없는 위치';
  }

  // 🎯 사용자 질문에 맞는 주변 검색 + 친근한 조언
  async searchNearbyWithAdvice(userInput, lat, lng) {
    try {
      const inputLower = userInput.toLowerCase();
      let searchQuery = '';
      let categoryCode = '';
      
      // 사용자 질문 분석
      if (inputLower.includes('편의점')) {
        categoryCode = 'CS2';
        searchQuery = '편의점';
      } else if (inputLower.includes('지하철') || inputLower.includes('역')) {
        categoryCode = 'SW8';
        searchQuery = '지하철역';
      } else if (inputLower.includes('병원')) {
        categoryCode = 'HP8';
        searchQuery = '병원';
      } else if (inputLower.includes('은행')) {
        categoryCode = 'BK9';
        searchQuery = '은행';
      } else if (inputLower.includes('마트') || inputLower.includes('대형마트')) {
        categoryCode = 'MT1';
        searchQuery = '마트';
      } else if (inputLower.includes('주차장')) {
        categoryCode = 'PK6';
        searchQuery = '주차장';
      } else if (inputLower.includes('카페')) {
        searchQuery = '카페';
      } else if (inputLower.includes('식당') || inputLower.includes('맛집')) {
        searchQuery = '식당';
      } else {
        // 키워드 추출 시도
        const keywords = inputLower.match(/(편의점|지하철|역|병원|은행|마트|주차장|카페|식당)/);
        if (keywords) {
          searchQuery = keywords[0];
        } else {
          searchQuery = '편의점'; // 기본값
        }
      }

      // 검색 실행
      let places = [];
      if (categoryCode) {
        places = await this.searchNearbyByCategory(lat, lng, categoryCode, 1000);
      } else {
        places = await this.searchNearbyPlaces(lat, lng, searchQuery, 1000);
      }

      if (places.length === 0) {
        return `주변에 ${searchQuery}를 찾지 못했어요. 조금 더 먼 곳을 검색해보거나 다른 장소를 찾아보시는 게 어떨까요?`;
      }

      // 가장 가까운 곳 3개 선택
      const nearestPlaces = places.slice(0, 3);
      const closest = nearestPlaces[0];
      
      // 도보 시간 계산
      const walkingTime = this.calculateWalkingTime(closest.distance);
      
      // 친근한 응답 생성
      let response = `가장 가까운 ${searchQuery}는 ${closest.name}이에요! `;
      
      if (walkingTime <= 5) {
        response += `아주 가까우니까 천천히 걸어가시면 돼요.`;
      } else if (walkingTime <= 10) {
        response += `조금 걸리지만 산책 삼아 가시면 좋을 것 같아요.`;
      } else {
        response += `좀 멀긴 하지만 날씨가 좋으면 걸어가시는 것도 좋아요.`;
      }
      
      if (closest.address) {
        // 간단한 주소만 표시 (구체적인 번지 제거)
        const simpleAddress = closest.address.split(' ').slice(0, 3).join(' ');
        response += ` ${simpleAddress} 쪽에 있어요.`;
      }

      // 다른 옵션 제시 (거리 정보 없이)
      if (nearestPlaces.length > 1) {
        response += ` 다른 옵션으로는 ${nearestPlaces[1].name}도 있어요!`;
      }

      return response;

    } catch (error) {
      console.error('위치 검색 및 조언 생성 오류:', error);
      return "죄송해요, 지금 주변 정보를 확인하기 어려워요. 혹시 찾으시는 곳의 구체적인 이름이나 주소를 알려주시면 도와드릴게요!";
    }
  }
}

export default new KakaoLocationService();