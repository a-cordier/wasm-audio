import { pluginRegistry } from "../../core/plugin-registry";
import { MonologController } from "./monolog-controller";
import "./ui/monolog-element";

pluginRegistry.register({
  descriptor: {
    id: "monolog",
    name: "MONOLOG",
    kind: "instrument",
    accent: "var(--monolog-accent)",
    type: "instrument",
  },
  controllerFactory: (ctx) => new MonologController(ctx),
  elementTag: "monolog-element",
  workletModules: ["monolog-processor.js"],
  keyboardOctaveShift: -12,
});
