import assert from "assert";
import vscode, { TextDocument } from "vscode";
import path from "path";
import fs from "fs";
import { ExtensionConstants } from "../../constants";

export async function formatSameAsBladeFormatter(
    file: any,
    formattedFile: any,
    options: any = {}
) {
    const { actual, source } = await format("project", file);
    const formatted = await getContent("project", formattedFile);
    assert.equal(actual, formatted);
}

export async function getDoc(filename: string): Promise<TextDocument> {
    const base = getWorkspaceFolderUri("project");
    const absPath = path.join(base.fsPath, filename);

    return vscode.workspace.openTextDocument(absPath);
}

export async function getContent(workspaceFolderName: any, testFile: any) {
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
    await waitForActivation(ExtensionConstants.extensionId);
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
    const workspaceFolder = vscode.workspace?.workspaceFolders?.find(
        (folder: any) => {
            return folder.name === workspaceFolderName;
        }
    );
    if (!workspaceFolder) {
        throw new Error(
            "Folder not found in workspace. Did you forget to add the test folder to test.code-workspace?"
        );
    }
    return workspaceFolder.uri;
};
