import { useEffect, useRef, useState } from 'react';
import type { Player } from '../engine';
import { cropToSquare, loadImage, readFile } from '../lib/image';
import { Avatar } from './Avatar';

interface PhotoCropperProps {
  seat: Player;
  name: string;
  photo: string | null;
  onChange: (photo: string | null) => void;
  size?: number;
}

/**
 * Circular cropper with a zoom slider. The committed result is a square
 * 128x128 JPEG data URL, small enough to sit in the room's database entry.
 */
export function PhotoCropper({ seat, name, photo, onChange, size = 124 }: PhotoCropperProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    onChange(cropToSquare(source, { zoom, offsetX: 0, offsetY: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, zoom]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const img = await loadImage(await readFile(file));
      setZoom(1);
      setSource(img);
    } catch {
      setError('That image could not be read.');
    }
  };

  return (
    <div className="cropper">
      <Avatar seat={seat} size={size} photo={photo} name={name} glow="purple" />

      {source && (
        <label className="cropper__zoom">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ ['--fill' as string]: `${((zoom - 1) / 2) * 100}%` }}
          />
          <span className="cropper__zoom-label">zoom</span>
        </label>
      )}

      <div className="cropper__actions">
        <button type="button" className="pill pill--gold" onClick={() => fileRef.current?.click()}>
          {photo ? 'Change photo' : 'Upload photo'}
        </button>
        {photo && (
          <button
            type="button"
            className="pill"
            onClick={() => {
              setSource(null);
              setZoom(1);
              onChange(null);
              if (fileRef.current) fileRef.current.value = '';
            }}
          >
            Retake
          </button>
        )}
      </div>

      {error && <p className="cropper__error">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  );
}
