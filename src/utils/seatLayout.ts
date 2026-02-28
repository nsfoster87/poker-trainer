export interface SeatPosition {
  x: number;
  y: number;
}

/**
 * Compute seat positions around an ellipse.
 * Seat 0 is at the bottom center; seats go clockwise.
 *
 * Returns positions as percentages (0-100) for CSS placement.
 */
export function computeSeatPositions(seatCount: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const cx = 50;
  const cy = 50;
  const rx = 44;
  const ry = 38;

  for (let i = 0; i < seatCount; i++) {
    const angle = Math.PI / 2 + (2 * Math.PI * i) / seatCount;
    positions.push({
      x: cx - rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  }

  return positions;
}
