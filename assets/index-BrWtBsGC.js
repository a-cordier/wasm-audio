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
    --lcd-screen-border-color: var(--lighter);
    --lcd-screen-background: var(--dark-secondary);

    --main-panel-color: #181818;
    --main-panel-label-font-family: "Bungee Outline", cursive;
    --main-panel-label-color: var(--lighter);

    --oscillator-panel-color: #145a6a;
    --oscillator-mix-panel-color: var(--oscillator-panel-color);
    --envelope-panel-color: var(--oscillator-panel-color);
    --filter-panel-color: #ac8f1d;
    --filter-mod-panel-color: var(--filter-panel-color);
    --lfo-panel-color: #9a1a40;

    --panel-wrapper-label-color: var(--darker);

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
    --lcd-screen-border-color: var(--lighter);
    --lcd-screen-background: var(--dark-secondary);

    --main-panel-color: #2a1a0e;
    --main-panel-label-font-family: "Bungee Outline", cursive;
    --main-panel-label-color: var(--lighter);

    --oscillator-panel-color: #8b4513;
    --oscillator-mix-panel-color: var(--oscillator-panel-color);
    --envelope-panel-color: var(--oscillator-panel-color);
    --filter-panel-color: #b8860b;
    --filter-mod-panel-color: var(--filter-panel-color);
    --lfo-panel-color: #800020;

    --panel-wrapper-label-color: var(--darker);

    --ui-transition-time: 0.4s;

    --body-background: #0d0500;
  }
`},t=null;function n(n){let r=e[n];r&&(t||(t=new CSSStyleSheet,document.adoptedStyleSheets=[...document.adoptedStyleSheets,t]),t.replaceSync(r),document.body.style.backgroundColor=getComputedStyle(document.documentElement).getPropertyValue(`--body-background`).trim())}function r(){n(`dark`)}var i=globalThis,a=i.ShadowRoot&&(i.ShadyCSS===void 0||i.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap,c=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(a&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=s.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&s.set(t,e))}return e}toString(){return this.cssText}},l=e=>new c(typeof e==`string`?e:e+``,void 0,o),u=(e,...t)=>new c(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,o),ee=(e,t)=>{if(a)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=i.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},te=a?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return l(t)})(e):e,{is:ne,defineProperty:re,getOwnPropertyDescriptor:ie,getOwnPropertyNames:ae,getOwnPropertySymbols:oe,getPrototypeOf:se}=Object,ce=globalThis,le=ce.trustedTypes,ue=le?le.emptyScript:``,de=ce.reactiveElementPolyfillSupport,d=(e,t)=>e,fe={toAttribute(e,t){switch(t){case Boolean:e=e?ue:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},pe=(e,t)=>!ne(e,t),me={attribute:!0,type:String,converter:fe,reflect:!1,useDefault:!1,hasChanged:pe};Symbol.metadata??=Symbol(`metadata`),ce.litPropertyMetadata??=new WeakMap;var f=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=me){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&re(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=ie(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??me}static _$Ei(){if(this.hasOwnProperty(d(`elementProperties`)))return;let e=se(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(d(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d(`properties`))){let e=this.properties,t=[...ae(e),...oe(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(te(e))}else e!==void 0&&t.push(te(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ee(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?fe:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?fe:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??pe)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};f.elementStyles=[],f.shadowRootOptions={mode:`open`},f[d(`elementProperties`)]=new Map,f[d(`finalized`)]=new Map,de?.({ReactiveElement:f}),(ce.reactiveElementVersions??=[]).push(`2.1.2`);var he=globalThis,ge=e=>e,_e=he.trustedTypes,ve=_e?_e.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ye=`$lit$`,p=`lit$${Math.random().toFixed(9).slice(2)}$`,be=`?`+p,xe=`<${be}>`,m=document,h=()=>m.createComment(``),g=e=>e===null||typeof e!=`object`&&typeof e!=`function`,Se=Array.isArray,Ce=e=>Se(e)||typeof e?.[Symbol.iterator]==`function`,we=`[ 	
\f\r]`,_=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Te=/-->/g,Ee=/>/g,v=RegExp(`>|${we}(?:([^\\s"'>=/]+)(${we}*=${we}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),De=/'/g,Oe=/"/g,ke=/^(?:script|style|textarea|title)$/i,y=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),b=Symbol.for(`lit-noChange`),x=Symbol.for(`lit-nothing`),Ae=new WeakMap,S=m.createTreeWalker(m,129);function je(e,t){if(!Se(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return ve===void 0?t:ve.createHTML(t)}var Me=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=_;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===_?c[1]===`!--`?o=Te:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=v):(ke.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=v):o=Ee:o===v?c[0]===`>`?(o=i??_,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?v:c[3]===`"`?Oe:De):o===Oe||o===De?o=v:o===Te||o===Ee?o=_:(o=v,i=void 0);let ee=o===v&&e[t+1].startsWith(`/>`)?` `:``;a+=o===_?n+xe:l>=0?(r.push(s),n.slice(0,l)+ye+n.slice(l)+p+ee):n+p+(l===-2?t:ee)}return[je(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},Ne=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Me(t,n);if(this.el=e.createElement(l,r),S.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=S.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ye)){let t=u[o++],n=i.getAttribute(e).split(p),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Le:r[1]===`?`?Re:r[1]===`@`?ze:Ie}),i.removeAttribute(e)}else e.startsWith(p)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(ke.test(i.tagName)){let e=i.textContent.split(p),t=e.length-1;if(t>0){i.textContent=_e?_e.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],h()),S.nextNode(),c.push({type:2,index:++a});i.append(e[t],h())}}}else if(i.nodeType===8)if(i.data===be)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(p,e+1))!==-1;)c.push({type:7,index:a}),e+=p.length-1}a++}}static createElement(e,t){let n=m.createElement(`template`);return n.innerHTML=e,n}};function C(e,t,n=e,r){if(t===b)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=g(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=C(e,i._$AS(e,t.values),i,r)),t}var Pe=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??m).importNode(t,!0);S.currentNode=r;let i=S.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new Fe(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Be(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=S.nextNode(),a++)}return S.currentNode=m,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},Fe=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=x,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=C(this,e,t),g(e)?e===x||e==null||e===``?(this._$AH!==x&&this._$AR(),this._$AH=x):e!==this._$AH&&e!==b&&this._(e):e._$litType$===void 0?e.nodeType===void 0?Ce(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==x&&g(this._$AH)?this._$AA.nextSibling.data=e:this.T(m.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=Ne.createElement(je(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Pe(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Ae.get(e.strings);return t===void 0&&Ae.set(e.strings,t=new Ne(e)),t}k(t){Se(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(h()),this.O(h()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ge(e).nextSibling;ge(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Ie=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=x,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=x}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=C(this,e,t,0),a=!g(e)||e!==this._$AH&&e!==b,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=C(this,r[n+o],t,o),s===b&&(s=this._$AH[o]),a||=!g(s)||s!==this._$AH[o],s===x?e=x:e!==x&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===x?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Le=class extends Ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===x?void 0:e}},Re=class extends Ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==x)}},ze=class extends Ie{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=C(this,e,t,0)??x)===b)return;let n=this._$AH,r=e===x&&n!==x||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==x&&(n===x||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Be=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){C(this,e)}},Ve=he.litHtmlPolyfillSupport;Ve?.(Ne,Fe),(he.litHtmlVersions??=[]).push(`3.3.3`);var He=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new Fe(t.insertBefore(h(),e),e,void 0,n??{})}return i._$AI(e),i},Ue=globalThis,w=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=He(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return b}};w._$litElement$=!0,w.finalized=!0,Ue.litElementHydrateSupport?.({LitElement:w});var We=Ue.litElementPolyfillSupport;We?.({LitElement:w}),(Ue.litElementVersions??=[]).push(`4.2.2`);var T=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ge={attribute:!0,type:String,converter:fe,reflect:!1,hasChanged:pe},Ke=(e=Ge,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function E(e){return(t,n)=>typeof n==`object`?Ke(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function qe(e,t){return t>=e.max?e.max:t<=e.min?e.min:t}function D(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}function Je(e,t,n){return Math.round(n.min+(e-t.min)*(n.max-n.min)/(t.max-t.min))}var Ye={min:-135,max:135},Xe={min:0,max:127},O=class extends w{constructor(...e){super(...e),this.range=Xe,this.value=64,this.step=1,this.angle=0}async connectedCallback(){super.connectedCallback(),this.updateAngle()}toggleActive(){let e=e=>{e.preventDefault(),this.updateValue(this.computeStep(-e.movementY,e.altKey))},t=()=>{document.removeEventListener(`mouseup`,t),document.removeEventListener(`mousemove`,e)};document.addEventListener(`mousemove`,e),document.addEventListener(`mouseup`,t)}onWheel(e){e.preventDefault(),this.updateValue(this.computeStep(e.deltaY,e.altKey))}updateAngle(){this.angle=Je(this.value,this.range,Ye)}updateValue(e){this.value=qe(this.range,this.value+e)}computeStep(e,t=!1){return this.computeStepMultiplier(e,t)*this.step}computeStepMultiplier(e,t=!1){let n=e<0?-1:1;return t?n*.25:n}updated(e){e.has(`value`)&&(this.updateAngle(),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}})))}render(){return y`
      <div class="knob-wrapper" class="knob-wrapper">
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
        <div class="label">${this.label}</div>
      </div>
    `}static get styles(){return u`
      :host {
        user-select: none;
        outline: none;
      }

      .knob-wrapper {
        position: relative;
        max-width: var(--knob-size, 100px);
      }

      .knob {
        height: var(--knob-size, 100px);
        width: var(--knob-size, 100px);
        cursor: pointer;
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
    `}};D([E({type:Object})],O.prototype,`range`,void 0),D([E({type:Number})],O.prototype,`value`,void 0),D([E({type:Number})],O.prototype,`step`,void 0),D([E({type:Number})],O.prototype,`angle`,void 0),D([E({type:String})],O.prototype,`label`,void 0),O=D([T(`knob-element`)],O);var Ze={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Qe=e=>(...t)=>({_$litDirective$:e,values:t}),$e=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},et=`important`,tt=` !important`,nt=Qe(class extends $e{constructor(e){if(super(e),e.type!==Ze.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(tt);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?et:``):n[e]=r}}return b}}),rt=class extends w{constructor(...e){super(...e),this.label=``,this.value=127}toggleActive(e){let t=this.shadowRoot.host.offsetParent,n=this.cursorWrapperElement,r=n.offsetHeight,i=e.pageY-(t.offsetTop+n.offsetTop);this.updateValue((1-i/r)*127);let a=e=>{e.preventDefault(),this.updateValue(this.value-e.movementY)},o=()=>{document.removeEventListener(`mouseup`,o),document.removeEventListener(`mousemove`,a)};document.addEventListener(`mousemove`,a),document.addEventListener(`mouseup`,o)}onWheel(e){e.preventDefault(),this.updateValue(this.value+e.deltaY)}updateValue(e){this.value=qe({min:0,max:127},e),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}computeFaderCursorStyle(){return nt({height:`${this.value/127*100}%`})}get cursorElement(){return y` <div
      class="fader-cursor"
      style="${this.computeFaderCursorStyle()}"
    ></div>`}get cursorWrapperElement(){return this.shadowRoot.querySelector(`.cursor-wrapper`)}render(){return y`
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
    `}};D([E({type:String})],rt.prototype,`label`,void 0),D([E({type:Number})],rt.prototype,`value`,void 0),rt=D([T(`fader-element`)],rt);var k=Qe(class extends $e{constructor(e){if(super(e),e.type!==Ze.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return b}}),it=[`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`],at=69,ot=440,st=Array(128);for(let e=0;e<128;e++){let t=e%12,n=Math.floor(e/12)-1,r=n>=0?`${it[t]}${n}`:``,i=ot*2**((e-at)/12);st[e]=Object.freeze({name:r,frequency:i})}Object.freeze(st);function ct(e){return st[e&127].frequency}function lt(e){return e%12}function ut(e){return Math.floor(e/12)-1}function dt(e,t=ot){return it.map((n,r)=>{let i=(e+1)*12+r;return{pitchClass:n,octave:e,frequency:t*2**((i-at)/12),midiValue:i,velocity:127}}).filter(e=>e.midiValue>=0&&e.midiValue<=127)}function ft(e=ot){let t=[];for(let n=0;n<10;n++)t.push(dt(n,e));return t}var pt=ft(440).map(mt);function mt(e){return e.map(e=>{let t=e.pitchClass.endsWith(`#`),n=t?e.pitchClass.replace(`#`,`--sharp`):e.pitchClass;return{...e,classes:{[n]:!0,"key--sharp":t,"key--whole":!t,key:!0}}})}var A=class extends w{constructor(...e){super(...e),this.lowerKey=36,this.higherKey=61,this.mouseControlledKey=null}get octaves(){return pt.slice(ut(this.lowerKey),ut(this.higherKey)+1)}async connectedCallback(){super.connectedCallback(),this.registerMouseUpHandler()}registerMouseUpHandler(){document.addEventListener(`mouseup`,this.mouseUp.bind(this))}mouseUp(){this.mouseControlledKey&&=(this.keyOff(this.mouseControlledKey),null)}mouseDown(e){return async t=>{t.button===0&&(this.mouseControlledKey=e,await this.keyOn(e))}}mouseEnter(e){return async()=>{this.mouseControlledKey&&(await this.keyOff(this.mouseControlledKey),this.mouseControlledKey=e,await this.keyOn(e))}}findKey(e){return pt[ut(e)][lt(e)]}async keyOn(e){this.pressedKeys.add(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOn`,{detail:e})),await this.requestUpdate()}async keyOff(e){this.pressedKeys.delete(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOff`,{detail:e})),await this.requestUpdate()}createOctaveElement(e){return y`
      <div class="octave">
        ${e.map(this.createKeyElement.bind(this))}
      </div>
    `}createKeyElement(e){return y`
      <div
        @mousedown=${this.mouseDown(e)}
        @mouseenter=${this.mouseEnter(e)}
        id="${e.midiValue}"
        class="${this.computeKeyClasses(e)}"
      ></div>
    `}computeKeyClasses(e){return k({...e.classes,"key--pressed":this.pressedKeys&&this.pressedKeys.has(e.midiValue)})}render(){return y`
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
    `}};D([E({type:Number})],A.prototype,`lowerKey`,void 0),D([E({type:Number})],A.prototype,`higherKey`,void 0),D([E({type:Object})],A.prototype,`pressedKeys`,void 0),A=D([T(`keys-element`)],A);var ht=class{constructor(e){this.currentOption=0,this.options=e,this.map=e.map.bind(e)}get size(){return this.options.length}set index(e){this.currentOption=e-1,this.next()}get index(){return this.currentOption}selectValue(e){let t=this.options.findIndex(t=>t.value===e);t>-1&&(this.currentOption=t)}select(e){return this.currentOption=e,this}next(){return++this.currentOption>=this.options.length&&(this.currentOption=0),this}previous(){return--this.currentOption<0&&(this.currentOption=this.options.length-1),this}getCurrent(){return this.options[this.currentOption]}},j=function(e){return e[e.NONE=-1]=`NONE`,e[e.OSC1_SEMI=0]=`OSC1_SEMI`,e[e.OSC1_CENT=1]=`OSC1_CENT`,e[e.OSC1_CYCLE=2]=`OSC1_CYCLE`,e[e.OSC_MIX=3]=`OSC_MIX`,e[e.NOISE=4]=`NOISE`,e[e.OSC2_SEMI=5]=`OSC2_SEMI`,e[e.OSC2_CENT=6]=`OSC2_CENT`,e[e.OSC2_CYCLE=7]=`OSC2_CYCLE`,e[e.CUTOFF=8]=`CUTOFF`,e[e.RESONANCE=9]=`RESONANCE`,e[e.DRIVE=10]=`DRIVE`,e[e.ATTACK=11]=`ATTACK`,e[e.DECAY=12]=`DECAY`,e[e.SUSTAIN=13]=`SUSTAIN`,e[e.RELEASE=14]=`RELEASE`,e[e.LFO1_FREQ=15]=`LFO1_FREQ`,e[e.LFO1_MOD=16]=`LFO1_MOD`,e[e.LFO2_FREQ=17]=`LFO2_FREQ`,e[e.LFO2_MOD=18]=`LFO2_MOD`,e[e.CUT_MOD=19]=`CUT_MOD`,e[e.CUT_VEL=20]=`CUT_VEL`,e[e.CUT_ATTACK=21]=`CUT_ATTACK`,e[e.CUT_DECAY=22]=`CUT_DECAY`,e}({});function M(e){return{name:j[e].replace(/_/g,` `),value:e}}var gt=new ht([M(0),M(1),M(2),M(3),M(4),M(5),M(6),M(7),M(11),M(12),M(13),M(14),M(8),M(9),M(10),M(19),M(20),M(21),M(22),M(15),M(16),M(17),M(18)]),_t=class extends EventTarget{constructor(...e){super(...e),this.bindings=new Map,this.adapters=[],this.subscriptions=[],this._learningTarget=j.NONE}get learningTarget(){return this._learningTarget}registerSource(e){this.adapters.push(e);let t=e.onSignal(e=>this.handleSignal(e));this.subscriptions.push(t),e.connect()}startLearning(e){this._learningTarget=e,this.dispatchEvent(new Event(`learn-state-change`))}stopLearning(){this._learningTarget=j.NONE,this.dispatchEvent(new Event(`learn-state-change`))}handleSignal(e){this._learningTarget!==j.NONE&&(this.bindings.set(e.sourceId,this._learningTarget),this._learningTarget=j.NONE,this.dispatchEvent(new Event(`learn-state-change`)));let t=this.bindings.get(e.sourceId);t!==void 0&&this.dispatchEvent(new CustomEvent(`control-change`,{detail:{controlId:t,value:e.value}}))}exportBindings(){return Array.from(this.bindings.entries()).map(([e,t])=>({controlId:t,sourceId:e}))}importBindings(e){this.bindings.clear();for(let{controlId:t,sourceId:n}of e)this.bindings.set(n,t)}clearBindings(){this.bindings.clear()}destroy(){for(let e of this.subscriptions)e.dispose();for(let e of this.adapters)e.disconnect();this.adapters.length=0,this.subscriptions.length=0,this.bindings.clear()}},vt=null;function N(){return vt||=new _t,vt}var yt=class{constructor(e){this.onChange=()=>{this.host.requestUpdate()},this.host=e,e.addController(this)}get learningTarget(){return N().learningTarget}hostConnected(){N().addEventListener(`learn-state-change`,this.onChange)}hostDisconnected(){N().removeEventListener(`learn-state-change`,this.onChange)}},bt=class extends w{constructor(...e){super(...e),this.learn=new yt(this)}get hasFocus(){return this.learn.learningTarget===this.controlID}render(){return y`
      <div class="${k({wrapper:!0,focus:this.hasFocus})}">
        <slot></slot>
      </div>
    `}static get styles(){return u`
      .wrapper.focus {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: var(--control-hander-color-focused);
        }
      }
    `}};D([E({type:Number})],bt.prototype,`controlID`,void 0),bt=D([T(`control-learn-wrapper`)],bt);var P=!0,F=!1,xt={A:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,P,P,P,P],[P,F,F,F,P],[P,F,F,F,P]],B:[[P,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,P,P,P,F]],C:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,P],[F,P,P,P,F]],D:[[P,P,P,F,F],[P,F,F,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,P,F],[P,P,P,F,F]],E:[[P,P,P,P,P],[P,F,F,F,F],[P,F,F,F,F],[P,P,P,P,F],[P,F,F,F,F],[P,F,F,F,F],[P,P,P,P,P]],F:[[P,P,P,P,P],[P,F,F,F,F],[P,F,F,F,F],[P,P,P,P,F],[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,F]],G:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,F],[P,F,P,P,P],[P,F,F,F,P],[P,F,F,F,P],[F,P,P,P,P]],H:[[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,P,P,P,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P]],I:[[F,P,P,P,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,P,P,P,F]],J:[[F,F,P,P,P],[F,F,F,P,F],[F,F,F,P,F],[F,F,F,P,F],[F,F,F,P,F],[P,F,F,P,F],[F,P,P,F,F]],K:[[P,F,F,F,P],[P,F,F,P,F],[P,F,P,F,F],[P,P,F,F,F],[P,F,P,F,F],[P,F,F,P,F],[P,F,F,F,P]],L:[[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,F],[P,P,P,P,P]],M:[[P,F,F,F,P],[P,P,F,P,P],[P,F,P,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P]],N:[[P,F,F,F,P],[P,F,F,F,P],[P,P,F,F,P],[P,F,P,F,P],[P,F,F,P,P],[P,F,F,F,P],[P,F,F,F,P]],O:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[F,P,P,P,F]],P:[[P,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,P,P,P,F],[P,F,F,F,F],[P,F,F,F,F],[P,F,F,F,F]],Q:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,P,F,P],[P,F,F,P,F],[F,P,P,F,P]],R:[[P,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,P,P,P,F],[P,F,P,F,F],[P,F,F,P,F],[P,F,F,F,P]],S:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,F],[F,P,P,P,F],[F,F,F,F,P],[P,F,F,F,P],[F,P,P,P,F]],T:[[P,P,P,P,P],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F]],U:[[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[F,P,P,P,F]],V:[[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[F,P,F,P,F],[F,F,P,F,F]],W:[[P,F,F,F,P],[P,F,F,F,P],[P,F,F,F,P],[P,F,P,F,P],[P,F,P,F,P],[P,F,P,F,P],[F,P,F,P,F]],X:[[P,F,F,F,P],[P,F,F,F,P],[F,P,F,P,F],[F,F,P,F,F],[F,P,F,P,F],[P,F,F,F,P],[P,F,F,F,P]],Y:[[P,F,F,F,P],[P,F,F,F,P],[F,P,F,P,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,P,F,F]],Z:[[P,P,P,P,P],[F,F,F,F,P],[F,F,F,P,F],[F,F,P,F,F],[F,P,F,F,F],[P,F,F,F,F],[P,P,P,P,P]],0:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,P,P],[P,F,P,F,P],[P,P,F,F,P],[P,F,F,F,P],[F,P,P,P,F]],1:[[F,F,P,P,F],[F,P,F,P,F],[P,F,F,P,F],[F,F,F,P,F],[F,F,F,P,F],[F,F,F,P,F],[F,F,F,P,F]],2:[[F,P,P,P,F],[P,F,F,F,P],[F,F,F,F,P],[F,F,P,P,F],[F,P,F,F,F],[P,F,F,F,F],[P,P,P,P,P]],3:[[F,P,P,P,F],[P,F,F,F,P],[F,F,F,F,P],[F,F,P,P,F],[F,F,F,F,P],[P,F,F,F,P],[F,P,P,P,F]],4:[[F,F,P,P,F],[F,P,F,P,F],[P,F,F,P,F],[P,F,F,P,F],[P,P,P,P,P],[F,F,F,P,F],[F,F,F,P,F]],5:[[P,P,P,P,P],[P,F,F,F,F],[P,F,F,F,F],[F,P,P,P,F],[F,F,F,F,P],[F,F,F,F,P],[P,P,P,P,F]],6:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,F],[P,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[F,P,P,P,F]],7:[[P,P,P,P,P],[F,F,F,F,P],[F,F,F,P,F],[F,F,P,F,F],[F,P,F,F,F],[F,P,F,F,F],[F,P,F,F,F]],8:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[F,P,P,P,F]],9:[[F,P,P,P,F],[P,F,F,F,P],[P,F,F,F,P],[P,P,P,P,P],[F,F,F,F,P],[F,F,F,F,P],[P,P,P,P,F]]," ":[[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F]],_:[[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[P,P,P,P,P]],":":[[F,F,F,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,F,F,F],[F,F,P,F,F],[F,F,P,F,F],[F,F,F,F,F]],".":[[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,F,F,F],[F,F,P,F,F],[F,F,P,F,F]]},St=class extends w{render(){return y`
      <div class="lcd-char">
        ${this.char.map(e=>this.createLedRow(e))}
      </div>
    `}createLedRow(e){return y`
      <div class="led-row">
        ${e.map(e=>this.createLed(e))}
      </div>
    `}createLed(e){return e?y`<div class="led on"></div>`:y`<div class="led"></div>`}static get styles(){return u`
      .lcd-char {
        height: 95%;
        width: 95%;
        display: grid;
        grid-template-rows: repeat(7, 1fr);
      }

      .led-row {
        width: 95%;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
      }

      .led {
        width: 60%;
        height: 60%;
        background-color: transparent;
      }

      .led.on {
        background-color: var(--lcd-led-on-color, #b4d455);
      }
    `}};D([E({type:Array})],St.prototype,`char`,void 0),St=D([T(`lcd-char-element`)],St);var Ct=class extends w{render(){return y`
      <div class="lcd">
        ${Array.from(this.text).map(this.createLcdChar)}
      </div>
    `}createLcdChar(e){return y`
      <lcd-char-element .char=${xt[e]} class="char"></lcd-char-element>
    `}static get styles(){return u`
      .lcd {
        width: var(--lcd-screen-width, 120px);
        height: var(--lcd-screen-height, 14px);

        display: grid;
        grid-template-columns: repeat(12, 1fr);
        grid-auto-flow: columns;

        border: 1px solid gray;

        background-color: var(--lcd-screen-background, darkslategray);
        border-color: var(--lcd-screen-border-color);

        padding: 5px;
      }

      .char {
        width: 85%;
        grid-row: 1;
      }
    `}};D([E({type:String})],Ct.prototype,`text`,void 0),Ct=D([T(`lcd-element`)],Ct);var wt=class extends w{render(){return y`
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
    `}};wt=D([T(`sine-wave-icon`)],wt);var Tt=class extends w{render(){return y`
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
    `}};Tt=D([T(`square-wave-icon`)],Tt);var Et=class extends w{render(){return y`
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
    `}};Et=D([T(`saw-wave-icon`)],Et);var Dt=class extends w{render(){return y`
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
    `}};Dt=D([T(`triangle-wave-icon`)],Dt);var Ot=class extends w{constructor(...e){super(...e),this.label=``}render(){return y`
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
      }

      .wrapper {
        position: relative;

        width: 100%;
        box-sizing: border-box;

        background-color: var(--panel-wrapper-background-color, transparent);

        border-radius: 0.5rem;

        padding: 0.25em;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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
        width: 100%;
      }

      .footer:empty {
        display: none;
      }
    `}};D([E({type:String})],Ot.prototype,`label`,void 0),Ot=D([T(`panel-wrapper-element`)],Ot);var I=function(e){return e[e.SINE=0]=`SINE`,e[e.SAWTOOTH=1]=`SAWTOOTH`,e[e.SQUARE=2]=`SQUARE`,e[e.TRIANGLE=3]=`TRIANGLE`,e}({}),kt=class extends w{constructor(...e){super(...e),this.value=I.SINE}async onSawSelect(){this.value=I.SAWTOOTH,this.dispatchSelect()}async onSquareSelect(){this.value=I.SQUARE,this.dispatchSelect()}async onSineSelect(){this.value=I.SINE,this.dispatchSelect()}async onTriangleSelect(){this.value=I.TRIANGLE,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return y`
      <div class="wave-selector">
        <button
          class="${this.computeButtonClasses(I.SAWTOOTH)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(I.SQUARE)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(I.TRIANGLE)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(I.SINE)}"
          @click=${this.onSineSelect}
        >
          <sine-wave-icon class="icon"></sine-wave-icon>
        </button>
      </div>
    `}computeButtonClasses(e){return k({active:e===this.value})}static get styles(){return u`
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
    `}};D([E({type:Number})],kt.prototype,`value`,void 0),kt=D([T(`wave-selector-element`)],kt);var L=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.SEMI_SHIFT=1]=`SEMI_SHIFT`,e[e.CENT_SHIFT=2]=`CENT_SHIFT`,e[e.CYCLE=3]=`CYCLE`,e[e.MIX=4]=`MIX`,e[e.NOISE=5]=`NOISE`,e}({}),R=class extends w{constructor(...e){super(...e),this.label=``}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t},bubbles:!0,composed:!0}))}};D([E({type:String})],R.prototype,`label`,void 0);var z=class extends R{constructor(...e){super(...e),this.semiControlID=j.OSC1_SEMI,this.centControlID=j.OSC1_CENT,this.cycleControlID=j.OSC1_CYCLE,this.cycleRange={min:5,max:122}}render(){return y`
      <panel-wrapper-element label=${this.label}>
        <div class="oscillator-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value}
              @change=${e=>this.dispatchChange(L.WAVE_FORM,e.detail.value)}
            ></wave-selector-element>
          </div>
          <div class="tone-controls">
            <div class="shift-control">
              <div class="knob-control semi-shift-control">
                <control-learn-wrapper controlID=${this.semiControlID}>
                  <knob-element
                    .value=${this.state.semiShift.value}
                    @change=${e=>this.dispatchChange(L.SEMI_SHIFT,e.detail.value)}
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
                    @change=${e=>this.dispatchChange(L.CENT_SHIFT,e.detail.value)}
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
                    @change=${e=>this.dispatchChange(L.CYCLE,e.detail.value)}
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
    `}};D([E({type:Object})],z.prototype,`state`,void 0),D([E({type:Number})],z.prototype,`semiControlID`,void 0),D([E({type:Number})],z.prototype,`centControlID`,void 0),D([E({type:Number})],z.prototype,`cycleControlID`,void 0),z=D([T(`oscillator-element`)],z);var At=class extends R{render(){return y`
      <panel-wrapper-element class="oscillator-mix">
        <div class="oscillator-mix-control">
          <control-learn-wrapper .controlID=${j.OSC_MIX}>
            <knob-element class="mix" label="mix"
              .value=${this.mix.value}
              @change=${e=>this.dispatchChange(L.MIX,e.detail.value)}
            ></knob-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${j.NOISE}>
            <knob-element class="noise" label="noise"
              .value=${this.noise.value}
              @change=${e=>this.dispatchChange(L.NOISE,e.detail.value)}
            ></knob-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
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

      .oscillator-mix .mix { --knob-size: 40px; }
      .oscillator-mix .noise { --knob-size: 30px; }
    `}};D([E({type:Object})],At.prototype,`mix`,void 0),D([E({type:Object})],At.prototype,`noise`,void 0),At=D([T(`oscillator-mix-element`)],At);var B=function(e){return e[e.MODE=0]=`MODE`,e[e.CUTOFF=1]=`CUTOFF`,e[e.RESONANCE=2]=`RESONANCE`,e[e.DRIVE=3]=`DRIVE`,e}({}),jt=class extends R{render(){return y`
      <panel-wrapper-element label="Filter">
        <div class="filter-controls">
          <div class="mode-control">
            <filter-selector-element
              .value=${this.state.mode.value}
              @change=${e=>this.dispatchChange(B.MODE,e.detail.value)}
            ></filter-selector-element>
          </div>
          <div class="frequency-controls">
            <div class="frequency-control">
              <div class="knob-control cutoff-control">
                <control-learn-wrapper controlID=${j.CUTOFF}>
                  <knob-element
                    .value=${this.state.cutoff.value}
                    @change=${e=>this.dispatchChange(B.CUTOFF,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>cutoff</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control resonance-control">
                <control-learn-wrapper controlID=${j.RESONANCE}>
                  <knob-element
                    .value=${this.state.resonance.value}
                    @change=${e=>this.dispatchChange(B.RESONANCE,e.detail.value)}
                  ></knob-element>
                </control-learn-wrapper>
              </div>
              <label>res</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control drive-control">
                <control-learn-wrapper controlID=${j.DRIVE}>
                  <knob-element
                    .value=${this.state.drive.value}
                    @change=${e=>this.dispatchChange(B.DRIVE,e.detail.value)}
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
    `}};D([E({type:Object})],jt.prototype,`state`,void 0),jt=D([T(`filter-element`)],jt);var V=function(e){return e[e.LOWPASS=0]=`LOWPASS`,e[e.LOWPASS_PLUS=1]=`LOWPASS_PLUS`,e[e.BANDPASS=2]=`BANDPASS`,e[e.HIGHPASS=3]=`HIGHPASS`,e}({}),Mt=class extends w{constructor(...e){super(...e),this.value=V.LOWPASS}async onLpSelect(){this.value=V.LOWPASS,this.dispatchSelect()}async onLpPlusSelect(){this.value=V.LOWPASS_PLUS,this.dispatchSelect()}async onBpSelect(){this.value=V.BANDPASS,this.dispatchSelect()}async onHpSelect(){this.value=V.HIGHPASS,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return y`
      <div class="filter-selector">
        <button
          class="${this.computeButtonClasses(V.LOWPASS_PLUS)}"
          @click=${this.onLpPlusSelect}
        >
          L+
        </button>
        <button
          class="${this.computeButtonClasses(V.LOWPASS)}"
          @click=${this.onLpSelect}
        >
          LP
        </button>
        <button
          class="${this.computeButtonClasses(V.BANDPASS)}"
          @click=${this.onBpSelect}
        >
          BP
        </button>
        <button
          class="${this.computeButtonClasses(V.HIGHPASS)}"
          @click=${this.onHpSelect}
        >
          HP
        </button>
      </div>
    `}computeButtonClasses(e){return k({active:e===this.value})}static get styles(){return u`
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
    `}};D([E({type:Number})],Mt.prototype,`value`,void 0),Mt=D([T(`filter-selector-element`)],Mt);var H=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.SUSTAIN=2]=`SUSTAIN`,e[e.RELEASE=3]=`RELEASE`,e}({}),Nt=class extends R{render(){return y`
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <control-learn-wrapper .controlID=${j.ATTACK}>
            <fader-element label="A" .value=${this.state.attack.value}
              @change=${e=>this.dispatchChange(H.ATTACK,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${j.DECAY}>
            <fader-element label="D" .value=${this.state.decay.value}
              @change=${e=>this.dispatchChange(H.DECAY,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${j.SUSTAIN}>
            <fader-element label="S" .value=${this.state.sustain.value}
              @change=${e=>this.dispatchChange(H.SUSTAIN,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
          <control-learn-wrapper .controlID=${j.RELEASE}>
            <fader-element label="R" .value=${this.state.release.value}
              @change=${e=>this.dispatchChange(H.RELEASE,e.detail.value)}
            ></fader-element>
          </control-learn-wrapper>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return u`
      :host {
        --panel-wrapper-background-color: var(--envelope-panel-color);
        --fader-height: 120px;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        min-height: 160px;
      }
    `}};D([E({type:Object})],Nt.prototype,`state`,void 0),Nt=D([T(`envelope-element`)],Nt);var U=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.FREQUENCY=1]=`FREQUENCY`,e[e.MOD_AMOUNT=2]=`MOD_AMOUNT`,e[e.DESTINATION=3]=`DESTINATION`,e}({}),W=function(e){return e[e.FREQUENCY=0]=`FREQUENCY`,e[e.OSCILLATOR_MIX=1]=`OSCILLATOR_MIX`,e[e.CUTOFF=2]=`CUTOFF`,e[e.RESONANCE=3]=`RESONANCE`,e[e.OSC1_CYCLE=4]=`OSC1_CYCLE`,e[e.OSC2_CYCLE=5]=`OSC2_CYCLE`,e}({}),G=class extends R{constructor(...e){super(...e),this.frequencyControlID=j.LFO1_FREQ,this.modAmountControlID=j.LFO1_MOD,this.destinations=new ht([{value:W.OSCILLATOR_MIX,name:`OSC MIX`},{value:W.FREQUENCY,name:`FREQUENCY`},{value:W.CUTOFF,name:`CUTOFF`},{value:W.OSC1_CYCLE,name:`OSC1 CYCLE`},{value:W.OSC2_CYCLE,name:`OSC2 CYCLE`}])}render(){return y`
      <panel-wrapper-element label=${this.label}>
        <div class="lfo-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value}
              @change=${e=>this.dispatchChange(U.WAVE_FORM,e.detail.value)}
            ></wave-selector-element>
          </div>
          <div class="destination-control">
            <lcd-selector-element
              .options=${this.destinations}
              .value=${this.state.destination.value}
              @change=${e=>this.dispatchChange(U.DESTINATION,e.detail.value)}
            ></lcd-selector-element>
          </div>
          <div class="modulation-controls">
            <div class="modulation-control">
              <div class="frequency-control">
                <control-learn-wrapper controlID=${this.frequencyControlID}>
                  <knob-element
                    .value=${this.state.frequency.value}
                    @change=${e=>this.dispatchChange(U.FREQUENCY,e.detail.value)}
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
                    @change=${e=>this.dispatchChange(U.MOD_AMOUNT,e.detail.value)}
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

      .destination-control { margin: 10px auto; }

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
    `}};D([E({type:Object})],G.prototype,`state`,void 0),D([E({type:Number})],G.prototype,`frequencyControlID`,void 0),D([E({type:Number})],G.prototype,`modAmountControlID`,void 0),G=D([T(`lfo-element`)],G);var Pt=class extends w{render(){return y`
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">${this.options.map(this.createOptionSelector.bind(this))}</div>
      </div>
    `}async connectedCallback(){super.connectedCallback(),this.options.selectValue(this.value)}createOptionSelector(e,t){return y`
      <button @click=${this.createOptionHandler(t)} class="${this.computeButtonClasses(t)}">${t}</button>
    `}computeButtonClasses(e){return k({active:this.options.index===e})}createOptionHandler(e){return()=>{this.options.index=e,this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}}nextOption(){this.options.next(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}previousOption(){this.options.previous(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}dispatchChange({value:e}){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}}))}static get styles(){return u`
      .lcd-selector {
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
    `}};D([E({type:Object})],Pt.prototype,`options`,void 0),D([E({type:Object})],Pt.prototype,`value`,void 0),Pt=D([T(`lcd-selector-element`)],Pt);var K=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.AMOUNT=2]=`AMOUNT`,e[e.VELOCITY=3]=`VELOCITY`,e}({}),Ft=class extends R{render(){return y`
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <control-learn-wrapper controlID=${j.CUT_ATTACK}>
              <fader-element label="A" .value=${this.state.attack.value}
                @change=${e=>this.dispatchChange(K.ATTACK,e.detail.value)}
              ></fader-element>
            </control-learn-wrapper>
            <control-learn-wrapper controlID=${j.CUT_DECAY}>
              <fader-element label="D" .value=${this.state.decay.value}
                @change=${e=>this.dispatchChange(K.DECAY,e.detail.value)}
              ></fader-element>
            </control-learn-wrapper>
          </div>
          <div class="mod-controls">
            <div class="mod-control mod">
              <control-learn-wrapper controlID=${j.CUT_MOD}>
                <knob-element label="mod" .value=${this.state.amount.value}
                  @change=${e=>this.dispatchChange(K.AMOUNT,e.detail.value)}
                ></knob-element>
              </control-learn-wrapper>
            </div>
            <div class="mod-control velocity">
              <control-learn-wrapper controlID=${j.CUT_VEL}>
                <knob-element label="vel" .value=${this.state.velocity.value}
                  @change=${e=>this.dispatchChange(K.VELOCITY,e.detail.value)}
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
    `}};D([E({type:Object})],Ft.prototype,`state`,void 0),Ft=D([T(`filter-envelope-element`)],Ft);function It(e){return`CHANNEL:${e<10?`0${e}`:`${e}`}`}var Lt=new ht([{value:-1,name:`CHANNEL:ALL`},...Array.from({length:16},(e,t)=>({value:t,name:It(t+1)}))]),q=function(e){return e[e.MIDI_LEARN=0]=`MIDI_LEARN`,e[e.MIDI_CHANNEL=1]=`MIDI_CHANNEL`,e[e.PRESET=2]=`PRESET`,e}({}),Rt=new ht([{name:`INIT`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:0},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:63},sustain:{value:80},release:{value:20}},filter:{mode:{value:0},cutoff:{value:127},resonance:{value:0},drive:{value:0}},cutoffMod:{attack:{value:0},decay:{value:0},amount:{value:0},velocity:{value:0}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`THICK PAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:58},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:69},cycle:{value:63.5}},osc2Amplitude:{value:64},noiseLevel:{value:0},envelope:{attack:{value:60},decay:{value:40},sustain:{value:100},release:{value:60}},filter:{mode:{value:0},cutoff:{value:80},resonance:{value:20},drive:{value:0}},cutoffMod:{attack:{value:30},decay:{value:60},amount:{value:40},velocity:{value:20}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:8},modAmount:{value:10}},lfo2:{mode:{value:0},destination:{value:5},frequency:{value:5},modAmount:{value:8}}}},{name:`ACID BASS`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:30},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:30},sustain:{value:0},release:{value:5}},filter:{mode:{value:1},cutoff:{value:10},resonance:{value:100},drive:{value:50}},cutoffMod:{attack:{value:0},decay:{value:25},amount:{value:80},velocity:{value:50}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`PLUCK`,value:{osc1:{mode:{value:3},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:95.25},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:40},noiseLevel:{value:5},envelope:{attack:{value:0},decay:{value:50},sustain:{value:0},release:{value:15}},filter:{mode:{value:0},cutoff:{value:40},resonance:{value:30},drive:{value:10}},cutoffMod:{attack:{value:0},decay:{value:30},amount:{value:60},velocity:{value:40}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`STRINGS`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:66},cycle:{value:63.5}},osc2Amplitude:{value:60},noiseLevel:{value:3},envelope:{attack:{value:80},decay:{value:30},sustain:{value:90},release:{value:70}},filter:{mode:{value:0},cutoff:{value:70},resonance:{value:10},drive:{value:0}},cutoffMod:{attack:{value:50},decay:{value:40},amount:{value:20},velocity:{value:10}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:10},modAmount:{value:4}},lfo2:{mode:{value:0},destination:{value:2},frequency:{value:6},modAmount:{value:6}}}},{name:`WOBBLE`,value:{osc1:{mode:{value:1},semiShift:{value:31.75},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:31.75},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:50},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:0},sustain:{value:127},release:{value:10}},filter:{mode:{value:1},cutoff:{value:30},resonance:{value:80},drive:{value:40}},cutoffMod:{attack:{value:0},decay:{value:0},amount:{value:0},velocity:{value:0}},lfo1:{mode:{value:0},destination:{value:2},frequency:{value:20},modAmount:{value:90}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`BRASS`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:75}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:45},noiseLevel:{value:0},envelope:{attack:{value:5},decay:{value:40},sustain:{value:70},release:{value:15}},filter:{mode:{value:0},cutoff:{value:50},resonance:{value:15},drive:{value:20}},cutoffMod:{attack:{value:3},decay:{value:30},amount:{value:60},velocity:{value:40}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`AMBIENT`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:3},semiShift:{value:95.25},centShift:{value:66},cycle:{value:63.5}},osc2Amplitude:{value:35},noiseLevel:{value:8},envelope:{attack:{value:100},decay:{value:50},sustain:{value:80},release:{value:100}},filter:{mode:{value:0},cutoff:{value:60},resonance:{value:25},drive:{value:0}},cutoffMod:{attack:{value:60},decay:{value:80},amount:{value:30},velocity:{value:10}},lfo1:{mode:{value:0},destination:{value:2},frequency:{value:4},modAmount:{value:15}},lfo2:{mode:{value:3},destination:{value:5},frequency:{value:3},modAmount:{value:10}}}},{name:`SUB BASS`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:0},noiseLevel:{value:0},envelope:{attack:{value:2},decay:{value:20},sustain:{value:100},release:{value:10}},filter:{mode:{value:0},cutoff:{value:50},resonance:{value:0},drive:{value:15}},cutoffMod:{attack:{value:0},decay:{value:15},amount:{value:20},velocity:{value:30}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`RESO LEAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:67},cycle:{value:50}},osc2Amplitude:{value:55},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:10},sustain:{value:110},release:{value:15}},filter:{mode:{value:0},cutoff:{value:60},resonance:{value:70},drive:{value:25}},cutoffMod:{attack:{value:0},decay:{value:20},amount:{value:40},velocity:{value:50}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:35},modAmount:{value:5}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`FUNK BASS`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:55}},osc2:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:25},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:25},sustain:{value:50},release:{value:8}},filter:{mode:{value:1},cutoff:{value:18},resonance:{value:75},drive:{value:45}},cutoffMod:{attack:{value:0},decay:{value:18},amount:{value:80},velocity:{value:55}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:15},modAmount:{value:25}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`SYNC LEAD`,value:{osc1:{mode:{value:1},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:1},semiShift:{value:83},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:70},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:15},sustain:{value:100},release:{value:12}},filter:{mode:{value:0},cutoff:{value:90},resonance:{value:35},drive:{value:15}},cutoffMod:{attack:{value:0},decay:{value:25},amount:{value:35},velocity:{value:40}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:40},modAmount:{value:4}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`ELECTRIC PIANO`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:3},semiShift:{value:95.25},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:30},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:60},sustain:{value:30},release:{value:35}},filter:{mode:{value:0},cutoff:{value:75},resonance:{value:10},drive:{value:0}},cutoffMod:{attack:{value:0},decay:{value:40},amount:{value:25},velocity:{value:55}},lfo1:{mode:{value:3},destination:{value:0},frequency:{value:25},modAmount:{value:3}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`CLAV`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:45}},osc2:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:80}},osc2Amplitude:{value:35},noiseLevel:{value:3},envelope:{attack:{value:0},decay:{value:35},sustain:{value:0},release:{value:5}},filter:{mode:{value:2},cutoff:{value:50},resonance:{value:55},drive:{value:25}},cutoffMod:{attack:{value:0},decay:{value:20},amount:{value:55},velocity:{value:65}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`NOISE SWEEP`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:0},noiseLevel:{value:90},envelope:{attack:{value:50},decay:{value:40},sustain:{value:80},release:{value:80}},filter:{mode:{value:0},cutoff:{value:20},resonance:{value:85},drive:{value:10}},cutoffMod:{attack:{value:70},decay:{value:50},amount:{value:60},velocity:{value:20}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:6},modAmount:{value:50}},lfo2:{mode:{value:0},destination:{value:3},frequency:{value:4},modAmount:{value:20}}}},{name:`RING MOD`,value:{osc1:{mode:{value:0},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:82},centShift:{value:80},cycle:{value:63.5}},osc2Amplitude:{value:80},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:70},sustain:{value:20},release:{value:50}},filter:{mode:{value:2},cutoff:{value:45},resonance:{value:50},drive:{value:15}},cutoffMod:{attack:{value:0},decay:{value:50},amount:{value:30},velocity:{value:30}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:3},destination:{value:1},frequency:{value:8},modAmount:{value:15}}}},{name:`CHIPTUNE`,value:{osc1:{mode:{value:2},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:2},semiShift:{value:95.25},centShift:{value:63.5},cycle:{value:63.5}},osc2Amplitude:{value:40},noiseLevel:{value:0},envelope:{attack:{value:0},decay:{value:0},sustain:{value:127},release:{value:3}},filter:{mode:{value:0},cutoff:{value:127},resonance:{value:0},drive:{value:0}},cutoffMod:{attack:{value:0},decay:{value:0},amount:{value:0},velocity:{value:0}},lfo1:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}},lfo2:{mode:{value:0},destination:{value:0},frequency:{value:0},modAmount:{value:0}}}},{name:`DARK PAD`,value:{osc1:{mode:{value:3},semiShift:{value:63.5},centShift:{value:61},cycle:{value:63.5}},osc2:{mode:{value:3},semiShift:{value:63.5},centShift:{value:66},cycle:{value:63.5}},osc2Amplitude:{value:60},noiseLevel:{value:5},envelope:{attack:{value:90},decay:{value:50},sustain:{value:100},release:{value:90}},filter:{mode:{value:0},cutoff:{value:35},resonance:{value:20},drive:{value:10}},cutoffMod:{attack:{value:70},decay:{value:60},amount:{value:15},velocity:{value:10}},lfo1:{mode:{value:0},destination:{value:2},frequency:{value:3},modAmount:{value:10}},lfo2:{mode:{value:3},destination:{value:1},frequency:{value:2},modAmount:{value:8}}}},{name:`SHIMMER`,value:{osc1:{mode:{value:3},semiShift:{value:63.5},centShift:{value:63.5},cycle:{value:63.5}},osc2:{mode:{value:0},semiShift:{value:95.25},centShift:{value:65},cycle:{value:63.5}},osc2Amplitude:{value:50},noiseLevel:{value:6},envelope:{attack:{value:70},decay:{value:40},sustain:{value:85},release:{value:110}},filter:{mode:{value:3},cutoff:{value:50},resonance:{value:30},drive:{value:0}},cutoffMod:{attack:{value:40},decay:{value:60},amount:{value:25},velocity:{value:15}},lfo1:{mode:{value:3},destination:{value:2},frequency:{value:5},modAmount:{value:12}},lfo2:{mode:{value:0},destination:{value:4},frequency:{value:7},modAmount:{value:8}}}}]),zt=class extends w{constructor(...e){super(...e),this.mode=q.PRESET}render(){return y`
      <div class="menu">
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(q.PRESET)}"
            @click=${this.createSwitchModeHandler(q.PRESET)}
          >
            PRESET
          </button>
        </div>
        <div class="button-wrapper channel">
          <button
            class="${this.computeButtonClasses(q.MIDI_CHANNEL)}"
            @click=${this.createSwitchModeHandler(q.MIDI_CHANNEL)}
          >
            CHANNEL
          </button>
        </div>
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(q.MIDI_LEARN)}"
            @click=${this.createSwitchModeHandler(q.MIDI_LEARN)}
          >
            LEARN
          </button>
        </div>
        <div class="lcd-wrapper">
          <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        </div>
        <div class="button-wrapper select">
          <button @click=${this.previousOption}>PREV</button>
        </div>
        <div class="button-wrapper select">
          <button @click=${this.nextOption}>NEXT</button>
        </div>
        <div class="label">WASM POLY</div>
      </div>
    `}computeButtonClasses(e){return k({active:this.mode===e})}createSwitchModeHandler(e){return()=>{this.mode=e,this.dispatchMenuChange()}}nextOption(){this.options.next(),this.dispatchMenuChange(!0),this.requestUpdate()}previousOption(){this.options.previous(),this.dispatchMenuChange(!0),this.requestUpdate()}dispatchMenuChange(e=!1){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:this.mode,option:this.options.getCurrent(),shouldUpdate:e}}))}get options(){switch(this.mode){case q.PRESET:return Rt;case q.MIDI_CHANNEL:return Lt;case q.MIDI_LEARN:default:return gt}}static get styles(){return u`
      :host {
        display: block;
      }

      .menu {
        display: flex;
        --lcd-screen-height: 15px;
        --lcd-screen-width: 130px;
      }

      .lcd-wrapper {
        margin: 0.3em 0.5em 0 0.5em;
      }

      .menu .button-wrapper button {
        font-size: var(--button-font-size, 0.5em);
        background-color: var(--button-disposed-background-color);
        border: var(--button-border);
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        height: 100%;
        color: var(--button-disposed-label-color);
      }

      .menu .button-wrapper button:disabled {
        opacity: 0.5;
        color: white;
      }

      .menu .button-wrapper button:focus { outline: none; }

      .menu .button-wrapper button.active {
        background-color: var(--button-active-background-color);
        border: 1px solid transparent;
        color: var(--button-active-label-color);
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;
        cursor: auto;
      }

      .menu .button-wrapper.channel { margin: 0 1px; }
      .menu .button-wrapper.select { margin: 0 1px; }

      .menu .button-wrapper.select button:active {
        transform: scale(0.99);
        background-color: var(--button-active-background-color);
        color: var(--button-active-label-color);
      }

      .menu .label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 2.3em;
        font-weight: 700;
        line-height: 1em;
        color: var(--main-panel-label-color);
        font-family: var(--main-panel-label-font-family);
        margin-left: auto;
        letter-spacing: 0.1em;
      }
    `}};D([E({type:Number})],zt.prototype,`mode`,void 0),zt=D([T(`menu-element`)],zt);var Bt=class extends w{constructor(...e){super(...e),this.width=1024,this.height=512}firstUpdated(){this.canvas=this.shadowRoot.getElementById(`visualizer`),this.canvasContext=this.canvas.getContext(`2d`),this.draw()}connectedCallback(){super.connectedCallback(),this.analyser.fftSize=2048*2,this.buffer=new Uint8Array(this.analyser.fftSize)}draw(){this.analyser&&this.drawOscilloscope()}drawOscilloscope(){this.canvasContext.clearRect(0,0,this.canvas.width,this.canvas.height);let e=this.canvas.width/this.analyser.fftSize*4;this.analyser.getByteTimeDomainData(this.buffer),this.canvasContext.beginPath(),this.buffer.forEach((t,n)=>{let r=t/128*(this.canvas.height/2),i=n*e;this.canvasContext.lineTo(i,r)}),this.canvasContext.lineWidth=1,this.canvasContext.strokeStyle=`#b4d455`,this.canvasContext.stroke(),requestAnimationFrame(this.drawOscilloscope.bind(this))}render(){return y`
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
    `}};D([E({attribute:!1})],Bt.prototype,`analyser`,void 0),D([E({type:Number})],Bt.prototype,`width`,void 0),D([E({type:Number})],Bt.prototype,`height`,void 0),Bt=D([T(`visualizer-element`)],Bt);var Vt=class extends AudioWorkletNode{constructor(e,t,n){super(e,t,n)}send(e){this.port.postMessage(e)}dispose(){this.send({type:`__dispose`}),this.disconnect()}},Ht=class{constructor(e){e instanceof SharedArrayBuffer?this.buffer=e:this.buffer=new SharedArrayBuffer(e*Float32Array.BYTES_PER_ELEMENT),this.view=new Float32Array(this.buffer)}get length(){return this.view.length}set(e,t){this.view[e]=t}get(e){return this.view[e]}},Ut=8;function Wt(e){return(e.status&15)<<20|(e.channel&15)<<16|(e.data1&127)<<8|e.data2&127}var Gt=class{constructor(e){if(e instanceof SharedArrayBuffer)this.buffer=e,this.capacity=(e.byteLength-Ut)/(4*Float32Array.BYTES_PER_ELEMENT);else{this.capacity=e;let t=Ut+e*4*Float32Array.BYTES_PER_ELEMENT;this.buffer=new SharedArrayBuffer(t)}this.heads=new Int32Array(this.buffer,0,2),this.data=new Float32Array(this.buffer,Ut)}enqueue(e,t=0){let n=Atomics.load(this.heads,1),r=(n+1)%this.capacity;if(r===Atomics.load(this.heads,0))return!1;let i=n*4;return this.data[i]=Wt(e),this.data[i+1]=e.timestamp,this.data[i+2]=t,this.data[i+3]=0,Atomics.store(this.heads,1,r),!0}dequeue(e){let t=Atomics.load(this.heads,0);if(t===Atomics.load(this.heads,1))return!1;let n=t*4;return e[0]=this.data[n],e[1]=this.data[n+1],e[2]=this.data[n+2],e[3]=this.data[n+3],Atomics.store(this.heads,0,(t+1)%this.capacity),!0}enqueueRaw(e,t,n,r,i,a=0){let o=Atomics.load(this.heads,1),s=(o+1)%this.capacity;if(s===Atomics.load(this.heads,0))return!1;let c=(e&15)<<20|(t&15)<<16|(n&127)<<8|r&127,l=o*4;return this.data[l]=c,this.data[l+1]=i,this.data[l+2]=a,this.data[l+3]=0,Atomics.store(this.heads,1,s),!0}},J=function(e){return e[e.NOTE_OFF=8]=`NOTE_OFF`,e[e.NOTE_ON=9]=`NOTE_ON`,e[e.POLY_AFTERTOUCH=10]=`POLY_AFTERTOUCH`,e[e.CONTROL_CHANGE=11]=`CONTROL_CHANGE`,e[e.PROGRAM_CHANGE=12]=`PROGRAM_CHANGE`,e[e.CHANNEL_AFTERTOUCH=13]=`CHANNEL_AFTERTOUCH`,e[e.PITCH_BEND=14]=`PITCH_BEND`,e}({}),Y=Object.freeze({OSC1_MODE:0,OSC2_MODE:1,FILTER_MODE:2,LFO1_MODE:3,LFO1_DESTINATION:4,LFO2_MODE:5,LFO2_DESTINATION:6,AMPLITUDE_ATTACK:7,AMPLITUDE_DECAY:8,AMPLITUDE_SUSTAIN:9,AMPLITUDE_RELEASE:10,OSC1_SEMI_SHIFT:11,OSC1_CENT_SHIFT:12,OSC1_CYCLE:13,OSC2_SEMI_SHIFT:14,OSC2_CENT_SHIFT:15,OSC2_CYCLE:16,OSC2_AMPLITUDE:17,NOISE_LEVEL:18,CUTOFF:19,RESONANCE:20,DRIVE:21,CUTOFF_ENV_AMOUNT:22,CUTOFF_ENV_VELOCITY:23,CUTOFF_ENV_ATTACK:24,CUTOFF_ENV_DECAY:25,LFO1_FREQUENCY:26,LFO1_MOD_AMOUNT:27,LFO2_FREQUENCY:28,LFO2_MOD_AMOUNT:29}),Kt=30,qt=64,X=Object.freeze([1,0,2,3]),Jt=Object.freeze([0,1,3,2]),Yt=class extends Vt{get midiBuffer(){return this.midiRing.buffer}constructor(e){super(e,`synth`,{outputChannelCount:[2]}),this.params=new Ht(Kt),this.midiRing=new Gt(qt),this.send({type:`__init_sab`,paramBuffer:this.params.buffer,midiBuffer:this.midiRing.buffer})}receive(e){let t=e.status===J.NOTE_ON||e.status===J.NOTE_OFF?ct(e.data1):0;this.midiRing.enqueue(e,t)}noteOn(e,t,n){this.midiRing.enqueueRaw(J.NOTE_ON,0,e,n,performance.now(),t)||console.warn(`MIDI ring buffer overflow: noteOn dropped (note=%d)`,e)}noteOff(e){this.midiRing.enqueueRaw(J.NOTE_OFF,0,e,0,performance.now(),0)||console.warn(`MIDI ring buffer overflow: noteOff dropped (note=%d)`,e)}setParam(e,t){this.params.set(e,t)}};function Z(e){return{value:e.value}}function Xt(e){return{mode:Z(e.mode),semiShift:Z(e.semiShift),centShift:Z(e.centShift),cycle:Z(e.cycle)}}function Zt(e){return{osc1:Xt(e.osc1),osc2:Xt(e.osc2),osc2Amplitude:Z(e.osc2Amplitude),noiseLevel:Z(e.noiseLevel),envelope:{attack:Z(e.envelope.attack),decay:Z(e.envelope.decay),sustain:Z(e.envelope.sustain),release:Z(e.envelope.release)},filter:{mode:Z(e.filter.mode),cutoff:Z(e.filter.cutoff),resonance:Z(e.filter.resonance),drive:Z(e.filter.drive)},cutoffMod:{attack:Z(e.cutoffMod.attack),decay:Z(e.cutoffMod.decay),amount:Z(e.cutoffMod.amount),velocity:Z(e.cutoffMod.velocity)},lfo1:{mode:Z(e.lfo1.mode),destination:Z(e.lfo1.destination),frequency:Z(e.lfo1.frequency),modAmount:Z(e.lfo1.modAmount)},lfo2:{mode:Z(e.lfo2.mode),destination:Z(e.lfo2.destination),frequency:Z(e.lfo2.frequency),modAmount:Z(e.lfo2.modAmount)}}}J.NOTE_ON;function Qt(e,t,n){if(e.length===0)return!1;let r=e[0];return r>=240?!1:(n.status=r>>4,n.channel=r&15,n.timestamp=t,n.data1=e.length>1?e[1]:0,n.data2=e.length>2?e[2]:0,!0)}function $t(e){return e.status===J.NOTE_ON&&e.data2>0}function en(e){return e.status===J.NOTE_OFF||e.status===J.NOTE_ON&&e.data2===0}var Q=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e.OSC1=`OSC1`,e.OSC_MIX=`OSC_MIX`,e.NOISE=`NOISE`,e.OSC2=`OSC2`,e.FILTER=`FILTER`,e.ENVELOPE=`ENVELOPE`,e.LFO1=`LFO1`,e.LFO2=`LFO2`,e.CUTOFF_MOD=`CUTOFF_MOD`,e}({}),tn=class extends EventTarget{constructor(e){super(),this.synthNode=null,this.busSubscription=null,this._observers=new Map,this.controlHandlers=new Map,this.audioContext=e,this.output=new GainNode(e),this.setState(Zt(Rt.getCurrent().value)),this.initControlHandlers()}init(){this.synthNode=new Yt(this.audioContext),this.synthNode.connect(this.output),this.syncParams()}connectBus(e){return this.busSubscription=e.subscribe(e=>this.receive(e)),this}receive(e){if($t(e)){let t=ct(e.data1);this.synthNode?.noteOn(e.data1,t,e.data2),this.dispatch(Q.NOTE_ON,{midiValue:e.data1,frequency:t,velocity:e.data2})}else en(e)&&(this.synthNode?.noteOff(e.data1),this.dispatch(Q.NOTE_OFF,{midiValue:e.data1}))}handleControlChange(e,t){let n=this.controlHandlers.get(e);n&&n(t)}next({frequency:e,midiValue:t,velocity:n=60}){this.synthNode?.noteOn(t,e,n)}stop({midiValue:e}){this.synthNode?.noteOff(e)}connect(e){this.output.connect(e)}dispatch(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t})),this}subscribe(e,t){let n=e=>t(e.detail);return this._observers.set(t,n),this.addEventListener(e,n),this}unsubscribe(e,t){return this.removeEventListener(e,this._observers.get(t)),this._observers.delete(t),this}getState(){return{...this.state}}setState(e){return this.state=Zt(e),this.syncParams(),this.getState()}setOsc1Mode(e){return this.state.osc1.mode.value=e,this.sendParam(Y.OSC1_MODE,X[e]),this}setOsc1SemiShift(e){return this.state.osc1.semiShift.value=e,this.sendParam(Y.OSC1_SEMI_SHIFT,e),this}setOsc1CentShift(e){return this.state.osc1.centShift.value=e,this.sendParam(Y.OSC1_CENT_SHIFT,e),this}setOsc1Cycle(e){return this.state.osc1.cycle.value=e,this.sendParam(Y.OSC1_CYCLE,e),this}setOsc2Mode(e){return this.state.osc2.mode.value=e,this.sendParam(Y.OSC2_MODE,X[e]),this}setOsc2SemiShift(e){return this.state.osc2.semiShift.value=e,this.sendParam(Y.OSC2_SEMI_SHIFT,e),this}setOsc2CentShift(e){return this.state.osc2.centShift.value=e,this.sendParam(Y.OSC2_CENT_SHIFT,e),this}setOsc2Cycle(e){return this.state.osc2.cycle.value=e,this.sendParam(Y.OSC2_CYCLE,e),this}setOsc2Amplitude(e){return this.state.osc2Amplitude.value=e,this.sendParam(Y.OSC2_AMPLITUDE,e),this}setNoiseLevel(e){return this.state.noiseLevel.value=e,this.sendParam(Y.NOISE_LEVEL,e),this}setAmplitudeEnvelopeAttack(e){return this.state.envelope.attack.value=e,this.sendParam(Y.AMPLITUDE_ATTACK,e),this}setAmplitudeEnvelopeDecay(e){return this.state.envelope.decay.value=e,this.sendParam(Y.AMPLITUDE_DECAY,e),this}setAmplitudeEnvelopeSustain(e){return this.state.envelope.sustain.value=e,this.sendParam(Y.AMPLITUDE_SUSTAIN,e),this}setAmplitudeEnvelopeRelease(e){return this.state.envelope.release.value=e,this.sendParam(Y.AMPLITUDE_RELEASE,e),this}setFilterMode(e){return this.state.filter.mode.value=e,this.sendParam(Y.FILTER_MODE,Jt[e]),this}setFilterCutoff(e){return this.state.filter.cutoff.value=e,this.sendParam(Y.CUTOFF,e),this}setFilterResonance(e){return this.state.filter.resonance.value=e,this.sendParam(Y.RESONANCE,e),this}setDrive(e){return this.state.filter.drive.value=e,this.sendParam(Y.DRIVE,e),this}setCutoffEnvelopeAmount(e){return this.state.cutoffMod.amount.value=e,this.sendParam(Y.CUTOFF_ENV_AMOUNT,e),this}setCutoffEnvelopeVelocity(e){return this.state.cutoffMod.velocity.value=e,this.sendParam(Y.CUTOFF_ENV_VELOCITY,e),this}setCutoffEnvelopeAttack(e){return this.state.cutoffMod.attack.value=e,this.sendParam(Y.CUTOFF_ENV_ATTACK,e),this}setCutoffEnvelopeDecay(e){return this.state.cutoffMod.decay.value=e,this.sendParam(Y.CUTOFF_ENV_DECAY,e),this}setLfo1Mode(e){return this.state.lfo1.mode.value=e,this.sendParam(Y.LFO1_MODE,X[e]),this}setLfo1Destination(e){return this.state.lfo1.destination.value=e,this.sendParam(Y.LFO1_DESTINATION,e),this}setLfo1Frequency(e){return this.state.lfo1.frequency.value=e,this.sendParam(Y.LFO1_FREQUENCY,e),this}setLfo1ModAmount(e){return this.state.lfo1.modAmount.value=e,this.sendParam(Y.LFO1_MOD_AMOUNT,e),this}setLfo2Mode(e){return this.state.lfo2.mode.value=e,this.sendParam(Y.LFO2_MODE,X[e]),this}setLfo2Destination(e){return this.state.lfo2.destination.value=e,this.sendParam(Y.LFO2_DESTINATION,e),this}setLfo2Frequency(e){return this.state.lfo2.frequency.value=e,this.sendParam(Y.LFO2_FREQUENCY,e),this}setLfo2ModAmount(e){return this.state.lfo2.modAmount.value=e,this.sendParam(Y.LFO2_MOD_AMOUNT,e),this}dumpState(){console.log(JSON.stringify(this.state))}initControlHandlers(){let e=(e,t,n,r,i)=>{this.controlHandlers.set(e,e=>{r(e),this.sendParam(t,e),this.dispatch(n,{...i()})})};e(j.OSC1_SEMI,Y.OSC1_SEMI_SHIFT,Q.OSC1,e=>{this.state.osc1.semiShift.value=e},()=>this.state.osc1),e(j.OSC1_CENT,Y.OSC1_CENT_SHIFT,Q.OSC1,e=>{this.state.osc1.centShift.value=e},()=>this.state.osc1),e(j.OSC1_CYCLE,Y.OSC1_CYCLE,Q.OSC1,e=>{this.state.osc1.cycle.value=e},()=>this.state.osc1),e(j.OSC2_SEMI,Y.OSC2_SEMI_SHIFT,Q.OSC2,e=>{this.state.osc2.semiShift.value=e},()=>this.state.osc2),e(j.OSC2_CENT,Y.OSC2_CENT_SHIFT,Q.OSC2,e=>{this.state.osc2.centShift.value=e},()=>this.state.osc2),e(j.OSC2_CYCLE,Y.OSC2_CYCLE,Q.OSC2,e=>{this.state.osc2.cycle.value=e},()=>this.state.osc2),e(j.OSC_MIX,Y.OSC2_AMPLITUDE,Q.OSC_MIX,e=>{this.state.osc2Amplitude.value=e},()=>this.state.osc2Amplitude),e(j.NOISE,Y.NOISE_LEVEL,Q.NOISE,e=>{this.state.noiseLevel.value=e},()=>this.state.noiseLevel),e(j.CUTOFF,Y.CUTOFF,Q.FILTER,e=>{this.state.filter.cutoff.value=e},()=>this.state.filter),e(j.RESONANCE,Y.RESONANCE,Q.FILTER,e=>{this.state.filter.resonance.value=e},()=>this.state.filter),e(j.DRIVE,Y.DRIVE,Q.FILTER,e=>{this.state.filter.drive.value=e},()=>this.state.filter),e(j.ATTACK,Y.AMPLITUDE_ATTACK,Q.ENVELOPE,e=>{this.state.envelope.attack.value=e},()=>this.state.envelope),e(j.DECAY,Y.AMPLITUDE_DECAY,Q.ENVELOPE,e=>{this.state.envelope.decay.value=e},()=>this.state.envelope),e(j.SUSTAIN,Y.AMPLITUDE_SUSTAIN,Q.ENVELOPE,e=>{this.state.envelope.sustain.value=e},()=>this.state.envelope),e(j.RELEASE,Y.AMPLITUDE_RELEASE,Q.ENVELOPE,e=>{this.state.envelope.release.value=e},()=>this.state.envelope),e(j.LFO1_FREQ,Y.LFO1_FREQUENCY,Q.LFO1,e=>{this.state.lfo1.frequency.value=e},()=>this.state.lfo1),e(j.LFO1_MOD,Y.LFO1_MOD_AMOUNT,Q.LFO1,e=>{this.state.lfo1.modAmount.value=e},()=>this.state.lfo1),e(j.LFO2_FREQ,Y.LFO2_FREQUENCY,Q.LFO2,e=>{this.state.lfo2.frequency.value=e},()=>this.state.lfo2),e(j.LFO2_MOD,Y.LFO2_MOD_AMOUNT,Q.LFO2,e=>{this.state.lfo2.modAmount.value=e},()=>this.state.lfo2),e(j.CUT_ATTACK,Y.CUTOFF_ENV_ATTACK,Q.CUTOFF_MOD,e=>{this.state.cutoffMod.attack.value=e},()=>this.state.cutoffMod),e(j.CUT_DECAY,Y.CUTOFF_ENV_DECAY,Q.CUTOFF_MOD,e=>{this.state.cutoffMod.decay.value=e},()=>this.state.cutoffMod),e(j.CUT_MOD,Y.CUTOFF_ENV_AMOUNT,Q.CUTOFF_MOD,e=>{this.state.cutoffMod.amount.value=e},()=>this.state.cutoffMod),e(j.CUT_VEL,Y.CUTOFF_ENV_VELOCITY,Q.CUTOFF_MOD,e=>{this.state.cutoffMod.velocity.value=e},()=>this.state.cutoffMod)}sendParam(e,t){this.synthNode?.setParam(e,t)}syncParams(){if(!this.synthNode)return;let e=this.state;this.sendParam(Y.OSC1_MODE,X[e.osc1.mode.value]),this.sendParam(Y.OSC1_SEMI_SHIFT,e.osc1.semiShift.value),this.sendParam(Y.OSC1_CENT_SHIFT,e.osc1.centShift.value),this.sendParam(Y.OSC1_CYCLE,e.osc1.cycle.value),this.sendParam(Y.OSC2_MODE,X[e.osc2.mode.value]),this.sendParam(Y.OSC2_SEMI_SHIFT,e.osc2.semiShift.value),this.sendParam(Y.OSC2_CENT_SHIFT,e.osc2.centShift.value),this.sendParam(Y.OSC2_CYCLE,e.osc2.cycle.value),this.sendParam(Y.OSC2_AMPLITUDE,e.osc2Amplitude.value),this.sendParam(Y.NOISE_LEVEL,e.noiseLevel.value),this.sendParam(Y.AMPLITUDE_ATTACK,e.envelope.attack.value),this.sendParam(Y.AMPLITUDE_DECAY,e.envelope.decay.value),this.sendParam(Y.AMPLITUDE_SUSTAIN,e.envelope.sustain.value),this.sendParam(Y.AMPLITUDE_RELEASE,e.envelope.release.value),this.sendParam(Y.FILTER_MODE,Jt[e.filter.mode.value]),this.sendParam(Y.CUTOFF,e.filter.cutoff.value),this.sendParam(Y.RESONANCE,e.filter.resonance.value),this.sendParam(Y.DRIVE,e.filter.drive.value),this.sendParam(Y.CUTOFF_ENV_AMOUNT,e.cutoffMod.amount.value),this.sendParam(Y.CUTOFF_ENV_VELOCITY,e.cutoffMod.velocity.value),this.sendParam(Y.CUTOFF_ENV_ATTACK,e.cutoffMod.attack.value),this.sendParam(Y.CUTOFF_ENV_DECAY,e.cutoffMod.decay.value),this.sendParam(Y.LFO1_MODE,X[e.lfo1.mode.value]),this.sendParam(Y.LFO1_DESTINATION,e.lfo1.destination.value),this.sendParam(Y.LFO1_FREQUENCY,e.lfo1.frequency.value),this.sendParam(Y.LFO1_MOD_AMOUNT,e.lfo1.modAmount.value),this.sendParam(Y.LFO2_MODE,X[e.lfo2.mode.value]),this.sendParam(Y.LFO2_DESTINATION,e.lfo2.destination.value),this.sendParam(Y.LFO2_FREQUENCY,e.lfo2.frequency.value),this.sendParam(Y.LFO2_MOD_AMOUNT,e.lfo2.modAmount.value)}},nn=class{constructor(e){this.connections=[],this.decodeBuffer={status:J.NOTE_ON,channel:0,data1:0,data2:0,timestamp:0},this.onMessage=e=>{if(Qt(e.data,e.timeStamp,this.decodeBuffer))for(let e=0,t=this.connections.length;e<t;e++){let t=this.connections[e];this.matchesFilter(t.filter)&&t.target.receive(this.decodeBuffer)}},this.port=e,this.id=e.id,this.name=e.name??`Unknown`,this.manufacturer=e.manufacturer??``,this.port.onmidimessage=this.onMessage}connect(e,t){let n={target:e,filter:t};return this.connections.push(n),{dispose:()=>{let e=this.connections.indexOf(n);e!==-1&&(this.connections[e]=this.connections[this.connections.length-1],this.connections.pop())}}}disconnect(){this.port.onmidimessage=null,this.connections.length=0}matchesFilter(e){if(!e)return!0;if(e.channel!==void 0){if(Array.isArray(e.channel)){if(!e.channel.includes(this.decodeBuffer.channel))return!1}else if(e.channel!==this.decodeBuffer.channel)return!1}if(e.status!==void 0){if(Array.isArray(e.status)){if(!e.status.includes(this.decodeBuffer.status))return!1}else if(e.status!==this.decodeBuffer.status)return!1}return!0}},rn=class{constructor(e){this.sendBuf3=new Uint8Array(3),this.sendBuf2=new Uint8Array(2),this.port=e,this.id=e.id,this.name=e.name??`Unknown`,this.manufacturer=e.manufacturer??``}receive(e){let t=e.status<<4|e.channel;e.status===J.PROGRAM_CHANGE||e.status===J.CHANNEL_AFTERTOUCH?(this.sendBuf2[0]=t,this.sendBuf2[1]=e.data1,this.port.send(this.sendBuf2,e.timestamp)):(this.sendBuf3[0]=t,this.sendBuf3[1]=e.data1,this.sendBuf3[2]=e.data2,this.port.send(this.sendBuf3,e.timestamp))}disconnect(){this.port.close()}},an=class{constructor(){this.inputs=new Map,this.outputs=new Map,this.midiAccess=null,this.listeners=[],this.onStateChange=e=>{let t=e.port;if(t){if(t.type===`input`){if(t.state===`connected`&&!this.inputs.has(t.id)){let e=this.registerInput(t);this.notify(e,`connected`)}else if(t.state===`disconnected`&&this.inputs.has(t.id)){let e=this.inputs.get(t.id);e.disconnect(),this.inputs.delete(t.id),this.notify(e,`disconnected`)}}else if(t.type===`output`){if(t.state===`connected`&&!this.outputs.has(t.id)){let e=this.registerOutput(t);this.notify(e,`connected`)}else if(t.state===`disconnected`&&this.outputs.has(t.id)){let e=this.outputs.get(t.id);e.disconnect(),this.outputs.delete(t.id),this.notify(e,`disconnected`)}}}}}async init(e){if(!navigator.requestMIDIAccess)throw Error(`Web MIDI API not supported in this browser`);return this.midiAccess=await navigator.requestMIDIAccess(e??{sysex:!1}),this.midiAccess.onstatechange=this.onStateChange,this.midiAccess.inputs.forEach(e=>this.registerInput(e)),this.midiAccess.outputs.forEach(e=>this.registerOutput(e)),this}findInput(e){let t=e.toLowerCase();for(let e of this.inputs.values())if(e.name.toLowerCase().includes(t))return e}findOutput(e){let t=e.toLowerCase();for(let e of this.outputs.values())if(e.name.toLowerCase().includes(t))return e}onPortChange(e){return this.listeners.push(e),()=>{let t=this.listeners.indexOf(e);t!==-1&&this.listeners.splice(t,1)}}destroy(){this.midiAccess&&(this.midiAccess.onstatechange=null);for(let e of this.inputs.values())e.disconnect();for(let e of this.outputs.values())e.disconnect();this.inputs.clear(),this.outputs.clear(),this.listeners.length=0}registerInput(e){let t=new nn(e);return this.inputs.set(e.id,t),t}registerOutput(e){let t=new rn(e);return this.outputs.set(e.id,t),t}notify(e,t){for(let n of this.listeners)n(e,t)}};function on(e){if(!e?.channel)return 65535;let t=Array.isArray(e.channel)?e.channel:[e.channel],n=0;for(let e of t)n|=1<<e;return n}function sn(e){if(!e?.status)return 127;let t=Array.isArray(e.status)?e.status:[e.status],n=0;for(let e of t)n|=1<<e-8;return n}var cn=class{constructor(){this.routes=[]}addRoute(e,t){let n={channelMask:on(t),statusMask:sn(t),handler:e};return this.routes.push(n),{dispose:()=>{let e=this.routes.indexOf(n);e!==-1&&(this.routes[e]=this.routes[this.routes.length-1],this.routes.pop())}}}dispatch(e){let t=1<<e.channel,n=1<<e.status-8;for(let r=0,i=this.routes.length;r<i;r++){let i=this.routes[r];i.channelMask&t&&i.statusMask&n&&i.handler(e)}}get routeCount(){return this.routes.length}clear(){this.routes.length=0}},ln=class{constructor(e){this.dispatcher=new cn,this.ringTargets=[],this.name=e}receive(e){this.dispatcher.dispatch(e),this.dispatchToRings(e)}send(e,t,n,r,i=performance.now()){let a={status:e,channel:t,data1:n,data2:r,timestamp:i};this.receive(a)}subscribe(e,t){return this.dispatcher.addRoute(e,t)}from(e,t){return e.connect(this,t)}subscribeRing(e,t){let n={ring:e,channelMask:t?.channel?Array.isArray(t.channel)?t.channel.reduce((e,t)=>e|1<<t,0):1<<t.channel:65535,statusMask:t?.status?Array.isArray(t.status)?t.status.reduce((e,t)=>e|1<<t-8,0):1<<t.status-8:127};return this.ringTargets.push(n),{dispose:()=>{let e=this.ringTargets.indexOf(n);e!==-1&&(this.ringTargets[e]=this.ringTargets[this.ringTargets.length-1],this.ringTargets.pop())}}}dispatchToRings(e){let t=1<<e.channel,n=1<<e.status-8;for(let r=0,i=this.ringTargets.length;r<i;r++){let i=this.ringTargets[r];if(i.channelMask&t&&i.statusMask&n){let t=e.status===J.NOTE_ON||e.status===J.NOTE_OFF?ct(e.data1):0;i.ring.enqueue(e,t)}}}},un=class{constructor(e){this.port=e}channel(e){return this.channelFilter=e,this}notes(){return this.statusFilter=[J.NOTE_ON,J.NOTE_OFF],this}cc(){return this.statusFilter=J.CONTROL_CHANGE,this}pitchBend(){return this.statusFilter=J.PITCH_BEND,this}all(){return this.channelFilter=void 0,this.statusFilter=void 0,this}to(e){let t={};return this.channelFilter!==void 0&&(t.channel=this.channelFilter),this.statusFilter!==void 0&&(t.status=this.statusFilter),this.port.connect(e,Object.keys(t).length>0?t:void 0)}},dn=class{constructor(e){this.buses=new Map,this.devices=e}input(e){let t=this.devices.findInput(e);if(!t)throw Error(`MIDI input "${e}" not found. Available: ${this.inputNames().join(`, `)}`);return new un(t)}output(e){let t=this.devices.findOutput(e);if(!t)throw Error(`MIDI output "${e}" not found. Available: ${this.outputNames().join(`, `)}`);return t}bus(e){let t=this.buses.get(e);return t||(t=new ln(e),this.buses.set(e,t)),t}inputNames(){return[...this.devices.inputs.values()].map(e=>e.name)}outputNames(){return[...this.devices.outputs.values()].map(e=>e.name)}onPortChange(e){return this.devices.onPortChange(e)}destroy(){this.devices.destroy(),this.buses.clear()}};async function fn(e){let t=new an;return await t.init(e),new dn(t)}var pn=60,mn=0,hn=new Map([[`w`,48],[`x`,50],[`c`,52],[`v`,53],[`b`,55],[`n`,57],[`q`,59],[`s`,60],[`d`,62],[`f`,64],[`g`,65],[`h`,67],[`j`,69],[`k`,71],[`l`,72],[`m`,74],[`a`,49],[`z`,51],[`e`,54],[`r`,56],[`t`,58],[`y`,61],[`u`,63],[`i`,66],[`o`,68],[`p`,70]]),gn=class{constructor(){this.pressedKeys=new Set,this.connections=[],this.event={status:J.NOTE_ON,channel:mn,data1:0,data2:pn,timestamp:0},this.onKeyDown=e=>{let t=hn.get(e.key);t===void 0||this.pressedKeys.has(e.key)||(this.pressedKeys.add(e.key),this.event.status=J.NOTE_ON,this.event.data1=t,this.event.data2=pn,this.event.timestamp=performance.now(),this.emit())},this.onKeyUp=e=>{if(!this.pressedKeys.delete(e.key))return;let t=hn.get(e.key);t!==void 0&&(this.event.status=J.NOTE_OFF,this.event.data1=t,this.event.data2=0,this.event.timestamp=performance.now(),this.emit())},document.addEventListener(`keydown`,this.onKeyDown),document.addEventListener(`keyup`,this.onKeyUp)}connect(e,t){let n={target:e,filter:t};return this.connections.push(n),{dispose:()=>{let e=this.connections.indexOf(n);e!==-1&&(this.connections[e]=this.connections[this.connections.length-1],this.connections.pop())}}}destroy(){document.removeEventListener(`keydown`,this.onKeyDown),document.removeEventListener(`keyup`,this.onKeyUp),this.connections.length=0}emit(){for(let e=0,t=this.connections.length;e<t;e++)this.connections[e].target.receive(this.event)}};function $(e){throw Error(`Unexpected discriminant: ${e}`)}var _n=class{constructor(e){this.protocol=`midi`,this.handler=null,this.subscription=null,this.bus=e}connect(){this.subscription||=this.bus.subscribe(e=>{this.handler&&this.handler({sourceId:`midi:cc:${e.data1}`,value:e.data2,protocol:this.protocol,raw:e})},{status:J.CONTROL_CHANGE})}disconnect(){this.subscription?.dispose(),this.subscription=null}onSignal(e){return this.handler=e,{dispose:()=>{this.handler=null}}}},vn=class extends w{constructor(){super(),this.showVizualizer=!1,this.editMode=!1,this._pendingKeyUpdate=!1,this.pressedKeys=new Set,this.audioContext=new AudioContext,this.analyzer=this.audioContext.createAnalyser(),this.voiceManager=new tn(this.audioContext),this.state=this.voiceManager.getState()}async connectedCallback(){super.connectedCallback(),await this.audioContext.audioWorklet.addModule(`synth-processor.js`),this.voiceManager.init(),this.midi=await fn(),this.midiBus=this.midi.bus(`main`),this.setUpVoiceManager(),this.analyzer.connect(this.audioContext.destination),this.registerVoiceHandlers(),this.setUpBindingManager()}setUpVoiceManager(){for(let e of this.midi.devices.inputs.values())e.connect(this.midiBus);this.midi.onPortChange((e,t)=>{t===`connected`&&`connect`in e&&e.connect(this.midiBus)}),new gn().connect(this.midiBus),this.voiceManager.connectBus(this.midiBus).connect(this.analyzer)}setUpBindingManager(){let e=N(),t=new _n(this.midiBus);e.registerSource(t),e.addEventListener(`control-change`,(e=>{let{controlId:t,value:n}=e.detail;this.voiceManager.handleControlChange(t,n),this.state=this.voiceManager.getState(),this.requestUpdate()}))}scheduleKeyUpdate(){this._pendingKeyUpdate||(this._pendingKeyUpdate=!0,requestAnimationFrame(()=>{this._pendingKeyUpdate=!1,this.pressedKeys=new Set(this.pressedKeys)}))}registerVoiceHandlers(){this.voiceManager.subscribe(Q.NOTE_ON,e=>{this.pressedKeys.add(e.midiValue),this.scheduleKeyUpdate()}).subscribe(Q.NOTE_OFF,e=>{this.pressedKeys.delete(e.midiValue),this.scheduleKeyUpdate()}).subscribe(Q.OSC1,e=>{this.state.osc1=e,this.requestUpdate()}).subscribe(Q.OSC_MIX,e=>{this.state.osc2Amplitude=e,this.requestUpdate()}).subscribe(Q.NOISE,e=>{this.state.noiseLevel=e,this.requestUpdate()}).subscribe(Q.OSC2,e=>{this.state.osc2=e,this.requestUpdate()}).subscribe(Q.FILTER,e=>{this.state.filter=e,this.requestUpdate()}).subscribe(Q.ENVELOPE,e=>{this.state.envelope=e,this.requestUpdate()}).subscribe(Q.LFO1,e=>{this.state.lfo1=e,this.requestUpdate()}).subscribe(Q.LFO2,e=>{this.state.lfo2=e,this.requestUpdate()}).subscribe(Q.CUTOFF_MOD,e=>{this.state.cutoffMod=e,this.requestUpdate()})}async onKeyOn(e){this.audioContext.state===`suspended`&&await this.audioContext.resume();let{frequency:t,midiValue:n}=e.detail;this.voiceManager.next({frequency:t,midiValue:n})}onKeyOff(e){let{midiValue:t}=e.detail;this.voiceManager.stop({midiValue:t})}onOsc1Change(e){switch(e.detail.type){case L.WAVE_FORM:this.voiceManager.setOsc1Mode(e.detail.value);break;case L.SEMI_SHIFT:this.voiceManager.setOsc1SemiShift(e.detail.value);break;case L.CENT_SHIFT:this.voiceManager.setOsc1CentShift(e.detail.value);break;case L.CYCLE:this.voiceManager.setOsc1Cycle(e.detail.value);break;case L.MIX:break;case L.NOISE:break;default:$(e.detail.type)}}onOsc2Change(e){switch(e.detail.type){case L.WAVE_FORM:this.voiceManager.setOsc2Mode(e.detail.value);break;case L.SEMI_SHIFT:this.voiceManager.setOsc2SemiShift(e.detail.value);break;case L.CENT_SHIFT:this.voiceManager.setOsc2CentShift(e.detail.value);break;case L.CYCLE:this.voiceManager.setOsc2Cycle(e.detail.value);break;case L.MIX:break;case L.NOISE:break;default:$(e.detail.type)}}onOscMixChange(e){switch(e.detail.type){case L.MIX:this.voiceManager.setOsc2Amplitude(e.detail.value);break;case L.NOISE:this.voiceManager.setNoiseLevel(e.detail.value);break;case L.WAVE_FORM:break;case L.SEMI_SHIFT:break;case L.CENT_SHIFT:break;case L.CYCLE:break;default:$(e.detail.type)}}onFilterChange(e){switch(e.detail.type){case B.MODE:this.voiceManager.setFilterMode(e.detail.value);break;case B.CUTOFF:this.voiceManager.setFilterCutoff(e.detail.value);break;case B.RESONANCE:this.voiceManager.setFilterResonance(e.detail.value);break;case B.DRIVE:this.voiceManager.setDrive(e.detail.value);break;default:$(e.detail.type)}}onAmplitudeEnvelopeChange(e){switch(e.detail.type){case H.ATTACK:this.voiceManager.setAmplitudeEnvelopeAttack(e.detail.value);break;case H.DECAY:this.voiceManager.setAmplitudeEnvelopeDecay(e.detail.value);break;case H.SUSTAIN:this.voiceManager.setAmplitudeEnvelopeSustain(e.detail.value);break;case H.RELEASE:this.voiceManager.setAmplitudeEnvelopeRelease(e.detail.value);break;default:$(e.detail.type)}}onFilterEnvelopeChange(e){switch(e.detail.type){case K.ATTACK:this.voiceManager.setCutoffEnvelopeAttack(e.detail.value);break;case K.DECAY:this.voiceManager.setCutoffEnvelopeDecay(e.detail.value);break;case K.AMOUNT:this.voiceManager.setCutoffEnvelopeAmount(e.detail.value);break;case K.VELOCITY:this.voiceManager.setCutoffEnvelopeVelocity(e.detail.value);break;default:$(e.detail.type)}}onLfo1Change(e){switch(e.detail.type){case U.WAVE_FORM:this.voiceManager.setLfo1Mode(e.detail.value);break;case U.FREQUENCY:this.voiceManager.setLfo1Frequency(e.detail.value);break;case U.MOD_AMOUNT:this.voiceManager.setLfo1ModAmount(e.detail.value);break;case U.DESTINATION:this.voiceManager.setLfo1Destination(e.detail.value);break;default:$(e.detail.type)}}onLfo2Change(e){switch(e.detail.type){case U.WAVE_FORM:this.voiceManager.setLfo2Mode(e.detail.value);break;case U.FREQUENCY:this.voiceManager.setLfo2Frequency(e.detail.value);break;case U.MOD_AMOUNT:this.voiceManager.setLfo2ModAmount(e.detail.value);break;case U.DESTINATION:this.voiceManager.setLfo2Destination(e.detail.value);break;default:$(e.detail.type)}}async onMenuChange(e){let{type:t,option:n,shouldUpdate:r}=e.detail,i=N();switch(t){case q.MIDI_LEARN:r?i.startLearning(n.value):i.stopLearning();break;case q.MIDI_CHANNEL:i.stopLearning();break;case q.PRESET:i.stopLearning(),r&&(this.state=this.voiceManager.setState(n.value));break}await this.requestUpdate()}computeVizualizerIfEnabled(){if(this.showVizualizer)return y`
        <div class="visualizer">
          <visualizer-element
            .analyser=${this.analyzer}
            width="650"
            height="200"
          ></visualizer-element>
        </div>
      `}computeDumpButtonIfEnabled(){if(this.editMode)return y`<button @click=${this.voiceManager.dumpState}>Dump</button>`}render(){return y`
      <div class="content">
        <div class="synth">
          <div class="menu">
            <menu-element
              .analyser=${this.analyzer}
              @change=${this.onMenuChange}
            ></menu-element>
          </div>
          <div class="panels-row upper">
            <oscillator-element
              .semiControlID=${j.OSC1_SEMI}
              .centControlID=${j.OSC1_CENT}
              .cycleControlID=${j.OSC1_CYCLE}
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
              .semiControlID=${j.OSC2_SEMI}
              .centControlID=${j.OSC2_CENT}
              .cycleControlID=${j.OSC2_CYCLE}
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
              .frequencyControlID=${j.LFO1_FREQ}
              .modAmountControlID=${j.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .frequencyControlID=${j.LFO2_FREQ}
              .modAmountControlID=${j.LFO2_MOD}
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
        width: 85%;
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .visualizer {
        margin: auto;
      }

      .menu {
        margin: 0 0 15px 0;
      }

      .synth {
        margin: 20px auto;
        width: calc(650px + 3em);
        max-width: 100%;
        background-color: var(--main-panel-color);
        border-radius: 0.5rem;
        padding: 1.5em;
        box-sizing: border-box;
      }

      /* ── Grid rows ── */

      .panels-row {
        display: grid;
        gap: 0.5rem;
        align-items: start;
      }

      .panels-row > * {
        min-width: 0;
      }

      /* Upper: Osc1(160) Mix(60) Osc2(160) Filter(160) → 8:3:8:8 */
      .panels-row.upper {
        grid-template-columns: 8fr 3fr 8fr 8fr;
      }

      /* Lower: Env(160) LFO1(130) LFO2(130) FilterMod(130) → 6:5:5:5 */
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
    `}};D([E({type:Object})],vn.prototype,`pressedKeys`,void 0),vn=D([T(`wasm-poly-element`)],vn);var yn=class extends w{render(){return y`<wasm-poly-element></wasm-poly-element>`}};yn=D([T(`root-element`)],yn),r();