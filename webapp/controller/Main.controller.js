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
            },

            _getPlayerID: async function (uuid) {
                const playersRef = firebase.firestore().collection("players");
                const playersQuerySnapshot = await playersRef.where("UUID", "==", uuid).get();

                if (playersQuerySnapshot.empty) {
                    console.log("No matching player.");
                    return []; // Return an empty array if no matches are found
                } else {

                    if (playersQuerySnapshot.size !== 1) {
                        console.log("More than one player found.");
                        return [];
                    };

                    // const player = [];
                    playersQuerySnapshot.forEach((doc) => {
                        /* const playerData = doc.data();
                        playerData.id = doc.id; // Add the document ID to the data
                        player.push(doc.id); */
                        return doc.id; // Add the document ID to the data
                    });
                    //return player;
                }

            },

            _getTeamsFromPlayer: async function (playerId) {
                const teamsRef = firebase.firestore().collection("teams");
                const teamsQuerySnapshot = await teamsRef.where("players", "array-contains", playerId).get();

                if (teamsQuerySnapshot.empty) {
                    console.log("No matching documents.");
                    return []; // Return an empty array if no matches are found
                }

                const teams = [];
                teamsQuerySnapshot.forEach((doc) => {
                    const teamData = doc.data();
                    teamData.id = doc.id; // Add the document ID to the data
                    teams.push(teamData);  //teamData.id
                });
                
                return teams;
            },

            _getGamesFromTeam: async function (teamId) {
                const gamesRef = firebase.firestore().collection("games");
                const gamesQuerySnapshot = await gamesRef.where("team", "==", teamId).get();
                if (gamesQuerySnapshot.empty) {
                    console.log("No matching games.");
                    return []; // Return an empty array if no matches are found
                }
                const games = [];
                gamesQuerySnapshot.forEach((doc) => {
                    const gameData = doc.data();
                    gameData.id = doc.id; // Add the document ID to the data
                    games.push(gameData);
                });
                return games;
            },

            _getGameAttendance: async function (gameId) {
                const attendanceRef = firebase.firestore().collection("games").doc(gameId).collection("Attendance");
                const attendanceQuerySnapshot = await attendanceRef.get();
                if (attendanceQuerySnapshot.empty) {
                    console.log("No matching attendance.");
                    return []; // Return an empty array if no matches are found
                }
                const attendance = [];
                attendanceQuerySnapshot.forEach((doc) => {
                    const attendanceData = doc.data();
                    attendanceData.id = doc.id; // Add the document ID to the data
                    attendance.push(attendanceData);
                });
                return attendance;
            },

            onMyGamesSelectNew: async function () {
                this.clearGamesModel();
            
                const userId = this.getOwnerComponent().getModel("User").getData().uid;
                const teams = await this._getTeamsFromPlayer(userId);
                const oModel = this.getView().getModel("Games");
                const gamesModelData = [];
            
                const allPromises = [];
            
                teams.forEach((team) => {
                    const teamGamesPromise = new Promise((resolve) => {
                        this.collRefGames.where("team", "==", team.id).onSnapshot(async (snapshot) => {
                            const gamePromises = snapshot.docChanges().map(async (change) => {
                                const gameData = change.doc.data();
                                gameData.id = change.doc.id;
            
                                if (change.type === "added") {
                                    console.log(gameData);
                                    gameData.date = gameData.date ? gameData.date.toDate() : null;
                                    gameData.attendanceCount = 0;
                                    gameData.minAttendance = team ? team.MinAttendance : 0;
                                    const attendance = await this._getGameAttendance(gameData.id);
                                    gameData.attendanceCount = attendance.length;
                                    gamesModelData.push(gameData);
                                } else if (change.type === "modified") {
                                    const index = gamesModelData.findIndex(game => game.id === gameData.id);
                                    if (index > -1) {
                                        gamesModelData[index] = gameData;
                                    }
                                } else if (change.type === "removed") {
                                    const index = gamesModelData.findIndex(game => game.id === gameData.id);
                                    if (index > -1) {
                                        gamesModelData.splice(index, 1);
                                    }
                                }
                                return gameData; // Return the gameData (though we're pushing to the array directly)
                            });
            
                            await Promise.all(gamePromises); // Wait for all changes within this snapshot to be processed
                            resolve(); // Resolve the promise for this team's games
                        }, (error) => {
                            console.error("Error fetching games for team:", team, error);
                            resolve(); // Resolve even on error to prevent blocking other teams
                        });
                    });
                    allPromises.push(teamGamesPromise);
                });
            
                await Promise.all(allPromises); // Wait for all teams' initial snapshots and processing
            
                // Now that all initial data and attendance counts are (likely) fetched, update the model
                oModel.setProperty("/games", gamesModelData);
                oModel.refresh(true);
                this.getView().byId("myGamesList").getBinding("items").refresh(); // Consider if this is needed here
            },
            
            onMyTeamsSelect: function () {
                //Init Teams Model
                this.clearTeamsModel();
                // The onSnapshot creates a listener to our collection in this case
                this.collRefTeams.onSnapshot(function (snapshot) {
                    // Get the Teams Model
                    var oModel = this.getView().getModel("Teams");
                    // Get all the teams
                    var appData = oModel.getData();

                    // Get the current added/modified/removed document of the collection 
                    snapshot.docChanges().forEach(function (change) {
                        // set id (to know which document is modifed and replace it on change.Type == modified) 
                        // and data of firebase document
                        var oDocument = change.doc.data();
                        oDocument.id = change.doc.id;

                        // Added document (team) add to array
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
                        // Removed document (find index and remove it from the teams array in the model)
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

            onPressInvites: function () {
                var oTeamsList = this.byId("myTeamsList");
                if (!oTeamsList || oTeamsList.getSelectedItems().length === 0) {
                    this.showMessage("noTeamSelected");
                    return;
                }

                this._Invites ??= this.loadFragment({
                    name: "com.ordago.wahu.view.fragments.Invites",
                    controller: this
                });

                this._Invites.then((oDialog) => {
                    oDialog.open();
                });
            },

            onCloseDialogSendInvites: function (oEvent) {
                this._Invites.then((oDialog) => oDialog.close());
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

            onCloseDialogAddGame: function (oEvent) {
                if (this.getView().getModel("Games").getContext("/currentGame").getObject()) {
                    this.clearAddedGame(oEvent);
                }
                this._AddGame.then((oDialog) => oDialog.close());
            },

            onCloseDialogConfirmAttendance: function (oEvent) {
                this._ConfirmAttendance.then((oDialog) => oDialog.close());
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

            onPressCloseDialogConfirmAttendance: function (oEvt){
                this.onCloseDialogConfirmAttendance()
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

            onSendInvites: function (oEvent) {
                var oInviteTable = this.byId("inviteTable");

            },

            onSaveAddGame: function (oEvent) {
                var oGamesModel = oEvent.getSource().getModel("Games");
                var oGame = oGamesModel.getContext("/currentGame").getObject();

                // Set default values for new games
                oGame.status="new";
                oGame.date = new Date(oGame.date);

                this.collRefGames.add(oGame).then(function (doc) {
                    oGame.id = doc.id;
                    this.clearAddedGame(oEvent);
                    this.showMessage("AddGameSuccess");
                }.bind(this)).catch(function (error) {
                    console.error("Error adding document: ", error);
                });

                this.onCloseDialogAddGame();
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
                // Cambiar: esta rutina esta usando cosas de Teams pero deberían ser Jugadores
                var oPlayersModel = oEvent.getSource().getModel("Players");
                var oPlayer = oTeamsModel.getContext("/currentPlayer").getObject();

                this.collRefPlayer.add(oTeam).then(function (doc) {
                    oPlayer.id = doc.id;
                    oPlayersModel.refresh(true);
                    this.getView().byId("myTeam").getBinding("items").refresh();
                    this.clearAddedTeam(oEvent);
                    this.onCloseDialogAddTeam();
                    this.showMessage("AddTeamSuccess");
                }.bind(this)).catch(function (error) {
                    console.error("Error adding document: ", error);
                });
            },

            onSaveGameAttendance: async function (oEvent) {
                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id"),
                    me = this;
                
                const db = firebase.firestore(),
                    gameDocRef = db.collection('games').doc(gameId),
                    uid = this.getOwnerComponent().getModel("User").getData().uid,
                    decision = this.getView().byId("SBAttendanceDecision").getSelectedKey();

                const queryAttendance = gameDocRef.collection("Attendance")
                                            .where("player", "==", uid)
                                            .limit(1);

                queryAttendance.get().then(doc => {
                    if (doc.empty) {
                        // Add the new attendance record to the subcollection
                        const newRecord = {
                            player: uid,
                            status: decision,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        };

                        db.collection("games")
                            .doc(gameId)
                            .collection("Attendance")
                            .add(newRecord)
                            .then((docRef) => {
                                console.log(this.showMessage("ConfirmAttendanceSuccess"));
                                this.onCloseDialogConfirmAttendance();
                            })
                            .catch((error) => {
                                console.error(this.showMessage("ConfirmAttendanceError"));
                        });

                    } else {
                        var attendanceData = doc.data();
                        
                        try {
                            attendanceData.status = decision;
                            attendanceData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                            queryAttendance.collection("Attendance").doc(doc.id)
                                .update(attendanceData).then((attendanceDocRef) => {
                                    console.log(this.showMessage("ConfirmAttendanceSuccess"));
                                    this.onCloseDialogConfirmAttendance();    
                                })
                                .catch((error) => {
                                    console.error(this.showMessage("ConfirmAttendanceError"));
                                });
    
                          }  catch (e) {
                            console.error("Error while adding game confirmation" , e);
                            this.showMessage("ConfirmAttendanceError");
                        }

                    }
                })
                .catch(error => {
                    console.error("Error getting document:", error);
                });

            },

            onPressFlagMyGames: function(oEvent) {
                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id");

                this.showMessage("AttendanceConfirmed");
            },
            
            onConfirmAttendance: function(oEvent) {
                // Load Fragment to display data
                this._ConfirmAttendance ??= this.loadFragment({
                    name: "com.ordago.wahu.view.fragments.confirmAttendance",
                    controller: this
                });

                this._ConfirmAttendance.then((oDialog) => {
                    oDialog.open(); 
                }); 

                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id");
            
                const db = firebase.firestore(),
                    gameDocRef = db.collection('games').doc(gameId);

                //Init Attendance Model
                this.clearAttendanceModel();

                //fetch game attendance data
                const collRefAttendance = gameDocRef.collection("Attendance");

                collRefAttendance.onSnapshot(function (snapshot) {
                    // Get the Attendance Model
                    var oModel = this.getView().getModel("Attendance");
                    // Get all the teams
                    var appData = oModel.getData();

                    // Get the current added/modified/removed document of the collection 
                    snapshot.docChanges().forEach(function (change) {
                        // set id (to know which document is modifed and replace it on change.Type == modified) 
                        // and data of firebase document
                        var oDocument = change.doc.data();
                        oDocument.id = change.doc.id;

                        // Added document add to array
                        if (change.type === "added") {
                            var date = oDocument.timestamp.toDate();
                            oDocument.timestamp= date;
                            appData.attendance.push(oDocument);
                        }
                        // Modified document (find its index and change current doc with the updated version)
                        else if (change.type === "modified") {
                            var index = appData.attendance.map(function (document) {
                                return document.id;
                            }).indexOf(oDocument.id);
                            oDocument.timestamp= oDocument.timestamp.toDate();
                            appData.attendance[index] = oDocument;
                        }
                        // Removed document (find index and remove it from the teams array in the model)
                        else if (change.type === "removed") {
                            var index = appData.attendance.map(function (document) {
                                return document.id;
                            }).indexOf(oDocument.id);
                            appData.attendance.splice(index, 1);
                        }
                    });

                    //Refresh your model and the binding of the items in the table
                    this.getView().getModel("Attendance").refresh(true);
                    this.getView().byId("gameAttendanceList").getBinding("items").refresh();
                }.bind(this));

            },

            onUnlockGame: function(oEvent) {
                var me = this;
                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id"),
                    gameDoc = this.getView().getModel("Games").getContext(String(selectedPath)).getObject();
                
                MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText(gameDoc.lock ? 'ConfirmUnlockGame' : 'ConfirmLockGame'), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            me.collRefGames.doc(gameId).update({
                                "lock": !gameDoc.lock
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

            onReserveCourt: function(oEvent) {
                var me = this;
                var selectedPath = this.getView().byId("myGamesList").getSelectedContextPaths(),
                    gameId = this.getView().getModel("Games").getProperty(selectedPath + "/id"),
                    gameDoc = this.getView().getModel("Games").getContext(String(selectedPath)).getObject();
                
                MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText(!gameDoc.reservation ? 'ConfirmReserveCourt' : 'ConfirmReserveCourtCancel'), {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            me.collRefGames.doc(gameId).update({
                                "reservation": !gameDoc.reservation
                            } ).then(function () {
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
                }); 
            },

            clearGamesModel: function () {
                var oGames = { 
                    games: [], 
                    currentGame: {
                        date: "",
                        location: "",
                        status: "",
                        reservation: false,
                        lock: false,
                        team: "",
                        MinAttendance: 0,
                        currAttendance: 0,
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

            clearAttendanceModel: function () {
                var oAttendance = {
                    attendance: [],
                    currentAttendance: {
                        refPos: 0,
                        player: "",
                        timestamp: "",
                        status: "",
                    }
                };

                var attendanceModel = new JSONModel(oAttendance);
                this.getView().setModel(attendanceModel, "Attendance");
            },

            clearAddedGame: function () {
                this.getView().getModel("Games").getContext("/currentGame").getModel().getData().currentGame = {};
                this.getView().getModel("Games").refresh(true);
            },

            clearAddedPlayer: function () {
                this.getView().getModel("Teams").getContext("/currentPlayer").getModel().getData().currentGame = {};
                this.getView().getModel("Teams").refresh(true);
            },

            clearAddedTeam: function () {
                this.getView().getModel("Teams").getContext("/currentTeam").getModel().getData().currentGame = {};
                this.getView().getModel("Teams").refresh(true);
            },

            showMessage: function (text) {
                MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText(text))
            },

            _setToggleButtonTooltip: function (bLarge) {
                var oToggleButton = this.byId('sideNavigationToggleButton');
                if (bLarge) {
                    oToggleButton.setTooltip(this.getView().getModel("i18n").getResourceBundle().getText("menuExpandido"));
                } else {
                    oToggleButton.setTooltip(this.getView().getModel("i18n").getResourceBundle().getText("menuContraido"));
                }
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
