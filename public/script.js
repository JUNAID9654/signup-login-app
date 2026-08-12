const button = document.getElementById("btn");
const message = document.getElementById("message");
const updateBtn = document.getElementById("updateBtn");
const deleteBtn = document.getElementById("deleteBtn");


// =========================
// SAVE USER
// =========================

button.addEventListener("click", async function () {

    const name = document.getElementById("name").value;

    const response = await authenticatedFetch(
        "/message?name=" + encodeURIComponent(name)
    );

    if (!response.ok) {
        return;
    }

    const data = await response.text();

    message.innerText = data;

    loadLatestUser();
});


// =========================
// LOAD LATEST USER
// =========================

async function loadLatestUser() {

    const response = await authenticatedFetch("/latest-user");

    if (!response.ok) {
        document.getElementById("latestName").innerText =
            "Please login first";
        return;
    }

    const data = await response.json();

    if (data) {
        document.getElementById("latestName").innerText = data.name;
    } else {
        document.getElementById("latestName").innerText = "None";
    }
}


// =========================
// UPDATE USER
// =========================

updateBtn.addEventListener("click", async function () {

    const newName = document.getElementById("updateName").value;

    const response = await authenticatedFetch(
        "/update-user?name=" + encodeURIComponent(newName)
    );

    if (!response.ok) {
        return;
    }

    loadLatestUser();
});

// =========================
// DELETE USER
// =========================

deleteBtn.addEventListener("click", async function () {

    const response = await authenticatedFetch("/delete-user");

    if (!response.ok) {
        return;
    }

    document.getElementById("latestName").innerText = "None";
    document.getElementById("message").innerText =
        "User deleted successfully";
});

// =========================
// REGISTER
// =========================

const registerBtn = document.getElementById("registerBtn");

registerBtn.addEventListener("click", async function () {

    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    const response = await fetch("/register", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        name: name,
        email: email,
        password: password
    })
});

    const data = await response.json();

    if (response.ok) {

        document.getElementById("registerMessage").innerText =
            "Registration successful";

    } else {

        document.getElementById("registerMessage").innerText =
            data.error;

    }

});


// =========================
// LOGIN
// =========================

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async function () {

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const response = await fetch("/login", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        email: email,
        password: password
    })
});
    const data = await response.json();

    if (response.ok) {

        localStorage.setItem("token", data.token);

        document.getElementById("loginMessage").innerText =
            "Login successful";

        loadLatestUser();

    } else {

        document.getElementById("loginMessage").innerText =
            data.error;

    }
});


// =========================
// CHECK LOGIN
// =========================

async function checkLogin() {

    const token = localStorage.getItem("token");

    if (!token) {
        return;
    }

    const response = await fetch("/protected", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (!response.ok) {
        localStorage.removeItem("token");
        return;
    }

    const data = await response.json();

    console.log(data);
}


// =========================
// AUTHENTICATED FETCH
// =========================

async function authenticatedFetch(url, options = {}) {

    const token = localStorage.getItem("token");

    if (!token) {

        document.getElementById("latestName").innerText =
            "Please login first";

        return new Response(null, {
            status: 401
        });
    }

    options.headers = {
        ...options.headers,
        "Authorization": "Bearer " + token
    };

    const response = await fetch(url, options);

    if (response.status === 401 || response.status === 403) {

        localStorage.removeItem("token");

        document.getElementById("latestName").innerText =
            "Please login again";

        document.getElementById("message").innerText =
            "Authentication required";

    }

    return response;
}


// =========================
// LOGOUT
// =========================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", function () {

    localStorage.removeItem("token");

    document.getElementById("logoutMessage").innerText =
        "Logged out successfully";

    document.getElementById("latestName").innerText =
        "Please login first";

    document.getElementById("message").innerText = "";

});


checkLogin();