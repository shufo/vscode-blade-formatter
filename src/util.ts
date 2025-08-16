import fs from "fs";
import path from "path";
import { transform } from "sucrase";
import vscode from "vscode";

// Type declaration for webpack's non-webpack require
declare const __non_webpack_require__: any;

/**
 * Returns a node module installed with VSCode, or null if it fails.
 *
 * Resolution strategy:
 * 1. Try to load from VSCode's asar bundle (most common case)
 * 2. Try to load from VSCode's regular node_modules
 * 3. Try to load from extension's node_modules as fallback
 * 4. Return null if all attempts fail
 *
 * @param moduleName - The name of the module to load
 * @returns The loaded module or null if not found
 */
export function getCoreNodeModule(moduleName: string) {
	// Strategy 1: Try VSCode's asar bundle (most common case)
	try {
		const module = __non_webpack_require__(
			`${vscode.env.appRoot}/node_modules.asar/${moduleName}`,
		);
		if (module) {
			return module;
		}
	} catch (err: any) {
		// Log error for debugging but continue to next strategy
		console.debug(
			`Failed to load ${moduleName} from asar bundle:`,
			err.message,
		);
	}

	// Strategy 2: Try VSCode's regular node_modules
	try {
		// @ts-ignore
		const module = __non_webpack_require__(
			`${vscode.env.appRoot}/node_modules/${moduleName}`,
		);
		if (module) {
			return module;
		}
	} catch (err: any) {
		console.debug(
			`Failed to load ${moduleName} from regular node_modules:`,
			err.message,
		);
	}

	// Strategy 3: Try extension's node_modules as fallback
	try {
		// @ts-ignore
		const module = __non_webpack_require__(moduleName);
		if (module) {
			return module;
		}
	} catch (err: any) {
		console.debug(
			`Failed to load ${moduleName} from extension node_modules:`,
			err.message,
		);
	}

	// All strategies failed
	console.warn(`Could not load core module: ${moduleName}`);
	return null;
}

/**
 * Require module without cache and handle various module formats.
 *
 * Resolution strategy:
 * 1. Clear module cache if it exists
 * 2. Try to require the module directly
 * 3. If that fails, try to read and transform the file content
 * 4. Handle both CommonJS and ES modules
 *
 * @param moduleName - The path to the module to load
 * @returns The loaded module
 * @throws Error if module cannot be loaded
 */
export function requireUncached(moduleName: string) {
	try {
		// Strategy 1: Clear cache and try direct require
		try {
			// @ts-ignore
			delete __non_webpack_require__.cache[
				__non_webpack_require__.resolve(moduleName)
			];
		} catch (cacheError: any) {
			// Cache clearing failed, but continue with require
			console.debug(
				`Failed to clear cache for ${moduleName}:`,
				cacheError.message,
			);
		}

		// Strategy 2: Try direct require first
		try {
			// @ts-ignore
			return __non_webpack_require__(moduleName);
		} catch (requireError: any) {
			console.debug(
				`Direct require failed for ${moduleName}:`,
				requireError.message,
			);
		}

		// Strategy 3: Read file content and transform if needed
		if (fs.existsSync(moduleName)) {
			const fileContent = fs.readFileSync(moduleName, "utf8");

			// Check if it's an ES module (has import/export statements)
			if (fileContent.includes("import ") || fileContent.includes("export ")) {
				// Transform ES module to CommonJS
				const transformed = transform(fileContent, {
					transforms: ["imports"],
					jsxPragma: "React.createElement",
					jsxFragmentPragma: "React.Fragment",
				});

				// Create a temporary module context to evaluate the transformed code
				const moduleExports = {};
				const moduleRequire = (path: string) => {
					// @ts-ignore
					return __non_webpack_require__(path);
				};

				// Create module context
				const moduleContext = {
					exports: moduleExports,
					require: moduleRequire,
					__filename: moduleName,
					__dirname: path.dirname(moduleName),
				};

				// Evaluate the transformed code
				const evalCode = `
					(function(exports, require, __filename, __dirname) {
						${transformed.code}
					})
				`;

				const moduleFunction = eval(evalCode);
				moduleFunction(
					moduleExports,
					moduleRequire,
					moduleName,
					path.dirname(moduleName),
				);

				return moduleExports;
			} else {
				// CommonJS module, try to require it again
				try {
					// @ts-ignore
					return __non_webpack_require__(moduleName);
				} catch (finalError: any) {
					throw new Error(
						`Failed to load module ${moduleName}: ${finalError.message}`,
					);
				}
			}
		} else {
			throw new Error(`Module file not found: ${moduleName}`);
		}
	} catch (err: any) {
		// Enhanced error message with context
		const errorMessage = `Module resolution failed for ${moduleName}: ${err.message}`;
		console.error(errorMessage);
		throw new Error(errorMessage);
	}
}

/**
 * Parse PHP version string to numeric version for comparison.
 *
 * @param version - PHP version string (e.g., "8.4", "7.2")
 * @returns Numeric version for comparison
 */
export function parsePhpVersion(version: string): number {
	return Number.parseFloat(version);
}
