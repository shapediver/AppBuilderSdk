#!/usr/bin/env node
import {appendFileSync, existsSync, readFileSync} from "node:fs";
import {basename} from "node:path";

function fail(message) {
	console.error(message);
	process.exit(1);
}

function setOutput(name, value) {
	if (process.env.GITHUB_OUTPUT) {
		appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<EOF\n${value}\nEOF\n`);
	} else {
		console.log(`${name}=${value}`);
	}
}

const file = process.argv[2];
if (!file) {
	fail("Usage: node scripts/release/read-appbuilder-release-notes.mjs <release-notes-file>");
}

if (!existsSync(file)) {
	fail(`release_notes_file does not exist: ${file}`);
}

if (!/^app-builder-\d+\.\d+\.md$/.test(basename(file))) {
	fail(
		"release_notes_file must follow .github/release-notes/app-builder-X.Y.md naming.",
	);
}

let body = readFileSync(file, "utf8");
if (!body.trim()) {
	fail(`release_notes_file must not be empty: ${file}`);
}

// Ignore optional YAML frontmatter when looking for the release title.
let titleSource = body;
if (titleSource.startsWith("---\n")) {
	const end = titleSource.indexOf("\n---\n", 4);
	if (end !== -1) {
		titleSource = titleSource.slice(end + "\n---\n".length);
	}
}

const titleMatch = titleSource.match(/^#\s+(.+?)\s*$/m);
if (!titleMatch) {
	fail(
		"release_notes_file must contain a first-level Markdown heading, e.g. '# App Builder Version 1.10'.",
	);
}

const title = titleMatch[1].trim();
if (!title) {
	fail("release_notes_file first-level Markdown heading must not be empty.");
}

// The H1 is used as the GitHub Release title. Exclude it from the release body
// so the title is not rendered twice.
const releaseBody = body
	.replace(/^#\s+.+?\s*\r?$/m, "")
	.replace(/^\s*\r?\n/, "");

setOutput("title", title);
setOutput("body_path", file);
setOutput("body", releaseBody);
