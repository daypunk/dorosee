import React, { useState } from 'react';
import useAccessibilityProfile from '../hooks/useAccessibilityProfile';

const ChatPanel = ({ messages, onQuickAction, onDevSubmit, messagesEndRef }) => {
  const { 
    profile, 
    updateProfile, 
    handleTextInput, 
    getAccessibilityRecommendations 
  } = useAccessibilityProfile();
  
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [inputStartTime, setInputStartTime] = useState(null);

  // 접근성 프로필에 따른 스타일 클래스
  const getAccessibilityClasses = () => {
    let classes = 'chat-panel';
    
    if (profile.highContrast) classes += ' high-contrast';
    if (profile.fontSize === 'large') classes += ' large-text';
    if (profile.fontSize === 'small') classes += ' small-text';
    if (profile.reduceMotion) classes += ' reduce-motion';
    
    return classes;
  };

  // 메시지 표시 스타일 조정
  const getMessageClasses = (message) => {
    let classes = `message ${message.sender} ${message.isEmergency ? 'emergency' : ''}`;
    
    if (profile.hearingImpairment && message.isEmergency) {
      classes += ' visual-alert';
    }
    
    return classes;
  };

  // 🎯 메시지 길이 제한 함수 - 제거
  const limitMessageLength = (text) => {
    return text; // 길이 제한 제거
  };

  // 개발자 입력 폼 제출 처리 (접근성 추가)
  const handleDevSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const input = formData.get('devInput');
    
    if (input.trim()) {
      // 응답 시간 계산
      const responseTime = inputStartTime ? Date.now() - inputStartTime : 0;
      
      // 상호작용 기록
      handleTextInput(input, responseTime);
      
      // 원래 제출 처리
      onDevSubmit(e);
      
      // 폼 리셋
      e.target.reset();
      setInputStartTime(null);
    }
  };

  // 입력 시작 시간 기록
  const handleInputFocus = () => {
    setInputStartTime(Date.now());
  };

  // 빠른 액션 버튼 클릭 (접근성 추가)
  const handleQuickAction = (action) => {
    // 상호작용 기록
    handleTextInput(action, 0); // 빠른 액션은 응답시간 0
    onQuickAction(action);
  };

  // 접근성 권장사항 표시
  const recommendations = getAccessibilityRecommendations();
  return (
    <div className={getAccessibilityClasses()}>
      {/* 접근성 및 권장사항 표시 */}
      {recommendations.length > 0 && (
        <div className="accessibility-notifications">
          {recommendations.map((rec, index) => (
            <div key={index} className={`accessibility-alert ${rec.type}`}>
              🔔 {rec.message}
            </div>
          ))}
        </div>
      )}

      {/* 접근성 설정 버튼 */}
      <div className="accessibility-controls">
        <button 
          className="accessibility-toggle"
          onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
          aria-label="접근성 설정 열기"
        >
          ♿ 접근성
        </button>
      </div>

      {/* 접근성 설정 패널 */}
      {showAccessibilityPanel && (
        <div className="accessibility-panel">
          <div className="accessibility-panel-header">
            <h3>접근성 설정</h3>
            <button onClick={() => setShowAccessibilityPanel(false)}>×</button>
          </div>
          
          <div className="accessibility-options">
            <label>
              <input 
                type="checkbox" 
                checked={profile.visualImpairment}
                onChange={(e) => updateProfile({ visualImpairment: e.target.checked })}
              />
              👁️ 시각장애 지원
            </label>
            
            <label>
              <input 
                type="checkbox" 
                checked={profile.hearingImpairment}
                onChange={(e) => updateProfile({ hearingImpairment: e.target.checked })}
              />
              👂 청각장애 지원
            </label>
            
            <label>
              <input 
                type="checkbox" 
                checked={profile.elderly}
                onChange={(e) => updateProfile({ elderly: e.target.checked })}
              />
              👴 고령자 친화적 모드
            </label>
            
            <label>
              <input 
                type="checkbox" 
                checked={profile.cognitiveImpairment}
                onChange={(e) => updateProfile({ cognitiveImpairment: e.target.checked })}
              />
              🧠 단순화 모드
            </label>
            
            <div className="font-size-control">
              <label>글자 크기:</label>
              <select 
                value={profile.fontSize} 
                onChange={(e) => updateProfile({ fontSize: e.target.value })}
              >
                <option value="small">작게</option>
                <option value="normal">보통</option>
                <option value="large">크게</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 시민 대화 섹션 헤더 */}
      <div className="citizen-chat-section">
        <div className="citizen-chat-header">
          <span>👥</span>
          <span>시민 대화</span>
        </div>
      </div>

      {/* 채팅 메시지 */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={getMessageClasses(message)}
          >
            <div className="message-bubble">
              {limitMessageLength(message.text)}
              <div className="message-info">
                {message.sender === 'bot' ? '도로시' : '시민'} • {message.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 액션 버튼들 - 접근성 개선 */}
      <div className="quick-actions">
        <button 
          className="quick-btn weather" 
          onClick={() => handleQuickAction('현재 날씨 알려줘')}
          aria-label="현재 날씨 정보 요청"
        >
          🌤️ 날씨
        </button>
        <button 
          className="quick-btn navigation" 
          onClick={() => handleQuickAction('지하철역 가는 길 알려줘')}
          aria-label="지하철역 길찾기 요청"
        >
          🚇 길찾기
        </button>
        <button 
          className="quick-btn info" 
          onClick={() => handleQuickAction('도로시 기능 뭐가 있어?')}
          aria-label="도로시 기능 안내 요청"
        >
          ℹ️ 기능
        </button>
        <button 
          className="quick-btn safety" 
          onClick={() => handleQuickAction('안전 정보 알려줘')}
          aria-label="안전 정보 요청"
        >
          🛡️ 안전정보
        </button>
        <button 
          className="quick-btn location" 
          onClick={() => handleQuickAction('내 위치 알려줘')}
          aria-label="현재 위치 정보 요청"
        >
          📍 내 위치
        </button>
        <button 
          className="quick-btn convenience" 
          onClick={() => handleQuickAction('주변 편의점 알려줘')}
          aria-label="주변 편의점 찾기 요청"
        >
          🏦 편의점
        </button>
      </div>

      {/* 개발자용 입력 폼 - 접근성 개선 */}
      <form onSubmit={handleDevSubmit} className="dev-input-form">
        <input
          name="devInput"
          type="text"
          placeholder={profile.elderly ? "말씀해 주세요..." : "메시지를 입력하세요..."}
          onFocus={handleInputFocus}
          aria-label="메시지 입력창"
          autoComplete="off"
        />
        <button 
          type="submit"
          aria-label="메시지 전송"
        >
          전송
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;