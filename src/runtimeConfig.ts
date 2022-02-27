import findConfig from 'find-config';
import path from 'path';
import fs from 'fs';
import Ajv, { JTDSchemaType } from 'ajv/dist/jtd';

const ajv = new Ajv();

export type WrapAttributes =
    | 'auto'
    | 'force'
    | 'force-aligned '
    | 'force-expand-multiline'
    | 'aligned-multiple'
    | 'preserve'
    | 'preserve-aligned';

export interface RuntimeConfig {
    indentSize?: number;
    wrapLineLength?: number;
    wrapAttributes?: WrapAttributes;
    endWithNewline?: boolean;
    useTabs?: boolean;
    sortTailwindcssClasses?: boolean;
}

const configFileNames = [".bladeformatterrc.json", ".bladeformatterrc"];

export function readRuntimeConfig(filePath: string): RuntimeConfig | undefined {

    const configFilePath: string | null = findConfigFile(filePath);

    if (configFilePath === null) {
        return undefined;
    }

    const configFileContent = fs.readFileSync(configFilePath).toString();
    const schema: JTDSchemaType<RuntimeConfig> = {
        optionalProperties: {
            indentSize: { type: "int32" },
            wrapLineLength: { type: "int32" },
            wrapAttributes: {
                enum: [
                    'auto',
                    'force',
                    'force-aligned ',
                    'force-expand-multiline',
                    'aligned-multiple',
                    'preserve',
                    'preserve-aligned'
                ]
            },
            endWithNewline: { type: 'boolean' },
            useTabs: { type: 'boolean' },
            sortTailwindcssClasses: { type: 'boolean' },
        },
        additionalProperties: true,
    };
    const parse = ajv.compileParser(schema);
    return parse(configFileContent);
}

function findConfigFile(filePath: string): string | null {
    for (let i = 0; i < configFileNames.length; i++) {
        const result: string | null = findConfig(configFileNames[i], {
            cwd: path.dirname(filePath),
            home: false,
        });

        if (result) {
            return result;
        }
    }

    return null;
}
