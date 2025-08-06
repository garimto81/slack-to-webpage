
import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';

// 페이지 props 타입 정의
interface PageProps {
  params: {
    thread_ts: string;
  };
}

// 데이터베이스에서 페이지 콘텐츠를 가져오는 함수
async function getPageContent(thread_ts: string) {
  try {
    const { rows } = await sql`
      SELECT content FROM pages WHERE slack_thread_ts = ${thread_ts};
    `;
    return rows[0]?.content || null;
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return null;
  }
}

export default async function Page({ params }: PageProps) {
  const { thread_ts } = params;
  const content = await getPageContent(thread_ts);

  // 콘텐츠가 없으면 404 페이지 표시
  if (!content) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="prose lg:prose-xl max-w-none">
        {/* 
          조회된 HTML을 그대로 렌더링합니다. 
          이 HTML은 우리가 API에서 생성했거나, 신뢰하는 소스(Gemini)에서 생성했으므로 안전하다고 가정합니다.
          만약 사용자 입력을 그대로 HTML에 삽입해야 하는 경우, 반드시 XSS 공격을 방지하기 위한 
          DOMPurify와 같은 라이브러리를 사용해야 합니다.
        */}
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </main>
  );
}

// 페이지 제목을 동적으로 설정 (선택 사항)
export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Page for thread ${params.thread_ts}`,
  };
}
