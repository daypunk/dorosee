import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRive } from '@rive-app/react-canvas';
import { motion } from 'framer-motion';

function PWAIndex() {
  const [missingList, setMissingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { RiveComponent } = useRive({
    src: '/chat_dorosee.riv',
    autoplay: true,
    useOffscreenRenderer: true,
    shouldDisableRiveListeners: false,
  });

  // API 요청
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
        console.log(data);
        setMissingList(data.list || []);
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

  if (loading) {
    return (
      <div className="h-screen bg-white text-gray-800 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">실종자 정보를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-gray-800 flex justify-center overflow-hidden">
      <div className="w-full max-w-md flex flex-col px-6 py-8">
        {/* 헤더 - 간격 조정 */}
        <div className="text-center mb-8">
          <motion.div 
            className="mb-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div style={{ width: '120px', height: '120px' }} className="mx-auto">
              <RiveComponent 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  imageRendering: 'auto',
                }}
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-4"
          >
            <img src="/dorosee_logo2.svg" alt="Dorosee Logo" className="h-8 mx-auto" />
          </motion.div>
          
          {/* 제보 플랫폼 타이틀 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-4"
          >
            <h2 className="text-lg font-semibold text-gray-800 text-center">제보 플랫폼</h2>
          </motion.div>
        </div>
        
        {/* 실종자 카드 목록 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {missingList.map((item, index) => {
              const name = item.nm || '이름 없음';
              const age = item.age || '나이 없음';
              const date = formatDate(item.occrde);
              const address = item.occrAdres || '주소 없음';
              const gender = item.sexdstnDscd === 'M' ? '남성' : item.sexdstnDscd === 'F' ? '여성' : '미상';
              
              const photo = item.tknphotoFile 
                ? `data:image/jpeg;base64,${item.tknphotoFile}`
                : null;

              return (
                <motion.div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md active:scale-98 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/pwa/detail/${item.nm || index}`)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex gap-3">
                    {/* 사진 영역 */}
                    <div className="flex-shrink-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={`${name} 사진`}
                          className="w-18 h-22 object-cover rounded-md border border-gray-300"
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
                    
                    {/* 정보 영역 */}
                    <div className="flex-1 min-w-0">
                      {/* 이름과 화살표 */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900 truncate pr-2">{name}</h3>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      {/* 기본 정보 - 간단한 텍스트 형태 */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">성별 · 나이</span>
                          <span className="text-gray-700">{gender} · {age}세</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">실종일</span>
                          <span className="text-gray-700">{date}</span>
                        </div>
                        
                        <div className="pt-1">
                          <div className="text-gray-500 mb-1">실종장소</div>
                          <div className="text-gray-700 leading-relaxed break-words">{address}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 하단 상태 표시 */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                        <span className="text-xs font-medium text-gray-700">실종 신고</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">자세히 보기</span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {missingList.length === 0 && (
            <div className="text-center mt-12">
              <p className="text-gray-500">현재 표시할 실종자 정보가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PWAIndex; 