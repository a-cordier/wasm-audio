import { pluginRegistry } from "../../core/plugin-registry";
import { SongController } from "./song-controller";
import "./ui/song-element";

// The song-mode module (item 7): scenes + chain over the master transport —
// a control-plane device like MOTION (no audio, no MIDI, no mixer channel).
// It drives sequencers' patterns and mutes through the PatternAddressable
// capability, frame-targeted so every scene change lands on the bar. Absent
// in live mode by default: it does nothing until mounted.
pluginRegistry.register({
  descriptor: {
    id: "song",
    name: "SONG",
    kind: "module",
    accent: "var(--song-accent)",
    type: "control",
  },
  controllerFactory: (audioContext: AudioContext) => new SongController(audioContext),
  elementTag: "song-element",
  workletModules: ["song-processor.js"],
});
