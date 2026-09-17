import { Sheet } from '../components/Sheet';

const RULES = [
  {
    title: 'Direction and head',
    body: 'All fifteen checkers start on your head point, diagonally opposite hers. You move toward your own home quadrant and bear off from there.',
  },
  {
    title: 'One off the head',
    body: 'Only one checker may leave the head per turn. On your very first roll, 3-3, 4-4 and 6-6 let you take two.',
  },
  {
    title: 'No hitting',
    body: 'A point holding any of her checkers is closed to you. Nothing is ever sent back.',
  },
  {
    title: 'Use both dice',
    body: 'If a line of play exists that uses both dice, you must take it. When only one die can be played, it has to be the higher one. Doubles are played four times, as far as the position allows.',
  },
  {
    title: 'Six in a row',
    body: 'You may not hold six consecutive points unless at least one of her checkers is already past the block, or she has borne one off.',
  },
  {
    title: 'Bearing off',
    body: 'Once all fifteen are home you may bear off. An exact number always works; a larger one only from your highest occupied point.',
  },
  {
    title: 'Mars',
    body: 'Bear off all fifteen before she gets a single checker off and the game counts double.',
  },
];

export function RulesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Long nardy — house rules" tall>
      <ol className="rules">
        {RULES.map((rule, i) => (
          <li key={rule.title} className="rules__item">
            <span className="rules__index">{i + 1}</span>
            <div>
              <p className="rules__title">{rule.title}</p>
              <p className="rules__body">{rule.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn--gold" onClick={onClose}>
        Close
      </button>
    </Sheet>
  );
}
