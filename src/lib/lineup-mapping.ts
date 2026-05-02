/**
 * Single source of truth for jersey numbers based on tactical positions.
 */

export const FORMATION_NUMBERS: Record<string, number[]> = {
  "2-3-1": [1, 2, 3, 4, 5, 6, 7], 
  "3-2-1": [1, 2, 3, 4, 5, 6, 7], 
  "2-2-2": [1, 2, 3, 4, 5, 6, 7], 
  "3-1-2": [1, 2, 3, 4, 5, 6, 7], 
  "1-3-2": [1, 2, 3, 4, 5, 6, 7]
};

export const FORMATION_POSITIONS: Record<string, string[]> = {
  "2-3-1": ["POR", "DC", "DC", "ES", "CC", "ED", "ATT"],
  "3-2-1": ["POR", "DC", "DC", "DC", "CC", "CC", "ATT"],
  "2-2-2": ["POR", "DC", "DC", "CC", "CC", "ATT", "ATT"],
  "3-1-2": ["POR", "DC", "DC", "DC", "MED", "ATT", "ATT"],
  "1-3-2": ["POR", "DC", "ES", "CC", "ED", "ATT", "ATT"]
};

export const FORMATION_COORDINATES: Record<string, { top: number, left: number }[]> = {
  "2-3-1": [
    { top: 90, left: 50 }, // POR
    { top: 70, left: 30 }, { top: 70, left: 70 }, // Difesa
    { top: 40, left: 15 }, { top: 45, left: 50 }, { top: 40, left: 85 }, // Centrocampo
    { top: 15, left: 50 } // Attacco
  ],
  "3-2-1": [
    { top: 90, left: 50 },
    { top: 72, left: 20 }, { top: 75, left: 50 }, { top: 72, left: 80 },
    { top: 45, left: 35 }, { top: 45, left: 65 },
    { top: 15, left: 50 }
  ],
  "2-2-2": [
    { top: 90, left: 50 },
    { top: 70, left: 30 }, { top: 70, left: 70 },
    { top: 45, left: 30 }, { top: 45, left: 70 },
    { top: 18, left: 30 }, { top: 18, left: 70 }
  ],
  "3-1-2": [
    { top: 90, left: 50 },
    { top: 72, left: 20 }, { top: 75, left: 50 }, { top: 72, left: 80 },
    { top: 45, left: 50 },
    { top: 18, left: 35 }, { top: 18, left: 65 }
  ],
  "1-3-2": [
    { top: 90, left: 50 },
    { top: 75, left: 50 },
    { top: 45, left: 15 }, { top: 45, left: 50 }, { top: 45, left: 85 },
    { top: 18, left: 35 }, { top: 18, left: 65 }
  ]
};

export function getJerseyNumber(formation: string, index: number): number {
  const numbers = FORMATION_NUMBERS[formation] || FORMATION_NUMBERS["2-3-1"];
  return numbers[index] || (index + 1);
}

export function getSubstituteNumber(index: number): number {
  return index + 8;
}

export function getPositionAcronym(formation: string, index: number): string {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS["2-3-1"];
  return positions[index] || "N/A";
}

export function getPositionCoordinates(formation: string, index: number): { top: number, left: number } {
  const coords = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES["2-3-1"];
  return coords[index] || { top: 0, left: 0 };
}
