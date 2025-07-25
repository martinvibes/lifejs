# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project
*Life.js is an open-source framework to build agentic apps, i.e., apps that can adapt to the users, perceive, and even act autonomously alongside them, while being interacted with via voice, text, or touch.*

It is notably built on an actor plugin model, where all the parts of the frameworks (core, memories, actions, etc.) are actually individual plugins, with their own local responsibilities, providing their own set of features. This model enforces locality, maintainability and flexibility (developers can swap or add plugin). For example, the core itself is a plugin, responsible for receiving incoming audio/text stream from the WebRTC room, and chaining AI models to stream back a textual or vocal answer back to the WebRTC room.

## Overview
Life.js codebase is a monorepo powered by Turborepo. Here is an overview about it.

### Commands
Here are the package manager commands to execute **at the root** of the monorepo to interact with the project.
- `bun dev` - Start development servers for all apps.
- `bun run build` - Build all packages and apps
- `bun run types` - Run TypeScript type checking across the entire repository
- `bun run lint` - Run linting with ultracite (extends Biome) across the entire repository
- `bun run format` - Format code with ultracite across the entire repository
- `bun test` - Run tests across the entire repository

You mainly want to use those root commands instead of calling specific apps/packages commands.

### Playground App (`apps/playground/`)
This app is used by Life.js' maintainers to perform various experiments, tests, and benchmarks while developing new features.
**Do not work into the playground** unless explicitely asked by the user, e.g., "Can you create a benchmark in the playground about..."

### Website App (`apps/website/`)
This app contains the Life.js official website hosted at https://lifejs.org.
It notably includes the landing pages, the framework documentation, and community examples.

### Life Package (`packages/life/`)
This is the main package of the monorepo, containing the entire Life.js framework (`npm install life`).
Here is an overview of its sub-folders:
- `agent/` — Provides agent definition (`defineAgent()`) and server.
- `transport/` — Abstracts complex WebRTC/streaming logic behind a simple `Transport` class.
- `models/` — Offer a unified API to interact with various LLM/TTS/STT/EOU/VAD providers.
- `config/` — Contains the schema of agents configuration used by global config (`life.config.ts` file) and local configs (defineAgent().config(...))
- `plugins/` — In Life.js everything is a plugin, even the core. This contains all native plugins.
- `client/` — Provide a client to connect and interact with a Life.js agent.
- `react/` — Exposes React hooks and components built on top of `life/client`.
- `shared/` — Shared utilities and helpers.
- `cli/` — The `life` command-line interface used to run development server, build Life.js project, deploy, etc.
- `storage/` (coming soon) — Offers a unified API for relational and vector database operations.
- `compiler/` (coming soon) — Compiles a Life.js project into a ready-to-run `.life/` folder.


## Stack
- **Package Manager**: We use Bun, so use `bun install` and `bun run` instead of NPM equivalents.
- **Monorepo**: Turborepo.
- **Linting & Formatting**: ultracite (extends Biome), configured in `biome.json`
- **TypeScript**: Version 5.x.x across all packages
- **Testing**: For now we simply using `bun test` (bundled with Bun) which is automatically picking and running `*.test.ts` files in the project.

## Development Guidelines

### Code Style
- TypeScript for all code, avoid @ts-ignore and `any` whenever possible
- Make sure changes / additions are consistent with the existing code around it
- Be surgical, minimal and precise in your changes
- Never drop any existing feature or behavior because it is incompatible with some changes you performed. If adapting that part is heavy and you're unsure, ask the user, else adapt the now incompatible part.
- Use interfaces over types whenever possible
- Avoid enums, use const maps
- Prefer functional and declarative patterns
- Use early returns for readability
- Named exports for components
- Descriptive naming with auxiliary verbs (isLoading, hasError)
- Event handlers prefixed with "handle" or "process"

### File Organization
- Components: exports, subcomponents, helpers, types
- Directories: lowercase with dashes (auth-wizard)
- Minimal external dependencies

### Test your changes
Before concluding that a performed change is working, write a minimal temporary test file to test that your changes are working as expected.

### Answers Tips
- Keep your answer minimal and dense, still easy to read quickly
- Be as transparent as possible with the user, always explain shortly your reasoning
- Consider introducing a TL;DR at the top or bottom of complex explanations