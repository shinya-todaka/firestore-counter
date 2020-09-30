/* eslint-disable */
import { firestore } from 'firebase';

declare module 'firebase' {
  namespace firestore {
    interface DocumentReference<T> {
      _get(
        options?: firestore.GetOptions | undefined,
      ): Promise<firestore.DocumentSnapshot<firestore.DocumentData>>;
      _onSnapshot(
        options: SnapshotListenOptions,
        observer: {
          next?: (snapshot: DocumentSnapshot<T>) => void;
          error?: (error: FirestoreError) => void;
          complete?: () => void;
        },
      ): () => void;
    }

    interface Query<T> {
      _get(options?: GetOptions): Promise<QuerySnapshot<T>>;
      _onSnapshot(
        options: SnapshotListenOptions,
        observer: {
          next?: (snapshot: QuerySnapshot<T>) => void;
          error?: (error: FirestoreError) => void;
          complete?: () => void;
        },
      ): () => void;
    }
  }
}
