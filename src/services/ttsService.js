class TTSService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  cleanTextForTTS(text) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    
    return text
      .replace(emojiRegex, '')
      .replace(/[🔥⭐✨🎉💝❤️💖💕😊😀😄😆😍🥰😘😉😋😎🤗🙌👍👏💪🎯🚀]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  speakBrowser(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('음성합성이 지원되지 않습니다'));
        return;
      }

      this.synth.cancel();

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

  async speakOpenAI(text, options = {}) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || !apiKey.startsWith('sk-')) {
      console.warn('OpenAI API 키가 없어서 브라우저 TTS 사용');
      return this.speakBrowser(text, options);
    }

    try {
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

  async speakTTSMaker(text, options = {}) {
    try {
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

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  getVoices() {
    return this.synth ? this.synth.getVoices() : [];
  }

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