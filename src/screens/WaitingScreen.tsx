import { useState } from 'react';
import type { Player } from '../engine';
import { Avatar, AvatarPending } from '../components/Avatar';
import { inviteLink } from '../lib/roomCode';
import type { Profile } from '../state/types';

interface WaitingScreenProps {
  code: string;
  seat: Player;
  me: Profile;
  her: Profile | null;
  herOnline: boolean;
  onStart: () => void;
  onLeave: () => void;
  onToast: (message: string) => void;
}

export function WaitingScreen({
  code,
  seat,
  me,
  her,
  herOnline,
  onStart,
  onLeave,
  onToast,
}: WaitingScreenProps) {
  const [copied, setCopied] = useState(false);
  const joined = her !== null;
  const colour = seat === 'p1' ? 'ivory' : 'amethyst';

  const copy = async () => {
    const link = inviteLink(code);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt('Copy this link', link);
    }
    setCopied(true);
    onToast('Invite link copied');
  };

  return (
    <div className="screen screen--waiting">
      <div
        className="screen__glow"
        style={{
          width: 460,
          height: 460,
          left: -35,
          top: 180,
          background: 'radial-gradient(circle, rgba(142,79,184,.28), transparent 68%)',
        }}
      />
      <div className="screen__body">
        <h1 className="title-screen">Table is set</h1>
        <p className="subhead" style={{ marginTop: 8 }}>
          Send her the code and the board opens for both of you.
        </p>

        <section className="code-card">
          <p className="label-micro" style={{ letterSpacing: '0.18em' }}>
            Room code
          </p>
          <p className="code-card__code">{code}</p>
          <button type="button" className="btn btn--gold btn--48" onClick={() => void copy()}>
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
        </section>

        <div className="status-row">
          {joined ? (
            <Avatar seat="p2" size={46} photo={her.photo} name={her.name} online={herOnline} />
          ) : (
            <AvatarPending />
          )}
          <div className="status-row__text">
            <p className="status-row__line">
              {joined ? `${her.name} is here` : 'Waiting for her to join…'}
            </p>
            <p className="status-row__sub">{joined ? 'Ready when you are' : 'Invite sent just now'}</p>
          </div>
          {!joined && (
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
        </div>

        <div className="status-row status-row--self">
          <Avatar seat={seat} size={46} photo={me.photo} name={me.name} online />
          <div className="status-row__text">
            <p className="status-row__line">
              {me.name} <span className="status-row__online">● online</span>
            </p>
            <p className="status-row__sub">
              {me.team ? `${me.team} · ` : ''}
              {colour} checkers
            </p>
          </div>
        </div>

        <button type="button" className="btn btn--primary push" disabled={!joined} onClick={onStart}>
          {joined ? 'Start playing' : 'Waiting for her…'}
        </button>
        <button type="button" className="link-quiet" onClick={onLeave}>
          Leave this table
        </button>
      </div>
    </div>
  );
}
