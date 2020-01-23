import { LitElement, html, css, customElement, property } from 'lit-element';

@customElement('switch-element')
export class Switch extends LitElement {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
    }

    async onChange(event) {
        this.dispatchEvent(new CustomEvent('change', { detail: { active: event.currentTarget.checked } }));
    }

    render() {
        return html` 
        <label class="switch">
            <input type="checkbox" @change="${this.onChange}">
            <span class="slider"></span>
        </label>
        `
    }

    static get styles() {
        // noinspection CssUnresolvedCustomProperty
        return css`
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
            
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
            
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--lighter-color, #ccc);
            transition: var(--ui-transition-time, .4s);
        }
            
        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: var(--light-color, white);
            transition: var(--ui-transition-time, .4s);
        }
            
        input:checked + .slider {
            background-color: var(--control-handle-color, #ccc);
        }

        input:checked + .slider:before {
            background-color: white;
        }
        
        input:focus + .slider {
            box-shadow: 0 0 1px var(--control-handle-color, #ccc);
        }
        
        input:checked + .slider:before {
            -webkit-transform: translateX(26px);
            -ms-transform: translateX(26px);
            transform: translateX(26px);
        }
        `
    }
}