/** Stroke icon geometry on a 24x24 grid (round caps/joins, 2px stroke). */
export type IconShape = {
  /** Open stroked paths. */
  d?: string[];
  circles?: Array<{ cx: number; cy: number; r: number }>;
  rects?: Array<{ x: number; y: number; width: number; height: number; rx?: number }>;
};

export const ICONS = {
  home: {
    d: ['M3.5 10.8 12 3.8l8.5 7', 'M5.5 9.6V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9.6', 'M9.8 21v-5.6a1 1 0 0 1 1-1h2.4a1 1 0 0 1 1 1V21'],
  },
  calendar: {
    rects: [{ x: 3.5, y: 5, width: 17, height: 15.5, rx: 3.5 }],
    d: ['M8 3v3.6', 'M16 3v3.6', 'M3.5 10h17', 'm9.4 15.2 1.9 1.9 3.5-3.7'],
  },
  sliders: {
    d: ['M4 7h8', 'M18 7h2', 'M4 17h2', 'M12 17h8'],
    circles: [
      { cx: 15, cy: 7, r: 2.6 },
      { cx: 9, cy: 17, r: 2.6 },
    ],
  },
  chevronLeft: { d: ['M14.5 5.5 8 12l6.5 6.5'] },
  close: { d: ['M6 6l12 12', 'M18 6 6 18'] },
  gift: {
    rects: [{ x: 3.5, y: 8, width: 17, height: 4.5, rx: 1.5 }],
    d: ['M5.2 12.5V19a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2v-6.5', 'M12 8v13', 'M12 8C12 5.8 10.6 4 8.7 4a2 2 0 0 0 0 4H12', 'M12 8c0-2.2 1.4-4 3.3-4a2 2 0 0 1 0 4H12'],
  },
  footprints: {
    d: [
      'M4.6 16.2v-2.4c0-2.1-1-3.2-1-5.6 0-2.6 1.4-5.6 4.1-5.6 1.6 0 2.2 1.6 2.2 3.4 0 2.9-1.9 5.2-1.9 8.2v2a1.8 1.8 0 1 1-3.4 0Z',
      'M19.4 20.4V18c0-2.1 1-3.2 1-5.6 0-2.6-1.4-5.6-4.1-5.6-1.6 0-2.2 1.6-2.2 3.4 0 2.9 1.9 5.2 1.9 8.2v2a1.8 1.8 0 1 0 3.4 0Z',
    ],
  },
  dumbbell: {
    d: ['M6.5 6.5v11', 'M17.5 6.5v11', 'M3.5 9.2v5.6', 'M20.5 9.2v5.6', 'M6.5 12h11'],
  },
  activity: { d: ['M21.5 12h-4l-3 8.5L9.5 3.5 6.5 12h-4'] },
  trophy: {
    d: ['M8 21h8', 'M12 16.5V21', 'M7 3.5h10V9a5 5 0 0 1-10 0Z', 'M17 5h2.4a.6.6 0 0 1 .6.6V7a3 3 0 0 1-3 3', 'M7 5H4.6a.6.6 0 0 0-.6.6V7a3 3 0 0 0 3 3'],
  },
  sparkles: {
    d: ['M11 3.5l1.7 5L18 10l-5.3 1.7L11 17l-1.7-5.3L4 10l5.3-1.5Z', 'M19 3v4', 'M17 5h4', 'M5.5 17v4', 'M3.5 19h4'],
  },
} as const satisfies Record<string, IconShape>;

export type IconName = keyof typeof ICONS;

/** Filled flame (solid, so it reads at small sizes). */
export const FLAME_PATH =
  'M12.2 2.2c.4 3.1 4.9 5.2 4.9 10.3a5 5 0 0 1-10 0c0-1.9.8-3.3 2-4.4.2 1.7.9 2.6 2 2.7-.5-3.2-.1-6 1.1-8.6Z';
