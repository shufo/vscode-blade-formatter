import fs from "node:fs";
import path from "node:path";
import Mocha from "mocha";

function findTestFiles(dir: string, pattern: RegExp = /\.test\.js$/): string[] {
	const testFiles: string[] = [];

	function walkDirectory(currentDir: string) {
		const entries = fs.readdirSync(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);

			if (entry.isDirectory()) {
				walkDirectory(fullPath);
			} else if (entry.isFile() && pattern.test(entry.name)) {
				testFiles.push(path.relative(dir, fullPath));
			}
		}
	}

	walkDirectory(dir);
	return testFiles;
}

export function run() {
	// Create the mocha test
	const mocha = new Mocha({
		ui: "tdd",
		color: true,
	});
	const testsRoot = path.resolve(__dirname, "..");

	return new Promise((c, e) => {
		try {
			const files = findTestFiles(testsRoot);

			if (files.length === 0) {
				console.warn("No test files found matching pattern *.test.js");
			}

			// Add files to the test suite
			files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

			// Run the mocha test
			mocha.run((failures) => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c("");
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}
