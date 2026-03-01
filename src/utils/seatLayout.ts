export interface SeatPosition {
  x: number;
  y: number;
}

/**
 * Compute seat positions around the table rim.
 * Seat centers lie on the rim ellipse so each circle sits halfway on the rim
 * (rim passes through the center of each seat circle). Seat 0 is at the bottom
 * center; seats go counterclockwise so that "to your left" on screen matches
 * "to your left" at a real poker table.
 *
 * Returns positions as percentages (0-100) for CSS placement.
 */
export function computeSeatPositions(seatCount: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const cx = 50;
  const cy = 50;
  // Rim ellipse aligned with felt boundary (inset 8% => radius 42% from center)
  const rx = 42;
  const ry = 42;

  for (let i = 0; i < seatCount; i++) {
    const angle = Math.PI / 2 - (2 * Math.PI * i) / seatCount;
    positions.push({
      x: cx - rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  }

  return positions;
}
