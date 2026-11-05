import { pluginRegistry } from "../../core/plugin-registry";
import { VerbController } from "./verb-controller";
import "./ui/verb-element";

// The first worklet-flavoured effect (item 8): the FDN lives in
// verb-processor.js, served through vite's workletFiles map and loaded by
// the shell (addWorkletModuleOnce) before the factory runs. Params travel
// the node's port as raw 0..127 — not SharedParamBuffer, which is the
// instrument contract.
pluginRegistry.register({
  descriptor: {
    id: "verb",
    name: "VERB",
    kind: "effect",
    accent: "var(--verb-accent)",
    type: "instrument",
  },
  controllerFactory: (audioContext: AudioContext) => new VerbController(audioContext),
  elementTag: "verb-element",
  workletModules: ["verb-processor.js"],
});
