import './NiqudDots.css'

interface NiqudDotsProps {
  count: 1 | 2 | 3
  position?: 'bottom' | 'above-left'
}

/**
 * A niqqud's dot(s) drawn as plain CSS circles instead of the mark glyph.
 * A standalone combining mark (no base letter to attach to) renders with
 * unpredictable size/placement depending on the font, so Hiriq (1), Tzeire
 * (2, side by side) and Segol (3, triangle) are drawn by hand here — same
 * fix already applied to Holam (1). Below-baseline marks (Hiriq, Tzeire,
 * Segol) sit pinned toward the bottom of the button, centred horizontally
 * ('bottom', the default); Holam sits above the letter, pinned to the
 * top-left corner ('above-left'). Decorative only; the containing button
 * carries the accessible name.
 */
function NiqudDots({ count, position = 'bottom' }: NiqudDotsProps) {
  const positionClass =
    position === 'above-left' ? 'niqud-dots-above-left' : 'niqud-dots-bottom'

  if (count === 1) {
    return (
      <span
        className={`niqud-dots niqud-dots-single ${positionClass}`}
        aria-hidden="true"
      >
        <span className="niqud-dot" />
      </span>
    )
  }

  if (count === 2) {
    return (
      <span className={`niqud-dots niqud-dots-pair ${positionClass}`} aria-hidden="true">
        <span className="niqud-dot" />
        <span className="niqud-dot" />
      </span>
    )
  }

  // count === 3: two dots on top, one centred below — Segol's upside-down
  // triangle.
  return (
    <span className={`niqud-dots niqud-dots-triangle ${positionClass}`} aria-hidden="true">
      <span className="niqud-dots-row">
        <span className="niqud-dot" />
        <span className="niqud-dot" />
      </span>
      <span className="niqud-dot" />
    </span>
  )
}

export default NiqudDots
