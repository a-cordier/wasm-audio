import { pluginRegistry } from "../../core/plugin-registry";
import { SequencerController } from "./sequencer-controller";
import "./ui/sequels-element";
import "./ui/panels/sequencer-toolbar";
import "./ui/panels/step-grid-panel";

pluginRegistry.register({
  descriptor: {
    id: "sequels",
    name: "SEQUELS",
    tag: "sequencer-element",
    type: "midi-source",
  },
  controllerFactory: (ctx) => new SequencerController(ctx),
  elementTag: "sequencer-element",
  workletModules: ["seq-processor.js"],
});
