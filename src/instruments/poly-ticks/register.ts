import { pluginRegistry } from "../../core/plugin-registry";
import { SynthController } from "./synth-controller";
import "./ui/poly-ticks-element";
import "./ui/panels/oscillator/wave-selector-element";
import "./ui/panels/oscillator/oscillator-element";
import "./ui/panels/oscillator-mix/oscillator-mix";
import "./ui/panels/filter/filter-element";
import "./ui/panels/filter/filter-selector-element";
import "./ui/panels/envelope/envelope-element";
import "./ui/panels/lfo/lfo-element";
import "./ui/panels/lfo/lcd-selector-element";
import "./ui/panels/filter-mod/filter-envelope-element";

pluginRegistry.register({
  descriptor: {
    id: "poly-ticks",
    name: "POLY TICKS",
    tag: "wasm-poly-element",
    type: "instrument",
  },
  controllerFactory: (ctx) => new SynthController(ctx),
  elementTag: "wasm-poly-element",
  workletModules: ["synth-processor.js"],
});
