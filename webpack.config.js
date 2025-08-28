// @ts-check

const path = require("node:path");
const nodeExternals = require("webpack-node-externals");
const Dotenv = require("dotenv-webpack");

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
	target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: "none", // leave source code close to original (set to 'production' when packaging)
	entry: "./src/extension.ts", // entry point 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// bundle stored in 'dist' 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, "dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
	},
	externals: [
		{ vscode: "commonjs vscode" }, // vscode is provided by VS Code runtime
		nodeExternals(),
	],
	externalsPresets: {
		node: true, // ignore built-in modules like path, fs, etc.
	},
	optimization: {
		moduleIds: "named",
	},
	resolve: {
		extensions: [".ts", ".js"], // support TypeScript and JavaScript
	},
	plugins: [
		new Dotenv({
			safe: false, // allow compilation without .env file
			systemvars: true, // include system env vars
		}),
	],
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
						options: {
							transpileOnly: true, // disable type checker, handled elsewhere
						},
					},
				],
			},
		],
	},
	devtool: "nosources-source-map",
	infrastructureLogging: {
		level: "log", // enables logging for problem matchers
	},
};

module.exports = [extensionConfig];
