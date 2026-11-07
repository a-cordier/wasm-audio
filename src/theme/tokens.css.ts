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

export const darkTheme = `
  :root {
    --darker: #15202b;
    --dark-secondary: #192734;
    --medium: #2b3844;
    --light-secondary: #cbe2f3;
    --lighter: #ffffff;
    /* Off-white for labels: luminous but never a hard white, with a faint cool
       cast picked up from --light-secondary. */
    --moonbeam: #e8eef2;

    --control-hander-color-focused: var(--medium);
    --control-handle-color: var(--dark-secondary);
    --control-cursor-color: var(--lighter);
    --control-top-color: var(--light-secondary);
    --control-label-color: var(--moonbeam);
    --control-label-font-size: 0.8em;

    --button-disposed-background-color: var(--light-secondary);
    --button-disposed-label-color: var(--darker);
    --button-active-background-color: var(--dark-secondary);
    --button-active-label-color: #b4d455;
    --button-border: 1px solid var(--light-color);

    --key-sharp-color: var(--dark-secondary);
    --key-whole-color: var(--light-secondary);
    --keyboard-panel-color: var(--darker);

    --lcd-led-on-color: #b4d455;
    --lcd-led-off-color: rgba(180, 212, 85, 0.08);
    --lcd-led-border-radius: 20%;
    --lcd-screen-border-color: var(--lighter);
    --lcd-screen-border-radius: 0;
    --lcd-screen-background: var(--dark-secondary);
    --lcd-font-size: 10px;
    --lcd-text-color: #b4d455;

    --main-panel-color: #181818;
    --main-panel-label-font-family: "Bungee Outline", cursive;
    --main-panel-label-color: var(--lighter);

    /* Poly-ticks: neutral charcoal panels with a faint per-section tint,
       unified by --poly-accent (cyan). Kept subtle so sections stay
       color-coded without the old vivid saturation. */
    --poly-accent: #2cc5c0;
    --oscillator-panel-color: #2b322f;
    --oscillator-mix-panel-color: var(--oscillator-panel-color);
    --envelope-panel-color: var(--oscillator-panel-color);
    --filter-panel-color: #33322a;
    --filter-mod-panel-color: var(--filter-panel-color);
    --lfo-panel-color: #342b2f;
    --voice-config-panel-color: #2f2c37;
    --space-panel-color: #2e3133;
    /* Neutral charcoal base, matching monolog/poly-ticks panels rather than the
       blue-cast base neutrals; the green LCD stays as sequels' accent. The
       per-zone tokens below are a faint camaïeu over this base — same tonal
       weight, each nudged toward the hue that fits its function. */
    --sequencer-panel-color: #2f2f31;
    --seq-transport-panel-color: #33302a; /* warm  — transport / clock */
    --seq-pattern-panel-color: #2b2f34;   /* steel — pattern banks & slots */
    --seq-generate-panel-color: #2b322e;  /* teal  — Euclid generator */
    --seq-steps-panel-color: #2f332c;     /* green — step canvas / pads */

    /* Template (reference instrument): violet accent + three-zone camaïeu. */
    --template-accent: #b57edc;
    --template-osc-panel-color: #302e33;
    --template-amp-panel-color: #2d2f30;
    --template-lfo-panel-color: #2e2d32; /* dusk — modulation */

    --monolog-panel-color: #1a1a1a;
    --monolog-osc-panel-color: #2e2e2e;
    --monolog-filter-panel-color: #383830;
    --monolog-env-panel-color: #30302c;
    --monolog-lfo-panel-color: #2c2c28;
    --monolog-perf-panel-color: #333333;
    --monolog-accent: #F5DF4D;

    /* DRUMLIN (drum synth): 808-orange accent + per-voice camaïeu. */
    --drumlin-accent: #e8833a;
    --drumlin-kick-panel-color: #332c2a;  /* warm red-brown — the boom */
    --drumlin-snare-panel-color: #2e3033; /* steel          — the crack */
    --drumlin-clap-panel-color: #33312a;  /* sand           — hand noise */
    --drumlin-hats-panel-color: #2c3133;  /* cold metal     — the bank */
    --drumlin-tom-panel-color: #312e2a;   /* earth          — skins */
    --drumlin-rim-panel-color: #33302e;   /* wood on metal  — the stick */
    --drumlin-ride-panel-color: #2e3231;  /* cool bronze    — the ping */
    --drumlin-crash-panel-color: #343129; /* bright brass   — the wash */
    --drumlin-out-panel-color: #2f2f31;   /* neutral        — output */

    /* DISCHORD (chord sequencer): indigo-violet accent + per-zone camaïeu. */
    --dischord-accent: #8e7cf0;
    --dischord-panel-color: #2f2f31;
    --dischord-transport-panel-color: #33302a; /* warm   — transport / clock */
    --dischord-harmony-panel-color: #312e37;   /* violet — key, scale, voicing */
    --dischord-pattern-panel-color: #2b2f34;   /* steel  — pattern banks & slots */
    --dischord-steps-panel-color: #2f2f35;     /* cool   — step canvas */

    /* RUDIMENT (drum sequencer): magenta accent + per-zone camaïeu. */
    --rudiment-accent: #e0559a;
    --rudiment-panel-color: #2f2f31;
    --rudiment-transport-panel-color: #33302a; /* warm    — transport / clock */
    --rudiment-pattern-panel-color: #2b2f34;   /* steel   — pattern banks & slots */
    --rudiment-lane-panel-color: #332e32;      /* rose    — lane setup */
    --rudiment-grid-panel-color: #302e33;      /* plum    — the hit canvas */

    --panel-wrapper-label-color: var(--moonbeam);

    --control-size-lg: 50px;
    --control-size-md: 40px;
    --control-size-sm: 30px;
    --lcd-width-default: min(120px, 100%);
    --rack-slot-width: calc(650px + 3em);

    --row-toggle-bg: var(--medium);
    --row-toggle-icon-color: var(--light-secondary);

    --ui-transition-time: 0.4s;

    --body-background: #121212;

    --mixer-bg: #141414;
    --mixer-strip-bg: var(--dark-secondary);
    --mixer-strip-border: 1px solid var(--medium);
    --mixer-label-color: var(--light-secondary);
    --mixer-fader-track: var(--medium);
    --mixer-fader-thumb: var(--light-secondary);
    --mixer-meter-bg: var(--darker);
    --mixer-meter-green: #6abf4b;
    --mixer-meter-yellow: #d4c13a;
    --mixer-meter-red: #c44a3a;
    --mixer-mute-active: #c44a3a;
    --mixer-solo-active: var(--lcd-led-on-color);
    --mixer-btn-bg: var(--medium);
    --mixer-btn-color: var(--light-secondary);
    --mixer-db-color: var(--light-secondary);
    --mixer-strip-max-width: 96px;
    --mixer-limiter-led: #d4913a;
    --mixer-eq-zone-bg: color-mix(in srgb, var(--dark-secondary) 94%, var(--light-secondary) 6%);
    --mixer-send-zone-bg: color-mix(in srgb, var(--dark-secondary) 94%, var(--echo-accent, #d97f43) 6%);
    --echo-accent: #d97f43;
    --audio-in-accent: #c75e6a;
    --drive-accent: #d4553a;
    --chorus-accent: #c86fb4;
    --verb-accent: #93c5cf;

    /* MOTION (automation module): amber accent + three-zone camaïeu. */
    --automation-accent: #f2a33c;
    --automation-target-panel-color: #33302a;
    --automation-signal-panel-color: #322e28;
    --automation-steps-panel-color: #353028;

    /* SONG (song-mode module): steel-blue accent + two-zone camaïeu. */
    --song-accent: #6fb3e0;
    --song-scenes-panel-color: #2a2f35;
    --song-chain-panel-color: #292e33;

    /* Master transport bar */
    --transport-bar-bg: var(--main-panel-color);
    --transport-label-color: var(--moonbeam);
    --transport-active-color: var(--lcd-led-on-color);

    /* DAW shell chrome: device browser rail + hold-to-eject */
    --browser-rail-bg: var(--main-panel-color);
    --browser-rail-border: var(--medium);
    --browser-rail-label-color: var(--moonbeam);
    --browser-menu-bg: #141414;
    --browser-kind-color: var(--light-secondary);
    --eject-fill-color: #c44a3a;
  }
`;

export const retroTheme = `
  :root {
    --darker: #1a0a00;
    --dark-secondary: #3c2415;
    --medium: #5a3a28;
    --light-secondary: #f5e6d3;
    --lighter: #fffaf5;
    /* Warm counterpart: the same softness, tinted to the retro palette. */
    --moonbeam: #f4ece1;

    --control-hander-color-focused: var(--medium);
    --control-handle-color: var(--dark-secondary);
    --control-cursor-color: var(--lighter);
    --control-top-color: var(--light-secondary);
    --control-label-color: var(--moonbeam);
    --control-label-font-size: 0.8em;

    --button-disposed-background-color: var(--light-secondary);
    --button-disposed-label-color: var(--darker);
    --button-active-background-color: var(--dark-secondary);
    --button-active-label-color: #ff6347;
    --button-border: 1px solid var(--light-color);

    --key-sharp-color: var(--dark-secondary);
    --key-whole-color: var(--light-secondary);
    --keyboard-panel-color: var(--darker);

    --lcd-led-on-color: #ff6347;
    --lcd-led-off-color: rgba(255, 99, 71, 0.08);
    --lcd-led-border-radius: 50%;
    --lcd-screen-border-color: var(--lighter);
    --lcd-screen-border-radius: 0;
    --lcd-screen-background: var(--dark-secondary);
    --lcd-font-size: 10px;
    --lcd-text-color: #ff6347;

    --main-panel-color: #2a1a0e;
    --main-panel-label-font-family: "Bungee Outline", cursive;
    --main-panel-label-color: var(--lighter);

    /* Poly-ticks: same neutral-with-tint treatment as the dark theme, kept
       warm here to match the retro palette; accent stays the retro tomato. */
    --poly-accent: #ff6347;
    --oscillator-panel-color: #2f251b;
    --oscillator-mix-panel-color: var(--oscillator-panel-color);
    --envelope-panel-color: var(--oscillator-panel-color);
    --filter-panel-color: #322a1c;
    --filter-mod-panel-color: var(--filter-panel-color);
    --lfo-panel-color: #30231f;
    --voice-config-panel-color: #2c2427;
    --space-panel-color: #2d2823;
    /* Warm neutral charcoal base + a warm camaïeu across the sequencer zones. */
    --sequencer-panel-color: #342e27;
    --seq-transport-panel-color: #3a2f28; /* warm red  — transport / clock */
    --seq-pattern-panel-color: #302d2c;   /* cool mauve — pattern banks & slots */
    --seq-generate-panel-color: #332f22;  /* olive     — Euclid generator */
    --seq-steps-panel-color: #37312a;     /* amber     — step canvas / pads */

    /* Template (reference instrument): warm violet accent + three-zone camaïeu. */
    --template-accent: #c08fd6;
    --template-osc-panel-color: #332d2e;
    --template-amp-panel-color: #312d28;
    --template-lfo-panel-color: #322e31; /* dusk — modulation */

    --monolog-panel-color: #1a1a1a;
    --monolog-osc-panel-color: #2e2e2e;
    --monolog-filter-panel-color: #383830;
    --monolog-env-panel-color: #30302c;
    --monolog-lfo-panel-color: #2c2c28;
    --monolog-perf-panel-color: #333333;
    --monolog-accent: #F5DF4D;

    /* DRUMLIN (drum synth): warmed 808-orange accent + per-voice camaïeu. */
    --drumlin-accent: #dd7c33;
    --drumlin-kick-panel-color: #362c26;  /* warm red-brown — the boom */
    --drumlin-snare-panel-color: #322e2b; /* warmed steel   — the crack */
    --drumlin-clap-panel-color: #353026;  /* sand           — hand noise */
    --drumlin-hats-panel-color: #2f2f2b;  /* tarnished metal — the bank */
    --drumlin-tom-panel-color: #342e27;   /* earth          — skins */
    --drumlin-rim-panel-color: #35302b;   /* wood on metal  — the stick */
    --drumlin-ride-panel-color: #30322d;  /* tarnished bronze — the ping */
    --drumlin-crash-panel-color: #363127; /* aged brass     — the wash */
    --drumlin-out-panel-color: #322e29;   /* neutral warm   — output */

    /* DISCHORD (chord sequencer): warmed violet accent + per-zone camaïeu. */
    --dischord-accent: #9f8ae0;
    --dischord-panel-color: #342e27;
    --dischord-transport-panel-color: #3a2f28; /* warm red   — transport / clock */
    --dischord-harmony-panel-color: #332d33;   /* mauve      — key, scale, voicing */
    --dischord-pattern-panel-color: #302d2c;   /* cool mauve — pattern banks & slots */
    --dischord-steps-panel-color: #352f2d;     /* warm       — step canvas */

    /* RUDIMENT (drum sequencer): warmed magenta accent + per-zone camaïeu. */
    --rudiment-accent: #d8679a;
    --rudiment-panel-color: #342e27;
    --rudiment-transport-panel-color: #3a2f28; /* warm red  — transport / clock */
    --rudiment-pattern-panel-color: #302d2c;   /* cool      — pattern banks & slots */
    --rudiment-lane-panel-color: #362d2e;      /* rose      — lane setup */
    --rudiment-grid-panel-color: #342d2f;      /* plum      — the hit canvas */

    --panel-wrapper-label-color: var(--moonbeam);

    --control-size-lg: 50px;
    --control-size-md: 40px;
    --control-size-sm: 30px;
    --lcd-width-default: min(120px, 100%);
    --rack-slot-width: calc(650px + 3em);

    --row-toggle-bg: var(--medium);
    --row-toggle-icon-color: var(--light-secondary);

    --ui-transition-time: 0.4s;

    --body-background: #0d0500;

    --mixer-bg: #1a0a00;
    --mixer-strip-bg: var(--dark-secondary);
    --mixer-strip-border: 1px solid var(--medium);
    --mixer-label-color: var(--light-secondary);
    --mixer-fader-track: var(--medium);
    --mixer-fader-thumb: var(--light-secondary);
    --mixer-meter-bg: var(--darker);
    --mixer-meter-green: #6abf4b;
    --mixer-meter-yellow: #d4c13a;
    --mixer-meter-red: #c44a3a;
    --mixer-mute-active: #c44a3a;
    --mixer-solo-active: var(--lcd-led-on-color);
    --mixer-btn-bg: var(--medium);
    --mixer-btn-color: var(--light-secondary);
    --mixer-db-color: var(--light-secondary);
    --mixer-strip-max-width: 96px;
    --mixer-limiter-led: #d4913a;
    --mixer-eq-zone-bg: color-mix(in srgb, var(--dark-secondary) 94%, var(--light-secondary) 6%);
    --mixer-send-zone-bg: color-mix(in srgb, var(--dark-secondary) 94%, var(--echo-accent, #d97f43) 6%);
    --echo-accent: #d97f43;
    --audio-in-accent: #c75e6a;
    --drive-accent: #d4553a;
    --chorus-accent: #c86fb4;
    --verb-accent: #93c5cf;

    /* MOTION (automation module): warm amber accent + three-zone camaïeu. */
    --automation-accent: #e8963c;
    --automation-target-panel-color: #352c20;
    --automation-signal-panel-color: #332b22;
    --automation-steps-panel-color: #372e1e;

    /* SONG (song-mode module): dusty slate accent, warmed zone tints. */
    --song-accent: #8fa8bd;
    --song-scenes-panel-color: #342c24;
    --song-chain-panel-color: #322b25;

    /* Master transport bar */
    --transport-bar-bg: var(--main-panel-color);
    --transport-label-color: var(--moonbeam);
    --transport-active-color: var(--lcd-led-on-color);

    /* DAW shell chrome: device browser rail + hold-to-eject */
    --browser-rail-bg: var(--main-panel-color);
    --browser-rail-border: var(--medium);
    --browser-rail-label-color: var(--moonbeam);
    --browser-menu-bg: #1a0a00;
    --browser-kind-color: var(--light-secondary);
    --eject-fill-color: #c44a3a;
  }
`;

export type ThemeId = "dark" | "retro";

export const themes: Record<ThemeId, string> = {
  dark: darkTheme,
  retro: retroTheme,
};
