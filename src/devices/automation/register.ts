import { pluginRegistry } from "../../core/plugin-registry";
import { AutomationController } from "./automation-controller";
import "./ui/automation-element";

// The first kind:"module" device (item 6): a control-signal source with no
// audio and no MIDI — type "control" keeps it off the mixer, the MIDI
// channel map, and the sequencer's default-target lookup. It writes to other
// devices' learnable params through the ParamDirectory.
pluginRegistry.register({
  descriptor: {
    id: "automation",
    name: "MOTION",
    kind: "module",
    accent: "var(--automation-accent)",
    type: "control",
  },
  controllerFactory: (audioContext: AudioContext) => new AutomationController(audioContext),
  elementTag: "automation-element",
  workletModules: ["automation-processor.js"],
});
