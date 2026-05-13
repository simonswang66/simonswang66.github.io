# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Simons Work Suites — personal tools suite hosted on GitHub Pages. Pure static HTML/CSS/JS files, no build step, no server.

## Structure

- `index.html` — tools suite landing page
- `counterparty-tool/index.html` — 交易对手方打标工具 (Ant Design + React via CDN)
- Each tool lives in its own folder with its own HTML entry point

## Development

- All pages are browser-runnable — open any `.html` file directly
- No dependencies to install, no build commands
- `git push` deploys to GitHub Pages (SSH remote: `git@github.com:simonswang66/simonswang66.github.io.git`)
