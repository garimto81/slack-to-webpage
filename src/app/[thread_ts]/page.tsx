'use client';

import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

interface PageProps {
  params: {
    thread_ts: string;
  };
}

// 초기 콘텐츠를 가져오는 함수 (서버에서 한 번만 호출됨)
async function getInitialPageContent(thread_ts: string) {
  const { rows } = await sql`SELECT content FROM pages WHERE slack_thread_ts = ${thread_ts}`;
  return rows[0]?.content || null;
}

export default function Page({ params }: PageProps) {
  const { thread_ts } = params;
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    // 초기 콘텐츠 로드
    getInitialPageContent(thread_ts).then(initialContent => {
      if (!initialContent) {
        // notFound()는 클라이언트 컴포넌트에서 직접 사용할 수 없으므로,
        // 로딩 상태나 에러 메시지로 처리할 수 있습니다.
        // 여기서는 간단히 null로 두고 아래에서 처리합니다.
      }
      setContent(initialContent);
    });

    // Pusher 설정
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // 채널 구독
    const channel = pusher.subscribe(`page-${thread_ts}`);

    // 이벤트 바인딩
    channel.bind('content-updated', (data: { newContent: string }) => {
      setContent(prevContent => (prevContent ? prevContent + data.newContent : data.newContent));
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      pusher.unsubscribe(`page-${thread_ts}`);
      pusher.disconnect();
    };
  }, [thread_ts]); // thread_ts가 변경될 때마다 effect를 다시 실행

  if (content === null) {
    // 로딩 중이거나 콘텐츠가 없을 때 표시할 내용
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="prose lg:prose-xl max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </main>
  );
}