/*
 * Copyright (C) 2020 Antoine CORDIER
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *         http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export function times(op, length) {
  return Array.from({ length }).map((_, i) => op(i));
}

export function isMetaEvent(data, offset) {
  return 0xff === data.getUint8(offset);
}

export function isSysexMessage(data, offset) {
  const value = data.getUint8(offset);
  return 0xf0 === value || 0xf7 === value;
}

/**
 * Assert variable length quantity property [Most Significant bit = 0]
 */
export function isVariableLengthQuantityDelimiter(value) {
  return 0 === (0x80 & value);
}

export function getVariableLengthQuantity(data, offset) {
  /* eslint-disable no-plusplus */
  let [val, currentByteValue] = [0, 0];
  for (let i = 0; i < 4; i++) {
    currentByteValue = data.getUint8(offset + i);
    if (isVariableLengthQuantityDelimiter(currentByteValue)) {
      return {
        value: val + currentByteValue,
        next: offset + i + 1,
      };
    }
    val += currentByteValue & 0x7f;
    val <<= 7;
  }
  throw new RangeError("4 bytes variable length value limit exceeded");
}

export function isEof(data, offset) {
  return offset >= data.byteLength;
}

export function getString(data, offset, length) {
  return times(
    (i) => String.fromCharCode(data.getUint8(offset + i)),
    length
  ).join("");
}

export function isNewTrack(data, offset) {
  return "MTrk" === getString(data, offset, 4);
}

export function getBytes(data, offset, length) {
  return times((i) => data.getUint8(offset + i), length);
}

export function isRunningStatus(data, offset) {
  return 0 !== (data.getUint8(offset) & 0x80);
}
