import { collection, doc, setDoc, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';

export interface SessionData {
  id: string;
  timestamp: number;
  entryVas: number;
  exitVas: number;
  nBackAccuracy: number | null;
}

export const saveSession = async (session: Omit<SessionData, 'id' | 'timestamp'>) => {
  const user = auth.currentUser;
  if (!user) return;

  const sessionId = crypto.randomUUID();
  const timestamp = Date.now();

  const data = {
    ...session,
    ownerId: user.uid,
    timestamp,
  };

  const path = `users/${user.uid}/sessions/${sessionId}`;
  try {
    const docRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    await setDoc(docRef, data);
    return { id: sessionId, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getSessions = async (): Promise<SessionData[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const path = `users/${user.uid}/sessions`;
  try {
    const q = query(
      collection(db, 'users', user.uid, 'sessions'),
    );
    const snapshot = await getDocs(q);
    const sessions: SessionData[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      sessions.push({
        id: docSnap.id,
        timestamp: data.timestamp,
        entryVas: data.entryVas,
        exitVas: data.exitVas,
        nBackAccuracy: data.nBackAccuracy ?? null,
      });
    });
    return sessions.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}


