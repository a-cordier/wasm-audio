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
import { MidiOmniChannel } from "./midi-channels";
import { newMidiMessage, isControlChange, Status } from "./midi-message";
import { Dispatcher } from "../dispatcher";
import { MidiMessage, MidiMessageEvent } from "../../types/midi-message";
import { MidiControlID } from "../../types/midi-learn-options";
import { MidiController } from "../../types/midi-controller";

export async function createMidiController(channel = MidiOmniChannel): Promise<MidiController & Dispatcher> {
  const midiDispatcher = new Dispatcher();
  const controlMap = new Map<number, MidiControlID>();

  let midiAccess;
  let currentLearnerID = MidiControlID.NONE;
  let currentChannel = channel;

  if (!navigator.requestMIDIAccess) {
    return Promise.reject("MIDI is not supported");
  }

  try {
    midiAccess = await navigator.requestMIDIAccess();
  } catch (error) {
    return Promise.reject("Error requesting MIDI access");
  }

  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = (message) => {
      const midiMessage = newMidiMessage(new DataView(message.data.buffer));
      dispatchMessageIfNeeded(midiMessage);
    };
  }

  function dispatchMessageIfNeeded(message: Partial<MidiMessage>) {
    if (!message) {
      return;
    }

    const messageChannel = message.data.channel;

    if (isControlChange(message)) {
      return dispatchControlChangeMessage(message);
    }

    if (messageChannel !== currentChannel && currentChannel !== MidiOmniChannel) {
      return;
    }

    if (message.status === Status.NOTE_ON) {
      midiDispatcher.dispatch(MidiMessageEvent.NOTE_ON, message);
    }

    if (message.status === Status.NOTE_OFF) {
      midiDispatcher.dispatch(MidiMessageEvent.NOTE_OFF, message);
    }
  }

  function dispatchControlChangeMessage(message: Partial<MidiMessage>) {
    message.isMidiLearning = currentLearnerID !== MidiControlID.NONE;
    message.controlID = controlMap.get(message.data.control);
    if (message.isMidiLearning) {
      message.controlID = currentLearnerID;
    }
    midiDispatcher.dispatch(MidiMessageEvent.CONTROL_CHANGE, message);
  }

  return Object.assign(midiDispatcher, {
    setCurrentChannel(channel: number) {
      currentChannel = channel;
    },
    setCurrentLearnerID(id: MidiControlID) {
      currentLearnerID = id;
    },
    mapControl(midiControl: number, id: MidiControlID) {
      controlMap.delete(midiControl);
      controlMap.set(midiControl, id);
      currentLearnerID = MidiControlID.NONE;
    },
  });
}
