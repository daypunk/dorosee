import { useState, useRef, useCallback } from 'react';

const useAdvancedTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsMode, setTtsMode] = useState('web'); // 'web', 'openai', 'ttsmaker'
  const synthRef = useRef(null);
  const audioRef = useRef(null);

  const initializeSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // 1. 웹 브라우저 내장 TTS
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
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('웹 TTS 시작:', text.substring(0, 30) + '...');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('웹 TTS 완료');
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        console.error('웹 TTS 오류');
      };

      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('웹 TTS 오류:', error);
      setIsSpeaking(false);
    }
  }, []);

  // 2. OpenAI TTS
  const speakWithOpenAI = useCallback(async (text) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.warn('OpenAI API 키가 없어서 웹 TTS로 대체');
      return speakWithWeb(text);
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
  }, [speakWithWeb]);

  // 3. TTSMaker API
  const speakWithTTSMaker = useCallback(async (text) => {
    const apiKey = import.meta.env.VITE_TTSMAKER_API_KEY;
    if (!apiKey || apiKey === 'your_ttsmaker_api_key_here') {
      console.warn('TTSMaker API 키가 없어서 OpenAI TTS로 대체');
      return speakWithOpenAI(text);
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
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.log('TTSMaker TTS 재생 완료');
      };

      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('TTSMaker TTS 재생 오류');
      };

      await audioRef.current.play();
      console.log('TTSMaker TTS 재생 시작');

    } catch (error) {
      console.error('TTSMaker TTS 오류:', error);
      setIsSpeaking(false);
      speakWithOpenAI(text);
    }
  }, [speakWithOpenAI]);

  // 메인 TTS 함수
  const speakText = useCallback((text) => {
    if (!text) return;

    console.log(`TTS 모드: ${ttsMode}, 텍스트: ${text.substring(0, 50)}...`);

    switch (ttsMode) {
      case 'ttsmaker':
        speakWithTTSMaker(text);
        break;
      case 'openai':
        speakWithOpenAI(text);
        break;
      case 'web':
      default:
        speakWithWeb(text);
        break;
    }
  }, [ttsMode, speakWithTTSMaker, speakWithOpenAI, speakWithWeb]);

  const stopSpeaking = useCallback(() => {
    // 웹 TTS 중지
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    // API TTS 중지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsSpeaking(false);
    console.log('TTS 중지됨');
  }, []);

  // TTS 모드 변경
  const switchTTSMode = useCallback((mode) => {
    stopSpeaking();
    setTtsMode(mode);
    console.log(`TTS 모드 변경: ${mode}`);
  }, [stopSpeaking]);

  // 사용 가능한 TTS 모드 확인
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
    getAvailableModes
  };
};

export default useAdvancedTTS; 