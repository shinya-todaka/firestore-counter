import firebase from 'firebase/app';
import { firestore } from 'firebase';
import firebaseConfig from '../firebaseConfig';
import counter from './Counter';

firebase.initializeApp(firebaseConfig);
counter.start();

const documentReference = firestore().collection('users').doc('shinya');

documentReference.get().then((snapshot) => {
  console.log(snapshot.data());
});
