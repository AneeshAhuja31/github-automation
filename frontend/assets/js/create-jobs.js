let currentStep = 1;
let selectedIssue = null;
let selectedFiles = [];
let branches = [];
let selectedBranch = null;
let repoName = "";
let repoData = null;
let issues = [];
let files = [];
let commands = [];
let envVars = [];
let installCommand = null;

document.addEventListener("DOMContentLoaded", async function () {
    const urlParams = new URLSearchParams(window.location.search);
    repoName = urlParams.get("r");

    if (!repoName) {
        showError("Repository name is required in URL parameters");
        return;
    }

    try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            throw new Error("User not found in localStorage");
        }

        const owner = JSON.parse(userStr)["username"];
        const res = await fetch(
            `http://localhost:8000/githubapp/check-repo/${owner}/${repoName}`,
            {
                method: "GET",
            }
        );

        if (res.status === 200) {
            console.log("app installed")
        } else if (res.status === 401) {
            showErrorPage();
            return;
        } else {
            showError("Failed to verify repository status.");
            return;
        }
    } catch (err) {
        console.error("Error confirming if app installed on repo:", err);
        showError("An error occurred while checking repository status.");
    }

    loadRepositoryInfo();
    setupEventListeners();
});

function setupEventListeners() {
    // Issue source radio buttons
    document.querySelectorAll('input[name="issueSource"]').forEach((radio) => {
        radio.addEventListener("change", function () {
            const existingIssues = document.getElementById("existingIssues");
            const manualIssue = document.getElementById("manualIssue");
            const step1Next = document.getElementById("step1Next");

            if (this.value === "existing") {
                existingIssues.style.display = "block";
                manualIssue.style.display = "none";
                step1Next.disabled = !selectedIssue;
            } else {
                existingIssues.style.display = "none";
                manualIssue.style.display = "block";
                validateManualIssue();
            }
        });
    });

    // Manual issue inputs
    document
        .getElementById("issueTitle")
        .addEventListener("input", validateManualIssue);
    document
        .getElementById("issueBody")
        .addEventListener("input", validateManualIssue);

    // Search functionality
    document
        .getElementById("issueSearch")
        .addEventListener("input", function () {
            filterIssues(this.value);
        });

    document
        .getElementById("fileSearch")
        .addEventListener("input", function () {
            filterFiles(this.value);
        });
}

async function loadRepositoryInfo() {
    try {
        // Simulate API call to get repository info
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock repository data
        repoData = {
            name: repoName,
            full_name: `user/${repoName}`,
            description: `A sample repository for ${repoName}`,
        };

        document.getElementById("repoName").textContent = repoData.name;
        document.getElementById("repoDescription").textContent =
            repoData.description;

        await loadIssues();
    } catch (error) {
        showError("Failed to load repository information");
    }
}

async function loadIssues() {
    try {
        const res = await fetch(`http://localhost:8000/user/get-issues/${repoName}`,{
            method:'GET',
            credentials:'include'
        })
        if(res.status == 200){
            issues = await res.json()
        }

        displayIssues(issues);
    } catch (error) {
        showError("Failed to load issues");
    }
}

function displayIssues(issuesToShow) {
    const issuesList = document.getElementById("issuesList");

    if (!issuesToShow || issuesToShow.length === 0) {
        issuesList.innerHTML = '<div class="loading">No issues found</div>';
        return;
    }

    issuesList.innerHTML = issuesToShow
        .map(
            (issue) => `
                <div class="issue-item" data-issue-id="${issue.id}" onclick="selectIssue(${issue.id})">
                    <input type="checkbox" class="issue-checkbox" ${
                        selectedIssue && selectedIssue.id === issue.id ? "checked" : ""
                    }>
                    <div class="issue-content">
                        <div class="issue-title">${issue.title}</div>
                        <div class="issue-number">#${issue.number}</div>
                        <div class="issue-body">${issue.body || "No description provided."}</div>
                        ${
                            issue.labels && issue.labels.length > 0
                                ? `
                            <div class="issue-labels">
                                ${issue.labels
                                    .map(
                                        (label) => `
                                    <span class="issue-label" style="background-color: #${label.color}22; color: #${label.color};">
                                        ${label.name}
                                    </span>
                                `
                                    )
                                    .join("")}
                            </div>
                        `
                                : ""
                        }
                    </div>
                </div>
            `
        )
        .join("");
}

function selectIssue(issueId) {
    selectedIssue = issues.find((issue) => issue.id === issueId);
    //console.log(selectIssue)
    // Update UI
    document.querySelectorAll(".issue-item").forEach((item) => {
        const checkbox = item.querySelector(".issue-checkbox");
        if (parseInt(item.dataset.issueId) === issueId) {
            item.classList.add("selected");
            checkbox.checked = true;
        } else {
            item.classList.remove("selected");
            checkbox.checked = false;
        }
    });

    document.getElementById("step1Next").disabled = false;
}

function validateManualIssue() {
    const title = document.getElementById("issueTitle").value.trim();
    const body = document.getElementById("issueBody").value.trim();
    const step1Next = document.getElementById("step1Next");

    if (title && body) {
        selectedIssue = { title, body, manual: true };
        step1Next.disabled = false;
    } else {
        selectedIssue = null;
        step1Next.disabled = true;
    }
}

function filterIssues(searchTerm) {
    const filteredIssues = issues.filter(
        (issue) =>
            issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.body.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayIssues(filteredIssues);
}
async function loadBranches() {
    try {
        const res = await fetch(`http://localhost:8000/user/get-branches/${repoName}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (res.status === 200) {
            branches = await res.json();
        }
        
        displayBranches(branches);
    } catch (error) {
        showError("Failed to load branches");
    }
}

function displayBranches(branchesToShow) {
    const branchList = document.getElementById("branchList");

    if (!branchesToShow || branchesToShow.length === 0) {
        branchList.innerHTML = '<div class="loading">No branches found</div>';
        return;
    }

    branchList.innerHTML = branchesToShow
        .map(
            (branch) => `
                <div class="issue-item" data-branch-name="${branch.name}" onclick="selectBranch('${branch.name}')">
                    <input type="radio" name="branch" class="branch-radio" ${
                        selectedBranch === branch.name ? "checked" : ""
                    }>
                    <div class="issue-content">
                        <div class="issue-title">${branch.name}</div>
                    </div>
                </div>
            `
        )
        .join("");
}

function selectBranch(branchName) {
    selectedBranch = branchName;

    // Update UI
    document.querySelectorAll(".issue-item").forEach((item) => {
        const radio = item.querySelector(".branch-radio");
        if (radio) { // Ensure the radio element exists
            if (item.dataset.branchName === branchName) {
                item.classList.add("selected");
                radio.checked = true;
            } else {
                item.classList.remove("selected");
                radio.checked = false;
            }
        }
    });

    // Enable the "Next" button for Step 2
    const step3Next = document.getElementById("step3Next");
    if (step3Next) {
        step3Next.disabled = false;
    }
}

async function loadFiles() {
    try {
        if(selectBranch === null) return;
        const res = await fetch(`http://localhost:8000/user/get-files/${selectedBranch}/${repoName}`,{
            method:'GET',
            credentials:'include'
        })
        if(res.status === 200){
            const filesJSON = await res.json()
            const tree = filesJSON.tree
        
            files = []
            for (const file of tree){
                if(file.type === "blob"){
                    files.push({
                        path:file.path,
                        type:"file",
                        size:file.size || 0
                    })
                }
            }

            displayFiles(files);
        } else {
            showError("Failed to load repository files")
        }
    } catch (error) {
        showError("Failed to load repository files");
    }
}

function displayFiles(filesToShow) {
    const fileTree = document.getElementById("fileTree");

    if (filesToShow.length === 0) {
        fileTree.innerHTML = '<div class="loading">No files found</div>';
        return;
    }

    fileTree.innerHTML = filesToShow
        .map(
            (file) => `
                <div class="file-item" data-file-path="${file.path}">
                    <input type="checkbox" class="file-checkbox" 
                           ${selectedFiles.includes(file.path) ? "checked" : ""}
                           onchange="toggleFile('${file.path}')">
                    <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${getFileIcon(file.path)}
                    </svg>
                    <span class="file-name">${file.path}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            `
        )
        .join("");
}

function getFileIcon(filename) {
    const ext = filename.split(".").pop().toLowerCase();

    switch (ext) {
        case "js":
        case "jsx":
            return '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="m8 21 2-2 2 2 2-2 2 2"/>';
        case "css":
            return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>';
        case "json":
            return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><path d="M16 13a4 4 0 0 1-8 0"/>';
        case "md":
            return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/>';
        default:
            return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function toggleFile(filePath) {
    const index = selectedFiles.indexOf(filePath);
    if (index > -1) {
        selectedFiles.splice(index, 1);
    } else {
        selectedFiles.push(filePath);
    }

    updateStep2Button();
}

function updateStep2Button() {
    const step2Next = document.getElementById("step2Next");
    step2Next.disabled = selectedFiles.length === 0;
}

function filterFiles(searchTerm) {
    const filteredFiles = files.filter((file) =>
        file.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    displayFiles(filteredFiles);
}

function addCommand() {
    const container = document.getElementById("commandsContainer");
    const commandCount = container.children.length;
    const newIndex = commandCount + 1;

    const commandGroup = document.createElement("div");
    commandGroup.className = "command-group";
    commandGroup.innerHTML = `
                <div class="command-header">
                    <span class="command-title">Command ${newIndex}</span>
                    <button class="remove-command" onclick="removeCommand(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="form-group">
                    <label class="form-label">Command</label>
                    <input type="text" class="form-input command-input" placeholder="e.g., npm test">
                </div>
                <div class="form-group">
                    <label class="form-label">Description (optional)</label>
                    <input type="text" class="form-input command-description" placeholder="Describe what this command does...">
                </div>
            `;

    container.appendChild(commandGroup);
    updateRemoveButtons();
}

function removeCommand(button) {
    const commandGroup = button.closest(".command-group");
    commandGroup.remove();
    updateCommandTitles();
    updateRemoveButtons();
}

function updateCommandTitles() {
    const commandGroups = document.querySelectorAll(".command-group");
    commandGroups.forEach((group, index) => {
        const title = group.querySelector(".command-title");
        title.textContent = `Command ${index + 1}`;
    });
}

function updateRemoveButtons() {
    const commandGroups = document.querySelectorAll(".command-group");
    const removeButtons = document.querySelectorAll(".remove-command");

    removeButtons.forEach((button) => {
        button.style.display = commandGroups.length > 1 ? "block" : "none";
    });
}
function nextStep() {
    if (currentStep === 1) {
        // Navigate to Step 2: Select Branch
        document.getElementById("step1").style.display = "none";
        document.getElementById("step2").style.display = "block";
        currentStep = 2;
        updateProgressSteps();
        loadBranches(); // Load branches for Step 2
    } else if (currentStep === 2) {
        // Navigate to Step 3: Select Files
        document.getElementById("step2").style.display = "none";
        document.getElementById("step3").style.display = "block";
        currentStep = 3;
        updateProgressSteps();
        loadFiles(); // Load files for Step 3
    } else if (currentStep === 3) {
        // Navigate to Step 4: Run Commands
        document.getElementById("step3").style.display = "none";
        document.getElementById("step4").style.display = "block";
        currentStep = 4;
        updateProgressSteps();
    }
}

function previousStep() {
    if (currentStep === 2) {
        // Navigate back to Step 1: Select Issue
        document.getElementById("step2").style.display = "none";
        document.getElementById("step1").style.display = "block";
        currentStep = 1;
        updateProgressSteps();
    } else if (currentStep === 3) {
        // Navigate back to Step 2: Select Branch
        document.getElementById("step3").style.display = "none";
        document.getElementById("step2").style.display = "block";
        currentStep = 2;
        updateProgressSteps();
    } else if (currentStep === 4) {
        // Navigate back to Step 3: Select Files
        document.getElementById("step4").style.display = "none";
        document.getElementById("step3").style.display = "block";
        currentStep = 3;
        updateProgressSteps();
    }
}


function updateProgressSteps() {
    document.querySelectorAll(".progress-step").forEach((step) => {
        const stepNumber = parseInt(step.dataset.step);
        const indicator = step.querySelector(".step-indicator");

        step.classList.remove("active", "completed");

        if (stepNumber < currentStep) {
            step.classList.add("completed");
            indicator.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                    `;
        } else if (stepNumber === currentStep) {
            step.classList.add("active");
            indicator.textContent = stepNumber;
        } else {
            indicator.textContent = stepNumber;
        }
    });
}

function collectCommands() {
    const commandGroups = document.querySelectorAll(".command-group");
    commands = [];

    commandGroups.forEach((group) => {
        const commandInput = group.querySelector(".command-input").value.trim();
        const descriptionInput = group
            .querySelector(".command-description")
            .value.trim();

        if (commandInput) {
            commands.push({
                command: commandInput,
                description: descriptionInput || "",
            });
        }
    });
}

async function createJob() {
    const createBtn = document.getElementById("createJobBtn");
    createBtn.disabled = true;
    createBtn.innerHTML = `
                <div class="spinner"></div>
                Creating Job...
            `;

    try {
        collectEnvVars();
        collectInstallCommand();
        collectCommands();

        const jobData = {
            repo_name: repoName,
            issue: selectedIssue,
            branch: selectedBranch,
            files: selectedFiles,
            envVars: envVars,
            installCommand: installCommand,
            commands: commands,
        };
        try{
            const response = await fetch("http://localhost:8000/job/index-repository",{
                method:'POST',
                credentials:'include',
                body:JSON.stringify(jobData)
            })
        } catch(error){
            console.log(`Error indexing repo ${error}`)
        }
        console.log("Job created:", jobData);

        // Redirect to jobs page with success message
        window.location.href = `jobs.html?success=Job created successfully for ${repoName}`;
    } catch (error) {
        createBtn.disabled = false;
        createBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Create Job
                `;
        showError("Failed to create job. Please try again.");
    }
}

function showErrorPage() {
    const mainContent = document.getElementById("mainContent");
    const errorPage = document.getElementById("errorPage");

    if (mainContent && errorPage) {
        mainContent.style.display = "none"; 
        errorPage.style.display = "flex"; 
    } else {
        console.error("Error: Missing mainContent or errorPage element.");
    }
}

function showError(message) {
    const errorContainer = document.getElementById("errorContainer");
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = "block";
    } else {
        alert(message); 
    }
}

function addEnvVar() {
    const container = document.getElementById("envVarsContainer");
    const envVarCount = container.children.length;
    const newIndex = envVarCount + 1;

    const envVarGroup = document.createElement("div");
    envVarGroup.className = "env-var-group";
    envVarGroup.innerHTML = `
        <div class="env-var-header">
            <span class="env-var-title">Environment Variable ${newIndex}</span>
            <button class="remove-env-var" onclick="removeEnvVar(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
            </button>
        </div>
        <div class="env-var-inputs">
            <div class="form-group">
                <label class="form-label">Variable Name</label>
                <input type="text" class="form-input env-var-key" placeholder="e.g., NODE_ENV, API_KEY">
            </div>
            <div class="form-group">
                <label class="form-label">Variable Value</label>
                <input type="text" class="form-input env-var-value" placeholder="Enter the value...">
            </div>
        </div>
    `;

    container.appendChild(envVarGroup);
    updateRemoveEnvVarButtons();
}

function removeEnvVar(button) {
    const envVarGroup = button.closest(".env-var-group");
    envVarGroup.remove();
    updateEnvVarTitles();
    updateRemoveEnvVarButtons();
}

function updateEnvVarTitles() {
    const envVarGroups = document.querySelectorAll(".env-var-group");
    envVarGroups.forEach((group, index) => {
        const title = group.querySelector(".env-var-title");
        title.textContent = `Environment Variable ${index + 1}`;
    });
}

function updateRemoveEnvVarButtons() {
    const envVarGroups = document.querySelectorAll(".env-var-group");
    const removeButtons = document.querySelectorAll(".remove-env-var");

    removeButtons.forEach((button) => {
        button.style.display = envVarGroups.length > 0 ? "block" : "none";
    });
}

// ...existing code...

function collectEnvVars() {
    const envVarGroups = document.querySelectorAll(".env-var-group");
    envVars = [];

    envVarGroups.forEach((group) => {
        const keyInput = group.querySelector(".env-var-key").value.trim();
        const valueInput = group.querySelector(".env-var-value").value.trim();

        if (keyInput && valueInput) {
            envVars.push({
                key: keyInput,
                value: valueInput,
            });
        }
    });
}

function collectInstallCommand() {
    const commandInput = document.getElementById("installCommand").value.trim();
    const descriptionInput = document.getElementById("installDescription").value.trim();

    if (commandInput) {
        installCommand = {
            command: commandInput,
            description: descriptionInput || "",
        };
    } else {
        installCommand = null;
    }
}
