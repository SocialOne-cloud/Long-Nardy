export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast-wrap" aria-live="polite">
      <div className="toast">{message}</div>
    </div>
  );
}
