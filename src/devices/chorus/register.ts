import { pluginRegistry } from "../../core/plugin-registry";
import { ChorusController } from "./chorus-controller";
import "./ui/chorus-element";

// Wet-only doubling for the effect loops (item 8). Native nodes only: no
// workletModules, no build step, nothing to add to vite's workletFiles.
pluginRegistry.register({
  descriptor: {
    id: "chorus",
    name: "CHORUS",
    kind: "effect",
    accent: "var(--chorus-accent)",
    type: "instrument",
  },
  controllerFactory: (audioContext: AudioContext) => new ChorusController(audioContext),
  elementTag: "chorus-element",
});
