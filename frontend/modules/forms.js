import { API } from "./api.js";
import { AuthManager } from "./auth.js";

export class Forms {
    static #formHandlers = {
        "register": async (event) => {
            event.preventDefault();
            const response = await API.createUser(
                this.#getTextBoxValue("username"),
                this.#getTextBoxValue("email"),
                this.#getTextBoxValue("password"),
                this.#getTextBoxValue("latitude"),
                this.#getTextBoxValue("longitude")
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
                this.#getTextBoxValue("email"),
                this.#getTextBoxValue("password")                
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
        }
    }

    static #getTextBoxValue(fieldName) {
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