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
