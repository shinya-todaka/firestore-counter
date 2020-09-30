/* eslint-disable no-underscore-dangle */
import firebase from 'firebase/app';
import { firestore } from 'firebase';
import Collection from './collection';
import Document from './document';
import './extensions';
import {
  ReadCounter,
  JsonObject,
  PartialObserver,
  NextFn,
  ErrorFn,
  CompleteFn,
  Options,
} from './types';

function implementsAnyMethods(obj: unknown, methods: string[]): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const object = obj as JsonObject<unknown>;
  for (const method of methods) {
    if (method in object && typeof object[method] === 'function') {
      return true;
    }
  }

  return false;
}

const isPartialObserver = (obj: unknown): boolean =>
  implementsAnyMethods(obj, ['next', 'error', 'complete']);

export class Counter {
  counterOptions: Options = { includeDetails: false };

  document: Document = new Document();

  collection: Collection = new Collection();

  get totalCountFromServer(): number {
    return this.document.countFromServer + this.collection.countFromServer;
  }

  get totalCountFromCache(): number {
    return this.document.countFromCache + this.collection.countFromCache;
  }

  get totalCountError(): number {
    return this.document.errorCount + this.collection.errorCount;
  }

  start(counterOptions: Options = { includeDetails: false }): void {
    this.counterOptions = counterOptions;
    const self = this;

    // DocumentReference

    firebase.firestore.DocumentReference.prototype._get =
      firebase.firestore.DocumentReference.prototype.get;
    firebase.firestore.DocumentReference.prototype.get = async function (
      options?: firestore.GetOptions | undefined,
    ) {
      const documentReference = this as firestore.DocumentReference;

      return documentReference
        ._get(options)
        .then((snapshot) => {
          self.document.increment(documentReference.path, snapshot);
          self.log('Document');

          return snapshot;
        })
        .catch((error) => {
          self.document.increment(documentReference.path, undefined, error);
          self.log('Document');

          return error;
        });
    };

    firebase.firestore.DocumentReference.prototype._onSnapshot =
      firebase.firestore.DocumentReference.prototype.onSnapshot;
    firebase.firestore.DocumentReference.prototype.onSnapshot = function (
      ...args: unknown[]
    ): () => void {
      const documentReference = this as firestore.DocumentReference;
      const _args = args;
      let currArg = 0;
      let options: firestore.SnapshotListenOptions = {
        includeMetadataChanges: false,
      };
      if (
        typeof _args[currArg] === 'object' &&
        !isPartialObserver(args[currArg])
      ) {
        options = args[currArg] as firestore.SnapshotListenOptions;
        currArg += 1;
      }

      if (isPartialObserver(args[currArg])) {
        const userObserver = args[currArg] as PartialObserver<
          firestore.DocumentSnapshot
        >;
        _args[currArg] = userObserver.next;
        _args[currArg + 1] = userObserver.error;
        _args[currArg + 2] = userObserver.complete;
      }

      const observer: PartialObserver<firestore.DocumentSnapshot> = {
        next: (snapshot) => {
          self.document.increment(documentReference.path, snapshot);
          self.log('Document');
          (args[currArg] as NextFn<firestore.DocumentSnapshot>)(snapshot);
        },
        error: (error) => {
          self.document.increment(documentReference.path, undefined, error);
          self.log('Document');
          (args[currArg + 1] as ErrorFn)(error);
        },
        complete: args[currArg + 2] as CompleteFn,
      };

      return documentReference._onSnapshot(options, observer);
    };

    // Query

    firebase.firestore.Query.prototype._get =
      firebase.firestore.Query.prototype.get;
    firebase.firestore.Query.prototype.get = function (
      options?: firestore.GetOptions,
    ): Promise<firestore.QuerySnapshot> {
      const documentReference = this as firestore.Query;

      return documentReference
        ._get(options)
        .then((snapshot) => {
          self.collection.increment(snapshot);
          self.log('Collection');

          return snapshot;
        })
        .catch((error) => {
          self.collection.increment(undefined, error);
          self.log('Collection');

          return error;
        });
    };

    firebase.firestore.Query.prototype._onSnapshot =
      firebase.firestore.Query.prototype.onSnapshot;
    firebase.firestore.Query.prototype.onSnapshot = function (
      ...args: unknown[]
    ): () => void {
      const query = this as firestore.Query;
      let currArg = 0;
      const _args = args;
      let options: firestore.SnapshotListenOptions = {
        includeMetadataChanges: false,
      };
      if (
        typeof _args[currArg] === 'object' &&
        !isPartialObserver(args[currArg])
      ) {
        options = _args[currArg] as firestore.SnapshotListenOptions;
        currArg += 1;
      }

      if (isPartialObserver(args[currArg])) {
        const userObserver = args[currArg] as PartialObserver<
          firestore.DocumentSnapshot
        >;
        _args[currArg] = userObserver.next;
        _args[currArg + 1] = userObserver.error;
        _args[currArg + 2] = userObserver.complete;
      }

      const observer: PartialObserver<firestore.QuerySnapshot> = {
        next: (snapshot) => {
          self.collection.increment(snapshot);
          self.log('Collection');
          (_args[currArg] as NextFn<firestore.QuerySnapshot>)(snapshot);
        },
        error: (error) => {
          self.collection.increment(undefined, error);
          self.log('Collection');
          (_args[currArg + 1] as ErrorFn)(error);
        },
        complete: _args[currArg + 2] as CompleteFn,
      };

      return query._onSnapshot(options, observer);
    };
  }

  log(from: 'Document' | 'Collection'): void {
    let readCounter: ReadCounter | undefined;
    if (this.counterOptions.includeDetails) {
      if (from === 'Document') {
        readCounter = this.document;
      } else if (from === 'Collection') {
        readCounter = this.collection;
      }
      // eslint-disable-next-line no-console
      console.log(
        `[Monitoring:${from}] Count from Server: ${readCounter?.countFromServer} | Count from Cache: ${readCounter?.countFromCache} | Error count: ${readCounter?.errorCount}]`,
      );
    }
    // eslint-disable-next-line no-console
    console.log(
      `[Monitoring:Total] Count from Server: ${this.totalCountFromServer} | Count from Cache: ${this.totalCountFromCache} | Error count: ${this.totalCountError}`,
    );
  }
}

const counter = new Counter();
export default counter;
