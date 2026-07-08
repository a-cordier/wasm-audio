(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:ee,getOwnPropertyNames:te,getOwnPropertySymbols:ne,getPrototypeOf:re}=Object,ie=globalThis,ae=ie.trustedTypes,oe=ae?ae.emptyScript:``,se=ie.reactiveElementPolyfillSupport,ce=(e,t)=>e,le={toAttribute(e,t){switch(t){case Boolean:e=e?oe:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},ue=(e,t)=>!l(e,t),de={attribute:!0,type:String,converter:le,reflect:!1,useDefault:!1,hasChanged:ue};Symbol.metadata??=Symbol(`metadata`),ie.litPropertyMetadata??=new WeakMap;var d=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=de){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=ee(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??de}static _$Ei(){if(this.hasOwnProperty(ce(`elementProperties`)))return;let e=re(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(ce(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ce(`properties`))){let e=this.properties,t=[...te(e),...ne(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?le:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?le:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??ue)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};d.elementStyles=[],d.shadowRootOptions={mode:`open`},d[ce(`elementProperties`)]=new Map,d[ce(`finalized`)]=new Map,se?.({ReactiveElement:d}),(ie.reactiveElementVersions??=[]).push(`2.1.2`);var fe=globalThis,pe=e=>e,me=fe.trustedTypes,he=me?me.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ge=`$lit$`,f=`lit$${Math.random().toFixed(9).slice(2)}$`,_e=`?`+f,ve=`<${_e}>`,p=document,m=()=>p.createComment(``),h=e=>e===null||typeof e!=`object`&&typeof e!=`function`,ye=Array.isArray,be=e=>ye(e)||typeof e?.[Symbol.iterator]==`function`,xe=`[ 	
\f\r]`,Se=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ce=/-->/g,we=/>/g,g=RegExp(`>|${xe}(?:([^\\s"'>=/]+)(${xe}*=${xe}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),Te=/'/g,Ee=/"/g,De=/^(?:script|style|textarea|title)$/i,_=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),v=Symbol.for(`lit-noChange`),y=Symbol.for(`lit-nothing`),Oe=new WeakMap,b=p.createTreeWalker(p,129);function ke(e,t){if(!ye(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return he===void 0?t:he.createHTML(t)}var Ae=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=Se;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===Se?c[1]===`!--`?o=Ce:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=g):(De.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=g):o=we:o===g?c[0]===`>`?(o=i??Se,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?g:c[3]===`"`?Ee:Te):o===Ee||o===Te?o=g:o===Ce||o===we?o=Se:(o=g,i=void 0);let ee=o===g&&e[t+1].startsWith(`/>`)?` `:``;a+=o===Se?n+ve:l>=0?(r.push(s),n.slice(0,l)+ge+n.slice(l)+f+ee):n+f+(l===-2?t:ee)}return[ke(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},je=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Ae(t,n);if(this.el=e.createElement(l,r),b.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=b.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ge)){let t=u[o++],n=i.getAttribute(e).split(f),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Fe:r[1]===`?`?Ie:r[1]===`@`?Le:Pe}),i.removeAttribute(e)}else e.startsWith(f)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(De.test(i.tagName)){let e=i.textContent.split(f),t=e.length-1;if(t>0){i.textContent=me?me.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],m()),b.nextNode(),c.push({type:2,index:++a});i.append(e[t],m())}}}else if(i.nodeType===8)if(i.data===_e)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(f,e+1))!==-1;)c.push({type:7,index:a}),e+=f.length-1}a++}}static createElement(e,t){let n=p.createElement(`template`);return n.innerHTML=e,n}};function x(e,t,n=e,r){if(t===v)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=h(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=x(e,i._$AS(e,t.values),i,r)),t}var Me=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??p).importNode(t,!0);b.currentNode=r;let i=b.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new Ne(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Re(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=b.nextNode(),a++)}return b.currentNode=p,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},Ne=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=y,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=x(this,e,t),h(e)?e===y||e==null||e===``?(this._$AH!==y&&this._$AR(),this._$AH=y):e!==this._$AH&&e!==v&&this._(e):e._$litType$===void 0?e.nodeType===void 0?be(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==y&&h(this._$AH)?this._$AA.nextSibling.data=e:this.T(p.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=je.createElement(ke(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Me(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Oe.get(e.strings);return t===void 0&&Oe.set(e.strings,t=new je(e)),t}k(t){ye(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(m()),this.O(m()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=pe(e).nextSibling;pe(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Pe=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=y,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=y}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=x(this,e,t,0),a=!h(e)||e!==this._$AH&&e!==v,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=x(this,r[n+o],t,o),s===v&&(s=this._$AH[o]),a||=!h(s)||s!==this._$AH[o],s===y?e=y:e!==y&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Fe=class extends Pe{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===y?void 0:e}},Ie=class extends Pe{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==y)}},Le=class extends Pe{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=x(this,e,t,0)??y)===v)return;let n=this._$AH,r=e===y&&n!==y||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==y&&(n===y||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Re=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){x(this,e)}},ze=fe.litHtmlPolyfillSupport;ze?.(je,Ne),(fe.litHtmlVersions??=[]).push(`3.3.3`);var Be=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new Ne(t.insertBefore(m(),e),e,void 0,n??{})}return i._$AI(e),i},Ve=globalThis,S=class extends d{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Be(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return v}};S._$litElement$=!0,S.finalized=!0,Ve.litElementHydrateSupport?.({LitElement:S});var He=Ve.litElementPolyfillSupport;He?.({LitElement:S}),(Ve.litElementVersions??=[]).push(`4.2.2`);var C=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ue={attribute:!0,type:String,converter:le,reflect:!1,hasChanged:ue},We=(e=Ue,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function w(e){return(t,n)=>typeof n==`object`?We(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}var Ge={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ke=e=>(...t)=>({_$litDirective$:e,values:t}),qe=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},T=Ke(class extends qe{constructor(e){if(super(e),e.type!==Ge.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return v}}),Je=Object.freeze([`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`]);function Ye(e,t=440){return e>=0&&e<=127?t*2**((e-69)/12):null}function Xe(e,t){return(t+1)*12+Je.indexOf(e)}function Ze({value:e,velocity:t=100}){let n=(e-24)%12,r=(e-n-12)/12;return{pitchClass:Je[n],octave:r,frequency:Ye(e),midiValue:e,velocity:t}}function Qe(e){return(e-24)%12}function $e(e){return(e-Qe(e)-12)/12}function et(e,t,n=440){return Ye(Xe(e,t),n)}function tt(e,t=440){return Je.map(n=>({pitchClass:n,octave:e,frequency:et(n,e,t),midiValue:Xe(n,e),velocity:127})).filter(e=>e.frequency!==null)}function nt(e=440){let t=[];for(let n=0;n<10;++n)t.push(tt(n,e));return t}function E(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var rt=nt(440).map(it);function it(e){return e.map(e=>{let t=e.pitchClass.endsWith(`#`),n=t?e.pitchClass.replace(`#`,`--sharp`):e.pitchClass;return{...e,classes:{[n]:!0,"key--sharp":t,"key--whole":!t,key:!0}}})}var at=class extends S{constructor(...e){super(...e),this.lowerKey=36,this.higherKey=61,this.mouseControlledKey=null}get octaves(){return rt.slice($e(this.lowerKey),$e(this.higherKey)+1)}async connectedCallback(){super.connectedCallback(),this.registerMouseUpHandler()}registerMouseUpHandler(){document.addEventListener(`mouseup`,this.mouseUp.bind(this))}mouseUp(){this.mouseControlledKey&&=(this.keyOff(this.mouseControlledKey),null)}mouseDown(e){return async t=>{t.button===0&&(this.mouseControlledKey=e,await this.keyOn(e))}}mouseEnter(e){return async()=>{this.mouseControlledKey&&(await this.keyOff(this.mouseControlledKey),this.mouseControlledKey=e,await this.keyOn(e))}}findKey(e){return rt[$e(e)][Qe(e)]}async keyOn(e){this.pressedKeys.add(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOn`,{detail:e})),await this.requestUpdate()}async keyOff(e){this.pressedKeys.delete(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOff`,{detail:e})),await this.requestUpdate()}createOctaveElement(e){return _`
      <div class="octave">
        ${e.map(this.createKeyElement.bind(this))}
      </div>
    `}createKeyElement(e){return _`
      <div
        @mousedown=${this.mouseDown(e)}
        @mouseenter=${this.mouseEnter(e)}
        id="${e.midiValue}"
        class="${this.computeKeyClasses(e)}"
      ></div>
    `}computeKeyClasses(e){return T({...e.classes,"key--pressed":this.pressedKeys&&this.pressedKeys.has(e.midiValue)})}render(){return _`
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
    `}};E([w({type:Number})],at.prototype,`lowerKey`,void 0),E([w({type:Number})],at.prototype,`higherKey`,void 0),E([w({type:Object})],at.prototype,`pressedKeys`,void 0),at=E([C(`keys-element`)],at);var D=class extends S{constructor(...e){super(...e),this.width=1024,this.height=512}firstUpdated(){this.canvas=this.shadowRoot.getElementById(`visualizer`),this.canvasContext=this.canvas.getContext(`2d`),this.draw()}connectedCallback(){super.connectedCallback(),this.analyser.fftSize=2048*2,this.buffer=new Uint8Array(this.analyser.fftSize)}draw(){this.analyser&&this.drawOscilloscope()}drawOscilloscope(){this.canvasContext.clearRect(0,0,this.canvas.width,this.canvas.height);let e=this.canvas.width/this.analyser.fftSize*4;this.analyser.getByteTimeDomainData(this.buffer),this.canvasContext.beginPath(),this.buffer.forEach((t,n)=>{let r=t/128*(this.canvas.height/2),i=n*e;this.canvasContext.lineTo(i,r)}),this.canvasContext.lineWidth=1,this.canvasContext.strokeStyle=`#b4d455`,this.canvasContext.stroke(),requestAnimationFrame(this.drawOscilloscope.bind(this))}render(){return _`
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
    `}};E([w({attribute:!1})],D.prototype,`analyser`,void 0),E([w({type:Number})],D.prototype,`width`,void 0),E([w({type:Number})],D.prototype,`height`,void 0),D=E([C(`visualizer-element`)],D);var O=function(e){return e[e.SINE=0]=`SINE`,e[e.SAWTOOTH=1]=`SAWTOOTH`,e[e.SQUARE=2]=`SQUARE`,e[e.TRIANGLE=3]=`TRIANGLE`,e}({}),ot=class extends S{render(){return _`
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
    `}};ot=E([C(`sine-wave-icon`)],ot);var st=class extends S{render(){return _`
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
    `}};st=E([C(`square-wave-icon`)],st);var ct=class extends S{render(){return _`
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
    `}};ct=E([C(`saw-wave-icon`)],ct);var lt=class extends S{render(){return _`
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
    `}};lt=E([C(`triangle-wave-icon`)],lt);var ut=class extends S{constructor(...e){super(...e),this.value=O.SINE}async onSawSelect(){this.value=O.SAWTOOTH,this.dispatchSelect()}async onSquareSelect(){this.value=O.SQUARE,this.dispatchSelect()}async onSineSelect(){this.value=O.SINE,this.dispatchSelect()}async onTriangleSelect(){this.value=O.TRIANGLE,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return _`
      <div class="wave-selector">
        <button
          class="${this.computeButtonClasses(O.SAWTOOTH)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(O.SQUARE)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(O.TRIANGLE)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(O.SINE)}"
          @click=${this.onSineSelect}
        >
          <sine-wave-icon class="icon"></sine-wave-icon>
        </button>
      </div>
    `}computeButtonClasses(e){return T({active:e===this.value})}static get styles(){return o`
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
    `}};E([w({type:Number})],ut.prototype,`value`,void 0),ut=E([C(`wave-selector-element`)],ut);var k=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.SEMI_SHIFT=1]=`SEMI_SHIFT`,e[e.CENT_SHIFT=2]=`CENT_SHIFT`,e[e.CYCLE=3]=`CYCLE`,e[e.MIX=4]=`MIX`,e[e.NOISE=5]=`NOISE`,e}({});function dt(e,t){return t>=e.max?e.max:t<=e.min?e.min:t}function ft(e,t,n){return Math.round(n.min+(e-t.min)*(n.max-n.min)/(t.max-t.min))}var pt={min:-135,max:135},mt={min:0,max:127},A=class extends S{constructor(...e){super(...e),this.range=mt,this.value=64,this.step=1,this.angle=0}async connectedCallback(){super.connectedCallback(),this.updateAngle()}toggleActive(){let e=e=>{e.preventDefault(),this.updateValue(this.computeStep(-e.movementY,e.altKey))},t=()=>{document.removeEventListener(`mouseup`,t),document.removeEventListener(`mousemove`,e)};document.addEventListener(`mousemove`,e),document.addEventListener(`mouseup`,t)}onWheel(e){e.preventDefault(),this.updateValue(this.computeStep(e.deltaY,e.altKey))}updateAngle(){this.angle=ft(this.value,this.range,pt)}updateValue(e){this.value=dt(this.range,this.value+e)}computeStep(e,t=!1){return this.computeStepMultiplier(e,t)*this.step}computeStepMultiplier(e,t=!1){let n=e<0?-1:1;return t?n*.25:n}updated(e){e.has(`value`)&&(this.updateAngle(),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}})))}render(){return _`
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
    `}};E([w({type:Object})],A.prototype,`range`,void 0),E([w({type:Number})],A.prototype,`value`,void 0),E([w({type:Number})],A.prototype,`step`,void 0),E([w({type:Number})],A.prototype,`angle`,void 0),E([w({type:String})],A.prototype,`label`,void 0),A=E([C(`knob-element`)],A);var ht=class extends S{constructor(...e){super(...e),this.label=``}render(){return _`
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
    `}};E([w({type:String})],ht.prototype,`label`,void 0),ht=E([C(`panel-wrapper-element`)],ht);var gt=class{constructor(e){this.currentOption=0,this.options=e,this.map=e.map.bind(e)}get size(){return this.options.length}set index(e){this.currentOption=e-1,this.next()}get index(){return this.currentOption}selectValue(e){let t=this.options.findIndex(t=>t.value===e);t>-1&&(this.currentOption=t)}select(e){return this.currentOption=e,this}next(){return++this.currentOption>=this.options.length&&(this.currentOption=0),this}previous(){return--this.currentOption<0&&(this.currentOption=this.options.length-1),this}getCurrent(){return this.options[this.currentOption]}},j=function(e){return e[e.NONE=-1]=`NONE`,e[e.OSC1_SEMI=0]=`OSC1_SEMI`,e[e.OSC1_CENT=1]=`OSC1_CENT`,e[e.OSC1_CYCLE=2]=`OSC1_CYCLE`,e[e.OSC_MIX=3]=`OSC_MIX`,e[e.NOISE=4]=`NOISE`,e[e.OSC2_SEMI=5]=`OSC2_SEMI`,e[e.OSC2_CENT=6]=`OSC2_CENT`,e[e.OSC2_CYCLE=7]=`OSC2_CYCLE`,e[e.CUTOFF=8]=`CUTOFF`,e[e.RESONANCE=9]=`RESONANCE`,e[e.DRIVE=10]=`DRIVE`,e[e.ATTACK=11]=`ATTACK`,e[e.DECAY=12]=`DECAY`,e[e.SUSTAIN=13]=`SUSTAIN`,e[e.RELEASE=14]=`RELEASE`,e[e.LFO1_FREQ=15]=`LFO1_FREQ`,e[e.LFO1_MOD=16]=`LFO1_MOD`,e[e.LFO2_FREQ=17]=`LFO2_FREQ`,e[e.LFO2_MOD=18]=`LFO2_MOD`,e[e.CUT_MOD=19]=`CUT_MOD`,e[e.CUT_VEL=20]=`CUT_VEL`,e[e.CUT_ATTACK=21]=`CUT_ATTACK`,e[e.CUT_DECAY=22]=`CUT_DECAY`,e}({});function M(e){return{name:j[e].replace(/_/g,` `),value:e}}var _t=new gt([M(0),M(1),M(2),M(3),M(4),M(5),M(6),M(7),M(11),M(12),M(13),M(14),M(8),M(9),M(10),M(19),M(20),M(21),M(22),M(15),M(16),M(17),M(18)]),N=class extends S{constructor(){super(),this.label=`Osc`,this.currentLearnerID=j.NONE,this.semiControlID=j.OSC1_SEMI,this.centControlID=j.OSC1_CENT,this.cycleControlID=j.OSC1_CYCLE,this.cycleRange={min:5,max:122}}connectedCallback(){super.connectedCallback()}onSemiShift(e){this.dispatchChange(k.SEMI_SHIFT,e.detail.value)}get semiShiftValue(){return this.state.semiShift.value}onCentShift(e){this.dispatchChange(k.CENT_SHIFT,e.detail.value)}get centShiftValue(){return this.state.centShift.value}onCycleChange(e){this.dispatchChange(k.CYCLE,e.detail.value)}get cycleValue(){return this.state.cycle.value}onWaveFormChange(e){this.dispatchChange(k.WAVE_FORM,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return _`
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
    `}};E([w({type:String})],N.prototype,`label`,void 0),E([w({type:Object})],N.prototype,`state`,void 0),E([w({type:Number})],N.prototype,`currentLearnerID`,void 0),E([w({type:Number})],N.prototype,`semiControlID`,void 0),E([w({type:Number})],N.prototype,`centControlID`,void 0),E([w({type:Number})],N.prototype,`cycleControlID`,void 0),N=E([C(`oscillator-element`)],N);var P=class extends S{constructor(...e){super(...e),this.currentLearnerID=j.NONE}render(){return _`
        <panel-wrapper-element class="oscillator-mix">
            <div class="oscillator-mix-control">
                <midi-control-wrapper
                .controlID=${j.OSC_MIX}
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
                .controlID=${j.NOISE}
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
    `}onMixChange(e){this.dispatchChange(k.MIX,e.detail.value)}onNoiseChange(e){this.dispatchChange(k.NOISE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}static get styles(){return o`
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
    `}};E([w({type:Number})],P.prototype,`currentLearnerID`,void 0),E([w({type:Object})],P.prototype,`mix`,void 0),E([w({type:Object})],P.prototype,`noise`,void 0),P=E([C(`oscillator-mix-element`)],P);var F=function(e){return e[e.MODE=0]=`MODE`,e[e.CUTOFF=1]=`CUTOFF`,e[e.RESONANCE=2]=`RESONANCE`,e[e.DRIVE=3]=`DRIVE`,e}({}),vt=class extends S{constructor(...e){super(...e),this.currentLearnerID=j.NONE}get hasFocus(){return this.currentLearnerID===this.controlID}render(){return _`
      <div class="${this.computeClassMap()}">
        <slot></slot>
      </div>
    `}computeClassMap(){return T({wrapper:!0,focus:this.hasFocus})}static get styles(){return o`
      .wrapper.focus {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: var(--control-hander-color-focused);  
        }
      }
    `}};E([w({type:Number})],vt.prototype,`controlID`,void 0),E([w({type:Number})],vt.prototype,`currentLearnerID`,void 0),vt=E([C(`midi-control-wrapper`)],vt);var I=function(e){return e[e.LOWPASS=0]=`LOWPASS`,e[e.LOWPASS_PLUS=1]=`LOWPASS_PLUS`,e[e.BANDPASS=2]=`BANDPASS`,e[e.HIGHPASS=3]=`HIGHPASS`,e}({}),yt=class extends S{constructor(...e){super(...e),this.value=I.LOWPASS}async onLpSelect(){this.value=I.LOWPASS,this.dispatchSelect()}async onLpPlusSelect(){this.value=I.LOWPASS_PLUS,this.dispatchSelect()}async onBpSelect(){this.value=I.BANDPASS,this.dispatchSelect()}async onHpSelect(){this.value=I.HIGHPASS,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return _`
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
    `}computeButtonClasses(e){return T({active:e===this.value})}static get styles(){return o`
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
    `}};E([w({type:Number})],yt.prototype,`value`,void 0),yt=E([C(`filter-selector-element`)],yt);var bt=class extends S{constructor(...e){super(...e),this.currentLearnerID=j.NONE}onCutoffChange(e){this.dispatchChange(F.CUTOFF,e.detail.value)}onResonanceChange(e){this.dispatchChange(F.RESONANCE,e.detail.value)}onDriveChange(e){this.dispatchChange(F.DRIVE,e.detail.value)}onTypeChange(e){this.dispatchChange(F.MODE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return _`
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
                  controlID=${j.CUTOFF}
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
                  controlID=${j.RESONANCE}
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
                  controlID=${j.DRIVE}
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
    `}};E([w({type:Object})],bt.prototype,`state`,void 0),E([w({type:Number})],bt.prototype,`currentLearnerID`,void 0),bt=E([C(`filter-element`)],bt);var L=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.SUSTAIN=2]=`SUSTAIN`,e[e.RELEASE=3]=`RELEASE`,e}({}),xt=`important`,St=` !important`,Ct=Ke(class extends qe{constructor(e){if(super(e),e.type!==Ge.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(St);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?xt:``):n[e]=r}}return v}}),wt=class extends S{constructor(...e){super(...e),this.label=``,this.value=127}toggleActive(e){let t=this.shadowRoot.host.offsetParent,n=this.cursorWrapperElement,r=n.offsetHeight,i=e.pageY-(t.offsetTop+n.offsetTop);this.updateValue((1-i/r)*127);let a=e=>{e.preventDefault(),this.updateValue(this.value-e.movementY)},o=()=>{document.removeEventListener(`mouseup`,o),document.removeEventListener(`mousemove`,a)};document.addEventListener(`mousemove`,a),document.addEventListener(`mouseup`,o)}onWheel(e){e.preventDefault(),this.updateValue(this.value+e.deltaY)}updateValue(e){this.value=dt({min:0,max:127},e),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}computeFaderCursorStyle(){return Ct({height:`${this.value/127*100}%`})}get cursorElement(){return _` <div
      class="fader-cursor"
      style="${this.computeFaderCursorStyle()}"
    ></div>`}get cursorWrapperElement(){return this.shadowRoot.querySelector(`.cursor-wrapper`)}render(){return _`
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
    `}};E([w({type:String})],wt.prototype,`label`,void 0),E([w({type:Number})],wt.prototype,`value`,void 0),wt=E([C(`fader-element`)],wt);var R=class extends S{constructor(...e){super(...e),this.label=`Envelope`,this.currentLearnerID=j.NONE}onAttackChange(e){this.dispatchChange(L.ATTACK,e.detail.value)}onDecayChange(e){this.dispatchChange(L.DECAY,e.detail.value)}onSustainChange(e){this.dispatchChange(L.SUSTAIN,e.detail.value)}onReleaseChange(e){this.dispatchChange(L.RELEASE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return _`
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <midi-control-wrapper
            .controlID=${j.ATTACK}
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
            .controlID=${j.DECAY}
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
            .controlID=${j.SUSTAIN}
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
            .controlID=${j.RELEASE}
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
    `}};E([w({type:String})],R.prototype,`label`,void 0),E([w({type:Object})],R.prototype,`state`,void 0),E([w({type:Number})],R.prototype,`currentLearnerID`,void 0),R=E([C(`envelope-element`)],R);var z=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.AMOUNT=2]=`AMOUNT`,e[e.VELOCITY=3]=`VELOCITY`,e}({}),Tt=class extends S{constructor(...e){super(...e),this.currentLearnerID=j.NONE}onAttackChange(e){this.dispatchChange(z.ATTACK,e.detail.value)}onDecayChange(e){this.dispatchChange(z.DECAY,e.detail.value)}onAmountChange(e){this.dispatchChange(z.AMOUNT,e.detail.value)}onVelocityChange(e){this.dispatchChange(z.VELOCITY,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return _`
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <midi-control-wrapper
              controlID=${j.CUT_ATTACK}
              currentLearnerID=${this.currentLearnerID}
            >
              <fader-element
                label="A"
                .value=${this.state.attack.value}
                @change=${this.onAttackChange}
              ></fader-element>
            </midi-control-wrapper>
            <midi-control-wrapper
              controlID=${j.CUT_DECAY}
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
                controlID=${j.CUT_MOD}
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
                controlID=${j.CUT_VEL}
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
    `}};E([w({type:Object})],Tt.prototype,`state`,void 0),E([w({type:Number})],Tt.prototype,`currentLearnerID`,void 0),Tt=E([C(`filter-envelope-element`)],Tt);var B=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.FREQUENCY=1]=`FREQUENCY`,e[e.MOD_AMOUNT=2]=`MOD_AMOUNT`,e[e.DESTINATION=3]=`DESTINATION`,e}({}),V=!0,H=!1,Et={A:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,V,V,V,V],[V,H,H,H,V],[V,H,H,H,V]],B:[[V,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,V,V,V,H]],C:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,V],[H,V,V,V,H]],D:[[V,V,V,H,H],[V,H,H,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,V,H],[V,V,V,H,H]],E:[[V,V,V,V,V],[V,H,H,H,H],[V,H,H,H,H],[V,V,V,V,H],[V,H,H,H,H],[V,H,H,H,H],[V,V,V,V,V]],F:[[V,V,V,V,V],[V,H,H,H,H],[V,H,H,H,H],[V,V,V,V,H],[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,H]],G:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,H],[V,H,V,V,V],[V,H,H,H,V],[V,H,H,H,V],[H,V,V,V,V]],H:[[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,V,V,V,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V]],I:[[H,V,V,V,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,V,V,V,H]],J:[[H,H,V,V,V],[H,H,H,V,H],[H,H,H,V,H],[H,H,H,V,H],[H,H,H,V,H],[V,H,H,V,H],[H,V,V,H,H]],K:[[V,H,H,H,V],[V,H,H,V,H],[V,H,V,H,H],[V,V,H,H,H],[V,H,V,H,H],[V,H,H,V,H],[V,H,H,H,V]],L:[[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,H],[V,V,V,V,V]],M:[[V,H,H,H,V],[V,V,H,V,V],[V,H,V,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V]],N:[[V,H,H,H,V],[V,H,H,H,V],[V,V,H,H,V],[V,H,V,H,V],[V,H,H,V,V],[V,H,H,H,V],[V,H,H,H,V]],O:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[H,V,V,V,H]],P:[[V,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,V,V,V,H],[V,H,H,H,H],[V,H,H,H,H],[V,H,H,H,H]],Q:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,V,H,V],[V,H,H,V,H],[H,V,V,H,V]],R:[[V,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,V,V,V,H],[V,H,V,H,H],[V,H,H,V,H],[V,H,H,H,V]],S:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,H],[H,V,V,V,H],[H,H,H,H,V],[V,H,H,H,V],[H,V,V,V,H]],T:[[V,V,V,V,V],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H]],U:[[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[H,V,V,V,H]],V:[[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[H,V,H,V,H],[H,H,V,H,H]],W:[[V,H,H,H,V],[V,H,H,H,V],[V,H,H,H,V],[V,H,V,H,V],[V,H,V,H,V],[V,H,V,H,V],[H,V,H,V,H]],X:[[V,H,H,H,V],[V,H,H,H,V],[H,V,H,V,H],[H,H,V,H,H],[H,V,H,V,H],[V,H,H,H,V],[V,H,H,H,V]],Y:[[V,H,H,H,V],[V,H,H,H,V],[H,V,H,V,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,V,H,H]],Z:[[V,V,V,V,V],[H,H,H,H,V],[H,H,H,V,H],[H,H,V,H,H],[H,V,H,H,H],[V,H,H,H,H],[V,V,V,V,V]],0:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,V,V],[V,H,V,H,V],[V,V,H,H,V],[V,H,H,H,V],[H,V,V,V,H]],1:[[H,H,V,V,H],[H,V,H,V,H],[V,H,H,V,H],[H,H,H,V,H],[H,H,H,V,H],[H,H,H,V,H],[H,H,H,V,H]],2:[[H,V,V,V,H],[V,H,H,H,V],[H,H,H,H,V],[H,H,V,V,H],[H,V,H,H,H],[V,H,H,H,H],[V,V,V,V,V]],3:[[H,V,V,V,H],[V,H,H,H,V],[H,H,H,H,V],[H,H,V,V,H],[H,H,H,H,V],[V,H,H,H,V],[H,V,V,V,H]],4:[[H,H,V,V,H],[H,V,H,V,H],[V,H,H,V,H],[V,H,H,V,H],[V,V,V,V,V],[H,H,H,V,H],[H,H,H,V,H]],5:[[V,V,V,V,V],[V,H,H,H,H],[V,H,H,H,H],[H,V,V,V,H],[H,H,H,H,V],[H,H,H,H,V],[V,V,V,V,H]],6:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,H],[V,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[H,V,V,V,H]],7:[[V,V,V,V,V],[H,H,H,H,V],[H,H,H,V,H],[H,H,V,H,H],[H,V,H,H,H],[H,V,H,H,H],[H,V,H,H,H]],8:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[H,V,V,V,H]],9:[[H,V,V,V,H],[V,H,H,H,V],[V,H,H,H,V],[V,V,V,V,V],[H,H,H,H,V],[H,H,H,H,V],[V,V,V,V,H]]," ":[[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H]],_:[[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[V,V,V,V,V]],":":[[H,H,H,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,H,H,H],[H,H,V,H,H],[H,H,V,H,H],[H,H,H,H,H]],".":[[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,H,H,H],[H,H,V,H,H],[H,H,V,H,H]]},Dt=class extends S{render(){return _`
      <div class="lcd-char">
        ${this.char.map(e=>this.createLedRow(e))}
      </div>
    `}createLedRow(e){return _`
      <div class="led-row">
        ${e.map(e=>this.createLed(e))}
      </div>
    `}createLed(e){return e?_`<div class="led on"></div>`:_`<div class="led"></div>`}static get styles(){return o`
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
    `}};E([w({type:Array})],Dt.prototype,`char`,void 0),Dt=E([C(`lcd-char-element`)],Dt);var Ot=class extends S{render(){return _`
      <div class="lcd">
        ${Array.from(this.text).map(this.createLcdChar)}
      </div>
    `}createLcdChar(e){return _`
      <lcd-char-element .char=${Et[e]} class="char"></lcd-char-element>
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
    `}};E([w({type:String})],Ot.prototype,`text`,void 0),Ot=E([C(`lcd-element`)],Ot);var kt=class extends S{render(){return _`
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">${this.options.map(this.createOptionSelector.bind(this))}</div>
      </div>
    `}async connectedCallback(){super.connectedCallback(),this.options.selectValue(this.value)}createOptionSelector(e,t){return _`
      <button @click=${this.createOptionHandler(t)} class="${this.computeButtonClasses(t)}">${t}</button>
    `}computeButtonClasses(e){return T({active:this.options.index===e})}createOptionHandler(e){return()=>{this.options.index=e,this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}}nextOption(){this.options.next(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}previousOption(){this.options.previous(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}dispatchChange({value:e}){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}}))}static get styles(){return o`
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
    `}};E([w({type:Object})],kt.prototype,`options`,void 0),E([w({type:Object})],kt.prototype,`value`,void 0),kt=E([C(`lcd-selector-element`)],kt);var U=function(e){return e[e.FREQUENCY=0]=`FREQUENCY`,e[e.OSCILLATOR_MIX=1]=`OSCILLATOR_MIX`,e[e.CUTOFF=2]=`CUTOFF`,e[e.RESONANCE=3]=`RESONANCE`,e[e.OSC1_CYCLE=4]=`OSC1_CYCLE`,e[e.OSC2_CYCLE=5]=`OSC2_CYCLE`,e}({}),W=class extends S{constructor(...e){super(...e),this.label=`LFO`,this.destinations=new gt([{value:U.OSCILLATOR_MIX,name:`OSC MIX`},{value:U.FREQUENCY,name:`FREQUENCY`},{value:U.CUTOFF,name:`CUTOFF`},{value:U.OSC1_CYCLE,name:`OSC1 CYCLE`},{value:U.OSC2_CYCLE,name:`OSC2 CYCLE`}]),this.shouldMidiLearn=!1,this.currentLearnerID=j.NONE,this.frequencyControlID=j.LFO1_FREQ,this.modAmountControlID=j.LFO1_MOD}onFrequencyChange(e){this.dispatchChange(B.FREQUENCY,e.detail.value)}onModAmountChange(e){this.dispatchChange(B.MOD_AMOUNT,e.detail.value)}onWaveFormChange(e){this.dispatchChange(B.WAVE_FORM,e.detail.value)}onDestinationChange(e){this.dispatchChange(B.DESTINATION,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return _`
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
    `}};E([w({type:String})],W.prototype,`label`,void 0),E([w({type:Object})],W.prototype,`state`,void 0),E([w({type:Boolean})],W.prototype,`shouldMidiLearn`,void 0),E([w({type:Number})],W.prototype,`currentLearnerID`,void 0),E([w({type:Number})],W.prototype,`frequencyControlID`,void 0),E([w({type:Number})],W.prototype,`modAmountControlID`,void 0),W=E([C(`lfo-element`)],W);function At(e,t){return Array.from({length:t}).map((t,n)=>e(n))}function jt(e){return`CHANNEL:${e<10?`0${e}`:`${e}`}`}function Mt(e,t=jt(e+1)){return{value:e,name:t}}var Nt=At(Mt,16);Nt.unshift(Mt(-1,`CHANNEL:ALL`));var Pt=new gt(Nt),G=function(e){return e[e.MIDI_LEARN=0]=`MIDI_LEARN`,e[e.MIDI_CHANNEL=1]=`MIDI_CHANNEL`,e[e.PRESET=2]=`PRESET`,e}({}),Ft=new gt([{name:`SAWSEESS`,value:{osc1:{mode:{value:1},semiShift:{id:0,value:31.75,controller:-1},centShift:{id:1,value:63.5,controller:-1},cycle:{id:2,value:63.5,controller:-1}},osc2:{mode:{value:1},semiShift:{id:5,value:63.5,controller:-1},centShift:{id:6,value:84.66666666666666,controller:-1},cycle:{id:7,value:63.5,controller:-1}},osc2Amplitude:{id:3,value:24,controller:21},noiseLevel:{id:4,value:0,controller:-1},envelope:{attack:{id:11,value:0,controller:-1},decay:{id:12,value:34.925000000000004,controller:-1},sustain:{id:13,value:0,controller:-1},release:{id:14,value:0,controller:-1}},filter:{mode:{value:0},cutoff:{id:8,value:0,controller:14},resonance:{id:9,value:127,controller:15},drive:{id:10,value:34,controller:16}},cutoffMod:{attack:{id:21,value:0,controller:19},decay:{id:22,value:9,controller:20},amount:{id:19,value:21,controller:17},velocity:{id:20,value:21,controller:18}},lfo1:{mode:{value:2},destination:{value:0},frequency:{id:15,value:15.875,controller:-1},modAmount:{id:16,value:0,controller:-1}},lfo2:{mode:{value:2},destination:{value:2},frequency:{id:17,value:31.75,controller:-1},modAmount:{id:18,value:0,controller:-1}}}},{name:`GLAZZQON`,value:{osc1:{mode:{value:2},semiShift:{id:0,value:63.5,controller:-1},centShift:{id:1,value:63.5,controller:-1},cycle:{id:2,value:50.8,controller:-1}},osc2:{mode:{value:2},semiShift:{id:5,value:127,controller:-1},centShift:{id:6,value:76.5,controller:-1},cycle:{id:7,value:73.66666666666667,controller:-1}},osc2Amplitude:{id:3,value:0,controller:21},noiseLevel:{id:4,value:0,controller:-1},envelope:{attack:{id:11,value:0,controller:19},decay:{id:12,value:2.1166666666666734,controller:-1},sustain:{id:13,value:40,controller:19},release:{id:14,value:105,controller:20}},filter:{mode:{value:0},cutoff:{id:8,value:127,controller:14},resonance:{id:9,value:0,controller:15},drive:{id:10,value:0,controller:16}},cutoffMod:{attack:{id:21,value:0,controller:-1},decay:{id:22,value:35,controller:18},amount:{id:19,value:0,controller:17},velocity:{id:20,value:0,controller:18}},lfo1:{mode:{value:0},destination:{value:4},frequency:{id:15,value:44.875,controller:-1},modAmount:{id:16,value:0,controller:-1}},lfo2:{mode:{value:0},destination:{value:5},frequency:{id:17,value:56.75,controller:-1},modAmount:{id:18,value:12,controller:-1}}}}]),It=class extends S{constructor(...e){super(...e),this.mode=G.PRESET}render(){return _`
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
    `}computeButtonClasses(e){return T({active:this.mode===e})}createSwitchModeHandler(e){switch(e){case G.MIDI_CHANNEL:return()=>{this.mode=G.MIDI_CHANNEL,this.dispatchChange()};case G.MIDI_LEARN:return()=>{this.mode=G.MIDI_LEARN,this.dispatchChange()};case G.PRESET:return()=>{this.mode=G.PRESET,this.dispatchChange()}}}nextOption(){this.options.next(),this.dispatchChange(!0),this.requestUpdate()}previousOption(){this.options.previous(),this.dispatchChange(!0),this.requestUpdate()}dispatchChange(e=!1){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:this.mode,option:this.options.getCurrent(),shouldUpdate:e}}))}get options(){switch(this.mode){case G.PRESET:return Ft;case G.MIDI_CHANNEL:return Pt;case G.MIDI_LEARN:default:return _t}}static get styles(){return o`
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
    `}};E([w({type:Number})],It.prototype,`mode`,void 0),It=E([C(`menu-element`)],It);var K=Object.freeze({OSC1_MODE:0,OSC2_MODE:1,FILTER_MODE:2,LFO1_MODE:3,LFO1_DESTINATION:4,LFO2_MODE:5,LFO2_DESTINATION:6,AMPLITUDE_ATTACK:7,AMPLITUDE_DECAY:8,AMPLITUDE_SUSTAIN:9,AMPLITUDE_RELEASE:10,OSC1_SEMI_SHIFT:11,OSC1_CENT_SHIFT:12,OSC1_CYCLE:13,OSC2_SEMI_SHIFT:14,OSC2_CENT_SHIFT:15,OSC2_CYCLE:16,OSC2_AMPLITUDE:17,NOISE_LEVEL:18,CUTOFF:19,RESONANCE:20,DRIVE:21,CUTOFF_ENV_AMOUNT:22,CUTOFF_ENV_VELOCITY:23,CUTOFF_ENV_ATTACK:24,CUTOFF_ENV_DECAY:25,LFO1_FREQUENCY:26,LFO1_MOD_AMOUNT:27,LFO2_FREQUENCY:28,LFO2_MOD_AMOUNT:29}),q=Object.freeze([1,0,2,3]),Lt=Object.freeze([0,1,3,2]),Rt=class extends AudioWorkletNode{constructor(e){super(e,`synth`,{outputChannelCount:[2]})}noteOn(e,t,n){this.port.postMessage({type:`noteOn`,midi:e,frequency:t,velocity:n})}noteOff(e){this.port.postMessage({type:`noteOff`,midi:e})}setParam(e,t){this.port.postMessage({type:`setParam`,id:e,value:t})}},J=class{constructor(e){this.value=e,this.clone=this.clone.bind(this)}clone(){return{...this}}},Y=class{constructor(e,t,n=-1){this.id=e,this.value=t,this.controller=n,this.clone=this.clone.bind(this)}clone(){return{...this}}};function zt(e){let t=[];for(let n of Object.values(e))n instanceof Y?t.push([n.id,n]):n instanceof Object&&t.push(...zt(n));return t}function Bt(e){let t=zt(e);return new Map(t)}function Vt(e){return{osc1:{mode:new J(e.osc1.mode.value),semiShift:new Y(j.OSC1_SEMI,e.osc1.semiShift.value,e.osc1.semiShift.controller),centShift:new Y(j.OSC1_CENT,e.osc1.centShift.value,e.osc1.centShift.controller),cycle:new Y(j.OSC1_CYCLE,e.osc1.cycle.value,e.osc1.cycle.controller)},osc2:{mode:new J(e.osc2.mode.value),semiShift:new Y(j.OSC2_SEMI,e.osc2.semiShift.value,e.osc2.semiShift.controller),centShift:new Y(j.OSC2_CENT,e.osc2.centShift.value,e.osc2.centShift.controller),cycle:new Y(j.OSC2_CYCLE,e.osc2.cycle.value,e.osc2.cycle.controller)},osc2Amplitude:new Y(j.OSC_MIX,e.osc2Amplitude.value,e.osc2Amplitude.controller),noiseLevel:new Y(j.NOISE,e.noiseLevel.value,e.noiseLevel.controller),envelope:{attack:new Y(j.ATTACK,e.envelope.attack.value,e.envelope.attack.controller),decay:new Y(j.DECAY,e.envelope.decay.value,e.envelope.decay.controller),sustain:new Y(j.SUSTAIN,e.envelope.sustain.value,e.envelope.sustain.controller),release:new Y(j.RELEASE,e.envelope.release.value,e.envelope.release.controller)},filter:{mode:new J(e.filter.mode.value),cutoff:new Y(j.CUTOFF,e.filter.cutoff.value,e.filter.cutoff.controller),resonance:new Y(j.RESONANCE,e.filter.resonance.value,e.filter.resonance.controller),drive:new Y(j.DRIVE,e.filter.drive.value,e.filter.drive.controller)},cutoffMod:{attack:new Y(j.CUT_ATTACK,e.cutoffMod.attack.value,e.cutoffMod.attack.controller),decay:new Y(j.CUT_DECAY,e.cutoffMod.decay.value,e.cutoffMod.decay.controller),amount:new Y(j.CUT_MOD,e.cutoffMod.amount.value,e.cutoffMod.amount.controller),velocity:new Y(j.CUT_VEL,e.cutoffMod.velocity.value,e.cutoffMod.velocity.controller)},lfo1:{mode:new J(e.lfo1.mode.value),destination:new J(e.lfo1.destination.value),frequency:new Y(j.LFO1_FREQ,e.lfo1.frequency.value,e.lfo1.frequency.controller),modAmount:new Y(j.LFO1_MOD,e.lfo1.modAmount.value,e.lfo1.modAmount.controller)},lfo2:{mode:new J(e.lfo2.mode.value),destination:new J(e.lfo2.destination.value),frequency:new Y(j.LFO2_FREQ,e.lfo2.frequency.value,e.lfo2.frequency.controller),modAmount:new Y(j.LFO2_MOD,e.lfo2.modAmount.value,e.lfo2.modAmount.controller)}}}function Ht(e){let t=Vt(e),n=Bt(t);return Object.assign(t,{findMidiControlById(e){return n.get(e)},getMidiControls(){return n.values()}})}var Ut=class extends EventTarget{constructor(...e){super(...e),this.observers=new Map}dispatch(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t})),this}subscribe(e,t){let n=e=>{t(e.detail)};return this.observers.set(t,n),this.addEventListener(e,n),this}unsubscribe(e,t){return this.removeEventListener(e,this.observers.get(t)),this.observers.delete(t),this}};new Ut;var X=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e.NOTE_CHANGE=`NOTE_CHANGE`,e.CONTROL_CHANGE=`CONTROL_CHANGE`,e}({}),Z=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e.OSC1=`OSC1`,e.OSC_MIX=`OSC_MIX`,e.NOISE=`NOISE`,e.OSC2=`OSC2`,e.FILTER=`FILTER`,e.ENVELOPE=`ENVELOPE`,e.LFO1=`LFO1`,e.LFO2=`LFO2`,e.CUTOFF_MOD=`CUTOFF_MOD`,e}({}),Wt=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e}({}),Gt=class extends Ut{constructor(e){super(),this.synthNode=null,this.audioContext=e,this.output=new GainNode(e),this.onMidiNoteOn=this.onMidiNoteOn.bind(this),this.onMidiNoteOff=this.onMidiNoteOff.bind(this),this.onMidiCC=this.onMidiCC.bind(this),this.setState(Ht(Ft.getCurrent().value))}init(){this.synthNode=new Rt(this.audioContext),this.synthNode.connect(this.output),this.syncParams()}next({frequency:e,midiValue:t,velocity:n=60}){this.synthNode?.noteOn(t,e,n)}stop({midiValue:e}){this.synthNode?.noteOff(e)}connect(e){this.output.connect(e)}setMidiController(e){return this.midiController=e.subscribe(X.NOTE_ON,this.onMidiNoteOn).subscribe(X.NOTE_OFF,this.onMidiNoteOff).subscribe(X.CONTROL_CHANGE,this.onMidiCC),this.bindMidiControls(),this}setKeyBoardcontroller(e){return e.subscribe(Wt.NOTE_ON,this.onMidiNoteOn).subscribe(Wt.NOTE_OFF,this.onMidiNoteOff),this}onMidiNoteOn(e){let t=Ze(e.data);this.next(t),this.dispatch(Z.NOTE_ON,t)}onMidiNoteOff(e){let t={midiValue:e.data.value};this.stop(t),this.dispatch(Z.NOTE_OFF,t)}onMidiCC(e){let t=this.state.findMidiControlById(e.controlID);t&&(t.controller=e.data.control,t.value=e.data.value,e.isMidiLearning&&this.midiController.mapControl(e.data.control,t.id),this.dispatchCC(t))}dispatchCC(e){switch(e.id){case j.OSC1_SEMI:return this.sendParam(K.OSC1_SEMI_SHIFT,e.value),this.dispatch(Z.OSC1,{...this.state.osc1,semiShift:e.clone()});case j.OSC1_CENT:return this.sendParam(K.OSC1_CENT_SHIFT,e.value),this.dispatch(Z.OSC1,{...this.state.osc1,centShift:e.clone()});case j.OSC1_CYCLE:return this.sendParam(K.OSC1_CYCLE,e.value),this.dispatch(Z.OSC1,{...this.state.osc1,cycle:e.clone()});case j.OSC2_SEMI:return this.sendParam(K.OSC2_SEMI_SHIFT,e.value),this.dispatch(Z.OSC2,{...this.state.osc2,semiShift:e.clone()});case j.OSC2_CENT:return this.sendParam(K.OSC2_CENT_SHIFT,e.value),this.dispatch(Z.OSC2,{...this.state.osc2,centShift:e.clone()});case j.OSC2_CYCLE:return this.sendParam(K.OSC2_CYCLE,e.value),this.dispatch(Z.OSC2,{...this.state.osc2,cycle:e.clone()});case j.OSC_MIX:return this.sendParam(K.OSC2_AMPLITUDE,e.value),this.dispatch(Z.OSC_MIX,e.clone());case j.NOISE:return this.sendParam(K.NOISE_LEVEL,e.value),this.dispatch(Z.NOISE,e.clone());case j.CUTOFF:return this.sendParam(K.CUTOFF,e.value),this.dispatch(Z.FILTER,{...this.state.filter,cutoff:e.clone()});case j.RESONANCE:return this.sendParam(K.RESONANCE,e.value),this.dispatch(Z.FILTER,{...this.state.filter,resonance:e.clone()});case j.DRIVE:return this.sendParam(K.DRIVE,e.value),this.dispatch(Z.FILTER,{...this.state.filter,drive:e.clone()});case j.ATTACK:return this.sendParam(K.AMPLITUDE_ATTACK,e.value),this.dispatch(Z.ENVELOPE,{...this.state.envelope,attack:e.clone()});case j.DECAY:return this.sendParam(K.AMPLITUDE_DECAY,e.value),this.dispatch(Z.ENVELOPE,{...this.state.envelope,decay:e.clone()});case j.SUSTAIN:return this.sendParam(K.AMPLITUDE_SUSTAIN,e.value),this.dispatch(Z.ENVELOPE,{...this.state.envelope,sustain:e.clone()});case j.RELEASE:return this.sendParam(K.AMPLITUDE_RELEASE,e.value),this.dispatch(Z.ENVELOPE,{...this.state.envelope,release:e.clone()});case j.LFO1_FREQ:return this.sendParam(K.LFO1_FREQUENCY,e.value),this.dispatch(Z.LFO1,{...this.state.lfo1,frequency:e.clone()});case j.LFO1_MOD:return this.sendParam(K.LFO1_MOD_AMOUNT,e.value),this.dispatch(Z.LFO1,{...this.state.lfo1,modAmount:e.clone()});case j.LFO2_FREQ:return this.sendParam(K.LFO2_FREQUENCY,e.value),this.dispatch(Z.LFO2,{...this.state.lfo2,frequency:e.clone()});case j.LFO2_MOD:return this.sendParam(K.LFO2_MOD_AMOUNT,e.value),this.dispatch(Z.LFO2,{...this.state.lfo2,modAmount:e.clone()});case j.CUT_ATTACK:return this.sendParam(K.CUTOFF_ENV_ATTACK,e.value),this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,attack:e.clone()});case j.CUT_DECAY:return this.sendParam(K.CUTOFF_ENV_DECAY,e.value),this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,decay:e.clone()});case j.CUT_MOD:return this.sendParam(K.CUTOFF_ENV_AMOUNT,e.value),this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,amount:e.clone()});case j.CUT_VEL:return this.sendParam(K.CUTOFF_ENV_VELOCITY,e.value),this.dispatch(Z.CUTOFF_MOD,{...this.state.cutoffMod,velocity:e.clone()})}}getState(){return{...this.state}}setState(e){return this.state=Ht(e),this.bindMidiControls(),this.syncParams(),this.getState()}bindMidiControls(){if(this.state&&this.midiController)for(let e of this.state.getMidiControls())this.midiController.mapControl(e.controller,e.id)}setOsc1Mode(e){return this.state.osc1.mode.value=e,this.sendParam(K.OSC1_MODE,q[e]),this}setOsc1SemiShift(e){return this.state.osc1.semiShift.value=e,this.sendParam(K.OSC1_SEMI_SHIFT,e),this}setOsc1CentShift(e){return this.state.osc1.centShift.value=e,this.sendParam(K.OSC1_CENT_SHIFT,e),this}setOsc1Cycle(e){return this.state.osc1.cycle.value=e,this.sendParam(K.OSC1_CYCLE,e),this}get osc1(){return this.state.osc1}setOsc2Mode(e){return this.state.osc2.mode.value=e,this.sendParam(K.OSC2_MODE,q[e]),this}setOsc2SemiShift(e){return this.state.osc2.semiShift.value=e,this.sendParam(K.OSC2_SEMI_SHIFT,e),this}setOsc2CentShift(e){return this.state.osc2.centShift.value=e,this.sendParam(K.OSC2_CENT_SHIFT,e),this}setOsc2Cycle(e){return this.state.osc2.cycle.value=e,this.sendParam(K.OSC2_CYCLE,e),this}get osc2(){return this.state.osc2}setNoiseLevel(e){return this.state.noiseLevel.value=e,this.sendParam(K.NOISE_LEVEL,e),this}setAmplitudeEnvelopeAttack(e){return this.state.envelope.attack.value=e,this.sendParam(K.AMPLITUDE_ATTACK,e),this}setAmplitudeEnvelopeDecay(e){return this.state.envelope.decay.value=e,this.sendParam(K.AMPLITUDE_DECAY,e),this}setAmplitudeEnvelopeSustain(e){return this.state.envelope.sustain.value=e,this.sendParam(K.AMPLITUDE_SUSTAIN,e),this}setAmplitudeEnvelopeRelease(e){return this.state.envelope.release.value=e,this.sendParam(K.AMPLITUDE_RELEASE,e),this}get envelope(){return this.state.envelope}setOsc2Amplitude(e){return this.state.osc2Amplitude.value=e,this.sendParam(K.OSC2_AMPLITUDE,e),this}get osc2Amplitude(){return this.state.osc2Amplitude}setFilterMode(e){return this.state.filter.mode.value=e,this.sendParam(K.FILTER_MODE,Lt[e]),this}setFilterCutoff(e){return this.state.filter.cutoff.value=e,this.sendParam(K.CUTOFF,e),this}setFilterResonance(e){return this.state.filter.resonance.value=e,this.sendParam(K.RESONANCE,e),this}setDrive(e){return this.state.filter.drive.value=e,this.sendParam(K.DRIVE,e),this}get filter(){return this.state.filter}setCutoffEnvelopeAmount(e){return this.state.cutoffMod.amount.value=e,this.sendParam(K.CUTOFF_ENV_AMOUNT,e),this}setCutoffEnvelopeVelocity(e){return this.state.cutoffMod.velocity.value=e,this.sendParam(K.CUTOFF_ENV_VELOCITY,e),this}setCutoffEnvelopeAttack(e){return this.state.cutoffMod.attack.value=e,this.sendParam(K.CUTOFF_ENV_ATTACK,e),this}setCutoffEnvelopeDecay(e){return this.state.cutoffMod.decay.value=e,this.sendParam(K.CUTOFF_ENV_DECAY,e),this}setLfo1Mode(e){return this.state.lfo1.mode.value=e,this.sendParam(K.LFO1_MODE,q[e]),this}get lfo1(){return this.state.lfo1}setLfo1Destination(e){return this.state.lfo1.destination.value=e,this.sendParam(K.LFO1_DESTINATION,e),this}setLfo1Frequency(e){return this.state.lfo1.frequency.value=e,this.sendParam(K.LFO1_FREQUENCY,e),this}setLfo1ModAmount(e){return this.state.lfo1.modAmount.value=e,this.sendParam(K.LFO1_MOD_AMOUNT,e),this}get lfo2(){return this.state.lfo2}setLfo2Mode(e){return this.state.lfo2.mode.value=e,this.sendParam(K.LFO2_MODE,q[e]),this}setLfo2Destination(e){return this.state.lfo2.destination.value=e,this.sendParam(K.LFO2_DESTINATION,e),this}setLfo2Frequency(e){return this.state.lfo2.frequency.value=e,this.sendParam(K.LFO2_FREQUENCY,e),this}setLfo2ModAmount(e){return this.state.lfo2.modAmount.value=e,this.sendParam(K.LFO2_MOD_AMOUNT,e),this}get cutoffMod(){return this.state.cutoffMod}dumpState(){console.log(JSON.stringify(this.state))}sendParam(e,t){this.synthNode?.setParam(e,t)}syncParams(){if(!this.synthNode)return;let e=this.state;this.sendParam(K.OSC1_MODE,q[e.osc1.mode.value]),this.sendParam(K.OSC1_SEMI_SHIFT,e.osc1.semiShift.value),this.sendParam(K.OSC1_CENT_SHIFT,e.osc1.centShift.value),this.sendParam(K.OSC1_CYCLE,e.osc1.cycle.value),this.sendParam(K.OSC2_MODE,q[e.osc2.mode.value]),this.sendParam(K.OSC2_SEMI_SHIFT,e.osc2.semiShift.value),this.sendParam(K.OSC2_CENT_SHIFT,e.osc2.centShift.value),this.sendParam(K.OSC2_CYCLE,e.osc2.cycle.value),this.sendParam(K.OSC2_AMPLITUDE,e.osc2Amplitude.value),this.sendParam(K.NOISE_LEVEL,e.noiseLevel.value),this.sendParam(K.AMPLITUDE_ATTACK,e.envelope.attack.value),this.sendParam(K.AMPLITUDE_DECAY,e.envelope.decay.value),this.sendParam(K.AMPLITUDE_SUSTAIN,e.envelope.sustain.value),this.sendParam(K.AMPLITUDE_RELEASE,e.envelope.release.value),this.sendParam(K.FILTER_MODE,Lt[e.filter.mode.value]),this.sendParam(K.CUTOFF,e.filter.cutoff.value),this.sendParam(K.RESONANCE,e.filter.resonance.value),this.sendParam(K.DRIVE,e.filter.drive.value),this.sendParam(K.CUTOFF_ENV_AMOUNT,e.cutoffMod.amount.value),this.sendParam(K.CUTOFF_ENV_VELOCITY,e.cutoffMod.velocity.value),this.sendParam(K.CUTOFF_ENV_ATTACK,e.cutoffMod.attack.value),this.sendParam(K.CUTOFF_ENV_DECAY,e.cutoffMod.decay.value),this.sendParam(K.LFO1_MODE,q[e.lfo1.mode.value]),this.sendParam(K.LFO1_DESTINATION,e.lfo1.destination.value),this.sendParam(K.LFO1_FREQUENCY,e.lfo1.frequency.value),this.sendParam(K.LFO1_MOD_AMOUNT,e.lfo1.modAmount.value),this.sendParam(K.LFO2_MODE,q[e.lfo2.mode.value]),this.sendParam(K.LFO2_DESTINATION,e.lfo2.destination.value),this.sendParam(K.LFO2_FREQUENCY,e.lfo2.frequency.value),this.sendParam(K.LFO2_MOD_AMOUNT,e.lfo2.modAmount.value)}},Q=Object.freeze({NOTE_OFF:8,NOTE_ON:9,NOTE_AFTER_TOUCH:10,CONTROL_CHANGE:11,PROGRAM_CHANGE:12,CHANNEL_AFTER_TOUCH:13,PITCH_BEND:14,SYSEX_MESSAGE:240});function Kt(e){return e&&e.status===Q.CONTROL_CHANGE}function qt(e,t){return{data:{value:e.getUint8(1),velocity:e.getUint8(2),channel:t}}}function Jt(e,t){return{...qt(e,t),status:Q.NOTE_ON}}function Yt(e,t){return{...qt(e,t),status:Q.NOTE_OFF}}function Xt(e,t){return{status:Q.NOTE_AFTER_TOUCH,data:{note:e.getUint8(0),value:e.getUint8(1),channel:t}}}function Zt(e,t){return{status:Q.CONTROL_CHANGE,data:{control:e.getUint8(1),value:e.getUint8(2),channel:t}}}function Qt(e,t){return{status:Q.PROGRAM_CHANGE,data:{value:e.getUint8(0),channel:t}}}function $t(e,t,n){return{status:Q.CHANNEL_AFTER_TOUCH,data:{value:e.getUint8(n),channel:t}}}function en(e,t=0){let n=e.getUint8(t)>>4,r=e.getUint8(t)&15;switch(n){case Q.NOTE_ON:return Jt(e,r);case Q.NOTE_OFF:return Yt(e,r);case Q.NOTE_AFTER_TOUCH:return Xt(e,r);case Q.CONTROL_CHANGE:return Zt(e,r);case Q.PROGRAM_CHANGE:return Qt(e,r);case Q.CHANNEL_AFTER_TOUCH:return $t(e,r,t)}}async function tn(e=-1){let t=new Ut,n=new Map,r,i=j.NONE,a=e;if(!navigator.requestMIDIAccess)return Promise.reject(`MIDI is not supported`);try{r=await navigator.requestMIDIAccess()}catch{return Promise.reject(`Error requesting MIDI access`)}for(let e of r.inputs.values())e.onmidimessage=e=>{o(en(new DataView(e.data.buffer)))};function o(e){if(!e)return;let n=e.data.channel;if(Kt(e))return s(e);n!==a&&a!==-1||(e.status===Q.NOTE_ON&&t.dispatch(X.NOTE_ON,e),e.status===Q.NOTE_OFF&&t.dispatch(X.NOTE_OFF,e))}function s(e){e.isMidiLearning=i!==j.NONE,e.controlID=n.get(e.data.control),e.isMidiLearning&&(e.controlID=i),t.dispatch(X.CONTROL_CHANGE,e)}return Object.assign(t,{setCurrentChannel(e){a=e},setCurrentLearnerID(e){i=e},mapControl(e,t){n.delete(e),n.set(e,t),i=j.NONE}})}var $=nt(440),nn=new Map([[`w`,$[3][0]],[`x`,$[3][2]],[`c`,$[3][4]],[`v`,$[3][5]],[`b`,$[3][7]],[`n`,$[3][9]],[`q`,$[3][11]],[`s`,$[4][0]],[`d`,$[4][2]],[`f`,$[4][4]],[`g`,$[4][5]],[`h`,$[4][7]],[`j`,$[4][9]],[`k`,$[4][11]],[`l`,$[5][0]],[`m`,$[5][2]],[`a`,$[3][1]],[`z`,$[3][3]],[`e`,$[3][6]],[`r`,$[3][8]],[`t`,$[3][10]],[`y`,$[4][1]],[`u`,$[4][3]],[`i`,$[4][6]],[`o`,$[4][8]],[`p`,$[4][10]]]),rn=class extends Ut{constructor(){super(),this.pressedKeys=new Set,this.registerKeyDownHandler(),this.registerKeyUpHandler()}registerKeyDownHandler(){document.addEventListener(`keydown`,({key:e})=>{nn.has(e)&&!this.pressedKeys.has(e)&&(this.pressedKeys.add(e),this.dispatch(Wt.NOTE_ON,{data:{value:nn.get(e).midiValue,velocity:60,channel:-1}}))})}registerKeyUpHandler(){document.addEventListener(`keyup`,({key:e})=>{this.pressedKeys.delete(e)&&this.dispatch(Wt.NOTE_OFF,{data:{value:nn.get(e).midiValue,channel:-1}})})}},an=class extends S{constructor(){super(),this.currentLearnerID=j.NONE,this.showVizualizer=!1,this.editMode=!1,this.pressedKeys=new Set,this.audioContext=new AudioContext,this.analyzer=this.audioContext.createAnalyser(),this.voiceManager=new Gt(this.audioContext),this.state=this.voiceManager.getState()}async connectedCallback(){super.connectedCallback(),await this.audioContext.audioWorklet.addModule(`synth-processor.js`),this.voiceManager.init(),this.midiController=await tn(-1),this.setUpVoiceManager(),this.analyzer.connect(this.audioContext.destination),this.registerVoiceHandlers()}setUpVoiceManager(){this.voiceManager.setMidiController(this.midiController).setKeyBoardcontroller(new rn).connect(this.analyzer)}async onKeyOn(e){this.audioContext.state===`suspended`&&await this.audioContext.resume();let{frequency:t,midiValue:n}=e.detail;this.voiceManager.next({frequency:t,midiValue:n})}onKeyOff(e){let{midiValue:t}=e.detail;this.voiceManager.stop({midiValue:t})}registerVoiceHandlers(){this.voiceManager.subscribe(Z.NOTE_ON,e=>{this.pressedKeys.add(e.midiValue),this.pressedKeys=new Set([...this.pressedKeys.values()]),this.requestUpdate()}).subscribe(Z.NOTE_OFF,e=>{this.pressedKeys.delete(e.midiValue),this.pressedKeys=new Set([...this.pressedKeys.values()]),this.requestUpdate()}).subscribe(Z.OSC1,e=>{this.state.osc1=e,this.requestUpdate()}).subscribe(Z.OSC_MIX,e=>{this.state.osc2Amplitude=e,this.requestUpdate()}).subscribe(Z.NOISE,e=>{this.state.noiseLevel=e,this.requestUpdate()}).subscribe(Z.OSC2,e=>{this.state.osc2=e,this.requestUpdate()}).subscribe(Z.FILTER,e=>{this.state.filter=e,this.requestUpdate()}).subscribe(Z.ENVELOPE,e=>{this.state.envelope=e,this.requestUpdate()}).subscribe(Z.LFO1,e=>{this.state.lfo1=e,this.requestUpdate()}).subscribe(Z.LFO2,e=>{this.state.lfo2=e,this.requestUpdate()}).subscribe(Z.CUTOFF_MOD,e=>{this.state.cutoffMod=e,this.requestUpdate()})}onOsc1Change(e){switch(e.detail.type){case k.WAVE_FORM:this.voiceManager.setOsc1Mode(e.detail.value);break;case k.SEMI_SHIFT:this.voiceManager.setOsc1SemiShift(e.detail.value);break;case k.CENT_SHIFT:this.voiceManager.setOsc1CentShift(e.detail.value);break;case k.CYCLE:this.voiceManager.setOsc1Cycle(e.detail.value)}}onAmplitudeEnvelopeChange(e){switch(e.detail.type){case L.ATTACK:this.voiceManager.setAmplitudeEnvelopeAttack(e.detail.value);break;case L.DECAY:this.voiceManager.setAmplitudeEnvelopeDecay(e.detail.value);break;case L.SUSTAIN:this.voiceManager.setAmplitudeEnvelopeSustain(e.detail.value);break;case L.RELEASE:this.voiceManager.setAmplitudeEnvelopeRelease(e.detail.value);break}}onOscMixChange(e){switch(e.detail.type){case k.MIX:this.voiceManager.setOsc2Amplitude(e.detail.value);break;case k.NOISE:this.voiceManager.setNoiseLevel(e.detail.value);break}}onOsc2Change(e){switch(e.detail.type){case k.WAVE_FORM:this.voiceManager.setOsc2Mode(e.detail.value);break;case k.SEMI_SHIFT:this.voiceManager.setOsc2SemiShift(e.detail.value);break;case k.CENT_SHIFT:this.voiceManager.setOsc2CentShift(e.detail.value);break;case k.CYCLE:this.voiceManager.setOsc2Cycle(e.detail.value);break}}onFilterChange(e){switch(e.detail.type){case F.MODE:this.voiceManager.setFilterMode(e.detail.value);break;case F.CUTOFF:this.voiceManager.setFilterCutoff(e.detail.value);break;case F.RESONANCE:this.voiceManager.setFilterResonance(e.detail.value);break;case F.DRIVE:this.voiceManager.setDrive(e.detail.value);break}}onFilterEnvelopeChange(e){switch(e.detail.type){case z.ATTACK:this.voiceManager.setCutoffEnvelopeAttack(e.detail.value);break;case z.DECAY:this.voiceManager.setCutoffEnvelopeDecay(e.detail.value);break;case z.AMOUNT:this.voiceManager.setCutoffEnvelopeAmount(e.detail.value);break;case z.VELOCITY:this.voiceManager.setCutoffEnvelopeVelocity(e.detail.value);break}}onLfo1Change(e){switch(e.detail.type){case B.WAVE_FORM:this.voiceManager.setLfo1Mode(e.detail.value);break;case B.FREQUENCY:this.voiceManager.setLfo1Frequency(e.detail.value);break;case B.MOD_AMOUNT:this.voiceManager.setLfo1ModAmount(e.detail.value);break;case B.DESTINATION:this.voiceManager.setLfo1Destination(e.detail.value)}}onLfo2Change(e){switch(e.detail.type){case B.WAVE_FORM:this.voiceManager.setLfo2Mode(e.detail.value);break;case B.FREQUENCY:this.voiceManager.setLfo2Frequency(e.detail.value);break;case B.MOD_AMOUNT:this.voiceManager.setLfo2ModAmount(e.detail.value);break;case B.DESTINATION:this.voiceManager.setLfo2Destination(e.detail.value)}}async onMenuChange(e){let{type:t,option:n,shouldUpdate:r}=e.detail;switch(t){case G.MIDI_LEARN:this.currentLearnerID=n.value,r&&this.midiController.setCurrentLearnerID(this.currentLearnerID);break;case G.MIDI_CHANNEL:this.unlearn(),r&&this.midiController.setCurrentChannel(n.value);break;case G.PRESET:this.unlearn(),r&&(this.state=this.voiceManager.setState(n.value));break}await this.requestUpdate()}unlearn(){this.currentLearnerID=j.NONE,this.midiController.setCurrentLearnerID(this.currentLearnerID)}computeVizualizerIfEnabled(){if(this.showVizualizer)return _`
        <div class="visualizer">
          <visualizer-element
            .analyser=${this.analyzer}
            width="650"
            height="200"
          ></visualizer-element>
        </div>
      `}computeDumpButtonIfEnabled(){if(this.editMode)return _`<button @click=${this.voiceManager.dumpState}>Dump</button>`}render(){return _`
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
              .currentLearnerID=${this.currentLearnerID}
              @change=${this.onOscMixChange}
            ></oscillator-mix-element>
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${j.OSC2_SEMI}
              .centControlID=${j.OSC2_CENT}
              .cycleControlID=${j.OSC2_CYCLE}
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
              .frequencyControlID=${j.LFO1_FREQ}
              .modAmountControlID=${j.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${j.LFO2_FREQ}
              .modAmountControlID=${j.LFO2_MOD}
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
    `}};E([w({type:Object})],an.prototype,`pressedKeys`,void 0),an=E([C(`wasm-poly-element`)],an);var on=class extends S{render(){return _`<wasm-poly-element></wasm-poly-element>`}};on=E([C(`root-element`)],on);