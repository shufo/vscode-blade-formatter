const vscode = require("vscode");
const path = require("path");
var findConfig = require("find-config");
const fs = require("fs");
const ignore = require("ignore");
const { Range, Position } = vscode;
const vsctmModule = getCoreNodeModule("vscode-textmate");
const onigurumaModule = getCoreNodeModule("vscode-oniguruma");

require = require("esm")(module);
const { default: Formatter } = require("blade-formatter/src/formatter");
const { error } = require("console");

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
function activate(context) {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("blade", {
      provideDocumentFormattingEdits(document) {
        if (shouldIgnore(document.uri.fsPath)) {
          return document;
        }

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
          wrapAttributes: extConfig.wrapAttributes,
        };

        return new Promise((resolve, reject) => {
          return new Formatter(options)
            .formatContent(originalText)
            .then((text) => {
              resolve([new vscode.TextEdit(range, text)]);
            })
            .then(undefined, (err) => {
              if (err.message === WASM_ERROR_MESSAGE) {
                return reject(err);
              }

              vscode.window
                .showErrorMessage(err.message, KNOWN_ISSUES, REPORT_ISSUE)
                .then((selected) => {
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

function shouldIgnore(filepath) {
  const ignoreFilename = ".bladeignore";

  try {
    const ignoreFilePath = findConfig(ignoreFilename, {
      cwd: path.dirname(filepath),
    });
    const ignoreFileContent = fs.readFileSync(ignoreFilePath).toString();
    const ig = ignore().add(ignoreFileContent);

    return vscode.workspace.workspaceFolders.find((folder) => {
      return ig.ignores(path.relative(folder.uri.fsPath, filepath));
    });
  } catch (err) {
    return false;
  }
}

module.exports = {
  activate,
  deactivate,
};
