import { MidiControlID } from "./midi-learn-options";

export interface MidiController {
  setCurrentChannel: (channel: number) => void;
  setCurrentLearnerID: (id: MidiControlID) => void;
  mapControl(midiControl: number, id: MidiControlID);
}
