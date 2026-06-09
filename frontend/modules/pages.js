import { AuthManager } from "./auth.js";
import { Forms } from "./forms.js";
import { API } from "./api.js";

export class Pages {

    static #PAGES = ["friends", "index", "inbox", "letter", "login", "register", "user", "users", "write"];

    static #pageHandlers = {
        "friends": async () => {
            const auth = new AuthManager();
            const friends = await API.getFriends(auth.getToken());
            let usersTable = document.getElementById("friends-table-body");
            for (const user of friends) {
                let usernameTableData = document.createElement("td");
                let usernameLink = document.createElement("a");
                usernameLink.innerText = user.username;
                usernameLink.href = "/user.html?id=" + user.id;
                usernameTableData.appendChild(usernameLink);

                let aboutTableData = document.createElement("td");
                aboutTableData.innerText = user.about.substring(0, 50) + (user.about.length > 50 ? "..." : "");

                let userTableRow = document.createElement("tr");
                userTableRow.appendChild(usernameTableData);
                userTableRow.appendChild(aboutTableData);
                
                usersTable.appendChild(userTableRow);
            }
        },
        "index": async () => {

        },
        "inbox": async () => {
            const auth = new AuthManager();
            // if (!auth.isLoggedIn()) return; // should have been redirected in Pages.load() call, but here just in case
            const letters = await API.getReceivedLetters(auth.getToken());
            console.debug(letters);
            for (const letter of letters) {
                const {id, content, date, senderId, senderUsername} = letter;
                let letterElement = document.createElement("a");
                letterElement.href = "letter.html?id=" + id;
                letterElement.innerText = "\"" + content.substring(0, 20).replace(/[\n\r\t]/gm, " ") + "... \" " + "from " + senderUsername + " on " + date;

                const letterListItem = document.createElement("li");
                letterListItem.appendChild(letterElement);

                document.getElementById("list-letters").appendChild(letterListItem); 
            }
        },
        "letter": async () => {
            const auth = new AuthManager();
            const letterId = (new URLSearchParams(window.location.search)).get("id");
            if (letterId === null) window.location.replace("/inbox.html");
            const letter = await API.getLetter(letterId, auth.getToken());
            if (letter === null) {
                console.debug("letter page handler: API.getLetter returned null, redirecting to inbox");
                window.location.replace("/inbox.html");
            }
            console.debug(letter);
            const letterDataDiv = document.getElementById("letter-data");
            let letterInfo = document.createElement("p");
            letterInfo.innerText = "Sent by " + letter.senderUsername + " on " + letter.date;
            letterDataDiv.appendChild(letterInfo);

            letterDataDiv.appendChild(document.createElement("hr"));

            let letterContent = document.createElement("p");
            letterContent.innerText = letter.content;
            letterDataDiv.appendChild(letterContent);
            
            letterDataDiv.appendChild(document.createElement("hr"));
            if (letter.attachment) {
                let letterAttachmentLink = document.createElement("a");
                letterAttachmentLink.href = letter.attachment.url;
                letterAttachmentLink.target = "_blank";
                letterAttachmentLink.innerText = letter.attachment.fileName;
                letterDataDiv.appendChild(letterAttachmentLink);
            }
        },
        "login": async () => {
            Forms.initForm("login");  
        },
        "register": async () => {
            Forms.initForm("register");
        },
        "user": async () => {
            const auth = new AuthManager();
            const userId = (new URLSearchParams(window.location.search)).get("id");
            const user = await API.getUser(userId ?? auth.getUserId());
            console.debug(user);
            document.getElementById("user-username").innerText = user.username;
            document.getElementById("user-about").innerText = user.about;
            document.getElementById("user-latitude").innerText = user.location.latitude;
            document.getElementById("user-longitude").innerText = user.location.longitude;

            if (userId === null || userId === auth.getUserId()) {
                // user's own page, show their editing form
                document.getElementById("user-edit-form").hidden = false;
                Forms.initForm("update-user");
            }
            else {
                // another user's page, show friend status
                let friendStatusDiv = document.getElementById("friend-status");
                const isFriend = await API.checkIfUserHasFriend(auth.getUserId(), userId, auth.getToken());
                //console.debug("user page handler: API.checkIfUserhasFriend returned " + isFriend);
                if (isFriend) {
                    let friendTextElem = document.createElement("p");
                    friendTextElem.innerText = user.username + " is your friend.";
                    friendStatusDiv.appendChild(friendTextElem);

                    let removeFriendButton = document.createElement("button");
                    removeFriendButton.innerText = "Remove friend";
                    removeFriendButton.onclick = async () => {
                        const result = await API.removeFriend(userId, auth.getToken());
                        if (result === true) window.location.reload();
                        else window.alert("Could not remove friend, try again later.");
                    }
                    friendStatusDiv.appendChild(removeFriendButton);
                }
                else {
                    let addFriendButton = document.createElement("button");
                    addFriendButton.innerText = "Add friend";
                    addFriendButton.onclick = async () => {
                        const result = await API.addFriend(userId, auth.getToken());
                        if (result === true) window.location.reload();
                        else window.alert("Could not add friend, try again later.");
                    }
                    friendStatusDiv.appendChild(addFriendButton);
                }
            }
        },
        "users": async () => {
            const users = await API.getUsers();
            let usersTable = document.getElementById("users-table-body");
            for (const user of users) {
                let usernameTableData = document.createElement("td");
                let usernameLink = document.createElement("a");
                usernameLink.innerText = user.username;
                usernameLink.href = "/user.html?id=" + user.id;
                usernameTableData.appendChild(usernameLink);

                let aboutTableData = document.createElement("td");
                aboutTableData.innerText = user.about.substring(0, 50) + (user.about.length > 50 ? "..." : "");

                let userTableRow = document.createElement("tr");
                userTableRow.appendChild(usernameTableData);
                userTableRow.appendChild(aboutTableData);
                
                usersTable.appendChild(userTableRow);
            }
        },
        "write": async () => {
            const auth = new AuthManager();
            const friends = await API.getFriends(auth.getToken());
            if (friends == null || friends.length < 1) {
                window.alert("You have no friends! Add some to be able to send letters.");
                window.location.replace("/users.html");
            }
            const recipientSelectBox = document.getElementById("input-recipient");
            for (const friend of friends) {
                let optionElem = document.createElement("option");
                optionElem.value = friend.id;
                optionElem.innerText = friend.username;
                recipientSelectBox.appendChild(optionElem);
            }
            Forms.initForm("write-letter");
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
        //console.debug("Pages.load() called, pageName = " + pageName);
        if (pageName !== null) {
            this.#rerouteBasedOnLoginStatus();
            let logoutButton = document.getElementById("button-logout");
            if (logoutButton) {
                logoutButton.onclick = () => {
                    const auth = new AuthManager();
                    auth.logout();
                    window.location.replace("/");
                };
            }
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