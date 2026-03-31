sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("com.ordago.wahu.controller.Invite", {
        _teamId: null,
        _inviteId: null,

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteInvite").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: async function (oEvent) {
            this._teamId = oEvent.getParameter("arguments").teamId;
            this._inviteId = oEvent.getParameter("arguments").inviteId;

            const oTeamModel = new JSONModel();
            this.getView().setModel(oTeamModel, "Team");
            const oInviteModel = new JSONModel();
            this.getView().setModel(oInviteModel, "Invite");

            try {
                const firestore = this.getOwnerComponent().getModel("firebase").getData().firestore;

                const oTeamDocRef = await firestore.collection("teams").doc(this._teamId).get();
                if (oTeamDocRef.exists) {
                    oTeamModel.setData(oTeamDocRef.data());
                } else {
                    MessageBox.error("Team not found");
                }

                const oInviteDocRef = await firestore.collection("teams").doc(this._teamId).collection("invites").doc(this._inviteId).get();
                if (oInviteDocRef.exists) {
                    oInviteModel.setData(oInviteDocRef.data());
                } else {
                    MessageBox.error("Invite not found");
                }
            } catch (error) {
                MessageBox.error("Error fetching data from Firestore: " + error.message);
            }
        },

        onAcceptInvite: async function () {
            let oUser = this.getOwnerComponent().getModel("User").getData();
            if (!oUser || !oUser.uid) {
                // this.getOwnerComponent().getRouter().navTo("RouteNotLogged");
                // return;
                const fireAuth = this.getView().getModel("firebase").getProperty("/fireAuth");
                const provider = this.getView().getModel("firebase").getProperty("/provider");

                try {
                    const result = await fireAuth.signInWithPopup(provider);
                    console.log("Signed up");
                    oUser = result.user;
                } catch(error) {
                    console.log("error while signing up");
                    return; // exit early if pop-up closed or error
                }
            }

            this._updateInviteStatus("accepted")
                .then(() => {
                    const firestore = this.getOwnerComponent().getModel("firebase").getData().firestore;
                    return firestore.collection("teams").doc(this._teamId).update({
                        players: firebase.firestore.FieldValue.arrayUnion(oUser.uid)
                    });
                })
                .then(() => {
                    MessageBox.success("You have successfully joined the team!");
                    this.getOwnerComponent().getRouter().navTo("RouteMain");
                })
                .catch(error => {
                    MessageBox.error("Error accepting invitation: " + error.message);
                });
        },

        onDeclineInvite: function () {
            this._updateInviteStatus("declined")
                .then(() => {
                    MessageBox.information("You have declined the invitation.");
                    this.getOwnerComponent().getRouter().navTo("RouteMain");
                })
                .catch(error => {
                    MessageBox.error("Error declining invitation: " + error.message);
                });
        },

        _updateInviteStatus: function (sStatus) {
            const firestore = this.getOwnerComponent().getModel("firebase").getData().firestore;
            return firestore.collection("teams").doc(this._teamId).collection("invites").doc(this._inviteId).update({ status: sStatus });
        }
    });
});
