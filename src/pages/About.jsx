import './About.css'

function About() {
  return (
    <div className="about">
      <div className="container">
        <section className="about-hero">
          <h1 className="about-title">소개</h1>
          <p className="about-subtitle">
            Dorosee는 현대적인 웹 기술로 만들어진 반응형 애플리케이션입니다
          </p>
        </section>
        
        <section className="about-content">
          <div className="about-grid">
            <div className="about-text">
              <h2>우리의 비전</h2>
              <p>
                최신 웹 기술을 활용하여 사용자에게 최고의 경험을 제공하는 것이 
                우리의 목표입니다. React와 Vite를 기반으로 한 빠르고 효율적인 
                개발 환경을 통해 혁신적인 솔루션을 만들어갑니다.
              </p>
              
              <h3>기술 스택</h3>
              <ul className="tech-list">
                <li>React 19</li>
                <li>Vite</li>
                <li>React Router</li>
                <li>Modern CSS</li>
                <li>Responsive Design</li>
              </ul>
            </div>
            
            <div className="about-image">
              <div className="placeholder-image">
                <span>🎯</span>
                <p>혁신적인 솔루션</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="stats">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>100%</h3>
              <p>반응형 디자인</p>
            </div>
            <div className="stat-item">
              <h3>최신</h3>
              <p>기술 스택</p>
            </div>
            <div className="stat-item">
              <h3>빠른</h3>
              <p>로딩 속도</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About 