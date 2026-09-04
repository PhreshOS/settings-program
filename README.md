# Settings

The owner-facing PhreshOS Settings Program.

[Appearance](https://docs.phreshos.com/system/appearance) ·
[Desktop](https://docs.phreshos.com/system/desktop) ·
[Source](https://github.com/PhreshOS/settings-program)

## Role

Settings presents owner-controlled System preferences. Its Client uses the
System and Desktop contracts directly through explicitly declared permissions,
without retaining a competing copy of System state.

Appearance is the current Settings domain. The System owns Appearance and
Desktop preferences; this Program owns their owner-facing interaction and
presentation.

## Installation

```sh
phresh install settings --run
```

See [Appearance](https://docs.phreshos.com/system/appearance) and
[Desktop](https://docs.phreshos.com/system/desktop) for the contracts presented
by Settings.

## Development

```sh
bun install --frozen-lockfile
bun run verify
bun run dev
```

Build, run the production definition, or package a release with:

```sh
bun run build
bun run start
bun run pack
```

`verify` checks the source, builds the Client Endpoint, and validates the
production Program artifact.

## Related repositories

- [PhreshOS System](https://github.com/PhreshOS/system) owns the state changed
  through Settings.
- [`@phreshos/react-ui`](https://github.com/PhreshOS/react-ui) owns the shared
  visual interpretation of Appearance.
- [`@phreshos/client`](https://github.com/PhreshOS/client) exposes the System
  and Desktop contracts used by the Client.
- [Setup](https://github.com/PhreshOS/setup-program) owns first-run preparation,
  not ongoing preferences.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the repository workflow and
[SECURITY.md](SECURITY.md) for private vulnerability reporting.

## License

Licensed under the [MIT License](LICENSE). Copyright © 2026 Zohayr SLILEH.
