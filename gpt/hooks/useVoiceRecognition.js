import { useState, useRef, useCallback } from 'react';

const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('준비됨');
  const recognitionRef = useRef(null);

  const initializeRecognition = useCallback(() => {
    console.log('음성인식 초기화 시작...');
    
    // 브라우저 지원 확인
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('브라우저에서 음성인식을 지원하지 않습니다.');
      setVoiceStatus('음성인식 미지원');
      return false;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // 기본 설정
      recognitionRef.current.continuous = false; // true에서 false로 변경
      recognitionRef.current.interimResults = false; // true에서 false로 변경
      recognitionRef.current.lang = 'ko-KR';
      recognitionRef.current.maxAlternatives = 1;
      
      console.log('음성인식 초기화 완료');
      return true;
    } catch (error) {
      console.error('음성인식 초기화 실패:', error);
      setVoiceStatus('초기화 실패');
      return false;
    }
  }, []);

  const startListening = useCallback((onResult) => {
    console.log('음성인식 시작 요청...');
    
    if (!recognitionRef.current) {
      console.error('음성인식이 초기화되지 않았습니다.');
      alert('음성인식이 지원되지 않는 브라우저입니다.');
      return;
    }

    if (isListening) {
      console.log('이미 듣고 있음, 중지 요청');
      recognitionRef.current.stop();
      return;
    }

    // 이벤트 핸들러 설정
    recognitionRef.current.onstart = () => {
      console.log('음성인식 시작됨');
      setIsListening(true);
      setVoiceStatus('듣는 중...');
    };

    recognitionRef.current.onresult = (event) => {
      console.log('음성인식 결과:', event);
      
      if (event.results && event.results.length > 0) {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          console.log('최종 인식 결과:', transcript);
          
          if (transcript) {
            onResult(transcript);
          }
        }
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('음성인식 오류:', event.error);
      
      let errorMessage = '음성인식 오류';
      switch(event.error) {
        case 'not-allowed':
          errorMessage = '마이크 권한이 거부되었습니다';
          break;
        case 'no-speech':
          errorMessage = '음성이 감지되지 않았습니다';
          break;
        case 'audio-capture':
          errorMessage = '마이크를 사용할 수 없습니다';
          break;
        case 'network':
          errorMessage = '네트워크 오류가 발생했습니다';
          break;
        default:
          errorMessage = `음성인식 오류: ${event.error}`;
      }
      
      setVoiceStatus(errorMessage);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      console.log('음성인식 종료됨');
      setIsListening(false);
      setVoiceStatus('준비됨');
    };

    // 음성인식 시작
    try {
      console.log('음성인식 start() 호출');
      recognitionRef.current.start();
    } catch (error) {
      console.error('음성인식 시작 실패:', error);
      setVoiceStatus('시작 실패');
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    console.log('음성인식 중지 요청');
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // 음성인식 지원 여부 확인
  const isSupported = useCallback(() => {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }, []);

  return {
    isListening,
    voiceStatus,
    initializeRecognition,
    startListening,
    stopListening,
    isSupported
  };
};

export default useVoiceRecognition;