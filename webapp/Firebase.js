sap.ui.define([
	"sap/ui/model/json/JSONModel",
], function (JSONModel) {
	"use strict";

	// Firebase-config retrieved from the Firebase-console
	const firebaseConfig = {
		apiKey: "AIzaSyD71xTNvLK8KTa4XYy26Z5YABiW9Fkv-qY",
		authDomain: "wahu-15b45.firebaseapp.com",
		databaseURL: "https://wahu-15b45-default-rtdb.firebaseio.com",
		projectId: "wahu-15b45",
		storageBucket: "wahu-15b45.appspot.com",
		messagingSenderId: "430808833036",
		appId: "1:430808833036:web:5e5520d8446864dfd92229",
		measurementId: "G-17C21ZMS2V"
	};

	return {
		initializeFirebase: function () {
			// Initialize Firebase with the Firebase-config
			firebase.initializeApp(firebaseConfig);

			// Create a Firestore reference
			const firestore = firebase.firestore();

			// Create a Authentication reference
			const fireAuth = firebase.auth();

			// Create the Provider
			var provider = new firebase.auth.GoogleAuthProvider();
			provider.addScope("profile");
			provider.addScope("email");

			// Create a FCM reference
			const messaging = firebase.messaging();

			// Firebase services object
			const oFirebase = {
				firestore: firestore,
				fireAuth: fireAuth,
				provider: provider,
				fcm: messaging
			};

			// Create a Firebase model out of the oFirebase service object which contains all required Firebase services
			var fbModel = new JSONModel(oFirebase);

			// Return the Firebase Model
			return fbModel;

		}
	};
});
