import { useState, useRef, useCallback } from 'react';

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsMode, setTtsMode] = useState('openai');
  const synthRef = useRef(null);
  const audioRef = useRef(null);

  const initializeSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

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
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
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
      speakWithWeb(text);
    }
  }, []);

  const speakWithWeb = useCallback((text) => {
    if (!synthRef.current) return;

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

  const speakText = useCallback((text) => {
    if (!text) return;

    if (ttsMode === 'openai') {
      speakWithOpenAI(text);
    } else {
      speakWithWeb(text);
    }
  }, [ttsMode, speakWithOpenAI, speakWithWeb]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsSpeaking(false);
  }, []);

  const switchTTSMode = useCallback((mode) => {
    stopSpeaking();
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