import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { platform, tmpdir } from "node:os";
import path from "node:path";
import { downloadAndUnzipVSCode, runTests } from "@vscode/test-electron";

const VSCODE_VERSION = process.env.VSCODE_VERSION;
const TMP_DIR = process.env.TMP_DIR;

async function main() {
	try {
		// vscode version
		const version = VSCODE_VERSION;
		const codePath = await downloadAndUnzipVSCode(version);

		console.log(`Using VS Code at ${codePath}`);

		const codeExecPath = getCodeExecutablePath(codePath);

		const tmpDir = TMP_DIR || tmpdir();

		const extensionsDir = getExtensionsDir(tmpDir);

		const extensionsDirArgs = ["--extensions-dir", extensionsDir];
		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, "./suite/index");

		const packagePath = makePackagePath(tmpDir);

		// create .vsix package
		await createPackage(packagePath);

		await installExtension(codeExecPath, packagePath, extensionsDirArgs);

		const launchArgs = [
			`${path.resolve(
				__dirname,
				"../../src",
			)}/test/fixtures/test.code-workspace`,
			...extensionsDirArgs,
		];

		// Download VS Code, unzip it and run the integration test
		await runTests({
			version,
			extensionDevelopmentPath: "./support", // set directory that has no package.json
			extensionTestsPath,
			launchArgs,
		});
	} catch (_err) {
		console.error("Failed to run tests");
		process.exit(1);
	}
}

function getCodeExecutablePath(codePath: string): string {
	// MacOS
	if (platform() === "darwin") {
		return path.resolve(codePath, "../../", "Resources", "app", "bin", "code");
	}

	// Linux, Windows
	return path.resolve(codePath, "../", "bin", "code");
}

function makePackagePath(tmpDir: string): string {
	const packageJsonPath = path.resolve(__dirname, "../../package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const packageName = packageJson.name;
	const packageVersion = packageJson.version;

	const packagePath = path.resolve(
		tmpDir,
		`${packageName}-${packageVersion}.vsix`,
	);

	console.log(`Package path is ${packagePath}`);

	return packagePath;
}

async function createPackage(packagePath: string) {
	const result = spawnSync(
		"yarn",
		["run", "package", "--out", packagePath, "--allow-package-env-file"],
		{ shell: true },
	);

	if (result.status === 0) {
		console.log("Package command succeeded");
		console.log(result.stdout.toString());
	} else {
		console.error("Package command failed");
		console.error(result.stderr.toString());
	}

	console.log(result);
}

async function installExtension(
	executablePath: string,
	packagePath: string,
	args: string[],
) {
	const result = spawnSync(
		`"${executablePath}"`,
		["--install-extension", packagePath, ...args],
		{ shell: true },
	);

	if (result.status === 0) {
		console.log("install package succeeded");
		console.log(result.stdout.toString());
	} else {
		console.error("install package failed");
		console.error(result.stderr.toString());
	}

	console.log(result);
}

function getExtensionsDir(tmpDir: string): string {
	const randomBytesStr = randomBytes(4).toString("hex");
	const extensionsDir = path.resolve(tmpDir, `extensions_${randomBytesStr}`);

	console.log(`Using extensions dir: ${extensionsDir}`);

	return extensionsDir;
}

main();
