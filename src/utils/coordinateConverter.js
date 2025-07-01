// 기상청 단기예보 API용 좌표 변환 유틸리티
// GPS 좌표(lat, lon) → 기상청 격자 좌표(nx, ny)

class CoordinateConverter {
  constructor() {
    // 기상청 격자 좌표계 상수
    this.RE = 6371.00877; // 지구 반경(km)
    this.GRID = 5.0; // 격자 간격(km)
    this.SLAT1 = 30.0; // 투영 위도1(degree)
    this.SLAT2 = 60.0; // 투영 위도2(degree)
    this.OLON = 126.0; // 기준점 경도(degree)
    this.OLAT = 38.0; // 기준점 위도(degree)
    this.XO = 43; // 기준점 X좌표(GRID)
    this.YO = 136; // 기준점 Y좌표(GRID)
  }

  // GPS 좌표 → 기상청 격자 좌표 변환
  convertToGrid(lat, lon) {
    const DEGRAD = Math.PI / 180.0;
    const RADDEG = 180.0 / Math.PI;

    const re = this.RE / this.GRID;
    const slat1 = this.SLAT1 * DEGRAD;
    const slat2 = this.SLAT2 * DEGRAD;
    const olon = this.OLON * DEGRAD;
    const olat = this.OLAT * DEGRAD;

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

    const nx = Math.floor(ra * Math.sin(theta) + this.XO + 0.5);
    const ny = Math.floor(ro - ra * Math.cos(theta) + this.YO + 0.5);

    return { nx, ny };
  }

  // 현재 시간 기준 기상청 API 요청 시간 계산
  getBaseDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = now.getHours();

    // 기상청 API 발표 시간: 02:10, 05:10, 08:10, 11:10, 14:10, 17:10, 20:10, 23:10
    const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    let baseTime = '0200';

    for (let i = baseTimes.length - 1; i >= 0; i--) {
      const baseHour = parseInt(baseTimes[i].substring(0, 2));
      if (hour >= baseHour) {
        baseTime = baseTimes[i];
        break;
      }
    }

    // 만약 현재 시간이 02:00 이전이면 어제 23:00 데이터 사용
    if (hour < 2) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayYear = yesterday.getFullYear();
      const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
      const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
      
      return {
        baseDate: `${yesterdayYear}${yesterdayMonth}${yesterdayDay}`,
        baseTime: '2300'
      };
    }

    return {
      baseDate: `${year}${month}${day}`,
      baseTime: baseTime
    };
  }

  // 주요 도시의 격자 좌표 (미리 계산된 값)
  getCityGridCoords() {
    return {
      '서울': { nx: 60, ny: 127 },
      '부산': { nx: 98, ny: 76 },
      '대구': { nx: 89, ny: 90 },
      '인천': { nx: 55, ny: 124 },
      '광주': { nx: 58, ny: 74 },
      '대전': { nx: 67, ny: 100 },
      '울산': { nx: 102, ny: 84 },
      '세종': { nx: 66, ny: 103 },
      '강남구': { nx: 61, ny: 126 },
      '홍대입구역': { nx: 59, ny: 127 },
      '명동': { nx: 60, ny: 127 }
    };
  }
}

export default new CoordinateConverter(); 