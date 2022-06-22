import vscode from "vscode";

/**
 * Returns a node module installed with VSCode, or null if it fails.
 */
export function getCoreNodeModule(moduleName: string) {
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
