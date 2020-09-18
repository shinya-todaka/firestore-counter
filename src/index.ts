import firebase from "firebase/app";

type User = {
  displayName: string;
  photoURL: string;
}

const uid = "hogehoge"
const userReference = firebase.firestore().collection('users').doc(uid)

