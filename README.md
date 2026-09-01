# Settings

The official PhreshOS Settings Program.

Settings provides a desktop interface for owner-controlled System preferences.

## Model

The Server coordinates authoritative System changes. Client Core exposes
Settings operations as local capabilities, and Client View renders those
capabilities without retaining a competing copy of System state.

Appearance is the current Settings domain. It controls the System Appearance
and the effective desktop theme and animation preferences through their public
contracts.

## Installation

```sh
phresh install settings --run
```

## Development

```sh
bun install --frozen-lockfile
bun run verify
bun run dev
```

Build, attach the production definition, or package a release with:

```sh
bun run build
bun run start
bun run pack
```

`verify` checks the source, builds both Endpoints, and validates the production
Program artifact.

## Repository boundary

This repository owns the Settings domain and its interface. The System remains
the authority for Appearance and desktop preferences.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository workflow and
[SECURITY.md](SECURITY.md) for private vulnerability reporting.

## License

Licensed under the [MIT License](LICENSE). Copyright © 2026 Zohayr SLILEH.
