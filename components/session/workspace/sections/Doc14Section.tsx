/* eslint-disable @next/next/no-img-element */

import styles from '@/components/session/InspectionSessionWorkspace.module.css';
import type { SupportSectionProps } from '@/components/session/workspace/types';

function isPdfSource(url: string): boolean {
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith('data:application/pdf')) return true;
  const pathOnly = normalized.split(/[?#]/)[0] ?? normalized;
  return /\.pdf$/i.test(pathOnly);
}

export default function Doc14Section({
  session,
}: Pick<SupportSectionProps, 'session'>) {
  const info = session.document14SafetyInfos[0];
  const url = info?.imageUrl?.trim() ?? '';
  const isPdf = url ? isPdfSource(url) : false;

  return (
    <article className={`${styles.noticeCard} ${styles.doc14ViewerCard}`}>
      {url ? (
        <div className={styles.doc14Viewer}>
          <div className={styles.doc14Caption}>
            <span className={styles.cardEyebrow}>안전 정보 게시</span>
            {info?.title ? <h3 className={styles.doc14CaptionTitle}>{info.title}</h3> : null}
            <p className={styles.fieldAssist}>관리자 콘텐츠의 안전 정보가 보고일 기준으로 자동 연결됩니다.</p>
          </div>
          {isPdf ? (
            <iframe title={info?.title || '안전 정보 PDF'} src={url} className={styles.doc14PdfFrame} />
          ) : (
            <img src={url} alt={info?.title || '안전 정보'} className={styles.doc14FullImage} />
          )}
          {!isPdf && info?.body ? (
            <div className={styles.doc14TextBelow}>
              <p className={styles.noticeText}>{info.body}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.noticeBody}>
          <div className={styles.cardEyebrow}>안전 정보 게시</div>
          <h3 className={styles.noticeTitle}>{info?.title || '안전 정보'}</h3>
          <p className={styles.fieldAssist}>보고일에 맞는 안전 정보가 없으면 기본 안내 상태가 보입니다.</p>
          <p className={styles.noticeText}>
            {info?.body || '관제실에서 등록한 안전 정보(PDF·이미지)가 연결되면 이 영역에 전체로 표시됩니다.'}
          </p>
        </div>
      )}
    </article>
  );
}

