/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const { onCall, onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.createLetter = onCall(async (request) => {
    try {
        const { content, date, senderId, recipientId } = request.data;

        if (!content || !date || !senderId || !recipientId) {
            throw new Error("Missing required fields: content, date, senderId, recipientId");
        }

        await db.collection("letters").add({
            content,
            date,
            senderId,
            recipientId,
        });

        return { message: "Letter created successfully" };
    } catch (error) {
        console.error("Error creating letter: ", error);
        throw new Error("Error creating letter.");
    }
});

exports.getAllLetters = onRequest( async (req, res) => {
    try {
        if (req.method !== "GET") {
            res.status(405).send("Only GET requests are allowed.");
            return;
        }

        const lettersSnapshot = await db
            .collection("letters")
            .orderBy("date", "desc")
            .get();

        const letters = lettersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json({ letters });
    } catch (error) {
        console.error("Error getting letters: ", error);
        res.status(500).send("Error getting letters.");
    }
});

exports.onLetterCreated = onDocumentCreated(
    "letters/{letterId}",
    (event) => {
        console.log("New letter created: ", event.data);
    }
);
