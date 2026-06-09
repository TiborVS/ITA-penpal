import { API } from "./api.js";
import { AuthManager } from "./auth.js";

export class Forms {
    static #formHandlers = {
        "register": async (event) => {
            event.preventDefault();
            const response = await API.createUser(
                this.#getInputValue("username"),
                this.#getInputValue("email"),
                this.#getInputValue("password"),
                this.#getInputValue("latitude"),
                this.#getInputValue("longitude")
            )
            console.debug(response);
            if (response.error != null) {
                this.#setFormInfo(response.error);
            }
            else {
                const auth = new AuthManager();
                if (auth.login(response.token, response.userId, response.username)) {
                    this.#setFormInfo("You are now logged in.");
                    window.location.replace("/inbox.html");
                }
                else {
                    this.#setFormInfo("Unknown error during registration.");
                }
            }
        },
        "login": async (event) => {
            event.preventDefault();
            const response = await API.login(
                this.#getInputValue("email"),
                this.#getInputValue("password")                
            );
            console.debug(response);
            if (response.error != null) {
                this.#setFormInfo(response.error);
            }
            else {
                const auth = new AuthManager();
                if (auth.login(response.token, response.userId, response.username)) {
                    this.#setFormInfo("You are now logged in.");
                    window.location.replace("/inbox.html");
                }
                else {
                    this.#setFormInfo("Unknown error logging in.");
                }
            }
        },
        "update-user": async (event) => {
            event.preventDefault();
            const auth = new AuthManager();
            let updateValues = {};
            const username = this.#getInputValue("username");
            const about = this.#getInputValue("about");
            const latitude = this.#getInputValue("latitude");
            const longitude = this.#getInputValue("longitude");
            if (username !== "") updateValues.username = username;
            if (about !== "") updateValues.about = about;
            if (latitude !== "" && longitude !== "") {
                updateValues.latitude = latitude;
                updateValues.longitude = longitude;
            }
            const result = await API.updateUser(auth.getUserId(), updateValues, auth.getToken());
            if (result === true) {
                document.getElementById("user-edit-form").reset();
                window.location.reload();
            }
            else {
                window.alert("Error updating user, try again later");
            }
        },
        "write-letter": async (event) => {
            event.preventDefault();
            const auth = new AuthManager();

            let formData = new FormData();
            const fileList = document.getElementById("input-file").files;
            if (fileList.length > 0) {
                const attachmentFile = fileList[0];
                formData.append("file", attachmentFile);
            }
            const result = await API.createLetter(
                this.#getInputValue("content"),
                this.#getInputValue("recipient"),
                auth.getToken(),
                formData.has("file") ? formData : null
            );
            if (result === true) {
                window.alert("Letter sent!");
                window.location.replace("/inbox.html");
            }
            else {
                window.alert("Error sending letter, try again later.");
            }
        }
    }

    static #getInputValue(fieldName) {
        return document.getElementById("input-" + fieldName).value;
    }

    static #setFormInfo(text) {
        document.getElementById("form-info").innerText = text;
    }

    static initForm(formName) {
        if (this.#formHandlers[formName] !== undefined) {
            document.getElementById("input-submit").addEventListener("click", this.#formHandlers[formName]);
            return true;
        }
        else {
            console.warn("Forms.initForm: no handler defined for form " + formName);
            return false;
        }
    }
}