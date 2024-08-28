sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"com/ordago/wahu/model/formatter",
	"com/ordago/wahu/Firebase"
], function(Controller, formatter, Firebase) {
	"use strict";

	return Controller.extend("com.ordago.wahu.controller.NoUserLoggedIn", {

		formatter: formatter,

		onInit: function () {

		},

		onAfterRendering: function () {
			// Get the Firebase Model
			const firebaseModel = this.getView().getModel("firebase");

			// Create a Firestore reference
			const firestore = this.getView().getModel("firebase").getData().firestore;
			// Create a Authentication reference
			const fireAuth = this.getView().getModel("firebase").getProperty("/fireAuth");

			// User data
			const User = this.getView().getModel("User");
		},

		onAvatarPressed: function(event) {
			var user = this.getOwnerComponent().getModel("User");
			var oRouter = this.getOwnerComponent().getRouter();
			// Get the Firebase Model
			const firebase = this.getView().getModel("firebase");
			const fireAuth = this.getView().getModel("firebase").getProperty("/fireAuth");
			const provider = this.getView().getModel("firebase").getProperty("/provider");

			fireAuth.signInWithRedirect(provider)
				.then((result) => {
					console.log("Logged in");

				}).catch((error) => {
					console.log("error while logging in")
				} );
		}
	});
});
