import { query } from './utils.js';
import { loadAppData, saveAppData } from './storage.js';

export function bindCodeEditor(appId, appMwk) {
    const runButton = query('#runAppCodeBtn');
    const codeEditor = query('#appCodeEditor');
    const output = query('#codeRunnerOutput');
    if (!runButton || !codeEditor || !output) return;

    runButton.addEventListener('click', () => {
        try {
            const code = codeEditor.value;
            const storage = loadAppData(appId, appMwk.data || {});
            const result = Function(
                'storage',
                'data',
                'user',
                'setStorage',
                code
            )(
                structuredClone(storage),
                appMwk.data || {},
                JSON.parse(
                    JSON.stringify(loadAppData(appId, appMwk.data || {}))
                ),
                (updatedStorage) => {
                    if (saveAppData(appId, updatedStorage)) {
                        output.textContent = 'Storage saved.';
                    }
                }
            );
            output.textContent =
                typeof result === 'undefined'
                    ? 'Code executed.'
                    : String(result);
        } catch (error) {
            output.textContent = `Runtime error: ${error.message}`;
        }
    });
}
