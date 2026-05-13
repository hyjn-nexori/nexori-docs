# Minigame API

The Nexori Minigame API is the supported integration surface for gameplay and rules mods running inside a Nexori-managed arena.

Use it when your mod owns the game rules while Nexori owns the infrastructure around the match: active match identity, launch context, placement readiness, local match completion, return-to-lobby, and optional backend result reporting.

::: tip Current recommended path
For new rules mods, use `setPlayerOutcome(...)` during the match, optionally call `closeMatchAdmission(...)` when late joins should stop, then call `submitFinalMatchResult(...)` once the match is complete. Keep player return separate with `returnPlayerToLobby(...)`.
:::

## Public Surface

The supported package is:

```java
io.github.hyjn.nexori.plugin.api.minigame
```

The live API instance is exposed from:

```java
NexoriPlugin#getMinigameApi()
```

Treat services outside the public API package as Nexori internals. Queue services, travel services, backend services, arena runtime classes, and UI classes are implementation details.

## Sections

| Page | Use it for |
| --- | --- |
| [Methods](/public-api/methods) | Method signatures, arguments, return types, short usage notes, and small snippets. |
| [Recommended Flow](/public-api/recommended-flow) | How a minigame should detect ownership, wait for placement, run logic, submit results, and return players. |
| [Rules Mod Ownership](/concepts/rules-mod-ownership) | The deeper separation between Nexori, the rules mod, and the backend. |

## Integration Model

Nexori and the rules mod should divide responsibilities cleanly.

| Layer | Responsibility |
| --- | --- |
| Nexori | Queue handoff, secure travel, arena identity, placement readiness, local match completion, return-to-lobby, backend result transport. |
| Rules mod | Game logic, objectives, scoring, win/loss decisions, spectator decisions, mode-specific stats, final custom result data. |
| Backend | Optional matchmaking, ratings, rankings, tournaments, leaderboards, player history. |

## Setup

### Runtime Dependency

Declare Nexori as a runtime plugin dependency in your `manifest.json`.

```json
{
  "Dependencies": {
    "Nexori:NexoriPlugin": "*"
  }
}
```

### Compile Dependency

Your mod also needs Nexori's public Java types at compile time. Use `compileOnly` so the server-provided Nexori plugin remains the runtime source.

```groovy
dependencies {
    implementation(files("$hytaleHome/install/$patchline/package/game/latest/Server/HytaleServer.jar"))
    compileOnly(files("/path/to/nexori-plugin.jar"))
}
```

### Resolve The API

Resolve the Nexori plugin once during setup, then pass `NexoriMinigameApi` into your gameplay services.

```java
import com.hypixel.hytale.common.plugin.PluginIdentifier;
import com.hypixel.hytale.server.core.plugin.PluginBase;
import com.hypixel.hytale.server.core.plugin.PluginManager;
import io.github.hyjn.nexori.plugin.NexoriPlugin;
import io.github.hyjn.nexori.plugin.api.minigame.NexoriMinigameApi;

final class NexoriMinigameApiLocator {

    private static final PluginIdentifier NEXORI_PLUGIN_ID =
        new PluginIdentifier("Nexori", "NexoriPlugin");

    static NexoriMinigameApi resolve() {
        PluginBase plugin = PluginManager.get().getPlugin(NEXORI_PLUGIN_ID);
        if (!(plugin instanceof NexoriPlugin nexoriPlugin)) {
            throw new IllegalStateException("Could not resolve Nexori plugin " + NEXORI_PLUGIN_ID + ".");
        }
        return nexoriPlugin.getMinigameApi();
    }
}
```

## Companion Projects

The practical references are:

- `nexori-minigame-template`: clean starter shape for a new Nexori-compatible minigame mod.
- `nexori-public-api-demo`: working Mid Capture demo that uses the current API.
