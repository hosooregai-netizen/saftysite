'use client';

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`${file.name} 파일을 읽지 못했습니다.`));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`${file.name} 파일을 읽지 못했습니다.`));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export async function readFileAsBase64(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const [, base64 = ''] = dataUrl.split(',', 2);
  return base64;
}

export function triggerDownload(input: {
  contentType: string;
  data: BlobPart;
  filename: string;
}) {
  const blob = new Blob([input.data], { type: input.contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = input.filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
