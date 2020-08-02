import { MidiControlID } from "./midi-learn-options";

export interface MidiController {
  setChannel(channel: number);
  setMidiLearnerID(id: MidiControlID);
  mapControl(midiControl: number, id: MidiControlID);
}
