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
}

export default new KakaoLocationService();