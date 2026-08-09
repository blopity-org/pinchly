// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

import { query } from './utils.js';
import { loadAppData, saveAppData } from './storage.js';

export function appendCliLine(outputElement, text, type = 'output') {
    const line = document.createElement('div');
    line.className = `cli-line cli-line-${type}`;
    line.textContent = text;
    outputElement.appendChild(line);
    outputElement.scrollTop = outputElement.scrollHeight;
}

export function parseCliValue(value) {
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
    try {
        return JSON.parse(trimmed);
    } catch {
        return trimmed;
    }
}

export function runCliCommand(appId, appMwk, input, outputElement) {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const storage = loadAppData(appId, appMwk.data || {});

    switch (command) {
        case 'help':
            appendCliLine(
                outputElement,
                'Commands: help, echo, json, show data, get <key>, set <key> <value>, clear',
                'info'
            );
            break;
        case 'echo':
            appendCliLine(outputElement, args.join(' ') || '', 'output');
            break;
        case 'json':
            appendCliLine(
                outputElement,
                JSON.stringify(storage, null, 2),
                'output'
            );
            break;
        case 'show':
            if (args[0] === 'data') {
                appendCliLine(
                    outputElement,
                    JSON.stringify(storage, null, 2),
                    'output'
                );
            } else {
                appendCliLine(outputElement, 'Usage: show data', 'error');
            }
            break;
        case 'get':
            if (!args.length) {
                appendCliLine(outputElement, 'Usage: get <key>', 'error');
                break;
            }
            appendCliLine(
                outputElement,
                JSON.stringify(storage[args[0]], null, 2),
                'output'
            );
            break;
        case 'set':
            if (args.length < 2) {
                appendCliLine(
                    outputElement,
                    'Usage: set <key> <value>',
                    'error'
                );
                break;
            }
            {
                const key = args[0];
                const value = parseCliValue(args.slice(1).join(' '));
                storage[key] = value;
                if (saveAppData(appId, storage)) {
                    appendCliLine(outputElement, `Saved ${key}.`, 'info');
                } else {
                    appendCliLine(
                        outputElement,
                        'Login to save data locally.',
                        'error'
                    );
                }
            }
            break;
        case 'clear':
            outputElement.innerHTML = '';
            break;
        default:
            appendCliLine(
                outputElement,
                `Unknown command: ${command}. Type help.`,
                'error'
            );
    }
}

export function bindCliControls(appId, appMwk) {
    const cliOutput = query('#cliOutput');
    const cliInput = query('#cliInput');
    const cliSend = query('#cliSendBtn');
    if (!cliOutput || !cliInput || !cliSend) return;

    appendCliLine(
        cliOutput,
        appMwk.cliIntro ||
            'Welcome to the Pinchly CLI shell. Type help for available commands.',
        'info'
    );

    cliSend.addEventListener('click', () => {
        const command = cliInput.value.trim();
        if (!command) return;
        appendCliLine(cliOutput, `> ${command}`, 'command');
        runCliCommand(appId, appMwk, command, cliOutput);
        cliInput.value = '';
    });

    cliInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            cliSend.click();
        }
    });
}
