// Run with Application Default Credentials only after reviewing the target project.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const [projectId, ownerUid] = process.argv.slice(2);
if (!projectId || !ownerUid) throw new Error('Usage: node seed-professional.js PROJECT_ID OWNER_FIREBASE_UID');
initializeApp({ projectId });
if (!process.env.FIRESTORE_EMULATOR_HOST) await getAuth().getUser(ownerUid);
const db = getFirestore();
await db.runTransaction(async tx => {
  const professional = db.doc('professionals/ceoaberto');
  const existing = await tx.get(professional);
  if (existing.exists && existing.data().ownerUid != null && existing.data().ownerUid !== ownerUid) throw new Error('Owner mismatch; refusing to replace professional.');
  if (existing.exists && existing.data().ownerUid == null) tx.update(professional, { ownerUid });
  if (!existing.exists) tx.create(professional, { name: 'CeoAberto', ownerUid, active: true });
});
console.log('CeoAberto ownership provisioned. Existing records preserved.');
