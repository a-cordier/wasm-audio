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

    --control-hander-color-focused: var(--medium);
    --control-handle-color: var(--dark-secondary);
    --control-cursor-color: var(--lighter);
    --control-top-color: var(--light-secondary);
    --control-label-color: var(--darker);
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
    --lcd-screen-background: var(--dark-secondary);
    --lcd-font-size: 10px;
    --lcd-text-color: #b4d455;

    --main-panel-color: #181818;
    --main-panel-label-font-family: "Bungee Outline", cursive;
    --main-panel-label-color: var(--lighter);

    --oscillator-panel-color: #145a6a;
    --oscillator-mix-panel-color: var(--oscillator-panel-color);
    --envelope-panel-color: var(--oscillator-panel-color);
    --filter-panel-color: #ac8f1d;
    --filter-mod-panel-color: var(--filter-panel-color);
    --lfo-panel-color: #9a1a40;
    --voice-config-panel-color: #4a2d7a;
    --sequencer-panel-color: #3a3d42;

    --panel-wrapper-label-color: var(--darker);

    --control-size-lg: 50px;
    --control-size-md: 40px;
    --control-size-sm: 30px;
    --lcd-width-default: min(120px, 100%);

    --row-toggle-bg: var(--medium);
    --row-toggle-icon-color: var(--light-secondary);

    --ui-transition-time: 0.4s;

    --body-background: #121212;
  }
`;

export const retroTheme = `
  :root {
    --darker: #1a0a00;
    --dark-secondary: #3c2415;
    --medium: #5a3a28;
    --light-secondary: #f5e6d3;
    --lighter: #fffaf5;

    --control-hander-color-focused: var(--medium);
    --control-handle-color: var(--dark-secondary);
    --control-cursor-color: var(--lighter);
    --control-top-color: var(--light-secondary);
    --control-label-color: var(--darker);
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
    --lcd-screen-background: var(--dark-secondary);
    --lcd-font-size: 10px;
    --lcd-text-color: #ff6347;

    --main-panel-color: #2a1a0e;
    --main-panel-label-font-family: "Bungee Outline", cursive;
    --main-panel-label-color: var(--lighter);

    --oscillator-panel-color: #8b4513;
    --oscillator-mix-panel-color: var(--oscillator-panel-color);
    --envelope-panel-color: var(--oscillator-panel-color);
    --filter-panel-color: #b8860b;
    --filter-mod-panel-color: var(--filter-panel-color);
    --lfo-panel-color: #800020;
    --voice-config-panel-color: #4a2a5e;
    --sequencer-panel-color: #4a4540;

    --panel-wrapper-label-color: var(--darker);

    --control-size-lg: 50px;
    --control-size-md: 40px;
    --control-size-sm: 30px;
    --lcd-width-default: min(120px, 100%);

    --row-toggle-bg: var(--medium);
    --row-toggle-icon-color: var(--light-secondary);

    --ui-transition-time: 0.4s;

    --body-background: #0d0500;
  }
`;

export type ThemeId = "dark" | "retro";

export const themes: Record<ThemeId, string> = {
  dark: darkTheme,
  retro: retroTheme,
};
