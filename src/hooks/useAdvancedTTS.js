import { useState, useRef, useCallback, useEffect } from 'react';

const useAdvancedTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsMode, setTtsMode] = useState('openai');
  const [isAudioContextInitialized, setIsAudioContextInitialized] = useState(false);
  const synthRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const initializeSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const initializeAudioContext = useCallback(() => {
    if (!isMobile || isAudioContextInitialized) return Promise.resolve();

    return new Promise((resolve) => {
      console.log('📱 모바일 오디오 컨텍스트 초기화 시작');
      
      const dummyAudio = new Audio();
      dummyAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBSuq7f6lFhAKgQG5jdBgHwYqr';
      dummyAudio.volume = 0.01;
      
      dummyAudio.play().then(() => {
        console.log('✅ 모바일 오디오 컨텍스트 초기화 완료');
        setIsAudioContextInitialized(true);
        resolve();
      }).catch((error) => {
        console.warn('⚠️ 모바일 오디오 컨텍스트 초기화 실패:', error);
        setIsAudioContextInitialized(true);
        resolve();
      });
    });
  }, [isMobile, isAudioContextInitialized]);

  const speakWithWeb = useCallback((text) => {
    if (!synthRef.current) return Promise.resolve();

    return new Promise((resolve) => {
    try {
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.1;
      utterance.pitch = 1.3;
      utterance.volume = 1.0;

      const voices = synthRef.current.getVoices();
      const koreanFemaleVoices = voices.filter(voice => 
        voice.lang.includes('ko') && 
        (voice.name.includes('Female') || voice.name.includes('여') || voice.name.includes('Yuna') || voice.name.includes('Heami'))
      );
      
      if (koreanFemaleVoices.length > 0) {
        const brightVoice = koreanFemaleVoices.find(voice => 
          voice.name.includes('Yuna') || voice.name.includes('Kyuri') || voice.name.includes('Heami')
        ) || koreanFemaleVoices[0];
        utterance.voice = brightVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('웹 TTS 시작:', text.substring(0, 30) + '...');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('웹 TTS 완료');
          resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        console.error('웹 TTS 오류');
          resolve();
      };

      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('웹 TTS 오류:', error);
      setIsSpeaking(false);
        resolve();
    }
    });
  }, []);

  const speakWithOpenAI = useCallback(async (text) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.warn('OpenAI API 키가 없어서 웹 TTS로 대체');
      return await speakWithWeb(text);
    }

    if (isMobile && !isAudioContextInitialized) {
      console.warn('📱 모바일에서 오디오 컨텍스트가 초기화되지 않아서 웹 TTS로 대체');
      return await speakWithWeb(text);
    }

    try {
      setIsSpeaking(true);
      console.log('OpenAI TTS 호출 시작:', text.substring(0, 30) + '...');

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'nova',
          speed: 1.2
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API 오류: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      audioRef.current = new Audio(audioUrl);
      
      if (isMobile) {
        audioRef.current.preload = 'auto';
        audioRef.current.volume = 1.0;
      }
      
      return new Promise((resolve, reject) => {
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.log('OpenAI TTS 재생 완료');
          resolve();
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('OpenAI TTS 재생 오류');
          resolve();
      };

        audioRef.current.play().then(() => {
      console.log('OpenAI TTS 재생 시작');
        }).catch((playError) => {
          console.error('OpenAI TTS 재생 시작 오류:', playError);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          
          if (isMobile) {
            console.warn('📱 모바일에서 OpenAI TTS 재생 실패, 웹 TTS로 대체');
            speakWithWeb(text).then(resolve).catch(resolve);
          } else {
            resolve();
          }
        });
      });

    } catch (error) {
      console.error('OpenAI TTS 오류:', error);
      setIsSpeaking(false);
      return await speakWithWeb(text);
    }
  }, [speakWithWeb, isMobile, isAudioContextInitialized]);

  const speakWithTTSMaker = useCallback(async (text) => {
    const apiKey = import.meta.env.VITE_TTSMAKER_API_KEY;
    if (!apiKey || apiKey === 'your_ttsmaker_api_key_here') {
      console.warn('TTSMaker API 키가 없어서 OpenAI TTS로 대체');
      return await speakWithOpenAI(text);
    }

    try {
      setIsSpeaking(true);
      console.log('TTSMaker TTS 호출 시작:', text.substring(0, 30) + '...');

      const response = await fetch('https://api.ttsmaker.com/v1/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text,
          voice: 'ko-KR-female',
          format: 'mp3',
          speed: 1.1
        })
      });

      if (!response.ok) {
        throw new Error(`TTSMaker API 오류: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      audioRef.current = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.log('TTSMaker TTS 재생 완료');
          resolve();
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('TTSMaker TTS 재생 오류');
          resolve();
      };

        audioRef.current.play().then(() => {
      console.log('TTSMaker TTS 재생 시작');
        }).catch((playError) => {
          console.error('TTSMaker TTS 재생 시작 오류:', playError);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          resolve();
        });
      });

    } catch (error) {
      console.error('TTSMaker TTS 오류:', error);
      setIsSpeaking(false);
      return await speakWithOpenAI(text);
    }
  }, [speakWithOpenAI]);

  const speakText = useCallback(async (text) => {
    if (!text) return Promise.resolve();

    if (isMobile && !isAudioContextInitialized) {
      console.log('📱 모바일에서 첫 번째 TTS 호출 - 오디오 컨텍스트 초기화 시도');
      await initializeAudioContext();
    }

    console.log(`TTS 모드: ${ttsMode}, 텍스트: ${text.substring(0, 50)}...`);

    switch (ttsMode) {
      case 'ttsmaker':
        return await speakWithTTSMaker(text);
      case 'openai':
        return await speakWithOpenAI(text);
      case 'web':
      default:
        return await speakWithWeb(text);
    }
  }, [ttsMode, speakWithTTSMaker, speakWithOpenAI, speakWithWeb, isMobile, isAudioContextInitialized, initializeAudioContext]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsSpeaking(false);
    console.log('TTS 중지됨');
  }, []);

  const switchTTSMode = useCallback((mode) => {
    stopSpeaking();
    setTtsMode(mode);
    console.log(`TTS 모드 변경: ${mode}`);
  }, [stopSpeaking]);

  const getAvailableModes = useCallback(() => {
    const modes = [
      { 
        id: 'web', 
        name: '웹 TTS', 
        icon: '🌐', 
        available: true,
        description: '브라우저 내장 음성'
      }
    ];

    if (import.meta.env.VITE_OPENAI_API_KEY?.startsWith('sk-')) {
      modes.push({
        id: 'openai',
        name: 'OpenAI TTS',
        icon: '🤖',
        available: true,
        description: 'AI 고품질 음성'
      });
    }

    if (import.meta.env.VITE_TTSMAKER_API_KEY && import.meta.env.VITE_TTSMAKER_API_KEY !== 'your_ttsmaker_api_key_here') {
      modes.push({
        id: 'ttsmaker',
        name: 'TTSMaker',
        icon: '🎙️',
        available: true,
        description: '전문 TTS 서비스'
      });
    }

    return modes;
  }, []);

  return {
    isSpeaking,
    ttsMode,
    initializeSpeech,
    speakText,
    stopSpeaking,
    switchTTSMode,
    getAvailableModes,
    initializeAudioContext,
    isAudioContextInitialized
  };
};

export default useAdvancedTTS; 