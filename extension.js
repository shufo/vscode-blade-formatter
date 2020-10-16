const vscode = require("vscode");
const { Range, Position } = vscode;
const vsctmModule = getCoreNodeModule("vscode-textmate");
const onigurumaModule = getCoreNodeModule("vscode-oniguruma");

require = require("esm")(module);
const { default: Formatter } = require("blade-formatter/src/formatter");

let wasmInitialized = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("blade", {
      provideDocumentFormattingEdits(document) {
        const extConfig = vscode.workspace.getConfiguration(
          "bladeFormatter.format"
        );

        if (!wasmInitialized) {
          onigurumaModule.initCalled = false;
          wasmInitialized = true;
        }

        const originalText = document.getText();
        const lastLine = document.lineAt(document.lineCount - 1);
        const range = new Range(new Position(0, 0), lastLine.range.end);

        if (!extConfig.enabled) {
          return [new vscode.TextEdit(range, originalText)];
        }

        const options = {
          vsctm: vsctmModule,
          oniguruma: onigurumaModule,
          indentSize: extConfig.indentSize,
          wrapLineLength: extConfig.wrapLineLength,
          wrapAttributes: extConfig.wrapAttributes
        };

        return new Promise((resolve) => {
          return new Formatter(options)
            .formatContent(originalText)
            .then((text) => {
              resolve([new vscode.TextEdit(range, text)]);
            });
        });
      },
    })
  );
}
exports.activate = activate;

function deactivate() {}

/**
 * Returns a node module installed with VSCode, or null if it fails.
 */
function getCoreNodeModule(moduleName) {
  try {
    return require(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
  } catch (err) {}

  try {
    return require(`${vscode.env.appRoot}/node_modules/${moduleName}`);
  } catch (err) {}

  return null;
}

module.exports = {
  activate,
  deactivate,
};
