# 도로시 (Dorosee) - 핸들링 웹

> 거리에서 만나는 친근한 AI 커뮤니케이터
> 과학기술정보통신부 해커톤 최우수상 수상 🏆

## 📋 프로젝트 개요

도로시는 시민들이 일상에서 필요한 정보를 음성으로 쉽고 빠르게 얻을 수 있도록 도와주는 AI 플랫폼입니다. 
길 안내, 날씨 정보, 주변 시설 검색, 실종자 제보 등의 기능을 자연스러운 음성 대화로 제공합니다.

## ✨ 주요 기능

### 음성 인터페이스
- **STT**: Web Speech API 기반 실시간 음성 인식
- **TTS**: OpenAI TTS + 브라우저 내장 TTS fallback
- **자연스러운 대화**: 2문장 이내의 간결하고 친근한 AI 응답

### 위치 기반 서비스
- **실시간 위치 검색**: GPS 기반 주변 시설 안내
- **지하철역 찾기**: 가장 가까운 역과 도보 시간 제공
- **편의점 검색**: 거리별 정렬된 주변 편의점 정보
- **카카오맵 연동**: 정확한 위치 정보와 길찾기 서비스

### 날씨 정보
- **기상청 단기예보 API**: 실시간 정확한 날씨 정보
- **맞춤형 조언**: 상황별 생활 팁 제공
- **지역별 예보**: GPS 좌표 기반 세밀한 지역 날씨

### 실종자 제보 플랫폼
- **정부 API 연동**: 안전Dream 실종자 정보 실시간 조회
- **모바일 PWA**: 앱 설치 없이 사용 가능한 웹앱
- **제보 시스템**: 간편한 목격 정보 입력 폼
- **개인정보 보호**: 블러 처리된 사진으로 프라이버시 보장

## 🚀 Stack

### Frontend
- **React 19** + **Vite**
- **TailwindCSS**
- **Framer Motion**
- **Rive**

### AI & Service
- **OpenAI GPT-4o**
- **OpenAI TTS nova**
- **Web Speech API**

### API
- **카카오맵 API**: 위치 서비스
- **기상청 단기예보 API**: 날씨 정보
- **안전Dream API**: 실종자 정보


## 🛠️ 설치 및 실행

```bash
# 프로젝트 클론
git clone [repository-url]
cd Dorosee

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

## 🔑 환경변수 설정

`.env.local` 파일에 다음 API 키들을 설정해주세요:

```bash
# OpenAI API (필수)
VITE_OPENAI_API_KEY=your-openai-key

# 카카오맵 API (필수)
VITE_KAKAO_API_KEY=your-kakao-rest-api-key

# 기상청 단기예보 API (필수)
VITE_WEATHER_API_KEY=your-weather-servicekey

# 실종자 API (필수)
VITE_MISSING_PERSON_ESNTL_ID=your-esntl-id
VITE_MISSING_PERSON_AUTH_KEY=your-auth-key
```

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── chat/               # 챗봇 UI 컴포넌트
│   └── debug/              # 개발 도구
├── hooks/
│   ├── useChat.js          # 채팅 로직 관리
│   └── useAdvancedTTS.js   # TTS 시스템 관리
├── services/
│   ├── aiService.js        # OpenAI API 통합
│   ├── kakaoLocationService.js  # 위치 서비스
│   └── weatherService.js   # 날씨 정보 API
├── pages/
│   ├── Home.jsx            # 메인 음성 대화 화면
│   └── pwa/                # 실종자 제보 PWA
│       ├── index.jsx       # 실종자 목록
│       ├── Detail.jsx      # 상세 정보 및 제보 폼
│       └── ThankYou.jsx    # 제보 완료 페이지
└── utils/                  # 유틸리티 함수
```


## 🏆 개발팀

**도로시 팀** - 기술로 사람과 사람을 연결하는 따뜻한 서비스

- **김대희** (PM)
- **홍승완** (Physical/CV)
- **최예희** (AI/CV)
- **이동건** (AI/UX)
- **백하림** (Frontend/UX)
