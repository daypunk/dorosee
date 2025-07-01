# 도로시 (Dorosee) - 핸들링 웹

> 거리에서 만나는 친근한 AI 커뮤니케이터

도로시는 시민들이 일상에서 필요한 정보를 쉽고 빠르게 얻을 수 있도록 도와주는 음성 기반 AI 무인이동체입니다.
기존 실외 배달로봇의 생태계를 활용하여 공공에 실질적인 가치를 전달하고자 해요.
자율주행은 Unity 시뮬레이션으로 검증했고, 객체탐지는 YOLO와 Mediapipe를 사용했어요.

현재 repository는 도로시의 웹 기반 기능들을 담고 있어요.
길 안내부터 날씨 정보, 실종자 제보까지 - 마치 동네에서 친근한 이웃을 만난 것처럼 자연스럽게 대화할 수 있습니다.
과기부 장관상을 목표로 합니다. 🏆

## 핸들링 웹 주요 기능

### 💬 음성 대화
- **말하기**: 마이크 버튼 클릭 후 바로 대화 시작
- **듣기**: OpenAI TTS, 브라우저 TTS 등 다양한 음성 출력 옵션
- **자연스러운 응답**: 단답이 아닌 친근하고 도움되는 대화

### 📍 위치 기반 서비스
- **지하철역 찾기**: "지하철역 어디 있어?" → 가장 가까운 역과 도보 시간 안내
- **편의점 찾기**: 주변 편의점 검색 및 거리 정보
- **현재 위치**: 카카오맵 기반 정확한 주소 정보

### 🌤️ 날씨 정보
- 실시간 날씨 상태와 온도
- 상황별 맞춤 조언 ("우산 꼭 챙기시고", "따뜻하게 입으세요" 등)
- 위치 기반 지역별 날씨

### 👥 실종자 제보
- 실시간 실종자 정보 조회
- 간편한 목격 제보 시스템
- 상세 정보 및 제보 폼 제공

## 웹에선 어떤 걸 썼나요? 🚀

```
Frontend: React 19 + Vite
UI: TailwindCSS + Framer Motion
애니메이션: Rive
음성: Web Speech API + OpenAI TTS
지도: 카카오맵 API
라우팅: React Router
HTTP: Fetch API
```

## 🛠️ 설치 및 실행

```bash
# 프로젝트 클론
git clone [repository-url]
cd Dorosee

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local에서 API 키들 설정

# 개발 서버 실행
npm run dev
```

## 🔑 환경변수 설정

`.env.local` 파일에 다음 정보를 설정해주세요:

```bash
# OpenAI (TTS/채팅)
VITE_OPENAI_API_KEY=sk-your-openai-key

# 카카오맵 (위치 서비스)
VITE_KAKAO_API_KEY=your-kakao-key

# 실종자 API
VITE_MISSING_PERSON_ESNTL_ID=your-esntl-id
VITE_MISSING_PERSON_AUTH_KEY=your-auth-key

# 기상청 API (선택)
VITE_WEATHER_API_KEY=your-weather-key

# TTSMaker (선택)
VITE_TTSMAKER_API_KEY=your-ttsmaker-key
```

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── chat/           # 챗봇 관련 컴포넌트
│   └── debug/          # 개발용 테스트 도구
├── hooks/              # 커스텀 훅
│   ├── useChat.js      # 채팅 로직
│   └── useAdvancedTTS.js # TTS 관리
├── services/           # API 서비스
│   ├── aiService.js    # AI 응답 생성
│   ├── kakaoLocationService.js # 위치 서비스
│   └── weatherService.js # 날씨 정보
├── pages/
│   ├── Home.jsx        # 메인 화면
│   └── pwa/            # 실종자 제보 시스템
└── utils/              # 유틸리티 함수
```

*"기술로 사람과 사람을 연결하는 따뜻한 서비스"* - 도로시 팀
