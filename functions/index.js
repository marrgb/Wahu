
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { defineString } = require("firebase-functions/params");

admin.initializeApp();

// Define parameters for nodemailer credentials.
const nodemailerUser = defineString("NODEMAILER_USER", {description: "invitacioneswahu@gmail.com"});
const nodemailerPass = defineString("NODEMAILER_PASS", {description: "Contraseña"});

const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: nodemailerUser.value(),
        pass: nodemailerPass.value(),
    },
});

exports.sendPlayerInviteEmail = functions.https.onCall(async (request, context) => {
    const { sPlayerId, sTeamName } = request.data;

    if (!sPlayerId || !sTeamName) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with 'sPlayerId' and 'sTeamName'."
        );
    }

    try {
        // Get player data
        const playerDoc = await admin.firestore().collection("players").doc(sPlayerId).get();
        if (!playerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Player not found.");
        }
        const playerData = playerDoc.data();
        const playerEmail = playerData.email;

        if (!playerEmail) {
            console.log(`Player ${sPlayerId} does not have an email address.`);
            return { message: "No email address found for the player." };
        }

        // Get team ID from team name
        const teamsRef = admin.firestore().collection("teams");
        const teamSnapshot = await teamsRef.where("name", "==", sTeamName).limit(1).get();

        if (teamSnapshot.empty) {
            throw new functions.https.HttpsError("not-found", `Team with name "${sTeamName}" not found.`);
        }
        const teamId = teamSnapshot.docs[0].id;

        // Create an invite document in the team's subcollection
        const inviteRef = await admin.firestore()
            .collection("teams")
            .doc(teamId)
            .collection("invites")
            .add({
                playerId: sPlayerId,
                status: "pending"
            });
        const inviteId = inviteRef.id;

        // Create the invitation link
        const inviteLink = `https://wahu-15b45.web.app/#/invite/${teamId}/${inviteId}`;

        // Send the email
        const mailOptions = {
            from: '"Wahu" <invitacioneswahu@gmail.com>',
            to: playerEmail,
            subject: `You have been invited to join ${sTeamName}!`,
            html: `<p>Hi ${playerData.name || 'Player'},</p>
                   <p>You have been invited to join the team "${sTeamName}" on Wahu.</p>
                   <p>Click the link below to accept or decline the invitation:</p>
                   <a href="${inviteLink}">${inviteLink}</a>
                   <p>Thanks,</p>
                   <p>The Wahu Team</p>`,
        };

        await mailTransport.sendMail(mailOptions);
        console.log(`Invitation email sent to ${playerEmail}`);
        return { message: "Email sent successfully." };

    } catch (error) {
        console.error("There was an error:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw HttpsError as is
        }
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while processing the invitation.",
            { errorDetails: error.message }
        );
    }
});
