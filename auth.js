// SIGNUP
async function signup() {
    const email = document.getElementById("signupEmail").value.trim();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (!email || !username || !password) {
        alert("Please fill all fields.");
        return;
    }
    if (password !== confirm) {
        alert("Passwords do not match");
        return;
    }

    try {
        const userRef = window.db.collection("users").doc(username);
        const doc = await userRef.get();
        if (doc.exists) {
            alert("Username already exists! Please pick another.");
            return;
        }

        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

        await userRef.set({ username: username, email: email, uid: userCredential.user.uid });
        alert("Account created ✅");
        window.location.href = "login.html";
    } catch (e) {
        console.error(e);
        alert(e.message || "Error connecting to server.");
    }
}

// LOGIN
async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) return;

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);

        const userQuery = await window.db.collection("users").where("email", "==", email).get();
        
        let username = email.split('@')[0];
        if (!userQuery.empty) {
            username = userQuery.docs[0].data().username;
        }

        localStorage.setItem("loggedInUser", username);
        window.location.href = "index.html";
    } catch (e) {
        console.error(e);
        alert(e.message || "Invalid login credentials.");
    }
}

function logout() {
    if (window.firebase && firebase.auth) {
        firebase.auth().signOut().catch(console.error);
    }
    localStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("welcomeShown");
    window.location.href = "login.html";
}

window.togglePassword = function (inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === "password") {
        input.type = "text";
        iconElement.innerText = "👀"; 
    } else {
        input.type = "password";
        iconElement.innerText = "👁️";
    }
};