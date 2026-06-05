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
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const haversine = require("haversine-distance");

const jwtSecret = defineSecret("JWT_SECRET");


function getAuthenticatedUserId(authHeader, secret) {
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, secret);
        return decoded.userId;
    } catch {
        return null;
    }
}

function getDaysToDeliverLetter(senderLocation, recipientLocation) {
    if (senderLocation.latitude == null || senderLocation.longitude == null) {
        throw new Error("senderLocation must have latitude and longitude properties");
    }
    if (recipientLocation.latitude == null || recipientLocation.longitude == null) {
        throw new Error("recipientLocation must have latitude and longitude properties");
    }

    const distanceMeters = haversine(senderLocation, recipientLocation);
    const distanceKm = distanceMeters / 1000.0;

    if (distanceKm <= 150) {
        return 1;
    }
    else if (distanceKm <= 300) {
        return 2;
    }
    else if (distanceKm <= 500) {
        return 3;
    }
    else if (distanceKm <= 800) {
        return 4;
    }
    else if (distanceKm <= 1500) {
        return 5;
    }
    else if (didstanceKm <= 5000) {
        return 6;
    }
    else return 7;

}

exports.createUser = onRequest({secrets: [jwtSecret]}, async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send("Only POST requests are allowed.");
            return;
        }

        let { username, email, password, latitude, longitude } = req.body;
        if (!username || !email || !password) {
            throw new Error("Missing required fields: username, email, password");
        }

        if (latitude == null || longitude == null) {
            latitude = 46.5535096;
            longitude = 15.6033537;
        }

        encrypted_password = await bcrypt.hash(password, 10);

        const userRef = await db.collection("users").add({
            username,
            email,
            password: encrypted_password,
            about: null,
            location: {
                latitude,
                longitude,
            },
        });

        const token = jwt.sign({"userId": userRef.id}, jwtSecret.value(), {expiresIn: "7d"});

        res.status(200).json({ message: "User created successfully.", userId: userRef.id, token: token });

    } catch (err) {
        console.error("Error creating user: ", err);
        res.status(500).send("Error creating user.");
    }
});

exports.updateUser = onRequest({secrets: [jwtSecret]}, async (req, res) => {
    try {
        if (req.method !== "PUT") {
            return res.status(405).send("Only PUT requests are allowed.");
        }

        const userId = req.query.id;

        if (!userId) {
            return res.status(400).send("Missing user id.");
        }

        const authHeader = req.headers.authorization;
        const authenticatedUserId = getAuthenticatedUserId(authHeader, jwtSecret.value());
    
        if (authenticatedUserId !== userId) {
            return res.status(403).send("You are not allowed to update this user.");
        }

        const { username, about, latitude, longitude } = req.body;

        if (!username && !about && (latitude == null || longitude == null)) { // can't use ! because lat/long could be 0.0 which is falsy
            throw new Error("At least one field (username, about, (latitude and longitude)) must be provided.");
        }

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).send("User not found.");
        }

        const updates = {};

        if (username) {
            updates.username = username;
        }

        if (about) {
            updates.about = about;
        }

        if (latitude != null && longitude != null) {
            updates.latitude = latitude;
            updates.longitude = longitude;
        }

        await userRef.update(updates);

        return res.status(200).json({
            message: "User updated successfully.",
        });

    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).send("Error updating user.");
    }
});

exports.deleteUser = onRequest({secrets: [jwtSecret]}, async (req, res) => {
    try {
        if (req.method !== "DELETE") {
            return res.status(405).send("Only DELETE requests are allowed.");
        }

        const userId = req.query.id;

        if (!userId) {
            return res.status(400).send("Missing user id.");
        }

        const authHeader = req.headers.authorization;
        const authenticatedUserId = getAuthenticatedUserId(authHeader, jwtSecret.value());
    
        if (authenticatedUserId !== userId) {
            return res.status(403).send("You are not allowed to delete this user.");
        }

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).send("User not found.");
        }


        await userRef.delete();

        return res.status(200).json({
            message: "User deleted successfully.",
        });

    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).send("Error deleting user.");
    }
});

exports.getAllUsers = onRequest(async (req, res) => {
    try {
        if (req.method !== "GET") {
            return res.status(405).send("Only GET requests are allowed.");
        }

        const snapshot = await db.collection("users").get();

        const users = snapshot.docs.map(doc => {
            const { username, about } = doc.data();
            return { username, about };
        });

        return res.status(200).json(users);

    } catch (err) {
        console.error("Error getting users:", err);
        return res.status(500).send("Error getting users.");
    }
});

exports.getUser = onRequest({secrets: [jwtSecret]}, async (req, res) => {
    try {
        if (req.method !== "GET") {
            return res.status(405).send("Only GET requests are allowed.");
        }

        const userId = req.query.id;

        if (!userId) {
            return res.status(400).send("Missing user id.");
        }

        const userDoc = await db.collection("users").doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).send("User not found.");
        }

        const userData = userDoc.data();

        const authHeader = req.headers.authorization;
        const authenticatedUserId = getAuthenticatedUserId(authHeader, jwtSecret.value());
        
        if (authenticatedUserId === userId) {
            return res.status(200).json({
                id: userDoc.id,
                username: userData.username,
                email: userData.email,
                about: userData.about,
            });
        }

        return res.status(200).json({
            username: userData.username,
            about: userData.about,
        });

    } catch (err) {
        console.error("Error getting user:", err);
        return res.status(500).send("Error getting user.");
    }
});

exports.login = onRequest({ secrets: [jwtSecret] }, async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).send("Only POST requests are allowed.");
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Missing required fields: email, password");
        }

        const snapshot = await db
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(401).send("Invalid email or password.");
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        const passwordMatches = await bcrypt.compare(
            password,
            userData.password
        );

        if (!passwordMatches) {
            return res.status(401).send("Invalid email or password.");
        }

        const token = jwt.sign({userId: userDoc.id}, jwtSecret.value(), {expiresIn: "7d"});

        return res.status(200).json({token});

    } catch (err) {
        console.error("Error logging in:", err);
        return res.status(500).send("Error logging in.");
    }
});

/* 
exports.testEnv = onRequest({secrets: [jwtSecret]}, async (req, res) => {
    console.log("testEnv function called");
    console.log("value of JWT_SECRET is ", jwtSecret.value());
    return res.send("Check logs for info!");
});
 */

exports.createLetter = onRequest({secrets: [jwtSecret]}, async (req, res) => {
    try {
        const { content, recipientId } = req.body;

        if (!content || !recipientId) {
            throw new Error("Missing required fields: content, recipientId");
        }

        const authHeader = req.headers.authorization;
        const authenticatedUserId = getAuthenticatedUserId(authHeader, jwtSecret.value());

        if (!authenticatedUserId) {
            return res.status(401).send("You must be logged in to create a letter.");
        }

        const recipientDoc = await db
            .collection("users")
            .doc(recipientId.toString())
            .get();

        if (!recipientDoc.exists) {
            return res.status(404).send("Recipient user does not exist.");
        }

        const letterRef = await db.collection("letters").add({
            content,
            senderId: authenticatedUserId,
            recipientId,
        });

        return res.status(200).json({ message: "Letter created successfully", letterId: letterRef.id });
    } catch (error) {
        console.error("Error creating letter: ", error);
        throw new Error("Error creating letter.");
    }
});

/* admin only maybe?
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
 */

exports.onLetterCreated = onDocumentCreated(
    "letters/{letterId}",
    async (event) => {
        console.log("New letter created: ", event.data);
        console.log("Adding current date to letter.");
        const letterRef = event.data.ref;
        await letterRef.update({
            date: (new Date().toISOString().split('T')[0]),
            delivered: false
        });
    }
);

exports.receivedLetters = onRequest({ secrets: [jwtSecret] }, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const authenticatedUserId = getAuthenticatedUserId(authHeader, jwtSecret.value());

        if (!authenticatedUserId) {
            return res.status(401).send("You must be logged in to view received letters.");
        }

        const snapshot = await db
            .collection("letters")
            .where("recipientId", "==", authenticatedUserId)
            .where("delivered", "==", true)
            .get();

        const letters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.status(200).json({ letters });
    } catch (error) {
        console.error("Error getting received letters:", error);
        return res.status(500).send("Error getting received letters.");
    }
});

async function checkForDeliveredLettersImplementation() {
    try {
        const lettersSnapshot = await db
            .collection("letters")
            .where("delivered", "==", false)
            .get();

        const today = new Date();
        const todayUtc = new Date(
            Date.UTC(
                today.getUTCFullYear(),
                today.getUTCMonth(),
                today.getUTCDate()
            )
        );

        for (const letterDoc of lettersSnapshot.docs) {
            const letter = letterDoc.data();

            try {
                const { senderId, recipientId, date } = letter;

                const sentDate = new Date(`${date}T00:00:00Z`);

                const elapsedDays = Math.floor(
                    (todayUtc.getTime() - sentDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                const senderDoc = await db.collection("users").doc(senderId).get();
                const recipientDoc = await db.collection("users").doc(recipientId).get();

                const sender = senderDoc.data();
                const recipient = recipientDoc.data();

                const senderLocation = sender.location;
                const recipientLocation = recipient.location;

                const requiredDays = getDaysToDeliverLetter(senderLocation, recipientLocation);

                if (elapsedDays >= requiredDays) {
                    await letterDoc.ref.update({delivered: true,});

                    console.log("Delivered letter " + letterDoc.id);
                }
            } catch (error) {
                console.error("Error processing letter " +  letterDoc.id + " :", error);
            }
        }

        console.log("Finished checking undelivered letters.");

    } catch (error) {
        console.error("Error checking delivered letters:", error);
    }
}

exports.checkForDeliveredLetters = onSchedule(
    {
        schedule: "0 7 * * *",
        timeZone: "Europe/Ljubljana",
    },
    async (event) => {
        await checkForDeliveredLettersImplementation();
    }
);

exports.testCheckForDeliveredLetters = onRequest(async (req, res) => {
    await checkForDeliveredLettersImplementation();
    res.send("Done, check logs.");
});