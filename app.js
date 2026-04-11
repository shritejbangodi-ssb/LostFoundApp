/* ===================================================
   NAVIGATION
=================================================== */

function openLost(){
    localStorage.setItem("uploadType","lost");
    window.location.href = "upload.html";
}

function openFound(){
    localStorage.setItem("uploadType","found");
    window.location.href = "upload.html";
}

function viewLost(){
    window.location.href = "lost.html";
}

function viewFound(){
    window.location.href = "found.html";
}

function goBack(){
    window.history.back();
}

function goHome(){
    window.location.href = "index.html";
}


/* ===================================================
   SUBMIT ITEM
=================================================== */

function submitItem(){

    const name = document.getElementById("itemName").value.trim();
    const desc = document.getElementById("description").value.trim();
    const location = document.getElementById("location").value.trim();
    const contact = document.getElementById("contactInfo").value.trim();
    const imageInput = document.getElementById("imageInput");

    if(!name){
        alert("Please enter item name");
        return;
    }

    if(imageInput.files.length === 0){
        alert("Please upload an image");
        return;
    }

    const type = localStorage.getItem("uploadType");

    if(!type){
        alert("Item type missing. Please go back and select Lost or Found.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e){
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

            const item = {
                name: name,
                desc: desc,
                location: location,
                contact: contact,
                image: dataUrl,
                type: type,
                uploadedBy: localStorage.getItem("loggedInUser") || "Unknown"
            };

            try {
                item.timestamp = firebase.firestore.FieldValue.serverTimestamp();
                window.db.collection("items").add(item).then(docRef => {
                    item.id = docRef.id;
                    localStorage.setItem("lastUploadedItem", JSON.stringify(item));
                    alert("Item Submitted ✅");
                    window.location.href = "matches.html";
                }).catch(error => {
                    console.error("Error adding document: ", error);
                    alert("Database limit Exceeded or Permission Denied.");
                });
            } catch (error) {
                alert("Error saving item: Image might be too large.");
            }
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(imageInput.files[0]);
}

/* ===================================================
   SMART MATCHING
=================================================== */

function findMatches(newItem, itemsList){
    let matches = [];
    itemsList.forEach(item => {
        if(item.type !== newItem.type){
            let score = 0;
            if(item.name.toLowerCase().includes(newItem.name.toLowerCase()) || newItem.name.toLowerCase().includes(item.name.toLowerCase())) score += 50;
            if(item.desc.toLowerCase().includes(newItem.desc.toLowerCase())) score += 30;
            if(item.location && newItem.location && item.location.toLowerCase() === newItem.location.toLowerCase()) score += 20;
            if(score >= 50) matches.push(item);
        }
    });
    return matches;
}

function openChat(targetUsername){
    if (!targetUsername) return;
    const currentUser = localStorage.getItem("loggedInUser") || "User";
    
    // Create unique deterministic ID based on both usernames alphabetically
    const participants = [currentUser, targetUsername].sort();
    const chatId = participants[0] + "_" + participants[1];
    
    localStorage.setItem("chatItem", chatId);
    localStorage.setItem("chatTarget", targetUsername);
    window.location.href = "chat.html";
}

/* ===================================================
   DELETE ITEM
=================================================== */

async function deleteItem(id){
    if(!confirm("Item received? Remove from list?")) return;
    try {
        await window.db.collection("items").doc(id).delete();
        alert("Item marked as returned ✅");
    } catch(e) {
        console.error(e);
        alert("Error deleting item");
    }
}


/* ===================================================
   PROFILE MENU
=================================================== */

function toggleProfile(){

    const menu = document.getElementById("profileMenu");
    if(!menu) return;

    menu.style.display =
        menu.style.display === "block" ? "none" : "block";

    const user = localStorage.getItem("loggedInUser");
    const nameBox = document.getElementById("usernameDisplay");

    if(user && nameBox){
        nameBox.innerText = user;
    }
}

function closeProfile(){
    const menu = document.getElementById("profileMenu");
    if(menu) menu.style.display = "none";
}

document.addEventListener("click", function(e){

    const menu = document.getElementById("profileMenu");
    const icon = document.querySelector(".profileCircle");

    if(!menu || !icon) return;

    if(!menu.contains(e.target) && !icon.contains(e.target)){
        menu.style.display = "none";
    }
});

function logout(){
    if (window.firebase && firebase.auth) {
        firebase.auth().signOut().catch(console.error);
    }
    localStorage.removeItem("loggedInUser");
    sessionStorage.removeItem("welcomeShown");
    window.location.href = "login.html";
}

function openFeedback(){
    alert("Feedback feature coming soon 🚀");
}


/* ===================================================
   CHAT SYSTEM
=================================================== */

window.addEventListener("load", () => {
    if(window.location.pathname.endsWith("chat.html")){
        loadChat();
    }
});

function loadChat(){
    const chatBox = document.getElementById("chatBox");
    const headerTitle = document.querySelector(".chatTitle");
    if(!chatBox) return;

    const chatId = localStorage.getItem("chatItem");
    const currentUser = localStorage.getItem("loggedInUser") || "User";
    const targetUser = localStorage.getItem("chatTarget") || "User";

    if (headerTitle && headerTitle.innerText.includes("Chat")) {
        headerTitle.innerHTML = `💬 Chat with <span style="color:#a855f7">${targetUser}</span>`;
    }

    if(window.unsubChat) window.unsubChat();

    window.unsubChat = window.db.collection("chats").doc(chatId).collection("messages")
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            chatBox.innerHTML = "";
            snapshot.forEach(doc => {
                const msg = doc.data();
                const isMe = (msg.sender === currentUser);
                const messageId = doc.id;

                if (msg.deletedFor && msg.deletedFor.includes(currentUser)) {
                    return;
                }

                const msgContainer = document.createElement("div");
                msgContainer.style.display = "flex";
                msgContainer.style.flexDirection = "column";
                msgContainer.style.alignItems = isMe ? "flex-end" : "flex-start";
                msgContainer.style.marginBottom = "5px";

                // Username & Avatar header
                const header = document.createElement("div");
                header.style.fontSize = "12px";
                header.style.color = "#94a3b8";
                header.style.marginBottom = "4px";
                header.style.display = "flex";
                header.style.alignItems = "center";
                header.style.gap = "6px";
                
                const initial = msg.sender ? msg.sender.charAt(0).toUpperCase() : "?";
                const avatarMe = `<div style="width:20px;height:20px;border-radius:50%;background:#a855f7;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;">${initial}</div>`;
                const avatarOther = `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;">${initial}</div>`;
                
                if (isMe) {
                    header.innerHTML = `You ${avatarMe}`;
                } else {
                    header.innerHTML = `${avatarOther} ${msg.sender}`;
                }

                const div = document.createElement("div");
                div.classList.add("message");

                if(isMe){
                    div.classList.add("myMessage");
                }else{
                    div.classList.add("otherMessage");
                }

                div.innerText = msg.text;
                
                div.addEventListener('touchstart', (e) => startPress(e, messageId, isMe), {passive: true});
                div.addEventListener('touchend', cancelPress);
                div.addEventListener('touchcancel', cancelPress);
                div.addEventListener('mousedown', (e) => startPress(e, messageId, isMe));
                div.addEventListener('mouseup', cancelPress);
                div.addEventListener('mouseleave', cancelPress);

                msgContainer.appendChild(header);
                msgContainer.appendChild(div);

                chatBox.appendChild(msgContainer);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        });
}

async function sendMessage(){
    const input = document.getElementById("messageInput");
    if(!input) return;

    const text = input.value.trim();
    if(text === "") return;

    const chatId = localStorage.getItem("chatItem");
    const currentUser = localStorage.getItem("loggedInUser") || "User";
    const targetUser = localStorage.getItem("chatTarget") || "User";

    try {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        
        await window.db.collection("chats").doc(chatId).collection("messages").add({
            text: text,
            sender: currentUser,
            timestamp: timestamp
        });
        
        // Push to inbox active threads
        await window.db.collection("inbox").doc(chatId).set({
            participants: [currentUser, targetUser],
            lastMessage: text,
            lastSender: currentUser,
            timestamp: timestamp
        }, { merge: true });

        input.value = "";
    } catch(e) {
        console.error("Chat Error", e);
    }
}

/* ENTER KEY SEND */

function handleEnter(e){
    if(e.key === "Enter"){
        e.preventDefault();
        sendMessage();
    }
}

/* ===================================================
   FUZZY SEARCH UTILITIES
=================================================== */

function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

window.fuzzyIncluded = function(query, text) {
    if (!text) return false;
    query = query.toLowerCase();
    text = text.toLowerCase();
    
    // Direct substring match is usually very fast
    if (text.includes(query)) return true;
    
    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    const textWords = text.split(/\s+/).filter(w => w.length > 0);
    
    // All words in the query must have some match in the text
    return queryWords.every(qWord => {
        return textWords.some(tWord => {
            if (tWord.includes(qWord)) return true; // Direct small match
            const maxDistance = qWord.length <= 4 ? 1 : 2;
            return levenshteinDistance(qWord, tWord) <= maxDistance;
        });
    });
};

/* ===================================================
   CHAT MESSAGE DELETION (LONG PRESS)
=================================================== */

let pressTimer;
let currentMessageId = null;

window.startPress = function(e, id, isMe) {
    if (e.type === 'mousedown' && e.button !== 0) return;
    
    let pressX = 0, pressY = 0;
    if (e.type === 'touchstart') {
        pressX = e.touches[0].clientX;
        pressY = e.touches[0].clientY;
    } else {
        pressX = e.clientX;
        pressY = e.clientY;
    }

    pressTimer = setTimeout(() => {
        openDeleteModal(id, isMe, pressX, pressY);
    }, 600);
};

window.cancelPress = function() {
    clearTimeout(pressTimer);
};

window.openDeleteModal = function(messageId, isMe, x, y) {
    currentMessageId = messageId;
    
    const overlay = document.getElementById("deleteOverlay");
    const popup = document.getElementById("deleteModal");
    
    overlay.style.display = "block";
    popup.style.display = "block";
    
    // Position the popup beside the click
    popup.style.left = Math.min(x, window.innerWidth - 220) + "px";
    popup.style.top = Math.min(y, window.innerHeight - 100) + "px";

    if (isMe) {
        document.getElementById("btnDeleteForEveryone").style.display = "block";
    } else {
        document.getElementById("btnDeleteForEveryone").style.display = "none";
    }
};

window.closeDeleteModal = function() {
    currentMessageId = null;
    document.getElementById("deleteOverlay").style.display = "none";
    document.getElementById("deleteModal").style.display = "none";
};

window.deleteForMe = async function() {
    if (!currentMessageId) return;
    const chatId = localStorage.getItem("chatItem");
    const currentUser = localStorage.getItem("loggedInUser");
    try {
        await window.db.collection("chats").doc(chatId).collection("messages").doc(currentMessageId).update({
            deletedFor: firebase.firestore.FieldValue.arrayUnion(currentUser)
        });
        closeDeleteModal();
    } catch(e) {
        console.error(e);
        alert("Error deleting for me.");
    }
};

window.deleteForEveryone = async function() {
    if (!currentMessageId) return;
    const chatId = localStorage.getItem("chatItem");
    try {
        await window.db.collection("chats").doc(chatId).collection("messages").doc(currentMessageId).delete();
        closeDeleteModal();
    } catch(e) {
        console.error(e);
        alert("Error deleting for everyone.");
    }
};

/* ===================================================
   PWA SERVICE WORKER REGISTRATION
=================================================== */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log("Service Worker registered with scope:", reg.scope);
        }).catch(err => {
            console.error("Service worker registration failed:", err);
        });
    });
}