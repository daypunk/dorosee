import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function PWADetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 페이지가 열릴 때 ID로 API 요청
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 로컬과 배포 모두 프록시 사용 (CORS 문제 해결)
        const baseUrl = '/api/lcm/findChildList.do';
        
        // URL 파라미터 생성
        const params = new URLSearchParams({
          esntlId: import.meta.env.VITE_MISSING_PERSON_ESNTL_ID || 10000764,
          authKey: import.meta.env.VITE_MISSING_PERSON_AUTH_KEY || '197f67addf144f4e',
          rowSize: 6,
          format: 'json'
        });
        
        const apiUrl = `${baseUrl}?${params}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const list = data.list || [];
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
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* 뒤로가기 버튼 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/pwa')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">목록으로</span>
            </button>
          </div>
          
          <div className="text-center">
            <img src="/dorosee_logo2.svg" alt="Dorosee Logo" className="h-8 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-gray-800">실종자 제보</h1>
          </div>
        </motion.div>

        {/* 스크롤 가능한 콘텐츠 */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* 실종자 정보 카드 */}
          <motion.div 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0">
                {photo ? (
                  <img
                    src={photo}
                    alt="실종자 사진"
                    className="w-18 h-22 object-cover rounded-md border border-gray-300"
                    style={{ filter: 'blur(1.5px)' }}
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ) : (
                  <div className="w-18 h-22 bg-gray-100 rounded-md border border-gray-300 flex flex-col items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs text-gray-500 text-center leading-tight">사진<br/>없음</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-3 truncate">{item.nm || '이름 없음'}</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">성별 · 나이</span>
                    <span className="text-gray-700">{gender} · {item.age || '미상'}세</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">실종일</span>
                    <span className="text-gray-700">{formatDate(item.occrde)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="text-gray-500 text-xs mb-1">실종장소</div>
              <p className="text-gray-700 text-xs leading-relaxed">{item.occrAdres || '주소 없음'}</p>
            </div>
          </motion.div>

          {/* 제보 폼 */}
          <motion.div 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                navigate('/pwa/thankyou');
              }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-900">제보내용</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">상세히 기입해 주시면 실종자를 더 빨리 찾을 수 있습니다.</p>

              <div className="space-y-4">
                {/* 목격 장소 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">목격 장소</label>
                                      <input 
                      type="text" 
                      placeholder="목격한 구체적인 장소를 입력하세요" 
                      required 
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                    />
                </div>

                {/* 목격 시간 - 날짜와 시간 분리 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">목격 시간</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-gray-400 mb-1">날짜</label>
                      <input 
                        type="date" 
                        required 
                        className="w-full min-w-[120px] px-3 py-3 sm:py-2.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                        style={{
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-gray-400 mb-1">시간</label>
                      <input 
                        type="time" 
                        required 
                        className="w-full min-w-[100px] px-3 py-3 sm:py-2.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
                        style={{
                          WebkitAppearance: 'none',
                          MozAppearance: 'textfield'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 인상착의 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">인상착의</label>
                                      <input 
                      type="text" 
                      placeholder="옷차림, 특징 등을 입력하세요" 
                      required 
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs"
                    />
                </div>

                {/* 기타 특이사항 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">기타 특이사항</label>
                                      <textarea 
                      placeholder="함께 있던 사람, 상황, 행동 등 추가 정보를 입력하세요" 
                      required 
                      rows="3"
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md text-gray-400 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-xs"
                    />
                </div>
                
                {/* 제보하기 버튼 */}
                <button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-md font-medium active:scale-98 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 text-sm mt-6"
                >
                  제보하기
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default PWADetail; 