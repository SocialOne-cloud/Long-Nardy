import { useState } from 'react';
import { isCompleteCode, normaliseCode } from '../lib/roomCode';

interface JoinScreenProps {
  initialCode: string;
  onBack: () => void;
  onJoin: (code: string) => void;
  busy?: boolean;
  error?: string | null;
}

export function JoinScreen({ initialCode, onBack, onJoin, busy, error }: JoinScreenProps) {
  const [code, setCode] = useState(initialCode);
  const ready = isCompleteCode(code);

  return (
    <div className="screen screen--setup">
      <header className="setup__head">
        <button type="button" className="chevron" onClick={onBack} aria-label="Back">
          ‹
        </button>
        <h1 className="title-sheet">Join her table</h1>
      </header>

      <p className="subhead" style={{ marginTop: 0 }}>
        Type the three digits she sent you, or just open her invite link.
      </p>

      <label className="field">
        <span className="label-micro">Room code</span>
        <input
          className="field__input field__input--code"
          value={code}
          onChange={(e) => setCode(normaliseCode(e.target.value))}
          placeholder="382"
          // Generous, so pasting "room 382" still filters down to the digits.
          maxLength={16}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button
        type="button"
        className="btn btn--primary push"
        disabled={!ready || busy}
        onClick={() => onJoin(normaliseCode(code))}
      >
        {busy ? 'Joining…' : 'Join game'}
      </button>
    </div>
  );
}
