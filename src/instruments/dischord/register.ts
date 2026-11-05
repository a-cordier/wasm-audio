import { pluginRegistry } from "../../core/plugin-registry";
import { DischordController } from "./dischord-controller";
import "./ui/dischord-element";
import "./ui/panels/dischord-toolbar";

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
