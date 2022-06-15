import vscode, { WorkspaceConfiguration } from "vscode";
import { ExtensionContext } from "vscode";
import path from "path";
import findConfig from "find-config";
import fs from "fs";
import ignore from "ignore";
import { Formatter } from "blade-formatter";
import { setExtensionContext } from './extensionContext';
import { telemetry, TelemetryEventNames } from './telemetry';
import { readRuntimeConfig } from './runtimeConfig';
import { ExtensionConstants } from "./constants";
import { messages } from "./messages";

const { Range, Position } = vscode;
const vsctmModule = getCoreNodeModule("vscode-textmate");
const onigurumaModule = getCoreNodeModule("vscode-oniguruma");

const KNOWN_ISSUES = "Open known Issues";
const REPORT_ISSUE = "Report Issue";

const knownIssuesUrl = "https://github.com/shufo/vscode-blade-formatter/issues";
const newIssueUrl =
    "https://github.com/shufo/vscode-blade-formatter/issues/new";

const WASM_ERROR_MESSAGE = "Must invoke loadWASM first.";

let wasmInitialized = false;

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: ExtensionContext) {
    showWelcomeMessage(context);
    setExtensionContext(context);

    telemetry.send(TelemetryEventNames.Startup);

    if (context.globalState.get(ExtensionConstants.firstActivationStorageKey) === undefined) {
        telemetry.send(TelemetryEventNames.NewInstall);
        context.globalState.update(ExtensionConstants.firstActivationStorageKey, false);
    }

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider("blade", {
            provideDocumentFormattingEdits(document: vscode.TextDocument, vscodeOpts: vscode.FormattingOptions): any {
                if (shouldIgnore(document.uri.fsPath)) {
                    return document;
                }

                const extConfig = vscode.workspace.getConfiguration(
                    "bladeFormatter.format"
                );

                if (!wasmInitialized) {
                    // onigurumaModule.initCalled = false;
                    wasmInitialized = true;
                }

                const originalText = document.getText();
                const lastLine = document.lineAt(document.lineCount - 1);
                const range = new Range(new Position(0, 0), lastLine.range.end);
                if (!extConfig.enabled) {
                    return [new vscode.TextEdit(range, originalText)];
                }

                const runtimeConfig = readRuntimeConfig(document.uri.fsPath);

                const options = {
                    vsctm: vsctmModule,
                    oniguruma: onigurumaModule,
                    indentSize: extConfig.indentSize,
                    wrapLineLength: extConfig.wrapLineLength,
                    wrapAttributes: extConfig.wrapAttributes,
                    useTabs: extConfig.useTabs,
                    sortTailwindcssClasses: extConfig.sortTailwindcssClasses,
                    ...runtimeConfig,
                };

                const progressMessage = isLargeFile(document) ? messages.largeFileFormattingMessage : messages.formattingMessage;
                const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
                statusBarItem.text = `$(loading~spin) ${progressMessage}`;
                statusBarItem.show();
                setTimeout(() => {
                    statusBarItem.dispose();
                }, 5000);

                return new Promise((resolve, reject) => {
                    return new Formatter(options)
                        .formatContent(originalText)
                        .then((text: any) => {
                            statusBarItem.dispose();
                            resolve([new vscode.TextEdit(range, text)]);
                        })
                        .then(undefined, (err: any) => {
                            statusBarItem.dispose();
                            if (err.message === WASM_ERROR_MESSAGE) {
                                return reject(err);
                            }

                            vscode.window?.showErrorMessage(err.message, KNOWN_ISSUES, REPORT_ISSUE)
                                .then((selected: any) => {
                                    if (selected === KNOWN_ISSUES) {
                                        vscode.env.openExternal(vscode.Uri.parse(knownIssuesUrl));
                                    }
                                    if (selected === REPORT_ISSUE) {
                                        vscode.env.openExternal(vscode.Uri.parse(newIssueUrl));
                                    }
                                });

                            reject(err);
                        });
                });
            },
        })
    );
}

export function deactivate() { }

/**
 * Returns a node module installed with VSCode, or null if it fails.
 */
function getCoreNodeModule(moduleName: string) {
    try {
        // @ts-ignore
        return __non_webpack_require__(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
    } catch (err: any) {
    }

    try {
        // @ts-ignore
        return __non_webpack_require__(`${vscode.env.appRoot}/node_modules/${moduleName}`);
    } catch (err: any) {
    }

    return null;
}

function shouldIgnore(filepath: any) {
    const ignoreFilename = ".bladeignore";

    try {
        const ignoreFilePath: any = findConfig(ignoreFilename, {
            cwd: path.dirname(filepath),
        });
        const ignoreFileContent = fs.readFileSync(ignoreFilePath).toString();
        const ig = ignore().add(ignoreFileContent);

        return vscode.workspace?.workspaceFolders?.find((folder: any) => {
            return ig.ignores(path.relative(folder.uri.fsPath, filepath));
        });
    } catch (err) {
        return false;
    }
}

function showWelcomeMessage(context: vscode.ExtensionContext) {
    const extConfig: WorkspaceConfiguration = vscode.workspace.getConfiguration("bladeFormatter.misc");

    if (extConfig.dontShowNewVersionMessage) {
        return;
    }

    let message: string | null = null;

    const previousVersion = context.globalState.get<string>(ExtensionConstants.globalVersionKey);
    const currentVersion = vscode.extensions.getExtension(ExtensionConstants.extensionId)?.packageJSON?.version;
    const previousVersionArray = previousVersion ? previousVersion.split('.').map((s: string) => Number(s)) : [0, 0, 0];
    const currentVersionArray = currentVersion.split('.').map((s: string) => Number(s));

    if (previousVersion === undefined || previousVersion.length === 0) {
        message = `Thanks for using ${ExtensionConstants.displayName}.`;
    } else if (currentVersion !== previousVersion && (
        // patch update
        (previousVersionArray[0] === currentVersionArray[0] && previousVersionArray[1] === currentVersionArray[1] && previousVersionArray[2] < currentVersionArray[2]) ||
        // minor update
        (previousVersionArray[0] === currentVersionArray[0] && previousVersionArray[1] < currentVersionArray[1]) ||
        // major update
        (previousVersionArray[0] < currentVersionArray[0])
    )
    ) {
        message = `${ExtensionConstants.displayName} updated to ${currentVersion}.`;
    }

    if (message) {
        vscode.window.showInformationMessage(message, '⭐️ Star on Github', '🐞 Report Bug')
            .then(function (val: string | undefined) {
                if (val === '🐞 Report Bug') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/shufo/vscode-blade-formatter/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc'));
                } else if (val === '⭐️ Star on Github') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/shufo/vscode-blade-formatter'));
                }
            });
        context.globalState.update(ExtensionConstants.globalVersionKey, currentVersion);
    }
}

function isLargeFile(document: vscode.TextDocument) {
    return document.lineCount > 1000;
}
