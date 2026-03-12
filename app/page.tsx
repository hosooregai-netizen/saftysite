import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8">
      <h1 className="text-2xl font-bold text-black">한국종합안전</h1>
      <Link
        href="/hazard-demo"
        className="rounded border border-black bg-black px-6 py-3 text-white transition hover:bg-gray-800"
      >
        위험요인 분석 결과 보기
      </Link>
    </main>
  );
}
