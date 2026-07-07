(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:ee,getOwnPropertyNames:te,getOwnPropertySymbols:ne,getPrototypeOf:re}=Object,ie=globalThis,ae=ie.trustedTypes,oe=ae?ae.emptyScript:``,se=ie.reactiveElementPolyfillSupport,ce=(e,t)=>e,le={toAttribute(e,t){switch(t){case Boolean:e=e?oe:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},ue=(e,t)=>!l(e,t),de={attribute:!0,type:String,converter:le,reflect:!1,useDefault:!1,hasChanged:ue};Symbol.metadata??=Symbol(`metadata`),ie.litPropertyMetadata??=new WeakMap;var d=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=de){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=ee(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??de}static _$Ei(){if(this.hasOwnProperty(ce(`elementProperties`)))return;let e=re(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(ce(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ce(`properties`))){let e=this.properties,t=[...te(e),...ne(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?le:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?le:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??ue)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};d.elementStyles=[],d.shadowRootOptions={mode:`open`},d[ce(`elementProperties`)]=new Map,d[ce(`finalized`)]=new Map,se?.({ReactiveElement:d}),(ie.reactiveElementVersions??=[]).push(`2.1.2`);var fe=globalThis,pe=e=>e,me=fe.trustedTypes,he=me?me.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ge=`$lit$`,f=`lit$${Math.random().toFixed(9).slice(2)}$`,_e=`?`+f,ve=`<${_e}>`,p=document,m=()=>p.createComment(``),h=e=>e===null||typeof e!=`object`&&typeof e!=`function`,ye=Array.isArray,be=e=>ye(e)||typeof e?.[Symbol.iterator]==`function`,xe=`[ 	
\f\r]`,g=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Se=/-->/g,Ce=/>/g,_=RegExp(`>|${xe}(?:([^\\s"'>=/]+)(${xe}*=${xe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),we=/'/g,Te=/"/g,Ee=/^(?:script|style|textarea|title)$/i,v=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),y=Symbol.for(`lit-noChange`),b=Symbol.for(`lit-nothing`),De=new WeakMap,x=p.createTreeWalker(p,129);function Oe(e,t){if(!ye(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return he===void 0?t:he.createHTML(t)}var ke=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=g;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===g?c[1]===`!--`?o=Se:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=_):(Ee.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=_):o=Ce:o===_?c[0]===`>`?(o=i??g,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?_:c[3]===`"`?Te:we):o===Te||o===we?o=_:o===Se||o===Ce?o=g:(o=_,i=void 0);let ee=o===_&&e[t+1].startsWith(`/>`)?` `:``;a+=o===g?n+ve:l>=0?(r.push(s),n.slice(0,l)+ge+n.slice(l)+f+ee):n+f+(l===-2?t:ee)}return[Oe(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},Ae=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=ke(t,n);if(this.el=e.createElement(l,r),x.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=x.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ge)){let t=u[o++],n=i.getAttribute(e).split(f),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Pe:r[1]===`?`?Fe:r[1]===`@`?Ie:Ne}),i.removeAttribute(e)}else e.startsWith(f)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(Ee.test(i.tagName)){let e=i.textContent.split(f),t=e.length-1;if(t>0){i.textContent=me?me.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],m()),x.nextNode(),c.push({type:2,index:++a});i.append(e[t],m())}}}else if(i.nodeType===8)if(i.data===_e)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(f,e+1))!==-1;)c.push({type:7,index:a}),e+=f.length-1}a++}}static createElement(e,t){let n=p.createElement(`template`);return n.innerHTML=e,n}};function S(e,t,n=e,r){if(t===y)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=h(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=S(e,i._$AS(e,t.values),i,r)),t}var je=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??p).importNode(t,!0);x.currentNode=r;let i=x.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new Me(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Le(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=x.nextNode(),a++)}return x.currentNode=p,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},Me=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=b,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=S(this,e,t),h(e)?e===b||e==null||e===``?(this._$AH!==b&&this._$AR(),this._$AH=b):e!==this._$AH&&e!==y&&this._(e):e._$litType$===void 0?e.nodeType===void 0?be(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==b&&h(this._$AH)?this._$AA.nextSibling.data=e:this.T(p.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=Ae.createElement(Oe(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new je(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=De.get(e.strings);return t===void 0&&De.set(e.strings,t=new Ae(e)),t}k(t){ye(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(m()),this.O(m()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=pe(e).nextSibling;pe(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Ne=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=b,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=b}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=S(this,e,t,0),a=!h(e)||e!==this._$AH&&e!==y,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=S(this,r[n+o],t,o),s===y&&(s=this._$AH[o]),a||=!h(s)||s!==this._$AH[o],s===b?e=b:e!==b&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===b?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Pe=class extends Ne{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===b?void 0:e}},Fe=class extends Ne{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==b)}},Ie=class extends Ne{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=S(this,e,t,0)??b)===y)return;let n=this._$AH,r=e===b&&n!==b||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==b&&(n===b||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Le=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){S(this,e)}},Re=fe.litHtmlPolyfillSupport;Re?.(Ae,Me),(fe.litHtmlVersions??=[]).push(`3.3.3`);var ze=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new Me(t.insertBefore(m(),e),e,void 0,n??{})}return i._$AI(e),i},Be=globalThis,C=class extends d{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ze(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return y}};C._$litElement$=!0,C.finalized=!0,Be.litElementHydrateSupport?.({LitElement:C});var Ve=Be.litElementPolyfillSupport;Ve?.({LitElement:C}),(Be.litElementVersions??=[]).push(`4.2.2`);var w=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},He={attribute:!0,type:String,converter:le,reflect:!1,hasChanged:ue},Ue=(e=He,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function T(e){return(t,n)=>typeof n==`object`?Ue(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}var We={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ge=e=>(...t)=>({_$litDirective$:e,values:t}),Ke=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},E=Ge(class extends Ke{constructor(e){if(super(e),e.type!==We.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return y}}),qe=Object.freeze([`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`]);function Je(e,t=440){return e>=0&&e<=127?t*2**((e-69)/12):null}function Ye(e,t){return(t+1)*12+qe.indexOf(e)}function Xe({value:e,velocity:t=100}){let n=(e-24)%12,r=(e-n-12)/12;return{pitchClass:qe[n],octave:r,frequency:Je(e),midiValue:e,velocity:t}}function Ze(e){return(e-24)%12}function Qe(e){return(e-Ze(e)-12)/12}function $e(e,t,n=440){return Je(Ye(e,t),n)}function et(e,t=440){return qe.map(n=>({pitchClass:n,octave:e,frequency:$e(n,e,t),midiValue:Ye(n,e),velocity:127})).filter(e=>e.frequency!==null)}function tt(e=440){let t=[];for(let n=0;n<10;++n)t.push(et(n,e));return t}function D(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var nt=tt(440).map(rt);function rt(e){return e.map(e=>{let t=e.pitchClass.endsWith(`#`),n=t?e.pitchClass.replace(`#`,`--sharp`):e.pitchClass;return{...e,classes:{[n]:!0,"key--sharp":t,"key--whole":!t,key:!0}}})}var O=class extends C{constructor(...e){super(...e),this.lowerKey=36,this.higherKey=61,this.mouseControlledKey=null}get octaves(){return nt.slice(Qe(this.lowerKey),Qe(this.higherKey)+1)}async connectedCallback(){super.connectedCallback(),this.registerMouseUpHandler()}registerMouseUpHandler(){document.addEventListener(`mouseup`,this.mouseUp.bind(this))}mouseUp(){this.mouseControlledKey&&=(this.keyOff(this.mouseControlledKey),null)}mouseDown(e){return async t=>{t.button===0&&(this.mouseControlledKey=e,await this.keyOn(e))}}mouseEnter(e){return async()=>{this.mouseControlledKey&&(await this.keyOff(this.mouseControlledKey),this.mouseControlledKey=e,await this.keyOn(e))}}findKey(e){return nt[Qe(e)][Ze(e)]}async keyOn(e){this.pressedKeys.add(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOn`,{detail:e})),await this.requestUpdate()}async keyOff(e){this.pressedKeys.delete(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOff`,{detail:e})),await this.requestUpdate()}createOctaveElement(e){return v`
      <div class="octave">
        ${e.map(this.createKeyElement.bind(this))}
      </div>
    `}createKeyElement(e){return v`
      <div
        @mousedown=${this.mouseDown(e)}
        @mouseenter=${this.mouseEnter(e)}
        id="${e.midiValue}"
        class="${this.computeKeyClasses(e)}"
      ></div>
    `}computeKeyClasses(e){return E({...e.classes,"key--pressed":this.pressedKeys&&this.pressedKeys.has(e.midiValue)})}render(){return v`
      <div class="octaves">
        ${this.octaves.map(this.createOctaveElement.bind(this))}
      </div>
    `}static get styles(){return o`
      :host {
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
    `}};D([T({type:Number})],O.prototype,`lowerKey`,void 0),D([T({type:Number})],O.prototype,`higherKey`,void 0),D([T({type:Object})],O.prototype,`pressedKeys`,void 0),O=D([w(`keys-element`)],O);var it=class extends C{constructor(...e){super(...e),this.width=1024,this.height=512}firstUpdated(){this.canvas=this.shadowRoot.getElementById(`visualizer`),this.canvasContext=this.canvas.getContext(`2d`),this.draw()}connectedCallback(){super.connectedCallback(),this.analyser.fftSize=2048*2,this.buffer=new Uint8Array(this.analyser.fftSize)}draw(){this.analyser&&this.drawOscilloscope()}drawOscilloscope(){this.canvasContext.clearRect(0,0,this.canvas.width,this.canvas.height);let e=this.canvas.width/this.analyser.fftSize*4;this.analyser.getByteTimeDomainData(this.buffer),this.canvasContext.beginPath(),this.buffer.forEach((t,n)=>{let r=t/128*(this.canvas.height/2),i=n*e;this.canvasContext.lineTo(i,r)}),this.canvasContext.lineWidth=1,this.canvasContext.strokeStyle=`#b4d455`,this.canvasContext.stroke(),requestAnimationFrame(this.drawOscilloscope.bind(this))}render(){return v`
      <canvas
        class="test"
        id="visualizer"
        width=${this.width}
        height=${this.height}
      ></canvas>
    `}static get styles(){return o`
      canvas {
        border: 1px solid grey;
        border-radius: 0.25rem;
      }
    `}};D([T({attribute:!1})],it.prototype,`analyser`,void 0),D([T({type:Number})],it.prototype,`width`,void 0),D([T({type:Number})],it.prototype,`height`,void 0),it=D([w(`visualizer-element`)],it);var k=function(e){return e[e.SINE=0]=`SINE`,e[e.SAWTOOTH=1]=`SAWTOOTH`,e[e.SQUARE=2]=`SQUARE`,e[e.TRIANGLE=3]=`TRIANGLE`,e}({}),at=class extends C{render(){return v`
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
    `}static get styles(){return o`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `}};at=D([w(`sine-wave-icon`)],at);var ot=class extends C{render(){return v`
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
    `}static get styles(){return o`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `}};ot=D([w(`square-wave-icon`)],ot);var st=class extends C{render(){return v`
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
    `}static get styles(){return o`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `}};st=D([w(`saw-wave-icon`)],st);var ct=class extends C{render(){return v`
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
    `}static get styles(){return o`
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
        margin-left: 1px;
      }
    `}};ct=D([w(`triangle-wave-icon`)],ct);var lt=class extends C{constructor(...e){super(...e),this.value=k.SINE}async onSawSelect(){this.value=k.SAWTOOTH,this.dispatchSelect()}async onSquareSelect(){this.value=k.SQUARE,this.dispatchSelect()}async onSineSelect(){this.value=k.SINE,this.dispatchSelect()}async onTriangleSelect(){this.value=k.TRIANGLE,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return v`
      <div class="wave-selector">
        <button
          class="${this.computeButtonClasses(k.SAWTOOTH)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(k.SQUARE)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(k.TRIANGLE)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(k.SINE)}"
          @click=${this.onSineSelect}
        >
          <sine-wave-icon class="icon"></sine-wave-icon>
        </button>
      </div>
    `}computeButtonClasses(e){return E({active:e===this.value})}static get styles(){return o`
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
    `}};D([T({type:Number})],lt.prototype,`value`,void 0),lt=D([w(`wave-selector-element`)],lt);var A=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.SEMI_SHIFT=1]=`SEMI_SHIFT`,e[e.CENT_SHIFT=2]=`CENT_SHIFT`,e[e.CYCLE=3]=`CYCLE`,e[e.MIX=4]=`MIX`,e[e.NOISE=5]=`NOISE`,e}({});function ut(e,t){return t>=e.max?e.max:t<=e.min?e.min:t}function dt(e,t,n){return Math.round(n.min+(e-t.min)*(n.max-n.min)/(t.max-t.min))}var ft={min:-135,max:135},pt={min:0,max:127},j=class extends C{constructor(...e){super(...e),this.range=pt,this.value=64,this.step=1,this.angle=0}async connectedCallback(){super.connectedCallback(),this.updateAngle()}toggleActive(){let e=e=>{e.preventDefault(),this.updateValue(this.computeStep(-e.movementY,e.altKey))},t=()=>{document.removeEventListener(`mouseup`,t),document.removeEventListener(`mousemove`,e)};document.addEventListener(`mousemove`,e),document.addEventListener(`mouseup`,t)}onWheel(e){e.preventDefault(),this.updateValue(this.computeStep(e.deltaY,e.altKey))}updateAngle(){this.angle=dt(this.value,this.range,ft)}updateValue(e){this.value=ut(this.range,this.value+e)}computeStep(e,t=!1){return this.computeStepMultiplier(e,t)*this.step}computeStepMultiplier(e,t=!1){let n=e<0?-1:1;return t?n*.25:n}updated(e){e.has(`value`)&&(this.updateAngle(),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}})))}render(){return v`
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
    `}static get styles(){return o`
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
    `}};D([T({type:Object})],j.prototype,`range`,void 0),D([T({type:Number})],j.prototype,`value`,void 0),D([T({type:Number})],j.prototype,`step`,void 0),D([T({type:Number})],j.prototype,`angle`,void 0),D([T({type:String})],j.prototype,`label`,void 0),j=D([w(`knob-element`)],j);var mt=class extends C{constructor(...e){super(...e),this.label=``}render(){return v`
      <div class="wrapper">
          <label>${this.label}</label>
          <div class="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `}static get styles(){return o`
      .wrapper {
        position: relative;

        width: var(--panel-wrapper-width, 100%);
        height: var(--panel-wrapper-width, 100%);

        background-color: var(--panel-wrapper-background-color, transparent);

        border-radius: 0.5rem;

        padding: 0.25em;

        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      label {
        display: block;
        color: var(--panel-wrapper-label-color, white);
        margin: 0 auto 0.5em auto;
        text-align: center;
      }
    `}};D([T({type:String})],mt.prototype,`label`,void 0),mt=D([w(`panel-wrapper-element`)],mt);var ht=class{constructor(e){this.currentOption=0,this.options=e,this.map=e.map.bind(e)}get size(){return this.options.length}set index(e){this.currentOption=e-1,this.next()}get index(){return this.currentOption}selectValue(e){let t=this.options.findIndex(t=>t.value===e);t>-1&&(this.currentOption=t)}select(e){return this.currentOption=e,this}next(){return++this.currentOption>=this.options.length&&(this.currentOption=0),this}previous(){return--this.currentOption<0&&(this.currentOption=this.options.length-1),this}getCurrent(){return this.options[this.currentOption]}},M=function(e){return e[e.NONE=-1]=`NONE`,e[e.OSC1_SEMI=0]=`OSC1_SEMI`,e[e.OSC1_CENT=1]=`OSC1_CENT`,e[e.OSC1_CYCLE=2]=`OSC1_CYCLE`,e[e.OSC_MIX=3]=`OSC_MIX`,e[e.NOISE=4]=`NOISE`,e[e.OSC2_SEMI=5]=`OSC2_SEMI`,e[e.OSC2_CENT=6]=`OSC2_CENT`,e[e.OSC2_CYCLE=7]=`OSC2_CYCLE`,e[e.CUTOFF=8]=`CUTOFF`,e[e.RESONANCE=9]=`RESONANCE`,e[e.DRIVE=10]=`DRIVE`,e[e.ATTACK=11]=`ATTACK`,e[e.DECAY=12]=`DECAY`,e[e.SUSTAIN=13]=`SUSTAIN`,e[e.RELEASE=14]=`RELEASE`,e[e.LFO1_FREQ=15]=`LFO1_FREQ`,e[e.LFO1_MOD=16]=`LFO1_MOD`,e[e.LFO2_FREQ=17]=`LFO2_FREQ`,e[e.LFO2_MOD=18]=`LFO2_MOD`,e[e.CUT_MOD=19]=`CUT_MOD`,e[e.CUT_VEL=20]=`CUT_VEL`,e[e.CUT_ATTACK=21]=`CUT_ATTACK`,e[e.CUT_DECAY=22]=`CUT_DECAY`,e}({});function N(e){return{name:M[e].replace(/_/g,` `),value:e}}var gt=new ht([N(0),N(1),N(2),N(3),N(4),N(5),N(6),N(7),N(11),N(12),N(13),N(14),N(8),N(9),N(10),N(19),N(20),N(21),N(22),N(15),N(16),N(17),N(18)]),P=class extends C{constructor(){super(),this.label=`Osc`,this.currentLearnerID=M.NONE,this.semiControlID=M.OSC1_SEMI,this.centControlID=M.OSC1_CENT,this.cycleControlID=M.OSC1_CYCLE,this.cycleRange={min:5,max:122}}connectedCallback(){super.connectedCallback()}onSemiShift(e){this.dispatchChange(A.SEMI_SHIFT,e.detail.value)}get semiShiftValue(){return this.state.semiShift.value}onCentShift(e){this.dispatchChange(A.CENT_SHIFT,e.detail.value)}get centShiftValue(){return this.state.centShift.value}onCycleChange(e){this.dispatchChange(A.CYCLE,e.detail.value)}get cycleValue(){return this.state.cycle.value}onWaveFormChange(e){this.dispatchChange(A.WAVE_FORM,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return v`
      <panel-wrapper-element label=${this.label}>
        <div class="oscillator-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value}
              @change=${this.onWaveFormChange}
            ></wave-selector-element>
          </div>
          <div class="tone-controls">
            <div class="shift-control">
              <div class="knob-control semi-shift-control">
                <midi-control-wrapper
                  controlID=${this.semiControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.semiShiftValue}
                    @change=${this.onSemiShift}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>semi</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cent-shift-control cent">
                <midi-control-wrapper
                  controlID=${this.centControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.centShiftValue}
                    @change=${this.onCentShift}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>cents</label>
            </div>
            <div class="shift-control">
              <div class="knob-control cycle-shift-control cycle">
                <midi-control-wrapper
                  controlID=${this.cycleControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .range=${this.cycleRange}
                    .value=${this.cycleValue}
                    @change=${this.onCycleChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>cycle</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return o`
      :host {
        --panel-wrapper-background-color: var(--oscillator-panel-color);
      }

      .oscillator-controls {
        position: relative;

        width: 160px;
        height: 120px;
      }

      .oscillator-controls .tone-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .oscillator-controls .tone-controls .shift-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .oscillator-controls .tone-controls .knob-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;
      }

      .oscillator-controls .tone-controls .semi-shift-control {
        --knob-size: 50px;
      }

      .oscillator-controls .tone-controls .cent-shift-control {
        --knob-size: 40px;
      }

      .oscillator-controls .tone-controls .cycle-shift-control {
        --knob-size: 35px;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
      }
    `}};D([T({type:String})],P.prototype,`label`,void 0),D([T({type:Object})],P.prototype,`state`,void 0),D([T({type:Number})],P.prototype,`currentLearnerID`,void 0),D([T({type:Number})],P.prototype,`semiControlID`,void 0),D([T({type:Number})],P.prototype,`centControlID`,void 0),D([T({type:Number})],P.prototype,`cycleControlID`,void 0),P=D([w(`oscillator-element`)],P);var F=class extends C{constructor(...e){super(...e),this.currentLearnerID=M.NONE}render(){return v`
        <panel-wrapper-element class="oscillator-mix">
            <div class="oscillator-mix-control">
                <midi-control-wrapper
                .controlID=${M.OSC_MIX}
                .currentLearnerID=${this.currentLearnerID}
                >
                <knob-element
                    class="mix"
                    label="mix"
                    .value=${this.mix.value}
                    @change=${this.onMixChange}
                ></knob-element>
                </midi-control-wrapper>
                <midi-control-wrapper
                .controlID=${M.NOISE}
                .currentLearnerID=${this.currentLearnerID}
                >
                <knob-element
                    class="noise"
                    label="noise"
                    .value=${this.noise.value}
                    @change=${this.onNoiseChange}
                ></knob-element>
                </midi-control-wrapper>
            </div>
            <div class="noise-control">
                
            </div>
        </panel-wrapper-element>
    `}onMixChange(e){this.dispatchChange(A.MIX,e.detail.value)}onNoiseChange(e){this.dispatchChange(A.NOISE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}static get styles(){return o`
      .oscillator-mix {
        --panel-wrapper-background-color: var(--oscillator-mix-panel-color);

      }

      .oscillator-mix-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;

        width: 60px; 
        height: 130px;
      }

      .oscillator-mix .mix {
        --knob-size: 40px;
      }

      .oscillator-mix .noise {
        --knob-size: 30px;
      }     
    `}};D([T({type:Number})],F.prototype,`currentLearnerID`,void 0),D([T({type:Object})],F.prototype,`mix`,void 0),D([T({type:Object})],F.prototype,`noise`,void 0),F=D([w(`oscillator-mix-element`)],F);var I=function(e){return e[e.MODE=0]=`MODE`,e[e.CUTOFF=1]=`CUTOFF`,e[e.RESONANCE=2]=`RESONANCE`,e[e.DRIVE=3]=`DRIVE`,e}({}),_t=class extends C{constructor(...e){super(...e),this.currentLearnerID=M.NONE}get hasFocus(){return this.currentLearnerID===this.controlID}render(){return v`
      <div class="${this.computeClassMap()}">
        <slot></slot>
      </div>
    `}computeClassMap(){return E({wrapper:!0,focus:this.hasFocus})}static get styles(){return o`
      .wrapper.focus {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: var(--control-hander-color-focused);  
        }
      }
    `}};D([T({type:Number})],_t.prototype,`controlID`,void 0),D([T({type:Number})],_t.prototype,`currentLearnerID`,void 0),_t=D([w(`midi-control-wrapper`)],_t);var L=function(e){return e[e.LOWPASS=0]=`LOWPASS`,e[e.LOWPASS_PLUS=1]=`LOWPASS_PLUS`,e[e.BANDPASS=2]=`BANDPASS`,e[e.HIGHPASS=3]=`HIGHPASS`,e}({}),vt=class extends C{constructor(...e){super(...e),this.value=L.LOWPASS}async onLpSelect(){this.value=L.LOWPASS,this.dispatchSelect()}async onLpPlusSelect(){this.value=L.LOWPASS_PLUS,this.dispatchSelect()}async onBpSelect(){this.value=L.BANDPASS,this.dispatchSelect()}async onHpSelect(){this.value=L.HIGHPASS,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return v`
      <div class="filter-selector">
        <button
          class="${this.computeButtonClasses(L.LOWPASS_PLUS)}"
          @click=${this.onLpPlusSelect}
        >
          L+
        </button>
        <button
          class="${this.computeButtonClasses(L.LOWPASS)}"
          @click=${this.onLpSelect}
        >
          LP
        </button>
        <button
          class="${this.computeButtonClasses(L.BANDPASS)}"
          @click=${this.onBpSelect}
        >
          BP
        </button>
        <button
          class="${this.computeButtonClasses(L.HIGHPASS)}"
          @click=${this.onHpSelect}
        >
          HP
        </button>
      </div>
    `}computeButtonClasses(e){return E({active:e===this.value})}static get styles(){return o`
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
    `}};D([T({type:Number})],vt.prototype,`value`,void 0),vt=D([w(`filter-selector-element`)],vt);var yt=class extends C{constructor(...e){super(...e),this.currentLearnerID=M.NONE}onCutoffChange(e){this.dispatchChange(I.CUTOFF,e.detail.value)}onResonanceChange(e){this.dispatchChange(I.RESONANCE,e.detail.value)}onDriveChange(e){this.dispatchChange(I.DRIVE,e.detail.value)}onTypeChange(e){this.dispatchChange(I.MODE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return v`
      <panel-wrapper-element label="Filter">
        <div class="filter-controls">
          <div class="mode-control">
            <filter-selector-element
              .value=${this.state.mode.value}
              @change=${this.onTypeChange}
            ></filter-selector-element>
          </div>
          <div class="frequency-controls">
            <div class="frequency-control">
              <div class="knob-control cutoff-control">
                <midi-control-wrapper
                  controlID=${M.CUTOFF}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.cutoff.value}
                    @change=${this.onCutoffChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>cutoff</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control resonance-control">
                <midi-control-wrapper
                  controlID=${M.RESONANCE}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.resonance.value}
                    @change=${this.onResonanceChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>res</label>
            </div>
            <div class="frequency-control">
              <div class="knob-control drive-control">
                <midi-control-wrapper
                  controlID=${M.DRIVE}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.drive.value}
                    @change=${this.onDriveChange}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>drive</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return o`
      :host {
        --panel-wrapper-background-color: var(--filter-panel-color);
      }

      .filter-controls {
        position: relative;
        width: 160px;
        height: 120px;
      }

      .filter-controls .mode-control {
        width: 100%;
        display: block;
      }

      .filter-controls .frequency-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .filter-controls .frequency-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .filter-controls .frequency-controls .knob-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;
      }

      .frequency-control .cutoff-control {
        display: flex;
        flex-direction: row;
        align-items: center;
        --knob-size: 50px;
      }

      .frequency-control .resonance-control {
        --knob-size: 40px;
      }

      .frequency-control .drive-control {
        --knob-size: 35px;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: var(--control-label-font-size);
      }
    `}};D([T({type:Object})],yt.prototype,`state`,void 0),D([T({type:Number})],yt.prototype,`currentLearnerID`,void 0),yt=D([w(`filter-element`)],yt);var R=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.SUSTAIN=2]=`SUSTAIN`,e[e.RELEASE=3]=`RELEASE`,e}({}),bt=`important`,xt=` !important`,St=Ge(class extends Ke{constructor(e){if(super(e),e.type!==We.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(xt);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?bt:``):n[e]=r}}return y}}),Ct=class extends C{constructor(...e){super(...e),this.label=``,this.value=127}toggleActive(e){let t=this.shadowRoot.host.offsetParent,n=this.cursorWrapperElement,r=n.offsetHeight,i=e.pageY-(t.offsetTop+n.offsetTop);this.updateValue((1-i/r)*127);let a=e=>{e.preventDefault(),this.updateValue(this.value-e.movementY)},o=()=>{document.removeEventListener(`mouseup`,o),document.removeEventListener(`mousemove`,a)};document.addEventListener(`mousemove`,a),document.addEventListener(`mouseup`,o)}onWheel(e){e.preventDefault(),this.updateValue(this.value+e.deltaY)}updateValue(e){this.value=ut({min:0,max:127},e),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}computeFaderCursorStyle(){return St({height:`${this.value/127*100}%`})}get cursorElement(){return v` <div
      class="fader-cursor"
      style="${this.computeFaderCursorStyle()}"
    ></div>`}get cursorWrapperElement(){return this.shadowRoot.querySelector(`.cursor-wrapper`)}render(){return v`
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
    `}static get styles(){return o`
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
    `}};D([T({type:String})],Ct.prototype,`label`,void 0),D([T({type:Number})],Ct.prototype,`value`,void 0),Ct=D([w(`fader-element`)],Ct);var z=class extends C{constructor(...e){super(...e),this.label=`Envelope`,this.currentLearnerID=M.NONE}onAttackChange(e){this.dispatchChange(R.ATTACK,e.detail.value)}onDecayChange(e){this.dispatchChange(R.DECAY,e.detail.value)}onSustainChange(e){this.dispatchChange(R.SUSTAIN,e.detail.value)}onReleaseChange(e){this.dispatchChange(R.RELEASE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return v`
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <midi-control-wrapper
            .controlID=${M.ATTACK}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control focus"
              label="A"
              .value=${this.state.attack.value}
              @change=${this.onAttackChange}
            ></fader-element>
          </midi-control-wrapper>
          <midi-control-wrapper
            .controlID=${M.DECAY}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control"
              label="D"
              .value=${this.state.decay.value}
              @change=${this.onDecayChange}
            ></fader-element>
          </midi-control-wrapper>
          <midi-control-wrapper
            .controlID=${M.SUSTAIN}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control"
              label="S"
              .value=${this.state.sustain.value}
              @change=${this.onSustainChange}
            ></fader-element>
          </midi-control-wrapper>
          <midi-control-wrapper
            .controlID=${M.RELEASE}
            .currentLearnerID=${this.currentLearnerID}
          >
            <fader-element
              class="envelope-control"
              label="R"
              .value=${this.state.release.value}
              @change=${this.onReleaseChange}
            ></fader-element>
          </midi-control-wrapper>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return o`
      :host {
        --panel-wrapper-background-color: var(--envelope-panel-color);
        --fader-height: 120px;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;

        width: 160px;
        height: 160px;
      }
    `}};D([T({type:String})],z.prototype,`label`,void 0),D([T({type:Object})],z.prototype,`state`,void 0),D([T({type:Number})],z.prototype,`currentLearnerID`,void 0),z=D([w(`envelope-element`)],z);var B=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.AMOUNT=2]=`AMOUNT`,e[e.VELOCITY=3]=`VELOCITY`,e}({}),wt=class extends C{constructor(...e){super(...e),this.currentLearnerID=M.NONE}onAttackChange(e){this.dispatchChange(B.ATTACK,e.detail.value)}onDecayChange(e){this.dispatchChange(B.DECAY,e.detail.value)}onAmountChange(e){this.dispatchChange(B.AMOUNT,e.detail.value)}onVelocityChange(e){this.dispatchChange(B.VELOCITY,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return v`
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <midi-control-wrapper
              controlID=${M.CUT_ATTACK}
              currentLearnerID=${this.currentLearnerID}
            >
              <fader-element
                label="A"
                .value=${this.state.attack.value}
                @change=${this.onAttackChange}
              ></fader-element>
            </midi-control-wrapper>
            <midi-control-wrapper
              controlID=${M.CUT_DECAY}
              currentLearnerID=${this.currentLearnerID}
            >
              <fader-element
                label="D"
                .value=${this.state.decay.value}
                @change=${this.onDecayChange}
              ></fader-element>
            </midi-control-wrapper>
          </div>
          <div class="mod-controls">
            <div class="mod-control mod">
              <midi-control-wrapper
                controlID=${M.CUT_MOD}
                currentLearnerID=${this.currentLearnerID}
              >
                <knob-element
                  label="mod"
                  .value=${this.state.amount.value}
                  @change=${this.onAmountChange}
                ></knob-element>
              </midi-control-wrapper>
            </div>
            <div class="mod-control velocity">
              <midi-control-wrapper
                controlID=${M.CUT_VEL}
                currentLearnerID=${this.currentLearnerID}
              >
                <knob-element
                  label="vel"
                  .value=${this.state.velocity.value}
                  @change=${this.onVelocityChange}
                ></knob-element>
              </midi-control-wrapper>
            </div>
          </div>
          
        </div>
      </panel-wrapper-element>
    `}static get styles(){return o`
      :host {
        --panel-wrapper-background-color: var(--filter-mod-panel-color);
        --fader-height: 120px;
        --knob-size: 50px;
      }

      .envelope-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;
        width: 130px;
        height: 160px;
      }

      .envelope-controls .time-controls {
        display: flex;
        align-items: center;
        justify-content: space-evenly;

        width: 60%;
      }

      .envelope-controls .mod-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 70%;

      }

      .envelope-controls .mod-controls .mod {
        --knob-size: 40px;
      }

      .envelope-controls .mod-controls .velocity {
        --knob-size: 25px;
      }
    `}};D([T({type:Object})],wt.prototype,`state`,void 0),D([T({type:Number})],wt.prototype,`currentLearnerID`,void 0),wt=D([w(`filter-envelope-element`)],wt);var V=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.FREQUENCY=1]=`FREQUENCY`,e[e.MOD_AMOUNT=2]=`MOD_AMOUNT`,e[e.DESTINATION=3]=`DESTINATION`,e}({}),H=!0,U=!1,Tt={A:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,H,H,H,H],[H,U,U,U,H],[H,U,U,U,H]],B:[[H,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,H,H,H,U]],C:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,H],[U,H,H,H,U]],D:[[H,H,H,U,U],[H,U,U,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,H,U],[H,H,H,U,U]],E:[[H,H,H,H,H],[H,U,U,U,U],[H,U,U,U,U],[H,H,H,H,U],[H,U,U,U,U],[H,U,U,U,U],[H,H,H,H,H]],F:[[H,H,H,H,H],[H,U,U,U,U],[H,U,U,U,U],[H,H,H,H,U],[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,U]],G:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,U],[H,U,H,H,H],[H,U,U,U,H],[H,U,U,U,H],[U,H,H,H,H]],H:[[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,H,H,H,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H]],I:[[U,H,H,H,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,H,H,H,U]],J:[[U,U,H,H,H],[U,U,U,H,U],[U,U,U,H,U],[U,U,U,H,U],[U,U,U,H,U],[H,U,U,H,U],[U,H,H,U,U]],K:[[H,U,U,U,H],[H,U,U,H,U],[H,U,H,U,U],[H,H,U,U,U],[H,U,H,U,U],[H,U,U,H,U],[H,U,U,U,H]],L:[[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,U],[H,H,H,H,H]],M:[[H,U,U,U,H],[H,H,U,H,H],[H,U,H,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H]],N:[[H,U,U,U,H],[H,U,U,U,H],[H,H,U,U,H],[H,U,H,U,H],[H,U,U,H,H],[H,U,U,U,H],[H,U,U,U,H]],O:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[U,H,H,H,U]],P:[[H,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,H,H,H,U],[H,U,U,U,U],[H,U,U,U,U],[H,U,U,U,U]],Q:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,H,U,H],[H,U,U,H,U],[U,H,H,U,H]],R:[[H,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,H,H,H,U],[H,U,H,U,U],[H,U,U,H,U],[H,U,U,U,H]],S:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,U],[U,H,H,H,U],[U,U,U,U,H],[H,U,U,U,H],[U,H,H,H,U]],T:[[H,H,H,H,H],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U]],U:[[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[U,H,H,H,U]],V:[[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[U,H,U,H,U],[U,U,H,U,U]],W:[[H,U,U,U,H],[H,U,U,U,H],[H,U,U,U,H],[H,U,H,U,H],[H,U,H,U,H],[H,U,H,U,H],[U,H,U,H,U]],X:[[H,U,U,U,H],[H,U,U,U,H],[U,H,U,H,U],[U,U,H,U,U],[U,H,U,H,U],[H,U,U,U,H],[H,U,U,U,H]],Y:[[H,U,U,U,H],[H,U,U,U,H],[U,H,U,H,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,H,U,U]],Z:[[H,H,H,H,H],[U,U,U,U,H],[U,U,U,H,U],[U,U,H,U,U],[U,H,U,U,U],[H,U,U,U,U],[H,H,H,H,H]],0:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,H,H],[H,U,H,U,H],[H,H,U,U,H],[H,U,U,U,H],[U,H,H,H,U]],1:[[U,U,H,H,U],[U,H,U,H,U],[H,U,U,H,U],[U,U,U,H,U],[U,U,U,H,U],[U,U,U,H,U],[U,U,U,H,U]],2:[[U,H,H,H,U],[H,U,U,U,H],[U,U,U,U,H],[U,U,H,H,U],[U,H,U,U,U],[H,U,U,U,U],[H,H,H,H,H]],3:[[U,H,H,H,U],[H,U,U,U,H],[U,U,U,U,H],[U,U,H,H,U],[U,U,U,U,H],[H,U,U,U,H],[U,H,H,H,U]],4:[[U,U,H,H,U],[U,H,U,H,U],[H,U,U,H,U],[H,U,U,H,U],[H,H,H,H,H],[U,U,U,H,U],[U,U,U,H,U]],5:[[H,H,H,H,H],[H,U,U,U,U],[H,U,U,U,U],[U,H,H,H,U],[U,U,U,U,H],[U,U,U,U,H],[H,H,H,H,U]],6:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,U],[H,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[U,H,H,H,U]],7:[[H,H,H,H,H],[U,U,U,U,H],[U,U,U,H,U],[U,U,H,U,U],[U,H,U,U,U],[U,H,U,U,U],[U,H,U,U,U]],8:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[U,H,H,H,U]],9:[[U,H,H,H,U],[H,U,U,U,H],[H,U,U,U,H],[H,H,H,H,H],[U,U,U,U,H],[U,U,U,U,H],[H,H,H,H,U]]," ":[[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U]],_:[[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[H,H,H,H,H]],":":[[U,U,U,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,U,U,U],[U,U,H,U,U],[U,U,H,U,U],[U,U,U,U,U]],".":[[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,U,U,U],[U,U,H,U,U],[U,U,H,U,U]]},Et=class extends C{render(){return v`
      <div class="lcd-char">
        ${this.char.map(e=>this.createLedRow(e))}
      </div>
    `}createLedRow(e){return v`
      <div class="led-row">
        ${e.map(e=>this.createLed(e))}
      </div>
    `}createLed(e){return e?v`<div class="led on"></div>`:v`<div class="led"></div>`}static get styles(){return o`
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
    `}};D([T({type:Array})],Et.prototype,`char`,void 0),Et=D([w(`lcd-char-element`)],Et);var Dt=class extends C{render(){return v`
      <div class="lcd">
        ${Array.from(this.text).map(this.createLcdChar)}
      </div>
    `}createLcdChar(e){return v`
      <lcd-char-element .char=${Tt[e]} class="char"></lcd-char-element>
    `}static get styles(){return o`
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
    `}};D([T({type:String})],Dt.prototype,`text`,void 0),Dt=D([w(`lcd-element`)],Dt);var Ot=class extends C{render(){return v`
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">${this.options.map(this.createOptionSelector.bind(this))}</div>
      </div>
    `}async connectedCallback(){super.connectedCallback(),this.options.selectValue(this.value)}createOptionSelector(e,t){return v`
      <button @click=${this.createOptionHandler(t)} class="${this.computeButtonClasses(t)}">${t}</button>
    `}computeButtonClasses(e){return E({active:this.options.index===e})}createOptionHandler(e){return()=>{this.options.index=e,this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}}nextOption(){this.options.next(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}previousOption(){this.options.previous(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}dispatchChange({value:e}){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}}))}static get styles(){return o`
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
    `}};D([T({type:Object})],Ot.prototype,`options`,void 0),D([T({type:Object})],Ot.prototype,`value`,void 0),Ot=D([w(`lcd-selector-element`)],Ot);var kt=function(e){return e[e.FREQUENCY=0]=`FREQUENCY`,e[e.OSCILLATOR_MIX=1]=`OSCILLATOR_MIX`,e[e.CUTOFF=2]=`CUTOFF`,e[e.RESONANCE=3]=`RESONANCE`,e[e.OSC1_CYCLE=4]=`OSC1_CYCLE`,e[e.OSC2_CYCLE=5]=`OSC2_CYCLE`,e}({}),W=class extends C{constructor(...e){super(...e),this.label=`LFO`,this.destinations=new ht([{value:kt.OSCILLATOR_MIX,name:`OSC MIX`},{value:kt.FREQUENCY,name:`FREQUENCY`},{value:kt.CUTOFF,name:`CUTOFF`},{value:kt.OSC1_CYCLE,name:`OSC1 CYCLE`},{value:kt.OSC2_CYCLE,name:`OSC2 CYCLE`}]),this.shouldMidiLearn=!1,this.currentLearnerID=M.NONE,this.frequencyControlID=M.LFO1_FREQ,this.modAmountControlID=M.LFO1_MOD}onFrequencyChange(e){this.dispatchChange(V.FREQUENCY,e.detail.value)}onModAmountChange(e){this.dispatchChange(V.MOD_AMOUNT,e.detail.value)}onWaveFormChange(e){this.dispatchChange(V.WAVE_FORM,e.detail.value)}onDestinationChange(e){this.dispatchChange(V.DESTINATION,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return v`
      <panel-wrapper-element label=${this.label}>
        <div class="lfo-controls">
          <div class="wave-control">
            <wave-selector-element
              .value=${this.state.mode.value}
              @change=${this.onWaveFormChange}
            ></wave-selector-element>
          </div>
          <div class="destination-control">
            <lcd-selector-element
              .options=${this.destinations}
              .value=${this.state.destination.value}
              @change=${this.onDestinationChange}
            ></lcd-selector-element>
          </div>
          <div class="modulation-controls">
            <div class="modulation-control">
              <div class="frequency-control">
                <midi-control-wrapper
                  controlID=${this.frequencyControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.frequency.value}
                    @change=${this.onFrequencyChange}
                    .shouldMidiLearn=${this.shouldMidiLearn}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>freq</label>
            </div>
            <div class="modulation-control">
              <div class="mod-amount-control">
                <midi-control-wrapper
                  controlID=${this.modAmountControlID}
                  currentLearnerID=${this.currentLearnerID}
                >
                  <knob-element
                    .value=${this.state.modAmount.value}
                    @change=${this.onModAmountChange}
                    .shouldMidiLearn=${this.shouldMidiLearn}
                  ></knob-element>
                </midi-control-wrapper>
              </div>
              <label>mod.</label>
            </div>
          </div>
        </div>
      </panel-wrapper-element>
    `}static get styles(){return o`
      :host {
        --panel-wrapper-background-color: var(--lfo-panel-color);
      }

      .lfo-controls {
        position: relative;
        width: 130px;
        height: 160px;
      }

      .lfo-controls .destination-control {
        margin: 10px auto 10px auto;
      }

      .lfo-controls .modulation-controls {
        display: flex;
        justify-content: space-around;
        width: 100%;
        margin-top: 1em;
      }

      .lfo-controls .modulation-controls .modulation-control {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .lfo-controls .modulation-controls .frequency-control {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 100%;
        height: 90%;

        --knob-size: 40px;
      }

      .lfo-controls .modulation-controls .mod-amount-control {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 100%;
        height: 90%;
        --knob-size: 40px;
      }

      label {
        display: block;
        color: var(--control-label-color);
        font-size: 0.8em;
      }
    `}};D([T({type:String})],W.prototype,`label`,void 0),D([T({type:Object})],W.prototype,`state`,void 0),D([T({type:Boolean})],W.prototype,`shouldMidiLearn`,void 0),D([T({type:Number})],W.prototype,`currentLearnerID`,void 0),D([T({type:Number})],W.prototype,`frequencyControlID`,void 0),D([T({type:Number})],W.prototype,`modAmountControlID`,void 0),W=D([w(`lfo-element`)],W);function At(e,t){return Array.from({length:t}).map((t,n)=>e(n))}function jt(e){return`CHANNEL:${e<10?`0${e}`:`${e}`}`}function Mt(e,t=jt(e+1)){return{value:e,name:t}}var Nt=At(Mt,16);Nt.unshift(Mt(-1,`CHANNEL:ALL`));var Pt=new ht(Nt),G=function(e){return e[e.MIDI_LEARN=0]=`MIDI_LEARN`,e[e.MIDI_CHANNEL=1]=`MIDI_CHANNEL`,e[e.PRESET=2]=`PRESET`,e}({}),Ft=new ht([{name:`SAWSEESS`,value:{osc1:{mode:{value:1},semiShift:{id:0,value:31.75,controller:-1},centShift:{id:1,value:63.5,controller:-1},cycle:{id:2,value:63.5,controller:-1}},osc2:{mode:{value:1},semiShift:{id:5,value:63.5,controller:-1},centShift:{id:6,value:84.66666666666666,controller:-1},cycle:{id:7,value:63.5,controller:-1}},osc2Amplitude:{id:3,value:24,controller:21},noiseLevel:{id:4,value:0,controller:-1},envelope:{attack:{id:11,value:0,controller:-1},decay:{id:12,value:34.925000000000004,controller:-1},sustain:{id:13,value:0,controller:-1},release:{id:14,value:0,controller:-1}},filter:{mode:{value:0},cutoff:{id:8,value:0,controller:14},resonance:{id:9,value:127,controller:15},drive:{id:10,value:34,controller:16}},cutoffMod:{attack:{id:21,value:0,controller:19},decay:{id:22,value:9,controller:20},amount:{id:19,value:21,controller:17},velocity:{id:20,value:21,controller:18}},lfo1:{mode:{value:2},destination:{value:0},frequency:{id:15,value:15.875,controller:-1},modAmount:{id:16,value:0,controller:-1}},lfo2:{mode:{value:2},destination:{value:2},frequency:{id:17,value:31.75,controller:-1},modAmount:{id:18,value:0,controller:-1}}}},{name:`GLAZZQON`,value:{osc1:{mode:{value:2},semiShift:{id:0,value:63.5,controller:-1},centShift:{id:1,value:63.5,controller:-1},cycle:{id:2,value:50.8,controller:-1}},osc2:{mode:{value:2},semiShift:{id:5,value:127,controller:-1},centShift:{id:6,value:76.5,controller:-1},cycle:{id:7,value:73.66666666666667,controller:-1}},osc2Amplitude:{id:3,value:0,controller:21},noiseLevel:{id:4,value:0,controller:-1},envelope:{attack:{id:11,value:0,controller:19},decay:{id:12,value:2.1166666666666734,controller:-1},sustain:{id:13,value:40,controller:19},release:{id:14,value:105,controller:20}},filter:{mode:{value:0},cutoff:{id:8,value:127,controller:14},resonance:{id:9,value:0,controller:15},drive:{id:10,value:0,controller:16}},cutoffMod:{attack:{id:21,value:0,controller:-1},decay:{id:22,value:35,controller:18},amount:{id:19,value:0,controller:17},velocity:{id:20,value:0,controller:18}},lfo1:{mode:{value:0},destination:{value:4},frequency:{id:15,value:44.875,controller:-1},modAmount:{id:16,value:0,controller:-1}},lfo2:{mode:{value:0},destination:{value:5},frequency:{id:17,value:56.75,controller:-1},modAmount:{id:18,value:12,controller:-1}}}}]),It=class extends C{constructor(...e){super(...e),this.mode=G.PRESET}render(){return v`
      <div class="menu">
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(G.PRESET)}"
            @click=${this.createSwitchModeHandler(G.PRESET)}
          >
            PRESET
          </button>
        </div>
        <div class="button-wrapper channel">
          <button
            class="${this.computeButtonClasses(G.MIDI_CHANNEL)}"
            @click=${this.createSwitchModeHandler(G.MIDI_CHANNEL)}
          >
            CHANNEL
          </button>
        </div>
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(G.MIDI_LEARN)}"
            @click=${this.createSwitchModeHandler(G.MIDI_LEARN)}
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
    `}computeButtonClasses(e){return E({active:this.mode===e})}createSwitchModeHandler(e){switch(e){case G.MIDI_CHANNEL:return()=>{this.mode=G.MIDI_CHANNEL,this.dispatchChange()};case G.MIDI_LEARN:return()=>{this.mode=G.MIDI_LEARN,this.dispatchChange()};case G.PRESET:return()=>{this.mode=G.PRESET,this.dispatchChange()}}}nextOption(){this.options.next(),this.dispatchChange(!0),this.requestUpdate()}previousOption(){this.options.previous(),this.dispatchChange(!0),this.requestUpdate()}dispatchChange(e=!1){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:this.mode,option:this.options.getCurrent(),shouldUpdate:e}}))}get options(){switch(this.mode){case G.PRESET:return Ft;case G.MIDI_CHANNEL:return Pt;case G.MIDI_LEARN:default:return gt}}static get styles(){return o`
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

      .menu .button-wrapper button:focus {
        outline: none;
      }

      .menu .button-wrapper button.active {
        background-color: var(--button-active-background-color);
        border: 1px solid transparent;
        color: var(--button-active-label-color);
        box-shadow: var(--box-shadow);
        transition: all 0.1s ease-in-out;
        cursor: auto;
      }

      .menu .button-wrapper.channel {
        margin: 0 1px;
      }

      .menu .button-wrapper.select {
        margin: 0 1px;
      }

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
        margin-left: 0.5em;
        letter-spacing: 0.1em;
      }
    `}};D([T({type:Number})],It.prototype,`mode`,void 0),It=D([w(`menu-element`)],It);var K=Object.freeze({TRUE:1,FALSE:0}),Lt=Object.freeze({DISPOSED:0,STARTED:1,STOPPING:2,STOPPED:3}),Rt=Object.freeze({SINE:0,SAWTOOTH:1,SQUARE:2,TRIANGLE:3}),zt=Object.freeze({LOWPASS:0,LOWPASS_PLUS:1,BANDPASS:2,HIGHPASS:3}),q=Object.freeze({FREQUENCY:0,OSCILLATOR_MIX:1,CUTOFF:2,RESONANCE:3,OSC1_CYCLE:4,OSC2_CYCLE:5});Lt.DISPOSED,Lt.DISPOSED,Lt.STOPPED,Rt.SINE,K.SINE,K.TRIANGLE,Rt.SINE,K.SINE,K.TRIANGLE,Rt.SINE,K.SINE,K.TRIANGLE,Rt.SINE,K.SINE,K.TRIANGLE,q.OSCILLATOR_MIX,q.FREQUENCY,q.OSC_2_CYCLE,q.CUTOFF,q.FREQUENCY,q.OSC_2_CYCLE,zt.LOWPASS,zt.LOWPASS,zt.HIGHPASS;var Bt=[],Vt=[];for(let e of[{name:`frequency`,defaultValue:440,minValue:0,maxValue:16744,automationRate:`a-rate`},{name:`amplitude`,defaultValue:.5,minValue:0,maxValue:1,automationRate:`a-rate`},{name:`amplitudeAttack`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`amplitudeDecay`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`amplitudeSustain`,defaultValue:.5,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`amplitudeRelease`,defaultValue:.5,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`cutoff`,defaultValue:0,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`resonance`,defaultValue:0,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`drive`,defaultValue:0,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`cutoffAttack`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`cutoffDecay`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`cutoffEnvelopeAmount`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`cutoffEnvelopeVelocity`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`osc1SemiShift`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`osc1CentShift`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`osc1Cycle`,defaultValue:127/2,minValue:5,maxValue:122,automationRate:`k-rate`},{name:`osc2SemiShift`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`osc2CentShift`,defaultValue:0,minValue:0,maxValue:127,automationRate:`k-rate`},{name:`osc2Cycle`,defaultValue:127/2,minValue:5,maxValue:122,automationRate:`k-rate`},{name:`osc2Amplitude`,defaultValue:127/2,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`noiseLevel`,defaultValue:0,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`lfo1Frequency`,defaultValue:127,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`lfo1ModAmount`,defaultValue:127,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`lfo2Frequency`,defaultValue:127,minValue:0,maxValue:127,automationRate:`a-rate`},{name:`lfo2ModAmount`,defaultValue:127,minValue:0,maxValue:127,automationRate:`a-rate`}])e.automationRate===`a-rate`?Bt.push(e):Vt.push(e);var Ht=class extends AudioWorkletNode{constructor(e){super(e,`voice`),this.params=this.parameters}start(){this.params.get(`state`).value=Lt.STARTED}stop(){this.params.get(`state`).value=Lt.STOPPED}get frequency(){return this.params.get(`frequency`)}get velocity(){return this.params.get(`velocity`)}get amplitude(){return this.params.get(`amplitude`)}get amplitudeAttack(){return this.params.get(`amplitudeAttack`)}get amplitudeDecay(){return this.params.get(`amplitudeDecay`)}get amplitudeSustain(){return this.params.get(`amplitudeSustain`)}get amplitudeRelease(){return this.params.get(`amplitudeRelease`)}get cutoff(){return this.params.get(`cutoff`)}get resonance(){return this.params.get(`resonance`)}get drive(){return this.params.get(`drive`)}get cutoffEnvelopeAmount(){return this.params.get(`cutoffEnvelopeAmount`)}get cutoffEnvelopeVelocity(){return this.params.get(`cutoffEnvelopeVelocity`)}get cutoffAttack(){return this.params.get(`cutoffAttack`)}get cutoffDecay(){return this.params.get(`cutoffDecay`)}get osc1SemiShift(){return this.params.get(`osc1SemiShift`)}get osc1CentShift(){return this.params.get(`osc1CentShift`)}get osc1Cycle(){return this.params.get(`osc1Cycle`)}get osc2SemiShift(){return this.params.get(`osc2SemiShift`)}get osc2CentShift(){return this.params.get(`osc2CentShift`)}get osc2Cycle(){return this.params.get(`osc2Cycle`)}get osc2Amplitude(){return this.params.get(`osc2Amplitude`)}get noiseLevel(){return this.params.get(`noiseLevel`)}get osc1(){return this.params.get(`osc1`)}get osc2(){return this.params.get(`osc2`)}get filterMode(){return this.params.get(`filterMode`)}get lfo1Frequency(){return this.params.get(`lfo1Frequency`)}get lfo1ModAmount(){return this.params.get(`lfo1ModAmount`)}get lfo1Mode(){return this.params.get(`lfo1Mode`)}get lfo1Destination(){return this.params.get(`lfo1Destination`)}get lfo2Frequency(){return this.params.get(`lfo2Frequency`)}get lfo2ModAmount(){return this.params.get(`lfo2ModAmount`)}get lfo2Mode(){return this.params.get(`lfo2Mode`)}get lfo2Destination(){return this.params.get(`lfo2Destination`)}},J=class{constructor(e){this.value=e,this.clone=this.clone.bind(this)}clone(){return{...this}}},Y=class{constructor(e,t,n=-1){this.id=e,this.value=t,this.controller=n,this.clone=this.clone.bind(this)}clone(){return{...this}}};function Ut(e){let t=[];for(let n of Object.values(e))n instanceof Y?t.push([n.id,n]):n instanceof Object&&t.push(...Ut(n));return t}function Wt(e){let t=Ut(e);return new Map(t)}function Gt(e){return{osc1:{mode:new J(e.osc1.mode.value),semiShift:new Y(M.OSC1_SEMI,e.osc1.semiShift.value,e.osc1.semiShift.controller),centShift:new Y(M.OSC1_CENT,e.osc1.centShift.value,e.osc1.centShift.controller),cycle:new Y(M.OSC1_CYCLE,e.osc1.cycle.value,e.osc1.cycle.controller)},osc2:{mode:new J(e.osc2.mode.value),semiShift:new Y(M.OSC2_SEMI,e.osc2.semiShift.value,e.osc2.semiShift.controller),centShift:new Y(M.OSC2_CENT,e.osc2.centShift.value,e.osc2.centShift.controller),cycle:new Y(M.OSC2_CYCLE,e.osc2.cycle.value,e.osc2.cycle.controller)},osc2Amplitude:new Y(M.OSC_MIX,e.osc2Amplitude.value,e.osc2Amplitude.controller),noiseLevel:new Y(M.NOISE,e.noiseLevel.value,e.noiseLevel.controller),envelope:{attack:new Y(M.ATTACK,e.envelope.attack.value,e.envelope.attack.controller),decay:new Y(M.DECAY,e.envelope.decay.value,e.envelope.decay.controller),sustain:new Y(M.SUSTAIN,e.envelope.sustain.value,e.envelope.sustain.controller),release:new Y(M.RELEASE,e.envelope.release.value,e.envelope.release.controller)},filter:{mode:new J(e.filter.mode.value),cutoff:new Y(M.CUTOFF,e.filter.cutoff.value,e.filter.cutoff.controller),resonance:new Y(M.RESONANCE,e.filter.resonance.value,e.filter.resonance.controller),drive:new Y(M.DRIVE,e.filter.drive.value,e.filter.drive.controller)},cutoffMod:{attack:new Y(M.CUT_ATTACK,e.cutoffMod.attack.value,e.cutoffMod.attack.controller),decay:new Y(M.CUT_DECAY,e.cutoffMod.decay.value,e.cutoffMod.decay.controller),amount:new Y(M.CUT_MOD,e.cutoffMod.amount.value,e.cutoffMod.amount.controller),velocity:new Y(M.CUT_VEL,e.cutoffMod.velocity.value,e.cutoffMod.velocity.controller)},lfo1:{mode:new J(e.lfo1.mode.value),destination:new J(e.lfo1.destination.value),frequency:new Y(M.LFO1_FREQ,e.lfo1.frequency.value,e.lfo1.frequency.controller),modAmount:new Y(M.LFO1_MOD,e.lfo1.modAmount.value,e.lfo1.modAmount.controller)},lfo2:{mode:new J(e.lfo2.mode.value),destination:new J(e.lfo2.destination.value),frequency:new Y(M.LFO2_FREQ,e.lfo2.frequency.value,e.lfo2.frequency.controller),modAmount:new Y(M.LFO2_MOD,e.lfo2.modAmount.value,e.lfo2.modAmount.controller)}}}function Kt(e){let t=Gt(e),n=Wt(t);return Object.assign(t,{findMidiControlById(e){return n.get(e)},getMidiControls(){return n.values()}})}var qt=class extends EventTarget{constructor(...e){super(...e),this.observers=new Map}dispatch(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t})),this}subscribe(e,t){let n=e=>{t(e.detail)};return this.observers.set(t,n),this.addEventListener(e,n),this}unsubscribe(e,t){return this.removeEventListener(e,this.observers.get(t)),this.observers.delete(t),this}};new qt;var X=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e.NOTE_CHANGE=`NOTE_CHANGE`,e.CONTROL_CHANGE=`CONTROL_CHANGE`,e}({}),Z=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e.OSC1=`OSC1`,e.OSC_MIX=`OSC_MIX`,e.NOISE=`NOISE`,e.OSC2=`OSC2`,e.FILTER=`FILTER`,e.ENVELOPE=`ENVELOPE`,e.LFO1=`LFO1`,e.LFO2=`LFO2`,e.CUTOFF_MOD=`CUTOFF_MOD`,e}({}),Jt=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e}({});function*Yt(e){for(;;)yield new Ht(e)}var Xt=class extends qt{constructor(e){super(),this.voiceGenerator=Yt(e),this.voices=new Map,this.output=new GainNode(e),this.onMidiNoteOn=this.onMidiNoteOn.bind(this),this.onMidiNoteOff=this.onMidiNoteOff.bind(this),this.onMidiCC=this.onMidiCC.bind(this),this.setState(Kt(Ft.getCurrent().value))}next({frequency:e,midiValue:t,velocity:n=60}){if(this.voices.has(t))return this.voices.get(t);let r=this.voiceGenerator.next().value;return r.frequency.value=e,r.velocity.value=n,r.osc1.value=this.state.osc1.mode.value,r.osc1SemiShift.value=this.state.osc1.semiShift.value,r.osc1CentShift.value=this.state.osc1.centShift.value,r.osc1Cycle.value=this.state.osc1.cycle.value,r.osc2.value=this.state.osc2.mode.value,r.osc2SemiShift.value=this.state.osc2.semiShift.value,r.osc2CentShift.value=this.state.osc2.centShift.value,r.osc2Cycle.value=this.state.osc2.cycle.value,r.osc2Amplitude.value=this.state.osc2Amplitude.value,r.noiseLevel.value=this.state.noiseLevel.value,r.amplitudeAttack.value=this.state.envelope.attack.value,r.amplitudeDecay.value=this.state.envelope.decay.value,r.amplitudeSustain.value=this.state.envelope.sustain.value,r.amplitudeRelease.value=this.state.envelope.release.value,r.filterMode.value=this.state.filter.mode.value,r.cutoff.value=this.state.filter.cutoff.value,r.resonance.value=this.state.filter.resonance.value,r.drive.value=this.state.filter.drive.value,r.cutoffAttack.value=this.state.cutoffMod.attack.value,r.cutoffDecay.value=this.state.cutoffMod.decay.value,r.cutoffEnvelopeAmount.value=this.state.cutoffMod.amount.value,r.cutoffEnvelopeVelocity.value=this.state.cutoffMod.velocity.value,r.lfo1Frequency.value=this.state.lfo1.frequency.value,r.lfo1ModAmount.value=this.state.lfo1.modAmount.value,r.lfo1Mode.value=this.state.lfo1.mode.value,r.lfo1Destination.value=this.state.lfo1.destination.value,r.lfo2Frequency.value=this.state.lfo2.frequency.value,r.lfo2ModAmount.value=this.state.lfo2.modAmount.value,r.lfo2Mode.value=this.state.lfo2.mode.value,r.lfo2Destination.value=this.state.lfo2.destination.value,this.voices.set(t,r),r.start(),r.connect(this.output),r}setMidiController(e){return this.midiController=e.subscribe(X.NOTE_ON,this.onMidiNoteOn).subscribe(X.NOTE_OFF,this.onMidiNoteOff).subscribe(X.CONTROL_CHANGE,this.onMidiCC),this.bindMidiControls(),this}setKeyBoardcontroller(e){return e.subscribe(Jt.NOTE_ON,this.onMidiNoteOn).subscribe(Jt.NOTE_OFF,this.onMidiNoteOff),this}onMidiNoteOn(e){let t=Xe(e.data);this.next(t),this.dispatch(Z.NOTE_ON,t)}onMidiNoteOff(e){let t={midiValue:e.data.value};this.stop(t),this.dispatch(Z.NOTE_OFF,t)}onMidiCC(e){let t=this.state.findMidiControlById(e.controlID);t&&(t.controller=e.data.control,t.value=e.data.value,e.isMidiLearning&&this.midiController.mapControl(e.data.control,t.id),this.dispatchCC(t))}dispatchCC(e){switch(e.id){case M.OSC1_SEMI:return this.dispatch(Z.OSC1,{...this.state.osc1,semiShift:e.clone()});case M.OSC1_CENT:return this.dispatch(Z.OSC1,{...this.state.osc1,centShift:e.clone()});case M.OSC1_CYCLE:return this.dispatch(Z.OSC1,{...this.state.osc1,cycle:e.clone()});case M.OSC2_SEMI:return this.dispatch(Z.OSC2,{...this.state.osc2,centShift:e.clone()});case M.OSC2_CENT:return this.dispatch(Z.OSC2,{...this.state.osc2,centShift:e.clone()});case M.OSC2_CYCLE:return this.dispatch(Z.OSC2,{...this.state.osc2,cycle:e.clone()});case M.OSC_MIX:return this.dispatch(Z.OSC_MIX,e.clone());case M.NOISE:return this.dispatch(Z.NOISE,e.clone());case M.CUTOFF:return this.dispatch(Z.FILTER,{...this.state.filter,cutoff:e.clone()});case M.RESONANCE:return this.dispatch(Z.FILTER,{...this.state.filter,resonance:e.clone()});case M.DRIVE:return this.dispatch(Z.FILTER,{...this.state.filter,drive:e.clone()});case M.ATTACK:return this.dispatch(Z.ENVELOPE,{...this.state.envelope,attack:e.clone()});case M.DECAY:return this.dispatch(Z.ENVELOPE,{...this.state.envelope,decay:e.clone()});case M.SUSTAIN:return this.dispatch(Z.ENVELOPE,{...this.state.envelope,sustain:e.clone()});case M.RELEASE:return this.dispatch(Z.ENVELOPE,{...this.state.envelope,release:e.clone()});case M.LFO1_FREQ:return this.dispatch(Z.LFO1,{...this.state.lfo1,frequency:e.clone()});case M.LFO1_MOD:return this.dispatch(Z.LFO1,{...this.state.lfo1,modAmount:e.clone()});case M.LFO2_FREQ:return this.dispatch(Z.LFO2,{...this.state.lfo2,frequency:e.clone()});case M.LFO2_MOD:return this.dispatch(Z.LFO2,{...this.state.lfo2,modAmount:e.clone()});case M.CUT_ATTACK:return this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,attack:e.clone()});case M.CUT_DECAY:return this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,decay:e.clone()});case M.CUT_MOD:return this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,amount:e.clone()});case M.CUT_VEL:return this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,velocity:e.clone()})}}stop({midiValue:e}){this.voices.has(e)&&(this.voices.get(e).stop(),this.voices.delete(e))}connect(e){this.output.connect(e)}getState(){return{...this.state}}setState(e){return this.state=Kt(e),this.bindMidiControls(),this.getState()}bindMidiControls(){if(this.state&&this.midiController)for(let e of this.state.getMidiControls())this.midiController.mapControl(e.controller,e.id)}setOsc1Mode(e){return this.state.osc1.mode.value=e,this.dispatchUpdate(t=>t.osc1.value=e),this}setOsc1SemiShift(e){return this.state.osc1.semiShift.value=e,this.dispatchUpdate(t=>t.osc1SemiShift.value=e),this}setOsc1CentShift(e){return this.state.osc1.centShift.value=e,this.dispatchUpdate(t=>t.osc1CentShift.value=e),this}setOsc1Cycle(e){return this.state.osc1.cycle.value=e,this.dispatchUpdate(t=>t.osc1Cycle.value=e),this}get osc1(){return this.state.osc1}setOsc2Mode(e){return this.state.osc2.mode.value=e,this.dispatchUpdate(t=>t.osc2.value=e),this}setOsc2SemiShift(e){return this.state.osc2.semiShift.value=e,this.dispatchUpdate(t=>t.osc2SemiShift.value=e),this}setOsc2CentShift(e){return this.state.osc2.centShift.value=e,this.dispatchUpdate(t=>t.osc2CentShift.value=e),this}setOsc2Cycle(e){return this.state.osc2.cycle.value=e,this.dispatchUpdate(t=>t.osc2Cycle.value=e),this}get osc2(){return this.state.osc2}setNoiseLevel(e){return this.state.noiseLevel.value=e,this.dispatchUpdate(t=>t.noiseLevel.value=e),this}setAmplitudeEnvelopeAttack(e){return this.state.envelope.attack.value=e,this}setAmplitudeEnvelopeDecay(e){return this.state.envelope.decay.value=e,this}setAmplitudeEnvelopeSustain(e){return this.state.envelope.sustain.value=e,this}setAmplitudeEnvelopeRelease(e){return this.state.envelope.release.value=e,this}get envelope(){return this.state.envelope}setOsc2Amplitude(e){return this.state.osc2Amplitude.value=e,this.dispatchUpdate(t=>t.osc2Amplitude.value=e),this}get osc2Amplitude(){return this.state.osc2Amplitude}setFilterMode(e){return this.state.filter.mode.value=e,this.dispatchUpdate(t=>t.filterMode.value=e),this}setFilterCutoff(e){return this.state.filter.cutoff.value=e,this.dispatchUpdate(t=>t.cutoff.value=e),this}setFilterResonance(e){return this.state.filter.resonance.value=e,this.dispatchUpdate(t=>t.resonance.value=e),this}setDrive(e){return this.state.filter.drive.value=e,this.dispatchUpdate(t=>t.drive.value=e),this}get filter(){return this.state.filter}setCutoffEnvelopeAmount(e){return this.state.cutoffMod.amount.value=e,this}setCutoffEnvelopeVelocity(e){return this.state.cutoffMod.velocity.value=e,this}setCutoffEnvelopeAttack(e){return this.state.cutoffMod.attack.value=e,this}setCutoffEnvelopeDecay(e){return this.state.cutoffMod.decay.value=e,this}setLfo1Mode(e){return this.state.lfo1.mode.value=e,this.dispatchUpdate(t=>t.lfo1Mode.value=e),this}get lfo1(){return this.state.lfo1}setLfo1Destination(e){return this.state.lfo1.destination.value=e,this.dispatchUpdate(t=>t.lfo1Destination.value=e),this}setLfo1Frequency(e){return this.state.lfo1.frequency.value=e,this.dispatchUpdate(t=>t.lfo1Frequency.value=e),this}setLfo1ModAmount(e){return this.state.lfo1.modAmount.value=e,this.dispatchUpdate(t=>t.lfo1ModAmount.value=e),this}get lfo2(){return this.state.lfo2}setLfo2Mode(e){return this.state.lfo2.mode.value=e,this.dispatchUpdate(t=>t.lfo2Mode.value=e),this}setLfo2Destination(e){return this.state.lfo2.destination.value=e,this.dispatchUpdate(t=>t.lfo2Destination.value=e),this}setLfo2Frequency(e){return this.state.lfo2.frequency.value=e,this.dispatchUpdate(t=>t.lfo2Frequency.value=e),this}setLfo2ModAmount(e){return this.state.lfo2.modAmount.value=e,this.dispatchUpdate(t=>t.lfo2ModAmount.value=e),this}get cutoffMod(){return this.state.cutoffMod}dispatchUpdate(e){for(let t of this.voices.values())e(t)}dumpState(){console.log(JSON.stringify(this.state))}},Q=Object.freeze({NOTE_OFF:8,NOTE_ON:9,NOTE_AFTER_TOUCH:10,CONTROL_CHANGE:11,PROGRAM_CHANGE:12,CHANNEL_AFTER_TOUCH:13,PITCH_BEND:14,SYSEX_MESSAGE:240});function Zt(e){return e&&e.status===Q.CONTROL_CHANGE}function Qt(e,t){return{data:{value:e.getUint8(1),velocity:e.getUint8(2),channel:t}}}function $t(e,t){return{...Qt(e,t),status:Q.NOTE_ON}}function en(e,t){return{...Qt(e,t),status:Q.NOTE_OFF}}function tn(e,t){return{status:Q.NOTE_AFTER_TOUCH,data:{note:e.getUint8(0),value:e.getUint8(1),channel:t}}}function nn(e,t){return{status:Q.CONTROL_CHANGE,data:{control:e.getUint8(1),value:e.getUint8(2),channel:t}}}function rn(e,t){return{status:Q.PROGRAM_CHANGE,data:{value:e.getUint8(0),channel:t}}}function an(e,t,n){return{status:Q.CHANNEL_AFTER_TOUCH,data:{value:e.getUint8(n),channel:t}}}function on(e,t=0){let n=e.getUint8(t)>>4,r=e.getUint8(t)&15;switch(n){case Q.NOTE_ON:return $t(e,r);case Q.NOTE_OFF:return en(e,r);case Q.NOTE_AFTER_TOUCH:return tn(e,r);case Q.CONTROL_CHANGE:return nn(e,r);case Q.PROGRAM_CHANGE:return rn(e,r);case Q.CHANNEL_AFTER_TOUCH:return an(e,r,t)}}async function sn(e=-1){let t=new qt,n=new Map,r,i=M.NONE,a=e;if(!navigator.requestMIDIAccess)return Promise.reject(`MIDI is not supported`);try{r=await navigator.requestMIDIAccess()}catch{return Promise.reject(`Error requesting MIDI access`)}for(let e of r.inputs.values())e.onmidimessage=e=>{o(on(new DataView(e.data.buffer)))};function o(e){if(!e)return;let n=e.data.channel;if(Zt(e))return s(e);n!==a&&a!==-1||(e.status===Q.NOTE_ON&&t.dispatch(X.NOTE_ON,e),e.status===Q.NOTE_OFF&&t.dispatch(X.NOTE_OFF,e))}function s(e){e.isMidiLearning=i!==M.NONE,e.controlID=n.get(e.data.control),e.isMidiLearning&&(e.controlID=i),t.dispatch(X.CONTROL_CHANGE,e)}return Object.assign(t,{setCurrentChannel(e){a=e},setCurrentLearnerID(e){i=e},mapControl(e,t){n.delete(e),n.set(e,t),i=M.NONE}})}var $=tt(440),cn=new Map([[`w`,$[3][0]],[`x`,$[3][2]],[`c`,$[3][4]],[`v`,$[3][5]],[`b`,$[3][7]],[`n`,$[3][9]],[`q`,$[3][11]],[`s`,$[4][0]],[`d`,$[4][2]],[`f`,$[4][4]],[`g`,$[4][5]],[`h`,$[4][7]],[`j`,$[4][9]],[`k`,$[4][11]],[`l`,$[5][0]],[`m`,$[5][2]],[`a`,$[3][1]],[`z`,$[3][3]],[`e`,$[3][6]],[`r`,$[3][8]],[`t`,$[3][10]],[`y`,$[4][1]],[`u`,$[4][3]],[`i`,$[4][6]],[`o`,$[4][8]],[`p`,$[4][10]]]),ln=class extends qt{constructor(){super(),this.pressedKeys=new Set,this.registerKeyDownHandler(),this.registerKeyUpHandler()}registerKeyDownHandler(){document.addEventListener(`keydown`,({key:e})=>{cn.has(e)&&!this.pressedKeys.has(e)&&(this.pressedKeys.add(e),this.dispatch(Jt.NOTE_ON,{data:{value:cn.get(e).midiValue,velocity:60,channel:-1}}))})}registerKeyUpHandler(){document.addEventListener(`keyup`,({key:e})=>{this.pressedKeys.delete(e)&&this.dispatch(Jt.NOTE_OFF,{data:{value:cn.get(e).midiValue,channel:-1}})})}},un=class extends C{constructor(){super(),this.currentLearnerID=M.NONE,this.showVizualizer=!1,this.editMode=!1,this.pressedKeys=new Set,this.audioContext=new AudioContext,this.analyzer=this.audioContext.createAnalyser(),this.voiceManager=new Xt(this.audioContext),this.state=this.voiceManager.getState()}async connectedCallback(){super.connectedCallback(),await this.audioContext.audioWorklet.addModule(`voice-processor.js`),this.midiController=await sn(-1),this.setUpVoiceManager(),this.analyzer.connect(this.audioContext.destination),this.registerVoiceHandlers()}setUpVoiceManager(){this.voiceManager.setMidiController(this.midiController).setKeyBoardcontroller(new ln).connect(this.analyzer)}async onKeyOn(e){this.audioContext.state===`suspended`&&await this.audioContext.resume();let{frequency:t,midiValue:n}=e.detail;this.voiceManager.next({frequency:t,midiValue:n})}onKeyOff(e){let{midiValue:t}=e.detail;this.voiceManager.stop({midiValue:t})}registerVoiceHandlers(){this.voiceManager.subscribe(Z.NOTE_ON,e=>{this.pressedKeys.add(e.midiValue),this.pressedKeys=new Set([...this.pressedKeys.values()]),this.requestUpdate()}).subscribe(Z.NOTE_OFF,e=>{this.pressedKeys.delete(e.midiValue),this.pressedKeys=new Set([...this.pressedKeys.values()]),this.requestUpdate()}).subscribe(Z.OSC1,e=>{this.state.osc1=e,this.requestUpdate()}).subscribe(Z.OSC_MIX,e=>{this.state.osc2Amplitude=e,this.requestUpdate()}).subscribe(Z.NOISE,e=>{this.state.noiseLevel=e,this.requestUpdate()}).subscribe(Z.OSC2,e=>{this.state.osc2=e,this.requestUpdate()}).subscribe(Z.FILTER,e=>{this.state.filter=e,this.requestUpdate()}).subscribe(Z.ENVELOPE,e=>{this.state.envelope=e,this.requestUpdate()}).subscribe(Z.LFO1,e=>{this.state.lfo1=e,this.requestUpdate()}).subscribe(Z.LFO2,e=>{this.state.lfo2=e,this.requestUpdate()}).subscribe(Z.CUTOFF_MOD,e=>{this.state.cutoffMod=e,this.requestUpdate()})}onOsc1Change(e){switch(e.detail.type){case A.WAVE_FORM:this.voiceManager.setOsc1Mode(e.detail.value);break;case A.SEMI_SHIFT:this.voiceManager.setOsc1SemiShift(e.detail.value);break;case A.CENT_SHIFT:this.voiceManager.setOsc1CentShift(e.detail.value);break;case A.CYCLE:this.voiceManager.setOsc1Cycle(e.detail.value)}}onAmplitudeEnvelopeChange(e){switch(e.detail.type){case R.ATTACK:this.voiceManager.setAmplitudeEnvelopeAttack(e.detail.value);break;case R.DECAY:this.voiceManager.setAmplitudeEnvelopeDecay(e.detail.value);break;case R.SUSTAIN:this.voiceManager.setAmplitudeEnvelopeSustain(e.detail.value);break;case R.RELEASE:this.voiceManager.setAmplitudeEnvelopeRelease(e.detail.value);break}}onOscMixChange(e){switch(e.detail.type){case A.MIX:this.voiceManager.setOsc2Amplitude(e.detail.value);break;case A.NOISE:this.voiceManager.setNoiseLevel(e.detail.value);break}}onOsc2Change(e){switch(e.detail.type){case A.WAVE_FORM:this.voiceManager.setOsc2Mode(e.detail.value);break;case A.SEMI_SHIFT:this.voiceManager.setOsc2SemiShift(e.detail.value);break;case A.CENT_SHIFT:this.voiceManager.setOsc2CentShift(e.detail.value);break;case A.CYCLE:this.voiceManager.setOsc2Cycle(e.detail.value);break}}onFilterChange(e){switch(e.detail.type){case I.MODE:this.voiceManager.setFilterMode(e.detail.value);break;case I.CUTOFF:this.voiceManager.setFilterCutoff(e.detail.value);break;case I.RESONANCE:this.voiceManager.setFilterResonance(e.detail.value);break;case I.DRIVE:this.voiceManager.setDrive(e.detail.value);break}}onFilterEnvelopeChange(e){switch(e.detail.type){case B.ATTACK:this.voiceManager.setCutoffEnvelopeAttack(e.detail.value);break;case B.DECAY:this.voiceManager.setCutoffEnvelopeDecay(e.detail.value);break;case B.AMOUNT:this.voiceManager.setCutoffEnvelopeAmount(e.detail.value);break;case B.VELOCITY:this.voiceManager.setCutoffEnvelopeVelocity(e.detail.value);break}}onLfo1Change(e){switch(e.detail.type){case V.WAVE_FORM:this.voiceManager.setLfo1Mode(e.detail.value);break;case V.FREQUENCY:this.voiceManager.setLfo1Frequency(e.detail.value);break;case V.MOD_AMOUNT:this.voiceManager.setLfo1ModAmount(e.detail.value);break;case V.DESTINATION:this.voiceManager.setLfo1Destination(e.detail.value)}}onLfo2Change(e){switch(e.detail.type){case V.WAVE_FORM:this.voiceManager.setLfo2Mode(e.detail.value);break;case V.FREQUENCY:this.voiceManager.setLfo2Frequency(e.detail.value);break;case V.MOD_AMOUNT:this.voiceManager.setLfo2ModAmount(e.detail.value);break;case V.DESTINATION:this.voiceManager.setLfo2Destination(e.detail.value)}}async onMenuChange(e){let{type:t,option:n,shouldUpdate:r}=e.detail;switch(t){case G.MIDI_LEARN:this.currentLearnerID=n.value,r&&this.midiController.setCurrentLearnerID(this.currentLearnerID);break;case G.MIDI_CHANNEL:this.unlearn(),r&&this.midiController.setCurrentChannel(n.value);break;case G.PRESET:this.unlearn(),r&&(this.state=this.voiceManager.setState(n.value));break}await this.requestUpdate()}unlearn(){this.currentLearnerID=M.NONE,this.midiController.setCurrentLearnerID(this.currentLearnerID)}computeVizualizerIfEnabled(){if(this.showVizualizer)return v`
        <div class="visualizer">
          <visualizer-element
            .analyser=${this.analyzer}
            width="650"
            height="200"
          ></visualizer-element>
        </div>
      `}computeDumpButtonIfEnabled(){if(this.editMode)return v`<button @click=${this.voiceManager.dumpState}>Dump</button>`}render(){return v`
      <div class="content">
        <div class="synth">
          <div class="menu">
            <menu-element
              .analyser=${this.analyzer}
              @change=${this.onMenuChange}
            ></menu-element>
          </div>
          <div class="panels-row">
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${M.OSC1_SEMI}
              .centControlID=${M.OSC1_CENT}
              .cycleControlID=${M.OSC1_CYCLE}
              label="Osc. 1"
              .state=${this.state.osc1}
              @change=${this.onOsc1Change}
            ></oscillator-element>
            <oscillator-mix-element
              .mix=${this.state.osc2Amplitude}
              .noise=${this.state.noiseLevel}
              .currentLearnerID=${this.currentLearnerID}
              @change=${this.onOscMixChange}
            ></oscillator-mix-element>
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${M.OSC2_SEMI}
              .centControlID=${M.OSC2_CENT}
              .cycleControlID=${M.OSC2_CYCLE}
              label="Osc. 2"
              .state=${this.state.osc2}
              @change=${this.onOsc2Change}
            ></oscillator-element>
            <filter-element
              .currentLearnerID=${this.currentLearnerID}
              .state=${this.state.filter}
              @change=${this.onFilterChange}
            ></filter-element>
          </div>
          <div class="panels-row lower">
            <envelope-element
              .currentLearnerID=${this.currentLearnerID}
              label="Envelope"
              .state=${this.state.envelope}
              @change=${this.onAmplitudeEnvelopeChange}
            ></envelope-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${M.LFO1_FREQ}
              .modAmountControlID=${M.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${M.LFO2_FREQ}
              .modAmountControlID=${M.LFO2_MOD}
              label="LFO 2"
              .state=${this.state.lfo2}
              @change=${this.onLfo2Change}
            ></lfo-element>
            <filter-envelope-element
              .currentLearnerID=${this.currentLearnerID}
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
    `}static get styles(){return o`
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
        width: 650px;

        background-color: var(--main-panel-color);

        border-radius: 0.5rem;
        padding: 1.5em;
      }

      .synth .panels-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .synth .panels-row.lower {
        margin-top: 1em;
      }

      .synth .keyboard {
        --key-height: 100px;
        --panel-wrapper-background-color: var(--keyboard-panel-color);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 15px;
      }

      .synth .keyboard .keys {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 635px;
        margin: -1.5em auto 0.5em 0.6em;
      }
    `}};D([T({type:Object})],un.prototype,`pressedKeys`,void 0),un=D([w(`wasm-poly-element`)],un);var dn=class extends C{render(){return v`<wasm-poly-element></wasm-poly-element>`}};dn=D([w(`root-element`)],dn);