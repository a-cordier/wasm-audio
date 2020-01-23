export function times(op, length) {
	return Array.from({ length }).map((_, i) => op(i));
}

export function isMetaEvent(data, offset) {
	return 0xFF === data.getUint8(offset);
}

export function isSysexMessage(data, offset) {
	const value = data.getUint8(offset);
	return 0xF0 === value || 0xF7 === value;
}

/**
 * Assert variable length quantity property [Most Significant bit = 0]
 */
export function isVariableLengthQuantityDelimiter(value) {
	return 0 === (0x80 & value);
}

export function getVariableLengthQuantity(data, offset) { /* eslint-disable no-plusplus */
	let [val, currentByteValue] = [0, 0];
	for (let i = 0; i < 4; i++) {
		currentByteValue = data.getUint8(offset + i);
		if (isVariableLengthQuantityDelimiter(currentByteValue)) {
			return {
				value: val + currentByteValue,
				next: offset + i + 1,
			};
		}
		val += (currentByteValue & 0x7f);
		val <<= 7;
	}
	throw new RangeError('4 bytes variable length value limit exceeded');
}

export function isEof(data, offset) {
	return offset >= data.byteLength;
}

export function getString(data, offset, length) {
	return times(i => String.fromCharCode(data.getUint8(offset + i)), length).join('');
}

export function isNewTrack(data, offset) {
	return 'MTrk' === getString(data, offset, 4);
}

export function getBytes(data, offset, length) {
	return times(i => data.getUint8(offset + i), length);
}

export function isRunningStatus(data, offset) {
	return 0 !== (data.getUint8(offset) & 0x80);
}
