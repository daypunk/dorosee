// STT 서비스 (음성인식)
class STTService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.initializeRecognition();
  }

  initializeRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('음성인식이 지원되지 않는 브라우저입니다');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'ko-KR';
    this.recognition.maxAlternatives = 1;
  }

  // 음성인식 시작
  startListening(callbacks = {}) {
    if (!this.recognition) {
      throw new Error('음성인식이 지원되지 않습니다');
    }

    if (this.isListening) {
      this.stopListening();
    }

    // 콜백 설정
    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      callbacks.onResult?.(transcript, confidence);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      callbacks.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd?.();
    };

    this.recognition.start();
  }

  // 음성인식 중지
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // 음성인식 상태
  getIsListening() {
    return this.isListening;
  }

  // 음성인식 지원 여부
  isSupported() {
    return !!this.recognition;
  }
}

export default new STTService();