interface NavigatorWithMidi extends Navigator {
  requestMIDIAccess?: Function;
}

function onMidiSuccess(midiAccess, midiMessageHandler) {
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = midiMessageHandler;
  }
}

export async function createMidiController(midiMessageHandler) {
  const nav = navigator as NavigatorWithMidi;

  if (!nav.requestMIDIAccess) {
    return null;
  }

  try {
    const midiAccess = await nav.requestMIDIAccess();
    onMidiSuccess(midiAccess, midiMessageHandler);
  } catch (error) {
    return null;
  }
}
