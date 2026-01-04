const API = "http://127.0.0.1:8000";

const authBox = document.getElementById("authBox");
const notesBox = document.getElementById("notesBox");

/* ================= AUTH ================= */

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showMsg("Email and password required");
        return;
    }

    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await res.json();

    if (res.ok) {
        localStorage.setItem("token", data.access_token);
        showNotes();
    } else {
        showMsg(parseError(data));
    }
}


async function signup() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showMsg("Email and password required");
        return;
    }

    const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        showMsg("Account created. Now login.");
    } else {
        showMsg(parseError(data));
    }
}

/* ================= NOTES ================= */

function authHeader() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
    };
}

async function fetchNotes() {
    const res = await fetch(`${API}/notes`, {
        headers: authHeader()
    });

    if (!res.ok) {
    const err = await res.json();
    showMsg(parseError(err));
    return;
}

    const notes = await res.json();

    const list = document.getElementById("notesList");
    list.innerHTML = "";

    notes.forEach(note => {
        const li = document.createElement("li");
        li.innerHTML = `
            <b>${note.title}</b><br>
            ${note.description || ""}
            <br><br>
            <button onclick="deleteNote(${note.id})">Delete</button>
        `;
        list.appendChild(li);
    });
}

async function addNote() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!title) {
        alert("Title required");
        return;
    }

    await fetch(`${API}/notes`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ title, description })
    });

    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    fetchNotes();
}

async function deleteNote(id) {
    await fetch(`${API}/notes/${id}`, {
        method: "DELETE",
        headers: authHeader()
    });
    fetchNotes();
}

/* ================= UI ================= */

function showNotes() {
    authBox.classList.add("hidden");
    notesBox.classList.remove("hidden");
    fetchNotes();
}

function logout() {
    localStorage.removeItem("token");
    location.reload();
}

/* ================= ERROR HANDLING ================= */

function showMsg(msg) {
    document.getElementById("authMsg").innerText = msg;
}

function parseError(data) {
    // FastAPI 422 / 400 handling
    if (typeof data === "string") return data;

    if (data.detail) {
        if (Array.isArray(data.detail)) {
            return data.detail[0].msg;   // <-- FIXES [object Object]
        }
        return data.detail;
    }

    return "Something went wrong";
}

/* ================= AUTO LOGIN ================= */

if (localStorage.getItem("token")) {
    showNotes();
}
