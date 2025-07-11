import { useState, useCallback, useEffect } from 'react';

const useAccessibilityProfile = () => {
  const [profile, setProfile] = useState({
    visualImpairment: false,
    hearingImpairment: false,
    elderly: false,
    cognitiveImpairment: false,
    language: 'ko',
    fontSize: 'normal',
    highContrast: false,
    reduceMotion: false
  });
  
  const [interactionHistory, setInteractionHistory] = useState([]);
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);

  const recordInteraction = useCallback((interaction) => {
    setInteractionHistory(prev => {
      const newHistory = [...prev, {
        ...interaction,
        timestamp: new Date().toISOString()
      }].slice(-50);
      
      return newHistory;
    });
  }, []);

  const updateProfile = useCallback((updates) => {
    setProfile(prev => ({
      ...prev,
      ...updates
    }));
    
    try {
      localStorage.setItem('dorosee_accessibility_profile', JSON.stringify({
        ...profile,
        ...updates
      }));
    } catch (error) {
      console.log('프로필 저장 실패:', error);
    }
  }, [profile]);

  const detectAccessibilityNeeds = useCallback(() => {
    if (!autoDetectionEnabled || interactionHistory.length < 5) {
      return profile;
    }

    const recentHistory = interactionHistory.slice(-20);
    const detectedProfile = { ...profile };

    const voiceOnlyRatio = recentHistory.filter(h => h.type === 'voice').length / recentHistory.length;
    if (voiceOnlyRatio > 0.8 && !detectedProfile.visualImpairment) {
      detectedProfile.visualImpairment = true;
      console.log('시각장애 사용자로 감지됨 (음성 사용 비율:', voiceOnlyRatio, ')');
    }

    const textOnlyRatio = recentHistory.filter(h => h.type === 'text').length / recentHistory.length;
    if (textOnlyRatio > 0.9 && !detectedProfile.hearingImpairment) {
      detectedProfile.hearingImpairment = true;
      console.log('청각장애 사용자로 감지됨 (텍스트 전용 비율:', textOnlyRatio, ')');
    }

    const formalLanguageCount = recentHistory.filter(h => 
      h.content && (
        h.content.includes('습니다') || 
        h.content.includes('해주세요') ||
        h.content.includes('부탁드립니다')
      )
    ).length;
    const formalRatio = formalLanguageCount / recentHistory.length;
    
    const slowResponseCount = recentHistory.filter(h => h.responseTime > 5000).length;
    const slowRatio = slowResponseCount / recentHistory.length;
    
    if ((formalRatio > 0.6 || slowRatio > 0.4) && !detectedProfile.elderly) {
      detectedProfile.elderly = true;
      console.log('고령자 사용자로 감지됨 (정중한 언어:', formalRatio, ', 느린 응답:', slowRatio, ')');
    }

    const repetitionCount = recentHistory.filter(h => 
      h.content && (
        h.content.includes('다시') ||
        h.content.includes('한번더') ||
        h.content.includes('못들었') ||
        h.content.includes('이해 안') ||
        h.content.includes('모르겠')
      )
    ).length;
    
    if (repetitionCount > 3 && !detectedProfile.cognitiveImpairment) {
      detectedProfile.cognitiveImpairment = true;
      console.log('인지적 지원이 필요한 사용자로 감지됨 (반복 요청:', repetitionCount, ')');
    }

    if (JSON.stringify(detectedProfile) !== JSON.stringify(profile)) {
      setProfile(detectedProfile);
    }

    return detectedProfile;
  }, [interactionHistory, autoDetectionEnabled, profile]);

  const detectBrowserAccessibilitySettings = useCallback(() => {
    const updates = {};

    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      updates.highContrast = true;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updates.reduceMotion = true;
    }

    const fontSize = window.getComputedStyle(document.documentElement).fontSize;
    const fontSizeValue = parseFloat(fontSize);
    if (fontSizeValue > 18) {
      updates.fontSize = 'large';
    } else if (fontSizeValue < 14) {
      updates.fontSize = 'small';
    }

    if (Object.keys(updates).length > 0) {
      updateProfile(updates);
    }
  }, [updateProfile]);

  const handleVoiceCommand = useCallback((command, responseTime = 0) => {
    recordInteraction({
      type: 'voice',
      content: command,
      responseTime: responseTime
    });
  }, [recordInteraction]);

  const handleTextInput = useCallback((text, responseTime = 0) => {
    recordInteraction({
      type: 'text',
      content: text,
      responseTime: responseTime
    });
  }, [recordInteraction]);

  const handleTouchInteraction = useCallback((element, responseTime = 0) => {
    recordInteraction({
      type: 'touch',
      element: element,
      responseTime: responseTime
    });
  }, [recordInteraction]);

  const getAccessibilityRecommendations = useCallback(() => {
    const recommendations = [];

    if (profile.visualImpairment) {
      recommendations.push({
        type: 'visual',
        message: '음성 피드백이 활성화되었습니다',
        action: 'voice_feedback_enabled'
      });
    }

    if (profile.hearingImpairment) {
      recommendations.push({
        type: 'hearing',
        message: '시각적 알림이 강화되었습니다',
        action: 'visual_alerts_enabled'
      });
    }

    if (profile.elderly) {
      recommendations.push({
        type: 'elderly',
        message: '친근하고 정중한 대화 모드가 활성화되었습니다',
        action: 'respectful_mode_enabled'
      });
    }

    if (profile.cognitiveImpairment) {
      recommendations.push({
        type: 'cognitive',
        message: '단순하고 명확한 안내 모드가 활성화되었습니다',
        action: 'simplified_mode_enabled'
      });
    }

    return recommendations;
  }, [profile]);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('dorosee_accessibility_profile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(prev => ({ ...prev, ...parsedProfile }));
      }
    } catch (error) {
      console.log('프로필 로드 실패:', error);
    }

    detectBrowserAccessibilitySettings();
  }, [detectBrowserAccessibilitySettings]);

  useEffect(() => {
    if (autoDetectionEnabled && interactionHistory.length > 0) {
      detectAccessibilityNeeds();
    }
  }, [interactionHistory, autoDetectionEnabled, detectAccessibilityNeeds]);

  return {
    profile,
    updateProfile,
    recordInteraction,
    handleVoiceCommand,
    handleTextInput,
    handleTouchInteraction,
    getAccessibilityRecommendations,
    setAutoDetectionEnabled,
    autoDetectionEnabled,
    interactionHistory: interactionHistory.slice(-10)
  };
};

export default useAccessibilityProfile;