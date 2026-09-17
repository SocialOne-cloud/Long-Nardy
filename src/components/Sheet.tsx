import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  tall?: boolean;
}

/** Bottom sheet over a scrim; the scrim and Escape both close it. */
export function Sheet({ open, onClose, title, children, tall = false }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`sheet-scrim ${tall ? 'sheet-scrim--deep' : ''}`}>
      <button type="button" className="sheet-scrim__hit" aria-label="Close" onClick={onClose} />
      <div className={`sheet ${tall ? 'sheet--tall' : ''}`} role="dialog" aria-label={title}>
        <div className="sheet__handle" />
        <h2 className="title-sheet">{title}</h2>
        {children}
      </div>
    </div>
  );
}
