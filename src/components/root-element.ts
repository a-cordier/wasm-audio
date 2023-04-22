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
import { LitElement, html, css, customElement, property } from "lit-element";

import "./wasm-poly/wasm-poly";
import "./error/error-page";

const wasmTestedVersion = 84;

enum BrowserStatus { OK, NOK }
interface BrowserState {
  status: BrowserStatus;
  message?: string;
}

function isChrome(): boolean {
  return RegExp(/Chrom(?:e|ium)\/([0-9]+)/).test(navigator.userAgent);
}

function isUpToDate(): boolean {
  let version = navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/) as any;
  if (version == null || version.length != 5) {
    return false;
  }
  version = version.map((v: string) => parseInt(v, 10));
  const majorVersion = version[1];
  return majorVersion >= wasmTestedVersion;
}

const nonChromiumMessage = `
This application uses browser features that have not been fully standardized yet.
Please switch to a Chromium browser before going further.
`;

const notUpToDateMessage = `
This application uses recent browser featurres and should be run in an up to date Chromium browser.
Please update your Chromium browser to at least major version ${wasmTestedVersion} before going further.
`;

function getBrowserState(): BrowserState {
  if (!isChrome()) {
    return {
      status: BrowserStatus.NOK,
      message: nonChromiumMessage
    };
  }
  if (!isUpToDate()) {
    return {
      status: BrowserStatus.NOK,
      message: notUpToDateMessage
    };
  }
  return { status: BrowserStatus.OK };
}

const browserState = getBrowserState();

@customElement("root-element")
export class Root extends LitElement {
  render() {
    const { status, message } = browserState;
    return status === BrowserStatus.OK ? 
      html`<wasm-poly-element></wasm-poly-element>` :
      html`<error-element .message=${message}></error-element>
    `;
  }
}
