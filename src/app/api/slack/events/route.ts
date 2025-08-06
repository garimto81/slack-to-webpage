import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Pusher from 'pusher';

// Pusher 인스턴스 초기화
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateHtmlFromMessage(text: string): Promise<string> {
  // ... (이전과 동일한 Gemini AI 호출 로직)
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      다음 Slack 메시지를 기반으로, 시각적으로 매력적이고 가독성이 뛰어난 웹페이지용 HTML 콘텐츠를 생성해줘.
      - Tailwind CSS의 prose 클래스와 잘 어울리도록 스타일링해줘.
      - 중요한 키워드는 굵게(<strong>) 표시해줘.
      - 목록은 <ul>, <li> 태그를 사용해줘.
      - 코드 블록이 있다면 <pre><code> 태그로 감싸고, 적절한 클래스(예: 'language-javascript')를 추가해줘.
      - 전체를 <article> 태그로 감싸줘.

      --- 메시지 내용 ---
      ${text}
      --- end ---
    `;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let htmlContent = response.text();
    htmlContent = htmlContent.replace(/^```html\n/, '').replace(/\n```$/, '');
    return htmlContent;
  } catch (error) {
    console.error('Error calling Gemini AI:', error);
    const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<p>(AI 생성 실패) ${sanitizedText}</p>`;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const body = JSON.parse(rawBody);
  
  // ... (Slack 요청 검증 로직은 이전과 동일)

  if (body.type === 'event_callback') {
    const event = body.event;

    // ... (채널 및 봇 메시지 필터링 로직은 이전과 동일)

    if (event.type === 'message' && event.text) {
      try {
        const htmlContent = await generateHtmlFromMessage(event.text);
        const threadTs = event.thread_ts || event.ts;

        if (event.thread_ts && event.ts !== event.thread_ts) {
          await sql`UPDATE pages SET content = content || ${htmlContent} WHERE slack_thread_ts = ${threadTs}`;
          
          // Pusher 이벤트 발행 (업데이트)
          await pusher.trigger(`page-${threadTs}`, 'content-updated', {
            newContent: htmlContent
          });

        } else {
          await sql`INSERT INTO pages (slack_thread_ts, content) VALUES (${threadTs}, ${htmlContent}) ON CONFLICT (slack_thread_ts) DO UPDATE SET content = EXCLUDED.content`;
        }

      } catch (error) {
        console.error('Error processing message event:', error);
        return NextResponse.json({ message: 'Error processing event, but acknowledged.' }, { status: 200 });
      }
    }
  }

  return NextResponse.json({ message: 'Event received' }, { status: 200 });
}
