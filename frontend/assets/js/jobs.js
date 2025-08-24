class AIJobsManager {
    constructor() {
        this.selectedRepo = null;
        this.jobs = [
            {
                id: 1,
                title: "Add Authentication System",
                description:
                    "Implement JWT-based authentication with login, register, and password reset functionality",
                repo: "my-web-app",
                owner: "johnsmith",
                status: "completed",
                createdAt: "2024-08-20T10:30:00Z",
                duration: "45 min",
            },
            {
                id: 2,
                title: "Optimize Database Queries",
                description:
                    "Review and optimize slow database queries in the user management module",
                repo: "api-server",
                owner: "johnsmith",
                status: "running",
                createdAt: "2024-08-24T09:15:00Z",
                duration: "15 min",
            },
            {
                id: 3,
                title: "Add Unit Tests",
                description:
                    "Create comprehensive unit tests for the payment processing service",
                repo: "payment-service",
                owner: "johnsmith",
                status: "completed",
                createdAt: "2024-08-23T14:20:00Z",
                duration: "1h 20min",
            },
            {
                id: 4,
                title: "Fix Mobile Responsiveness",
                description:
                    "Improve mobile layout and fix responsive design issues on the dashboard",
                repo: "dashboard-ui",
                owner: "johnsmith",
                status: "failed",
                createdAt: "2024-08-22T16:45:00Z",
                duration: "30 min",
            },
            {
                id: 5,
                title: "Implement Dark Mode",
                description:
                    "Add dark mode theme support with user preference persistence",
                repo: "my-web-app",
                owner: "johnsmith",
                status: "running",
                createdAt: "2024-08-24T11:00:00Z",
                duration: "25 min",
            },
            {
                id: 6,
                title: "API Documentation",
                description:
                    "Generate comprehensive API documentation using OpenAPI/Swagger",
                repo: "api-server",
                owner: "johnsmith",
                status: "completed",
                createdAt: "2024-08-21T13:30:00Z",
                duration: "55 min",
            },
        ];

        this.repositories = [
            { name: "my-web-app", owner: "johnsmith", language: "React" },
            { name: "api-server", owner: "johnsmith", language: "Node.js" },
            { name: "payment-service", owner: "johnsmith", language: "Python" },
            { name: "dashboard-ui", owner: "johnsmith", language: "Vue.js" },
            {
                name: "mobile-app",
                owner: "johnsmith",
                language: "React Native",
            },
            { name: "data-processor", owner: "johnsmith", language: "Python" },
            { name: "auth-microservice", owner: "johnsmith", language: "Go" },
            {
                name: "frontend-components",
                owner: "johnsmith",
                language: "TypeScript",
            },
        ];

        this.initializeElements();
        this.attachEventListeners();
        this.renderJobs();
        this.loadRepositories();
    }

    initializeElements() {
        this.elements = {
            createJobBtn: document.getElementById("createJobBtn"),
            rightSidebar: document.getElementById("rightSidebar"),
            closeSidebar: document.getElementById("closeSidebar"),
            overlay: document.getElementById("overlay"),
            jobGrid: document.getElementById("jobGrid"),
            repoList: document.getElementById("repoList"),
            createJobForm: document.getElementById("createJobForm"),
            submitJob: document.getElementById("submitJob"),
            jobTitle: document.getElementById("jobTitle"),
            jobDescription: document.getElementById("jobDescription"),
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
        this.elements.createJobForm.addEventListener("submit", (e) =>
            this.handleSubmit(e)
        );

        // Form validation
        this.elements.jobTitle.addEventListener("input", () =>
            this.validateForm()
        );
        this.elements.jobDescription.addEventListener("input", () =>
            this.validateForm()
        );
    }

    openSidebar() {
        this.elements.rightSidebar.classList.add("open");
        this.elements.overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    closeSidebar() {
        this.elements.rightSidebar.classList.remove("open");
        this.elements.overlay.classList.remove("active");
        document.body.style.overflow = "auto";
        this.resetForm();
    }

    resetForm() {
        this.elements.createJobForm.reset();
        this.selectedRepo = null;
        this.updateRepoSelection();
        this.validateForm();
    }

    loadRepositories() {
        this.elements.repoList.innerHTML = "";

        this.repositories.forEach((repo) => {
            const repoItem = document.createElement("div");
            repoItem.className = "repo-item";
            repoItem.innerHTML = `
                        <div>
                            <div class="repo-name">${repo.name}</div>
                            <div class="repo-owner">${repo.owner}</div>
                        </div>
                        <div class="repo-lang">${repo.language}</div>
                    `;

            repoItem.addEventListener("click", () =>
                this.selectRepo(repo, repoItem)
            );
            this.elements.repoList.appendChild(repoItem);
        });
    }

    selectRepo(repo, element) {
        // Remove selection from other items
        this.elements.repoList
            .querySelectorAll(".repo-item")
            .forEach((item) => {
                item.classList.remove("selected");
            });

        // Select current item
        element.classList.add("selected");
        this.selectedRepo = repo;
        this.validateForm();
    }

    updateRepoSelection() {
        this.elements.repoList
            .querySelectorAll(".repo-item")
            .forEach((item) => {
                item.classList.remove("selected");
            });
    }

    validateForm() {
        const title = this.elements.jobTitle.value.trim();
        const description = this.elements.jobDescription.value.trim();
        const hasRepo = this.selectedRepo !== null;

        const isValid = title && description && hasRepo;
        this.elements.submitJob.disabled = !isValid;
    }

    handleSubmit(e) {
        e.preventDefault();

        const newJob = {
            id: this.jobs.length + 1,
            title: this.elements.jobTitle.value,
            description: this.elements.jobDescription.value,
            repo: this.selectedRepo.name,
            owner: this.selectedRepo.owner,
            status: "pending",
            createdAt: new Date().toISOString(),
            duration: "0 min",
        };

        this.jobs.unshift(newJob);
        this.renderJobs();
        this.closeSidebar();

        // Simulate job starting
        setTimeout(() => {
            newJob.status = "running";
            this.renderJobs();
        }, 1000);
    }

    renderJobs() {
        this.elements.jobGrid.innerHTML = "";

        this.jobs.forEach((job) => {
            const jobCard = this.createJobCard(job);
            this.elements.jobGrid.appendChild(jobCard);
        });
    }

    createJobCard(job) {
        const card = document.createElement("div");
        card.className = "job-card";

        const timeAgo = this.getTimeAgo(job.createdAt);

        card.innerHTML = `
                    <div class="job-header">
                        <div>
                            <div class="job-title">${job.title}</div>
                            <div class="job-repo">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                                ${job.owner}/${job.repo}
                            </div>
                        </div>
                        <div class="job-status status-${job.status}">
                            ${
                                job.status.charAt(0).toUpperCase() +
                                job.status.slice(1)
                            }
                        </div>
                    </div>
                    
                    <div class="job-description">
                        ${job.description}
                    </div>
                    
                    <div class="job-meta">
                        <div class="job-date">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            ${timeAgo}
                        </div>
                        <div class="job-duration">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6v6l4 2"/>
                            </svg>
                            ${job.duration}
                        </div>
                    </div>
                `;

        return card;
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

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
}

// Initialize the AI Jobs Manager
document.addEventListener("DOMContentLoaded", () => {
    new AIJobsManager();
});
