import { MidiMessage } from './midi-message';
import { MetaEvent } from './meta-event';
import { isMetaEvent, isSysexMessage, getVariableLengthQuantity } from './utils';
import { SysexMessage } from './sysex-messages';

export function MidiEvent(data, offset) { /* eslint-disable no-param-reassign */
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
	return Object.assign(MidiMessage(data, offset), event);
}
