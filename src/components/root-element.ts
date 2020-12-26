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
  const runtimeWindow = window as any;
  return !!runtimeWindow.chrome && (!!runtimeWindow.chrome.webstore || !!runtimeWindow.chrome.runtime);
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

@customElement("root-element")
export class Root extends LitElement {
  render() {
    const { status, message } = getBrowserState();
    return status === BrowserStatus.NOK ? html`
      <error-element .message=${message}></error-element>
    ` : html`<wasm-poly-element></wasm-poly-element>`;
  }
}
