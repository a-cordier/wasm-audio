export enum DispatcherEvent {
  SHOULD_MIDI_LEARN = "SHOULD_MIDI_LEARN",
  NEW_MIDI_LEARNER = "NEW_MIDI_LEARNER",
}

export class Dispatcher extends EventTarget {
  dispatch(actionId: DispatcherEvent, detail: any) {
    this.dispatchEvent(new CustomEvent(actionId, { detail }));
  }

  subscribe(actionId: DispatcherEvent, callback: (event: CustomEvent) => void) {
    this.addEventListener(actionId, callback);
  }
}

export const GlobalDispatcher = new Dispatcher();
