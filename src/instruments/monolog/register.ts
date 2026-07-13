import { pluginRegistry } from "../../core/plugin-registry";
import { MonologController } from "./monolog-controller";
import "./ui/monolog-element";

pluginRegistry.register({
  descriptor: {
    id: "monolog",
    name: "MONOLOG",
    tag: "monolog-element",
    type: "instrument",
  },
  controllerFactory: (ctx) => new MonologController(ctx),
  elementTag: "monolog-element",
  workletModules: ["monolog-processor.js"],
  keyboardOctaveShift: -12,
});
