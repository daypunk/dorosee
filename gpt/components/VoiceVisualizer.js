import React from 'react';

const VoiceVisualizer = ({ isActive }) => {
  return (
    <div className="voice-visualizer">
      <div className="wave-bars">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="wave-bar"
            style={{
              height: isActive 
                ? `${Math.random() * 40 + 10}px` 
                : '4px',
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceVisualizer;