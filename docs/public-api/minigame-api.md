# Minigame API

The Nexori Minigame API is the supported integration surface for gameplay and rules mods running inside a Nexori-managed arena.

Use it when your mod owns the game rules while Nexori owns the infrastructure around the match: active match identity, launch context, initial placement/start gate, local AFK runtime state, local match completion, return-to-lobby, and optional backend result reporting.

::: tip Integration shape
Soft-dependent rules mods can use lifecycle callbacks to create/attach local sessions, publish private minigame events from the gameplay core, and translate those events to Nexori commands from a separate integration layer.
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

Third-party minigames integrate with Nexori through the public `nexori-api` artifact. The API gives the rules mod the lifecycle events, match snapshots, player state operations, and result submission methods it needs, while the installed Nexori plugin handles the runtime behavior on the server.

In practice, your minigame should compile against `nexori-api` and expect `nexori-plugin` to be present on the server at runtime.

## Sections

| Page | Use it for |
| --- | --- |
| [Integrating Third-Party Minigames](/public-api/integrating-third-party-minigames) | Callbacks, private minigame events, optional adapter, and soft dependency. |
| [Methods](/public-api/methods) | Method signatures, arguments, return types, short usage notes, and small snippets. |
| [Recommended Flow](/public-api/recommended-flow) | Command/result flow and ownership gates for direct or adapter-based integrations. |
| [Javadoc Reference](/public-api/generated-reference) | Generated Javadoc for exact Java classes, records, enums, and method signatures. |

## Integration Model

Nexori and the rules mod should divide responsibilities cleanly.

| Layer | Responsibility |
| --- | --- |
| Nexori | Queue handoff, secure travel, arena identity, initial placement/start gate, local AFK activity snapshots, local match completion, return-to-lobby, backend result transport. |
| Rules mod | Game logic, objectives, scoring, win/loss decisions, spectator decisions, mode-specific stats, final custom result data. |
| Backend | Optional matchmaking, ratings, rankings, tournaments, leaderboards, player history. |

## Setup

### Runtime Dependency

If your minigame uses direct Nexori imports from the core, declare Nexori as a runtime plugin dependency in your `manifest.json`.

```json
{
  "Dependencies": {
    "Nexori:NexoriPlugin": "*"
  }
}
```

For optional integration, put Nexori in `OptionalDependencies` instead and load your adapter by reflection.

```json
{
  "OptionalDependencies": {
    "Nexori:NexoriPlugin": "*"
  }
}
```

### Compile Dependency

Your mod also needs Nexori's public Java types at compile time. Use `compileOnly` so the server-provided Nexori plugin remains the runtime source.

```groovy
repositories {
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
}

dependencies {
    implementation(files("$hytaleHome/install/$patchline/package/game/latest/Server/HytaleServer.jar"))
    compileOnly("com.github.hyjn-nexori:nexori-api:v2.5.0")
}
```

Developers compile against `nexori-api` v2.5.0 through JitPack. Server owners install the full `nexori-plugin.jar` from CurseForge. Do not install `nexori-api.jar` as a server mod, do not use `implementation`, and do not shade or bundle `nexori-api` inside your minigame jar. The installed Nexori plugin provides the API classes at runtime.

### Resolve The API

In the direct dependency pattern, resolve the Nexori plugin once during setup, then pass `NexoriMinigameApi` into your gameplay services.

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

In the optional pattern, keep this locator inside your Nexori adapter package. Your plugin entry point and gameplay core should not import Nexori classes.

## Companion Projects

The practical references are:

- `nexori-minigame-template`: clean starter shape for a soft-dependent Nexori-compatible minigame mod.
- `nexori-capture-the-zone-minigame`: Capture The Zone demo that uses callbacks, private events, and an optional Nexori integration layer.
