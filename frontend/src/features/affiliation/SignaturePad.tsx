'use client';

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool, Upload, Image as ImageIcon } from 'lucide-react';

export interface SignaturePadProps {
  label: string;
  sublabel?: string;
  onSave: (base64: string | null) => void;
  initialSignature?: string | null;
  required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  sublabel,
  onSave,
  initialSignature = null,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!initialSignature);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#073E23';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSave(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
        setHasDrawn(true);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <label className="previasis-label">
            {label} {required && <span className="previasis-label-required">*</span>}
          </label>
          {sublabel && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sublabel}</p>
          )}
        </div>

        {hasDrawn && (
          <span className="pill-badge" style={{ fontSize: '0.6875rem' }}>
            <Check size={12} strokeWidth={3} /> Firma Registrada
          </span>
        )}
      </div>

      {/* Signature Canvas Box con Borde Punteado Verde */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '160px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--previasis-green)',
          overflow: 'hidden',
          touchAction: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            display: 'block',
          }}
        />

        {!hasDrawn && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              color: 'var(--text-light)',
              gap: '0.375rem',
            }}
          >
            <PenTool size={22} color="var(--previasis-green)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Firme aquí con el dedo o mouse
            </span>
          </div>
        )}
      </div>

      {/* Botones Borrar y Cargar Imagen */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={clear}
          className="btn-pill btn-pill-secondary"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
          disabled={!hasDrawn}
        >
          <RotateCcw size={12} /> Borrar
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-pill btn-pill-secondary"
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
        >
          <Upload size={12} /> Cargar imagen
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
