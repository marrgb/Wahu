sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "com/ordago/wahu/controller/utils/FirebaseUtils"
], function (Controller, JSONModel, MessageBox, FirebaseUtils) {
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
                const oTeamDoc = await FirebaseUtils.getDocument("teams", this._teamId);
                if (oTeamDoc) {
                    oTeamModel.setData(oTeamDoc);
                } else {
                    MessageBox.error("Team not found");
                }

                const oInviteDoc = await FirebaseUtils.getDocument("invites", this._inviteId, `teams/${this._teamId}`);
                if (oInviteDoc) {
                    oInviteModel.setData(oInviteDoc);
                } else {
                    MessageBox.error("Invite not found");
                }
            } catch (error) {
                MessageBox.error("Error fetching data from Firestore: " + error.message);
            }
        },

        onAcceptInvite: function () {
            const oUser = this.getOwnerComponent().getModel("user").getData();
            if (!oUser || !oUser.uid) {
                this.getOwnerComponent().getRouter().navTo("RouteNotLogged");
                return;
            }

            this._updateInviteStatus("accepted")
                .then(() => {
                    return FirebaseUtils.addPlayerToTeam(this._teamId, oUser.uid);
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
            return FirebaseUtils.updateDocument("invites", this._inviteId, { status: sStatus }, `teams/${this._teamId}`);
        }
    });
});
