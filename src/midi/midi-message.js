export const Status = Object.freeze({
	NOTE_OFF: 0x08,
	NOTE_ON: 0x09,
	NOTE_AFTER_TOUCH: 0x0A,
	CONTROL_CHANGE: 0x0B,
	PROGRAM_CHANGE: 0x0C,
	CHANNEL_AFTER_TOUCH: 0x0D,
	PITCH_BEND: 0x0E,
	SYSEX_MESSAGE: 0XF0,
});


export function isNote(message) {
	return message && (message.status === Status.NOTE_ON || message.status === Status.NOTE_OFF);
}

export function isControlChange(message) {
	return message && (message.status === Status.CONTROL_CHANGE);
}

export function Note(data, channel) {
	return {
		data: {
			value: data.getUint8(1),
			velocity: data.getUint8(2),
			channel,
		}
	};
}

export function NoteOn(data, channel) {
	return {
		...Note(data, channel),
		status: Status.NOTE_ON
	};
}

export function NoteOff(data, channel) {
	return {
		...Note(data, channel),
		status: Status.NOTE_OFF
	};
}

export function NoteAfterTouch(data, channel) {
	return {
		status: Status.NOTE_AFTER_TOUCH,
		data: {
			note: data.getUint8(0),
			value: data.getUint8(1),
			channel,
		},
	};
}

export function ControlChange(data, channel) {
	return {
		status: Status.CONTROL_CHANGE,
		data: {
			control: data.getUint8(1),
			value: data.getUint8(2),
			channel,
		},
	};
}

export function ProgramChange(data, channel) {
	return {
		status: Status.PROGRAM_CHANGE,
		data: {
			value: data.getUint8(0),
			channel,
		},
	};
}

export function ChannelAfterTouch(data, channel) {
	return {
		status: Status.CHANNEL_AFTER_TOUCH,
		data: {
			value: data.getUint8(offset),
			channel,
		},
	};
}

export function PitchBend(data, channel) {
	return { // FIXME (check spec. )
		status: Status.PITCH_BEND,
		b1: data.getUint8(0),
		b2: data.getUint8(offset),
		channel,
	};
}

export function MidiMessage(data, offset = 0) { /* eslint-disable no-param-reassign */
	const status = data.getUint8(offset) >> 4;
	const channel = (data.getUint8(offset) & 0XF) + 1;

	switch (status) {
		case Status.NOTE_ON: return NoteOn(data, channel);
		case Status.NOTE_OFF: return NoteOff(data, channel);
		case Status.NOTE_AFTER_TOUCH: return NoteAfterTouch(data, channel);
		case Status.CONTROL_CHANGE: return ControlChange(data, channel);
		case Status.PROGRAM_CHANGE: return ProgramChange(data, channel);
		case Status.CHANNEL_AFTER_TOUCH: return ChannelAfterTouch(data, channel);
		case Status.PITCH_BEND: return PitchBend(data, channel);
		// ignore unknown running status
	}
}
