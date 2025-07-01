import React from 'react';
import VoiceVisualizer from './VoiceVisualizer';

const VoicePanel = ({ 
  isListening, 
  isSpeaking, 
  voiceStatus, 
  onVoiceToggle,
  isSupported = true
}) => {
  const getVoiceButtonIcon = () => {
    if (!isSupported) return '🚫';
    if (isListening) return '🎤';
    if (isSpeaking) return '🔊';
    return '🎤';
  };

  const getButtonClass = () => {
    if (!isSupported) return 'voice-button disabled';
    if (isListening) return 'voice-button listening';
    if (isSpeaking) return 'voice-button speaking';
    return 'voice-button';
  };

  return (
    <div className="voice-panel">
      <div className="voice-container">
        {/* 음성 시각화 */}
        <VoiceVisualizer isActive={isListening || isSpeaking} />

        {/* 메인 음성 버튼 */}
        <button
          className={getButtonClass()}
          onClick={onVoiceToggle}
          disabled={isSpeaking || !isSupported}
        >
          {getVoiceButtonIcon()}
        </button>

        {/* 음성 상태 */}
        <div className="voice-status">
          {voiceStatus}
          {!isSupported && (
            <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              음성인식이 지원되지 않습니다
            </div>
          )}
        </div>

        {/* 상태별 안내 메시지 */}
        <div style={{ 
          fontSize: '0.85rem', 
          color: 'rgba(255, 255, 255, 0.8)', 
          marginTop: '0.5rem', 
          textAlign: 'center',
          minHeight: '20px'
        }}>
          {isListening && "말씀하세요..."}
          {isSpeaking && "도로시가 응답 중입니다"}
          {!isListening && !isSpeaking && isSupported && "마이크 버튼을 눌러 대화하세요"}
          {!isSupported && "텍스트로 대화해주세요"}
        </div>
      </div>
    </div>
  );
};

export default VoicePanel;