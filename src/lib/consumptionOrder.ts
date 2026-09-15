import { ITEMS_BY_KEY, type ItemDef } from './items';
import type { ItemLogEntry } from './types';

export interface ConsumptionCell {
  entry: ItemLogEntry;
  item: ItemDef | null;
  duplicateCount: number;
}

export interface ConsumptionOrder {
  byStop: Map<number, ConsumptionCell>;
  invalidStopCount: number;
}

export function buildConsumptionOrder(itemLog: ItemLogEntry[]): ConsumptionOrder {
  const byStop = new Map<number, ConsumptionCell>();
  let invalidStopCount = 0;

  for (const entry of itemLog) {
    if (!Number.isInteger(entry.stop) || entry.stop < 1 || entry.stop > 8) {
      invalidStopCount += 1;
      continue;
    }

    const existing = byStop.get(entry.stop);
    if (existing) {
      existing.duplicateCount += 1;
      continue;
    }

    byStop.set(entry.stop, {
      entry,
      item: ITEMS_BY_KEY.get(entry.itemKey) ?? null,
      duplicateCount: 1,
    });
  }

  return { byStop, invalidStopCount };
}
