/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/ordago/wahu/model/models",
        "./Firebase",
        "sap/m/MessageToast",
        "sap/ui/model/json/JSONModel"
    ],
    function (UIComponent, Device, models, Firebase, MessageToast, JSONModel) {
        "use strict";

        return UIComponent.extend("com.ordago.wahu.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                // Import Firebase in the sap.ui.define
                // set the firebase model by calling the initializeFirebase function in the Firebase.js file
                this.setModel(Firebase.initializeFirebase(), "firebase");

                // AUTHENTICATION
                // Create a Fireauth reference
                const fireAuth = this.getModel("firebase").getProperty("/fireAuth");

                // If Sign in is successfull, then observer below with trigger
                // Get user data from the observer
                firebase.auth().onAuthStateChanged(function(user) {
                    var User = new JSONModel(user);
                    this.setModel(User, "User");
                if (user) {
                    // User is signed in.
                    var uid = user.uid;

                    // CLOUD MESSAGING FCM
                    // Since we are logged in now we will ask the user permission to send notifications
                    // Create a FCM reference
                    const messaging = this.getModel("firebase").getProperty("/fcm");
                    // Get registration token. Initially this makes a network call, once retrieved
                    // subsequent calls to getToken will return from cache.
                    // vapidKey changed on 13/1/2026 due to Firebase project indicating so.  It seems this changed on 20/6/2023
                    // old vapidKey: 'BDH61zT-tsembJMqhS0Ok4rpKljMbPkrLvOs6Olno_-VnDqebKoI-GGyz43Z-PB887tq3-F99qOh8e0VQLmGS5Q'
                    messaging.getToken({ vapidKey: 'BMcRbQqNYvDnsKnv8ww4HBZQDFUgsXV9uE5fBoiVl6HWuE3PbKHozEi4LRmT37vpD5PsdVLL8x51bAj_PdEXBJ0' }).then((currentToken) => {
                        if (currentToken) {
                            // Send the token to your server and update the UI if necessary
                            // ...
                        } else {
                            // Show permission request UI
                            console.log('No registration token available. Request permission to generate one.');
                            // ...
                        }
                    }).catch((err) => {
                        console.log('An error occurred while retrieving token. ', err);
                        // ...
                    });

                    //FCM ask permission
                    // messaging.requestPermission().then(function () {
                    // 	console.log("Have permission");
                    // 	return messaging.getToken();
                    // }).then(function (token) {
                    // 	console.log(token);
                    // }).catch(function (err) {
                    // 	console.log("Error occured");
                    // });

                    // Show message in foreground (if desired)
                    messaging.onMessage(function (payload) {
                        console.log("Message received. ", payload);
                        var notification = JSON.parse(payload.data.notification);
                        const notificationTitle =notification.title;
                        const notificationOptions = {
                            body: notification.body,
                            icon: notification.icon,
                        };
                        var notification = new Notification(notificationTitle, notificationOptions);
                        return notification;
                    });

                    this.getRouter().navTo("RouteMain");

                } else {
                    // User is signed out.
                    var oRouter = this.getRouter();
                    oRouter.navTo("RouteNotLogged");
                }
                }.bind(this));

            },
        });
    }
);