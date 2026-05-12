'use client';

import Image from 'next/image';
import styles from '@/components/webhard/WebhardShared.module.css';
import { isImageContentType, isPdfContentType, isTextLikeItem } from '@/lib/webhard/drivePreview';
import type { DriveItemViewModel } from '@/lib/webhard/driveTypes';

export function DrivePreview({
  childCount,
  item,
}: {
  childCount?: number;
  item: DriveItemViewModel;
}) {
  return (
    <div className={styles.preview}>
      {item.kind === 'folder' ? (
        <pre>{`${childCount ?? 0}개 항목`}</pre>
      ) : item.fileType === 'link' ? (
        <pre>{item.externalUrl}</pre>
      ) : item.fileType === 'note' || isTextLikeItem(item) ? (
        <pre>{item.textContent || '내용이 없습니다.'}</pre>
      ) : item.fileType === 'binary' && isImageContentType(item.contentType) && item.dataUrl ? (
        <Image
          src={item.dataUrl}
          alt={item.name}
          width={1280}
          height={960}
          unoptimized
        />
      ) : item.fileType === 'binary' && isPdfContentType(item.contentType) && item.dataUrl ? (
        <iframe title={item.name} src={item.dataUrl} />
      ) : item.fileType === 'binary' && item.dataUrl ? (
        <iframe title={item.name} src={item.dataUrl} />
      ) : (
        <pre>미리보기를 지원하지 않는 형식입니다.</pre>
      )}
    </div>
  );
}
