import fs from "fs";
import { transform } from "sucrase";
import vscode from "vscode";

/**
 * Returns a node module installed with VSCode, or null if it fails.
 */
export function getCoreNodeModule(moduleName: string) {
	try {
		// @ts-ignore
		return require(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
	} catch (err: any) {}

	try {
		// @ts-ignore
		return require(`${vscode.env.appRoot}/node_modules/${moduleName}`);
	} catch (err: any) {}

	return null;
}

/**
 * require module without cache
 */
export function requireUncached(moduleName: string) {
	try {
		delete require.cache[require.resolve(moduleName)];

		const fileContent = fs.readFileSync(moduleName, "utf8");

		return transform(fileContent, { transforms: ["imports"] });
	} catch (err: any) {
		throw err;
	}
}

export function parsePhpVersion(version: string): number {
	return Number.parseFloat(version);
}
