class AIJobsManager {
    constructor() {
        this.isLoading = false;
        this.repositories = [];

        this.initializeElements();
        this.attachEventListeners();
        this.renderJobs();
    }

    initializeElements() {
        this.elements = {
            createJobBtn: document.getElementById("createJobBtn"),
            rightSidebar: document.getElementById("rightSidebar"),
            closeSidebar: document.getElementById("closeSidebar"),
            overlay: document.getElementById("overlay"),
            repoList: document.getElementById("repoList"),
        };
    }

    attachEventListeners() {
        this.elements.createJobBtn.addEventListener("click", () =>
            this.openSidebar()
        );
        this.elements.closeSidebar.addEventListener("click", () =>
            this.closeSidebar()
        );
        this.elements.overlay.addEventListener("click", () =>
            this.closeSidebar()
        );
    }

    async openSidebar() {
        this.elements.rightSidebar.classList.add("open");
        this.elements.overlay.classList.add("active");
        await this.loadRepositoriesWithApp();
    }

    closeSidebar() {
        this.elements.rightSidebar.classList.remove("open");
        this.elements.overlay.classList.remove("active");
    }

    async loadRepositoriesWithApp() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showRepoLoading();

        try {
            const userString = localStorage.getItem("user");
            const user = JSON.parse(userString);
            console.log(user);
            const username = user.username;
            const response = await fetch(
                `http://localhost:8000/githubapp/get-installed-repos/${username}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.repositories = data.repositories || [];
            this.renderRepositories();
        } catch (error) {
            console.error("Error loading repositories with app access:", error);
            this.showRepoError("Failed to load repositories with app access");
        } finally {
            this.isLoading = false;
        }
    }

    renderRepositories() {
        this.elements.repoList.innerHTML = "";

        if (this.repositories.length === 0) {
            this.elements.repoList.innerHTML = `
                <div class="no-repos">
                    <p>No repositories with GitHub App installed.</p>
                    <p>Install the app on your repositories first.</p>
                </div>
            `;
            return;
        }

        this.repositories.forEach((repo) => {
            const repoItem = document.createElement("div");
            repoItem.className = "repo-item";
            repoItem.innerHTML = `
                <div class="repo-info">
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-full-name">${repo.full_name}</div>
                </div>
                <div class="repo-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                </div>
            `;

            repoItem.addEventListener("click", () => {
                window.open(
                    `create-jobs.html?r=${encodeURIComponent(repo.full_name.split('/')[1])}`,
                    "_blank"
                );
            });

            this.elements.repoList.appendChild(repoItem);
        });
    }

    showRepoLoading() {
        this.elements.repoList.innerHTML = `
            <div class="repo-loading">
                <div class="spinner"></div>
                Loading repositories...
            </div>
        `;
    }

    showRepoError(message) {
        this.elements.repoList.innerHTML = `
            <div class="repo-error">
                <p>${message}</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.aiJobsManager = new AIJobsManager();
});