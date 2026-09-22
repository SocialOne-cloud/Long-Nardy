import { useEffect, useRef, useState } from 'react';
import type { Player } from '../engine';
import { Avatar } from '../components/Avatar';
import { Sheet } from '../components/Sheet';
import { Toggle } from '../components/Toggle';
import { cropToSquare, loadImage, readFile } from '../lib/image';
import type { DeviceSettings } from '../state/settings';
import type { Profile } from '../state/types';

interface SettingsSheetProps {
  open: boolean;
  seat: Player;
  profile: Profile;
  winMessage: string;
  settings: DeviceSettings;
  onProfile: (profile: Profile) => void;
  onWinMessage: (text: string) => void;
  onToggle: (key: keyof DeviceSettings) => void;
  onResetSeries: () => void;
  onOpenRules: () => void;
  onClose: () => void;
}

export function SettingsSheet({
  open,
  seat,
  profile,
  winMessage,
  settings,
  onProfile,
  onWinMessage,
  onToggle,
  onResetSeries,
  onOpenRules,
  onClose,
}: SettingsSheetProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState(profile);
  const [message, setMessage] = useState(winMessage);

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setMessage(winMessage);
    }
  }, [open, profile, winMessage]);

  const commit = (next: Profile) => {
    setDraft(next);
    onProfile(next);
  };

  const changePhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await loadImage(await readFile(file));
      commit({ ...draft, photo: cropToSquare(img, { zoom: 1, offsetX: 0, offsetY: 0 }) });
    } catch {
      /* ignore an unreadable file — the old photo stays */
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="settings__identity">
        <Avatar seat={seat} size={56} photo={draft.photo} name={draft.name} />
        <div className="settings__who">
          <p className="settings__name">{draft.name || 'You'}</p>
          <p className="settings__team">{draft.team}</p>
        </div>
        <button type="button" className="pill pill--gold" onClick={() => fileRef.current?.click()}>
          Change photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(e) => void changePhoto(e.target.files?.[0])}
        />
      </div>

      <div className="settings__fields">
        <label className="inline-field">
          <span>Display name</span>
          <input
            value={draft.name}
            maxLength={18}
            onChange={(e) => commit({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="inline-field">
          <span>Team name</span>
          <input
            value={draft.team}
            maxLength={22}
            onChange={(e) => commit({ ...draft, team: e.target.value })}
          />
        </label>
        <label className="inline-field inline-field--tall">
          <span>Win message</span>
          <input
            value={message}
            maxLength={90}
            placeholder="You owe me one breakfast in bed."
            onChange={(e) => {
              setMessage(e.target.value);
              onWinMessage(e.target.value);
            }}
          />
        </label>
      </div>

      <div className="settings__list">
        <div className="settings__row">
          <span>Sound</span>
          <Toggle on={settings.sound} onChange={() => onToggle('sound')} label="Sound" />
        </div>
        <div className="settings__row settings__row--stacked">
          <span>
            Fast game
            <small className="settings__sub">
              Plays forced moves and hands the turn over on its own
            </small>
          </span>
          <Toggle on={settings.fast} onChange={() => onToggle('fast')} label="Fast game" />
        </div>
        <div className="settings__row">
          <span>Show point numbers</span>
          <Toggle
            on={settings.showPointNumbers}
            onChange={() => onToggle('showPointNumbers')}
            label="Show point numbers"
          />
        </div>
        <button type="button" className="settings__row settings__row--tap" onClick={onOpenRules}>
          <span>Rules reference</span>
          <span className="settings__value">Long nardy · head rule</span>
          <span className="settings__chev">›</span>
        </button>
        <button
          type="button"
          className="settings__row settings__row--tap"
          onClick={onResetSeries}
        >
          <span className="settings__danger">Reset series score</span>
          <span className="settings__chev">›</span>
        </button>
      </div>

      <button type="button" className="btn btn--primary" onClick={onClose}>
        Done
      </button>
    </Sheet>
  );
}
