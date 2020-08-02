export class Dispatcher extends EventTarget {
  private observers = new Map<Function, EventListenerOrEventListenerObject>();

  dispatch(actionId: string, detail: any) {
    this.dispatchEvent(new CustomEvent(actionId, { detail }));
    return this;
  }

  subscribe(actionId: string, callback: (detail: any) => void) {
    const observer = (event: CustomEvent) => {
      callback(event.detail);
    };
    this.observers.set(callback, observer);
    this.addEventListener(actionId, observer);
    return this;
  }

  unsubscribe(actionId: string, callback: (detail: any) => void) {
    this.removeEventListener(actionId, this.observers.get(callback));
    this.observers.delete(callback);
    return this;
  }
}

export const GlobalDispatcher = new Dispatcher();
