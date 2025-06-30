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
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">해당 실종자 정보를 찾을 수 없습니다.</h2>
          <button 
            onClick={() => navigate('/pwa')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const photo = item.tknphotoFile
    ? `data:image/jpeg;base64,${item.tknphotoFile}`
    : 'https://via.placeholder.com/250x300?text=이미지+없음';

  return (
    <div className="min-h-screen bg-slate-900 text-white px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-blue-400">Dorosee</h1>
          <h2 className="text-2xl font-semibold">실종자 제보하기</h2>
        </div>

        {/* 실종자 정보 카드 */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-1/3">
              <img
                src={photo}
                alt="실종자 사진"
                className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                onError={(e) => (e.target.src = 'https://via.placeholder.com/250x300?text=이미지+없음')}
              />
            </div>
            <div className="lg:w-2/3">
              <h3 className="text-3xl font-bold mb-4 text-blue-300">{item.nm || '이름 없음'}</h3>
              <div className="space-y-3 text-lg">
                <p><span className="font-semibold text-white">성별:</span> <span className="text-slate-300">{item.sexdstnDscd || '성별 정보 없음'}</span></p>
                <p><span className="font-semibold text-white">나이:</span> <span className="text-slate-300">{item.age || '나이 없음'}</span></p>
                <p><span className="font-semibold text-white">실종일:</span> <span className="text-slate-300">{formatDate(item.occrde)}</span></p>
                <p><span className="font-semibold text-white">주소:</span> <span className="text-slate-300">{item.occrAdres || '주소 없음'}</span></p>
                <p><span className="font-semibold text-white">구분:</span> <span className="text-slate-300">{writingTrgetDscdMap[item.writngTrgetDscd] || '알 수 없음'}</span></p>
              </div>
              <button 
                onClick={() => navigate('/pwa')} 
                className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>

        {/* 제보 폼 */}
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/pwa/thankyou');
            }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-300">제보내용</h2>
            <p className="text-slate-300 mb-6">상세히 기입해 주시면 실종자를 더 빨리 찾을 수 있습니다.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input 
                type="text" 
                placeholder="목격 장소" 
                required 
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <input 
                type="text" 
                placeholder="목격 시간" 
                required 
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <input 
              type="text" 
              placeholder="인상착의" 
              required 
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-4"
            />
            
            <textarea 
              placeholder="비고" 
              required 
              rows="4"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-6 resize-none"
            />
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              제보하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PWADetail; 