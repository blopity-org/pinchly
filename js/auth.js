import { escapeHtml, query } from './utils.js';
import {
    auth,
    createUserWithEmailAndPassword,
    firebaseConfigured,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from './firebase.js';

export const STORAGE_KEYS = {
    auth: 'pinchly-firebase-user',
    appPrefix: 'pinchly:app:',
    userLabel: 'pinchly-firebase-user-label',
};

localStorage.removeItem('pinchly-current-user');
localStorage.removeItem('pinchly-current-user-label');

export function getCurrentUser() {
    return localStorage.getItem(STORAGE_KEYS.auth);
}

export function isUserSignedIn() {
    return Boolean(getCurrentUser());
}

export function renderAuthControls(container = query('#auth-bar')) {
    if (!container) return;

    if (getCurrentUser()) {
        renderSignedIn(
            container,
            localStorage.getItem(STORAGE_KEYS.userLabel) || 'Signed in'
        );
    } else {
        renderSignedOut(container);
    }
}

export function renderAuthBar() {
    renderAuthControls();
}

function renderSignedOut(container) {
    container.innerHTML = `
        <div class="auth-content">
            <div class="auth-heading">
                <p class="eyebrow">Your account</p>
                <h2>Pick up where you left off</h2>
            </div>
            <div class="auth-mode" role="group" aria-label="Account action">
                <button class="btn-secondary" id="showSignIn" type="button" aria-pressed="true">Sign in</button>
                <button class="btn-secondary" id="showCreateAccount" type="button" aria-pressed="false">Create account</button>
            </div>
            <form class="login-form" id="signInForm">
                <div class="auth-field">
                    <label for="signInEmail">Email</label>
                    <input id="signInEmail" name="email" type="email" autocomplete="email" required>
                </div>
                <div class="auth-field">
                    <label for="signInPassword">Password</label>
                    <input id="signInPassword" name="password" type="password" autocomplete="current-password" required>
                </div>
                <button class="btn-primary" type="submit" ${firebaseConfigured ? '' : 'disabled'}>Sign in</button>
                <button class="auth-text-button" id="resetPassword" type="button" ${firebaseConfigured ? '' : 'disabled'}>Forgot password?</button>
            </form>
            <form class="login-form" id="createAccountForm" hidden>
                <div class="auth-field">
                    <label for="createName">Display name</label>
                    <input id="createName" name="displayName" type="text" maxlength="60" autocomplete="name" required>
                </div>
                <div class="auth-field">
                    <label for="createEmail">Email</label>
                    <input id="createEmail" name="email" type="email" autocomplete="email" required>
                </div>
                <div class="auth-field">
                    <label for="createPassword">Password</label>
                    <input id="createPassword" name="password" type="password" minlength="6" autocomplete="new-password" required>
                </div>
                <button class="btn-primary" type="submit" ${firebaseConfigured ? '' : 'disabled'}>Create account</button>
            </form>
            <p class="auth-status" id="authStatus" role="status" aria-live="polite">${firebaseConfigured ? '' : 'Firebase is not configured yet. Follow the steps in NOTES.md to enable accounts.'}</p>
            ${firebaseConfigured ? '' : '<a class="auth-setup-link" href="NOTES.md">Open Firebase setup steps</a>'}
        </div>
    `;

    bindAuthForms(container);
}

function renderSignedIn(container, label) {
    container.innerHTML = `
        <div class="auth-panel">
            <span class="auth-message">Signed in as <strong>${escapeHtml(label)}</strong></span>
            <button class="btn-secondary" id="logoutBtn" type="button">Sign out</button>
        </div>
    `;
    container
        .querySelector('#logoutBtn')
        .addEventListener('click', async (event) => {
            const button = event.currentTarget;
            setBusy(button, true);
            try {
                await signOut(auth);
            } catch {
                setBusy(button, false);
                button.textContent = 'Sign out failed';
            }
        });
}

function bindAuthForms(container) {
    const signInForm = container.querySelector('#signInForm');
    const createForm = container.querySelector('#createAccountForm');
    const signInTab = container.querySelector('#showSignIn');
    const createTab = container.querySelector('#showCreateAccount');
    const status = container.querySelector('#authStatus');

    signInTab.addEventListener('click', () => setMode('signIn'));
    createTab.addEventListener('click', () => setMode('create'));

    function setMode(mode) {
        const showSignIn = mode === 'signIn';
        signInForm.hidden = !showSignIn;
        createForm.hidden = showSignIn;
        signInTab.setAttribute('aria-pressed', String(showSignIn));
        createTab.setAttribute('aria-pressed', String(!showSignIn));
        status.textContent = '';
    }

    signInForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = signInForm.querySelector('[type="submit"]');
        setBusy(submitButton, true);
        status.textContent = '';
        try {
            const form = new FormData(signInForm);
            await signInWithEmailAndPassword(
                auth,
                form.get('email').trim().toLowerCase(),
                form.get('password')
            );
        } catch (error) {
            status.textContent = authErrorMessage(error);
            setBusy(submitButton, false);
        }
    });

    createForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = createForm.querySelector('[type="submit"]');
        setBusy(submitButton, true);
        status.textContent = '';
        try {
            const form = new FormData(createForm);
            const credential = await createUserWithEmailAndPassword(
                auth,
                form.get('email').trim().toLowerCase(),
                form.get('password')
            );
            const displayName = form.get('displayName').trim();
            await updateProfile(credential.user, { displayName });
            localStorage.setItem(STORAGE_KEYS.auth, credential.user.uid);
            localStorage.setItem(STORAGE_KEYS.userLabel, displayName);
            renderAuthControls(container);
        } catch (error) {
            status.textContent = authErrorMessage(error);
            setBusy(submitButton, false);
        }
    });

    container
        .querySelector('#resetPassword')
        .addEventListener('click', async (event) => {
            const email = signInForm.elements.email.value.trim().toLowerCase();
            if (!email) {
                status.textContent =
                    'Enter your email above, then choose “Forgot password?”.';
                signInForm.elements.email.focus();
                return;
            }
            const resetButton = event.currentTarget;
            setBusy(resetButton, true);
            try {
                await sendPasswordResetEmail(auth, email);
                status.textContent =
                    'Password reset email sent. Check your inbox.';
            } catch (error) {
                status.textContent = authErrorMessage(error);
            } finally {
                setBusy(resetButton, false);
            }
        });
}

function setBusy(button, busy) {
    button.disabled = busy || !firebaseConfigured;
    if (busy) button.dataset.originalText = button.textContent;
    else if (button.dataset.originalText)
        button.textContent = button.dataset.originalText;
    if (busy) button.textContent = 'Please wait…';
}

function authErrorMessage(error) {
    const messages = {
        'auth/email-already-in-use':
            'That email already has an account. Try signing in instead.',
        'auth/invalid-credential': 'Email or password was not recognized.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/operation-not-allowed':
            'Email and password accounts are not enabled in Firebase yet.',
        'auth/too-many-requests':
            'Too many attempts. Wait a little and try again.',
        'auth/unauthorized-domain':
            'This site address is not allowed yet. Add it to Firebase authorized domains.',
        'auth/weak-password': 'Choose a password with at least 6 characters.',
        'auth/network-request-failed':
            'Network error. Check your connection and try again.',
        'auth/user-disabled':
            'This account is disabled. Contact the site administrator.',
    };
    return (
        messages[error?.code] ||
        'Could not complete that request. Check your details and try again.'
    );
}

if (firebaseConfigured) {
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.userLabel);
    onAuthStateChanged(auth, (user) => {
        if (user) {
            localStorage.setItem(STORAGE_KEYS.auth, user.uid);
            localStorage.setItem(
                STORAGE_KEYS.userLabel,
                user.displayName || user.email || 'Account'
            );
        } else {
            localStorage.removeItem(STORAGE_KEYS.auth);
            localStorage.removeItem(STORAGE_KEYS.userLabel);
        }
        renderAuthControls();
        window.dispatchEvent(new Event('pinchly-auth-change'));
    });
} else {
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.userLabel);
    document.addEventListener('DOMContentLoaded', () => renderAuthControls(), {
        once: true,
    });
}
