import { firestore } from 'firebase';
import { ReadCounter } from './types';

class Collection implements ReadCounter {
  countFromServer = 0;

  countFromCache = 0;

  errorCount = 0;

  countOfEachPath: { [path: string]: number } = {};

  countOfEachPathFromCache: { [path: string]: number } = {};

  increment(snapshot?: firestore.QuerySnapshot, error?: Error): void {
    if (error) {
      this.errorCount += 1;
    } else if (snapshot) {
      if (snapshot.metadata.fromCache) {
        this.countFromCache += snapshot.docs.length;
      } else {
        this.countFromServer += snapshot.docs.length;
      }
      snapshot.docs.forEach((documentSnapshot) => {
        const { path } = documentSnapshot.ref;
        if (snapshot.metadata.fromCache) {
          if (path in this.countOfEachPathFromCache) {
            this.countOfEachPathFromCache[path] += 1;
          } else {
            this.countOfEachPathFromCache[path] = 0;
          }
        } else if (path in this.countOfEachPath) {
          this.countOfEachPath[path] += 1;
        } else {
          this.countOfEachPath[path] = 0;
        }
      });
    }
  }
}

export default Collection;
