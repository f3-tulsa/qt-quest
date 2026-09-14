// Imports a roster CSV (exported from the F3 QT Quest signup Google Sheet)
// into Firestore, generating a short access code for each participant/team
// and printing the shareable link for each one.
//
// Usage:
//   1. Put your Firebase service account key at ./service-account.json
//      (Firebase console > Project settings > Service accounts > Generate
//      new private key). This file is gitignored — never commit it.
//   2. Export your roster sheet to CSV with these columns (header row
//      required, case-insensitive, extra columns ignored):
//        Name, Type, Members, EmergencyContact, MedicalNotes, Code
//      - Type: "individual" or "team" (defaults to individual if blank)
//      - Members: semicolon-separated teammate names (teams only)
//      - Code: optional; leave blank to auto-generate one
//   3. Run: npm run import-roster -- path/to/roster.csv [https://your-app-url]
//
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O/0/I/1 confusion

function randomCode(len = 5): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

interface Row {
  Name?: string;
  Type?: string;
  Members?: string;
  EmergencyContact?: string;
  MedicalNotes?: string;
  Code?: string;
  [key: string]: string | undefined;
}

async function main() {
  const csvPath = process.argv[2];
  const baseUrl = process.argv[3] || 'https://YOUR-APP-URL';

  if (!csvPath) {
    console.error('Usage: npm run import-roster -- path/to/roster.csv [base-url]');
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert('./service-account.json'),
  });
  const db = getFirestore(app);

  const raw = readFileSync(csvPath, 'utf-8');
  const rows: Row[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const usedCodes = new Set<string>();
  let created = 0;

  for (const row of rows) {
    const name = (row.Name || '').trim();
    if (!name) continue;

    const type = (row.Type || 'individual').toLowerCase().startsWith('team')
      ? 'team'
      : 'individual';
    const members = (row.Members || '')
      .split(';')
      .map((m) => m.trim())
      .filter(Boolean);

    let code = (row.Code || '').trim().toUpperCase();
    while (!code || usedCodes.has(code)) {
      code = randomCode();
    }
    usedCodes.add(code);

    await db
      .collection('participants')
      .doc(code)
      .set({
        code,
        name,
        type,
        members,
        activeRunner: null,
        currentStop: 1,
        items: {},
        itemLog: [],
        notes: [],
        trashCount: 0,
        status: 'not_started',
        startedAt: null,
        finishedAt: null,
        createdAt: FieldValue.serverTimestamp(),
      });

    if (row.EmergencyContact || row.MedicalNotes) {
      await db
        .collection('participants_private')
        .doc(code)
        .set({
          emergencyContact: row.EmergencyContact || '',
          medicalNotes: row.MedicalNotes || '',
        });
    }

    created++;
    console.log(`${name.padEnd(28)} code=${code}  ${baseUrl}/c/${code}`);
  }

  console.log(`\nDone. Imported ${created} participants/teams.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
