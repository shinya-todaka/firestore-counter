import { firestore } from 'firebase';

export type NextFn<T> = (value: T) => void;
export type ErrorFn = (error: firestore.FirestoreError) => void;
export type CompleteFn = () => void;

// Allow for any of the Observer methods to be undefined.
export interface PartialObserver<T> {
  next?: NextFn<T>;
  error?: ErrorFn;
  complete?: CompleteFn;
}

export interface JsonObject<T> {
  [name: string]: T;
}

export type ReadCounter = {
  countFromServer: number;
  countFromCache: number;
  errorCount: number;
};

export interface Options {
  includeDetails: boolean;
}
