export type DrawingBadge = 'Foundations of Faith' | 'Science & Nature'

export interface DrawingStep {
  instruction: string
}

/** Normalized crop region (0–1) for the step grid inside the guide poster */
export interface StepGridLayout {
  cols: number
  rows: number
  originX: number
  originY: number
  width: number
  height: number
  /** Optional per-column boundaries [0, col1, col2, ..., 1] */
  columnBounds?: number[]
  /** Optional per-row boundaries [0, row1, row2, ..., 1] */
  rowBounds?: number[]
  cellInset?: number
}

export interface DrawingTutorial {
  id: string
  title: string
  subtitle: string
  badge: DrawingBadge
  coverImagePath: string
  guideImagePath: string
  steps: DrawingStep[]
  stepGrid: StepGridLayout
}

export const DRAWING_TUTORIALS: DrawingTutorial[] = [
  {
    id: 'lets-draw-a-mosque',
    title: "Let's Draw a Mosque!",
    subtitle: 'Follow the steps and create your own drawing.',
    badge: 'Foundations of Faith',
    coverImagePath: '/drawing/lets-draw-a-mosque-guide.png',
    guideImagePath: '/drawing/lets-draw-a-mosque-guide.png',
    stepGrid: {
      cols: 3,
      rows: 3,
      originX: 0.034,
      originY: 0.157,
      width: 0.933,
      height: 0.743,
      columnBounds: [0.034, 0.342, 0.654, 0.967],
      rowBounds: [0.157, 0.291, 0.562, 0.813],
    },
    steps: [
      { instruction: 'Draw a large rectangle for the main building.' },
      { instruction: 'Add a large dome on top.' },
      { instruction: 'Draw a small crescent on top of the dome.' },
      { instruction: 'Add a tall minaret on the left side.' },
      { instruction: 'Add another minaret on the right side.' },
      { instruction: 'Draw the door in the middle.' },
      { instruction: 'Add windows on each side.' },
      { instruction: 'Add simple details to the minarets.' },
      { instruction: 'Color your mosque beautifully!' },
    ],
  },
  {
    id: 'lets-draw-a-lantern',
    title: "Let's Draw a Lantern (Fanous)!",
    subtitle: 'Follow the steps and create your own drawing.',
    badge: 'Foundations of Faith',
    coverImagePath: '/drawing/lets-draw-a-lantern-guide.png',
    guideImagePath: '/drawing/lets-draw-a-lantern-guide.png',
    stepGrid: {
      cols: 3,
      rows: 3,
      originX: 0.034,
      originY: 0.157,
      width: 0.933,
      height: 0.743,
    },
    steps: [
      { instruction: 'Draw a small rectangle for the base.' },
      { instruction: 'Add a wider rectangle on top.' },
      { instruction: 'Draw the main body using two curved lines.' },
      { instruction: 'Add a dome shape on top.' },
      { instruction: 'Add a small band below the dome.' },
      { instruction: 'Add a ring or handle on the very top.' },
      { instruction: 'Draw vertical panels inside the body.' },
      { instruction: 'Add details like dots and small shapes.' },
      { instruction: 'Color your lantern beautifully!' },
    ],
  },
  {
    id: 'lets-draw-a-kaaba',
    title: "Let's Draw a Kaaba!",
    subtitle: 'Follow the steps and create your own drawing.',
    badge: 'Foundations of Faith',
    coverImagePath: '/drawing/lets-draw-a-kaaba-guide.png',
    guideImagePath: '/drawing/lets-draw-a-kaaba-guide.png',
    stepGrid: {
      cols: 3,
      rows: 3,
      originX: 0.034,
      originY: 0.157,
      width: 0.933,
      height: 0.743,
    },
    steps: [
      { instruction: 'Draw a large cube.' },
      { instruction: 'Add a slightly curved line across the top.' },
      { instruction: 'Add another curved line below it.' },
      { instruction: 'Draw a door on the front side.' },
      { instruction: 'Add the kiswah band (the thick band with shapes).' },
      { instruction: 'Draw the base with bricks or stones.' },
      { instruction: 'Add the doorstep and lines in front.' },
      { instruction: 'Add surroundings like the Masjid and people.' },
      { instruction: 'Color your drawing beautifully!' },
    ],
  },
]

export function tutorialById(id: string): DrawingTutorial | undefined {
  return DRAWING_TUTORIALS.find((item) => item.id === id)
}

export function badgeColor(badge: DrawingBadge): string {
  return badge === 'Foundations of Faith' ? '#8B6BB1' : '#16a34a'
}

export { SHAPE_TOOLS, type ShapeTool } from '@/lib/drawing/shapeTools'
