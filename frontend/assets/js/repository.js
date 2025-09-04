class RepositoryManager {
    constructor() {
        this.currentPage = 1;
        this.perPage = 30;
        this.totalRepos = 0;
        this.repositories = [];
        this.filteredRepos = [];
        this.isLoading = false;

        this.initializeElements();
        this.attachEventListeners();
        this.loadRepositories();
        this.checkGitHubAppStatus();
    }

    initializeElements() {
        this.elements = {
            loading: document.getElementById("loading"),
            repoGrid: document.getElementById("repoGrid"),
            pagination: document.getElementById("pagination"),
            prevBtn: document.getElementById("prevBtn"),
            nextBtn: document.getElementById("nextBtn"),
            pageInfo: document.getElementById("pageInfo"),
            searchInput: document.querySelector(".search-input"),
            totalRepos: document.getElementById("totalRepos"),
            publicRepos: document.getElementById("publicRepos"),
            privateRepos: document.getElementById("privateRepos"),
        };
    }

    attachEventListeners() {
        this.elements.prevBtn.addEventListener("click", () =>
            this.goToPreviousPage()
        );
        this.elements.nextBtn.addEventListener("click", () =>
            this.goToNextPage()
        );
        this.elements.searchInput.addEventListener("input", (e) =>
            this.handleSearch(e.target.value)
        );
    }

    async loadRepositories() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch("http://localhost:8000/user/repos", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const repos = await response.json();

            this.repositories = repos.map((repo) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                app_access: repo.app_access,
                language: {
                    name: repo.language || "Unknown",
                    color: this.getLanguageColor(repo.language),
                },
                stargazers_count: repo.stargazers_count,
                forks_count: repo.forks_count,
                open_issues_count: repo.open_issues_count,
                updated_at: repo.updated_at,
                html_url: repo.html_url,
                owner: {
                    login: repo.owner.login,
                    avatar_url: repo.owner.avatar_url,
                },
            }));

            this.filteredRepos = [...this.repositories];
            this.totalRepos = this.repositories.length;

            this.updateStats();
            this.renderRepositories();
            this.updatePagination();
        } catch (error) {
            console.error("Error loading repositories:", error);
            this.showError("Failed to load repositories");
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();

        if (searchTerm === "") {
            this.filteredRepos = [...this.repositories];
        } else {
            this.filteredRepos = this.repositories.filter(
                (repo) =>
                    repo.name.toLowerCase().includes(searchTerm) ||
                    (repo.description &&
                        repo.description.toLowerCase().includes(searchTerm)) ||
                    (repo.language.name &&
                        repo.language.name.toLowerCase().includes(searchTerm))
            );
        }

        this.currentPage = 1;
        this.updateStats();
        this.renderRepositories();
        this.updatePagination();
    }

    updateStats() {
        const publicCount = this.filteredRepos.filter(
            (repo) => !repo.private
        ).length;
        const privateCount = this.filteredRepos.filter(
            (repo) => repo.private
        ).length;

        this.elements.totalRepos.textContent = this.filteredRepos.length;
        this.elements.publicRepos.textContent = publicCount;
        this.elements.privateRepos.textContent = privateCount;
    }

    renderRepositories() {
        const startIndex = (this.currentPage - 1) * this.perPage;
        const endIndex = startIndex + this.perPage;
        const reposToShow = this.filteredRepos.slice(startIndex, endIndex);

        this.elements.repoGrid.innerHTML = "";

        reposToShow.forEach((repo) => {
            const repoCard = this.createRepositoryCard(repo);
            this.elements.repoGrid.appendChild(repoCard);
        });
    }

    checkGitHubAppStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const githubAppInstalled = urlParams.get("githubapp_installed");
        const installationId = urlParams.get("installation_id");

        if (githubAppInstalled === "true" && installationId) {
            this.showSuccessMessage("GitHub App installed successfully!");
            // Clean URL
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }

    createRepositoryCard(repo) {
        const card = document.createElement("div");
        card.className = `repo-card ${!repo.app_access ? "disabled" : ""}`;

        const timeAgo = this.getTimeAgo(repo.updated_at);

        card.innerHTML = `
        <div class="repo-header">
            <div>
                <div class="repo-name">${repo.name}</div>
                <div class="repo-owner">${repo.owner.login}</div>
            </div>
            <div class="repo-actions">
                <div class="repo-visibility ${
                    repo.private ? "visibility-private" : "visibility-public"
                }">
                    ${repo.private ? "Private" : "Public"}
                </div>
                ${
                    !repo.app_access
                        ? `
                    <button class="install-app-btn" onclick="event.stopPropagation(); repositoryManager.installGitHubApp('${repo.owner.login}', '${repo.name}')">
                        Install App
                    </button>
                `
                        : ""
                }
            </div>
        </div>
        
        <div class="repo-description">
            ${repo.description || "No description available"}
        </div>
        
        <div class="repo-language">
            <div class="language-dot" style="background-color: ${
                repo.language.color
            }"></div>
            <span class="language-name">${repo.language.name}</span>
        </div>
        
        <div class="repo-stats-row">
            <div class="stat">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ${repo.stargazers_count}
            </div>
            <div class="stat">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
                    <circle cx="6" cy="6" r="3" stroke="currentColor" stroke-width="2"/>
                    <circle cx="18" cy="6" r="3" stroke="currentColor" stroke-width="2"/>
                    <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 12v3" stroke="currentColor" stroke-width="2"/>
                </svg>
                ${repo.forks_count}
            </div>
            <div class="stat">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
                </svg>
                ${repo.open_issues_count}
            </div>
        </div>
        
        <div class="repo-updated">
            Updated ${timeAgo}
        </div>
    `;

        // Make card clickable only if app has access
        if (repo.app_access) {
            card.addEventListener("click", (e) => {
                if (!e.target.classList.contains("install-app-btn")) {
                    window.open(repo.html_url, "_blank");
                }
            });
            card.style.cursor = "pointer";
        } else {
            card.style.cursor = "not-allowed";
        }

        return card;
    }

    async installGitHubApp(repoOwner, repoName) {
        try {
            const response = await fetch(
                `http://localhost:8000/githubapp/install/${repoOwner}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error("Failed to get install URL");
            }

            const data = await response.json();

            // Open GitHub App installation page
            window.open(data.install_url, "_blank");
        } catch (error) {
            console.error("Error installing GitHub App:", error);
            this.showError("Failed to install GitHub App");
        }
    }
    showSuccessMessage(message) {
        // Create success notification
        const notification = document.createElement("div");
        notification.className = "notification success";
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const updatedDate = new Date(dateString);
        const diffInSeconds = Math.floor((now - updatedDate) / 1000);

        if (diffInSeconds < 60) return "just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000)
            return `${Math.floor(diffInSeconds / 86400)} days ago`;
        if (diffInSeconds < 31536000)
            return `${Math.floor(diffInSeconds / 2592000)} months ago`;
        return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    }

    getLanguageColor(language) {
        const languageColors = {
            JavaScript: "#f1e05a",
            TypeScript: "#2b7489",
            Python: "#3572A5",
            Java: "#b07219",
            HTML: "#e34c26",
            CSS: "#563d7c",
            PHP: "#4F5D95",
            Ruby: "#701516",
            Go: "#00ADD8",
            Rust: "#dea584",
            "C++": "#f34b7d",
            "C#": "#239120",
            Swift: "#ffac45",
            Kotlin: "#7F52FF",
            Dart: "#00B4AB",
        };

        return languageColors[language] || "#6B7280";
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredRepos.length / this.perPage);

        this.elements.prevBtn.disabled = this.currentPage === 1;
        this.elements.nextBtn.disabled =
            this.currentPage === totalPages || totalPages === 0;

        if (totalPages === 0) {
            this.elements.pageInfo.textContent = "No repositories found";
        } else {
            this.elements.pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }

        this.elements.pagination.style.display =
            totalPages <= 1 ? "none" : "flex";
    }

    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderRepositories();
            this.updatePagination();
            this.scrollToTop();
        }
    }

    goToNextPage() {
        const totalPages = Math.ceil(this.filteredRepos.length / this.perPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderRepositories();
            this.updatePagination();
            this.scrollToTop();
        }
    }

    scrollToTop() {
        document
            .querySelector(".main")
            .scrollTo({ top: 0, behavior: "smooth" });
    }

    showLoading() {
        this.elements.loading.style.display = "flex";
        this.elements.repoGrid.style.display = "none";
        this.elements.pagination.style.display = "none";
    }

    hideLoading() {
        this.elements.loading.style.display = "none";
        this.elements.repoGrid.style.display = "grid";
        this.elements.pagination.style.display = "flex";
    }

    showError(message) {
        this.elements.repoGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px;">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <h3 style="margin-bottom: 8px; color: var(--text-primary);">${message}</h3>
                        <p>Please try again later or contact support if the problem persists.</p>
                    </div>
                `;
    }
}

let repositoryManager;
document.addEventListener("DOMContentLoaded", () => {
    repositoryManager = new RepositoryManager();
});
