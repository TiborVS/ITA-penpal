export class API {
    static BASE_URL = "http://127.0.0.1:5001/penpal-e86f0/us-central1/";

    static async #callApi(endpoint, method = "GET", data) {
        // TODO IMPL
    }

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
}


