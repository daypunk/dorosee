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

  startListening(callbacks = {}) {
    if (!this.recognition) {
      throw new Error('음성인식이 지원되지 않습니다');
    }

    if (this.isListening) {
      this.stopListening();
    }

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

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  getIsListening() {
    return this.isListening;
  }

  isSupported() {
    return !!this.recognition;
  }
}

export default new STTService();