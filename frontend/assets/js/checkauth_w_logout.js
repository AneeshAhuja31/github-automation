document.addEventListener("DOMContentLoaded", async function () {
    try {
        const res = await fetch("http://localhost:8000/auth/me", {
            method: "GET",
            credentials: "include",
        });
        if (res.status == 401) {
            window.location.href = "http://localhost:3000/login.html";
            return;
        }
        const user = await res.json();
        localStorage.setItem("user", JSON.stringify(user));
    } catch (err) {
        console.error("Error fetching /auth/me endpoint", err);
        window.location.href = "http://localhost:3000/login.html";
        return;
    }

    const logoutButton = document.querySelector("#logout");
    if (logoutButton) {
        logoutButton.addEventListener("click", async function (e) {
            e.preventDefault();
            try {
                const userStr = localStorage.getItem("user");
                if (!userStr) return;
                const user = JSON.parse(userStr);
                if (!user.name || !user.username) return;
                const res = await fetch("http://localhost:8000/auth/logout", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: user.username,
                        name: user.name,
                    }),
                });
                if (res.ok) {
                    localStorage.removeItem("user");
                    window.location.href = "http://localhost:3000/login.html";
                } else {
                    console.error("Logout Failed");
                }
            } catch (err) {
                console.error("Error during logout", err);
            }
        });
    }
});
