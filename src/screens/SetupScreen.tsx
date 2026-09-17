import { useState } from 'react';
import type { Player } from '../engine';
import { PhotoCropper } from '../components/PhotoCropper';
import type { Profile } from '../state/types';

interface SetupScreenProps {
  seat: Player;
  title: string;
  profile: Profile;
  opponentName: string;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  onBack: () => void;
  onSave: (profile: Profile) => void;
}

const COLOURS: Record<Player, { title: string; sub: string }> = {
  p1: { title: 'Ivory', sub: 'moves first' },
  p2: { title: 'Amethyst', sub: 'moves first' },
};

export function SetupScreen({
  seat,
  title,
  profile,
  opponentName,
  submitLabel,
  busy,
  error,
  onBack,
  onSave,
}: SetupScreenProps) {
  const [draft, setDraft] = useState<Profile>(profile);
  const other: Player = seat === 'p1' ? 'p2' : 'p1';
  const ready = draft.name.trim().length > 0;

  const card = (which: Player) => {
    const mine = which === seat;
    return (
      <div key={which} className={`colour-card ${mine ? 'is-chosen' : 'is-taken'}`}>
        <span className={`swatch swatch--${which}`} />
        <div>
          <p className="colour-card__title">{COLOURS[which].title}</p>
          <p className="colour-card__sub">
            {mine ? 'your checkers' : `taken by ${opponentName || 'her'}`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="screen screen--setup">
      <header className="setup__head">
        <button type="button" className="chevron" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <h1 className="title-sheet">{title}</h1>
      </header>

      <PhotoCropper
        seat={seat}
        name={draft.name}
        photo={draft.photo}
        onChange={(photo) => setDraft((d) => ({ ...d, photo }))}
      />

      <label className="field">
        <span className="label-micro">Display name</span>
        <input
          className="field__input field__input--primary"
          value={draft.name}
          maxLength={18}
          placeholder={COLOURS[seat].title}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
      </label>

      <label className="field">
        <span className="label-micro">Team name</span>
        <input
          className="field__input"
          value={draft.team}
          maxLength={22}
          placeholder="Team Comet"
          onChange={(e) => setDraft((d) => ({ ...d, team: e.target.value }))}
        />
      </label>

      <div className="field">
        <span className="label-micro">Checkers</span>
        <div className="colour-row">{[seat, other].sort().map(card)}</div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button
        type="button"
        className="btn btn--primary push"
        disabled={!ready || busy}
        onClick={() => onSave({ ...draft, name: draft.name.trim(), team: draft.team.trim() })}
      >
        {busy ? 'Just a moment…' : submitLabel}
      </button>
    </div>
  );
}
