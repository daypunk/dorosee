import './Home.css'

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            환영합니다!
          </h1>
          <p className="hero-subtitle">
            아름다운 반응형 웹 애플리케이션
          </p>
          <button className="cta-button">
            시작하기
          </button>
        </div>
      </section>
      
      <section className="features">
        <div className="container">
          <h2 className="section-title">주요 기능</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>빠른 성능</h3>
              <p>Vite와 React를 사용한 빠른 개발 환경</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>반응형 디자인</h3>
              <p>모든 기기에서 완벽하게 작동</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>모던 UI</h3>
              <p>최신 디자인 트렌드를 반영</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home 