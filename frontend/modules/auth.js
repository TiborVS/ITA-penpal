export class AuthManager {

    #token = null;
    #userId = null;
    #username = null;
    #loggedIn = false;

    constructor() {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const username = localStorage.getItem("username");
        if (!token || !userId || !username) {
            console.log("AuthManager constructor: token or userId or username are falsy, user is not logged in.");
        }
        else {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.loggedIn = true;
        }
    }

    login(token, userId, username) {
        if (!token || !userId || !username) {
            console.warn("AuthManager login: token or userId or username are falsy, user is not logged in.");
            return false;
        }
        this.token = token;
        this.userId = userId;
        this.username = username;
        localStorage.setItem("token", this.token);
        localStorage.setItem("userId", this.userId);
        localStorage.setItem("username", this.username);
        this.loggedIn = true;
        return true;
    }

    logout() {
        this.token = null;
        this.userId = null;
        this.username = null;
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        this.loggedIn = false;
    }

    isLoggedIn() {
        return this.loggedIn;
    }

    getToken() {
        return this.token;
    }

    getUserId() {
        return this.userId;
    }

    getUsername() {
        return this.username;
    }

    getUser() {
        return {
            token: this.token,
            userId: this.userId,
            username: this.username
        };
    }
} 