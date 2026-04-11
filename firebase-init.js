const firebaseConfig = {
    apiKey: "AIzaSyCLBXjCBHm0SR7g4SouHO-1wbIQeMpsTdM",
    authDomain: "lost-found-45.firebaseapp.com",
    projectId: "lost-found-45",
    storageBucket: "lost-found-45.firebasestorage.app",
    messagingSenderId: "172877537818",
    appId: "1:172877537818:web:c1b8e13191b7a84cb127a3",
    measurementId: "G-E0FEZ5GV9B"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();

// Enable offline persistence for lighting fast database loads
window.db.enablePersistence()
  .catch((err) => {
    console.warn("Firebase persistence error: ", err.code);
  });
