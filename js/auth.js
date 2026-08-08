import {
    query,
    renderHtml,
    createIcon,
    escapeHtml,
    SELECTORS,
    ICONS,
} from './utils.js';

export const PINCHLY_ACCOUNTS = {
    pinchi: {
        password: 'pinch123',
        displayName: 'Pinchi',
        bio: 'Creator of the Pinchly platform — sign in to save apps and data locally.',
    },
    demo: {
        password: 'demo',
        displayName: 'Demo User',
        bio: 'A sample account to explore app storage, CLI and code editor workflows.',
    },
};

export const STORAGE_KEYS = {
    auth: 'pinchly-current-user',
    appPrefix: 'pinchly:app:',
};

export function getCurrentUser() {
    return localStorage.getItem(STORAGE_KEYS.auth);
}

export function lookupAccount(username) {
    return PINCHLY_ACCOUNTS[
        String(username || '')
            .trim()
            .toLowerCase()
    ];
}

export function setCurrentUser(username) {
    localStorage.setItem(STORAGE_KEYS.auth, username);
}

export function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.auth);
}

export function isUserSignedIn() {
    return Boolean(getCurrentUser());
}

export function renderAuthBar() {
    const authBar = query(SELECTORS.authBar);
    if (!authBar) return;

    renderHtml(
        authBar,
        isUserSignedIn() ? renderSignedInPanel() : renderLoginForm()
    );
    bindAuthEvents();
}

function renderSignedInPanel() {
    return `
        <div class="auth-panel">
            <span class="auth-message">
                ${createIcon(ICONS.user, 'Signed in')} <strong>@${escapeHtml(getCurrentUser())}</strong>
            </span>
            <button class="btn-secondary auth-button" id="logoutBtn" type="button">
                ${createIcon(ICONS.signOut, 'Log out')} Logout
            </button>
        </div>
    `;
}

function renderLoginForm() {
    return `
        <form id="loginForm" class="login-form" aria-label="Sign in to Pinchly">
            <label for="loginName">Username</label>
            <input id="loginName" name="loginName" type="text" placeholder="Username" autocomplete="username" required>
            <label for="loginPass">Password</label>
            <input id="loginPass" name="loginPass" type="password" placeholder="Password" autocomplete="current-password" required>
            <button class="btn-primary auth-button" type="submit">
                ${createIcon(ICONS.signIn, 'Sign in')} Login
            </button>
            <span id="authStatus" class="auth-status" role="status"></span>
        </form>
    `;
}

function bindAuthEvents() {
    const logoutBtn = query('#logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearCurrentUser();
            renderAuthBar();
        });
    }

    const loginForm = query('#loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
}

function handleLoginSubmit(event) {
    event.preventDefault();
    const username = query('#loginName')?.value;
    const password = query('#loginPass')?.value;
    const account = lookupAccount(username);
    const success = Boolean(
        account && account.password === String(password || '')
    );

    if (success) {
        setCurrentUser(String(username).trim().toLowerCase());
        renderAuthBar();
    }

    const status = query(SELECTORS.authStatus);
    if (status) {
        status.textContent = success
            ? 'Welcome back!'
            : 'Login failed. Try pinchi/demo.';
    }
}
