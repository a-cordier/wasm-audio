import { getBytes, getVariableLengthQuantity } from './utils';

export function SysexMessage(data, offset) { /* eslint-disable no-param-reassign */
	offset += 1;
	const length = getVariableLengthQuantity(data, offset);
	offset = length.next;
	const dataBytes = getBytes(data, offset, length.value);
	offset += length.value;
	return {
		type: 0xF0,
		data: dataBytes,
		next: offset,
	};
}
