import React from 'react';

const EmergencyAlert = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className={`emergency-alert ${show ? '' : 'hidden'}`}>
      <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
        🚨 응급상황 감지
      </h2>
      <p>즉시 신고하시겠습니까?</p>
      <div className="emergency-buttons">
        <a href="tel:119" className="emergency-btn fire">
          119 화재/응급의료
        </a>
        <a href="tel:112" className="emergency-btn police">
          112 신고/범죄
        </a>
      </div>
      <button
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          border: '1px solid #ccc',
          borderRadius: '5px',
          background: 'white',
          cursor: 'pointer'
        }}
        onClick={onClose}
      >
        닫기
      </button>
    </div>
  );
};

export default EmergencyAlert;