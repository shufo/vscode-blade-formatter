import { ExtensionContext, Uri } from 'vscode';

let extensionContext: ExtensionContext;

/**
 * Save a referece for this extension's context
 */
export function setExtensionContext(context: ExtensionContext) {
	extensionContext = context;
}

/**
 * Return a reference for this extension's context
 */
export function getExtensionContext(): ExtensionContext {
	return extensionContext;
}

/**
 * Transform relative path inside the extension folder
 * to absolute path.
 * @param relativePath relative path to the file
 * @returns Uri of the file
 */
export function asAbsolutePath(relativePath: string): Uri {
	return Uri.file(extensionContext.asAbsolutePath(relativePath));
}
