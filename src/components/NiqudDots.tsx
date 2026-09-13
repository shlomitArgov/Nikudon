import './NiqudDots.css'

interface NiqudDotsProps {
  count: 1 | 2 | 3
  position?: 'center' | 'above-left'
}

/**
 * A niqqud's dot(s) drawn as plain CSS circles instead of the mark glyph.
 * A standalone combining mark (no base letter to attach to) renders with
 * unpredictable size/placement depending on the font, so Hiriq (1), Tzeire
 * (2, side by side) and Segol (3, triangle) are drawn by hand here — same
 * fix already applied to Holam (1, pinned to the button's top-left corner).
 * Decorative only; the containing button carries the accessible name.
 */
function NiqudDots({ count, position = 'center' }: NiqudDotsProps) {
  if (count === 1) {
    return (
      <span
        className={`niqud-dots niqud-dots-single${
          position === 'above-left' ? ' niqud-dots-above-left' : ''
        }`}
        aria-hidden="true"
      >
        <span className="niqud-dot" />
      </span>
    )
  }

  if (count === 2) {
    return (
      <span className="niqud-dots niqud-dots-pair" aria-hidden="true">
        <span className="niqud-dot" />
        <span className="niqud-dot" />
      </span>
    )
  }

  // count === 3: two dots on top, one centred below — Segol's triangle.
  return (
    <span className="niqud-dots niqud-dots-triangle" aria-hidden="true">
      <span className="niqud-dots-row">
        <span className="niqud-dot" />
        <span className="niqud-dot" />
      </span>
      <span className="niqud-dot" />
    </span>
  )
}

export default NiqudDots
