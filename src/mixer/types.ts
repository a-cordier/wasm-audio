export const CHANNEL_COUNT = 16;

export interface ChannelState {
  id: number;
  label: string;
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  slotId?: string;
}

export interface MixerState {
  channels: ChannelState[];
  masterGain: number;
}

export function createDefaultChannel(id: number): ChannelState {
  return {
    id,
    label: "",
    gain: 0.8,
    pan: 0,
    mute: false,
    solo: false,
  };
}

export function createDefaultMixerState(): MixerState {
  const channels: ChannelState[] = [];
  for (let i = 0; i < CHANNEL_COUNT; i++) {
    channels.push(createDefaultChannel(i));
  }
  return { channels, masterGain: 0.8 };
}
