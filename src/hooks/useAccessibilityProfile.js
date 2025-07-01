import { useState, useCallback, useEffect } from 'react';

const useAccessibilityProfile = () => {
  const [profile, setProfile] = useState({
    visualImpairment: false,
    hearingImpairment: false,
    elderly: false,
    cognitiveImpairment: false,
    language: 'ko',
    fontSize: 'normal', // small, normal, large
    highContrast: false,
    reduceMotion: false
  });
  
  const [interactionHistory, setInteractionHistory] = useState([]);
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);

  // 사용자 상호작용 기록
  const recordInteraction = useCallback((interaction) => {
    setInteractionHistory(prev => {
      const newHistory = [...prev, {
        ...interaction,
        timestamp: new Date().toISOString()
      }].slice(-50); // 최근 50개만 유지
      
      return newHistory;
    });
  }, []);

  // 접근성 프로필 수동 설정
  const updateProfile = useCallback((updates) => {
    setProfile(prev => ({
      ...prev,
      ...updates
    }));
    
    // 로컬 스토리지에 저장 (선택사항)
    try {
      localStorage.setItem('dorosee_accessibility_profile', JSON.stringify({
        ...profile,
        ...updates
      }));
    } catch (error) {
      console.log('프로필 저장 실패:', error);
    }
  }, [profile]);

  // 자동 감지 로직
  const detectAccessibilityNeeds = useCallback(() => {
    if (!autoDetectionEnabled || interactionHistory.length < 5) {
      return profile;
    }

    const recentHistory = interactionHistory.slice(-20); // 최근 20개 상호작용
    const detectedProfile = { ...profile };

    // 1. 시각장애 감지
    const voiceOnlyRatio = recentHistory.filter(h => h.type === 'voice').length / recentHistory.length;
    if (voiceOnlyRatio > 0.8 && !detectedProfile.visualImpairment) {
      detectedProfile.visualImpairment = true;
      console.log('시각장애 사용자로 감지됨 (음성 사용 비율:', voiceOnlyRatio, ')');
    }

    // 2. 청각장애 감지
    const textOnlyRatio = recentHistory.filter(h => h.type === 'text').length / recentHistory.length;
    if (textOnlyRatio > 0.9 && !detectedProfile.hearingImpairment) {
      detectedProfile.hearingImpairment = true;
      console.log('청각장애 사용자로 감지됨 (텍스트 전용 비율:', textOnlyRatio, ')');
    }

    // 3. 고령자 감지
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

    // 4. 인지장애 감지
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

    // 감지된 변화가 있으면 프로필 업데이트
    if (JSON.stringify(detectedProfile) !== JSON.stringify(profile)) {
      setProfile(detectedProfile);
    }

    return detectedProfile;
  }, [interactionHistory, autoDetectionEnabled, profile]);

  // 브라우저 접근성 설정 감지
  const detectBrowserAccessibilitySettings = useCallback(() => {
    const updates = {};

    // 고대비 모드 감지
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      updates.highContrast = true;
    }

    // 모션 감소 설정 감지
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updates.reduceMotion = true;
    }

    // 폰트 크기 설정 감지 (대략적)
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

  // 음성 명령 처리를 위한 헬퍼
  const handleVoiceCommand = useCallback((command, responseTime = 0) => {
    recordInteraction({
      type: 'voice',
      content: command,
      responseTime: responseTime
    });
  }, [recordInteraction]);

  // 텍스트 입력 처리를 위한 헬퍼
  const handleTextInput = useCallback((text, responseTime = 0) => {
    recordInteraction({
      type: 'text',
      content: text,
      responseTime: responseTime
    });
  }, [recordInteraction]);

  // 터치/클릭 상호작용 처리
  const handleTouchInteraction = useCallback((element, responseTime = 0) => {
    recordInteraction({
      type: 'touch',
      element: element,
      responseTime: responseTime
    });
  }, [recordInteraction]);

  // 접근성 권장사항 생성
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

  // 프로필 초기화 (로컬 스토리지에서 로드)
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

    // 브라우저 접근성 설정 감지
    detectBrowserAccessibilitySettings();
  }, [detectBrowserAccessibilitySettings]);

  // 자동 감지 실행 (상호작용 히스토리가 변경될 때)
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
    interactionHistory: interactionHistory.slice(-10) // 최근 10개만 외부 노출
  };
};

export default useAccessibilityProfile;