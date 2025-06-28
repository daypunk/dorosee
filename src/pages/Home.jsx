import { useNavigate } from 'react-router-dom'
import { useRive } from '@rive-app/react-canvas'
import { motion } from 'framer-motion'

function Home() {
  const navigate = useNavigate()
  
  const { RiveComponent } = useRive({
    src: '/chat_dorosee.riv',
    autoplay: true,
    useOffscreenRenderer: true,
    shouldDisableRiveListeners: false,
  });

  const handleReportClick = () => {
    navigate('/pwa')
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col justify-between items-center px-6 py-8 overflow-hidden">
      {/* 빈 공간 */}
      <div></div>
      
      {/* 메인 콘텐츠 - 가운데 정렬 */}
      <div className="flex flex-col items-center">
        {/* 메인 로고/애니메이션 */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div style={{ width: '180px', height: '180px' }}>
            <RiveComponent 
              style={{ 
                width: '100%', 
                height: '100%',
                imageRendering: 'auto',
              }}
            />
          </div>
        </motion.div>
        
        {/* 타이틀 */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h1 className="text-4xl font-bold leading-snug text-white">
            도로시에게<br />
            인사해 주세요!
          </h1>
        </motion.div>
      </div>
      
      {/* 최하단 버튼 */}
      <motion.div 
        className="w-full flex justify-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <button 
          onClick={handleReportClick}
          style={{
            backgroundColor: '#475569',
            color: '#ffffff',
            padding: '8px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'Pretendard, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: 1
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#64748b'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#475569'
          }}
        >
          실종자 제보
        </button>
      </motion.div>
    </div>
  )
}

export default Home 