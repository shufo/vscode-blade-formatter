import { Formatter } from "blade-formatter";
import vscode, {
	commands,
	TextEditor,
	TextEditorEdit,
	window,
	WorkspaceConfiguration,
} from "vscode";
import { Logger } from "./logger";
import { readRuntimeConfig } from "./runtimeConfig";
import { getCoreNodeModule } from "./util";

const vsctmModule = getCoreNodeModule("vscode-textmate");
const onigurumaModule = getCoreNodeModule("vscode-oniguruma");
const { Range, Position } = vscode;

export const formatFromCommand = async (
	editor: TextEditor,
	edit: TextEditorEdit,
) => {
	try {
		const extConfig = vscode.workspace.getConfiguration(
			"bladeFormatter.format",
		);
		const runtimeConfig = readRuntimeConfig(editor.document.uri.fsPath);
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
			componentPrefix: extConfig.componentPrefix,
			...runtimeConfig,
		};
		const originalText = editor.document.getText();
		const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
		const range = new Range(new Position(0, 0), lastLine.range.end);
		const formatted = await new Formatter(options).formatContent(originalText);

		await editor.edit((editBuilder) => {
			editBuilder.replace(range, formatted);
		});
	} catch (e) {
		const logger = new Logger();
		logger.logError("Error formatting document", e);
	}
};
