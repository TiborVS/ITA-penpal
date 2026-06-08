import { AuthManager } from "./auth.js";
import { Forms } from "./forms.js";
import { API } from "./api.js";

export class Pages {

    static #PAGES = ["friends", "index", "inbox", "letter", "login", "register", "user", "users", "write"];

    static #pageHandlers = {
        "friends": async () => {

        },
        "index": async () => {

        },
        "inbox": async () => {
            const auth = new AuthManager();
            if (!auth.isLoggedIn()) return; // should have been redirected in Pages.load() call, but here just in case
            const letters = await API.getReceivedLetters(auth.getToken());
            console.debug(letters);
            for (const letter of letters) {
                const {id, content, date, senderId, senderUsername} = letter;
                let letterElement = document.createElement("a");
                letterElement.href = "letter.html?id=" + id;
                letterElement.innerText = "\"" + content.substring(0, 20) + "... \" " + "from " + senderUsername + " on " + date;

                const letterListItem = document.createElement("li");
                letterListItem.appendChild(letterElement);

                document.getElementById("list-letters").appendChild(letterListItem); 
            }
        },
        "letter": async () => {

        },
        "login": async () => {
            Forms.initForm("login");  
        },
        "register": async () => {
            Forms.initForm("register");
        },
        "user": async () => {

        },
        "users": async () => {

        },
        "write": async () => {

        }
    }

    static getCurrentPage() {
        for (const pageName of this.#PAGES) {
            if (document.getElementById("page-" + pageName) !== null) {
                return pageName;
            }
        }
        return null;
    }

    static load() {
        const pageName = this.getCurrentPage();
        console.debug("Pages.load() called, pageName = " + pageName);
        if (pageName !== null) {
            this.#rerouteBasedOnLoginStatus();
            this.#pageHandlers[pageName]();
        }
    }

    static #rerouteBasedOnLoginStatus() { // move to main.js?
        const auth = new AuthManager();
        const currentPage = this.getCurrentPage();
        if (auth.isLoggedIn() && ["index", "login", "register"].includes(currentPage)) {
            window.location.replace("/inbox.html");
        }
        if (!auth.isLoggedIn() && !["index", "login", "register"].includes(currentPage)) {
            window.location.replace("/");
        }
    }
}