import vscode from "vscode";
import { ExtensionContext } from "vscode";
import path from "path";
import findConfig from "find-config";
import fs from "fs";
import ignore from "ignore";
import { Formatter } from "blade-formatter";
import { setExtensionContext } from './extensionContext';
import { telemetry, TelemetryEventNames } from './telemetry';
import { readRuntimeConfig } from './runtimeConfig';

export const enum ExtensionConstants {
    extensionId = 'shufo.vscode-blade-formatter',
    firstActivationStorageKey = 'firstActivation',
}

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
    setExtensionContext(context);

    telemetry.send(TelemetryEventNames.Startup);

    if (context.globalState.get(ExtensionConstants.firstActivationStorageKey) === undefined) {
        telemetry.send(TelemetryEventNames.NewInstall);
        context.globalState.update(ExtensionConstants.firstActivationStorageKey, false);
    }

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider("blade", {
            provideDocumentFormattingEdits(document: any) {
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
                    ...runtimeConfig,
                };

                return new Promise((resolve, reject) => {
                    return new Formatter(options)
                        .formatContent(originalText)
                        .then((text: any) => {
                            resolve([new vscode.TextEdit(range, text)]);
                        })
                        .then(undefined, (err: any) => {
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
