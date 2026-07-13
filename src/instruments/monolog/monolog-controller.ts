import { MonologNode, OscModeToCpp } from "./monolog-node";
import { MonologParamId } from "./types/monolog-params";
import { MonologState, createMonologState } from "./types/monolog-state";
import { MonologEvent } from "./types/monolog-event";
import { MonologPresetOptions } from "./presets";
import { MidiEvent, MidiTarget } from "../../midi/types";
import { noteFrequency } from "../../midi/codec/notes";
import { isNoteOn, isNoteOff } from "../../midi/codec/decode";
import { ControlID } from "../../control/types";
import { InstrumentPlugin, PluginDescriptor, Learnable, HasPresets, LearnableParam, PresetEntry } from "../../core/types";

type ControlHandler = (value: number) => void;

export class MonologController extends EventTarget implements InstrumentPlugin, MidiTarget, Learnable, HasPresets {
  readonly descriptor: PluginDescriptor = {
    id: "monolog",
    name: "MONOLOG",
    tag: "monolog-element",
    type: "instrument",
  };

  private node: MonologNode | null = null;
  private output: GainNode;
  private audioContext: AudioContext;
  private state: MonologState;
  private controlHandlers = new Map<ControlID, ControlHandler>();

  constructor(audioContext: AudioContext) {
    super();
    this.audioContext = audioContext;
    this.output = new GainNode(audioContext);
    this.state = createMonologState(
      MonologPresetOptions.getCurrent().value as MonologState
    );
    this.initControlHandlers();
  }

  init() {
    this.node = new MonologNode(this.audioContext);
    this.node.connect(this.output);
    this.syncParams();
  }

  connectAudio(destination: AudioNode): void {
    this.output.connect(destination);
  }

  disconnectAudio(): void {
    this.output.disconnect();
  }

  loadState(state: unknown): void {
    if (state) this.setState(state);
  }

  dispose(): void {
    this.output.disconnect();
    this.node = null;
  }

  receive(event: MidiEvent): void {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    if (isNoteOn(event)) {
      const frequency = noteFrequency(event.data1);
      this.node?.noteOn(event.data1, frequency, event.data2);
      this.dispatch(MonologEvent.NOTE_ON, {
        midiValue: event.data1,
        frequency,
        velocity: event.data2,
      });
    } else if (isNoteOff(event)) {
      this.node?.noteOff(event.data1);
      this.dispatch(MonologEvent.NOTE_OFF, { midiValue: event.data1 });
    }
  }

  handleControlChange(controlId: ControlID, value: number) {
    const handler = this.controlHandlers.get(controlId);
    if (handler) handler(value);
  }

  getState() {
    return { ...this.state };
  }

  setState(newState: unknown) {
    this.state = createMonologState(newState as Partial<MonologState>);
    this.syncParams();
    this.notifyStateChange();
    return this.getState();
  }

  getLearnableParams(): LearnableParam[] {
    return [
      ControlID.ML_CUTOFF, ControlID.ML_RESONANCE, ControlID.ML_DRIVE,
      ControlID.ML_SUB_LEVEL, ControlID.ML_NOISE_LEVEL, ControlID.ML_PW,
      ControlID.ML_AMP_ATTACK, ControlID.ML_AMP_DECAY, ControlID.ML_AMP_SUSTAIN, ControlID.ML_AMP_RELEASE,
      ControlID.ML_FLT_ATTACK, ControlID.ML_FLT_DECAY, ControlID.ML_FLT_AMOUNT, ControlID.ML_FLT_VELOCITY,
      ControlID.ML_LFO_RATE, ControlID.ML_LFO_AMOUNT,
      ControlID.ML_GLIDE,
    ].map((id) => ({ id, name: ControlID[id].replace(/^ML_/, "").replace(/_/g, " ") }));
  }

  getFactoryPresets(): PresetEntry[] {
    return MonologPresetOptions.map((o: { name: string; value: unknown }) => ({
      name: o.name,
      state: o.value,
    })) as PresetEntry[];
  }

  // --- Param setters ---

  setOscMode(mode: number) {
    this.state.osc.mode.value = mode;
    this.sendParam(MonologParamId.OSC_MODE, OscModeToCpp[mode]);
    this.dispatch(MonologEvent.OSC, { ...this.state.osc });
  }

  setPulseWidth(value: number) {
    this.state.osc.pulseWidth.value = value;
    this.sendParam(MonologParamId.PULSE_WIDTH, value);
    this.dispatch(MonologEvent.OSC, { ...this.state.osc });
  }

  setSubLevel(value: number) {
    this.state.osc.subLevel.value = value;
    this.sendParam(MonologParamId.SUB_LEVEL, value);
    this.dispatch(MonologEvent.OSC, { ...this.state.osc });
  }

  setNoiseLevel(value: number) {
    this.state.osc.noiseLevel.value = value;
    this.sendParam(MonologParamId.NOISE_LEVEL, value);
    this.dispatch(MonologEvent.OSC, { ...this.state.osc });
  }

  setCutoff(value: number) {
    this.state.filter.cutoff.value = value;
    this.sendParam(MonologParamId.CUTOFF, value);
    this.dispatch(MonologEvent.FILTER, { ...this.state.filter });
  }

  setResonance(value: number) {
    this.state.filter.resonance.value = value;
    this.sendParam(MonologParamId.RESONANCE, value);
    this.dispatch(MonologEvent.FILTER, { ...this.state.filter });
  }

  setDrive(value: number) {
    this.state.filter.drive.value = value;
    this.sendParam(MonologParamId.DRIVE, value);
    this.dispatch(MonologEvent.FILTER, { ...this.state.filter });
  }

  setAmpAttack(value: number) {
    this.state.ampEnv.attack.value = value;
    this.sendParam(MonologParamId.AMP_ATTACK, value);
    this.dispatch(MonologEvent.AMP_ENV, { ...this.state.ampEnv });
  }

  setAmpDecay(value: number) {
    this.state.ampEnv.decay.value = value;
    this.sendParam(MonologParamId.AMP_DECAY, value);
    this.dispatch(MonologEvent.AMP_ENV, { ...this.state.ampEnv });
  }

  setAmpSustain(value: number) {
    this.state.ampEnv.sustain.value = value;
    this.sendParam(MonologParamId.AMP_SUSTAIN, value);
    this.dispatch(MonologEvent.AMP_ENV, { ...this.state.ampEnv });
  }

  setAmpRelease(value: number) {
    this.state.ampEnv.release.value = value;
    this.sendParam(MonologParamId.AMP_RELEASE, value);
    this.dispatch(MonologEvent.AMP_ENV, { ...this.state.ampEnv });
  }

  setFilterAttack(value: number) {
    this.state.filterEnv.attack.value = value;
    this.sendParam(MonologParamId.FILTER_ATTACK, value);
    this.dispatch(MonologEvent.FILTER_ENV, { ...this.state.filterEnv });
  }

  setFilterDecay(value: number) {
    this.state.filterEnv.decay.value = value;
    this.sendParam(MonologParamId.FILTER_DECAY, value);
    this.dispatch(MonologEvent.FILTER_ENV, { ...this.state.filterEnv });
  }

  setFilterAmount(value: number) {
    this.state.filterEnv.amount.value = value;
    this.sendParam(MonologParamId.FILTER_AMOUNT, value);
    this.dispatch(MonologEvent.FILTER_ENV, { ...this.state.filterEnv });
  }

  setFilterVelocity(value: number) {
    this.state.filterEnv.velocity.value = value;
    this.sendParam(MonologParamId.FILTER_VELOCITY, value);
    this.dispatch(MonologEvent.FILTER_ENV, { ...this.state.filterEnv });
  }

  setLfoMode(mode: number) {
    this.state.lfo.mode.value = mode;
    this.sendParam(MonologParamId.LFO_MODE, OscModeToCpp[mode]);
    this.dispatch(MonologEvent.LFO, { ...this.state.lfo });
  }

  setLfoRate(value: number) {
    this.state.lfo.rate.value = value;
    this.sendParam(MonologParamId.LFO_RATE, value);
    this.dispatch(MonologEvent.LFO, { ...this.state.lfo });
  }

  setLfoAmount(value: number) {
    this.state.lfo.amount.value = value;
    this.sendParam(MonologParamId.LFO_AMOUNT, value);
    this.dispatch(MonologEvent.LFO, { ...this.state.lfo });
  }

  setLfoDestination(dest: number) {
    this.state.lfo.destination.value = dest;
    this.sendParam(MonologParamId.LFO_DESTINATION, dest);
    this.dispatch(MonologEvent.LFO, { ...this.state.lfo });
  }

  setGlide(value: number) {
    this.state.performance.glide.value = value;
    this.sendParam(MonologParamId.GLIDE_TIME, value);
    this.dispatch(MonologEvent.PERFORMANCE, { ...this.state.performance });
  }

  setLegato(value: number) {
    this.state.performance.legato.value = value;
    this.sendParam(MonologParamId.LEGATO, value);
    this.dispatch(MonologEvent.PERFORMANCE, { ...this.state.performance });
  }

  // --- Internal ---

  private dispatch(eventId: string, detail: any) {
    this.dispatchEvent(new CustomEvent(eventId, { detail }));
  }

  subscribe(eventId: string, callback: (detail: any) => void) {
    const handler = (e: Event) => callback((e as CustomEvent).detail);
    this.addEventListener(eventId, handler);
    return this;
  }

  private sendParam(id: number, value: number) {
    this.node?.setParam(id, value);
  }

  private notifyStateChange() {
    this.dispatch(MonologEvent.OSC, { ...this.state.osc });
    this.dispatch(MonologEvent.FILTER, { ...this.state.filter });
    this.dispatch(MonologEvent.AMP_ENV, { ...this.state.ampEnv });
    this.dispatch(MonologEvent.FILTER_ENV, { ...this.state.filterEnv });
    this.dispatch(MonologEvent.LFO, { ...this.state.lfo });
    this.dispatch(MonologEvent.PERFORMANCE, { ...this.state.performance });
  }

  private syncParams() {
    if (!this.node) return;
    const s = this.state;
    this.sendParam(MonologParamId.OSC_MODE, OscModeToCpp[s.osc.mode.value]);
    this.sendParam(MonologParamId.PULSE_WIDTH, s.osc.pulseWidth.value);
    this.sendParam(MonologParamId.SUB_LEVEL, s.osc.subLevel.value);
    this.sendParam(MonologParamId.NOISE_LEVEL, s.osc.noiseLevel.value);
    this.sendParam(MonologParamId.CUTOFF, s.filter.cutoff.value);
    this.sendParam(MonologParamId.RESONANCE, s.filter.resonance.value);
    this.sendParam(MonologParamId.DRIVE, s.filter.drive.value);
    this.sendParam(MonologParamId.AMP_ATTACK, s.ampEnv.attack.value);
    this.sendParam(MonologParamId.AMP_DECAY, s.ampEnv.decay.value);
    this.sendParam(MonologParamId.AMP_SUSTAIN, s.ampEnv.sustain.value);
    this.sendParam(MonologParamId.AMP_RELEASE, s.ampEnv.release.value);
    this.sendParam(MonologParamId.FILTER_ATTACK, s.filterEnv.attack.value);
    this.sendParam(MonologParamId.FILTER_DECAY, s.filterEnv.decay.value);
    this.sendParam(MonologParamId.FILTER_AMOUNT, s.filterEnv.amount.value);
    this.sendParam(MonologParamId.FILTER_VELOCITY, s.filterEnv.velocity.value);
    this.sendParam(MonologParamId.LFO_MODE, OscModeToCpp[s.lfo.mode.value]);
    this.sendParam(MonologParamId.LFO_RATE, s.lfo.rate.value);
    this.sendParam(MonologParamId.LFO_AMOUNT, s.lfo.amount.value);
    this.sendParam(MonologParamId.LFO_DESTINATION, s.lfo.destination.value);
    this.sendParam(MonologParamId.GLIDE_TIME, s.performance.glide.value);
    this.sendParam(MonologParamId.LEGATO, s.performance.legato.value);
  }

  private initControlHandlers() {
    const reg = (id: ControlID, paramId: number, event: MonologEvent,
                 update: (v: number) => void, slice: () => any) => {
      this.controlHandlers.set(id, (value: number) => {
        update(value);
        this.sendParam(paramId, value);
        this.dispatch(event, { ...slice() });
      });
    };

    reg(ControlID.ML_CUTOFF, MonologParamId.CUTOFF, MonologEvent.FILTER,
      (v) => { this.state.filter.cutoff.value = v; }, () => this.state.filter);
    reg(ControlID.ML_RESONANCE, MonologParamId.RESONANCE, MonologEvent.FILTER,
      (v) => { this.state.filter.resonance.value = v; }, () => this.state.filter);
    reg(ControlID.ML_DRIVE, MonologParamId.DRIVE, MonologEvent.FILTER,
      (v) => { this.state.filter.drive.value = v; }, () => this.state.filter);

    reg(ControlID.ML_SUB_LEVEL, MonologParamId.SUB_LEVEL, MonologEvent.OSC,
      (v) => { this.state.osc.subLevel.value = v; }, () => this.state.osc);
    reg(ControlID.ML_NOISE_LEVEL, MonologParamId.NOISE_LEVEL, MonologEvent.OSC,
      (v) => { this.state.osc.noiseLevel.value = v; }, () => this.state.osc);
    reg(ControlID.ML_PW, MonologParamId.PULSE_WIDTH, MonologEvent.OSC,
      (v) => { this.state.osc.pulseWidth.value = v; }, () => this.state.osc);

    reg(ControlID.ML_AMP_ATTACK, MonologParamId.AMP_ATTACK, MonologEvent.AMP_ENV,
      (v) => { this.state.ampEnv.attack.value = v; }, () => this.state.ampEnv);
    reg(ControlID.ML_AMP_DECAY, MonologParamId.AMP_DECAY, MonologEvent.AMP_ENV,
      (v) => { this.state.ampEnv.decay.value = v; }, () => this.state.ampEnv);
    reg(ControlID.ML_AMP_SUSTAIN, MonologParamId.AMP_SUSTAIN, MonologEvent.AMP_ENV,
      (v) => { this.state.ampEnv.sustain.value = v; }, () => this.state.ampEnv);
    reg(ControlID.ML_AMP_RELEASE, MonologParamId.AMP_RELEASE, MonologEvent.AMP_ENV,
      (v) => { this.state.ampEnv.release.value = v; }, () => this.state.ampEnv);

    reg(ControlID.ML_FLT_ATTACK, MonologParamId.FILTER_ATTACK, MonologEvent.FILTER_ENV,
      (v) => { this.state.filterEnv.attack.value = v; }, () => this.state.filterEnv);
    reg(ControlID.ML_FLT_DECAY, MonologParamId.FILTER_DECAY, MonologEvent.FILTER_ENV,
      (v) => { this.state.filterEnv.decay.value = v; }, () => this.state.filterEnv);
    reg(ControlID.ML_FLT_AMOUNT, MonologParamId.FILTER_AMOUNT, MonologEvent.FILTER_ENV,
      (v) => { this.state.filterEnv.amount.value = v; }, () => this.state.filterEnv);
    reg(ControlID.ML_FLT_VELOCITY, MonologParamId.FILTER_VELOCITY, MonologEvent.FILTER_ENV,
      (v) => { this.state.filterEnv.velocity.value = v; }, () => this.state.filterEnv);

    reg(ControlID.ML_LFO_RATE, MonologParamId.LFO_RATE, MonologEvent.LFO,
      (v) => { this.state.lfo.rate.value = v; }, () => this.state.lfo);
    reg(ControlID.ML_LFO_AMOUNT, MonologParamId.LFO_AMOUNT, MonologEvent.LFO,
      (v) => { this.state.lfo.amount.value = v; }, () => this.state.lfo);

    reg(ControlID.ML_GLIDE, MonologParamId.GLIDE_TIME, MonologEvent.PERFORMANCE,
      (v) => { this.state.performance.glide.value = v; }, () => this.state.performance);
  }
}
