import type { Timestamp } from 'firebase/firestore';

export type ParticipantType = 'individual' | 'team';

export type ParticipantStatus =
  | 'not_started'
  | 'in_progress'
  | 'finished'
  | 'dq'
  | 'tapped_out';

export interface ItemLogEntry {
  itemKey: string;
  stop: number;
  by: string;
  note: string;
  at: Timestamp | null;
}

export interface NoteEntry {
  text: string;
  by: string;
  at: Timestamp | null;
}

// Public participant document — readable by anyone with the access code
// (or by the marshal dashboard). Lives in the `participants` collection,
// doc id = access code.
export interface Participant {
  code: string;
  name: string;
  type: ParticipantType;
  members: string[];
  activeRunner: string | null;
  currentStop: number; // 1-8, next QT stop to check in at
  items: Record<string, boolean>;
  itemLog: ItemLogEntry[];
  notes: NoteEntry[];
  trashCount: number;
  status: ParticipantStatus;
  startedAt: Timestamp | null;
  finishedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

// Private participant document — emergency contact / medical info.
// Lives in the `participants_private` collection, same doc id (access code).
// Only surfaced in the Marshal Dashboard UI.
export interface ParticipantPrivate {
  emergencyContact: string;
  medicalNotes: string;
}
