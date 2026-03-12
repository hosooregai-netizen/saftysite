import Link from 'next/link';

const ENTRY_POINTS = [
  {
    href: '/site-overview',
    title: '전경 확인',
    description:
      '점검 사업장 전경 사진을 업로드하면 12대 기인물과 필수 지도사항 체크표를 자동으로 생성합니다.',
    accentClass: 'from-emerald-500/20 via-white to-white',
  },
  {
    href: '/hazard-demo',
    title: '위험요인분석',
    description:
      '위험요인 사진을 분석해 보고서 형식의 개선대책 표를 생성합니다.',
    accentClass: 'from-sky-500/20 via-white to-white',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.16),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-6 py-12 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            KOREA SAFETY
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            한국종합안전
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
            현장 사진 기반 안전 점검을 전경 확인과 위험요인분석으로 나눠
            바로 진입할 수 있도록 구성했습니다.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {ENTRY_POINTS.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className={`group rounded-[28px] border border-slate-200 bg-gradient-to-br ${entry.accentClass} p-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]`}
            >
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <span className="inline-flex rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                    사진 업로드 기반
                  </span>
                  <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                    {entry.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {entry.description}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-900 transition group-hover:translate-x-1">
                  시작하기 →
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
