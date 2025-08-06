
# Slack 메시지 자동 웹페이지 변환 프로젝트

이 프로젝트는 특정 Slack 채널의 메시지와 스레드를 기반으로 웹페이지를 자동으로 생성하고 업데이트합니다. Gemini AI를 사용하여 Slack 메시지를 서식이 잘 갖춰진 가독성 높은 HTML 콘텐츠로 변환한 후, Vercel을 통해 웹에 호스팅합니다.

## 주요 기능

- **실시간 자동화:** 새로운 Slack 메시지가 작성되면 즉시 해당 내용으로 웹페이지가 생성됩니다.
- **스레드 업데이트:** Slack 스레드에 달린 답글은 해당하는 웹페이지에 자동으로 추가되어, 대화의 흐름을 하나의 페이지에 온전히 담아냅니다.
- **AI 기반 콘텐츠 변환:** Google의 Gemini AI를 활용하여 단순 텍스트를 구조화된 HTML로 지능적으로 변환하여 가독성을 극대화합니다.
- **서버리스 아키텍처:** Next.js로 구축되고 Vercel에 배포되며, 데이터 저장은 Vercel Postgres를 사용합니다.

---

## 기술 스택

- **프레임워크:** [Next.js](https://nextjs.org/) (App Router)
- **언어:** [TypeScript](https://www.typescriptlang.org/)
- **스타일링:** [Tailwind CSS](https://tailwindcss.com/) 및 [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)
- **데이터베이스:** [Vercel Postgres](https://vercel.com/storage/postgres)
- **AI:** [Google Gemini](https://gemini.google.com/)
- **배포:** [Vercel](https://vercel.com)
- **API:** [Slack Bolt](https://slack.dev/bolt-js)

---

## 설치 및 설정 방법

### 1. 저장소 복제 (Clone)

```bash
git clone https://github.com/garimto81/slack-to-webpage.git
cd slack-to-webpage
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

이 프로젝트가 정상적으로 동작하려면 여러 서비스의 환경 변수 설정이 필요합니다. 프로젝트 루트에 `.env.local` 파일을 생성하여 관리할 수 있습니다.

1.  **Vercel 프로젝트 연결:**
    로컬 저장소를 Vercel 프로젝트와 연결하여 환경 변수를 편리하게 관리합니다.
    ```bash
    npx vercel link
    ```

2.  **Vercel에 비밀 키 추가:**
    Vercel CLI를 사용하여 민감한 정보들을 안전하게 추가합니다. 이 방법을 사용하면 코드가 아닌 Vercel 서버에만 비밀 키가 저장됩니다.
    ```bash
    # Gemini API 키 추가
    npx vercel env add GEMINI_API_KEY

    # Slack 봇 토큰 추가 (xoxb- 로 시작)
    npx vercel env add SLACK_BOT_TOKEN

    # Slack Signing Secret 추가
    npx vercel env add SLACK_SIGNING_SECRET

    # 모니터링할 Slack 채널 ID 추가
    npx vercel env add SLACK_CHANNEL_ID
    ```

3.  **로컬로 환경 변수 가져오기:**
    이 명령어를 실행하면 Vercel에 설정된 모든 변수(Vercel Postgres의 `POSTGRES_URL` 포함)를 로컬의 `.env.local` 파일로 가져옵니다.
    ```bash
    npx vercel env pull .env.local
    ```

### 4. 데이터베이스 테이블 생성

Vercel Postgres 데이터베이스에 접속하여, `scripts/create-pages-table.sql` 파일에 있는 SQL 스크립트를 실행하여 `pages` 테이블을 생성합니다.

### 5. Vercel에 배포하기

모든 변경사항을 커밋하고 `main` 브랜치에 푸시합니다. Vercel이 자동으로 프로젝트를 빌드하고 배포합니다.

```bash
git push origin main
```

---

## 동작 방식

1.  **이벤트 발생:** 지정된 Slack 채널에 새 메시지가 작성되면 이벤트가 발생합니다.
2.  **API 엔드포인트 호출:** 이벤트 정보는 Vercel에 배포된 `/api/slack/events` 엔드포인트로 전송됩니다.
3.  **AI 변환:** API는 메시지 내용을 Gemini AI에 전달하고, AI는 구조화된 HTML을 반환합니다.
4.  **데이터베이스 저장:** 생성된 HTML은 Slack 메시지의 타임스탬프(`thread_ts`)와 함께 Vercel Postgres 데이터베이스에 저장됩니다.
5.  **프론트엔드 렌더링:** 사용자가 `/<thread_ts>` 주소로 접속하면, Next.js 프론트엔드는 데이터베이스에서 HTML을 가져와 화면에 렌더링합니다.
