import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Gemini AI를 호출하여 텍스트를 HTML로 변환하는 실제 함수
async function generateHtmlFromMessage(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // 혹은 다른 최신 모델
    });

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

    // Gemini가 생성한 마크다운 래퍼(```html ... ```)를 제거
    htmlContent = htmlContent.replace(/^```html\n/, '').replace(/\n```$/, '');

    return htmlContent;

  } catch (error) {
    console.error('Error calling Gemini AI:', error);
    // Gemini 호출 실패 시, 원본 텍스트를 간단한 HTML로 변환하여 반환
    const sanitizedText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<p>(AI 생성 실패) ${sanitizedText}</p>`;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const body = JSON.parse(rawBody);
  const slackSignature = req.headers.get('x-slack-signature') || '';
  const slackTimestamp = req.headers.get('x-slack-request-timestamp') || '';
  const signingSecret = process.env.SLACK_SIGNING_SECRET || '';

  // 1. Slack 요청 검증 (생략)
  try {
    const sigBasestring = `v0:${slackTimestamp}:${rawBody}`;
    const hmac = crypto.createHmac('sha256', signingSecret);
    hmac.update(sigBasestring);
    const mySignature = `v0=${hmac.digest('hex')}`;
    if (!crypto.timingSafeEqual(Buffer.from(mySignature, 'utf8'), Buffer.from(slackSignature, 'utf8'))) {
      return NextResponse.json({ message: 'Invalid Slack signature' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ message: 'Signature verification failed' }, { status: 500 });
  }

  // 2. Slack URL 검증 처리
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge });
  }

  // 3. 실제 이벤트 처리
  if (body.type === 'event_callback') {
    const event = body.event;

    // 지정된 채널의 메시지만 처리
    const targetChannel = process.env.SLACK_CHANNEL_ID;
    if (targetChannel && event.channel !== targetChannel) {
      return NextResponse.json({ message: 'Event from ignored channel' }, { status: 200 });
    }

    // 봇 메시지 무시
    if (event.bot_id) {
      return NextResponse.json({ message: 'Ignoring bot message' }, { status: 200 });
    }

    if (event.type === 'message' && event.text) {
      try {
        const htmlContent = await generateHtmlFromMessage(event.text);
        const threadTs = event.thread_ts || event.ts;

        if (event.thread_ts && event.ts !== event.thread_ts) {
          await sql`UPDATE pages SET content = content || ${htmlContent} WHERE slack_thread_ts = ${threadTs}`;
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