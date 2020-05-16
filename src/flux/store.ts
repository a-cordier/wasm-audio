class Flux extends EventTarget {
  dispatch(actionId: string, detail: any) {
    this.dispatchEvent(new CustomEvent(actionId, { detail }));
  }

  subscribe(actionId: string, callback: (event: CustomEvent) => void) {
    this.addEventListener(actionId, callback);
  }
}
