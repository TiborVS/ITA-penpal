export class API {
    static BASE_URL = "http://127.0.0.1:5001/penpal-e86f0/us-central1/";

    static async createUser(username, email, password, latitude, longitude) {
        let response = await fetch(this.BASE_URL + "createUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password,
                latitude,
                longitude
            })
        });
        if (!response.ok) {
            console.error("Error creating user, response from backend: ", response);
            return null;
        }
        else {
            const contentType = response.headers.get("Content-Type");
            if (contentType?.includes("application/json")) {
                return await response.json();
            }
            else if (contentType?.includes("text/plain")) {
                const responseText = await response.text();
                return {error: responseText};
            }
            else {
                console.error("Error creating user, backend sent response with " + contentType + " content type.");
                console.log(response);
                return {error: "Wrong response content type"};
            }
        }
    }

    static async login(email, password) {
        let response = await fetch(this.BASE_URL + "login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        if (!response.ok) {
            console.error("Error logging in, response from backend: ", response);
            return null;
        }
        else {
            const contentType = response.headers.get("Content-Type");
            if (contentType?.includes("application/json")) {
                return await response.json();
            }
            else if (contentType?.includes("text/plain")) {
                const responseText = await response.text();
                return {error: responseText};
            }
            else {
                console.error("Error creating user, backend sent response with " + contentType + " content type.");
                console.log(response);
                return {error: "Wrong response content type"};
            }
        }
    }

    static async getReceivedLetters(token) {
        let response = await fetch(this.BASE_URL + "receivedLetters", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) {
            console.error("Error logging in, response from backend: ", response);
            return null;
        }
        else {
            const contentType = response.headers.get("Content-Type");
            if (contentType?.includes("application/json")) {
                let jsonResponse = await response.json();
                for (let letter of jsonResponse.letters) {
                    const sender = await this.getUser(letter.senderId);
                    if (sender != null) {
                        letter.senderUsername = sender.username;
                    }
                    else {
                        letter.senderUsername = "Unknown username";
                    }
                }
                return jsonResponse.letters;
            }
            else {
                console.error("Error creating user, backend sent response with " + contentType + " content type.");
                console.log(response);
                return {error: "Wrong response content type"};
            }
        }
    }

    static async getUser(userId, token) {
        let requestOptions = {};
        if (token) {
            requestOptions["headers"] = {"Authorization": "Bearer " + token};
        }
        const response = await fetch(this.BASE_URL + "getUser?id=" + userId, requestOptions);
        if (!response.ok) {
            console.error("Error getting user, response from backend: ", response);
            return null;
        }
        else {
            return await response.json();
        }
    }

    static async getLetter(letterId, token) {
        const response = await fetch(this.BASE_URL + "getLetter?id=" + letterId, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) {
            console.error("Error getting letter, response from backend: ", response);
            return null;
        }
        else {
            let letter = await response.json();
            const sender = await this.getUser(letter.senderId);
            if (sender != null) {
                letter.senderUsername = sender.username;
            }
            else {
                letter.senderUsername = "Unknown username";
            }
            return letter;
        }
    }

    static async getUsers() {
        const response = await fetch(this.BASE_URL + "getAllUsers");
        if (!response.ok) {
            console.error("Error getting users, response from backend: ", response);
            return null;
        }
        else {
            return await response.json();
        }
    }

    static async checkIfUserHasFriend(userId, friendId, token) {
        const callingUser = await this.getUser(userId, token);
        const friends = callingUser.friends;
        //console.debug("API.checkIfUserHasFriends: friends variable is ", friends);
        if (friends == null || friends.length < 1) return false;
        for (const id of friends) {
            if (id === friendId) return true;
        }
        return false;
    }

    static async removeFriend(friendId, token) {
        const response = await fetch(this.BASE_URL + "removeFriend?friendId=" + friendId, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) {
            console.error("Error removing friend, response from backend: ", response);
            return false;
        }
        else {
            return true;
        }
    }

    static async addFriend(friendId, token) {
        const response = await fetch(this.BASE_URL + "addFriend?friendId=" + friendId, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) {
            console.error("Error adding friend, response from backend: ", response);
            return false;
        }
        else {
            return true;
        }
    }

    static async updateUser(userId, updateValues, token) {
        const response = await fetch(this.BASE_URL + "updateUser?id=" + userId, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateValues)
        });
        if (!response.ok) {
            console.error("Error updating user, response from backend: ", response);
            return false;
        }
        else return true;
    }

    static async getFriends(token) {
        const response = await fetch(this.BASE_URL + "myFriends", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) {
            console.error("Error getting friends, response from backend: ", response);
            return null;
        }
        else {
            const responseJson = await response.json();
            return responseJson.friends;
        }

    }

    static async createLetter(content, recipientId, token, formData = null) {
        let attachmentData = null;
        if (formData != null) {
            const fileUploadResponse = await fetch(this.BASE_URL + "uploadLetterAttachment", {
                method: "POST",
                body: formData
            });
            if (!fileUploadResponse.ok) {
                console.error("Error uploading attachment, response from backend:", fileUploadResponse);
                return false;
            }
            else {
                attachmentData = await fileUploadResponse.json();
            }
        }
        let requestBody = { content, recipientId };
        if (attachmentData != null) requestBody.attachment = attachmentData;
        const response = await fetch(this.BASE_URL + "createLetter", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            console.error("Error creating letter, response from backend:", response);
            return false;
        }
        else return true;
    }
}


