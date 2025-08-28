import fs from "node:fs";
import path from "node:path";
import { Formatter } from "blade-formatter";
import findConfig from "find-config";
import ignore from "ignore";
import vscode, {
	commands,
	type ExtensionContext,
	type WorkspaceConfiguration,
} from "vscode";
import { formatFromCommand } from "./commands";
import { ExtensionConstants } from "./constants";
import { setExtensionContext } from "./extensionContext";
import { messages } from "./messages";
import { readRuntimeConfig } from "./runtimeConfig";
import { resolveTailwindConfig, type TailwindConfig } from "./tailwind";
import { TelemetryEventNames, telemetry } from "./telemetry";
import { getCoreNodeModule, parsePhpVersion, requireUncached } from "./util";

const { Range, Position } = vscode;

// Load core VSCode modules with enhanced error handling
const vsctmModule = getCoreNodeModule("vscode-textmate");
const onigurumaModule = getCoreNodeModule("vscode-oniguruma");

// Validate core modules and provide fallback behavior
if (!vsctmModule) {
	console.warn(
		"vscode-textmate module not available - syntax highlighting may be limited",
	);
}
if (!onigurumaModule) {
	console.warn(
		"vscode-oniguruma module not available - regex support may be limited",
	);
}

const KNOWN_ISSUES = "Open known Issues";
const REPORT_ISSUE = "Report Issue";

const knownIssuesUrl = "https://github.com/shufo/vscode-blade-formatter/issues";
const newIssueUrl =
	"https://github.com/shufo/vscode-blade-formatter/issues/new/choose";

const WASM_ERROR_MESSAGE = "Must invoke loadWASM first.";

let wasmInitialized = false;

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: ExtensionContext) {
	showWelcomeMessage(context);
	setExtensionContext(context);

	telemetry.send(TelemetryEventNames.Startup);

	if (
		context.globalState.get(ExtensionConstants.firstActivationStorageKey) ===
		undefined
	) {
		telemetry.send(TelemetryEventNames.NewInstall);
		context.globalState.update(
			ExtensionConstants.firstActivationStorageKey,
			false,
		);
	}

	commands.registerTextEditorCommand(
		ExtensionConstants.formatCommandKey,
		formatFromCommand,
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider("blade", {
			provideDocumentFormattingEdits(
				document: vscode.TextDocument,
				_vscodeOpts: vscode.FormattingOptions,
			): any {
				if (shouldIgnore(document.uri.fsPath)) {
					return document;
				}

				const extConfig = vscode.workspace.getConfiguration(
					"bladeFormatter.format",
				);

				if (!wasmInitialized) {
					wasmInitialized = true;
				}

				const originalText = document.getText();
				const lastLine = document.lineAt(document.lineCount - 1);
				const range = new Range(new Position(0, 0), lastLine.range.end);
				if (!extConfig.enabled) {
					return [new vscode.TextEdit(range, originalText)];
				}

				const runtimeConfig = readRuntimeConfig(document.uri.fsPath);

				const tailwindConfig: TailwindConfig = {};

				if (
					runtimeConfig?.sortTailwindcssClasses ||
					extConfig.sortTailwindcssClasses
				) {
					const tailwindConfigPath = resolveTailwindConfig(
						document.uri.fsPath,
						runtimeConfig?.tailwindcssConfigPath ?? "",
					);
					tailwindConfig.tailwindcssConfigPath = tailwindConfigPath;

					// Enhanced tailwind config loading with multiple fallback strategies
					if (tailwindConfigPath) {
						try {
							requireUncached(tailwindConfigPath);
						} catch (error: any) {
							console.warn(
								`Failed to load Tailwind config from ${tailwindConfigPath}:`,
								error.message,
							);

							// Fallback strategy 1: Try default Tailwind config
							try {
								tailwindConfig.tailwindcssConfigPath =
									__non_webpack_require__.resolve(
										"tailwindcss/lib/public/default-config",
									);
							} catch (defaultError: any) {
								console.warn(
									"Failed to load default Tailwind config:",
									defaultError.message,
								);

								// Fallback strategy 2: Use empty config to prevent errors
								tailwindConfig.tailwindcssConfigPath = "";
								console.info("Using empty Tailwind config as fallback");
							}
						}
					} else {
						// No config path found, use default
						try {
							tailwindConfig.tailwindcssConfigPath =
								__non_webpack_require__.resolve(
									"tailwindcss/lib/public/default-config",
								);
						} catch (defaultError: any) {
							console.warn(
								"Failed to load default Tailwind config:",
								defaultError.message,
							);
							tailwindConfig.tailwindcssConfigPath = "";
						}
					}
				}

				const options = {
					vsctm: vsctmModule,
					oniguruma: onigurumaModule,
					indentSize: extConfig.indentSize,
					wrapLineLength: extConfig.wrapLineLength,
					wrapAttributes: extConfig.wrapAttributes,
					wrapAttributesMinAttrs: extConfig.wrapAttributesMinAttrs,
					useTabs: extConfig.useTabs,
					sortTailwindcssClasses: extConfig.sortTailwindcssClasses,
					sortHtmlAttributes: extConfig.sortHtmlAttributes ?? "none",
					customHtmlAttributesOrder: extConfig.customHtmlAttributesOrder,
					noMultipleEmptyLines: extConfig.noMultipleEmptyLines,
					noPhpSyntaxCheck: extConfig.noPhpSyntaxCheck,
					indentInnerHtml: extConfig.indentInnerHtml,
					noSingleQuote: extConfig.noSingleQuote,
					noTrailingCommaPhp:
						extConfig.noTrailingCommaPhp ||
						parsePhpVersion(extConfig.phpVersion) <= 7.2,
					componentPrefix: extConfig.componentPrefix.split(",") ?? null,
					phpVersion: extConfig.phpVersion,
					...runtimeConfig, // override all settings by runtime config
					...tailwindConfig,
				};

				const progressMessage = isLargeFile(document)
					? messages.largeFileFormattingMessage
					: messages.formattingMessage;
				const statusBarItem = vscode.window.createStatusBarItem(
					vscode.StatusBarAlignment.Right,
					1000,
				);
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

							// Enhanced error handling with more context
							const errorMessage = `Formatting failed: ${err.message}`;
							console.error(errorMessage, err);

							vscode.window
								?.showErrorMessage(errorMessage, KNOWN_ISSUES, REPORT_ISSUE)
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
		}),
	);
}

export function deactivate() {}

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
	} catch (_err) {
		return false;
	}
}

function showWelcomeMessage(context: vscode.ExtensionContext) {
	const extConfig: WorkspaceConfiguration = vscode.workspace.getConfiguration(
		"bladeFormatter.misc",
	);

	if (extConfig.dontShowNewVersionMessage) {
		return;
	}

	let message: string | null = null;

	const previousVersion = context.globalState.get<string>(
		ExtensionConstants.globalVersionKey,
	);
	const currentVersion = vscode.extensions.getExtension(
		ExtensionConstants.extensionId,
	)?.packageJSON?.version;
	const previousVersionArray = previousVersion
		? previousVersion.split(".").map((s: string) => Number(s))
		: [0, 0, 0];
	const currentVersionArray = currentVersion
		.split(".")
		.map((s: string) => Number(s));

	if (previousVersion === undefined || previousVersion.length === 0) {
		message = `Thanks for using ${ExtensionConstants.displayName}.`;
	} else if (
		currentVersion !== previousVersion &&
		// patch update
		((previousVersionArray[0] === currentVersionArray[0] &&
			previousVersionArray[1] === currentVersionArray[1] &&
			previousVersionArray[2] < currentVersionArray[2]) ||
			// minor update
			(previousVersionArray[0] === currentVersionArray[0] &&
				previousVersionArray[1] < currentVersionArray[1]) ||
			// major update
			previousVersionArray[0] < currentVersionArray[0])
	) {
		message = `${ExtensionConstants.displayName} updated to ${currentVersion}.`;
	}

	if (message) {
		vscode.window
			.showInformationMessage(message, "⭐️ Star on Github", "🐞 Report Bug")
			.then((val: string | undefined) => {
				if (val === "🐞 Report Bug") {
					vscode.env.openExternal(
						vscode.Uri.parse(
							"https://github.com/shufo/vscode-blade-formatter/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc",
						),
					);
				} else if (val === "⭐️ Star on Github") {
					vscode.env.openExternal(
						vscode.Uri.parse("https://github.com/shufo/vscode-blade-formatter"),
					);
				}
			});
		context.globalState.update(
			ExtensionConstants.globalVersionKey,
			currentVersion,
		);
	}
}

function isLargeFile(document: vscode.TextDocument) {
	return document.lineCount > 1000;
}
