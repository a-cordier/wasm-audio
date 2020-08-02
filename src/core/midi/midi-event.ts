import { newMidiMessage } from "./midi-message";
import { MetaEvent } from "./meta-event";
import {
  isMetaEvent,
  isSysexMessage,
  getVariableLengthQuantity,
} from "./midi-util";
import { SysexMessage } from "./sysex-message";

export function MidiEvent(data, offset) {
  /* eslint-disable no-param-reassign */
  const deltaTime = getVariableLengthQuantity(data, offset);
  const event = {
    delta: deltaTime.value,
  };
  offset = deltaTime.next;
  if (isMetaEvent(data, offset)) {
    return Object.assign(MetaEvent(data, offset), event);
  }
  if (isSysexMessage(data, offset)) {
    // throw new Error('Sysex messages are not implemented yet')
    return SysexMessage(data, offset);
  }
  return Object.assign(newMidiMessage(data, offset), event);
}
