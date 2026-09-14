import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, ensureAnonAuth } from './firebase';
import type {
  ItemLogEntry,
  NoteEntry,
  Participant,
  ParticipantPrivate,
  ParticipantStatus,
} from './types';

const PARTICIPANTS = 'participants';
const PARTICIPANTS_PRIVATE = 'participants_private';

function participantRef(code: string) {
  return doc(db, PARTICIPANTS, code.toUpperCase());
}

function privateRef(code: string) {
  return doc(db, PARTICIPANTS_PRIVATE, code.toUpperCase());
}

export function subscribeParticipant(
  code: string,
  cb: (p: Participant | null) => void,
) {
  return onSnapshot(participantRef(code), (snap) => {
    cb(snap.exists() ? (snap.data() as Participant) : null);
  });
}

export async function getParticipant(code: string): Promise<Participant | null> {
  const snap = await getDoc(participantRef(code));
  return snap.exists() ? (snap.data() as Participant) : null;
}

export async function getParticipantPrivate(
  code: string,
): Promise<ParticipantPrivate | null> {
  await ensureAnonAuth();
  const snap = await getDoc(privateRef(code));
  return snap.exists() ? (snap.data() as ParticipantPrivate) : null;
}

export async function listAllParticipants(): Promise<Participant[]> {
  const snap = await getDocs(collection(db, PARTICIPANTS));
  return snap.docs.map((d) => d.data() as Participant);
}

// Marks the item eaten, advances currentStop, and appends a log entry.
export async function logItem(
  code: string,
  itemKey: string,
  stop: number,
  by: string,
  note = '',
) {
  const entry: ItemLogEntry = { itemKey, stop, by, note, at: null };
  await updateDoc(participantRef(code), {
    [`items.${itemKey}`]: true,
    currentStop: Math.min(stop + 1, 8),
    status: 'in_progress',
    startedAt: serverTimestamp(),
    itemLog: arrayUnion({ ...entry, at: new Date() }),
  });
}

export async function undoItem(
  code: string,
  itemKey: string,
  participant: Participant,
) {
  const newLog = participant.itemLog.filter((l) => l.itemKey !== itemKey);
  const newStop = Math.max(1, newLog.length + 1);
  await updateDoc(participantRef(code), {
    [`items.${itemKey}`]: false,
    currentStop: newStop,
    itemLog: newLog,
  });
}

export async function setActiveRunner(code: string, runner: string) {
  await updateDoc(participantRef(code), { activeRunner: runner });
}

export async function addNote(code: string, text: string, by = '') {
  const note: NoteEntry = { text, by, at: null };
  await updateDoc(participantRef(code), {
    notes: arrayUnion({ ...note, at: new Date() }),
  });
}

export async function bumpTrashCount(code: string, delta = 1) {
  await updateDoc(participantRef(code), { trashCount: increment(delta) });
}

export async function setStatus(code: string, status: ParticipantStatus) {
  const updates: Record<string, unknown> = { status };
  if (status === 'finished') updates.finishedAt = serverTimestamp();
  await updateDoc(participantRef(code), updates);
}

export async function createParticipant(p: Partial<Participant> & { code: string }) {
  const full: Participant = {
    name: p.name ?? '',
    type: p.type ?? 'individual',
    members: p.members ?? [],
    activeRunner: p.activeRunner ?? null,
    currentStop: 1,
    items: p.items ?? {},
    itemLog: [],
    notes: [],
    trashCount: 0,
    status: 'not_started',
    startedAt: null,
    finishedAt: null,
    createdAt: null,
    code: p.code.toUpperCase(),
  };
  await setDoc(participantRef(full.code), { ...full, createdAt: serverTimestamp() });
}
