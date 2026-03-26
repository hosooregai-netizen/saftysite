'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import styles from './SignaturePad.module.css';

interface SignaturePadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function isImageDataUrl(value: string): boolean {
  return /^data:image\//.test(value);
}

export default function SignaturePad({
  label,
  value,
  onChange,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#0f172a';
    context.lineWidth = 2.4;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (!isImageDataUrl(value)) return;

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = value;
  }, [value]);

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

  const getRelativePoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange('')}
        >
          지우기
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={720}
        height={240}
        className={styles.canvas}
        onPointerDown={(event) => {
          const context = getContext();
          const point = getRelativePoint(event);
          if (!context || !point) return;

          context.beginPath();
          context.moveTo(point.x, point.y);
          setIsDrawing(true);
        }}
        onPointerMove={(event) => {
          if (!isDrawing) return;
          const context = getContext();
          const point = getRelativePoint(event);
          if (!context || !point) return;

          context.lineTo(point.x, point.y);
          context.stroke();
        }}
        onPointerUp={() => {
          if (!isDrawing) return;
          setIsDrawing(false);
          saveCanvas();
        }}
        onPointerLeave={() => {
          if (!isDrawing) return;
          setIsDrawing(false);
          saveCanvas();
        }}
      />
    </div>
  );
}

