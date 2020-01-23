export function createMidiLearn(midiLearners = new Set<Function>()) {
    return {
        notifyMidiLearners(shouldLearn = true) {
            for (const learnOrUnlearn of midiLearners) {
                learnOrUnlearn(shouldLearn);
            }
        },

        onMidiLearn(learn: Function) {
            midiLearners.add(learn);
        }
    }
}

export const MidiLearn = createMidiLearn();


