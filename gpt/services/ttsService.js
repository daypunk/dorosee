// TTS 서비스 (브라우저 내장 + 외부 API)
class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  // 브라우저 내장 TTS (기본)
  speakBrowser(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('음성합성이 지원되지 않습니다'));
        return;
      }

      // 기존 음성 중지
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'ko-KR';
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  // TTSMaker API (고품질)
  async speakTTSMaker(text, options = {}) {
    try {
      const response = await fetch('https://api.ttsmaker.com/v1/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_TTSMAKER_API_KEY}`
        },
        body: JSON.stringify({
          text,
          voice: options.voice || 'ko-KR-female',
          format: 'mp3',
          speed: options.speed || 1.0
        })
      });

      if (!response.ok) {
        throw new Error('TTSMaker API 오류');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return this.playAudio(audioUrl);
    } catch (error) {
      console.warn('TTSMaker 실패, 브라우저 TTS 사용:', error);
      return this.speakBrowser(text, options);
    }
  }

  // 오디오 재생
  playAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('오디오 재생 실패'));
      };
      audio.play();
    });
  }

  // 음성 중지
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // 사용 가능한 음성 목록
  getVoices() {
    return this.synth ? this.synth.getVoices() : [];
  }

  // 자동 TTS (TTSMaker → 브라우저 fallback)
  async speak(text, options = {}) {
    const apiKey = process.env.REACT_APP_TTSMAKER_API_KEY;
    
    if (apiKey && options.highQuality !== false) {
      try {
        return await this.speakTTSMaker(text, options);
      } catch (error) {
        console.warn('고품질 TTS 실패, 기본 TTS 사용');
      }
    }
    
    return this.speakBrowser(text, options);
  }
}

export default new TTSService();