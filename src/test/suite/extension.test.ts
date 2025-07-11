import assert from "assert";
import fs from "fs";
import path from "path";

import { before, beforeEach } from "mocha";
import { performance } from "perf_hooks";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import vscode, { TextDocument } from "vscode";
import { ExtensionConstants } from "../../constants";
import {
	formatSameAsBladeFormatter,
	getContent,
	getDoc,
} from "../support/util";

suite("Extension Test Suite", () => {
	beforeEach(async () => {
		const config = vscode.workspace.getConfiguration("bladeFormatter.format");
		const configurations = require(
			path.resolve(__dirname, "../../../package.json"),
		).contributes.configuration.properties;
		Object.keys(configurations).forEach(async (key: string) => {
			const name = key.split(".").pop() ?? "";
			await config.update(name, undefined, true);
		});
	});

	vscode.window.showInformationMessage("Start all tests.");

	test("Should format file with extension", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"index.blade.php",
			"formatted.index.blade.php",
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
			"withConfig/indentSize/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / wrapAttributes", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/wrapAttributes/index.blade.php",
			"withConfig/wrapAttributes/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / wrapAttributesMinAttrs", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/wrapAttributesMinAttrs/index.blade.php",
			"withConfig/wrapAttributesMinAttrs/formatted.index.blade.php",
		);
	});

	test("Should format file without runtime config / wrapAttributesMinAttrs", async function (this: any) {
		this.timeout(20000);

		const config = vscode.workspace.getConfiguration("bladeFormatter.format");
		await config.update("sortHtmlAttributes", "custom", true);
		await config.update("wrapAttributesMinAttrs", 0, true);
		await config.update("wrapAttributes", "force-expand-multiline", true);

		await formatSameAsBladeFormatter(
			"withoutConfig/wrapAttributesMinAttrs/index.blade.php",
			"withoutConfig/wrapAttributesMinAttrs/formatted.index.blade.php",
		);

		// Reset config
		await config.update("wrapAttributesMinAttrs", 2, true);
		await config.update("wrapAttributes", "auto", true);
	});

	test("Should format file with runtime config / wrapLineLength", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/wrapLineLength/index.blade.php",
			"withConfig/wrapLineLength/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / sortTailwindcssClasses", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/sortTailwindcssClasses/index.blade.php",
			"withConfig/sortTailwindcssClasses/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / sortTailwindcssClasses (subdirectory)", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/sortTailwindcssClasses/subdirectory/index.blade.php",
			"withConfig/sortTailwindcssClasses/subdirectory/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / tailwindcssConfigPath ", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigPath/index.blade.php",
			"withConfig/tailwindConfigPath/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / tailwindcssConfigPath (subdirectory) ", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigPath/subdirectory/index.blade.php",
			"withConfig/tailwindConfigPath/subdirectory/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / tailwindcssConfigPath (large file)", async function (this: any) {
		this.timeout(20000);

		const startTime = performance.now();
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigPath/large_file.blade.php",
			"withConfig/tailwindConfigPath/formatted.large_file.blade.php",
		);
		const endTime = performance.now();
		assert.strictEqual(endTime - startTime < 3000, true);
	});

	test("Should format file with runtime config / tailwindcssConfigPath (config does not exists error) ", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigPathNotExists/index.blade.php",
			"withConfig/tailwindConfigPathNotExists/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / tailwindcssConfigPath (config does not exists on subdirectory) ", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigPathNotExists/subdirectory/index.blade.php",
			"withConfig/tailwindConfigPathNotExists/subdirectory/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / even if tailwind config has error", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigError/index.blade.php",
			"withConfig/tailwindConfigError/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / even if tailwind config has error (subdirectory) ", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigError/subdirectory/index.blade.php",
			"withConfig/tailwindConfigError/subdirectory/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / even if tailwind config has error (syntax error) ", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigError/syntax/index.blade.php",
			"withConfig/tailwindConfigError/syntax/formatted.index.blade.php",
		);
	});

	test("Should format file without runtime config / tailwind config exists", async function (this: any) {
		this.timeout(20000);

		const config = vscode.workspace.getConfiguration("bladeFormatter.format");
		await config.update("sortTailwindcssClasses", true, true);
		await formatSameAsBladeFormatter(
			"withoutConfig/tailwindSortWithoutRuntimeConfig/index.blade.php",
			"withoutConfig/tailwindSortWithoutRuntimeConfig/formatted.index.blade.php",
		);
		await config.update("sortTailwindcssClasses", false, true);
	});

	test("Should format file with runtime config / ES Module tailwind config", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigESModule/index.blade.php",
			"withConfig/tailwindConfigESModule/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / ES Module tailwind config (Syntax Error)", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/tailwindConfigESModuleSyntaxError/index.blade.php",
			"withConfig/tailwindConfigESModuleSyntaxError/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / sortHtmlAttributes", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/sortHtmlAttributes/index.blade.php",
			"withConfig/sortHtmlAttributes/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / noMultipleEmptyLines", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/noMultipleEmptyLines/index.blade.php",
			"withConfig/noMultipleEmptyLines/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / noPhpSyntaxCheck", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/noPhpSyntaxCheck/index.blade.php",
			"withConfig/noPhpSyntaxCheck/formatted.index.blade.php",
		);
	});

	test("Should format file with runtime config / customHtmlAttributesOrder", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/customHtmlAttributesOrder/index.blade.php",
			"withConfig/customHtmlAttributesOrder/formatted.index.blade.php",
		);
	});

	test("Should format file without runtime config / customHtmlAttributesOrder", async function (this: any) {
		this.timeout(20000);
		const config = vscode.workspace.getConfiguration("bladeFormatter.format");
		await config.update("sortHtmlAttributes", "custom", true);
		await config.update(
			"customHtmlAttributesOrder",
			"id, aria-.+, src, class",
			true,
		);
		await formatSameAsBladeFormatter(
			"withoutConfig/customHtmlAttributesOrder/index.blade.php",
			"withoutConfig/customHtmlAttributesOrder/formatted.index.blade.php",
		);
		await config.update("sortHtmlAttributes", undefined, true);
		await config.update("customHtmlAttributesOrder", undefined, true);
	});

	test("Should format file with runtime config / indentInnerHtml", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/indentInnerHtml/index.blade.php",
			"withConfig/indentInnerHtml/formatted.index.blade.php",
		);
	});

	test("Should format file without runtime config / indentInnerHtml", async function (this: any) {
		this.timeout(20000);
		const config = vscode.workspace.getConfiguration("bladeFormatter.format");
		await config.update("indentInnerHtml", true, true);
		await formatSameAsBladeFormatter(
			"withoutConfig/indentInnerHtml/index.blade.php",
			"withoutConfig/indentInnerHtml/formatted.index.blade.php",
		);
		await config.update("indentInnerHtml", undefined, true);
	});

	test("Should format file with runtime config / noSingleQuote", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/noSingleQuote/index.blade.php",
			"withConfig/noSingleQuote/formatted.index.blade.php",
		);
	});

	test("Should format file without runtime config / noSingleQuote", async function (this: any) {
		this.timeout(20000);
		const config = vscode.workspace.getConfiguration("bladeFormatter.format");
		await config.update("noSingleQuote", true, true);
		await formatSameAsBladeFormatter(
			"withoutConfig/noSingleQuote/index.blade.php",
			"withoutConfig/noSingleQuote/formatted.index.blade.php",
		);
		await config.update("noSingleQuote", undefined, true);
	});

	test("Should format file with runtime config / componentPrefix", async function (this: any) {
		this.timeout(20000);
		await formatSameAsBladeFormatter(
			"withConfig/componentPrefix/index.blade.php",
			"withConfig/componentPrefix/formatted.index.blade.php",
		);
	});

	test("Should format file without runtime config / componentPrefix", async function (this: any) {
		this.timeout(20000);
		const config = vscode.workspace.getConfiguration("bladeFormatter.format");
		await config.update("componentPrefix", "foo");
		await formatSameAsBladeFormatter(
			"withoutConfig/componentPrefix/index.blade.php",
			"withoutConfig/componentPrefix/formatted.index.blade.php",
		);
		await config.update("componentPrefix", "x-,livewire");
	});

	test("Format command exists in command list", async () => {
		const commands = await vscode.commands.getCommands();
		assert(commands.includes(ExtensionConstants.formatCommandKey));
	});

	test("Format command", async () => {
		const doc = await getDoc("index.blade.php");
		await vscode.commands.executeCommand(ExtensionConstants.formatCommandKey);
		const formatted = await doc.getText();
		const expected = await getContent("project", "formatted.index.blade.php");

		assert.equal(formatted, expected);
	});
});
