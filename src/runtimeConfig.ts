import fs from "fs";
import path from "path";
import Ajv, { JTDSchemaType } from "ajv/dist/jtd";
import findConfig from "find-config";

const ajv = new Ajv();

export type WrapAttributes =
	| "auto"
	| "force"
	| "force-aligned "
	| "force-expand-multiline"
	| "aligned-multiple"
	| "preserve"
	| "preserve-aligned";

export interface RuntimeConfig {
	indentSize?: number;
	indentInnerHtml?: boolean;
	wrapLineLength?: number;
	wrapAttributes?: WrapAttributes;
	wrapAttributesMinAttrs?: number;
	endWithNewline?: boolean;
	useTabs?: boolean;
	sortTailwindcssClasses?: boolean;
	sortHtmlAttributes?: string;
	customHtmlAttributesOrder?: string;
	tailwindcssConfigPath?: string;
	noMultipleEmptyLines?: boolean;
	noPhpSyntaxCheck?: boolean;
	noSingleQuote?: boolean;
	noTrailingCommaPhp?: boolean;
	componentPrefix?: string[];
	phpVersion?: string;
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
			indentInnerHtml: { type: "boolean" },
			wrapLineLength: { type: "int32" },
			wrapAttributes: {
				enum: [
					"auto",
					"force",
					"force-aligned ",
					"force-expand-multiline",
					"aligned-multiple",
					"preserve",
					"preserve-aligned",
				],
			},
			wrapAttributesMinAttrs: { type: "int32" },
			endWithNewline: { type: "boolean" },
			useTabs: { type: "boolean" },
			sortTailwindcssClasses: { type: "boolean" },
			sortHtmlAttributes: { type: "string" },
			customHtmlAttributesOrder: { type: "string" },
			tailwindcssConfigPath: { type: "string" },
			noMultipleEmptyLines: { type: "boolean" },
			noPhpSyntaxCheck: { type: "boolean" },
			noSingleQuote: { type: "boolean" },
			noTrailingCommaPhp: { type: "boolean" },
			componentPrefix: { elements: { type: "string" } },
			phpVersion: { type: "string" },
		},
		additionalProperties: true,
	};
	const parse = ajv.compileParser(schema);
	return parse(configFileContent);
}

export function findConfigFile(filePath: string): string | null {
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
