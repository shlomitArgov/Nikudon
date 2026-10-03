import './NiqudDots.css'

interface NiqudDotsProps {
  pattern: 'single' | 'pair' | 'triangle' | 'diagonal'
  position?: 'bottom' | 'above-left'
}

/**
 * A niqqud's dot(s) drawn as plain CSS circles instead of the mark glyph.
 * A standalone combining mark (no base letter to attach to) renders with
 * unpredictable size/placement depending on the font — invisible entirely in
 * some cases (a blank "tofu" square) — so Hiriq (single), Tzeire (pair,
 * side by side), Segol (triangle: 2 over 1) and Kubutz (diagonal: 3 in a
 * line) are drawn by hand here. Below-baseline marks sit pinned toward the
 * bottom of the button, centred horizontally ('bottom', the default); Holam
 * sits above the letter, pinned to the top-left corner ('above-left').
 * Decorative only; the containing button carries the accessible name.
 */
function NiqudDots({ pattern, position = 'bottom' }: NiqudDotsProps) {
  const positionClass =
    position === 'above-left' ? 'niqud-dots-above-left' : 'niqud-dots-bottom'

  if (pattern === 'single') {
    return (
      <span
        className={`niqud-dots niqud-dots-single ${positionClass}`}
        aria-hidden="true"
      >
        <span className="niqud-dot" />
      </span>
    )
  }

  if (pattern === 'pair') {
    return (
      <span className={`niqud-dots niqud-dots-pair ${positionClass}`} aria-hidden="true">
        <span className="niqud-dot" />
        <span className="niqud-dot" />
      </span>
    )
  }

  if (pattern === 'diagonal') {
    return (
      <span
        className={`niqud-dots niqud-dots-diagonal ${positionClass}`}
        aria-hidden="true"
      >
        <span className="niqud-dots-diagonal-row">
          <span className="niqud-dot" />
          <span className="niqud-dot" />
          <span className="niqud-dot" />
        </span>
      </span>
    )
  }

  // 'triangle': two dots on top, one centred below — Segol's upside-down
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
