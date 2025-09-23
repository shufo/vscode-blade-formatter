import path from "node:path";
import findConfig from "find-config";
import { findConfigFile } from "./runtimeConfig";

const __config__ = "tailwind.config.js";

export type TailwindConfig = {
	tailwindcssConfigPath?: string;
	tailwindcssConfig?: object;
};

/**
 * Resolve tailwind config path if resolvable
 *
 * @param filepath string
 * @param optionPath string
 */
export function resolveTailwindConfig(
	filepath: string,
	optionPath: string,
): string {
	if (!optionPath) {
		return findConfig(__config__, { cwd: path.dirname(filepath) }) ?? "";
	}

	if (path.isAbsolute(optionPath ?? "")) {
		return optionPath;
	}

	const runtimeConfigPath = findConfigFile(filepath);

	return path.resolve(path.dirname(runtimeConfigPath ?? ""), optionPath ?? "");
}
