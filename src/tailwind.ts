import findConfig from 'find-config';
import path from 'path';
import { findConfigFile } from './runtimeConfig';
import { requireUncached } from './util';

const __config__ = 'tailwind.config.js';

export type TailwindConfig = {
    tailwindcssConfigPath?: string,
    tailwindcssConfig?: object,
};

/**
 * Resolve tailwind config path if resolvable
 *
 * @param filepath string
 * @param optionPath string
 */
export function resolveTailwindConfig(filepath: string, optionPath: string): string {
    if (!optionPath) {
        return findConfig(__config__, { cwd: path.dirname(filepath) }) ?? '';
    }

    if (path.isAbsolute(optionPath ?? '')) {
        return optionPath;
    }

    const runtimeConfigPath = findConfigFile(filepath);

    return path.resolve(path.dirname(runtimeConfigPath ?? ''), optionPath ?? '');
}
