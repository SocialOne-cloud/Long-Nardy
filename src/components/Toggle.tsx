interface ToggleProps {
  on: boolean;
  onChange: () => void;
  label: string;
}

export function Toggle({ on, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? 'toggle--on' : ''}`}
      onClick={onChange}
    >
      <span className="toggle__knob" />
    </button>
  );
}
