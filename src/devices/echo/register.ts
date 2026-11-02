import { pluginRegistry } from "../../core/plugin-registry";
import { EchoController } from "./echo-controller";
import "./ui/echo-element";

// The minimal send/return delay — proves the mixer's effect-loop plumbing
// (item 5). The full effects suite is item 8. Native nodes only: no
// workletModules, no build step, nothing to add to vite's workletFiles.
pluginRegistry.register({
  descriptor: {
    id: "echo",
    name: "ECHO",
    kind: "effect",
    accent: "var(--echo-accent)",
    type: "instrument",
  },
  controllerFactory: (audioContext: AudioContext) => new EchoController(audioContext),
  elementTag: "echo-element",
});
