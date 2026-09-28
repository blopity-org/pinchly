(function () {
    const DEV_MODE = true;
    const ACCESS_CODE = 'not-a-robot';
    const SESSION_KEY = 'pinchly-dev-access';

    if (!DEV_MODE || sessionStorage.getItem(SESSION_KEY) === 'granted') return;

    document.documentElement.classList.add('dev-mode-locked');

    const styles = document.createElement('style');
    styles.textContent = `
        html.dev-mode-locked,
        html.dev-mode-locked body {
            min-height: 100%;
            background: #e8f1eb;
        }
        html.dev-mode-locked body > :not(#dev-mode-gate) {
            visibility: hidden !important;
        }
        #dev-mode-gate {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            display: grid;
            place-items: center;
            padding: 24px;
            background-color: #e8f1eb;
            background-image: linear-gradient(rgba(24, 73, 55, 0.045) 1px, transparent 1px),
                linear-gradient(90deg, rgba(24, 73, 55, 0.045) 1px, transparent 1px);
            background-size: 28px 28px;
            color: #20211f;
            font-family: "Instrument Sans", "Segoe UI", sans-serif;
        }
        #dev-mode-gate * { box-sizing: border-box; }
        #dev-mode-panel {
            width: min(100%, 420px);
            padding: 32px;
            border: 1px solid #c6d7cc;
            border-top: 5px solid #167c68;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 18px 50px rgba(24, 73, 55, 0.12);
            animation: dev-mode-arrive 320ms ease-out both;
        }
        #dev-mode-eyebrow {
            margin: 0 0 16px;
            color: #167c68;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }
        #dev-mode-panel h1 {
            margin: 0;
            font-family: "Space Grotesk", "Segoe UI", sans-serif;
            font-size: 2rem;
            line-height: 1.1;
        }
        #dev-mode-panel p {
            margin: 12px 0 24px;
            color: #555b56;
            line-height: 1.55;
        }
        #dev-mode-form label {
            display: block;
            margin-bottom: 7px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        #dev-mode-form input {
            width: 100%;
            min-height: 46px;
            padding: 10px 12px;
            border: 1px solid #aebbb2;
            border-radius: 5px;
            background: #fff;
            color: #20211f;
            font: inherit;
        }
        #dev-mode-form input:focus {
            outline: 3px solid rgba(22, 124, 104, 0.2);
            border-color: #167c68;
        }
        #dev-mode-form button {
            width: 100%;
            min-height: 46px;
            margin-top: 12px;
            border: 0;
            border-radius: 5px;
            background: #167c68;
            color: #fff;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
        }
        #dev-mode-form button:hover { background: #105e4e; }
        #dev-mode-error {
            min-height: 1.4em;
            margin: 10px 0 0 !important;
            color: #a2352b !important;
            font-size: 0.9rem;
        }
        #dev-mode-hint {
            margin: 16px 0 0 !important;
            color: #6b716c !important;
            font-size: 0.82rem;
        }
        @keyframes dev-mode-arrive {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
            #dev-mode-panel { animation: none; }
        }
    `;
    document.head.append(styles);

    function showGate() {
        const gate = document.createElement('section');
        gate.id = 'dev-mode-gate';
        gate.setAttribute('aria-labelledby', 'dev-mode-title');
        gate.innerHTML = `
            <div id="dev-mode-panel">
                <p id="dev-mode-eyebrow">Blopity Pinch / Development build</p>
                <h1 id="dev-mode-title">Not a robot?</h1>
                <p>This site is still under development. Enter the friend password to come in.</p>
                <form id="dev-mode-form">
                    <label for="dev-mode-code">Friend password</label>
                    <input id="dev-mode-code" name="code" type="password" autocomplete="off" required>
                    <button type="submit">Enter site</button>
                    <p id="dev-mode-error" role="status" aria-live="polite"></p>
                </form>
                <p id="dev-mode-hint">Forgot it? The JavaScript might jog your memory.</p>
            </div>
        `;
        document.body.append(gate);

        const form = gate.querySelector('#dev-mode-form');
        const input = gate.querySelector('#dev-mode-code');
        const error = gate.querySelector('#dev-mode-error');
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (input.value.trim().toLowerCase() !== ACCESS_CODE) {
                error.textContent = 'Nope, that is not the friend password.';
                input.select();
                return;
            }

            sessionStorage.setItem(SESSION_KEY, 'granted');
            document.documentElement.classList.remove('dev-mode-locked');
            styles.remove();
            gate.remove();
        });
        input.focus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showGate, { once: true });
    } else {
        showGate();
    }
})();
