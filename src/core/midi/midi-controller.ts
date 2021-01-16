import { MidiOmniChannel } from "./midi-channels";
import { newMidiMessage, isControlChange, Status } from "./midi-message";
import { Dispatcher } from "../dispatcher";
import { MidiMessage, MidiMessageEvent } from "../../types/midi-message";
import { MidiControlID } from "../../types/midi-learn-options";
import { MidiController } from "../../types/midi-controller";

interface NavigatorWithMidi extends Navigator {
  requestMIDIAccess?: Function;
}

export async function createMidiController(channel = MidiOmniChannel): Promise<MidiController & Dispatcher> {
  const midiNavigator = navigator as NavigatorWithMidi;
  const midiDispatcher = new Dispatcher();
  const controlMap = new Map<number, MidiControlID>();

  let midiAccess;
  let currentLearnerID = MidiControlID.NONE;
  let currentChannel = channel;

  if (!midiNavigator.requestMIDIAccess) {
    return Promise.reject("MIDI is not supported");
  }

  try {
    midiAccess = await midiNavigator.requestMIDIAccess();
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
