import { MidiControlID } from "./midi-learn-options";

interface MidiMessageData {
  channel: number;
  value: number;
  control?: number;
  velocity?: number;
}

export interface MidiMessage {
  status: number;
  data: MidiMessageData;
  isMidiLearning: boolean;
  controlID: MidiControlID | undefined;
}

export enum MidiMessageEvent {
  NOTE_ON = "NOTE_ON",
  NOTE_OFF = "NOTE_OFF",
  NOTE_CHANGE = "NOTE_CHANGE",
  CONTROL_CHANGE = "CONTROL_CHANGE",
}
