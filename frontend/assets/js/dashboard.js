// Dashboard JavaScript Layer
class Dashboard {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    init() {
        // Initialize dashboard state
        this.sidebarOpen = false;
        this.currentUser = {
            name: 'John Smith',
            role: 'Full Stack Developer',
            avatar: 'JS'
        };
        
        // Mock data for dynamic updates
        this.stats = {
            activeProjects: 12,
            totalCommits: 847,
            openPullRequests: 5,
            aiJobsCompleted: 284
        };

        this.activityData = [];
        this.logData = [];
        
        this.loadInitialData();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
            searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
        }

        // // Sidebar navigation
        // const navItems = document.querySelectorAll('.nav-item');
        // navItems.forEach(item => {
        //     item.addEventListener('click', this.handleNavigation.bind(this));
        // });

        // User menu interaction
        const userMenu = document.querySelector('.user-menu');
        if (userMenu) {
            userMenu.addEventListener('click', this.toggleUserMenu.bind(this));
        }

        // Stat cards hover effects
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('mouseenter', this.handleStatCardHover.bind(this));
            card.addEventListener('mouseleave', this.handleStatCardLeave.bind(this));
        });

        // Activity items interaction
        const activityItems = document.querySelectorAll('.activity-item');
        activityItems.forEach(item => {
            item.addEventListener('click', this.handleActivityClick.bind(this));
        });

        // Repository items interaction
        const repoItems = document.querySelectorAll('.repo-item');
        repoItems.forEach(item => {
            item.addEventListener('click', this.handleRepoClick.bind(this));
        });

        // Mobile sidebar toggle (for responsive design)
        this.createMobileMenuToggle();

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Page visibility API for pausing updates when tab is not active
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    // Search functionality
    handleSearch(event) {
        const query = event.target.value.toLowerCase().trim();
        
        if (query.length === 0) {
            this.clearSearchResults();
            return;
        }

        // Simulate search with debouncing
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    handleSearchKeydown(event) {
        if (event.key === 'Enter') {
            const query = event.target.value.toLowerCase().trim();
            this.performSearch(query);
        } else if (event.key === 'Escape') {
            event.target.value = '';
            this.clearSearchResults();
        }
    }

    performSearch(query) {
        // Mock search results
        const searchResults = [
            { type: 'project', name: 'react-dashboard', description: 'Modern React dashboard' },
            { type: 'repository', name: 'api-backend', description: 'REST API backend' },
            { type: 'file', name: 'dashboard.js', description: 'Main dashboard script' }
        ].filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        );

        this.showSearchResults(searchResults, query);
    }

    showSearchResults(results, query) {
        // Create or update search results dropdown
        let dropdown = document.querySelector('.search-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown';
            dropdown.innerHTML = `
                <div class="search-results">
                    <div class="search-results-header">Search Results</div>
                    <div class="search-results-list"></div>
                </div>
            `;
            document.querySelector('.search-container').appendChild(dropdown);
        }

        const resultsList = dropdown.querySelector('.search-results-list');
        resultsList.innerHTML = results.map(result => `
            <div class="search-result-item" data-type="${result.type}">
                <div class="search-result-name">${this.highlightMatch(result.name, query)}</div>
                <div class="search-result-description">${result.description}</div>
                <div class="search-result-type">${result.type}</div>
            </div>
        `).join('');

        dropdown.style.display = 'block';
        this.addSearchResultsStyles();
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    clearSearchResults() {
        const dropdown = document.querySelector('.search-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    // // Navigation handling
    // handleNavigation(event) {
    //     event.preventDefault();
        
    //     // Remove active class from all nav items
    //     document.querySelectorAll('.nav-item').forEach(item => {
    //         item.classList.remove('active');
    //     });
        
    //     // Add active class to clicked item
    //     event.currentTarget.classList.add('active');
        
    //     const navText = event.currentTarget.querySelector('span').textContent;
    //     this.showNotification(`Navigated to ${navText}`, 'info');
        
    //     // Simulate page content change
    //     this.updatePageContent(navText);
    // }

    updatePageContent(section) {
        const mainHeader = document.querySelector('.main-header');
        const pageTitle = mainHeader.querySelector('.page-title');
        const pageSubtitle = mainHeader.querySelector('.page-subtitle');
        
        const contentMap = {
            'Dashboard': {
                title: 'Dashboard',
                subtitle: 'Welcome back! Here\'s what\'s happening with your projects.'
            },
            'Projects': {
                title: 'Projects',
                subtitle: 'Manage and monitor your active development projects.'
            },
            'Repositories': {
                title: 'Repositories',
                subtitle: 'Browse and manage your code repositories.'
            },
            'AI Assistant': {
                title: 'AI Assistant',
                subtitle: 'Interact with your development AI assistant.'
            },
            'Settings': {
                title: 'Settings',
                subtitle: 'Configure your dashboard and account preferences.'
            }
        };
        
        const content = contentMap[section] || contentMap['Dashboard'];
        pageTitle.textContent = content.title;
        pageSubtitle.textContent = content.subtitle;
        
        // Add transition effect
        mainHeader.style.opacity = '0.5';
        setTimeout(() => {
            mainHeader.style.opacity = '1';
        }, 150);
    }

    // User menu functionality
    toggleUserMenu(event) {
        event.stopPropagation();
        
        let dropdown = document.querySelector('.user-dropdown');
        if (!dropdown) {
            dropdown = this.createUserDropdown();
        }
        
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        }, { once: true });
    }

    createUserDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        dropdown.innerHTML = `
            <div class="user-dropdown-content">
                <div class="user-dropdown-header">
                    <div class="user-avatar-large">${this.currentUser.avatar}</div>
                    <div>
                        <div class="user-dropdown-name">${this.currentUser.name}</div>
                        <div class="user-dropdown-role">${this.currentUser.role}</div>
                    </div>
                </div>
                <div class="user-dropdown-divider"></div>
                <div class="user-dropdown-item" data-action="profile">Profile Settings</div>
                <div class="user-dropdown-item" data-action="preferences">Preferences</div>
                <div class="user-dropdown-item" data-action="help">Help & Support</div>
                <div class="user-dropdown-divider"></div>
                <div class="user-dropdown-item" data-action="logout">Sign Out</div>
            </div>
        `;
        
        // Add event listeners to dropdown items
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('user-dropdown-item')) {
                const action = e.target.dataset.action;
                this.handleUserAction(action);
                dropdown.style.display = 'none';
            }
        });
        
        document.querySelector('.header-actions').appendChild(dropdown);
        this.addUserDropdownStyles();
        return dropdown;
    }

    handleUserAction(action) {
        const actions = {
            profile: 'Opening profile settings...',
            preferences: 'Opening preferences...',
            help: 'Opening help center...',
            logout: 'Signing out...'
        };
        
        this.showNotification(actions[action] || 'Action performed', 'info');
    }

    // Stat card interactions
    handleStatCardHover(event) {
        const card = event.currentTarget;
        const icon = card.querySelector('.stat-icon');
        
        // Add pulse animation
        icon.style.transform = 'scale(1.1)';
        icon.style.transition = 'transform 0.2s ease';
    }

    handleStatCardLeave(event) {
        const card = event.currentTarget;
        const icon = card.querySelector('.stat-icon');
        
        icon.style.transform = 'scale(1)';
    }

    // Activity and repository interactions
    handleActivityClick(event) {
        const item = event.currentTarget;
        const title = item.querySelector('.activity-title').textContent;
        
        item.style.backgroundColor = 'var(--bg-tertiary)';
        setTimeout(() => {
            item.style.backgroundColor = '';
        }, 300);
        
        this.showNotification(`Opened: ${title}`, 'success');
    }

    handleRepoClick(event) {
        const item = event.currentTarget;
        const repoName = item.querySelector('.repo-name').textContent;
        
        item.style.borderColor = 'var(--primary-color)';
        setTimeout(() => {
            item.style.borderColor = '';
        }, 500);
        
        this.showNotification(`Opening repository: ${repoName}`, 'info');
    }

    // Mobile menu toggle
    createMobileMenuToggle() {
        const header = document.querySelector('.header');
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2"/>
            </svg>
        `;
        
        menuToggle.addEventListener('click', this.toggleSidebar.bind(this));
        header.insertBefore(menuToggle, header.firstChild);
        
        this.addMobileStyles();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        this.sidebarOpen = !this.sidebarOpen;
        
        if (this.sidebarOpen) {
            sidebar.classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            sidebar.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + K for search focus
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.querySelector('.search-input');
            searchInput.focus();
        }
        
        // Escape to close modals/dropdowns
        if (event.key === 'Escape') {
            this.closeAllDropdowns();
        }
    }

    closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.search-dropdown, .user-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }

    // Real-time updates simulation
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            if (!document.hidden) {
                this.updateStats();
                this.addNewActivity();
                this.addNewLogEntry();
            }
        }, 30000); // Update every 30 seconds
    }

    updateStats() {
        // Simulate random stat changes
        const changes = {
            totalCommits: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
            aiJobsCompleted: Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0
        };

        if (changes.totalCommits > 0) {
            this.stats.totalCommits += changes.totalCommits;
            this.animateStatUpdate('totalCommits', this.stats.totalCommits, `+${changes.totalCommits} new`);
        }

        if (changes.aiJobsCompleted > 0) {
            this.stats.aiJobsCompleted += changes.aiJobsCompleted;
            this.animateStatUpdate('aiJobsCompleted', this.stats.aiJobsCompleted, `+${changes.aiJobsCompleted} new`);
        }
    }

    animateStatUpdate(statType, newValue, changeText) {
        const statCards = document.querySelectorAll('.stat-card');
        let targetCard = null;

        // Find the right stat card based on content
        statCards.forEach(card => {
            const title = card.querySelector('.stat-title').textContent;
            if ((statType === 'totalCommits' && title.includes('Commits')) ||
                (statType === 'aiJobsCompleted' && title.includes('AI Jobs'))) {
                targetCard = card;
            }
        });

        if (targetCard) {
            const valueElement = targetCard.querySelector('.stat-value');
            const changeElement = targetCard.querySelector('.stat-change');
            
            // Animate value change
            valueElement.style.transform = 'scale(1.1)';
            valueElement.style.color = 'var(--accent-green)';
            
            setTimeout(() => {
                valueElement.textContent = newValue;
                valueElement.style.transform = 'scale(1)';
                valueElement.style.color = '';
                
                // Update change text temporarily
                const originalText = changeElement.textContent;
                changeElement.textContent = changeText;
                changeElement.style.fontWeight = '600';
                
                setTimeout(() => {
                    changeElement.textContent = originalText;
                    changeElement.style.fontWeight = '';
                }, 3000);
            }, 200);
        }
    }

    addNewActivity() {
        if (Math.random() > 0.6) return; // 40% chance of new activity

        const activities = [
            {
                type: 'commit',
                title: 'Committed to web-app',
                description: 'Updated user authentication flow',
                branch: 'feature/auth',
                time: 'Just now'
            },
            {
                type: 'pr',
                title: 'Created pull request #58',
                description: 'Add new dashboard widgets',
                branch: 'react-dashboard',
                time: 'Just now'
            },
            {
                type: 'issue',
                title: 'Resolved issue #34',
                description: 'Fixed responsive layout bug',
                branch: 'mobile-app',
                time: 'Just now'
            }
        ];

        const newActivity = activities[Math.floor(Math.random() * activities.length)];
        this.prependNewActivity(newActivity);
    }

    prependNewActivity(activity) {
        const activityList = document.querySelector('.activity-list');
        const activityHTML = `
            <div class="activity-item new-item">
                <div class="activity-icon ${activity.type}">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-meta">${activity.time} • ${activity.branch}</div>
                </div>
            </div>
        `;

        activityList.insertAdjacentHTML('afterbegin', activityHTML);
        
        // Add entrance animation
        const newItem = activityList.firstElementChild;
        newItem.style.opacity = '0';
        newItem.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            newItem.style.transition = 'all 0.3s ease';
            newItem.style.opacity = '1';
            newItem.style.transform = 'translateY(0)';
        }, 100);

        // Remove 'new-item' class after animation
        setTimeout(() => {
            newItem.classList.remove('new-item');
        }, 2000);

        // Remove excess items (keep max 6)
        const items = activityList.querySelectorAll('.activity-item');
        if (items.length > 6) {
            items[items.length - 1].remove();
        }
    }

    addNewLogEntry() {
        if (Math.random() > 0.5) return; // 50% chance of new log

        const logs = [
            { status: 'success', title: 'Deployment successful', time: 'Just now' },
            { status: 'success', title: 'Unit tests passed', time: 'Just now' },
            { status: 'warning', title: 'Performance check completed', time: 'Just now' },
            { status: 'success', title: 'Code review approved', time: 'Just now' }
        ];

        const newLog = logs[Math.floor(Math.random() * logs.length)];
        this.prependNewLog(newLog);
    }

    prependNewLog(log) {
        const logList = document.querySelector('.log-list');
        const logHTML = `
            <div class="log-item ${log.status} new-log">
                <div class="log-status ${log.status}"></div>
                <div class="log-content">
                    <div class="log-title">${log.title}</div>
                    <div class="log-time">${log.time}</div>
                </div>
            </div>
        `;

        logList.insertAdjacentHTML('afterbegin', logHTML);
        
        // Add entrance animation
        const newItem = logList.firstElementChild;
        newItem.style.opacity = '0';
        newItem.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            newItem.style.transition = 'all 0.3s ease';
            newItem.style.opacity = '1';
            newItem.style.transform = 'translateX(0)';
        }, 100);

        // Remove excess items (keep max 7)
        const items = logList.querySelectorAll('.log-item');
        if (items.length > 7) {
            items[items.length - 1].remove();
        }
    }

    getActivityIcon(type) {
        const icons = {
            commit: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><line x1="1.05" y1="12" x2="7" y2="12" stroke="currentColor" stroke-width="2"/><line x1="17.01" y1="12" x2="22.96" y2="12" stroke="currentColor" stroke-width="2"/></svg>',
            pr: '<svg viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/></svg>',
            issue: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/></svg>'
        };
        return icons[type] || icons.commit;
    }

    // Notifications system
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(type)}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);
        this.addNotificationStyles();

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // Handle page visibility changes
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause updates when tab is not visible
            clearInterval(this.updateInterval);
        } else {
            // Resume updates when tab becomes visible
            this.startRealTimeUpdates();
        }
    }

    // Load initial mock data
    loadInitialData() {
        // This could be replaced with actual API calls
        console.log('Dashboard initialized with mock data');
    }

    // Dynamic CSS injection for new components
    addSearchResultsStyles() {
        if (document.querySelector('#search-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'search-styles';
        style.textContent = `
            .search-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                margin-top: 4px;
            }
            .search-results {
                padding: 8px;
            }
            .search-results-header {
                font-size: 12px;
                font-weight: 600;
                color: var(--text-muted);
                padding: 8px 12px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .search-result-item {
                padding: 12px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: background-color 0.2s;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .search-result-item:hover {
                background-color: var(--bg-secondary);
            }
            .search-result-name {
                font-weight: 500;
                color: var(--text-primary);
            }
            .search-result-name mark {
                background-color: var(--primary-color);
                color: white;
                padding: 1px 2px;
                border-radius: 2px;
            }
            .search-result-description {
                font-size: 13px;
                color: var(--text-secondary);
            }
            .search-result-type {
                font-size: 11px;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
        `;
        document.head.appendChild(style);
    }

    addUserDropdownStyles() {
        if (document.querySelector('#user-dropdown-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'user-dropdown-styles';
        style.textContent = `
            .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                margin-top: 8px;
                min-width: 200px;
            }
            .user-dropdown-content {
                padding: 8px;
            }
            .user-dropdown-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: var(--radius-sm);
            }
            .user-avatar-large {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--accent-purple), var(--primary-color));
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
            }
            .user-dropdown-name {
                font-weight: 600;
                color: var(--text-primary);
            }
            .user-dropdown-role {
                font-size: 12px;
                color: var(--text-muted);
            }
            .user-dropdown-divider {
                height: 1px;
                background: var(--border-color);
                margin: 8px 0;
            }
            .user-dropdown-item {
                padding: 8px 12px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: background-color 0.2s;
                font-size: 14px;
                color: var(--text-primary);
            }
            .user-dropdown-item:hover {
                background-color: var(--bg-secondary);
            }
        `;
        document.head.appendChild(style);
    }

    addMobileStyles() {
        if (document.querySelector('#mobile-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'mobile-styles';
        style.textContent = `
            .mobile-menu-toggle {
                display: none;
                background: none;
                border: none;
                padding: 8px;
                cursor: pointer;
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                transition: background-color 0.2s;
            }
            .mobile-menu-toggle:hover {
                background-color: var(--bg-secondary);
            }
            .mobile-menu-toggle svg {
                width: 20px;
                height: 20px;
                stroke: currentColor;
            }
            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: block;
                }
            }
        `;
        document.head.appendChild(style);
    }

    addNotificationStyles() {
        if (document.querySelector('#notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
            }
            .notification-icon {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 12px;
                flex-shrink: 0;
            }
            .notification-success .notification-icon {
                background-color: var(--accent-green);
                color: white;
            }
            .notification-error .notification-icon {
                background-color: var(--accent-red);
                color: white;
            }
            .notification-warning .notification-icon {
                background-color: var(--accent-orange);
                color: white;
            }
            .notification-info .notification-icon {
                background-color: var(--primary-color);
                color: white;
            }
            .notification-message {
                flex: 1;
                font-size: 14px;
                color: var(--text-primary);
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--text-muted);
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            .notification-close:hover {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            .new-item {
                background-color: rgba(37, 99, 235, 0.05);
                border-left: 3px solid var(--primary-color);
            }
            .new-log {
                background-color: rgba(16, 185, 129, 0.05);
            }
        `;
        document.head.appendChild(style);
    }

    // Utility methods
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // Theme switching functionality
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
        
        this.showNotification(`Switched to ${isDark ? 'light' : 'dark'} theme`, 'success');
    }

    // Performance monitoring
    monitorPerformance() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            
            if (loadTime > 3000) {
                console.warn('Slow page load detected:', loadTime + 'ms');
            }
        });

        // Monitor memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > 50000000) { // 50MB
                    console.warn('High memory usage detected');
                }
            }, 60000);
        }
    }

    // Data export functionality
    exportDashboardData() {
        const data = {
            stats: this.stats,
            user: this.currentUser,
            timestamp: new Date().toISOString(),
            activities: this.activityData,
            logs: this.logData
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Dashboard data exported successfully', 'success');
    }

    // Accessibility improvements
    enhanceAccessibility() {
        // Add ARIA labels to interactive elements
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.setAttribute('aria-label', 'Search projects, repositories, or documentation');
        }

        // Add keyboard navigation support
        const focusableElements = document.querySelectorAll(
            'a, button, input, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach((element, index) => {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    // Custom tab navigation logic could go here
                }
            });
        });

        // Add high contrast mode detection
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }

        // Add reduced motion detection
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }
    }

    // Error handling and reporting
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('JavaScript Error:', event.error);
            this.showNotification('An error occurred. Please refresh the page.', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled Promise Rejection:', event.reason);
            this.showNotification('A network error occurred. Please try again.', 'error');
        });
    }

    // Cleanup method
    destroy() {
        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        // Clear timeouts
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        console.log('Dashboard instance destroyed');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    if (document.querySelector('.dashboard')) {
        window.dashboardInstance = new Dashboard();
        
        // Expose useful methods globally for debugging
        window.dashboard = {
            showNotification: (msg, type) => window.dashboardInstance.showNotification(msg, type),
            toggleTheme: () => window.dashboardInstance.toggleTheme(),
            exportData: () => window.dashboardInstance.exportDashboardData(),
            updateStats: () => window.dashboardInstance.updateStats()
        };
        
        console.log('Dashboard initialized successfully');
        console.log('Available global methods: window.dashboard');
    }
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}