import assert from "assert";
import path from "path";
import fs from "fs";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import vscode from "vscode";
import { before } from "mocha";
// const myExtension = require('../extension');

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("Should format file with extension", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "index.blade.php",
            "formatted.index.blade.php"
        );
    });

    test("Should ignore file if target listed in .bladeignore", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter("ignore.blade.php", "ignore.blade.php");
    });

    test("Should format file with runtime config / indentSize", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/indentSize/index.blade.php",
            "withConfig/indentSize/formatted.index.blade.php"
        );
    });

    test("Should format file with runtime config / wrapAttributes", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/wrapAttributes/index.blade.php",
            "withConfig/wrapAttributes/formatted.index.blade.php"
        );
    });

    test("Should format file with runtime config / wrapLineLength", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/wrapLineLength/index.blade.php",
            "withConfig/wrapLineLength/formatted.index.blade.php"
        );
    });
});

async function formatSameAsBladeFormatter(file: any, formattedFile: any, options: any = {}) {
    const { actual, source } = await format("project", file);
    const formatted = await getContent("project", formattedFile);
    assert.equal(actual, formatted);
}

async function getContent(workspaceFolderName: any, testFile: any) {
    const base = getWorkspaceFolderUri(workspaceFolderName);
    const absPath = path.join(base.fsPath, `${testFile}`);
    return fs.readFileSync(absPath).toString("utf-8");
}

async function format(workspaceFolderName: any, testFile: any) {
    const base = getWorkspaceFolderUri(workspaceFolderName);
    const absPath = path.join(base.fsPath, testFile);
    const doc = await vscode.workspace.openTextDocument(absPath);
    const text = await doc.getText();

    try {
        await vscode.window.showTextDocument(doc);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        throw error;
    }
    // eslint-disable-next-line no-console
    console.time(testFile);
    await waitForActivation("shufo.vscode-blade-formatter");
    for (let i = 0; i < 3; i++) {
        await vscode.commands.executeCommand("editor.action.formatDocument");
    }

    // eslint-disable-next-line no-console
    console.timeEnd(testFile);

    return { actual: await doc.getText(), source: text };
}

function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForActivation(extensionId: any) {
    let i = 0;
    while (vscode.extensions.getExtension(extensionId)?.isActive === false) {
        if (i === 10) {
            break;
        }

        await sleep(1000);
        i++;
    }

    return true;
}

const getWorkspaceFolderUri = (workspaceFolderName: any) => {
    const workspaceFolder = vscode.workspace?.workspaceFolders?.find((folder: any) => {
        return folder.name === workspaceFolderName;
    });
    if (!workspaceFolder) {
        throw new Error(
            "Folder not found in workspace. Did you forget to add the test folder to test.code-workspace?"
        );
    }
    return workspaceFolder.uri;
};
