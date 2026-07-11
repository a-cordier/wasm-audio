(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={dark:`
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

    --ui-transition-time: 0.4s;

    --body-background: #121212;
  }
`,retro:`
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

    --ui-transition-time: 0.4s;

    --body-background: #0d0500;
  }
`},t=null;function n(n){let r=e[n];r&&(t||(t=new CSSStyleSheet,document.adoptedStyleSheets=[...document.adoptedStyleSheets,t]),t.replaceSync(r),document.body.style.backgroundColor=getComputedStyle(document.documentElement).getPropertyValue(`--body-background`).trim())}function r(){n(`dark`)}var i=globalThis,a=i.ShadowRoot&&(i.ShadyCSS===void 0||i.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap,c=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(a&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=s.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&s.set(t,e))}return e}toString(){return this.cssText}},l=e=>new c(typeof e==`string`?e:e+``,void 0,o),u=(e,...t)=>new c(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,o),ee=(e,t)=>{if(a)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=i.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},te=a?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return l(t)})(e):e,{is:ne,defineProperty:re,getOwnPropertyDescriptor:ie,getOwnPropertyNames:ae,getOwnPropertySymbols:oe,getPrototypeOf:se}=Object,ce=globalThis,le=ce.trustedTypes,ue=le?le.emptyScript:``,de=ce.reactiveElementPolyfillSupport,d=(e,t)=>e,fe={toAttribute(e,t){switch(t){case Boolean:e=e?ue:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},pe=(e,t)=>!ne(e,t),me={attribute:!0,type:String,converter:fe,reflect:!1,useDefault:!1,hasChanged:pe};Symbol.metadata??=Symbol(`metadata`),ce.litPropertyMetadata??=new WeakMap;var f=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=me){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&re(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=ie(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??me}static _$Ei(){if(this.hasOwnProperty(d(`elementProperties`)))return;let e=se(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(d(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d(`properties`))){let e=this.properties,t=[...ae(e),...oe(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(te(e))}else e!==void 0&&t.push(te(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ee(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?fe:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?fe:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??pe)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};f.elementStyles=[],f.shadowRootOptions={mode:`open`},f[d(`elementProperties`)]=new Map,f[d(`finalized`)]=new Map,de?.({ReactiveElement:f}),(ce.reactiveElementVersions??=[]).push(`2.1.2`);var he=globalThis,ge=e=>e,_e=he.trustedTypes,ve=_e?_e.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ye=`$lit$`,p=`lit$${Math.random().toFixed(9).slice(2)}$`,be=`?`+p,xe=`<${be}>`,m=document,Se=()=>m.createComment(``),Ce=e=>e===null||typeof e!=`object`&&typeof e!=`function`,we=Array.isArray,Te=e=>we(e)||typeof e?.[Symbol.iterator]==`function`,Ee=`[ 	
\f\r]`,De=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Oe=/-->/g,ke=/>/g,h=RegExp(`>|${Ee}(?:([^\\s"'>=/]+)(${Ee}*=${Ee}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),Ae=/'/g,je=/"/g,Me=/^(?:script|style|textarea|title)$/i,g=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),_=Symbol.for(`lit-noChange`),v=Symbol.for(`lit-nothing`),Ne=new WeakMap,y=m.createTreeWalker(m,129);function Pe(e,t){if(!we(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return ve===void 0?t:ve.createHTML(t)}var Fe=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=De;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===De?c[1]===`!--`?o=Oe:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=h):(Me.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=h):o=ke:o===h?c[0]===`>`?(o=i??De,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?h:c[3]===`"`?je:Ae):o===je||o===Ae?o=h:o===Oe||o===ke?o=De:(o=h,i=void 0);let ee=o===h&&e[t+1].startsWith(`/>`)?` `:``;a+=o===De?n+xe:l>=0?(r.push(s),n.slice(0,l)+ye+n.slice(l)+p+ee):n+p+(l===-2?t:ee)}return[Pe(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},Ie=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Fe(t,n);if(this.el=e.createElement(l,r),y.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=y.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ye)){let t=u[o++],n=i.getAttribute(e).split(p),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Be:r[1]===`?`?Ve:r[1]===`@`?He:ze}),i.removeAttribute(e)}else e.startsWith(p)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(Me.test(i.tagName)){let e=i.textContent.split(p),t=e.length-1;if(t>0){i.textContent=_e?_e.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],Se()),y.nextNode(),c.push({type:2,index:++a});i.append(e[t],Se())}}}else if(i.nodeType===8)if(i.data===be)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(p,e+1))!==-1;)c.push({type:7,index:a}),e+=p.length-1}a++}}static createElement(e,t){let n=m.createElement(`template`);return n.innerHTML=e,n}};function b(e,t,n=e,r){if(t===_)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=Ce(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=b(e,i._$AS(e,t.values),i,r)),t}var Le=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??m).importNode(t,!0);y.currentNode=r;let i=y.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new Re(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Ue(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=y.nextNode(),a++)}return y.currentNode=m,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},Re=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=v,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=b(this,e,t),Ce(e)?e===v||e==null||e===``?(this._$AH!==v&&this._$AR(),this._$AH=v):e!==this._$AH&&e!==_&&this._(e):e._$litType$===void 0?e.nodeType===void 0?Te(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==v&&Ce(this._$AH)?this._$AA.nextSibling.data=e:this.T(m.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=Ie.createElement(Pe(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Le(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Ne.get(e.strings);return t===void 0&&Ne.set(e.strings,t=new Ie(e)),t}k(t){we(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(Se()),this.O(Se()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ge(e).nextSibling;ge(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},ze=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=v,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=v}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=b(this,e,t,0),a=!Ce(e)||e!==this._$AH&&e!==_,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=b(this,r[n+o],t,o),s===_&&(s=this._$AH[o]),a||=!Ce(s)||s!==this._$AH[o],s===v?e=v:e!==v&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===v?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Be=class extends ze{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===v?void 0:e}},Ve=class extends ze{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==v)}},He=class extends ze{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=b(this,e,t,0)??v)===_)return;let n=this._$AH,r=e===v&&n!==v||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==v&&(n===v||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ue=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){b(this,e)}},We=he.litHtmlPolyfillSupport;We?.(Ie,Re),(he.litHtmlVersions??=[]).push(`3.3.3`);var Ge=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new Re(t.insertBefore(Se(),e),e,void 0,n??{})}return i._$AI(e),i},Ke=globalThis,x=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ge(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return _}};x._$litElement$=!0,x.finalized=!0,Ke.litElementHydrateSupport?.({LitElement:x});var qe=Ke.litElementPolyfillSupport;qe?.({LitElement:x}),(Ke.litElementVersions??=[]).push(`4.2.2`);var S=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Je={attribute:!0,type:String,converter:fe,reflect:!1,hasChanged:pe},Ye=(e=Je,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function C(e){return(t,n)=>typeof n==`object`?Ye(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function w(e){return C({...e,state:!0,attribute:!1})}var Xe={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ze=e=>(...t)=>({_$litDirective$:e,values:t}),Qe=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},T=Ze(class extends Qe{constructor(e){if(super(e),e.type!==Xe.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return _}});function $e(e,t){return t>=e.max?e.max:t<=e.min?e.min:t}function E(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}function et(e,t,n){return Math.round(n.min+(e-t.min)*(n.max-n.min)/(t.max-t.min))}var tt={min:-135,max:135},nt={min:0,max:127},D=class extends x{constructor(...e){super(...e),this.range=nt,this.value=64,this.step=1,this.angle=0,this.labelPosition=`bottom`}async connectedCallback(){super.connectedCallback(),this.updateAngle()}toggleActive(){let e=e=>{e.preventDefault(),this.updateValue(this.computeStep(-e.movementY,e.altKey))},t=()=>{document.removeEventListener(`mouseup`,t),document.removeEventListener(`mousemove`,e)};document.addEventListener(`mousemove`,e),document.addEventListener(`mouseup`,t)}onWheel(e){e.preventDefault(),this.updateValue(this.computeStep(e.deltaY,e.altKey))}updateAngle(){this.angle=et(this.value,this.range,tt)}updateValue(e){this.value=$e(this.range,this.value+e)}computeStep(e,t=!1){return this.computeStepMultiplier(e,t)*this.step}computeStepMultiplier(e,t=!1){let n=e<0?-1:1;return t?n*.25:n}updated(e){e.has(`value`)&&(this.updateAngle(),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}})))}render(){return g`
      <div class=${T({"knob-wrapper":!0,"label-left":this.labelPosition===`left`})}>
        ${this.labelPosition===`left`?g`<span class="label">${this.label}</span>`:``}
        <svg
          class="knob"
          shape-rendering="geometricPrecision"
          version="1.1"
          viewBox="0 0 500 500.00012"
          @mousedown="${this.toggleActive}"
          @wheel="${this.onWheel}"
        >
          <circle class="knob__background" r="250" cy="250" cx="250" />

          <g transform="rotate(${this.angle}, 250, 250)">
            <path
              class="knob__handle"
              d="M 249.52539,5.6313593e-5 A 250,250 0 0 0 
                    206.31836,3.8477125 60,60 0 0 1 146.44141,60.005915 
                    60,60 0 0 1 106.82227,45.062556 250,250 0 0 0 
                    45.056641,106.83209 60,60 0 0 1 60,146.45318 60,60 
                    0 0 1 3.84375,206.33014 250,250 0 0 0 0,250.00006 
                    250,250 0 0 0 3.8457031,293.6817 60,60 0 0 1 60.005859,353.55865 
                    60,60 0 0 1 45.0625,393.17779 a 250,250 0 0 0 61.76953,61.76563 
                    60,60 0 0 1 39.62109,-14.94336 60,60 0 0 1 59.87696,56.15625 250,
                    250 0 0 0 43.66992,3.84375 250,250 0 0 0 43.68164,-3.8457 60,60 
                    0 0 1 59.87695,-56.16016 60,60 0 0 1 39.61914,14.94336 250,250 
                    0 0 0 61.76563,-61.76953 A 60,60 0 0 1 440,353.54694 60,60 0 0 1 
                    496.15625,293.66998 250,250 0 0 0 500,250.00006 250,250 0 0 0 
                    496.1543,206.31842 60,60 0 0 1 439.99414,146.44147 60,60 0 0 1 
                    454.9375,106.82233 250,250 0 0 0 393.41992,45.232478 60,60 0 0 1 
                    354,60.000056 60,60 0 0 1 294.12891,3.9258375 250,250 0 0 0 
                    250,5.6313593e-5 a 250,250 0 0 0 -0.47461,0 z"
            />

            <path
              class="knob__cursor"
              id="path837-1"
              d="M 249.37207,1.108327e-4 A 250,273.78195 0 0 0 
                    244.34472,0.06636606 V 53.60947 h 11.31055 V 0.07497377 a 
                    250,273.78195 0 0 0 -5.80859,-0.07490674242 250,273.78195 
                    0 0 0 -0.47461,0 z"
            />

            <circle class="knob__top" r="150" cy="250" cx="250" />
          </g>
        </svg>
        ${this.labelPosition===`left`?``:g`<span class="label">${this.label}</span>`}
      </div>
    `}static get styles(){return u`
      :host {
        user-select: none;
        outline: none;
      }

      .knob-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: var(--knob-size, 100px);
      }

      .knob-wrapper.label-left {
        flex-direction: row;
        align-items: center;
        gap: 0.4em;
        max-width: none;
      }

      .knob {
        height: var(--knob-size, 100px);
        width: var(--knob-size, 100px);
        cursor: pointer;
        outline: 1px solid var(--learn-outline-color, transparent);
        outline-offset: 2px;
        border-radius: 50%;
      }

      .knob__background {
        fill: transparent;
      }

      .knob__handle {
        fill: var(--control-handle-color, #ccc);
      }

      .knob__top {
        fill: var(--control-top-color, #ccc);
      }

      .knob__cursor {
        fill: var(--control-cursor-color, #ccc);
      }

      .label {
        font-size: var(--control-label-font-size);
        color: var(--control-label-color);
        display: flex;
        justify-content: center;
        margin-top: -5px;
      }

      .label-left .label {
        margin-top: 0;
      }
    `}};E([C({type:Object})],D.prototype,`range`,void 0),E([C({type:Number})],D.prototype,`value`,void 0),E([C({type:Number})],D.prototype,`step`,void 0),E([C({type:Number})],D.prototype,`angle`,void 0),E([C({type:String})],D.prototype,`label`,void 0),E([C({type:String,attribute:`label-position`})],D.prototype,`labelPosition`,void 0),D=E([S(`knob-element`)],D);var rt=`important`,it=` !important`,at=Ze(class extends Qe{constructor(e){if(super(e),e.type!==Xe.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(it);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?rt:``):n[e]=r}}return _}}),ot=class extends x{constructor(...e){super(...e),this.label=``,this.value=127}toggleActive(e){let t=this.shadowRoot.host.offsetParent,n=this.cursorWrapperElement,r=n.offsetHeight,i=e.pageY-(t.offsetTop+n.offsetTop);this.updateValue((1-i/r)*127);let a=e=>{e.preventDefault(),this.updateValue(this.value-e.movementY)},o=()=>{document.removeEventListener(`mouseup`,o),document.removeEventListener(`mousemove`,a)};document.addEventListener(`mousemove`,a),document.addEventListener(`mouseup`,o)}onWheel(e){e.preventDefault(),this.updateValue(this.value+e.deltaY)}updateValue(e){this.value=$e({min:0,max:127},e),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}computeFaderCursorStyle(){return at({height:`${this.value/127*100}%`})}get cursorElement(){return g` <div
      class="fader-cursor"
      style="${this.computeFaderCursorStyle()}"
    ></div>`}get cursorWrapperElement(){return this.shadowRoot.querySelector(`.cursor-wrapper`)}render(){return g`
      <div class="fader">
        <div class="fader-wrapper">
          <div
            class="cursor-wrapper"
            @mousedown="${this.toggleActive}"
            @wheel="${this.onWheel}"
          >
            ${this.cursorElement}
          </div>
        </div>
        <label>${this.label}</label>
      </div>
    `}static get styles(){return u`
      .fader {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .fader-wrapper {
        width: var(--fader-width, 20px);
        height: var(--fader-height, 100px);
        border: 2px solid var(--lighter-color, white);
        border-radius: 4px;
        padding: 1px;
        outline: 1px solid var(--learn-outline-color, transparent);
        outline-offset: 2px;
      }

      .cursor-wrapper {
        width: 100%;
        height: 100%;
        margin: 0 auto;

        position: relative;
      }

      .fader-cursor {
        display: block;
        width: 100%;

        background-color: var(--control-handle-color);

        position: absolute;
        bottom: 0;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: 0.8em;
        margin-top: 0.3em;
      }
    `}};E([C({type:String})],ot.prototype,`label`,void 0),E([C({type:Number})],ot.prototype,`value`,void 0),ot=E([S(`fader-element`)],ot);var st=[`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`],ct=69,lt=440,ut=Array(128);for(let e=0;e<128;e++){let t=e%12,n=Math.floor(e/12)-1,r=n>=0?`${st[t]}${n}`:``,i=lt*2**((e-ct)/12);ut[e]=Object.freeze({name:r,frequency:i})}Object.freeze(ut);function dt(e){return ut[e&127].frequency}function ft(e){return e%12}function pt(e){return Math.floor(e/12)-1}function mt(e,t=lt){return st.map((n,r)=>{let i=(e+1)*12+r;return{pitchClass:n,octave:e,frequency:t*2**((i-ct)/12),midiValue:i,velocity:127}}).filter(e=>e.midiValue>=0&&e.midiValue<=127)}function ht(e=lt){let t=[];for(let n=0;n<10;n++)t.push(mt(n,e));return t}var gt=ht(440).map(_t);function _t(e){return e.map(e=>{let t=e.pitchClass.endsWith(`#`),n=t?e.pitchClass.replace(`#`,`--sharp`):e.pitchClass;return{...e,classes:{[n]:!0,"key--sharp":t,"key--whole":!t,key:!0}}})}var vt=class extends x{constructor(...e){super(...e),this.lowerKey=36,this.higherKey=61,this.mouseControlledKey=null}get octaves(){return gt.slice(pt(this.lowerKey),pt(this.higherKey)+1)}async connectedCallback(){super.connectedCallback(),this.registerMouseUpHandler()}registerMouseUpHandler(){document.addEventListener(`mouseup`,this.mouseUp.bind(this))}mouseUp(){this.mouseControlledKey&&=(this.keyOff(this.mouseControlledKey),null)}mouseDown(e){return async t=>{t.button===0&&(this.mouseControlledKey=e,await this.keyOn(e))}}mouseEnter(e){return async()=>{this.mouseControlledKey&&(await this.keyOff(this.mouseControlledKey),this.mouseControlledKey=e,await this.keyOn(e))}}findKey(e){return gt[pt(e)][ft(e)]}async keyOn(e){this.pressedKeys.add(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOn`,{detail:e})),await this.requestUpdate()}async keyOff(e){this.pressedKeys.delete(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOff`,{detail:e})),await this.requestUpdate()}createOctaveElement(e){return g`
      <div class="octave">
        ${e.map(this.createKeyElement.bind(this))}
      </div>
    `}createKeyElement(e){return g`
      <div
        @mousedown=${this.mouseDown(e)}
        @mouseenter=${this.mouseEnter(e)}
        id="${e.midiValue}"
        class="${this.computeKeyClasses(e)}"
      ></div>
    `}computeKeyClasses(e){return T({...e.classes,"key--pressed":this.pressedKeys&&this.pressedKeys.has(e.midiValue)})}render(){return g`
      <div class="octaves">
        ${this.octaves.map(this.createOctaveElement.bind(this))}
      </div>
    `}static get styles(){return u`
      :host {
        display: block;
        user-select: none;
        outline: none;
        width: 100%;
      }

      .octaves {
        display: flex;
        justify-content: flex-start;
        height: var(--key-height, 100%);
      }

      .octave {
        flex-grow: 1;

        display: grid;
        grid-template-columns: repeat(84, 1fr);

        margin-left: -7px;
      }

      .key {
        border: 1px solid white;
      }

      .key--sharp {
        background-color: var(--key-sharp-color, #999);
        z-index: 1;
        height: 60%;
      }

      .key--whole {
        background-color: var(--key-whole-color, #ccc);
        height: 100%;
      }

      .key--pressed {
        filter: brightness(2);
      }

      .C {
        grid-row: 1;
        grid-column: 1 / span 12;
      }

      .C--sharp {
        grid-row: 1;
        grid-column: 8 / span 8;
      }

      .D {
        grid-row: 1;
        grid-column: 12 / span 12;
      }

      .D--sharp {
        grid-row: 1;
        grid-column: 20 / span 8;
      }

      .E {
        grid-row: 1;
        grid-column: 24 / span 12;
      }

      .F {
        grid-row: 1;
        grid-column: 36 / span 12;
      }

      .F--sharp {
        grid-row: 1;
        grid-column: 44 / span 8;
      }

      .G {
        grid-row: 1;
        grid-column: 48 / span 12;
      }

      .G--sharp {
        grid-row: 1;
        grid-column: 56 / span 8;
      }

      .A {
        grid-row: 1;
        grid-column: 60 / span 12;
      }

      .A--sharp {
        grid-row: 1;
        grid-column: 68 / span 8;
      }

      .B {
        grid-row: 1;
        grid-column: 72 / span 12;
      }

      .key--white {
        fill: var(--control-background-color, #ccc);
        stroke: var(--primary-color, #ccc);
      }

      .key--black {
        fill: var(--primary-color, #ccc);
      }
    `}};E([C({type:Number})],vt.prototype,`lowerKey`,void 0),E([C({type:Number})],vt.prototype,`higherKey`,void 0),E([C({type:Object})],vt.prototype,`pressedKeys`,void 0),vt=E([S(`keys-element`)],vt);var yt=class{constructor(e){this.currentOption=0,this.options=e,this.map=e.map.bind(e)}get size(){return this.options.length}set index(e){this.currentOption=e-1,this.next()}get index(){return this.currentOption}selectValue(e){let t=this.options.findIndex(t=>t.value===e);t>-1&&(this.currentOption=t)}select(e){return this.currentOption=e,this}next(){return++this.currentOption>=this.options.length&&(this.currentOption=0),this}previous(){return--this.currentOption<0&&(this.currentOption=this.options.length-1),this}getCurrent(){return this.options[this.currentOption]}},O=function(e){return e[e.NONE=-1]=`NONE`,e[e.OSC1_SEMI=0]=`OSC1_SEMI`,e[e.OSC1_CENT=1]=`OSC1_CENT`,e[e.OSC1_CYCLE=2]=`OSC1_CYCLE`,e[e.OSC_MIX=3]=`OSC_MIX`,e[e.NOISE=4]=`NOISE`,e[e.OSC2_SEMI=5]=`OSC2_SEMI`,e[e.OSC2_CENT=6]=`OSC2_CENT`,e[e.OSC2_CYCLE=7]=`OSC2_CYCLE`,e[e.CUTOFF=8]=`CUTOFF`,e[e.RESONANCE=9]=`RESONANCE`,e[e.DRIVE=10]=`DRIVE`,e[e.ATTACK=11]=`ATTACK`,e[e.DECAY=12]=`DECAY`,e[e.SUSTAIN=13]=`SUSTAIN`,e[e.RELEASE=14]=`RELEASE`,e[e.LFO1_FREQ=15]=`LFO1_FREQ`,e[e.LFO1_MOD=16]=`LFO1_MOD`,e[e.LFO2_FREQ=17]=`LFO2_FREQ`,e[e.LFO2_MOD=18]=`LFO2_MOD`,e[e.CUT_MOD=19]=`CUT_MOD`,e[e.CUT_VEL=20]=`CUT_VEL`,e[e.CUT_ATTACK=21]=`CUT_ATTACK`,e[e.CUT_DECAY=22]=`CUT_DECAY`,e[e.GLIDE_TIME=23]=`GLIDE_TIME`,e[e.SEQ_BPM=24]=`SEQ_BPM`,e[e.SEQ_SWING=25]=`SEQ_SWING`,e[e.SEQ_GATE=26]=`SEQ_GATE`,e}({});function k(e){return{name:O[e].replace(/_/g,` `),value:e}}new yt([k(0),k(1),k(2),k(3),k(4),k(5),k(6),k(7),k(11),k(12),k(13),k(14),k(8),k(9),k(10),k(19),k(20),k(21),k(22),k(15),k(16),k(17),k(18),k(23)]);var bt=class extends EventTarget{constructor(...e){super(...e),this.bindings=new Map,this.slotBindings=new Map,this.adapters=[],this.subscriptions=[],this._learningTarget=O.NONE,this._learningSlotId=null}get learningTarget(){return this._learningTarget}get isLearning(){return this._learningSlotId!==null}get learningSlotId(){return this._learningSlotId}isLearningSlot(e){return this._learningSlotId===e}enterLearnMode(e){this._learningSlotId=e,this._learningTarget=O.NONE,this.dispatchEvent(new Event(`learn-state-change`))}exitLearnMode(){this._learningSlotId=null,this._learningTarget=O.NONE,this.dispatchEvent(new Event(`learn-state-change`))}registerSource(e){this.adapters.push(e);let t=e.onSignal(e=>this.handleSignal(e));this.subscriptions.push(t),e.connect()}startLearning(e){this._learningTarget=e,this.dispatchEvent(new Event(`learn-state-change`))}stopLearning(){this._learningTarget=O.NONE,this.dispatchEvent(new Event(`learn-state-change`))}handleSignal(e){if(this._learningTarget!==O.NONE){let t=this._learningSlotId;this.bindings.set(e.sourceId,this._learningTarget),t?this.slotBindings.set(e.sourceId,t):this.bindings.delete(e.sourceId),this._learningTarget=O.NONE,this.dispatchEvent(new Event(`learn-state-change`))}let t=this.bindings.get(e.sourceId);if(t!==void 0){let n=this.slotBindings.get(e.sourceId)??null;this.dispatchEvent(new CustomEvent(`control-change`,{detail:{controlId:t,value:e.value,slotId:n}}))}}exportBindings(){return Array.from(this.bindings.entries()).map(([e,t])=>({controlId:t,sourceId:e}))}importBindings(e){this.bindings.clear();for(let{controlId:t,sourceId:n}of e)this.bindings.set(n,t)}clearBindings(){this.bindings.clear(),this.slotBindings.clear()}destroy(){for(let e of this.subscriptions)e.dispose();for(let e of this.adapters)e.disconnect();this.adapters.length=0,this.subscriptions.length=0,this.bindings.clear()}},xt=null;function A(){return xt||=new bt,xt}var St=class{constructor(e,t){this._slotId=null,this.onChange=()=>{this.host.requestUpdate()},this.host=e,this._slotId=t??null,e.addController(this)}get learningTarget(){return A().learningTarget}get isLearning(){return A().isLearning}get learningSlotId(){return A().learningSlotId}isActiveForSlot(e){return A().isLearningSlot(e)}get isActiveForMySlot(){return this._slotId?A().isLearningSlot(this._slotId):this.isLearning}hostConnected(){A().addEventListener(`learn-state-change`,this.onChange)}hostDisconnected(){A().removeEventListener(`learn-state-change`,this.onChange)}};function Ct(e){let t=e;for(;t;){let e=t.getRootNode();if(e instanceof ShadowRoot){let n=e.host;if(n.tagName===`DEVICE-SLOT`&&n.config?.id)return n.config.id;t=n}else break}return null}var wt=class extends x{constructor(...e){super(...e),this.learn=new St(this),this._slotId=null}connectedCallback(){super.connectedCallback(),this._slotId=Ct(this)}get hasFocus(){return this.learn.learningTarget===this.controlID}get isMySlotLearning(){return this._slotId?A().isLearningSlot(this._slotId):this.learn.isLearning}handleClick(e){this.isMySlotLearning&&(e.stopPropagation(),e.preventDefault(),A().startLearning(this.controlID))}render(){return g`
      <div class="${T({wrapper:!0,focus:this.hasFocus,learnable:this.isMySlotLearning})}" @click=${this.handleClick}>
        <slot></slot>
      </div>
    `}static get styles(){return u`
      :host {
        display: inline-block;
        width: fit-content;
      }

      .wrapper {
        display: inline-block;
        width: fit-content;
        border-radius: 4px;
        --learn-outline-color: transparent;
      }

      .wrapper.learnable {
        cursor: pointer;
        --learn-outline-color: rgba(255, 200, 0, 0.3);
      }

      .wrapper.learnable:hover {
        --learn-outline-color: rgba(255, 200, 0, 0.7);
      }

      .wrapper.focus {
        --learn-outline-color: rgba(180, 212, 85, 1);
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        0% {
          --learn-outline-color: rgba(180, 212, 85, 1);
          --control-handle-color: var(--control-hander-color-focused);
        }
        50% {
          --learn-outline-color: rgba(180, 212, 85, 0.3);
        }
        100% {
          --learn-outline-color: rgba(180, 212, 85, 1);
          --control-handle-color: var(--control-hander-color-focused);
        }
      }
    `}};E([C({type:Number})],wt.prototype,`controlID`,void 0),wt=E([S(`control-learn-wrapper`)],wt);var Tt=class extends x{render(){return g`
      <div class="lcd">
        <span class="lcd-text">${this.text}</span>
      </div>
    `}static get styles(){return u`
      :host {
        display: block;
        height: 100%;
      }

      .lcd {
        width: var(--lcd-screen-width, 120px);
        max-width: 100%;
        height: 100%;
        box-sizing: border-box;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 1px solid gray;

        background-color: var(--lcd-screen-background, darkslategray);
        border-color: var(--lcd-screen-border-color);

        padding: 4px 6px;
      }

      .lcd-text {
        font-family: "Silkscreen", monospace;
        font-size: var(--lcd-font-size, 10px);
        color: var(--lcd-text-color, #b4d455);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: clip;
        letter-spacing: 0.5px;
      }
    `}};E([C({type:String})],Tt.prototype,`text`,void 0),Tt=E([S(`lcd-element`)],Tt);var Et=class extends x{render(){return g`
      <div class="wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewbox="0 0 15 15"
        >
          <path
            d="M1,7.5L1.9285714285714286,10.392772141432088L2.857142857142857,
                    12.71259528273145L3.7857142857142856,14L4.714285714285714,14L5.642857142857142,
                    12.71259528273145L6.571428571428571,10.392772141432088L7.5,7.500000000000002L8.428571428571429,
                    4.607227858567914L9.357142857142858,2.287404717268552L10.285714285714286,1L11.214285714285714,
                    1L12.142857142857142,2.2874047172685508L13.071428571428571,4.607227858567911L14,7.499999999999998"
            stroke-width="2"
            stroke-linecap="flat"
            fill-opacity="0"
          ></path>
        </svg>
      </div>
    `}static get styles(){return u`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `}};Et=E([S(`sine-wave-icon`)],Et);var Dt=class extends x{render(){return g`
      <div class="wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewbox="0 0 15 15"
        >
          <path
            d="M1,7.500000000000015L1.9285714285714286,13.998703251446551L2.857142857142857,
                    13.999999999999995L3.7857142857142856,13.996380456469218L4.714285714285714,
                    13.996380456469204L5.642857142857142,14L6.571428571428571,13.998703251446567L7.5,
                    7.500000000001059L8.428571428571429,1.0012967485535302L9.357142857142858,
                    1.000000000000089L10.285714285714286,1.003619543530807L11.214285714285714,
                    1.003619543530832L12.142857142857142,1L13.071428571428571,1.0012967485534585L14,
                    7.499999999997926"
            stroke-width="2"
            stroke-linecap="flat"
            fill-opacity="0"
          ></path>
        </svg>
      </div>
    `}static get styles(){return u`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `}};Dt=E([S(`square-wave-icon`)],Dt);var Ot=class extends x{render(){return g`
      <div class="wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewbox="0 0 15 15"
        >
          <path
            d="M1,7.499999999999998L1.9285714285714286,9.66666501861054L2.857142857142857,
                    11.833332134083884L3.7857142857142856,13.999999999999993L4.714285714285714,
                    14L5.642857142857142,11.833332134083886L6.571428571428571,9.666665018610539L7.5,
                    7.499999999999998L8.428571428571429,5.333334981389459L9.357142857142858,
                    3.1666678659161125L10.285714285714286,1.0000000000000013L11.214285714285714,
                    1L12.142857142857142,3.1666678659161125L13.071428571428571,5.333334981389459L14,
                    7.499999999999998"
            stroke-width="2"
            stroke-linecap="flat"
            fill="#000000"
            fill-opacity="0"
          ></path>
        </svg>
      </div>
    `}static get styles(){return u`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `}};Ot=E([S(`saw-wave-icon`)],Ot);var kt=class extends x{render(){return g`
      <div class="wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewbox="0 0 15 15"
        >
          <path
            d="M1,14L1.9285714285714286,12.142490562426055L2.857142857142857,
                    10.284980468772217L3.7857142857142856,8.427469360191056L4.714285714285714,
                    6.5699573422095705L5.642857142857142,4.712444949042433L6.571428571428571,
                    2.8549329289184655L7.5,1L8.428571428571429,2.854932928918461L9.357142857142858,
                    4.712444949042433L10.285714285714286,6.569957342209566L11.214285714285714,
                    8.427469360191049L12.142857142857142,10.284980468772217L13.071428571428571,
                    12.142490562426048L14,13.999999999999995"
            stroke-width="2"
            stroke-linecap="flat"
            fill-opacity="0"
          ></path>
        </svg>
      </div>
    `}static get styles(){return u`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
        margin-left: 1px;
      }
    `}};kt=E([S(`triangle-wave-icon`)],kt);var At=class extends x{constructor(...e){super(...e),this.label=``}render(){return g`
      <div class="wrapper">
        <div class="header">
          <label>${this.label}</label>
          <slot name="header"></slot>
        </div>
        <div class="content">
          <slot></slot>
          <slot name="controls"></slot>
        </div>
        <div class="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `}static get styles(){return u`
      :host {
        display: block;
        height: 100%;
        container-type: inline-size;
      }

      .wrapper {
        position: relative;

        width: 100%;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;

        background-color: var(--panel-wrapper-background-color, transparent);

        border-radius: 0.5rem;

        padding: 0.25em;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      label {
        display: block;
        color: var(--panel-wrapper-label-color, white);
        margin: 0 auto 0.5em auto;
        text-align: center;
      }

      .content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-width: 0;
      }

      .footer:empty {
        display: none;
      }
    `}};E([C({type:String})],At.prototype,`label`,void 0),At=E([S(`panel-wrapper-element`)],At);var j=function(e){return e[e.SINE=0]=`SINE`,e[e.SAWTOOTH=1]=`SAWTOOTH`,e[e.SQUARE=2]=`SQUARE`,e[e.TRIANGLE=3]=`TRIANGLE`,e}({}),jt=class extends x{constructor(...e){super(...e),this.value=j.SINE}async onSawSelect(){this.value=j.SAWTOOTH,this.dispatchSelect()}async onSquareSelect(){this.value=j.SQUARE,this.dispatchSelect()}async onSineSelect(){this.value=j.SINE,this.dispatchSelect()}async onTriangleSelect(){this.value=j.TRIANGLE,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return g`
      <div class="wave-selector">
        <button
          class="${this.computeButtonClasses(j.SAWTOOTH)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(j.SQUARE)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(j.TRIANGLE)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(j.SINE)}"
          @click=${this.onSineSelect}
        >
          <sine-wave-icon class="icon"></sine-wave-icon>
        </button>
      </div>
    `}computeButtonClasses(e){return T({active:e===this.value})}static get styles(){return u`
      :host {
        width: 100%;
      }

      .wave-selector {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
      }

      button {
        width: var(--button-width, 25px);
        height: var(--button-height, 25px);
        font-size: var(--button-font-size, 1.5em);

        background-color: var(--button-disposed-background-color);
        border: 1px solid #ccc;
        border-radius: 50%;
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;

        cursor: pointer;

        --stroke-color: var(--button-disposed-label-color);
      }

      button .icon {
        margin-top: -2px;
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color:  var(--button-active-background-color);
        --stroke-color: var(--button-active-label-color);
        border-color: white;
      }
    `}};E([C({type:Number})],jt.prototype,`value`,void 0),jt=E([S(`wave-selector-element`)],jt);var M=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.SEMI_SHIFT=1]=`SEMI_SHIFT`,e[e.CENT_SHIFT=2]=`CENT_SHIFT`,e[e.CYCLE=3]=`CYCLE`,e[e.MIX=4]=`MIX`,e[e.NOISE=5]=`NOISE`,e}({}),N=class extends x{constructor(...e){super(...e),this.label=``}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t},bubbles:!0,composed:!0}))}};E([C({type:String})],N.prototype,`label`,void 0);var P=class extends N{constructor(...e){super(...e),this.semiControlID=O.OSC1_SEMI,this.centControlID=O.OSC1_CENT,this.cycleControlID=O.OSC1_CYCLE,this.cycleRange={min:5,max:122}}render(){return g`
      <panel-wrapper-element label=${this.label}>
        <div class="oscillator-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value}
              @change=${e=>this.dispatchChange(M.WAVE_FORM,e.detail.value)}
            ></wave-selector-element>
          </div>
          <div class="tone-controls">
            <div class="shift-control">
              <div class="knob-control semi-shift-control">
                <control-learn-wrapper controlID=${this.semiControlID}>
                  <knob-element
                    .value=${this.state.semiShift.value}
                    @change=${e=>this.dispatchChange(M.SEMI_SHIFT,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>semi</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cent-shift-control">
                <control-learn-wrapper controlID=${this.centControlID}>
                  <knob-element
                    .value=${this.state.centShift.value}
                    @change=${e=>this.dispatchChange(M.CENT_SHIFT,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>cents</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cycle-shift-control">
                <control-learn-wrapper controlID=${this.cycleControlID}>
                  <knob-element
                    .range=${this.cycleRange}
                    .value=${this.state.cycle.value}
                    @change=${e=>this.dispatchChange(M.CYCLE,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>cycle</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
      :host {
        --panel-wrapper-background-color: var(--oscillator-panel-color);
        container-type: inline-size;
      }

      .oscillator-controls {
        position: relative;
        width: 100%;
        min-height: 120px;
      }

      .tone-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .shift-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .knob-control {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        height: 90%;
      }

      .semi-shift-control { --knob-size: 50px; }
      .cent-shift-control { --knob-size: 40px; }
      .cycle-shift-control { --knob-size: 35px; }

      @container (max-width: 120px) {
        .tone-controls { flex-direction: column; gap: 0.5em; }
        .semi-shift-control, .cent-shift-control, .cycle-shift-control { --knob-size: 30px; }
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
      }
    `}};E([C({type:Object})],P.prototype,`state`,void 0),E([C({type:Number})],P.prototype,`semiControlID`,void 0),E([C({type:Number})],P.prototype,`centControlID`,void 0),E([C({type:Number})],P.prototype,`cycleControlID`,void 0),P=E([S(`oscillator-element`)],P);var Mt=class extends N{render(){return g`
      <panel-wrapper-element class="oscillator-mix">
        <div class="oscillator-mix-control">
          <control-learn-wrapper .controlID=${O.OSC_MIX}>
            <knob-element class="mix" label="mix"
              .value=${this.mix.value}
              @change=${e=>this.dispatchChange(M.MIX,e.detail.value)}
            ></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${O.NOISE}>
            <knob-element class="noise" label="noise"
              .value=${this.noise.value}
              @change=${e=>this.dispatchChange(M.NOISE,e.detail.value)}
            ></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
      :host {
        container-type: inline-size;
      }

      .oscillator-mix {
        --panel-wrapper-background-color: var(--oscillator-mix-panel-color);
      }

      .oscillator-mix-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 130px;
      }

      .oscillator-mix .mix { --knob-size: var(--control-size-md, 40px); }
      .oscillator-mix .noise { --knob-size: var(--control-size-sm, 30px); }

      @container (max-width: 60px) {
        .oscillator-mix .mix { --knob-size: var(--control-size-sm, 30px); }
        .oscillator-mix .noise { --knob-size: 25px; }
      }
    `}};E([C({type:Object})],Mt.prototype,`mix`,void 0),E([C({type:Object})],Mt.prototype,`noise`,void 0),Mt=E([S(`oscillator-mix-element`)],Mt);var F=function(e){return e[e.MODE=0]=`MODE`,e[e.CUTOFF=1]=`CUTOFF`,e[e.RESONANCE=2]=`RESONANCE`,e[e.DRIVE=3]=`DRIVE`,e}({}),Nt=class extends N{render(){return g`
      <panel-wrapper-element label="Filter">
        <div class="filter-controls">
          <div class="mode-control">
            <filter-selector-element
              .value=${this.state.mode.value}
              @change=${e=>this.dispatchChange(F.MODE,e.detail.value)}
            ></filter-selector-element>
          </div>
          <div class="frequency-controls">
            <div class="frequency-control">
              <div class="knob-control cutoff-control">
                <control-learn-wrapper controlID=${O.CUTOFF}>
                  <knob-element
                    .value=${this.state.cutoff.value}
                    @change=${e=>this.dispatchChange(F.CUTOFF,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>cutoff</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control resonance-control">
                <control-learn-wrapper controlID=${O.RESONANCE}>
                  <knob-element
                    .value=${this.state.resonance.value}
                    @change=${e=>this.dispatchChange(F.RESONANCE,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>res</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control drive-control">
                <control-learn-wrapper controlID=${O.DRIVE}>
                  <knob-element
                    .value=${this.state.drive.value}
                    @change=${e=>this.dispatchChange(F.DRIVE,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>drive</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
      :host {
        --panel-wrapper-background-color: var(--filter-panel-color);
        container-type: inline-size;
      }

      .filter-controls {
        position: relative;
        width: 100%;
        min-height: 120px;
      }

      .mode-control { width: 100%; display: block; }

      .frequency-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .frequency-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .knob-control {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        height: 90%;
      }

      .cutoff-control { --knob-size: 50px; }
      .resonance-control { --knob-size: 40px; }
      .drive-control { --knob-size: 35px; }

      @container (max-width: 120px) {
        .frequency-controls { flex-direction: column; gap: 0.5em; }
        .cutoff-control, .resonance-control, .drive-control { --knob-size: 30px; }
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
      }
    `}};E([C({type:Object})],Nt.prototype,`state`,void 0),Nt=E([S(`filter-element`)],Nt);var I=function(e){return e[e.LOWPASS=0]=`LOWPASS`,e[e.LOWPASS_PLUS=1]=`LOWPASS_PLUS`,e[e.BANDPASS=2]=`BANDPASS`,e[e.HIGHPASS=3]=`HIGHPASS`,e}({}),Pt=class extends x{constructor(...e){super(...e),this.value=I.LOWPASS}async onLpSelect(){this.value=I.LOWPASS,this.dispatchSelect()}async onLpPlusSelect(){this.value=I.LOWPASS_PLUS,this.dispatchSelect()}async onBpSelect(){this.value=I.BANDPASS,this.dispatchSelect()}async onHpSelect(){this.value=I.HIGHPASS,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return g`
      <div class="filter-selector">
        <button
          class="${this.computeButtonClasses(I.LOWPASS_PLUS)}"
          @click=${this.onLpPlusSelect}
        >
          L+
        </button>
        <button
          class="${this.computeButtonClasses(I.LOWPASS)}"
          @click=${this.onLpSelect}
        >
          LP
        </button>
        <button
          class="${this.computeButtonClasses(I.BANDPASS)}"
          @click=${this.onBpSelect}
        >
          BP
        </button>
        <button
          class="${this.computeButtonClasses(I.HIGHPASS)}"
          @click=${this.onHpSelect}
        >
          HP
        </button>
      </div>
    `}computeButtonClasses(e){return T({active:e===this.value})}static get styles(){return u`
      :host {
        width: 100%;
        font-size: 0.5em;
      }

      .filter-selector {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
      }

      button {
        width: var(--button-width, 25px);
        height: var(--button-height, 25px);

        font-size: var(--button-font-size, 1.5em);

        background-color: var(--button-disposed-background-color);
        border: 1px solid var(--light-color, #ccc);
        border-radius: 50%;
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;

        cursor: pointer;

        color: var(--button-disposed-label-color);
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--button-active-background-color);
        color: white;
        border-color: var(--button-active-label-color);
        color: var(--button-active-label-color);
      }
    `}};E([C({type:Number})],Pt.prototype,`value`,void 0),Pt=E([S(`filter-selector-element`)],Pt);var L=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.SUSTAIN=2]=`SUSTAIN`,e[e.RELEASE=3]=`RELEASE`,e}({}),Ft=class extends N{render(){return g`
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <control-learn-wrapper .controlID=${O.ATTACK}>
            <fader-element label="A" .value=${this.state.attack.value}
              @change=${e=>this.dispatchChange(L.ATTACK,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${O.DECAY}>
            <fader-element label="D" .value=${this.state.decay.value}
              @change=${e=>this.dispatchChange(L.DECAY,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${O.SUSTAIN}>
            <fader-element label="S" .value=${this.state.sustain.value}
              @change=${e=>this.dispatchChange(L.SUSTAIN,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${O.RELEASE}>
            <fader-element label="R" .value=${this.state.release.value}
              @change=${e=>this.dispatchChange(L.RELEASE,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
      :host {
        --panel-wrapper-background-color: var(--envelope-panel-color);
        --fader-height: 120px;
        container-type: inline-size;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 160px;
      }

      @container (max-width: 80px) {
        .envelope-controls {
          flex-wrap: wrap;
          gap: 0.25em;
        }
        :host { --fader-height: 80px; }
      }
    `}};E([C({type:Object})],Ft.prototype,`state`,void 0),Ft=E([S(`envelope-element`)],Ft);var R=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.FREQUENCY=1]=`FREQUENCY`,e[e.MOD_AMOUNT=2]=`MOD_AMOUNT`,e[e.DESTINATION=3]=`DESTINATION`,e}({}),It=function(e){return e[e.FREQUENCY=0]=`FREQUENCY`,e[e.OSCILLATOR_MIX=1]=`OSCILLATOR_MIX`,e[e.CUTOFF=2]=`CUTOFF`,e[e.RESONANCE=3]=`RESONANCE`,e[e.OSC1_CYCLE=4]=`OSC1_CYCLE`,e[e.OSC2_CYCLE=5]=`OSC2_CYCLE`,e}({}),Lt=class extends N{constructor(...e){super(...e),this.frequencyControlID=O.LFO1_FREQ,this.modAmountControlID=O.LFO1_MOD,this.destinations=new yt([{value:It.OSCILLATOR_MIX,name:`OSC MIX`},{value:It.FREQUENCY,name:`FREQUENCY`},{value:It.CUTOFF,name:`CUTOFF`},{value:It.OSC1_CYCLE,name:`OSC1 CYCLE`},{value:It.OSC2_CYCLE,name:`OSC2 CYCLE`}])}render(){return g`
      <panel-wrapper-element label=${this.label}>
        <div class="lfo-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value}
              @change=${e=>this.dispatchChange(R.WAVE_FORM,e.detail.value)}
            ></wave-selector-element>
          </div>
          <div class="destination-control">
            <lcd-selector-element
              .options=${this.destinations}
              .value=${this.state.destination.value}
              @change=${e=>this.dispatchChange(R.DESTINATION,e.detail.value)}
            ></lcd-selector-element>
          </div>
          <div class="modulation-controls">
            <div class="modulation-control">
              <div class="frequency-control">
                <control-learn-wrapper controlID=${this.frequencyControlID}>
                  <knob-element
                    .value=${this.state.frequency.value}
                    @change=${e=>this.dispatchChange(R.FREQUENCY,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>freq</label>
            </div>
            <div class="modulation-control">
              <div class="mod-amount-control">
                <control-learn-wrapper controlID=${this.modAmountControlID}>
                  <knob-element
                    .value=${this.state.modAmount.value}
                    @change=${e=>this.dispatchChange(R.MOD_AMOUNT,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>mod.</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
      :host {
        --panel-wrapper-background-color: var(--lfo-panel-color);
        container-type: inline-size;
      }

      .lfo-controls {
        position: relative;
        width: 100%;
        min-height: 160px;
      }

      .destination-control {
        margin: 10px auto;
        max-width: 100%;
        overflow: hidden;
      }

      .modulation-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .modulation-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .frequency-control {
        display: flex;
        align-items: center;
        width: 100%;
        height: 90%;
        --knob-size: 40px;
      }

      .mod-amount-control {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 90%;
        --knob-size: 40px;
      }

      @container (max-width: 100px) {
        .modulation-controls { flex-direction: column; gap: 0.5em; }
        .frequency-control, .mod-amount-control { --knob-size: 30px; }
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: 0.8em;
      }
    `}};E([C({type:Object})],Lt.prototype,`state`,void 0),E([C({type:Number})],Lt.prototype,`frequencyControlID`,void 0),E([C({type:Number})],Lt.prototype,`modAmountControlID`,void 0),Lt=E([S(`lfo-element`)],Lt);var Rt=class extends x{render(){return g`
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">${this.options.map(this.createOptionSelector.bind(this))}</div>
      </div>
    `}async connectedCallback(){super.connectedCallback(),this.options.selectValue(this.value)}createOptionSelector(e,t){return g`
      <button @click=${this.createOptionHandler(t)} class="${this.computeButtonClasses(t)}">${t}</button>
    `}computeButtonClasses(e){return T({active:this.options.index===e})}createOptionHandler(e){return()=>{this.options.index=e,this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}}nextOption(){this.options.next(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}previousOption(){this.options.previous(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}dispatchChange({value:e}){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}}))}static get styles(){return u`
      .lcd-selector {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: auto;
      }

      .lcd-selector .options {
        display: flex;
        justify-content: space-between;
        margin: 0.5rem auto 0.5rem auto;

        width: 80%;
      }

      button {
        font-size: var(--button-font-size, 0.5em);

        background-color: var(--button-disposed-background-color);
        border: var(--button-border);
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;

        display: inline-flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;

        color: var(--button-disposed-label-color);
      }

      button:focus {
        outline: none;
      }

      button.active {
        background-color: var(--button-active-background-color);
        color: var(--button-active-label-color);

        cursor: auto;
      }
    `}};E([C({type:Object})],Rt.prototype,`options`,void 0),E([C({type:Object})],Rt.prototype,`value`,void 0),Rt=E([S(`lcd-selector-element`)],Rt);var z=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.AMOUNT=2]=`AMOUNT`,e[e.VELOCITY=3]=`VELOCITY`,e}({}),zt=class extends N{render(){return g`
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <control-learn-wrapper controlID=${O.CUT_ATTACK}>
              <fader-element label="A" .value=${this.state.attack.value}
                @change=${e=>this.dispatchChange(z.ATTACK,e.detail.value)}
              ></fader-element>
            </control-learn-wrapper>
            <control-learn-wrapper controlID=${O.CUT_DECAY}>
              <fader-element label="D" .value=${this.state.decay.value}
                @change=${e=>this.dispatchChange(z.DECAY,e.detail.value)}
              ></fader-element>
            </control-learn-wrapper>
          </div>
          <div class="mod-controls">
            <div class="mod-control mod">
              <control-learn-wrapper controlID=${O.CUT_MOD}>
                <knob-element label="mod" .value=${this.state.amount.value}
                  @change=${e=>this.dispatchChange(z.AMOUNT,e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <div class="mod-control velocity">
              <control-learn-wrapper controlID=${O.CUT_VEL}>
                <knob-element label="vel" .value=${this.state.velocity.value}
                  @change=${e=>this.dispatchChange(z.VELOCITY,e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
      :host {
        --panel-wrapper-background-color: var(--filter-mod-panel-color);
        --fader-height: 120px;
        --knob-size: 50px;
        container-type: inline-size;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 160px;
      }

      .time-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 60%;
      }

      .mod-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 70%;
      }

      .mod-controls .mod { --knob-size: 40px; }
      .mod-controls .velocity { --knob-size: 25px; }

      @container (max-width: 100px) {
        .envelope-controls { flex-direction: column; gap: 0.5em; }
        .time-controls { width: 100%; }
        .mod-controls { flex-direction: row; gap: 0.5em; height: auto; }
        .mod-controls .mod { --knob-size: 30px; }
        .mod-controls .velocity { --knob-size: 25px; }
        :host { --fader-height: 80px; }
      }
    `}};E([C({type:Object})],zt.prototype,`state`,void 0),zt=E([S(`filter-envelope-element`)],zt);var B=function(e){return e.PLAY=`play`,e.STOP=`stop`,e.BPM=`bpm`,e.SUBDIVISION=`subdivision`,e.DIRECTION=`direction`,e.LOOP=`loop`,e}({}),V=class extends x{constructor(...e){super(...e),this.bpm=120,this.subdivision=4,this.playing=!1,this.direction=0,this.loop=!0}render(){return g`
      <div class="toolbar">
        <div class="panel transport-panel">
          <button
            class=${T({"round-btn":!0,"play-btn":!0,active:this.playing})}
            @click=${()=>this.emit(this.playing?`stop`:`play`,0)}
          >
            ${this.playing?`■`:`▶`}
          </button>
          <button
            class=${T({"round-btn":!0,"loop-btn":!0,active:this.loop})}
            @click=${()=>this.emit(`loop`,+!this.loop)}
          >
            ⟳
          </button>
        </div>
        <div class="panel bpm-panel">
          <control-learn-wrapper .controlID=${O.SEQ_BPM}>
            <div class="lcd-row">
              <button class="inc-btn" @click=${()=>this.emit(`bpm`,Math.max(20,this.bpm-1))}>-</button>
              <lcd-element .text=${String(this.bpm)}></lcd-element>
              <button class="inc-btn" @click=${()=>this.emit(`bpm`,Math.min(300,this.bpm+1))}>+</button>
            </div>
          </control-learn-wrapper>
        </div>
        <div class="panel subdiv-panel">
          ${[1,2,4,8].map(e=>g`
              <button
                class=${T({"toggle-btn":!0,active:this.subdivision===e})}
                @click=${()=>this.emit(`subdivision`,e)}
              >
                ${this.subdivisionName(e)}
              </button>
            `)}
        </div>
        <div class="panel direction-panel">
          ${[`FWD`,`REV`,`P-P`,`RND`].map((e,t)=>g`
              <button
                class=${T({"toggle-btn":!0,active:this.direction===t})}
                @click=${()=>this.emit(`direction`,t)}
              >
                ${e}
              </button>
            `)}
        </div>
      </div>
    `}emit(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t},bubbles:!0,composed:!0}))}subdivisionName(e){switch(e){case 1:return`1/4`;case 2:return`1/8`;case 4:return`1/16`;case 8:return`1/32`;default:return`1/16`}}static{this.styles=u`
    :host {
      display: block;
      --control-label-color: var(--light-secondary);
    }

    .toolbar {
      display: grid;
      grid-template-columns: auto 1fr 1fr 1fr;
      gap: 0.4em;
      align-items: stretch;
    }

    .panel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4em;
      padding: 0.5em 0.6em;
      background: var(--sequencer-panel-color);
      border-radius: 0.4rem;
    }

    .round-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 2px solid var(--light-secondary);
      background: var(--dark-secondary);
      color: var(--lighter);
      cursor: pointer;
      transition: background var(--ui-transition-time);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .round-btn.active {
      background: var(--lcd-led-on-color);
      color: var(--darker);
    }

    .play-btn {
      font-size: 0.7em;
      padding-left: 2px;
    }

    .loop-btn {
      font-size: 1em;
    }

    .lcd-row {
      display: flex;
      align-items: center;
      gap: 0.2em;
      outline: 1px solid var(--learn-outline-color, transparent);
      outline-offset: 2px;
      border-radius: 4px;
    }

    .inc-btn {
      width: 20px;
      height: 20px;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.8em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .inc-btn:hover {
      background: var(--medium);
    }

    .toggle-btn {
      padding: 0.25em 0.4em;
      border: 1px solid var(--light-secondary);
      border-radius: 3px;
      background: var(--dark-secondary);
      color: var(--lighter);
      font-size: 0.65em;
      cursor: pointer;
      transition: background var(--ui-transition-time);
    }

    .toggle-btn.active {
      background: var(--lcd-led-on-color);
      color: var(--darker);
      border-color: var(--lcd-led-on-color);
    }
  `}};E([C({type:Number})],V.prototype,`bpm`,void 0),E([C({type:Number})],V.prototype,`subdivision`,void 0),E([C({type:Boolean})],V.prototype,`playing`,void 0),E([C({type:Number})],V.prototype,`direction`,void 0),E([C({type:Boolean})],V.prototype,`loop`,void 0),V=E([S(`sequencer-toolbar`)],V);var H=class extends N{constructor(...e){super(...e),this.steps=16,this.currentStep=-1,this.pattern=[],this.selectedNote=60,this.selectedVelocity=100}render(){return g`
      <div class="grid-container">
        <div class="step-grid">
          ${Array.from({length:this.steps},(e,t)=>this.renderStep(t))}
        </div>
        <div class="brush-bar">
          <div class="brush-group">
            <label class="brush-label">NOTE</label>
            <div class="note-controls">
              <button class="note-btn" @click=${()=>this.adjustNote(-12)}>-12</button>
              <button class="note-btn" @click=${()=>this.adjustNote(-1)}>-</button>
              <lcd-element .text=${this.noteName(this.selectedNote)}></lcd-element>
              <button class="note-btn" @click=${()=>this.adjustNote(1)}>+</button>
              <button class="note-btn" @click=${()=>this.adjustNote(12)}>+12</button>
            </div>
          </div>
          <div class="brush-group">
            <label class="brush-label">VEL</label>
            <div class="note-controls">
              <button class="note-btn" @click=${()=>this.adjustVelocity(-10)}>-10</button>
              <button class="note-btn" @click=${()=>this.adjustVelocity(-1)}>-</button>
              <lcd-element .text=${String(this.selectedVelocity)}></lcd-element>
              <button class="note-btn" @click=${()=>this.adjustVelocity(1)}>+</button>
              <button class="note-btn" @click=${()=>this.adjustVelocity(10)}>+10</button>
            </div>
          </div>
        </div>
      </div>
    `}renderStep(e){let t=this.pattern[e]??{note:0,velocity:0},n=t.note>0;return g`
      <button
        class=${T({step:!0,active:n,playhead:e===this.currentStep,beat:e%4==0})}
        @click=${()=>this.onStepClick(e)}
        title=${n?this.noteName(t.note):``}
      >
        ${n?g`<span class="step-note">${this.noteName(t.note)}</span>`:v}
      </button>
    `}onStepClick(e){let t=this.pattern[e]??{note:0,velocity:0};t.note>0&&t.note===this.selectedNote?this.dispatchEvent(new CustomEvent(`step-toggle`,{detail:{index:e,note:this.selectedNote,velocity:this.selectedVelocity,action:`off`},bubbles:!0,composed:!0})):this.dispatchEvent(new CustomEvent(`step-toggle`,{detail:{index:e,note:this.selectedNote,velocity:this.selectedVelocity,action:`on`},bubbles:!0,composed:!0}))}adjustNote(e){let t=Math.max(0,Math.min(127,this.selectedNote+e));this.dispatchEvent(new CustomEvent(`note-select`,{detail:{note:t},bubbles:!0,composed:!0}))}adjustVelocity(e){let t=Math.max(1,Math.min(127,this.selectedVelocity+e));this.dispatchEvent(new CustomEvent(`velocity-select`,{detail:{velocity:t},bubbles:!0,composed:!0}))}noteName(e){let t=[`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`],n=Math.floor(e/12)-1;return`${t[e%12]}${n}`}static get styles(){return u`
      :host {
        display: block;
        --control-label-color: var(--light-secondary);
        container-type: inline-size;
      }

      .grid-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        gap: 0.4em;
        padding: 0.25em;
      }

      .step-grid {
        display: grid;
        grid-template-columns: repeat(16, 1fr);
        gap: 3px;
        width: 100%;
      }

      .step {
        aspect-ratio: 1;
        min-width: 20px;
        min-height: 20px;
        border: 1px solid var(--light-secondary);
        border-radius: 3px;
        background: var(--dark-secondary);
        cursor: pointer;
        transition: background 0.1s, box-shadow 0.1s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .step.beat {
        border-color: var(--lighter);
      }

      .step.active {
        background: var(--lcd-led-on-color);
        border-color: var(--lcd-led-on-color);
      }

      .step.playhead {
        box-shadow: 0 0 6px 2px var(--lcd-led-on-color);
        border-color: var(--lighter);
      }

      .step.playhead:not(.active) {
        background: rgba(180, 212, 85, 0.3);
      }

      .step-note {
        font-size: 0.55em;
        font-weight: bold;
        color: var(--darker);
        pointer-events: none;
        line-height: 1;
        text-align: center;
        user-select: none;
      }

      .step:hover {
        opacity: 0.8;
      }

      .brush-bar {
        display: flex;
        align-items: center;
        gap: 1.5em;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }

      .brush-group {
        display: flex;
        align-items: center;
        gap: 0.4em;
      }

      .brush-label {
        color: var(--light-secondary);
        font-size: 0.7em;
        font-weight: bold;
        min-width: 2.5em;
      }

      .note-controls {
        display: flex;
        align-items: center;
        gap: 0.3em;
      }

      .note-btn {
        padding: 0.2em 0.5em;
        border: 1px solid var(--light-secondary);
        border-radius: 3px;
        background: var(--dark-secondary);
        color: var(--lighter);
        font-size: 0.75em;
        cursor: pointer;
        transition: background var(--ui-transition-time);
      }

      .note-btn:hover {
        background: var(--medium);
      }

      @container (max-width: 320px) {
        .step-grid {
          grid-template-columns: repeat(8, 1fr);
        }
      }

      @container (max-width: 160px) {
        .step-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    `}};E([C({type:Number})],H.prototype,`steps`,void 0),E([C({type:Number})],H.prototype,`currentStep`,void 0),E([C({type:Array})],H.prototype,`pattern`,void 0),E([C({type:Number})],H.prototype,`selectedNote`,void 0),E([C({type:Number})],H.prototype,`selectedVelocity`,void 0),H=E([S(`step-grid-panel`)],H);function Bt(e){return e.descriptor.type===`instrument`}function Vt(e){return e.descriptor.type===`midi-source`}function Ht(e){return`getLearnableParams`in e&&`handleControlChange`in e}function Ut(e){return`getFactoryPresets`in e}var U=function(e){return e[e.NOTE_OFF=8]=`NOTE_OFF`,e[e.NOTE_ON=9]=`NOTE_ON`,e[e.POLY_AFTERTOUCH=10]=`POLY_AFTERTOUCH`,e[e.CONTROL_CHANGE=11]=`CONTROL_CHANGE`,e[e.PROGRAM_CHANGE=12]=`PROGRAM_CHANGE`,e[e.CHANNEL_AFTERTOUCH=13]=`CHANNEL_AFTERTOUCH`,e[e.PITCH_BEND=14]=`PITCH_BEND`,e}({}),Wt=class{constructor(e){this.protocol=`midi`,this.handler=null,this.subscription=null,this.bus=e}connect(){this.subscription||=this.bus.subscribe(e=>{this.handler&&this.handler({sourceId:`midi:cc:${e.data1}`,value:e.data2,protocol:this.protocol,raw:e})},{status:U.CONTROL_CHANGE})}disconnect(){this.subscription?.dispose(),this.subscription=null}onSignal(e){return this.handler=e,{dispose:()=>{this.handler=null}}}},W=class extends x{constructor(...e){super(...e),this.midiChannel=`omni`,this.outputChannel=0,this.inputDevice=`all`,this.availableInputs=[],this.learning=!1,this.presets=[],this.presetIndex=0,this.mixNode=null,this.busSubscription=null,this.portChangeCleanup=null,this.midiAdapterRegistered=!1,this.controlChangeListener=null,this.learnStateListener=null}connectedCallback(){super.connectedCallback(),this.midiChannel=this.config?.midiChannel??`omni`,this.outputChannel=this.config?.outputChannel??0,this.inputDevice=this.config?.inputDevice??`all`,this.setupCoreFeatures()}updated(e){(e.has(`config`)||e.has(`plugin`)||e.has(`bus`)||e.has(`audioContext`)||e.has(`parentOutput`))&&(this.wireAudio(),this.wireRouting(),this.setupCoreFeatures()),e.has(`midi`)&&this.syncDeviceList()}disconnectedCallback(){super.disconnectedCallback(),this.teardown()}wireAudio(){if(!this.audioContext)return;this.mixNode||=new GainNode(this.audioContext),this.mixNode.disconnect();let e=this.parentOutput??this.audioContext.destination;this.mixNode.connect(e),this.config?.mode===`leaf`&&this.plugin&&Bt(this.plugin)&&this.plugin.connectAudio(this.mixNode)}wireRouting(){if(this.busSubscription?.dispose(),this.busSubscription=null,this.bus&&this.config?.mode===`leaf`&&this.plugin)if(Bt(this.plugin)){let e=this.midiChannel===`omni`?void 0:{channel:this.midiChannel};this.busSubscription=this.bus.subscribe(e=>this.plugin.receive(e),e)}else Vt(this.plugin)&&(this.plugin.connectMidiOutput(this.bus),this.plugin.setOutputChannel(this.outputChannel))}syncDeviceList(){if(!this.midi){this.availableInputs=[];return}this.availableInputs=this.midi.inputNames(),this.portChangeCleanup?.(),this.portChangeCleanup=this.midi.onPortChange(()=>{this.availableInputs=this.midi.inputNames()})}teardown(){this.busSubscription?.dispose(),this.busSubscription=null,this.portChangeCleanup?.(),this.portChangeCleanup=null,this.mixNode?.disconnect(),this.teardownCoreFeatures()}setupCoreFeatures(){this.config?.mode!==`leaf`||!this.plugin||(Ut(this.plugin)&&(this.presets=this.plugin.getFactoryPresets()),this.setupBindingManager())}setupBindingManager(){if(!this.bus||this.midiAdapterRegistered||!this.plugin||!Ht(this.plugin))return;let e=A(),t=new Wt(this.bus);e.registerSource(t),this.midiAdapterRegistered=!0;let n=this.plugin,r=this.config.id;this.controlChangeListener=(e=>{let{controlId:t,value:i,slotId:a}=e.detail;a===r&&Ht(n)&&n.handleControlChange(t,i)}),e.addEventListener(`control-change`,this.controlChangeListener),this.learnStateListener=()=>{this.learning=e.isLearningSlot(this.config.id)},e.addEventListener(`learn-state-change`,this.learnStateListener)}teardownCoreFeatures(){let e=A();this.controlChangeListener&&=(e.removeEventListener(`control-change`,this.controlChangeListener),null),this.learnStateListener&&=(e.removeEventListener(`learn-state-change`,this.learnStateListener),null)}toggleLearnMode(){let e=A();e.isLearningSlot(this.config.id)?e.exitLearnMode():e.enterLearnMode(this.config.id)}onPresetPrev(){this.presets.length!==0&&(this.presetIndex=(this.presetIndex-1+this.presets.length)%this.presets.length,this.applyPreset())}onPresetNext(){this.presets.length!==0&&(this.presetIndex=(this.presetIndex+1)%this.presets.length,this.applyPreset())}applyPreset(){if(!this.plugin||!Ut(this.plugin))return;let e=this.presets[this.presetIndex];e&&this.plugin.loadState(e.state)}onChannelChange(e){if(this.config?.mode===`leaf`){if(Bt(this.plugin)){if(this.midiChannel===`omni`)this.midiChannel=e>0?0:15;else{let t=this.midiChannel+e;t<0||t>15?this.midiChannel=`omni`:this.midiChannel=t}this.wireRouting()}else if(Vt(this.plugin)){let t=Math.max(0,Math.min(15,this.outputChannel+e));this.outputChannel=t,this.plugin.setOutputChannel(this.outputChannel)}}}onDeviceChange(e){let t=e.target;this.inputDevice=t.value===`all`?`all`:t.value,this.wireRouting()}get channelDisplay(){return Bt(this.plugin)?this.midiChannel===`omni`?`OMNI`:`CH ${this.midiChannel+1}`:`CH ${this.outputChannel+1}`}get channelLabel(){return this.plugin&&Vt(this.plugin)?`OUT`:`IN`}render(){return this.config?this.config.mode===`branch`?this.renderBranch():this.renderLeaf():v}renderBranch(){return g`
      <div class="branch">
        ${(this.config.children??[]).map(e=>g`
            <device-slot
              .config=${e}
              .plugin=${this.plugins?.get(e.pluginId??``)}
              .plugins=${this.plugins}
              .bus=${this.bus}
              .midi=${this.midi}
              .audioContext=${this.audioContext}
              .parentOutput=${this.mixNode}
            ></device-slot>
          `)}
      </div>
    `}renderLeaf(){return this.plugin?g`
      <div class="leaf">
        <div class="slot-header">
          <span class="slot-label">${this.config.name}</span>
          <div class="slot-controls">
            ${this.renderPresetBrowser()}
            ${this.renderLearnButton()}
            ${this.renderDeviceSelector()}
            ${this.renderChannelSelector()}
          </div>
        </div>
        <div class=${T({"slot-body":!0,"learn-active":this.learning})}>
          ${this.renderPluginElement()}
        </div>
      </div>
    `:v}renderPluginElement(){if(!this.plugin)return v;switch(this.plugin.descriptor.tag){case`wasm-poly-element`:return g`
          <wasm-poly-element
            .voiceManager=${this.plugin}
            .audioContext=${this.audioContext}
          ></wasm-poly-element>
        `;case`sequencer-element`:return g`
          <sequencer-element
            .sequencer=${this.plugin}
            .audioContext=${this.audioContext}
          ></sequencer-element>
        `;default:return v}}renderLearnButton(){return!this.plugin||!Ht(this.plugin)?v:g`
      <button
        class=${T({"learn-btn":!0,active:this.learning})}
        @click=${this.toggleLearnMode}
      >LEARN</button>
    `}renderPresetBrowser(){if(!this.plugin||!Ut(this.plugin)||this.presets.length===0)return v;let e=this.presets[this.presetIndex]?.name??``;return g`
      <div class="control-group preset-browser">
        <button class="ch-btn" @click=${this.onPresetPrev}>-</button>
        <lcd-element .text=${e}></lcd-element>
        <button class="ch-btn" @click=${this.onPresetNext}>+</button>
      </div>
    `}renderDeviceSelector(){return!this.plugin||Vt(this.plugin)?v:g`
      <div class="control-group">
        <label class="control-label">DEVICE</label>
        <select class="device-select" @change=${this.onDeviceChange}>
          <option value="all" ?selected=${this.inputDevice===`all`}>ALL</option>
          ${this.availableInputs.map(e=>g`<option value=${e} ?selected=${this.inputDevice===e}>${e}</option>`)}
        </select>
      </div>
    `}renderChannelSelector(){return this.plugin?g`
      <div class="control-group">
        <label class="control-label">${this.channelLabel}</label>
        <div class="channel-control">
          <button class="ch-btn" @click=${()=>this.onChannelChange(-1)}>-</button>
          <lcd-element .text=${this.channelDisplay}></lcd-element>
          <button class="ch-btn" @click=${()=>this.onChannelChange(1)}>+</button>
        </div>
      </div>
    `:v}static{this.styles=u`
    :host {
      display: block;
      width: 100%;
    }

    .branch {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
      align-items: center;
    }

    .leaf {
      display: flex;
      flex-direction: column;
      width: calc(650px + 3em);
      max-width: 100%;
      margin: 0 auto;
    }

    .slot-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 1.5em;
      background: var(--main-panel-color, #181818);
      border-radius: 0.5rem 0.5rem 0 0;
    }

    .slot-label {
      font-family: var(--main-panel-label-font-family, "Bungee Outline", cursive);
      font-size: 1.1em;
      font-weight: 700;
      color: var(--main-panel-label-color, #fff);
      letter-spacing: 0.08em;
      margin-right: auto;
    }

    .slot-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .control-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .control-label {
      font-size: 0.55em;
      font-weight: 600;
      color: var(--light-secondary, #cbe2f3);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .channel-control {
      display: flex;
      align-items: stretch;
      height: 24px;
      --lcd-screen-width: 55px;
      --lcd-font-size: 9px;
    }

    .ch-btn {
      font-size: 0.6em;
      font-weight: bold;
      width: 20px;
      background: var(--button-disposed-background-color, #cbe2f3);
      color: var(--button-disposed-label-color, #15202b);
      border: var(--button-border, 1px solid #cbe2f3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ch-btn:active {
      background: var(--button-active-background-color, #192734);
      color: var(--button-active-label-color, #b4d455);
    }

    .device-select {
      font-size: 0.55em;
      padding: 2px 4px;
      height: 24px;
      background: var(--dark-secondary, #192734);
      color: var(--lighter, #fff);
      border: 1px solid var(--light-secondary, #cbe2f3);
      cursor: pointer;
      max-width: 120px;
    }

    .learn-btn {
      font-size: 0.55em;
      font-weight: 700;
      padding: 4px 10px;
      height: 24px;
      background: var(--button-disposed-background-color, #cbe2f3);
      color: var(--button-disposed-label-color, #15202b);
      border: var(--button-border, 1px solid #cbe2f3);
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: background 0.15s, color 0.15s;
    }

    .learn-btn.active {
      background: var(--button-active-background-color, #b4d455);
      color: var(--button-active-label-color, #15202b);
      animation: learn-blink 0.8s ease-in-out infinite alternate;
    }

    @keyframes learn-blink {
      from { opacity: 1; }
      to { opacity: 0.5; }
    }

    .preset-browser {
      --lcd-screen-width: 90px;
      --lcd-font-size: 9px;
    }

    .slot-body {
      width: 100%;
      border-radius: 0 0 0.5rem 0.5rem;
      overflow: hidden;
      transition: box-shadow 0.2s, outline 0.2s;
    }

    .slot-body.learn-active {
      outline: 2px solid rgba(180, 212, 85, 0.6);
      box-shadow: inset 0 0 20px rgba(180, 212, 85, 0.08);
    }
  `}};E([C({attribute:!1})],W.prototype,`config`,void 0),E([C({attribute:!1})],W.prototype,`plugin`,void 0),E([C({attribute:!1})],W.prototype,`childSlots`,void 0),E([C({attribute:!1})],W.prototype,`plugins`,void 0),E([C({attribute:!1})],W.prototype,`bus`,void 0),E([C({attribute:!1})],W.prototype,`midi`,void 0),E([C({attribute:!1})],W.prototype,`audioContext`,void 0),E([C({attribute:!1})],W.prototype,`parentOutput`,void 0),E([w()],W.prototype,`midiChannel`,void 0),E([w()],W.prototype,`outputChannel`,void 0),E([w()],W.prototype,`inputDevice`,void 0),E([w()],W.prototype,`availableInputs`,void 0),E([w()],W.prototype,`learning`,void 0),E([w()],W.prototype,`presets`,void 0),E([w()],W.prototype,`presetIndex`,void 0),W=E([S(`device-slot`)],W);var Gt=class extends x{constructor(...e){super(...e),this.width=1024,this.height=512}firstUpdated(){this.canvas=this.shadowRoot.getElementById(`visualizer`),this.canvasContext=this.canvas.getContext(`2d`),this.draw()}connectedCallback(){super.connectedCallback(),this.analyser.fftSize=2048*2,this.buffer=new Uint8Array(this.analyser.fftSize)}draw(){this.analyser&&this.drawOscilloscope()}drawOscilloscope(){this.canvasContext.clearRect(0,0,this.canvas.width,this.canvas.height);let e=this.canvas.width/this.analyser.fftSize*4;this.analyser.getByteTimeDomainData(this.buffer),this.canvasContext.beginPath(),this.buffer.forEach((t,n)=>{let r=t/128*(this.canvas.height/2),i=n*e;this.canvasContext.lineTo(i,r)}),this.canvasContext.lineWidth=1,this.canvasContext.strokeStyle=`#b4d455`,this.canvasContext.stroke(),requestAnimationFrame(this.drawOscilloscope.bind(this))}render(){return g`
      <canvas
        class="test"
        id="visualizer"
        width=${this.width}
        height=${this.height}
      ></canvas>
    `}static get styles(){return u`
      canvas {
        border: 1px solid grey;
        border-radius: 0.25rem;
      }
    `}};E([C({attribute:!1})],Gt.prototype,`analyser`,void 0),E([C({type:Number})],Gt.prototype,`width`,void 0),E([C({type:Number})],Gt.prototype,`height`,void 0),Gt=E([S(`visualizer-element`)],Gt),U.NOTE_ON;function Kt(e,t,n){if(e.length===0)return!1;let r=e[0];return r>=240?!1:(n.status=r>>4,n.channel=r&15,n.timestamp=t,n.data1=e.length>1?e[1]:0,n.data2=e.length>2?e[2]:0,!0)}function qt(e){return e.status===U.NOTE_ON&&e.data2>0}function Jt(e){return e.status===U.NOTE_OFF||e.status===U.NOTE_ON&&e.data2===0}var Yt=class{constructor(e){this.connections=[],this.decodeBuffer={status:U.NOTE_ON,channel:0,data1:0,data2:0,timestamp:0},this.onMessage=e=>{if(Kt(e.data,e.timeStamp,this.decodeBuffer))for(let e=0,t=this.connections.length;e<t;e++){let t=this.connections[e];this.matchesFilter(t.filter)&&t.target.receive(this.decodeBuffer)}},this.port=e,this.id=e.id,this.name=e.name??`Unknown`,this.manufacturer=e.manufacturer??``,this.port.onmidimessage=this.onMessage}connect(e,t){let n={target:e,filter:t};return this.connections.push(n),{dispose:()=>{let e=this.connections.indexOf(n);e!==-1&&(this.connections[e]=this.connections[this.connections.length-1],this.connections.pop())}}}disconnect(){this.port.onmidimessage=null,this.connections.length=0}matchesFilter(e){if(!e)return!0;if(e.channel!==void 0){if(Array.isArray(e.channel)){if(!e.channel.includes(this.decodeBuffer.channel))return!1}else if(e.channel!==this.decodeBuffer.channel)return!1}if(e.status!==void 0){if(Array.isArray(e.status)){if(!e.status.includes(this.decodeBuffer.status))return!1}else if(e.status!==this.decodeBuffer.status)return!1}return!0}},Xt=class{constructor(e){this.sendBuf3=new Uint8Array(3),this.sendBuf2=new Uint8Array(2),this.port=e,this.id=e.id,this.name=e.name??`Unknown`,this.manufacturer=e.manufacturer??``}receive(e){let t=e.status<<4|e.channel;e.status===U.PROGRAM_CHANGE||e.status===U.CHANNEL_AFTERTOUCH?(this.sendBuf2[0]=t,this.sendBuf2[1]=e.data1,this.port.send(this.sendBuf2,e.timestamp)):(this.sendBuf3[0]=t,this.sendBuf3[1]=e.data1,this.sendBuf3[2]=e.data2,this.port.send(this.sendBuf3,e.timestamp))}disconnect(){this.port.close()}},Zt=class{constructor(){this.inputs=new Map,this.outputs=new Map,this.midiAccess=null,this.listeners=[],this.onStateChange=e=>{let t=e.port;if(t){if(t.type===`input`){if(t.state===`connected`&&!this.inputs.has(t.id)){let e=this.registerInput(t);this.notify(e,`connected`)}else if(t.state===`disconnected`&&this.inputs.has(t.id)){let e=this.inputs.get(t.id);e.disconnect(),this.inputs.delete(t.id),this.notify(e,`disconnected`)}}else if(t.type===`output`){if(t.state===`connected`&&!this.outputs.has(t.id)){let e=this.registerOutput(t);this.notify(e,`connected`)}else if(t.state===`disconnected`&&this.outputs.has(t.id)){let e=this.outputs.get(t.id);e.disconnect(),this.outputs.delete(t.id),this.notify(e,`disconnected`)}}}}}async init(e){if(!navigator.requestMIDIAccess)throw Error(`Web MIDI API not supported in this browser`);return this.midiAccess=await navigator.requestMIDIAccess(e??{sysex:!1}),this.midiAccess.onstatechange=this.onStateChange,this.midiAccess.inputs.forEach(e=>this.registerInput(e)),this.midiAccess.outputs.forEach(e=>this.registerOutput(e)),this}findInput(e){let t=e.toLowerCase();for(let e of this.inputs.values())if(e.name.toLowerCase().includes(t))return e}findOutput(e){let t=e.toLowerCase();for(let e of this.outputs.values())if(e.name.toLowerCase().includes(t))return e}onPortChange(e){return this.listeners.push(e),()=>{let t=this.listeners.indexOf(e);t!==-1&&this.listeners.splice(t,1)}}destroy(){this.midiAccess&&(this.midiAccess.onstatechange=null);for(let e of this.inputs.values())e.disconnect();for(let e of this.outputs.values())e.disconnect();this.inputs.clear(),this.outputs.clear(),this.listeners.length=0}registerInput(e){let t=new Yt(e);return this.inputs.set(e.id,t),t}registerOutput(e){let t=new Xt(e);return this.outputs.set(e.id,t),t}notify(e,t){for(let n of this.listeners)n(e,t)}};function Qt(e){if(!e?.channel)return 65535;let t=Array.isArray(e.channel)?e.channel:[e.channel],n=0;for(let e of t)n|=1<<e;return n}function $t(e){if(!e?.status)return 127;let t=Array.isArray(e.status)?e.status:[e.status],n=0;for(let e of t)n|=1<<e-8;return n}var en=class{constructor(){this.routes=[]}addRoute(e,t){let n={channelMask:Qt(t),statusMask:$t(t),handler:e};return this.routes.push(n),{dispose:()=>{let e=this.routes.indexOf(n);e!==-1&&(this.routes[e]=this.routes[this.routes.length-1],this.routes.pop())}}}dispatch(e){let t=1<<e.channel,n=1<<e.status-8;for(let r=0,i=this.routes.length;r<i;r++){let i=this.routes[r];i.channelMask&t&&i.statusMask&n&&i.handler(e)}}get routeCount(){return this.routes.length}clear(){this.routes.length=0}},tn=class{constructor(e){this.dispatcher=new en,this.ringTargets=[],this.name=e}receive(e){this.dispatcher.dispatch(e),this.dispatchToRings(e)}send(e,t,n,r,i=performance.now()){let a={status:e,channel:t,data1:n,data2:r,timestamp:i};this.receive(a)}subscribe(e,t){return this.dispatcher.addRoute(e,t)}from(e,t){return e.connect(this,t)}subscribeRing(e,t){let n={ring:e,channelMask:t?.channel?Array.isArray(t.channel)?t.channel.reduce((e,t)=>e|1<<t,0):1<<t.channel:65535,statusMask:t?.status?Array.isArray(t.status)?t.status.reduce((e,t)=>e|1<<t-8,0):1<<t.status-8:127};return this.ringTargets.push(n),{dispose:()=>{let e=this.ringTargets.indexOf(n);e!==-1&&(this.ringTargets[e]=this.ringTargets[this.ringTargets.length-1],this.ringTargets.pop())}}}dispatchToRings(e){let t=1<<e.channel,n=1<<e.status-8;for(let r=0,i=this.ringTargets.length;r<i;r++){let i=this.ringTargets[r];if(i.channelMask&t&&i.statusMask&n){let t=e.status===U.NOTE_ON||e.status===U.NOTE_OFF?dt(e.data1):0;i.ring.enqueue(e,t)}}}},nn=class{constructor(e){this.port=e}channel(e){return this.channelFilter=e,this}notes(){return this.statusFilter=[U.NOTE_ON,U.NOTE_OFF],this}cc(){return this.statusFilter=U.CONTROL_CHANGE,this}pitchBend(){return this.statusFilter=U.PITCH_BEND,this}all(){return this.channelFilter=void 0,this.statusFilter=void 0,this}to(e){let t={};return this.channelFilter!==void 0&&(t.channel=this.channelFilter),this.statusFilter!==void 0&&(t.status=this.statusFilter),this.port.connect(e,Object.keys(t).length>0?t:void 0)}},rn=class{constructor(e){this.buses=new Map,this.devices=e}input(e){let t=this.devices.findInput(e);if(!t)throw Error(`MIDI input "${e}" not found. Available: ${this.inputNames().join(`, `)}`);return new nn(t)}output(e){let t=this.devices.findOutput(e);if(!t)throw Error(`MIDI output "${e}" not found. Available: ${this.outputNames().join(`, `)}`);return t}bus(e){let t=this.buses.get(e);return t||(t=new tn(e),this.buses.set(e,t)),t}inputNames(){return[...this.devices.inputs.values()].map(e=>e.name)}outputNames(){return[...this.devices.outputs.values()].map(e=>e.name)}onPortChange(e){return this.devices.onPortChange(e)}destroy(){this.devices.destroy(),this.buses.clear()}};async function an(e){let t=new Zt;return await t.init(e),new rn(t)}var on=60,sn=0,cn=new Map([[`w`,48],[`x`,50],[`c`,52],[`v`,53],[`b`,55],[`n`,57],[`q`,59],[`s`,60],[`d`,62],[`f`,64],[`g`,65],[`h`,67],[`j`,69],[`k`,71],[`l`,72],[`m`,74],[`a`,49],[`z`,51],[`e`,54],[`r`,56],[`t`,58],[`y`,61],[`u`,63],[`i`,66],[`o`,68],[`p`,70]]),ln=class{constructor(){this.pressedKeys=new Set,this.connections=[],this.event={status:U.NOTE_ON,channel:sn,data1:0,data2:on,timestamp:0},this.onKeyDown=e=>{let t=cn.get(e.key);t===void 0||this.pressedKeys.has(e.key)||(this.pressedKeys.add(e.key),this.event.status=U.NOTE_ON,this.event.data1=t,this.event.data2=on,this.event.timestamp=performance.now(),this.emit())},this.onKeyUp=e=>{if(!this.pressedKeys.delete(e.key))return;let t=cn.get(e.key);t!==void 0&&(this.event.status=U.NOTE_OFF,this.event.data1=t,this.event.data2=0,this.event.timestamp=performance.now(),this.emit())},document.addEventListener(`keydown`,this.onKeyDown),document.addEventListener(`keyup`,this.onKeyUp)}connect(e,t){let n={target:e,filter:t};return this.connections.push(n),{dispose:()=>{let e=this.connections.indexOf(n);e!==-1&&(this.connections[e]=this.connections[this.connections.length-1],this.connections.pop())}}}destroy(){document.removeEventListener(`keydown`,this.onKeyDown),document.removeEventListener(`keyup`,this.onKeyUp),this.connections.length=0}emit(){for(let e=0,t=this.connections.length;e<t;e++)this.connections[e].target.receive(this.event)}},un=class extends AudioWorkletNode{constructor(e,t,n){super(e,t,n)}send(e){this.port.postMessage(e)}dispose(){this.send({type:`__dispose`}),this.disconnect()}},dn=class{constructor(e){e instanceof SharedArrayBuffer?this.buffer=e:this.buffer=new SharedArrayBuffer(e*Float32Array.BYTES_PER_ELEMENT),this.view=new Float32Array(this.buffer)}get length(){return this.view.length}set(e,t){this.view[e]=t}get(e){return this.view[e]}},fn=8;function pn(e){return(e.status&15)<<20|(e.channel&15)<<16|(e.data1&127)<<8|e.data2&127}var mn=class{constructor(e){if(e instanceof SharedArrayBuffer)this.buffer=e,this.capacity=(e.byteLength-fn)/(4*Float32Array.BYTES_PER_ELEMENT);else{this.capacity=e;let t=fn+e*4*Float32Array.BYTES_PER_ELEMENT;this.buffer=new SharedArrayBuffer(t)}this.heads=new Int32Array(this.buffer,0,2),this.data=new Float32Array(this.buffer,fn)}enqueue(e,t=0){let n=Atomics.load(this.heads,1),r=(n+1)%this.capacity;if(r===Atomics.load(this.heads,0))return!1;let i=n*4;return this.data[i]=pn(e),this.data[i+1]=e.timestamp,this.data[i+2]=t,this.data[i+3]=0,Atomics.store(this.heads,1,r),!0}dequeue(e){let t=Atomics.load(this.heads,0);if(t===Atomics.load(this.heads,1))return!1;let n=t*4;return e[0]=this.data[n],e[1]=this.data[n+1],e[2]=this.data[n+2],e[3]=this.data[n+3],Atomics.store(this.heads,0,(t+1)%this.capacity),!0}enqueueRaw(e,t,n,r,i,a=0){let o=Atomics.load(this.heads,1),s=(o+1)%this.capacity;if(s===Atomics.load(this.heads,0))return!1;let c=(e&15)<<20|(t&15)<<16|(n&127)<<8|r&127,l=o*4;return this.data[l]=c,this.data[l+1]=i,this.data[l+2]=a,this.data[l+3]=0,Atomics.store(this.heads,1,s),!0}},G=Object.freeze({OSC1_MODE:0,OSC2_MODE:1,FILTER_MODE:2,LFO1_MODE:3,LFO1_DESTINATION:4,LFO2_MODE:5,LFO2_DESTINATION:6,AMPLITUDE_ATTACK:7,AMPLITUDE_DECAY:8,AMPLITUDE_SUSTAIN:9,AMPLITUDE_RELEASE:10,OSC1_SEMI_SHIFT:11,OSC1_CENT_SHIFT:12,OSC1_CYCLE:13,OSC2_SEMI_SHIFT:14,OSC2_CENT_SHIFT:15,OSC2_CYCLE:16,OSC2_AMPLITUDE:17,NOISE_LEVEL:18,CUTOFF:19,RESONANCE:20,DRIVE:21,CUTOFF_ENV_AMOUNT:22,CUTOFF_ENV_VELOCITY:23,CUTOFF_ENV_ATTACK:24,CUTOFF_ENV_DECAY:25,LFO1_FREQUENCY:26,LFO1_MOD_AMOUNT:27,LFO2_FREQUENCY:28,LFO2_MOD_AMOUNT:29,VOICE_MODE:30,GLIDE_TIME:31,RETRIGGER:32}),hn=33,gn=64,K=Object.freeze([1,0,2,3]),_n=Object.freeze([0,1,3,2]),vn=class extends un{get midiBuffer(){return this.midiRing.buffer}constructor(e){super(e,`synth`,{outputChannelCount:[2]}),this.params=new dn(hn),this.midiRing=new mn(gn),this.send({type:`__init_sab`,paramBuffer:this.params.buffer,midiBuffer:this.midiRing.buffer})}receive(e){let t=e.status===U.NOTE_ON||e.status===U.NOTE_OFF?dt(e.data1):0;this.midiRing.enqueue(e,t)}noteOn(e,t,n){this.midiRing.enqueueRaw(U.NOTE_ON,0,e,n,performance.now(),t)||console.warn(`MIDI ring buffer overflow: noteOn dropped (note=%d)`,e)}noteOff(e){this.midiRing.enqueueRaw(U.NOTE_OFF,0,e,0,performance.now(),0)||console.warn(`MIDI ring buffer overflow: noteOff dropped (note=%d)`,e)}setParam(e,t){this.params.set(e,t)}};function q(e){return{value:e.value}}function yn(e){return{mode:q(e.mode),semiShift:q(e.semiShift),centShift:q(e.centShift),cycle:q(e.cycle)}}var bn={voiceMode:{value:0},glideTime:{value:0},retrigger:{value:1}};function xn(e){let t=e.voiceConfig??bn;return{osc1:yn(e.osc1),osc2:yn(e.osc2),osc2Amplitude:q(e.osc2Amplitude),noiseLevel:q(e.noiseLevel),envelope:{attack:q(e.envelope.attack),decay:q(e.envelope.decay),sustain:q(e.envelope.sustain),release:q(e.envelope.release)},filter:{mode:q(e.filter.mode),cutoff:q(e.filter.cutoff),resonance:q(e.filter.resonance),drive:q(e.filter.drive)},cutoffMod:{attack:q(e.cutoffMod.attack),decay:q(e.cutoffMod.decay),amount:q(e.cutoffMod.amount),velocity:q(e.cutoffMod.velocity)},lfo1:{mode:q(e.lfo1.mode),destination:q(e.lfo1.destination),frequency:q(e.lfo1.frequency),modAmount:q(e.lfo1.modAmount)},lfo2:{mode:q(e.lfo2.mode),destination:q(e.lfo2.destination),frequency:q(e.lfo2.frequency),modAmount:q(e.lfo2.modAmount)},voiceConfig:{voiceMode:q(t.voiceMode),glideTime:q(t.glideTime),retrigger:q(t.retrigger)}}}var J=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e.OSC1=`OSC1`,e.OSC_MIX=`OSC_MIX`,e.NOISE=`NOISE`,e.OSC2=`OSC2`,e.FILTER=`FILTER`,e.ENVELOPE=`ENVELOPE`,e.LFO1=`LFO1`,e.LFO2=`LFO2`,e.CUTOFF_MOD=`CUTOFF_MOD`,e.VOICE_CONFIG=`VOICE_CONFIG`,e}({}),Sn=function(e){return e[e.POLY=0]=`POLY`,e[e.MONO=1]=`MONO`,e}({}),Cn=new yt([{name:`INIT`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:0},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:63},sustain:{value:80},release:{value:20}},filter:{mode:{value:0},cutoff:{value:127},resonance:{value:0},drive:{value:0}},cutoffMod:{attack:{value:0},decay:{value:0},amount:{value:0},velocity:{value:0}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},voiceConfig:{voiceMode:{value:Sn.POLY},glideTime:{value:0},retrigger:{value:1}}}},{name:`THICK PAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:58},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:69},cycle:{value:63.5}},osc2Amplitude:{value:64},noiseLevel:{value:0},envelope:{attack:{value:60},decay:{value:40},sustain:{value:100},release:{value:60}},filter:{mode:{value:0},cutoff:{value:80},resonance:{value:20},drive:{value:0}},cutoffMod:{attack:{value:30},decay:{value:60},amount:{value:40},velocity:{value:20}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:8},modAmount:{value:10}},lfo2:{mode:{value:0},destination:{value:5},frequency:{value:5},modAmount:{value:8}}}},{name:`ACID BASS`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:30},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:30},sustain:{value:0},release:{value:5}},filter:{mode:{value:1},cutoff:{value:10},resonance:{value:100},drive:{value:50}},cutoffMod:{attack:{value:0},decay:{value:25},amount:{value:80},velocity:{value:50}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`PLUCK`,value:{osc1:{mode:{value:3},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:95.25},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:40},noiseLevel:{value:5},envelope:{attack:{value:0},decay:{value:50},sustain:{value:0},release:{value:15}},filter:{mode:{value:0},cutoff:{value:40},resonance:{value:30},drive:{value:10}},cutoffMod:{attack:{value:0},decay:{value:30},amount:{value:60},velocity:{value:40}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`STRINGS`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:66},cycle:{value:63.5}},osc2Amplitude:{value:60},noiseLevel:{value:3},envelope:{attack:{value:80},decay:{value:30},sustain:{value:90},release:{value:70}},filter:{mode:{value:0},cutoff:{value:70},resonance:{value:10},drive:{value:0}},cutoffMod:{attack:{value:50},decay:{value:40},amount:{value:20},velocity:{value:10}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:10},modAmount:{value:4}},lfo2:{mode:{value:0},destination:{value:2},frequency:{value:6},modAmount:{value:6}}}},{name:`WOBBLE`,value:{osc1:{mode:{value:1},semiShift:{value:31.75},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:31.75},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:50},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:0},sustain:{value:127},release:{value:10}},filter:{mode:{value:1},cutoff:{value:30},resonance:{value:80},drive:{value:40}},cutoffMod:{attack:{value:0},decay:{value:0},amount:{value:0},velocity:{value:0}},lfo1:{mode:{value:0},destination:{value:2},frequency:{value:20},modAmount:{value:90}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`BRASS`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:75}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:45},noiseLevel:{value:0},envelope:{attack:{value:5},decay:{value:40},sustain:{value:70},release:{value:15}},filter:{mode:{value:0},cutoff:{value:50},resonance:{value:15},drive:{value:20}},cutoffMod:{attack:{value:3},decay:{value:30},amount:{value:60},velocity:{value:40}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`AMBIENT`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:3},semiShift:{value:95.25},centShift:{value:66},cycle:{value:63.5}},osc2Amplitude:{value:35},noiseLevel:{value:8},envelope:{attack:{value:100},decay:{value:50},sustain:{value:80},release:{value:100}},filter:{mode:{value:0},cutoff:{value:60},resonance:{value:25},drive:{value:0}},cutoffMod:{attack:{value:60},decay:{value:80},amount:{value:30},velocity:{value:10}},lfo1:{mode:{value:0},destination:{value:2},frequency:{value:4},modAmount:{value:15}},lfo2:{mode:{value:3},destination:{value:5},frequency:{value:3},modAmount:{value:10}}}},{name:`SUB BASS`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:0},noiseLevel:{value:0},envelope:{attack:{value:2},decay:{value:20},sustain:{value:100},release:{value:10}},filter:{mode:{value:0},cutoff:{value:50},resonance:{value:0},drive:{value:15}},cutoffMod:{attack:{value:0},decay:{value:15},amount:{value:20},velocity:{value:30}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`RESO LEAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:67},cycle:{value:50}},osc2Amplitude:{value:55},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:10},sustain:{value:110},release:{value:15}},filter:{mode:{value:0},cutoff:{value:60},resonance:{value:70},drive:{value:25}},cutoffMod:{attack:{value:0},decay:{value:20},amount:{value:40},velocity:{value:50}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:35},modAmount:{value:5}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`FUNK BASS`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:55}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:25},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:25},sustain:{value:50},release:{value:8}},filter:{mode:{value:1},cutoff:{value:18},resonance:{value:75},drive:{value:45}},cutoffMod:{attack:{value:0},decay:{value:18},amount:{value:80},velocity:{value:55}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:15},modAmount:{value:25}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`SYNC LEAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:83},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:70},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:15},sustain:{value:100},release:{value:12}},filter:{mode:{value:0},cutoff:{value:90},resonance:{value:35},drive:{value:15}},cutoffMod:{attack:{value:0},decay:{value:25},amount:{value:35},velocity:{value:40}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:40},modAmount:{value:4}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`ELECTRIC PIANO`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:3},semiShift:{value:95.25},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:30},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:60},sustain:{value:30},release:{value:35}},filter:{mode:{value:0},cutoff:{value:75},resonance:{value:10},drive:{value:0}},cutoffMod:{attack:{value:0},decay:{value:40},amount:{value:25},velocity:{value:55}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:25},modAmount:{value:3}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`CLAV`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:45}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:80}},osc2Amplitude:{value:35},noiseLevel:{value:3},envelope:{attack:{value:0},decay:{value:35},sustain:{value:0},release:{value:5}},filter:{mode:{value:2},cutoff:{value:50},resonance:{value:55},drive:{value:25}},cutoffMod:{attack:{value:0},decay:{value:20},amount:{value:55},velocity:{value:65}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`NOISE SWEEP`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:0},noiseLevel:{value:90},envelope:{attack:{value:50},decay:{value:40},sustain:{value:80},release:{value:80}},filter:{mode:{value:0},cutoff:{value:20},resonance:{value:85},drive:{value:10}},cutoffMod:{attack:{value:70},decay:{value:50},amount:{value:60},velocity:{value:20}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:6},modAmount:{value:50}},lfo2:{mode:{value:0},destination:{value:3},frequency:{value:4},modAmount:{value:20}}}},{name:`RING MOD`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:82},centShift:{value:80},cycle:{value:63.5}},osc2Amplitude:{value:80},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:70},sustain:{value:20},release:{value:50}},filter:{mode:{value:2},cutoff:{value:45},resonance:{value:50},drive:{value:15}},cutoffMod:{attack:{value:0},decay:{value:50},amount:{value:30},velocity:{value:30}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:3},destination:{value:1},frequency:{value:8},modAmount:{value:15}}}},{name:`CHIPTUNE`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:95.25},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:40},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:0},sustain:{value:127},release:{value:3}},filter:{mode:{value:0},cutoff:{value:127},resonance:{value:0},drive:{value:0}},cutoffMod:{attack:{value:0},decay:{value:0},amount:{value:0},velocity:{value:0}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`DARK PAD`,value:{osc1:{mode:{value:3},semiShift:{value:63.5},centShift:{value:61},cycle:{value:63.5}},osc2:{mode:{value:3},semiShift:{value:63.5},centShift:{value:66},cycle:{value:63.5}},osc2Amplitude:{value:60},noiseLevel:{value:5},envelope:{attack:{value:90},decay:{value:50},sustain:{value:100},release:{value:90}},filter:{mode:{value:0},cutoff:{value:35},resonance:{value:20},drive:{value:10}},cutoffMod:{attack:{value:70},decay:{value:60},amount:{value:15},velocity:{value:10}},lfo1:{mode:{value:0},destination:{value:2},frequency:{value:3},modAmount:{value:10}},lfo2:{mode:{value:3},destination:{value:1},frequency:{value:2},modAmount:{value:8}}}},{name:`SHIMMER`,value:{osc1:{mode:{value:3},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:95.25},centShift:{value:65},cycle:{value:63.5}},osc2Amplitude:{value:50},noiseLevel:{value:6},envelope:{attack:{value:70},decay:{value:40},sustain:{value:85},release:{value:110}},filter:{mode:{value:3},cutoff:{value:50},resonance:{value:30},drive:{value:0}},cutoffMod:{attack:{value:40},decay:{value:60},amount:{value:25},velocity:{value:15}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:5},modAmount:{value:12}},lfo2:{mode:{value:0},destination:{value:4},frequency:{value:7},modAmount:{value:8}}}},{name:`MONO LEAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:65},cycle:{value:50}},osc2Amplitude:{value:50},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:15},sustain:{value:100},release:{value:10}},filter:{mode:{value:0},cutoff:{value:70},resonance:{value:50},drive:{value:20}},cutoffMod:{attack:{value:0},decay:{value:20},amount:{value:50},velocity:{value:40}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:30},modAmount:{value:5}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},voiceConfig:{voiceMode:{value:Sn.MONO},glideTime:{value:.05},retrigger:{value:0}}}},{name:`MONO BASS`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:55}},osc2Amplitude:{value:40},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:25},sustain:{value:60},release:{value:8}},filter:{mode:{value:1},cutoff:{value:15},resonance:{value:60},drive:{value:40}},cutoffMod:{attack:{value:0},decay:{value:20},amount:{value:70},velocity:{value:50}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},voiceConfig:{voiceMode:{value:Sn.MONO},glideTime:{value:0},retrigger:{value:1}}}},{name:`GLIDE LEAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:67},cycle:{value:63.5}},osc2Amplitude:{value:60},noiseLevel:{value:0},envelope:{attack:{value:5},decay:{value:20},sustain:{value:90},release:{value:20}},filter:{mode:{value:0},cutoff:{value:80},resonance:{value:40},drive:{value:15}},cutoffMod:{attack:{value:0},decay:{value:30},amount:{value:35},velocity:{value:30}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:25},modAmount:{value:4}},lfo2:{mode:{value:0},destination:{value:2},frequency:{value:5},modAmount:{value:8}},voiceConfig:{voiceMode:{value:Sn.MONO},glideTime:{value:.25},retrigger:{value:0}}}}]),wn=class extends EventTarget{constructor(e){super(),this.descriptor={id:`wasm-poly`,name:`WASM POLY`,tag:`wasm-poly-element`,type:`instrument`},this.synthNode=null,this._observers=new Map,this.controlHandlers=new Map,this.audioContext=e,this.output=new GainNode(e),this.setState(xn(Cn.getCurrent().value)),this.initControlHandlers()}init(){this.synthNode=new vn(this.audioContext),this.synthNode.connect(this.output),this.syncParams()}connectAudio(e){this.output.connect(e)}disconnectAudio(){this.output.disconnect()}loadState(e){e&&this.setState(e)}dispose(){this.output.disconnect(),this.synthNode=null}receive(e){if(qt(e)){let t=dt(e.data1);this.synthNode?.noteOn(e.data1,t,e.data2),this.dispatch(J.NOTE_ON,{midiValue:e.data1,frequency:t,velocity:e.data2})}else Jt(e)&&(this.synthNode?.noteOff(e.data1),this.dispatch(J.NOTE_OFF,{midiValue:e.data1}))}handleControlChange(e,t){let n=this.controlHandlers.get(e);n&&n(t)}next({frequency:e,midiValue:t,velocity:n=60}){this.synthNode?.noteOn(t,e,n)}stop({midiValue:e}){this.synthNode?.noteOff(e)}connect(e){this.output.connect(e)}dispatch(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t})),this}subscribe(e,t){let n=e=>t(e.detail);return this._observers.set(t,n),this.addEventListener(e,n),this}unsubscribe(e,t){return this.removeEventListener(e,this._observers.get(t)),this._observers.delete(t),this}getState(){return{...this.state}}setState(e){return this.state=xn(e),this.syncParams(),this.notifyStateChange(),this.getState()}notifyStateChange(){let e=this.state;this.dispatch(J.OSC1,{...e.osc1}),this.dispatch(J.OSC_MIX,e.osc2Amplitude),this.dispatch(J.NOISE,e.noiseLevel),this.dispatch(J.OSC2,{...e.osc2}),this.dispatch(J.FILTER,{...e.filter}),this.dispatch(J.ENVELOPE,{...e.envelope}),this.dispatch(J.LFO1,{...e.lfo1}),this.dispatch(J.LFO2,{...e.lfo2}),this.dispatch(J.CUTOFF_MOD,{...e.cutoffMod}),this.dispatch(J.VOICE_CONFIG,{...e.voiceConfig})}getLearnableParams(){return[O.OSC1_SEMI,O.OSC1_CENT,O.OSC1_CYCLE,O.OSC_MIX,O.NOISE,O.OSC2_SEMI,O.OSC2_CENT,O.OSC2_CYCLE,O.CUTOFF,O.RESONANCE,O.DRIVE,O.ATTACK,O.DECAY,O.SUSTAIN,O.RELEASE,O.LFO1_FREQ,O.LFO1_MOD,O.LFO2_FREQ,O.LFO2_MOD,O.CUT_MOD,O.CUT_VEL,O.CUT_ATTACK,O.CUT_DECAY,O.GLIDE_TIME].map(e=>({id:e,name:O[e].replace(/_/g,` `)}))}getFactoryPresets(){return Cn.map(e=>({name:e.name,state:e.value}))}setOsc1Mode(e){return this.state.osc1.mode.value=e,this.sendParam(G.OSC1_MODE,K[e]),this}setOsc1SemiShift(e){return this.state.osc1.semiShift.value=e,this.sendParam(G.OSC1_SEMI_SHIFT,e),this}setOsc1CentShift(e){return this.state.osc1.centShift.value=e,this.sendParam(G.OSC1_CENT_SHIFT,e),this}setOsc1Cycle(e){return this.state.osc1.cycle.value=e,this.sendParam(G.OSC1_CYCLE,e),this}setOsc2Mode(e){return this.state.osc2.mode.value=e,this.sendParam(G.OSC2_MODE,K[e]),this}setOsc2SemiShift(e){return this.state.osc2.semiShift.value=e,this.sendParam(G.OSC2_SEMI_SHIFT,e),this}setOsc2CentShift(e){return this.state.osc2.centShift.value=e,this.sendParam(G.OSC2_CENT_SHIFT,e),this}setOsc2Cycle(e){return this.state.osc2.cycle.value=e,this.sendParam(G.OSC2_CYCLE,e),this}setOsc2Amplitude(e){return this.state.osc2Amplitude.value=e,this.sendParam(G.OSC2_AMPLITUDE,e),this}setNoiseLevel(e){return this.state.noiseLevel.value=e,this.sendParam(G.NOISE_LEVEL,e),this}setAmplitudeEnvelopeAttack(e){return this.state.envelope.attack.value=e,this.sendParam(G.AMPLITUDE_ATTACK,e),this}setAmplitudeEnvelopeDecay(e){return this.state.envelope.decay.value=e,this.sendParam(G.AMPLITUDE_DECAY,e),this}setAmplitudeEnvelopeSustain(e){return this.state.envelope.sustain.value=e,this.sendParam(G.AMPLITUDE_SUSTAIN,e),this}setAmplitudeEnvelopeRelease(e){return this.state.envelope.release.value=e,this.sendParam(G.AMPLITUDE_RELEASE,e),this}setFilterMode(e){return this.state.filter.mode.value=e,this.sendParam(G.FILTER_MODE,_n[e]),this}setFilterCutoff(e){return this.state.filter.cutoff.value=e,this.sendParam(G.CUTOFF,e),this}setFilterResonance(e){return this.state.filter.resonance.value=e,this.sendParam(G.RESONANCE,e),this}setDrive(e){return this.state.filter.drive.value=e,this.sendParam(G.DRIVE,e),this}setCutoffEnvelopeAmount(e){return this.state.cutoffMod.amount.value=e,this.sendParam(G.CUTOFF_ENV_AMOUNT,e),this}setCutoffEnvelopeVelocity(e){return this.state.cutoffMod.velocity.value=e,this.sendParam(G.CUTOFF_ENV_VELOCITY,e),this}setCutoffEnvelopeAttack(e){return this.state.cutoffMod.attack.value=e,this.sendParam(G.CUTOFF_ENV_ATTACK,e),this}setCutoffEnvelopeDecay(e){return this.state.cutoffMod.decay.value=e,this.sendParam(G.CUTOFF_ENV_DECAY,e),this}setLfo1Mode(e){return this.state.lfo1.mode.value=e,this.sendParam(G.LFO1_MODE,K[e]),this}setLfo1Destination(e){return this.state.lfo1.destination.value=e,this.sendParam(G.LFO1_DESTINATION,e),this}setLfo1Frequency(e){return this.state.lfo1.frequency.value=e,this.sendParam(G.LFO1_FREQUENCY,e),this}setLfo1ModAmount(e){return this.state.lfo1.modAmount.value=e,this.sendParam(G.LFO1_MOD_AMOUNT,e),this}setLfo2Mode(e){return this.state.lfo2.mode.value=e,this.sendParam(G.LFO2_MODE,K[e]),this}setLfo2Destination(e){return this.state.lfo2.destination.value=e,this.sendParam(G.LFO2_DESTINATION,e),this}setLfo2Frequency(e){return this.state.lfo2.frequency.value=e,this.sendParam(G.LFO2_FREQUENCY,e),this}setLfo2ModAmount(e){return this.state.lfo2.modAmount.value=e,this.sendParam(G.LFO2_MOD_AMOUNT,e),this}setVoiceMode(e){return this.state.voiceConfig.voiceMode.value=e,this.sendParam(G.VOICE_MODE,e),this.dispatch(J.VOICE_CONFIG,{...this.state.voiceConfig}),this}setGlideTime(e){return this.state.voiceConfig.glideTime.value=e,this.sendParam(G.GLIDE_TIME,e),this.dispatch(J.VOICE_CONFIG,{...this.state.voiceConfig}),this}setRetrigger(e){return this.state.voiceConfig.retrigger.value=e,this.sendParam(G.RETRIGGER,e),this.dispatch(J.VOICE_CONFIG,{...this.state.voiceConfig}),this}dumpState(){console.log(JSON.stringify(this.state))}initControlHandlers(){let e=(e,t,n,r,i)=>{this.controlHandlers.set(e,e=>{r(e),this.sendParam(t,e),this.dispatch(n,{...i()})})};e(O.OSC1_SEMI,G.OSC1_SEMI_SHIFT,J.OSC1,e=>{this.state.osc1.semiShift.value=e},()=>this.state.osc1),e(O.OSC1_CENT,G.OSC1_CENT_SHIFT,J.OSC1,e=>{this.state.osc1.centShift.value=e},()=>this.state.osc1),e(O.OSC1_CYCLE,G.OSC1_CYCLE,J.OSC1,e=>{this.state.osc1.cycle.value=e},()=>this.state.osc1),e(O.OSC2_SEMI,G.OSC2_SEMI_SHIFT,J.OSC2,e=>{this.state.osc2.semiShift.value=e},()=>this.state.osc2),e(O.OSC2_CENT,G.OSC2_CENT_SHIFT,J.OSC2,e=>{this.state.osc2.centShift.value=e},()=>this.state.osc2),e(O.OSC2_CYCLE,G.OSC2_CYCLE,J.OSC2,e=>{this.state.osc2.cycle.value=e},()=>this.state.osc2),e(O.OSC_MIX,G.OSC2_AMPLITUDE,J.OSC_MIX,e=>{this.state.osc2Amplitude.value=e},()=>this.state.osc2Amplitude),e(O.NOISE,G.NOISE_LEVEL,J.NOISE,e=>{this.state.noiseLevel.value=e},()=>this.state.noiseLevel),e(O.CUTOFF,G.CUTOFF,J.FILTER,e=>{this.state.filter.cutoff.value=e},()=>this.state.filter),e(O.RESONANCE,G.RESONANCE,J.FILTER,e=>{this.state.filter.resonance.value=e},()=>this.state.filter),e(O.DRIVE,G.DRIVE,J.FILTER,e=>{this.state.filter.drive.value=e},()=>this.state.filter),e(O.ATTACK,G.AMPLITUDE_ATTACK,J.ENVELOPE,e=>{this.state.envelope.attack.value=e},()=>this.state.envelope),e(O.DECAY,G.AMPLITUDE_DECAY,J.ENVELOPE,e=>{this.state.envelope.decay.value=e},()=>this.state.envelope),e(O.SUSTAIN,G.AMPLITUDE_SUSTAIN,J.ENVELOPE,e=>{this.state.envelope.sustain.value=e},()=>this.state.envelope),e(O.RELEASE,G.AMPLITUDE_RELEASE,J.ENVELOPE,e=>{this.state.envelope.release.value=e},()=>this.state.envelope),e(O.LFO1_FREQ,G.LFO1_FREQUENCY,J.LFO1,e=>{this.state.lfo1.frequency.value=e},()=>this.state.lfo1),e(O.LFO1_MOD,G.LFO1_MOD_AMOUNT,J.LFO1,e=>{this.state.lfo1.modAmount.value=e},()=>this.state.lfo1),e(O.LFO2_FREQ,G.LFO2_FREQUENCY,J.LFO2,e=>{this.state.lfo2.frequency.value=e},()=>this.state.lfo2),e(O.LFO2_MOD,G.LFO2_MOD_AMOUNT,J.LFO2,e=>{this.state.lfo2.modAmount.value=e},()=>this.state.lfo2),e(O.CUT_ATTACK,G.CUTOFF_ENV_ATTACK,J.CUTOFF_MOD,e=>{this.state.cutoffMod.attack.value=e},()=>this.state.cutoffMod),e(O.CUT_DECAY,G.CUTOFF_ENV_DECAY,J.CUTOFF_MOD,e=>{this.state.cutoffMod.decay.value=e},()=>this.state.cutoffMod),e(O.CUT_MOD,G.CUTOFF_ENV_AMOUNT,J.CUTOFF_MOD,e=>{this.state.cutoffMod.amount.value=e},()=>this.state.cutoffMod),e(O.CUT_VEL,G.CUTOFF_ENV_VELOCITY,J.CUTOFF_MOD,e=>{this.state.cutoffMod.velocity.value=e},()=>this.state.cutoffMod),e(O.GLIDE_TIME,G.GLIDE_TIME,J.VOICE_CONFIG,e=>{this.state.voiceConfig.glideTime.value=e},()=>this.state.voiceConfig)}sendParam(e,t){this.synthNode?.setParam(e,t)}syncParams(){if(!this.synthNode)return;let e=this.state;this.sendParam(G.OSC1_MODE,K[e.osc1.mode.value]),this.sendParam(G.OSC1_SEMI_SHIFT,e.osc1.semiShift.value),this.sendParam(G.OSC1_CENT_SHIFT,e.osc1.centShift.value),this.sendParam(G.OSC1_CYCLE,e.osc1.cycle.value),this.sendParam(G.OSC2_MODE,K[e.osc2.mode.value]),this.sendParam(G.OSC2_SEMI_SHIFT,e.osc2.semiShift.value),this.sendParam(G.OSC2_CENT_SHIFT,e.osc2.centShift.value),this.sendParam(G.OSC2_CYCLE,e.osc2.cycle.value),this.sendParam(G.OSC2_AMPLITUDE,e.osc2Amplitude.value),this.sendParam(G.NOISE_LEVEL,e.noiseLevel.value),this.sendParam(G.AMPLITUDE_ATTACK,e.envelope.attack.value),this.sendParam(G.AMPLITUDE_DECAY,e.envelope.decay.value),this.sendParam(G.AMPLITUDE_SUSTAIN,e.envelope.sustain.value),this.sendParam(G.AMPLITUDE_RELEASE,e.envelope.release.value),this.sendParam(G.FILTER_MODE,_n[e.filter.mode.value]),this.sendParam(G.CUTOFF,e.filter.cutoff.value),this.sendParam(G.RESONANCE,e.filter.resonance.value),this.sendParam(G.DRIVE,e.filter.drive.value),this.sendParam(G.CUTOFF_ENV_AMOUNT,e.cutoffMod.amount.value),this.sendParam(G.CUTOFF_ENV_VELOCITY,e.cutoffMod.velocity.value),this.sendParam(G.CUTOFF_ENV_ATTACK,e.cutoffMod.attack.value),this.sendParam(G.CUTOFF_ENV_DECAY,e.cutoffMod.decay.value),this.sendParam(G.LFO1_MODE,K[e.lfo1.mode.value]),this.sendParam(G.LFO1_DESTINATION,e.lfo1.destination.value),this.sendParam(G.LFO1_FREQUENCY,e.lfo1.frequency.value),this.sendParam(G.LFO1_MOD_AMOUNT,e.lfo1.modAmount.value),this.sendParam(G.LFO2_MODE,K[e.lfo2.mode.value]),this.sendParam(G.LFO2_DESTINATION,e.lfo2.destination.value),this.sendParam(G.LFO2_FREQUENCY,e.lfo2.frequency.value),this.sendParam(G.LFO2_MOD_AMOUNT,e.lfo2.modAmount.value),this.sendParam(G.VOICE_MODE,e.voiceConfig.voiceMode.value),this.sendParam(G.GLIDE_TIME,e.voiceConfig.glideTime.value),this.sendParam(G.RETRIGGER,e.voiceConfig.retrigger.value)}},Tn=function(e){return e[e.STOPPED=0]=`STOPPED`,e[e.PLAYING=1]=`PLAYING`,e}({}),Y=function(e){return e[e.BPM=0]=`BPM`,e[e.STEPS=1]=`STEPS`,e[e.SUBDIVISION=2]=`SUBDIVISION`,e[e.SWING=3]=`SWING`,e[e.GATE=4]=`GATE`,e[e.DIRECTION=5]=`DIRECTION`,e[e.LOOP=6]=`LOOP`,e[e.OUTPUT_CHANNEL=7]=`OUTPUT_CHANNEL`,e}({}),X={bpm:120,steps:16,subdivision:4,swing:0,gate:75,direction:0,loop:!0,outputChannel:0},En=class{constructor(e){e instanceof SharedArrayBuffer?this.buffer=e:this.buffer=new SharedArrayBuffer(8*Float32Array.BYTES_PER_ELEMENT),this.view=new Float32Array(this.buffer),e instanceof SharedArrayBuffer||this.applyDefaults()}applyDefaults(){this.setBpm(X.bpm),this.setSteps(X.steps),this.setSubdivision(X.subdivision),this.setSwing(X.swing),this.setGate(X.gate),this.setDirection(X.direction),this.setLoop(X.loop),this.setOutputChannel(X.outputChannel)}setBpm(e){this.view[Y.BPM]=Math.max(20,Math.min(300,e))}setSteps(e){this.view[Y.STEPS]=Math.max(1,Math.min(64,Math.round(e)))}setSubdivision(e){this.view[Y.SUBDIVISION]=e}setSwing(e){this.view[Y.SWING]=Math.max(0,Math.min(100,e))}setGate(e){this.view[Y.GATE]=Math.max(5,Math.min(100,e))}setDirection(e){this.view[Y.DIRECTION]=e}setLoop(e){this.view[Y.LOOP]=+!!e}setOutputChannel(e){this.view[Y.OUTPUT_CHANNEL]=e}getConfig(){return{bpm:this.view[Y.BPM],steps:this.view[Y.STEPS],subdivision:this.view[Y.SUBDIVISION],swing:this.view[Y.SWING],gate:this.view[Y.GATE],direction:this.view[Y.DIRECTION],loop:this.view[Y.LOOP]===1,outputChannel:this.view[Y.OUTPUT_CHANNEL]}}},Dn=class{constructor(e){e instanceof SharedArrayBuffer?this.buffer=e:this.buffer=new SharedArrayBuffer(128),this.view=new Uint8Array(this.buffer)}setStep(e,t,n){let r=e*2;this.view[r]=t&127,this.view[r+1]=n&127}clearStep(e){let t=e*2;this.view[t]=0,this.view[t+1]=0}getStep(e){let t=e*2;return{note:this.view[t],velocity:this.view[t+1]}}isStepActive(e){return this.view[e*2]!==0}clear(){this.view.fill(0)}},On=class extends AudioWorkletNode{constructor(e){super(e,`seq`,{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]}),this.positionCallback=null,this.config=new En,this.pattern=new Dn,this.outputRing=new mn(128),this.port.postMessage({type:`__init_sab`,configBuffer:this.config.buffer,patternBuffer:this.pattern.buffer,ringBuffer:this.outputRing.buffer}),this.port.onmessage=e=>this.onMessage(e.data)}onMessage(e){e.type===`__position`&&this.positionCallback&&this.positionCallback(e.step??-1)}onPosition(e){this.positionCallback=e}start(){this.port.postMessage({type:`__start`})}stop(){this.port.postMessage({type:`__stop`})}},kn=10,An=2*Int32Array.BYTES_PER_ELEMENT,jn=class extends EventTarget{constructor(e){super(),this.descriptor={id:`sequencer`,name:`SEQUENCER`,tag:`sequencer-element`,type:`midi-source`},this.node=null,this.bus=null,this.drainTimer=null,this.transport=Tn.STOPPED,this._currentStep=-1,this.audioContext=e}init(){this.node=new On(this.audioContext),this.node.connect(this.audioContext.destination),this.node.onPosition(e=>{this._currentStep=e,this.dispatchEvent(new CustomEvent(`position`,{detail:{step:e}}))})}connectMidiOutput(e){this.bus=e}setOutputChannel(e){this.node?.config.setOutputChannel(e)}getState(){return{config:this.node?.config.getConfig()??{...X},transport:this.transport,currentStep:this._currentStep}}loadState(e){}dispose(){this.stop(),this.node?.disconnect(),this.node=null,this.bus=null}get currentStep(){return this._currentStep}get isPlaying(){return this.transport===Tn.PLAYING}start(){this.node&&(this.transport=Tn.PLAYING,this.node.start(),this.startDrain(),this.dispatchEvent(new CustomEvent(`transport`,{detail:{state:this.transport}})))}stop(){this.node&&(this.transport=Tn.STOPPED,this.node.stop(),this.stopDrain(),this._currentStep=-1,this.dispatchEvent(new CustomEvent(`transport`,{detail:{state:this.transport}})))}setBpm(e){this.node?.config.setBpm(e)}setSteps(e){this.node?.config.setSteps(e)}setSubdivision(e){this.node?.config.setSubdivision(e)}setSwing(e){this.node?.config.setSwing(e)}setGate(e){this.node?.config.setGate(e)}setDirection(e){this.node?.config.setDirection(e)}setLoop(e){this.node?.config.setLoop(e)}getLearnableParams(){return[{id:O.SEQ_BPM,name:`BPM`},{id:O.SEQ_SWING,name:`SWING`},{id:O.SEQ_GATE,name:`GATE`}]}handleControlChange(e,t){switch(e){case O.SEQ_BPM:this.setBpm(Math.round(40+t/127*200)),this.dispatchEvent(new CustomEvent(`config-change`));break;case O.SEQ_SWING:this.setSwing(t/127),this.dispatchEvent(new CustomEvent(`config-change`));break;case O.SEQ_GATE:this.setGate(.1+t/127*.9),this.dispatchEvent(new CustomEvent(`config-change`));break}}setStep(e,t,n){this.node?.pattern.setStep(e,t,n)}clearStep(e){this.node?.pattern.clearStep(e)}toggleStep(e,t,n){return this.node?this.node.pattern.isStepActive(e)?(this.node.pattern.clearStep(e),!1):(this.node.pattern.setStep(e,t,n),!0):!1}getStep(e){return this.node?.pattern.getStep(e)??{note:0,velocity:0}}clearPattern(){this.node?.pattern.clear()}startDrain(){this.drainTimer===null&&(this.drainTimer=setInterval(()=>this.drain(),kn))}stopDrain(){this.drainTimer!==null&&(clearInterval(this.drainTimer),this.drainTimer=null),this.drain()}drain(){if(!this.node||!this.bus)return;let e=this.node.outputRing,t=new Int32Array(e.buffer,0,2),n=new Float32Array(e.buffer,An),r=(e.buffer.byteLength-An)/(4*Float32Array.BYTES_PER_ELEMENT),i=Atomics.load(t,0),a=Atomics.load(t,1);for(;i!==a;){let e=i*4,a=n[e],o=n[e+1],s=a>>20&15,c=a>>16&15,l=a>>8&127,u=a&127;this.bus.send(s,c,l,u,o),i=(i+1)%r,Atomics.store(t,0,i)}}};function Mn(e,t,n,r={}){return{id:e,name:t,mode:`leaf`,pluginId:n,inputDevice:r.inputDevice??`all`,midiChannel:r.midiChannel??`omni`,outputChannel:r.outputChannel??0,...r}}function Nn(e,t,n){return{id:e,name:t,mode:`branch`,children:n}}var Pn=function(e){return e.VOICE_MODE=`VOICE_MODE`,e.GLIDE_TIME=`GLIDE_TIME`,e.RETRIGGER=`RETRIGGER`,e}({});function Z(e){throw Error(`Unexpected discriminant: ${e}`)}var Q=class extends x{constructor(...e){super(...e),this.analyzer=null,this.state={},this.showVizualizer=!1,this.editMode=!1,this._pendingKeyUpdate=!1,this.pressedKeys=new Set}connectedCallback(){super.connectedCallback(),!(!this.voiceManager||!this.audioContext)&&(this.state=this.voiceManager.getState(),this.analyzer=this.audioContext.createAnalyser(),this.voiceManager.connect(this.analyzer),this.registerVoiceHandlers())}scheduleKeyUpdate(){this._pendingKeyUpdate||(this._pendingKeyUpdate=!0,requestAnimationFrame(()=>{this._pendingKeyUpdate=!1,this.pressedKeys=new Set(this.pressedKeys)}))}registerVoiceHandlers(){this.voiceManager.subscribe(J.NOTE_ON,e=>{this.pressedKeys.add(e.midiValue),this.scheduleKeyUpdate()}).subscribe(J.NOTE_OFF,e=>{this.pressedKeys.delete(e.midiValue),this.scheduleKeyUpdate()}).subscribe(J.OSC1,e=>{this.state.osc1=e,this.requestUpdate()}).subscribe(J.OSC_MIX,e=>{this.state.osc2Amplitude=e,this.requestUpdate()}).subscribe(J.NOISE,e=>{this.state.noiseLevel=e,this.requestUpdate()}).subscribe(J.OSC2,e=>{this.state.osc2=e,this.requestUpdate()}).subscribe(J.FILTER,e=>{this.state.filter=e,this.requestUpdate()}).subscribe(J.ENVELOPE,e=>{this.state.envelope=e,this.requestUpdate()}).subscribe(J.LFO1,e=>{this.state.lfo1=e,this.requestUpdate()}).subscribe(J.LFO2,e=>{this.state.lfo2=e,this.requestUpdate()}).subscribe(J.CUTOFF_MOD,e=>{this.state.cutoffMod=e,this.requestUpdate()}).subscribe(J.VOICE_CONFIG,e=>{this.state.voiceConfig=e,this.requestUpdate()})}async onKeyOn(e){this.audioContext.state===`suspended`&&await this.audioContext.resume();let{frequency:t,midiValue:n}=e.detail;this.voiceManager.next({frequency:t,midiValue:n})}onKeyOff(e){let{midiValue:t}=e.detail;this.voiceManager.stop({midiValue:t})}onOsc1Change(e){switch(e.detail.type){case M.WAVE_FORM:this.voiceManager.setOsc1Mode(e.detail.value);break;case M.SEMI_SHIFT:this.voiceManager.setOsc1SemiShift(e.detail.value);break;case M.CENT_SHIFT:this.voiceManager.setOsc1CentShift(e.detail.value);break;case M.CYCLE:this.voiceManager.setOsc1Cycle(e.detail.value);break;case M.MIX:break;case M.NOISE:break;default:Z(e.detail.type)}}onOsc2Change(e){switch(e.detail.type){case M.WAVE_FORM:this.voiceManager.setOsc2Mode(e.detail.value);break;case M.SEMI_SHIFT:this.voiceManager.setOsc2SemiShift(e.detail.value);break;case M.CENT_SHIFT:this.voiceManager.setOsc2CentShift(e.detail.value);break;case M.CYCLE:this.voiceManager.setOsc2Cycle(e.detail.value);break;case M.MIX:break;case M.NOISE:break;default:Z(e.detail.type)}}onOscMixChange(e){switch(e.detail.type){case M.MIX:this.voiceManager.setOsc2Amplitude(e.detail.value);break;case M.NOISE:this.voiceManager.setNoiseLevel(e.detail.value);break;case M.WAVE_FORM:break;case M.SEMI_SHIFT:break;case M.CENT_SHIFT:break;case M.CYCLE:break;default:Z(e.detail.type)}}onFilterChange(e){switch(e.detail.type){case F.MODE:this.voiceManager.setFilterMode(e.detail.value);break;case F.CUTOFF:this.voiceManager.setFilterCutoff(e.detail.value);break;case F.RESONANCE:this.voiceManager.setFilterResonance(e.detail.value);break;case F.DRIVE:this.voiceManager.setDrive(e.detail.value);break;default:Z(e.detail.type)}}onAmplitudeEnvelopeChange(e){switch(e.detail.type){case L.ATTACK:this.voiceManager.setAmplitudeEnvelopeAttack(e.detail.value);break;case L.DECAY:this.voiceManager.setAmplitudeEnvelopeDecay(e.detail.value);break;case L.SUSTAIN:this.voiceManager.setAmplitudeEnvelopeSustain(e.detail.value);break;case L.RELEASE:this.voiceManager.setAmplitudeEnvelopeRelease(e.detail.value);break;default:Z(e.detail.type)}}onFilterEnvelopeChange(e){switch(e.detail.type){case z.ATTACK:this.voiceManager.setCutoffEnvelopeAttack(e.detail.value);break;case z.DECAY:this.voiceManager.setCutoffEnvelopeDecay(e.detail.value);break;case z.AMOUNT:this.voiceManager.setCutoffEnvelopeAmount(e.detail.value);break;case z.VELOCITY:this.voiceManager.setCutoffEnvelopeVelocity(e.detail.value);break;default:Z(e.detail.type)}}onLfo1Change(e){switch(e.detail.type){case R.WAVE_FORM:this.voiceManager.setLfo1Mode(e.detail.value);break;case R.FREQUENCY:this.voiceManager.setLfo1Frequency(e.detail.value);break;case R.MOD_AMOUNT:this.voiceManager.setLfo1ModAmount(e.detail.value);break;case R.DESTINATION:this.voiceManager.setLfo1Destination(e.detail.value);break;default:Z(e.detail.type)}}onLfo2Change(e){switch(e.detail.type){case R.WAVE_FORM:this.voiceManager.setLfo2Mode(e.detail.value);break;case R.FREQUENCY:this.voiceManager.setLfo2Frequency(e.detail.value);break;case R.MOD_AMOUNT:this.voiceManager.setLfo2ModAmount(e.detail.value);break;case R.DESTINATION:this.voiceManager.setLfo2Destination(e.detail.value);break;default:Z(e.detail.type)}}onVoiceConfigChange(e){switch(e.detail.type){case Pn.VOICE_MODE:this.voiceManager.setVoiceMode(e.detail.value);break;case Pn.GLIDE_TIME:this.voiceManager.setGlideTime(e.detail.value);break;case Pn.RETRIGGER:this.voiceManager.setRetrigger(e.detail.value);break;default:Z(e.detail.type)}}computeVizualizerIfEnabled(){if(this.showVizualizer)return g`
        <div class="visualizer">
          <visualizer-element
            .analyser=${this.analyzer}
            width="650"
            height="200"
          ></visualizer-element>
        </div>
      `}computeDumpButtonIfEnabled(){if(this.editMode)return g`<button @click=${this.voiceManager.dumpState}>Dump</button>`}render(){return g`
      <div class="content">
        <div class="synth">
          <div class="panels-row upper">
            <oscillator-element
              .semiControlID=${O.OSC1_SEMI}
              .centControlID=${O.OSC1_CENT}
              .cycleControlID=${O.OSC1_CYCLE}
              label="Osc. 1"
              .state=${this.state.osc1}
              @change=${this.onOsc1Change}
            ></oscillator-element>
            <oscillator-mix-element
              .mix=${this.state.osc2Amplitude}
              .noise=${this.state.noiseLevel}
              @change=${this.onOscMixChange}
            ></oscillator-mix-element>
            <oscillator-element
              .semiControlID=${O.OSC2_SEMI}
              .centControlID=${O.OSC2_CENT}
              .cycleControlID=${O.OSC2_CYCLE}
              label="Osc. 2"
              .state=${this.state.osc2}
              @change=${this.onOsc2Change}
            ></oscillator-element>
            <filter-element
              .state=${this.state.filter}
              @change=${this.onFilterChange}
            ></filter-element>
          </div>
          <div class="panels-row lower">
            <envelope-element
              label="Envelope"
              .state=${this.state.envelope}
              @change=${this.onAmplitudeEnvelopeChange}
            ></envelope-element>
            <lfo-element
              .frequencyControlID=${O.LFO1_FREQ}
              .modAmountControlID=${O.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .frequencyControlID=${O.LFO2_FREQ}
              .modAmountControlID=${O.LFO2_MOD}
              label="LFO 2"
              .state=${this.state.lfo2}
              @change=${this.onLfo2Change}
            ></lfo-element>
            <filter-envelope-element
              .state=${this.state.cutoffMod}
              @change=${this.onFilterEnvelopeChange}
            ></filter-envelope-element>
          </div>
          <div class="keyboard">
            <panel-wrapper-element>
              <div class="keys">
                <keys-element
                  .pressedKeys=${this.pressedKeys}
                  @keyOn=${this.onKeyOn}
                  @keyOff=${this.onKeyOff}
                ></keys-element>
              </div>
            </panel-wrapper-element>
          </div>
        </div>
        ${this.computeVizualizerIfEnabled()}
        ${this.computeDumpButtonIfEnabled()}
      </div>
    `}static get styles(){return u`
      .content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .visualizer {
        margin: auto;
      }

      .synth {
        width: 100%;
        background-color: var(--main-panel-color);
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 1.5em;
        box-sizing: border-box;
      }

      /* ── Grid rows ── */

      .panels-row {
        display: grid;
        gap: 0.5rem;
        align-items: stretch;
      }

      .panels-row > * {
        min-width: 0;
      }

      /* Upper: Osc1 Mix Osc2 Filter → 8:3:8:8 */
      .panels-row.upper {
        grid-template-columns: 8fr 3fr 8fr 8fr;
      }

      /* Lower: Env LFO1 LFO2 FilterMod → 6:5:5:5 */
      .panels-row.lower {
        grid-template-columns: 6fr 5fr 5fr 5fr;
        margin-top: 1em;
      }

      /* ── Keyboard ── */

      .keyboard {
        --key-height: 100px;
        --panel-wrapper-background-color: var(--keyboard-panel-color);
        margin-top: 2em;
      }

      .keyboard .keys {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 90%;
        margin: -1em auto 0.5em auto;
      }

      /* ── Responsive breakpoints ── */

      @media (max-width: 600px) {
        .synth { padding: 0.75em; }
        .keyboard { --key-height: 60px; }

        .panels-row.upper,
        .panels-row.lower {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 400px) {
        .panels-row.upper,
        .panels-row.lower {
          grid-template-columns: 1fr;
        }
      }
    `}};E([C({type:Object})],Q.prototype,`pressedKeys`,void 0),E([C({attribute:!1})],Q.prototype,`voiceManager`,void 0),E([C({attribute:!1})],Q.prototype,`audioContext`,void 0),Q=E([S(`wasm-poly-element`)],Q);var $=class extends x{constructor(...e){super(...e),this.playing=!1,this.currentStep=-1,this.bpm=X.bpm,this.swing=X.swing,this.gate=X.gate,this.subdivision=X.subdivision,this.direction=X.direction,this.loop=X.loop,this.steps=X.steps,this.selectedNote=60,this.selectedVelocity=100,this.pattern=Array.from({length:64},()=>({note:0,velocity:0}))}connectedCallback(){super.connectedCallback(),this.sequencer&&(this.sequencer.addEventListener(`position`,(e=>{this.currentStep=e.detail.step})),this.sequencer.addEventListener(`transport`,(e=>{this.playing=e.detail.state===1})))}render(){return g`
      <div class="sequencer-layout">
        <sequencer-toolbar
          .bpm=${this.bpm}
          .subdivision=${this.subdivision}
          .playing=${this.playing}
          .direction=${this.direction}
          .loop=${this.loop}
          @change=${this.onToolbarChange}
        ></sequencer-toolbar>
        <div class="pattern-section">
          <div class="pattern-header">
            <div class="pattern-controls">
              <div class="lcd-control">
                <label class="ctrl-label">STEPS</label>
                <div class="lcd-row">
                  <button class="inc-btn" @click=${()=>this.setSteps(Math.max(1,this.steps-1))}>-</button>
                  <lcd-element .text=${String(this.steps)}></lcd-element>
                  <button class="inc-btn" @click=${()=>this.setSteps(Math.min(64,this.steps+1))}>+</button>
                </div>
              </div>
              <control-learn-wrapper .controlID=${O.SEQ_SWING}>
                <knob-element
                  .value=${this.swing}
                  .range=${{min:0,max:100}}
                  .step=${1}
                  .label=${`SWING`}
                  label-position="left"
                  @change=${e=>this.setSwing(e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
              <control-learn-wrapper .controlID=${O.SEQ_GATE}>
                <knob-element
                  .value=${this.gate}
                  .range=${{min:5,max:100}}
                  .step=${1}
                  .label=${`GATE`}
                  label-position="left"
                  @change=${e=>this.setGate(e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
          </div>
          <step-grid-panel
            .steps=${this.steps}
            .currentStep=${this.currentStep}
            .pattern=${this.pattern}
            .selectedNote=${this.selectedNote}
            .selectedVelocity=${this.selectedVelocity}
            @step-toggle=${this.onStepToggle}
            @note-select=${this.onNoteSelect}
            @velocity-select=${this.onVelocitySelect}
          ></step-grid-panel>
        </div>
      </div>
    `}onToolbarChange(e){let{type:t,value:n}=e.detail;switch(t){case B.PLAY:this.audioContext.resume(),this.sequencer.start(),this.playing=!0;break;case B.STOP:this.sequencer.stop(),this.playing=!1;break;case B.BPM:this.bpm=n,this.sequencer.setBpm(this.bpm);break;case B.SUBDIVISION:this.subdivision=n,this.sequencer.setSubdivision(this.subdivision);break;case B.DIRECTION:this.direction=n,this.sequencer.setDirection(this.direction);break;case B.LOOP:this.loop=n===1,this.sequencer.setLoop(this.loop);break}}setSteps(e){this.steps=e,this.sequencer.setSteps(this.steps)}setSwing(e){this.swing=e,this.sequencer.setSwing(this.swing)}setGate(e){this.gate=e,this.sequencer.setGate(this.gate)}onStepToggle(e){let{index:t,note:n,velocity:r,action:i}=e.detail,a=[...this.pattern];i===`off`?(this.sequencer.clearStep(t),a[t]={note:0,velocity:0}):(this.sequencer.setStep(t,n,r),a[t]={note:n,velocity:r}),this.pattern=a}onNoteSelect(e){this.selectedNote=e.detail.note}onVelocitySelect(e){this.selectedVelocity=e.detail.velocity}static get styles(){return u`
      :host {
        display: block;
        width: 100%;
        --knob-size: var(--control-size-sm);
        --control-label-color: var(--light-secondary);
      }

      .sequencer-layout {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        width: 100%;
        background-color: var(--main-panel-color);
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 1em;
        box-sizing: border-box;
      }

      .pattern-section {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        background: var(--sequencer-panel-color);
        border-radius: 0.4rem;
        padding: 0.8em 1em;
      }

      .pattern-header {
        display: flex;
        align-items: center;
        gap: 0.8em;
      }

      .pattern-controls {
        display: flex;
        align-items: center;
        gap: 0.8em;
      }

      .lcd-control {
        display: flex;
        align-items: center;
        gap: 0.4em;
      }

      .ctrl-label {
        font-size: var(--control-label-font-size);
        color: var(--light-secondary);
      }

      .lcd-row {
        display: flex;
        align-items: center;
        gap: 0.2em;
      }

      .inc-btn {
        width: 20px;
        height: 20px;
        border: 1px solid var(--light-secondary);
        border-radius: 3px;
        background: var(--dark-secondary);
        color: var(--lighter);
        font-size: 0.8em;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .inc-btn:hover {
        background: var(--medium);
      }

    `}};E([C({attribute:!1})],$.prototype,`sequencer`,void 0),E([C({attribute:!1})],$.prototype,`audioContext`,void 0),E([w()],$.prototype,`playing`,void 0),E([w()],$.prototype,`currentStep`,void 0),E([w()],$.prototype,`bpm`,void 0),E([w()],$.prototype,`swing`,void 0),E([w()],$.prototype,`gate`,void 0),E([w()],$.prototype,`subdivision`,void 0),E([w()],$.prototype,`direction`,void 0),E([w()],$.prototype,`loop`,void 0),E([w()],$.prototype,`steps`,void 0),E([w()],$.prototype,`selectedNote`,void 0),E([w()],$.prototype,`selectedVelocity`,void 0),E([w()],$.prototype,`pattern`,void 0),$=E([S(`sequencer-element`)],$);var Fn=class extends x{constructor(...e){super(...e),this.audioContext=new AudioContext,this.plugins=new Map,this.ready=!1}async connectedCallback(){super.connectedCallback(),this.midi=await an(),this.midiBus=this.midi.bus(`main`);for(let e of this.midi.devices.inputs.values())e.connect(this.midiBus);this.midi.onPortChange((e,t)=>{t===`connected`&&`connect`in e&&e.connect(this.midiBus)}),new ln().connect(this.midiBus),await this.audioContext.audioWorklet.addModule(`synth-processor.js`),await this.audioContext.audioWorklet.addModule(`seq-processor.js`);let e=new wn(this.audioContext);e.init(),this.plugins.set(`wasm-poly`,e);let t=new jn(this.audioContext);t.init(),this.plugins.set(`sequencer`,t),this.slotTree=Nn(`root`,`DAW`,[Mn(`slot-synth`,`POLYTIK`,`wasm-poly`,{midiChannel:0}),Mn(`slot-seq`,`SEQUELS`,`sequencer`,{outputChannel:0})]),this.ready=!0}render(){return this.ready?g`
      <device-slot
        .config=${this.slotTree}
        .plugins=${this.plugins}
        .bus=${this.midiBus}
        .midi=${this.midi}
        .audioContext=${this.audioContext}
      ></device-slot>
    `:g``}static get styles(){return u`
      :host {
        display: block;
        width: 100%;
      }
    `}};E([w()],Fn.prototype,`ready`,void 0),Fn=E([S(`root-element`)],Fn),r();