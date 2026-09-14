// The 8 required QT Quest menu categories. One must be consumed per QT stop,
// in any order, all 8 different, by the end of the race.
export interface ItemDef {
  key: string;
  label: string;
  detail: string;
}

export const ITEMS: ItemDef[] = [
  {
    key: 'roller',
    label: 'Roller item',
    detail: 'Hotdog w/ bun, corndog, taquito, etc. (edible wrap/bun required)',
  },
  {
    key: 'bakery',
    label: 'Bakery item',
    detail: 'Donut, muffin, or equivalent sized item',
  },
  {
    key: 'drink',
    label: 'Big Q fountain drink',
    detail: 'From the fountain drink section — cannot be water',
  },
  {
    key: 'candy',
    label: 'Regular size candy',
    detail: 'Standard sized KitKat, Snickers, Skittles, M&Ms, etc.',
  },
  {
    key: 'pickle',
    label: 'Pickle',
    detail: 'Single pickle or packaged pickle slices',
  },
  {
    key: 'chips',
    label: 'Regular size bag of chips',
    detail: 'Cheetos, Lays, Fritos, Funyuns, Takis, etc.',
  },
  {
    key: 'fruit',
    label: 'Fruit',
    detail: 'Banana, apple, orange, or full container of mixed fruit',
  },
  {
    key: 'kitchen',
    label: 'QT Kitchen item',
    detail: 'Any made-to-order breakfast food or entree — NOT grab n go',
  },
];

export const ITEM_KEYS = ITEMS.map((i) => i.key);

// The 8 QT stops in required route order, plus the shared start/finish location.
export interface StopDef {
  stop: number;
  label: string;
  address: string;
}

export const STOPS: StopDef[] = [
  { stop: 1, label: 'START & QT #1', address: '4950 S Harvard Ave, Tulsa, OK' },
  { stop: 2, label: 'QT #2', address: '5111 S Lewis Ave, Tulsa, OK' },
  { stop: 3, label: 'QT #3', address: '4970 S Peoria Ave, Tulsa, OK' },
  { stop: 4, label: 'QT #4', address: '3606 S Peoria Ave, Tulsa, OK' },
  { stop: 5, label: 'QT #5', address: '1443 S Denver Ave, Tulsa, OK' },
  { stop: 6, label: 'QT #6', address: '1022 S Utica Ave, Tulsa, OK' },
  { stop: 7, label: 'QT #7', address: '1509 S Lewis Pl, Tulsa, OK' },
  { stop: 8, label: 'QT #8', address: '1946 S Harvard Ave, Tulsa, OK' },
];

export const FINISH = {
  label: 'FINISH (back at start)',
  address: '4950 S Harvard Ave, Tulsa, OK',
};
