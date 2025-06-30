import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function PWADetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 페이지가 열릴 때 ID로 API 요청
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
        const list = res.data.list || [];
        const found = list.find((person) => person.nm === id);
        setItem(found || null);
      } catch (err) {
        console.error('API 오류:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (str) =>
    str && str.length === 8
      ? `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
      : '날짜 없음';

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

  if (loading) {
    return (
      <div className="h-screen bg-white text-gray-800 flex justify-center">
        <div className="w-full max-w-md flex items-center justify-center px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">실종자 정보를 불러오고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="h-screen bg-white text-gray-800 flex justify-center">
        <div className="w-full max-w-md flex items-center justify-center px-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">해당 실종자 정보를 찾을 수 없습니다.</h2>
          </div>
        </div>
      </div>
    );
  }

  const photo = item.tknphotoFile
    ? `data:image/jpeg;base64,${item.tknphotoFile}`
    : null;

  const gender = item.sexdstnDscd === 'M' ? '남성' : item.sexdstnDscd === 'F' ? '여성' : '미상';

  return (
    <div className="h-screen bg-white text-gray-800 flex justify-center overflow-hidden">
      <div className="w-full max-w-md flex flex-col px-6 py-8">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <img src="/dorosee_logo2.svg" alt="Dorosee Logo" className="h-6 mx-auto" />
        </div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* 실종자 정보 카드 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
            <div className="flex gap-4 mb-4">
              <div className="flex-shrink-0">
                {photo ? (
                  <img
                    src={photo}
                    alt="실종자 사진"
                    className="w-20 h-24 object-cover rounded-lg border border-gray-300"
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ) : (
                  <div className="w-20 h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-500">사진<br/>없음</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-blue-600 mb-3">{item.nm || '이름 없음'}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">성별</span>
                    <span className="text-gray-800 font-medium">{gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">나이</span>
                    <span className="text-gray-800 font-medium">{item.age || '미상'}세</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">실종일</span>
                    <span className="text-gray-800 font-medium">{formatDate(item.occrde)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <span className="text-gray-600 text-xs">실종장소</span>
              <p className="text-gray-800 text-sm leading-relaxed mt-1">{item.occrAdres || '주소 없음'}</p>
            </div>
          </div>

          {/* 제보 폼 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                navigate('/pwa/thankyou');
              }}
            >
              <h2 className="text-lg font-bold mb-2 text-blue-600">제보내용</h2>
              <p className="text-gray-600 text-sm mb-4">상세히 기입해 주시면 실종자를 더 빨리 찾을 수 있습니다.</p>

              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="목격 장소" 
                  required 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <input 
                  type="text" 
                  placeholder="목격 시간" 
                  required 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <input 
                  type="text" 
                  placeholder="인상착의" 
                  required 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <textarea 
                  placeholder="기타 특이사항" 
                  required 
                  rows="3"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                />
                
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium active:bg-blue-700 transition-colors focus:outline-none text-sm"
                >
                  제보하기
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWADetail; 