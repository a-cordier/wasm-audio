import { pluginRegistry } from "../../core/plugin-registry";
import { DischordController } from "./dischord-controller";
import "./ui/dischord-element";
import "./ui/panels/dischord-toolbar";
import "./ui/panels/chord-selector-panel";
import "./ui/panels/harmony-panel";
import "./ui/panels/chord-grid-panel";

pluginRegistry.register({
  descriptor: {
    id: "dischord",
    name: "DISCHORD",
    kind: "sequencer",
    accent: "var(--dischord-accent)",
    type: "midi-source",
  },
  controllerFactory: (ctx) => new DischordController(ctx),
  elementTag: "dischord-element",
  workletModules: ["dischord-processor.js"],
});
