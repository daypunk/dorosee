// TTS 서비스 (브라우저 내장 + 외부 API)
class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  // 이모지 및 특수문자 제거 (TTS용 텍스트 정제)
  cleanTextForTTS(text) {
    // 이모지 제거 (유니코드 이모지 범위)
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    
    return text
      .replace(emojiRegex, '') // 이모지 제거
      .replace(/[🔥⭐✨🎉💝❤️💖💕😊😀😄😆😍🥰😘😉😋😎🤗🙌👍👏💪🎯🚀]/g, '') // 추가 이모지
      .replace(/\s+/g, ' ') // 연속 공백 정리
      .trim(); // 앞뒤 공백 제거
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

      // TTS용 텍스트 정제
      const cleanText = this.cleanTextForTTS(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
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

  // OpenAI TTS (고품질)
  async speakOpenAI(text, options = {}) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.warn('OpenAI API 키가 없어서 브라우저 TTS 사용');
      return this.speakBrowser(text, options);
    }

    try {
      // TTS용 텍스트 정제
      const cleanText = this.cleanTextForTTS(text);
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: options.voice || 'nova',
          speed: options.speed || 1.2
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API 오류: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return this.playAudio(audioUrl);
    } catch (error) {
      console.warn('OpenAI TTS 실패, 브라우저 TTS 사용:', error);
      return this.speakBrowser(text, options);
    }
  }

  // TTSMaker API (고품질)
  async speakTTSMaker(text, options = {}) {
    try {
      // TTS용 텍스트 정제
      const cleanText = this.cleanTextForTTS(text);
      
      const response = await fetch('https://api.ttsmaker.com/v1/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_TTSMAKER_API_KEY}`
        },
        body: JSON.stringify({
          text: cleanText,
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
      console.warn('TTSMaker 실패, OpenAI TTS 사용:', error);
      return this.speakOpenAI(text, options);
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

  // 자동 TTS (OpenAI → 브라우저 fallback)
  async speak(text, options = {}) {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (openaiKey && openaiKey.startsWith('sk-')) {
      try {
        return await this.speakOpenAI(text, options);
      } catch (error) {
        console.warn('OpenAI TTS 실패, 브라우저 TTS 사용');
      }
    }
    
    return this.speakBrowser(text, options);
  }
}

export default new TTSService();