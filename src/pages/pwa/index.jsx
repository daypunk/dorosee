import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
        // 로컬 개발환경에서는 프록시 사용, 배포환경에서는 직접 호출
        const apiUrl = window.location.hostname === 'localhost' 
          ? '/api/lcm/findChildList.do'
          : 'https://www.safe182.go.kr/api/lcm/findChildList.do';
          
        const res = await axios.get(apiUrl, {
          params: {
            esntlId: import.meta.env.VITE_MISSING_PERSON_ESNTL_ID || 10000764,
            authKey: import.meta.env.VITE_MISSING_PERSON_AUTH_KEY || '197f67addf144f4e',
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
        {/* 헤더 - Home.jsx와 동일한 구조 */}
        <div className="text-center mb-6">
          <motion.div 
            className="mb-6"
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
          >
            <img src="/dorosee_logo2.svg" alt="Dorosee Logo" className="h-8 mx-auto" />
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
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-md active:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/pwa/detail/${item.nm || index}`)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={`${name} 사진`}
                          className="w-16 h-20 object-cover rounded-lg border border-gray-300"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      ) : (
                        <div className="w-16 h-20 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-500">사진<br/>없음</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-blue-600 truncate">{name}</h3>
                        <span className="text-xs text-blue-500 ml-2 flex-shrink-0">자세히 →</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">성별</span>
                          <span className="text-gray-800 font-medium">{gender}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">나이</span>
                          <span className="text-gray-800 font-medium">{age}세</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">실종일</span>
                          <span className="text-gray-800 font-medium">{date}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-gray-600 text-xs">실종장소</span>
                          <p className="text-gray-800 text-xs leading-relaxed mt-1 break-words">{address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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