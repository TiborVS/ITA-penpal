import { API } from "./modules/api.js";
import { AuthManager } from "./modules/auth.js";

const auth = new AuthManager();

document.getElementById("input-submit").addEventListener("click", async (event) => {
    event.preventDefault();
    const username = document.getElementById("input-username").value;
    const email = document.getElementById("input-email").value;
    const password = document.getElementById("input-password").value;
    const latitude = document.getElementById("input-latitude").value;
    const longitude = document.getElementById("input-longitude").value;
    const response = await API.createUser(username, email, password, latitude, longitude);
    console.log(response);
    if (response.error != null) {
        document.getElementById("form-info").innerText = response.error;
    }
    else {
        if (auth.login(response.token, response.userId, response.username)) {
            document.getElementById("form-info").innerText = "You are now logged in.";
        }
        else {
            document.getElementById("form-info").innerText = "Unknown error logging in.";
        }
    }
    
})