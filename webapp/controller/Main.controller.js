sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Fragment, MessageBox, JSONModel, MessageToast) {
        "use strict";

        return Controller.extend("com.ordago.wahu.controller.Main", {

            collRefGames: null,

            onInit: function () {
                // Get the Firebase Model
                const firebaseModel = this.getOwnerComponent().getModel("firebase");
                
                // Create a Authentication reference
			    const fireAuth = firebaseModel.getProperty("/fireAuth");

                // Create a Firestore reference
                const firestore = firebaseModel.getData().firestore;
                // Create a collection reference to the navigations collection
                // const collRefNavs = firestore.collection("Navigation"),
                this.collRefGames = firestore.collection("games");
                this.collRefTeams = firestore.collection("teams");

                fireAuth.onAuthStateChanged(function (user) {
                    if (user) {
                        // Get realtime Data
                        //this.getRealTimeData();
                    }
                }.bind(this));
            },

            onMyGamesSelect: function () {
                //Init Games model
                this.clearGamesModel();

                // The onSnapshot creates a listener to our collection in this case
                this.collRefGames.onSnapshot(function (snapshot) {
                    // Get the shipment model
                    var oModel = this.getView().getModel("Games");
                    // Get all the shipments
                    var appData = oModel.getData();
    
                    // Get the current added/modified/removed document (shipment) of the collection (shipments)
                    snapshot.docChanges().forEach(function (change) {
                        // set id (to know which document is modifed and replace it on change.Type == modified) 
                        // and data of firebase document
                        var oDocument = change.doc.data();
                        oDocument.id = change.doc.id;
    
                        // Added document (shipment) add to arrat
                        if (change.type === "added") {
                            var date = oDocument.date.toDate();
                            oDocument.date= date;
                            appData.games.push(oDocument);
                        }
                        // Modified document (find its index and change current doc with the updated version)
                        else if (change.type === "modified") {
                            var index = appData.games.map(function (document) {
                                return document.id;
                            }).indexOf(oDocument.id);
                            //var date = oDocument.date.toDate();
                            oDocument.date= oDocument.date.toDate();
                            appData.games[index] = oDocument;
                        }
                        // Removed document (find index and remove it from the shipments array in the model)
                        else if (change.type === "removed") {
                            var index = appData.games.map(function (document) {
                                return document.id;
                            }).indexOf(oDocument.id);
                            appData.games.splice(index, 1);
                        }
                    });
    
                    //Refresh your model and the binding of the items in the table
                    this.getView().getModel("Games").refresh(true);
                    this.getView().byId("myGamesList").getBinding("items").refresh();
                }.bind(this));
            },

            onMyTeamsSelect: function () {
                //Init Teams Model
                this.clearTeamsModel();
                // The onSnapshot creates a listener to our collection in this case
                this.collRefTeams.onSnapshot(function (snapshot) {
                    // Get the shipment model
                    var oModel = this.getView().getModel("Teams");
                    // Get all the shipments
                    var appData = oModel.getData();

                    // Get the current added/modified/removed document of the collection 
                    snapshot.docChanges().forEach(function (change) {
                        // set id (to know which document is modifed and replace it on change.Type == modified) 
                        // and data of firebase document
                        var oDocument = change.doc.data();
                        oDocument.id = change.doc.id;

                        // Added document (shipment) add to arrat
                        if (change.type === "added") {
                            appData.teams.push(oDocument);
                        }
                        // Modified document (find its index and change current doc with the updated version)
                        else if (change.type === "modified") {
                            var index = appData.teams.map(function (document) {
                                return document.id;
                            }).indexOf(oDocument.id);
                            appData.teams[index] = oDocument;
                        }
                        // Removed document (find index and remove it from the shipments array in the model)
                        else if (change.type === "removed") {
                            var index = appData.teams.map(function (document) {
                                return document.id;
                            }).indexOf(oDocument.id);
                            appData.teams.splice(index, 1);
                        }
                    });

                    //Refresh your model and the binding of the items in the table
                    this.getView().getModel("Teams").refresh(true);
                    this.getView().byId("myTeamsList").getBinding("items").refresh();
                }.bind(this));
            },

            getNavigations: async function (collRefNavs) {
                collRefNavs.get().then(
                    function (collection) {
                        var navigationModel = this.getView().getModel("Navigations");
                        var navData = navigationModel.getData();
                        var navigations = collection.docs.map(function (record) {
                                    return record.data();
                                });
                        navData.navigations = navigations;
                        navigationModel = navigations;
                }.bind(this));
            },

            onItemSelect: function (oEvent) {
                var oItem = oEvent.getParameter("item");
                this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
            },

            onSideNavButtonPress: function () {
                var oToolPage = this.byId("toolPage");
                var bSideExpanded = oToolPage.getSideExpanded();
    
                this._setToggleButtonTooltip(bSideExpanded);
    
                oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
            },

            onAddGame: function () {
                this._AddGame ??= this.loadFragment({
                    name: "com.ordago.wahu.view.fragments.addGame",
                    controller: this
                });

                this._AddGame.then((oDialog) => {
                    oDialog.open(); 
                    this.collRefGames
                }); 
            },

            onAddTeam: function () {
                this._AddTeam ??= this.loadFragment({
                    name: "com.ordago.wahu.view.fragments.addTeam",
                    controller: this
                });

                this._AddTeam.then((oDialog) => {
                    oDialog.open(); 
                    this.collRefTeams
                }); 
            },

            onCloseDialogAddPlayer: function (oEvent) {
                if (this.getView().getModel("Teams").getContext("/currentPlayer").getObject()) {
                    this.clearAddedPlayer(oEvent);
                }
                this._AddTeam.then((oDialog) => oDialog.close());
            },

            onCloseDialogAddTeam: function (oEvent) {
                if (this.getView().getModel("Teams").getContext("/currentTeam").getObject()) {
                    this.clearAddedTeam(oEvent);
                }
                this._AddTeam.then((oDialog) => oDialog.close());
            },

            onPressCloseDialogAddGame: function (oEvt){
                this.onCloseDialogAddGame()
            },

            onPressCloseDialogAddTeam: function (oEvt){
                this.onCloseDialogAddTeam()
            },

            onPressCloseDialogAddPlayer: function (oEvt){
                this.onCloseDialogAddPlayer()
            },

            onChangeGame: function (oEvent) {

            },
            
            onDeleteGame: function (oEvent) {
                var me = this;
                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id");
                
                MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("ConfirmDeleteGame"), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            me.collRefGames.doc(gameId).delete().then(function () {
                                me.showMessage("DeleteGameSuccess");
                            }.bind(me)).catch(function (error) {
                                console.error("Error removing document: " + gameId + ": ", error);
                            });
                        }
                    }
                });
            },

            onDeleteTeam: function (oEvent) {
                var me = this;
                var selectedPath = this.getView().byId("myTeamsList").getSelectedContextPaths(),
                    teamId = this.getView().getModel("Teams").getProperty(selectedPath + "/id");
                
                MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("ConfirmDeleteTeam"), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            me.collRefTeams.doc(teamId).delete().then(function () {
                                me.showMessage("DeleteTeamSuccess");
                            }.bind(me)).catch(function (error) {
                                console.error("Error removing document: " + teamId + ": ", error);
                            });
                        }
                    }
                });
            },

            onSaveAddGame: function (oEvent) {
                var oGamesModel = oEvent.getSource().getModel("Games");
                var oGame = oGamesModel.getContext("/currentGame").getObject();

                this.collRefGames.add(oGame).then(function (doc) {
                    oGame.id = doc.id;
                    oGamesModel.refresh(true);
                    this.getView().byId("myGames").getBinding("items").refresh();
                    this.clearAddedGame(oEvent);
                    this.onCloseDialogAddGame();
                    this.showMessage("AddGameSuccess");
                }.bind(this)).catch(function (error) {
                    console.error("Error adding document: ", error);
                });
            },

            onSaveAddTeam: function (oEvent) {
                var oTeamsModel = oEvent.getSource().getModel("Teams");
                var oTeam = oTeamsModel.getContext("/currentTeam").getObject();

                this.collRefTeam.add(oTeam).then(function (doc) {
                    oTeam.id = doc.id;
                    oTeamModel.refresh(true);
                    this.getView().byId("myTeam").getBinding("items").refresh();
                    this.clearAddedTeam(oEvent);
                    this.onCloseDialogAddTeam();
                    this.showMessage("AddTeamSuccess");
                }.bind(this)).catch(function (error) {
                    console.error("Error adding document: ", error);
                });
            },

            onSaveAddPlayer: function (oEvent) {
                var oModel = oEvent.getSource().getModel("Teams");
                var oTeam = oTeamsModel.getContext("/currentTeam").getObject();

                this.collRefTeam.add(oTeam).then(function (doc) {
                    oTeam.id = doc.id;
                    oTeamModel.refresh(true);
                    this.getView().byId("myTeam").getBinding("items").refresh();
                    this.clearAddedTeam(oEvent);
                    this.onCloseDialogAddTeam();
                    this.showMessage("AddTeamSuccess");
                }.bind(this)).catch(function (error) {
                    console.error("Error adding document: ", error);
                });
            },

            /* onTipoChangeAddGame: function() {
                var oPropiedad = oEvent.getSource().getModel("Propiedades").getContext("/currentProp").getObject();
			    oPropiedad.Tipo = oEvent.getSource().getSelectedItem().getKey();
            },

            onPaisChangeAddGame: function() {
                var oPropiedad = oEvent.getSource().getModel("Propiedades").getContext("/currentProp").getObject();
			    oPropiedad.Pais = oEvent.getSource().getSelectedItem().getKey();
            }, */

            onUnlockGame: function(oEvent) {
                var me = this;
                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id"),
                    gameDoc = this.getView().getModel("Games").getContext(String(selectedPath)).getObject();
                
                MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText(gameDoc.lock ? 'ConfirmUnlockGame' : 'ConfirmLockGame'), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            me.collRefGames.doc(gameId).set({
                                    "location": gameDoc.location,
                                    "date": gameDoc.date,
                                    "status": gameDoc.status,
                                    "lock": !gameDoc.lock,
                                    "reservation": gameDoc.reservation
                            } ).then(function () {
                                me.showMessage( !gameDoc.lock ? 'GameLockSuccess' : 'GameUnlockedSuccess');
                            }.bind(me)).catch(function (error) {
                                console.error("Error Locking/Unlocking document: " + gameId + ": ", error);
                                me.showMessage( !gameDoc.lock ? 'GameLockError' : 'GameUnlockedError');
                            });
                        }
                    }
                });
            },

            onGameReserve: function(oEvent) {
                var me = this;
                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id"),
                    gameDoc = this.getView().getModel("Games").getContext(String(selectedPath)).getObject();
                
                MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText(gameDoc.reservation ? 'ConfirmReserveCourt' : 'ConfirmReserveCourtCancel'), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            gameDoc.reservation = !gameDoc.reservation;
                            me.collRefGames.doc(gameId).set({ gameDoc }).then(function () {
                                me.showMessage( gameDoc.lock ? 'GameReserveSuccess' : 'GameReserveDeleteSuccess');
                            }.bind(me)).catch(function (error) {
                                console.error("Error changing Reservation in document: " + gameId + ": ", error);
                                me.showMessage( gameDoc.lock ? 'GameReserveError' : 'GameReserveDeleteError');
                            });
                        }
                    }
                });
            },

            onAddTeamPlayer: function() {
                this._AddPlayer ??= this.loadFragment({
                    name: "com.ordago.wahu.view.fragments.addPlayer",
                    controller: this
                });

                this._AddPlayer.then((oDialog) => {
                    oDialog.open(); 
                    //this.collRefGames
                }); 
            },

            clearGamesModel: function () {
                var oGames = { 
                    games: [], 
                    currentGame: {
                        date: "",
                        location: "",
                        status: "",
                        reservation: "",
                    }
                };

                var gamesModel = new JSONModel(oGames);
                this.getView().setModel(gamesModel, "Games");
            },

            clearTeamsModel: function () {
                var oTeams = {
                    teams: [],
                    currentTeam: {
                        name: "",
                        type: "",
                        everyDay: 0,
                        everyTime: 0,
                        location: "",
                        frequency: false,
                        players: [],
                        committee: [],
                    },
                    currentPlayer: {
                        name:"",
                        email:""
                    }
                };

                var teamsModel = new JSONModel(oTeams);
                this.getView().setModel(teamsModel, "Teams");
            },

            clearAddedGame: function () {
                this.getView().getModel("Games").getContext("/currentGame").getModel().getData().currentGame = {};
                //this.getView().getModel("Games").getContext("/currentGame").getModel().setProperty("/selectedKey", "");
                this.getView().getModel("Games").refresh(true);
            },

            clearAddedPlayer: function () {
                this.getView().getModel("Teams").getContext("/currentPlayer").getModel().getData().currentGame = {};
                //this.getView().getModel("Teams").getContext("/currentPlayer").getModel().setProperty("/selectedKey", "");
                this.getView().getModel("Teams").refresh(true);
            },

            clearAddedTeam: function () {
                this.getView().getModel("Teams").getContext("/currentTeam").getModel().getData().currentGame = {};
                //this.getView().getModel("Teams").getContext("/currentTeam").getModel().setProperty("/selectedKey", "");
                this.getView().getModel("Teams").refresh(true);
            },

            showMessage: function (text) {
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText(text))
            },

            onAvatarPressed: function (event) {
                var user = this.getOwnerComponent().getModel("User");
                const fireAuth = this.getView().getModel("firebase").getProperty("/fireAuth");
                if (user) {
                    // there is a user logged in, so we log off
                    fireAuth.signOut().then(function() {
                        console.log('Signed Out');
                    }, function(error) {
                        console.error('Sign Out Error', error);
                    });
                } else {
                    // there is no user logged in, so we log on
                }
            }
        });
    });
