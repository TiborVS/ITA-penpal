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
}


