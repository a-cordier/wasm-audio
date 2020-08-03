import { MidiControlID } from "./midi-learn-options";

export interface MidiController {
  currentChannel: number;
  currentLearnerID: MidiControlID;
  mapControl(midiControl: number, id: MidiControlID);
}
