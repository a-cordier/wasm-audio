import { pluginRegistry } from "../../core/plugin-registry";
import { DriveController } from "./drive-controller";
import "./ui/drive-element";

// Parallel saturation for the effect loops (item 8). Native nodes only: no
// workletModules, no build step, nothing to add to vite's workletFiles.
pluginRegistry.register({
  descriptor: {
    id: "drive",
    name: "DRIVE",
    kind: "effect",
    accent: "var(--drive-accent)",
    type: "instrument",
  },
  controllerFactory: (audioContext: AudioContext) => new DriveController(audioContext),
  elementTag: "drive-element",
});
