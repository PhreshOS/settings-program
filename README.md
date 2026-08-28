# Settings

The official PhreshOS Settings Program.

Settings follows MVC independently on both endpoints. Client Core exposes
Settings operations as local capabilities. Server Core coordinates Appearance
updates with the authoritative System. The View renders those capabilities and
never owns a competing copy of System state.

The first Settings domain is Appearance. Its route is loaded lazily at
`/appearance`; the root route redirects there until more Settings domains are
introduced.

```sh
bun install
phresh dev
```
