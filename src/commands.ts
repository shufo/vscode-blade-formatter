import { Formatter } from "blade-formatter";
import vscode, { type TextEditor, type TextEditorEdit } from "vscode";
import { Logger } from "./logger";
import { readRuntimeConfig } from "./runtimeConfig";
import { getCoreNodeModule, parsePhpVersion } from "./util";

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

const { Range, Position } = vscode;

export const formatFromCommand = async (
	editor: TextEditor,
	_edit: TextEditorEdit,
) => {
	try {
		const extConfig = vscode.workspace.getConfiguration(
			"bladeFormatter.format",
		);
		const runtimeConfig = readRuntimeConfig(editor.document.uri.fsPath);

		// Enhanced options with module validation
		const options = {
			vsctm: vsctmModule,
			oniguruma: onigurumaModule,
			indentSize: extConfig.indentSize,
			wrapLineLength: extConfig.wrapLineLength,
			wrapAttributes: extConfig.wrapAttributes,
			useTabs: extConfig.useTabs,
			sortTailwindcssClasses: extConfig.sortTailwindcssClasses,
			sortHtmlAttributes: extConfig.sortHtmlAttributes ?? "none",
			noMultipleEmptyLines: extConfig.noMultipleEmptyLines,
			noPhpSyntaxCheck: extConfig.noPhpSyntaxCheck,
			indentInnerHtml: extConfig.indentInnerHtml,
			noSingleQuote: extConfig.noSingleQuote,
			noTrailingCommaPhp:
				extConfig.noTrailingCommaPhp ||
				parsePhpVersion(extConfig.phpVersion) <= 7.2,
			componentPrefix: extConfig.componentPrefix,
			phpVersion: extConfig.phpVersion,
			...runtimeConfig,
		};

		const originalText = editor.document.getText();
		const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		const range = new Range(new Position(0, 0), lastLine.range.end);

		// Enhanced error handling for formatter initialization
		let formatter;
		try {
			formatter = new Formatter(options);
		} catch (formatterError: any) {
			const logger = new Logger();
			logger.logError("Failed to initialize formatter", formatterError);
			throw new Error(
				`Formatter initialization failed: ${formatterError.message}`,
			);
		}

		const formatted = await formatter.formatContent(originalText);

		await editor.edit((editBuilder) => {
			editBuilder.replace(range, formatted);
		});
	} catch (e) {
		const logger = new Logger();
		logger.logError("Error formatting document", e);

		// Enhanced error reporting to user
		const errorMessage = e instanceof Error ? e.message : String(e);
		vscode.window.showErrorMessage(`Formatting failed: ${errorMessage}`);
	}
};
