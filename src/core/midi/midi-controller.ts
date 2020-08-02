import { MidiOmniChannel } from "./midi-channels";
import {
  newMidiMessage,
  isNote,
  isControlChange,
  Status,
} from "./midi-message";
import { Dispatcher } from "../dispatcher";
import { MidiMessage, MidiMessageEvent } from "../../types/midi-message";
import { MidiControlID } from "../../types/midi-learn-options";
import { MidiController } from "../../types/midi-controller";

interface NavigatorWithMidi extends Navigator {
  requestMIDIAccess?: Function;
}

export async function createMidiController(
  channel = MidiOmniChannel
): Promise<MidiController & Dispatcher> {
  const midiNavigator = navigator as NavigatorWithMidi;
  const midiDispatcher = new Dispatcher();
  const controlMap = new Map<number, MidiControlID>();

  let midiAccess;
  let midiChannel = channel;
  let midiLearnerID = MidiControlID.NONE;

  if (!midiNavigator.requestMIDIAccess) {
    return Promise.reject("MIDI is not supported, returning a noop dispatcher");
  }

  try {
    midiAccess = await midiNavigator.requestMIDIAccess();
  } catch (error) {
    return Promise.reject(
      "Error requesting MIDI access, returning a noop dispatcher"
    );
  }

  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = (message) => {
      const midiMessage = newMidiMessage(new DataView(message.data.buffer));
      dispatchMessageIfNeeded(midiMessage);
    };
  }

  function dispatchMessageIfNeeded(message: Partial<MidiMessage>) {
    const channel = message.data.channel;
    if (channel !== midiChannel && midiChannel !== MidiOmniChannel) {
      return;
    }
    if (message.status === Status.NOTE_ON) {
      midiDispatcher.dispatch(MidiMessageEvent.NOTE_ON, message);
    }
    if (message.status === Status.NOTE_OFF) {
      midiDispatcher.dispatch(MidiMessageEvent.NOTE_OFF, message);
    }
    if (isControlChange(message)) {
      dispatchControlChangeMessage(message);
    }
  }

  function dispatchControlChangeMessage(message: Partial<MidiMessage>) {
    message.isMidiLearning = midiLearnerID !== MidiControlID.NONE;
    message.controlID = controlMap.get(message.data.control);
    if (message.isMidiLearning) {
      message.controlID = midiLearnerID;
    }
    midiDispatcher.dispatch(MidiMessageEvent.CONTROL_CHANGE, message);
  }

  return Object.assign(midiDispatcher, {
    setChannel(channel: number) {
      midiChannel = channel;
    },
    setMidiLearnerID(id: MidiControlID) {
      midiLearnerID = id;
    },
    mapControl(midiControl: number, id: MidiControlID) {
      controlMap.set(midiControl, id);
      midiLearnerID = MidiControlID.NONE;
    },
  });
}
