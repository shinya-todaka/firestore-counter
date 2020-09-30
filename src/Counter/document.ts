import { firestore } from 'firebase';
import { ReadCounter } from './types';

class Document implements ReadCounter {
  countFromServer = 0;

  countFromCache = 0;

  errorCount = 0;

  countOfEachPath: { [path: string]: number } = {};

  countOfEachPathFromCache: { [path: string]: number } = {};

  errors: { [path: string]: number } = {};

  increment(
    path: string,
    snapshot?: firestore.DocumentSnapshot,
    error?: Error,
  ): void {
    if (error) {
      if (path in this.errors) {
        this.errors[path] += 1;
      } else {
        this.errors[path] = 0;
      }
    } else if (snapshot) {
      if (snapshot.metadata.fromCache) {
        this.countFromCache += 1;
        if (path in this.countOfEachPathFromCache) {
          this.countOfEachPathFromCache[path] += 1;
        } else {
          this.countOfEachPathFromCache[path] = 0;
        }
      } else {
        this.countFromServer += 1;
        if (path in this.countOfEachPath) {
          this.countOfEachPath[path] += 1;
        } else {
          this.countOfEachPath[path] = 0;
        }
      }
    }
  }
}

export default Document;
