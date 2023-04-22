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

@customElement("error-element")
export class Error extends LitElement {
  @property({type: String})
  private message: string;

  render() {
    return html`
      <div class="error">
        <div class="content">
            <div class="heading">SORRY!</div>
            <div class="message">${this.message}</div>
        </div>  
      </div>
    `;
  }

  static get styles() {
    return css`
        .error {
            display: flex;
            align-items: center;
            justify-content: space-around;
        }

        .error .content {
            max-width: 50%; 
        }

        .heading {
            color: #9a1a40;
            font-family: var(--main-panel-label-font-family);
            font-size: 100px;
            text-align: center; 
        }

        .message {
            color: var(--lighter);
            font-size: 50px;
            text-align: center;    
        }
    `
  }
}
