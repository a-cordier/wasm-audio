import { pluginRegistry } from "../../core/plugin-registry";
import { AudioInController } from "./audio-in-controller";
import "./ui/audio-in-element";

// Audio input as a device (item 5): getUserMedia behind the standard
// getOutputNode(), mounting/routing/persisting like everything else.
// Native nodes only: no workletModules, nothing in vite's workletFiles.
pluginRegistry.register({
  descriptor: {
    id: "audio-in",
    name: "AUDIO IN",
    kind: "input",
    accent: "var(--audio-in-accent)",
    type: "instrument",
  },
  controllerFactory: (audioContext: AudioContext) => new AudioInController(audioContext),
  elementTag: "audio-in-element",
});
