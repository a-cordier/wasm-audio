import { times } from "./midi-util";

function strPad(n: number): string {
  return `CHANNEL:${n < 10 ? `0${n}` : `${n}`}`;
}

function channel(value: number, name = strPad(value + 1)) {
  return { value, name };
}

const length = 16; // max number of Midi channels

const MidiChannels = times(channel, length);
const MidiOmniChannel = -1;
MidiChannels.unshift(channel(MidiOmniChannel, "CHANNEL:ALL"));

export { MidiChannels, MidiOmniChannel };
