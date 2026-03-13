
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { defineString } = require("firebase-functions/params");

admin.initializeApp();

// Define parameters for nodemailer credentials.
// For local testing, create a file named .env in the functions directory (i.e. functions/.env)
// with the following content:
// NODEMAILER_USER=your-email@gmail.com
// NODEMAILER_PASS=your-app-password
const nodemailerUser = defineString("NODEMAILER_USER", {description: "invitacioneswahu@gmail.com"});
const nodemailerPass = defineString("NODEMAILER_PASS", {description: "Contraseña"});

const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
//        user: nodemailerUser.value(),
//        pass: nodemailerPass.value(),
        user: nodemailerUser,
        pass: nodemailerPass,
    },
});

exports.sendPlayerInviteEmail = functions.https.onCall(async (data, context) => {
    const { sPlayerId, sTeamName } = data;

    if (!sPlayerId || !sTeamName) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with two arguments 'sPlayerId' and 'sTeamName'."
        );
    }

    try {
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

        const mailOptions = {
            from: '"Wahu" <invitacioneswahu@gmail.com>',
            to: playerEmail,
            subject: `You have been invited to join ${sTeamName}!`,
            text: `Hi ${playerData.name || 'Player'},

You have been invited to join the team "${sTeamName}" on Wahu.

To accept or reject the invitation, please open the Wahu app.

Thanks,
The Wahu Team`,
        };

        await mailTransport.sendMail(mailOptions);
        console.log(`Invitation email sent to ${playerEmail}`);
        return { message: "Email sent successfully." };

    } catch (error) {
        console.error("There was an error sending the email:", error);
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while trying to send the email."
        );
    }
});
