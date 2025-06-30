import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function PWAIndex() {
  const [missingList, setMissingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // API 요청
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 로컬 개발환경에서는 프록시 사용, 배포환경에서는 직접 호출
        const apiUrl = window.location.hostname === 'localhost' 
          ? '/api/lcm/findChildList.do'
          : 'https://www.safe182.go.kr/api/lcm/findChildList.do';
          
        const res = await axios.get(apiUrl, {
          params: {
            esntlId: 10000764,
            authKey: '197f67addf144f4e',
            rowSize: 6,
            format: 'json'
          }
        });
        console.log(res.data);
        setMissingList(res.data.list || []);
      } catch (err) {
        console.error('API 오류:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 날짜 포맷 함수
  const formatDate = (str) =>
    str && str.length === 8 ? `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}` : '날짜 없음';

  const writingTrgetDscdMap = {
    "010": "정상아동(18세미만)",
    "020": "가출인",
    "040": "시설보호무연고자",
    "060": "지적장애인",
    "061": "지적장애인(18세미만)",
    "062": "지적장애인(18세이상)",
    "070": "치매질환자",
    "080": "불상(기타)"
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-blue-400">Dorosee</h1>
          <h2 className="text-2xl font-semibold mb-4">실종자 정보</h2>
          <Link 
            to="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
          >
            메인으로 돌아가기
          </Link>
        </div>

        {/* 로딩 상태 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          /* 카드 컨테이너 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missingList.map((item, index) => {
              const name = item.nm || '이름 없음';
              const age = item.age || '나이 없음';
              const date = formatDate(item.occrde);
              const address = item.occrAdres || '주소 없음';
              const gender = item.sexdstnDscd || '성별 정보 없음';
              const target = item.writngTrgetDscd || '타겟 정보 없음';
              
              // Base64 이미지 데이터를 data URL로 변환
              const photo = item.tknphotoFile 
                ? `data:image/jpeg;base64,${item.tknphotoFile}`
                : 'https://via.placeholder.com/250x300?text=이미지+없음';

              return (
                <div
                  key={index}
                  className="bg-slate-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-200"
                  onClick={() => navigate(`/pwa/detail/${item.nm || index}`)}
                >
                  <div className="aspect-w-3 aspect-h-4">
                    <img
                      src={photo}
                      alt={`${name} 사진`}
                      className="w-full h-64 object-cover"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/250x300?text=이미지+없음')}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2 text-blue-300">{name}</h3>
                    <div className="space-y-1 text-sm text-slate-300">
                      <p><span className="font-medium text-white">성별:</span> {gender}</p>
                      <p><span className="font-medium text-white">나이:</span> {age}</p>
                      <p><span className="font-medium text-white">구분:</span> {writingTrgetDscdMap[target] || '알 수 없음'}</p>
                      <p><span className="font-medium text-white">실종일:</span> {date}</p>
                      <p><span className="font-medium text-white">주소:</span> {address}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PWAIndex; 