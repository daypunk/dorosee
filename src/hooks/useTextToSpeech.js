import { useState, useRef, useCallback } from 'react';

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsMode, setTtsMode] = useState('openai'); // 'web' 또는 'openai'
  const synthRef = useRef(null);
  const audioRef = useRef(null);

  const initializeSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // OpenAI TTS 사용
  const speakWithOpenAI = useCallback(async (text) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.warn('OpenAI API 키가 없어서 Web TTS로 대체');
      return speakWithWeb(text);
    }

    try {
      setIsSpeaking(true);
      console.log('OpenAI TTS 호출 시작:', text.substring(0, 50) + '...');

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1', // tts-1-hd는 고품질이지만 느림
          input: text,
          voice: 'nova', // 가장 밝고 명랑한 여성 음성 (shimmer보다 더 밝음)
          speed: 1.2 // 더 빠르고 활발하게
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API 오류: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 기존 오디오 정지
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl); // 메모리 정리
        console.log('OpenAI TTS 재생 완료');
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('OpenAI TTS 재생 오류');
      };

      await audioRef.current.play();
      console.log('OpenAI TTS 재생 시작');

    } catch (error) {
      console.error('OpenAI TTS 오류:', error);
      setIsSpeaking(false);
      // 오류 시 Web TTS로 대체
      speakWithWeb(text);
    }
  }, []);

  // 기존 Web Speech API TTS
  const speakWithWeb = useCallback((text) => {
    if (!synthRef.current) return;

    try {
      // 기존 음성 중지
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.1; // 조금 더 빠르게
      utterance.pitch = 1.3; // 더 밝고 명랑하게
      utterance.volume = 1.0;

      // 한국어 여성 음성 중 가장 명랑한 음성 선택
      const voices = synthRef.current.getVoices();
      const koreanFemaleVoices = voices.filter(voice => 
        voice.lang.includes('ko') && 
        (voice.name.includes('Female') || voice.name.includes('여') || voice.name.includes('Yuna') || voice.name.includes('Heami'))
      );
      
      if (koreanFemaleVoices.length > 0) {
        // 명랑한 이름을 가진 음성 우선 선택
        const brightVoice = koreanFemaleVoices.find(voice => 
          voice.name.includes('Yuna') || voice.name.includes('Kyuri') || voice.name.includes('Heami')
        ) || koreanFemaleVoices[0];
        utterance.voice = brightVoice;
      } else {
        const koreanVoice = voices.find(voice => voice.lang.includes('ko'));
        if (koreanVoice) {
          utterance.voice = koreanVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Web TTS 시작');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Web TTS 완료');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        console.error('Web TTS 오류');
      };

      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Web TTS 오류:', error);
      setIsSpeaking(false);
    }
  }, []);

  // 메인 TTS 함수
  const speakText = useCallback((text) => {
    if (!text) return;

    if (ttsMode === 'openai') {
      speakWithOpenAI(text);
    } else {
      speakWithWeb(text);
    }
  }, [ttsMode, speakWithOpenAI, speakWithWeb]);

  const stopSpeaking = useCallback(() => {
    // Web TTS 중지
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    // OpenAI TTS 중지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsSpeaking(false);
  }, []);

  // TTS 모드 변경
  const switchTTSMode = useCallback((mode) => {
    stopSpeaking(); // 재생 중인 음성 중지
    setTtsMode(mode);
    console.log(`TTS 모드 변경: ${mode}`);
  }, [stopSpeaking]);

  return {
    isSpeaking,
    ttsMode,
    initializeSpeech,
    speakText,
    stopSpeaking,
    switchTTSMode
  };
};

export default useTextToSpeech;