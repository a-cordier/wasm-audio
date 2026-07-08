(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:ee,getOwnPropertyNames:te,getOwnPropertySymbols:ne,getPrototypeOf:re}=Object,ie=globalThis,ae=ie.trustedTypes,oe=ae?ae.emptyScript:``,se=ie.reactiveElementPolyfillSupport,d=(e,t)=>e,ce={toAttribute(e,t){switch(t){case Boolean:e=e?oe:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},le=(e,t)=>!l(e,t),ue={attribute:!0,type:String,converter:ce,reflect:!1,useDefault:!1,hasChanged:le};Symbol.metadata??=Symbol(`metadata`),ie.litPropertyMetadata??=new WeakMap;var f=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ue){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=ee(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ue}static _$Ei(){if(this.hasOwnProperty(d(`elementProperties`)))return;let e=re(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(d(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d(`properties`))){let e=this.properties,t=[...te(e),...ne(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?ce:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?ce:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??le)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};f.elementStyles=[],f.shadowRootOptions={mode:`open`},f[d(`elementProperties`)]=new Map,f[d(`finalized`)]=new Map,se?.({ReactiveElement:f}),(ie.reactiveElementVersions??=[]).push(`2.1.2`);var de=globalThis,fe=e=>e,pe=de.trustedTypes,me=pe?pe.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,he=`$lit$`,p=`lit$${Math.random().toFixed(9).slice(2)}$`,ge=`?`+p,_e=`<${ge}>`,m=document,h=()=>m.createComment(``),g=e=>e===null||typeof e!=`object`&&typeof e!=`function`,ve=Array.isArray,ye=e=>ve(e)||typeof e?.[Symbol.iterator]==`function`,be=`[ 	
\f\r]`,_=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,xe=/-->/g,Se=/>/g,v=RegExp(`>|${be}(?:([^\\s"'>=/]+)(${be}*=${be}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),Ce=/'/g,we=/"/g,Te=/^(?:script|style|textarea|title)$/i,y=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),b=Symbol.for(`lit-noChange`),x=Symbol.for(`lit-nothing`),Ee=new WeakMap,S=m.createTreeWalker(m,129);function De(e,t){if(!ve(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return me===void 0?t:me.createHTML(t)}var Oe=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=_;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===_?c[1]===`!--`?o=xe:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=v):(Te.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=v):o=Se:o===v?c[0]===`>`?(o=i??_,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?v:c[3]===`"`?we:Ce):o===we||o===Ce?o=v:o===xe||o===Se?o=_:(o=v,i=void 0);let ee=o===v&&e[t+1].startsWith(`/>`)?` `:``;a+=o===_?n+_e:l>=0?(r.push(s),n.slice(0,l)+he+n.slice(l)+p+ee):n+p+(l===-2?t:ee)}return[De(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},ke=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Oe(t,n);if(this.el=e.createElement(l,r),S.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=S.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(he)){let t=u[o++],n=i.getAttribute(e).split(p),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Ne:r[1]===`?`?Pe:r[1]===`@`?Fe:Me}),i.removeAttribute(e)}else e.startsWith(p)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(Te.test(i.tagName)){let e=i.textContent.split(p),t=e.length-1;if(t>0){i.textContent=pe?pe.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],h()),S.nextNode(),c.push({type:2,index:++a});i.append(e[t],h())}}}else if(i.nodeType===8)if(i.data===ge)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(p,e+1))!==-1;)c.push({type:7,index:a}),e+=p.length-1}a++}}static createElement(e,t){let n=m.createElement(`template`);return n.innerHTML=e,n}};function C(e,t,n=e,r){if(t===b)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=g(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=C(e,i._$AS(e,t.values),i,r)),t}var Ae=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??m).importNode(t,!0);S.currentNode=r;let i=S.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new je(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Ie(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=S.nextNode(),a++)}return S.currentNode=m,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},je=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=x,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=C(this,e,t),g(e)?e===x||e==null||e===``?(this._$AH!==x&&this._$AR(),this._$AH=x):e!==this._$AH&&e!==b&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ye(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==x&&g(this._$AH)?this._$AA.nextSibling.data=e:this.T(m.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=ke.createElement(De(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Ae(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Ee.get(e.strings);return t===void 0&&Ee.set(e.strings,t=new ke(e)),t}k(t){ve(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(h()),this.O(h()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=fe(e).nextSibling;fe(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Me=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=x,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=x}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=C(this,e,t,0),a=!g(e)||e!==this._$AH&&e!==b,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=C(this,r[n+o],t,o),s===b&&(s=this._$AH[o]),a||=!g(s)||s!==this._$AH[o],s===x?e=x:e!==x&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===x?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Ne=class extends Me{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===x?void 0:e}},Pe=class extends Me{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==x)}},Fe=class extends Me{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=C(this,e,t,0)??x)===b)return;let n=this._$AH,r=e===x&&n!==x||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==x&&(n===x||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ie=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){C(this,e)}},Le=de.litHtmlPolyfillSupport;Le?.(ke,je),(de.litHtmlVersions??=[]).push(`3.3.3`);var Re=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new je(t.insertBefore(h(),e),e,void 0,n??{})}return i._$AI(e),i},ze=globalThis,w=class extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Re(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return b}};w._$litElement$=!0,w.finalized=!0,ze.litElementHydrateSupport?.({LitElement:w});var Be=ze.litElementPolyfillSupport;Be?.({LitElement:w}),(ze.litElementVersions??=[]).push(`4.2.2`);var T=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ve={attribute:!0,type:String,converter:ce,reflect:!1,hasChanged:le},He=(e=Ve,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function E(e){return(t,n)=>typeof n==`object`?He(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}var Ue={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},We=e=>(...t)=>({_$litDirective$:e,values:t}),Ge=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},D=We(class extends Ge{constructor(e){if(super(e),e.type!==Ue.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return b}}),Ke=[`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`],qe=69,Je=440,Ye=Array(128);for(let e=0;e<128;e++){let t=e%12,n=Math.floor(e/12)-1,r=n>=0?`${Ke[t]}${n}`:``,i=Je*2**((e-qe)/12);Ye[e]=Object.freeze({name:r,frequency:i})}Object.freeze(Ye);function Xe(e){return Ye[e&127].frequency}function Ze(e){return e%12}function Qe(e){return Math.floor(e/12)-1}function $e(e,t=Je){return Ke.map((n,r)=>{let i=(e+1)*12+r;return{pitchClass:n,octave:e,frequency:t*2**((i-qe)/12),midiValue:i,velocity:127}}).filter(e=>e.midiValue>=0&&e.midiValue<=127)}function et(e=Je){let t=[];for(let n=0;n<10;n++)t.push($e(n,e));return t}function O(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var tt=et(440).map(nt);function nt(e){return e.map(e=>{let t=e.pitchClass.endsWith(`#`),n=t?e.pitchClass.replace(`#`,`--sharp`):e.pitchClass;return{...e,classes:{[n]:!0,"key--sharp":t,"key--whole":!t,key:!0}}})}var k=class extends w{constructor(...e){super(...e),this.lowerKey=36,this.higherKey=61,this.mouseControlledKey=null}get octaves(){return tt.slice(Qe(this.lowerKey),Qe(this.higherKey)+1)}async connectedCallback(){super.connectedCallback(),this.registerMouseUpHandler()}registerMouseUpHandler(){document.addEventListener(`mouseup`,this.mouseUp.bind(this))}mouseUp(){this.mouseControlledKey&&=(this.keyOff(this.mouseControlledKey),null)}mouseDown(e){return async t=>{t.button===0&&(this.mouseControlledKey=e,await this.keyOn(e))}}mouseEnter(e){return async()=>{this.mouseControlledKey&&(await this.keyOff(this.mouseControlledKey),this.mouseControlledKey=e,await this.keyOn(e))}}findKey(e){return tt[Qe(e)][Ze(e)]}async keyOn(e){this.pressedKeys.add(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOn`,{detail:e})),await this.requestUpdate()}async keyOff(e){this.pressedKeys.delete(e.midiValue),this.dispatchEvent(new CustomEvent(`keyOff`,{detail:e})),await this.requestUpdate()}createOctaveElement(e){return y`
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
    `}computeKeyClasses(e){return D({...e.classes,"key--pressed":this.pressedKeys&&this.pressedKeys.has(e.midiValue)})}render(){return y`
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
    `}};O([E({type:Number})],k.prototype,`lowerKey`,void 0),O([E({type:Number})],k.prototype,`higherKey`,void 0),O([E({type:Object})],k.prototype,`pressedKeys`,void 0),k=O([T(`keys-element`)],k);var rt=class extends w{constructor(...e){super(...e),this.width=1024,this.height=512}firstUpdated(){this.canvas=this.shadowRoot.getElementById(`visualizer`),this.canvasContext=this.canvas.getContext(`2d`),this.draw()}connectedCallback(){super.connectedCallback(),this.analyser.fftSize=2048*2,this.buffer=new Uint8Array(this.analyser.fftSize)}draw(){this.analyser&&this.drawOscilloscope()}drawOscilloscope(){this.canvasContext.clearRect(0,0,this.canvas.width,this.canvas.height);let e=this.canvas.width/this.analyser.fftSize*4;this.analyser.getByteTimeDomainData(this.buffer),this.canvasContext.beginPath(),this.buffer.forEach((t,n)=>{let r=t/128*(this.canvas.height/2),i=n*e;this.canvasContext.lineTo(i,r)}),this.canvasContext.lineWidth=1,this.canvasContext.strokeStyle=`#b4d455`,this.canvasContext.stroke(),requestAnimationFrame(this.drawOscilloscope.bind(this))}render(){return y`
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
    `}};O([E({attribute:!1})],rt.prototype,`analyser`,void 0),O([E({type:Number})],rt.prototype,`width`,void 0),O([E({type:Number})],rt.prototype,`height`,void 0),rt=O([T(`visualizer-element`)],rt);var A=function(e){return e[e.SINE=0]=`SINE`,e[e.SAWTOOTH=1]=`SAWTOOTH`,e[e.SQUARE=2]=`SQUARE`,e[e.TRIANGLE=3]=`TRIANGLE`,e}({}),it=class extends w{render(){return y`
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
    `}};it=O([T(`sine-wave-icon`)],it);var at=class extends w{render(){return y`
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
    `}};at=O([T(`square-wave-icon`)],at);var ot=class extends w{render(){return y`
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
    `}};ot=O([T(`saw-wave-icon`)],ot);var st=class extends w{render(){return y`
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
    `}};st=O([T(`triangle-wave-icon`)],st);var ct=class extends w{constructor(...e){super(...e),this.value=A.SINE}async onSawSelect(){this.value=A.SAWTOOTH,this.dispatchSelect()}async onSquareSelect(){this.value=A.SQUARE,this.dispatchSelect()}async onSineSelect(){this.value=A.SINE,this.dispatchSelect()}async onTriangleSelect(){this.value=A.TRIANGLE,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return y`
      <div class="wave-selector">
        <button
          class="${this.computeButtonClasses(A.SAWTOOTH)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(A.SQUARE)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(A.TRIANGLE)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(A.SINE)}"
          @click=${this.onSineSelect}
        >
          <sine-wave-icon class="icon"></sine-wave-icon>
        </button>
      </div>
    `}computeButtonClasses(e){return D({active:e===this.value})}static get styles(){return o`
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
    `}};O([E({type:Number})],ct.prototype,`value`,void 0),ct=O([T(`wave-selector-element`)],ct);var j=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.SEMI_SHIFT=1]=`SEMI_SHIFT`,e[e.CENT_SHIFT=2]=`CENT_SHIFT`,e[e.CYCLE=3]=`CYCLE`,e[e.MIX=4]=`MIX`,e[e.NOISE=5]=`NOISE`,e}({});function lt(e,t){return t>=e.max?e.max:t<=e.min?e.min:t}function ut(e,t,n){return Math.round(n.min+(e-t.min)*(n.max-n.min)/(t.max-t.min))}var dt={min:-135,max:135},ft={min:0,max:127},M=class extends w{constructor(...e){super(...e),this.range=ft,this.value=64,this.step=1,this.angle=0}async connectedCallback(){super.connectedCallback(),this.updateAngle()}toggleActive(){let e=e=>{e.preventDefault(),this.updateValue(this.computeStep(-e.movementY,e.altKey))},t=()=>{document.removeEventListener(`mouseup`,t),document.removeEventListener(`mousemove`,e)};document.addEventListener(`mousemove`,e),document.addEventListener(`mouseup`,t)}onWheel(e){e.preventDefault(),this.updateValue(this.computeStep(e.deltaY,e.altKey))}updateAngle(){this.angle=ut(this.value,this.range,dt)}updateValue(e){this.value=lt(this.range,this.value+e)}computeStep(e,t=!1){return this.computeStepMultiplier(e,t)*this.step}computeStepMultiplier(e,t=!1){let n=e<0?-1:1;return t?n*.25:n}updated(e){e.has(`value`)&&(this.updateAngle(),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}})))}render(){return y`
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
    `}};O([E({type:Object})],M.prototype,`range`,void 0),O([E({type:Number})],M.prototype,`value`,void 0),O([E({type:Number})],M.prototype,`step`,void 0),O([E({type:Number})],M.prototype,`angle`,void 0),O([E({type:String})],M.prototype,`label`,void 0),M=O([T(`knob-element`)],M);var pt=class extends w{constructor(...e){super(...e),this.label=``}render(){return y`
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
    `}};O([E({type:String})],pt.prototype,`label`,void 0),pt=O([T(`panel-wrapper-element`)],pt);var mt=class{constructor(e){this.currentOption=0,this.options=e,this.map=e.map.bind(e)}get size(){return this.options.length}set index(e){this.currentOption=e-1,this.next()}get index(){return this.currentOption}selectValue(e){let t=this.options.findIndex(t=>t.value===e);t>-1&&(this.currentOption=t)}select(e){return this.currentOption=e,this}next(){return++this.currentOption>=this.options.length&&(this.currentOption=0),this}previous(){return--this.currentOption<0&&(this.currentOption=this.options.length-1),this}getCurrent(){return this.options[this.currentOption]}},N=function(e){return e[e.NONE=-1]=`NONE`,e[e.OSC1_SEMI=0]=`OSC1_SEMI`,e[e.OSC1_CENT=1]=`OSC1_CENT`,e[e.OSC1_CYCLE=2]=`OSC1_CYCLE`,e[e.OSC_MIX=3]=`OSC_MIX`,e[e.NOISE=4]=`NOISE`,e[e.OSC2_SEMI=5]=`OSC2_SEMI`,e[e.OSC2_CENT=6]=`OSC2_CENT`,e[e.OSC2_CYCLE=7]=`OSC2_CYCLE`,e[e.CUTOFF=8]=`CUTOFF`,e[e.RESONANCE=9]=`RESONANCE`,e[e.DRIVE=10]=`DRIVE`,e[e.ATTACK=11]=`ATTACK`,e[e.DECAY=12]=`DECAY`,e[e.SUSTAIN=13]=`SUSTAIN`,e[e.RELEASE=14]=`RELEASE`,e[e.LFO1_FREQ=15]=`LFO1_FREQ`,e[e.LFO1_MOD=16]=`LFO1_MOD`,e[e.LFO2_FREQ=17]=`LFO2_FREQ`,e[e.LFO2_MOD=18]=`LFO2_MOD`,e[e.CUT_MOD=19]=`CUT_MOD`,e[e.CUT_VEL=20]=`CUT_VEL`,e[e.CUT_ATTACK=21]=`CUT_ATTACK`,e[e.CUT_DECAY=22]=`CUT_DECAY`,e}({});function P(e){return{name:N[e].replace(/_/g,` `),value:e}}var ht=new mt([P(0),P(1),P(2),P(3),P(4),P(5),P(6),P(7),P(11),P(12),P(13),P(14),P(8),P(9),P(10),P(19),P(20),P(21),P(22),P(15),P(16),P(17),P(18)]),F=class extends w{constructor(){super(),this.label=`Osc`,this.currentLearnerID=N.NONE,this.semiControlID=N.OSC1_SEMI,this.centControlID=N.OSC1_CENT,this.cycleControlID=N.OSC1_CYCLE,this.cycleRange={min:5,max:122}}connectedCallback(){super.connectedCallback()}onSemiShift(e){this.dispatchChange(j.SEMI_SHIFT,e.detail.value)}get semiShiftValue(){return this.state.semiShift.value}onCentShift(e){this.dispatchChange(j.CENT_SHIFT,e.detail.value)}get centShiftValue(){return this.state.centShift.value}onCycleChange(e){this.dispatchChange(j.CYCLE,e.detail.value)}get cycleValue(){return this.state.cycle.value}onWaveFormChange(e){this.dispatchChange(j.WAVE_FORM,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return y`
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
    `}};O([E({type:String})],F.prototype,`label`,void 0),O([E({type:Object})],F.prototype,`state`,void 0),O([E({type:Number})],F.prototype,`currentLearnerID`,void 0),O([E({type:Number})],F.prototype,`semiControlID`,void 0),O([E({type:Number})],F.prototype,`centControlID`,void 0),O([E({type:Number})],F.prototype,`cycleControlID`,void 0),F=O([T(`oscillator-element`)],F);var I=class extends w{constructor(...e){super(...e),this.currentLearnerID=N.NONE}render(){return y`
        <panel-wrapper-element class="oscillator-mix">
            <div class="oscillator-mix-control">
                <midi-control-wrapper
                .controlID=${N.OSC_MIX}
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
                .controlID=${N.NOISE}
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
    `}onMixChange(e){this.dispatchChange(j.MIX,e.detail.value)}onNoiseChange(e){this.dispatchChange(j.NOISE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}static get styles(){return o`
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
    `}};O([E({type:Number})],I.prototype,`currentLearnerID`,void 0),O([E({type:Object})],I.prototype,`mix`,void 0),O([E({type:Object})],I.prototype,`noise`,void 0),I=O([T(`oscillator-mix-element`)],I);var L=function(e){return e[e.MODE=0]=`MODE`,e[e.CUTOFF=1]=`CUTOFF`,e[e.RESONANCE=2]=`RESONANCE`,e[e.DRIVE=3]=`DRIVE`,e}({}),gt=class extends w{constructor(...e){super(...e),this.currentLearnerID=N.NONE}get hasFocus(){return this.currentLearnerID===this.controlID}render(){return y`
      <div class="${this.computeClassMap()}">
        <slot></slot>
      </div>
    `}computeClassMap(){return D({wrapper:!0,focus:this.hasFocus})}static get styles(){return o`
      .wrapper.focus {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: var(--control-hander-color-focused);  
        }
      }
    `}};O([E({type:Number})],gt.prototype,`controlID`,void 0),O([E({type:Number})],gt.prototype,`currentLearnerID`,void 0),gt=O([T(`midi-control-wrapper`)],gt);var R=function(e){return e[e.LOWPASS=0]=`LOWPASS`,e[e.LOWPASS_PLUS=1]=`LOWPASS_PLUS`,e[e.BANDPASS=2]=`BANDPASS`,e[e.HIGHPASS=3]=`HIGHPASS`,e}({}),_t=class extends w{constructor(...e){super(...e),this.value=R.LOWPASS}async onLpSelect(){this.value=R.LOWPASS,this.dispatchSelect()}async onLpPlusSelect(){this.value=R.LOWPASS_PLUS,this.dispatchSelect()}async onBpSelect(){this.value=R.BANDPASS,this.dispatchSelect()}async onHpSelect(){this.value=R.HIGHPASS,this.dispatchSelect()}dispatchSelect(){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}render(){return y`
      <div class="filter-selector">
        <button
          class="${this.computeButtonClasses(R.LOWPASS_PLUS)}"
          @click=${this.onLpPlusSelect}
        >
          L+
        </button>
        <button
          class="${this.computeButtonClasses(R.LOWPASS)}"
          @click=${this.onLpSelect}
        >
          LP
        </button>
        <button
          class="${this.computeButtonClasses(R.BANDPASS)}"
          @click=${this.onBpSelect}
        >
          BP
        </button>
        <button
          class="${this.computeButtonClasses(R.HIGHPASS)}"
          @click=${this.onHpSelect}
        >
          HP
        </button>
      </div>
    `}computeButtonClasses(e){return D({active:e===this.value})}static get styles(){return o`
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
    `}};O([E({type:Number})],_t.prototype,`value`,void 0),_t=O([T(`filter-selector-element`)],_t);var vt=class extends w{constructor(...e){super(...e),this.currentLearnerID=N.NONE}onCutoffChange(e){this.dispatchChange(L.CUTOFF,e.detail.value)}onResonanceChange(e){this.dispatchChange(L.RESONANCE,e.detail.value)}onDriveChange(e){this.dispatchChange(L.DRIVE,e.detail.value)}onTypeChange(e){this.dispatchChange(L.MODE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return y`
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
                  controlID=${N.CUTOFF}
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
                  controlID=${N.RESONANCE}
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
                  controlID=${N.DRIVE}
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
    `}};O([E({type:Object})],vt.prototype,`state`,void 0),O([E({type:Number})],vt.prototype,`currentLearnerID`,void 0),vt=O([T(`filter-element`)],vt);var z=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.SUSTAIN=2]=`SUSTAIN`,e[e.RELEASE=3]=`RELEASE`,e}({}),yt=`important`,bt=` !important`,xt=We(class extends Ge{constructor(e){if(super(e),e.type!==Ue.ATTRIBUTE||e.name!==`style`||e.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(e){return Object.keys(e).reduce((t,n)=>{let r=e[n];return r==null?t:t+`${n=n.includes(`-`)?n:n.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,`-$&`).toLowerCase()}:${r};`},``)}update(e,[t]){let{style:n}=e.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(t)),this.render(t);for(let e of this.ft)t[e]??(this.ft.delete(e),e.includes(`-`)?n.removeProperty(e):n[e]=null);for(let e in t){let r=t[e];if(r!=null){this.ft.add(e);let t=typeof r==`string`&&r.endsWith(bt);e.includes(`-`)||t?n.setProperty(e,t?r.slice(0,-11):r,t?yt:``):n[e]=r}}return b}}),St=class extends w{constructor(...e){super(...e),this.label=``,this.value=127}toggleActive(e){let t=this.shadowRoot.host.offsetParent,n=this.cursorWrapperElement,r=n.offsetHeight,i=e.pageY-(t.offsetTop+n.offsetTop);this.updateValue((1-i/r)*127);let a=e=>{e.preventDefault(),this.updateValue(this.value-e.movementY)},o=()=>{document.removeEventListener(`mouseup`,o),document.removeEventListener(`mousemove`,a)};document.addEventListener(`mousemove`,a),document.addEventListener(`mouseup`,o)}onWheel(e){e.preventDefault(),this.updateValue(this.value+e.deltaY)}updateValue(e){this.value=lt({min:0,max:127},e),this.dispatchEvent(new CustomEvent(`change`,{detail:{value:this.value}}))}computeFaderCursorStyle(){return xt({height:`${this.value/127*100}%`})}get cursorElement(){return y` <div
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
    `}};O([E({type:String})],St.prototype,`label`,void 0),O([E({type:Number})],St.prototype,`value`,void 0),St=O([T(`fader-element`)],St);var B=class extends w{constructor(...e){super(...e),this.label=`Envelope`,this.currentLearnerID=N.NONE}onAttackChange(e){this.dispatchChange(z.ATTACK,e.detail.value)}onDecayChange(e){this.dispatchChange(z.DECAY,e.detail.value)}onSustainChange(e){this.dispatchChange(z.SUSTAIN,e.detail.value)}onReleaseChange(e){this.dispatchChange(z.RELEASE,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return y`
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <midi-control-wrapper
            .controlID=${N.ATTACK}
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
            .controlID=${N.DECAY}
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
            .controlID=${N.SUSTAIN}
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
            .controlID=${N.RELEASE}
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
    `}};O([E({type:String})],B.prototype,`label`,void 0),O([E({type:Object})],B.prototype,`state`,void 0),O([E({type:Number})],B.prototype,`currentLearnerID`,void 0),B=O([T(`envelope-element`)],B);var V=function(e){return e[e.ATTACK=0]=`ATTACK`,e[e.DECAY=1]=`DECAY`,e[e.AMOUNT=2]=`AMOUNT`,e[e.VELOCITY=3]=`VELOCITY`,e}({}),Ct=class extends w{constructor(...e){super(...e),this.currentLearnerID=N.NONE}onAttackChange(e){this.dispatchChange(V.ATTACK,e.detail.value)}onDecayChange(e){this.dispatchChange(V.DECAY,e.detail.value)}onAmountChange(e){this.dispatchChange(V.AMOUNT,e.detail.value)}onVelocityChange(e){this.dispatchChange(V.VELOCITY,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return y`
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <midi-control-wrapper
              controlID=${N.CUT_ATTACK}
              currentLearnerID=${this.currentLearnerID}
            >
              <fader-element
                label="A"
                .value=${this.state.attack.value}
                @change=${this.onAttackChange}
              ></fader-element>
            </midi-control-wrapper>
            <midi-control-wrapper
              controlID=${N.CUT_DECAY}
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
                controlID=${N.CUT_MOD}
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
                controlID=${N.CUT_VEL}
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
    `}};O([E({type:Object})],Ct.prototype,`state`,void 0),O([E({type:Number})],Ct.prototype,`currentLearnerID`,void 0),Ct=O([T(`filter-envelope-element`)],Ct);var H=function(e){return e[e.WAVE_FORM=0]=`WAVE_FORM`,e[e.FREQUENCY=1]=`FREQUENCY`,e[e.MOD_AMOUNT=2]=`MOD_AMOUNT`,e[e.DESTINATION=3]=`DESTINATION`,e}({}),U=!0,W=!1,wt={A:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,U,U,U,U],[U,W,W,W,U],[U,W,W,W,U]],B:[[U,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,U,U,U,W]],C:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,U],[W,U,U,U,W]],D:[[U,U,U,W,W],[U,W,W,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,U,W],[U,U,U,W,W]],E:[[U,U,U,U,U],[U,W,W,W,W],[U,W,W,W,W],[U,U,U,U,W],[U,W,W,W,W],[U,W,W,W,W],[U,U,U,U,U]],F:[[U,U,U,U,U],[U,W,W,W,W],[U,W,W,W,W],[U,U,U,U,W],[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,W]],G:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,W],[U,W,U,U,U],[U,W,W,W,U],[U,W,W,W,U],[W,U,U,U,U]],H:[[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,U,U,U,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U]],I:[[W,U,U,U,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,U,U,U,W]],J:[[W,W,U,U,U],[W,W,W,U,W],[W,W,W,U,W],[W,W,W,U,W],[W,W,W,U,W],[U,W,W,U,W],[W,U,U,W,W]],K:[[U,W,W,W,U],[U,W,W,U,W],[U,W,U,W,W],[U,U,W,W,W],[U,W,U,W,W],[U,W,W,U,W],[U,W,W,W,U]],L:[[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,W],[U,U,U,U,U]],M:[[U,W,W,W,U],[U,U,W,U,U],[U,W,U,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U]],N:[[U,W,W,W,U],[U,W,W,W,U],[U,U,W,W,U],[U,W,U,W,U],[U,W,W,U,U],[U,W,W,W,U],[U,W,W,W,U]],O:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[W,U,U,U,W]],P:[[U,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,U,U,U,W],[U,W,W,W,W],[U,W,W,W,W],[U,W,W,W,W]],Q:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,U,W,U],[U,W,W,U,W],[W,U,U,W,U]],R:[[U,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,U,U,U,W],[U,W,U,W,W],[U,W,W,U,W],[U,W,W,W,U]],S:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,W],[W,U,U,U,W],[W,W,W,W,U],[U,W,W,W,U],[W,U,U,U,W]],T:[[U,U,U,U,U],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W]],U:[[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[W,U,U,U,W]],V:[[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[W,U,W,U,W],[W,W,U,W,W]],W:[[U,W,W,W,U],[U,W,W,W,U],[U,W,W,W,U],[U,W,U,W,U],[U,W,U,W,U],[U,W,U,W,U],[W,U,W,U,W]],X:[[U,W,W,W,U],[U,W,W,W,U],[W,U,W,U,W],[W,W,U,W,W],[W,U,W,U,W],[U,W,W,W,U],[U,W,W,W,U]],Y:[[U,W,W,W,U],[U,W,W,W,U],[W,U,W,U,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,U,W,W]],Z:[[U,U,U,U,U],[W,W,W,W,U],[W,W,W,U,W],[W,W,U,W,W],[W,U,W,W,W],[U,W,W,W,W],[U,U,U,U,U]],0:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,U,U],[U,W,U,W,U],[U,U,W,W,U],[U,W,W,W,U],[W,U,U,U,W]],1:[[W,W,U,U,W],[W,U,W,U,W],[U,W,W,U,W],[W,W,W,U,W],[W,W,W,U,W],[W,W,W,U,W],[W,W,W,U,W]],2:[[W,U,U,U,W],[U,W,W,W,U],[W,W,W,W,U],[W,W,U,U,W],[W,U,W,W,W],[U,W,W,W,W],[U,U,U,U,U]],3:[[W,U,U,U,W],[U,W,W,W,U],[W,W,W,W,U],[W,W,U,U,W],[W,W,W,W,U],[U,W,W,W,U],[W,U,U,U,W]],4:[[W,W,U,U,W],[W,U,W,U,W],[U,W,W,U,W],[U,W,W,U,W],[U,U,U,U,U],[W,W,W,U,W],[W,W,W,U,W]],5:[[U,U,U,U,U],[U,W,W,W,W],[U,W,W,W,W],[W,U,U,U,W],[W,W,W,W,U],[W,W,W,W,U],[U,U,U,U,W]],6:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,W],[U,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[W,U,U,U,W]],7:[[U,U,U,U,U],[W,W,W,W,U],[W,W,W,U,W],[W,W,U,W,W],[W,U,W,W,W],[W,U,W,W,W],[W,U,W,W,W]],8:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[W,U,U,U,W]],9:[[W,U,U,U,W],[U,W,W,W,U],[U,W,W,W,U],[U,U,U,U,U],[W,W,W,W,U],[W,W,W,W,U],[U,U,U,U,W]]," ":[[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W]],_:[[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[U,U,U,U,U]],":":[[W,W,W,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,W,W,W],[W,W,U,W,W],[W,W,U,W,W],[W,W,W,W,W]],".":[[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,W,W,W],[W,W,U,W,W],[W,W,U,W,W]]},Tt=class extends w{render(){return y`
      <div class="lcd-char">
        ${this.char.map(e=>this.createLedRow(e))}
      </div>
    `}createLedRow(e){return y`
      <div class="led-row">
        ${e.map(e=>this.createLed(e))}
      </div>
    `}createLed(e){return e?y`<div class="led on"></div>`:y`<div class="led"></div>`}static get styles(){return o`
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
    `}};O([E({type:Array})],Tt.prototype,`char`,void 0),Tt=O([T(`lcd-char-element`)],Tt);var Et=class extends w{render(){return y`
      <div class="lcd">
        ${Array.from(this.text).map(this.createLcdChar)}
      </div>
    `}createLcdChar(e){return y`
      <lcd-char-element .char=${wt[e]} class="char"></lcd-char-element>
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
    `}};O([E({type:String})],Et.prototype,`text`,void 0),Et=O([T(`lcd-element`)],Et);var Dt=class extends w{render(){return y`
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">${this.options.map(this.createOptionSelector.bind(this))}</div>
      </div>
    `}async connectedCallback(){super.connectedCallback(),this.options.selectValue(this.value)}createOptionSelector(e,t){return y`
      <button @click=${this.createOptionHandler(t)} class="${this.computeButtonClasses(t)}">${t}</button>
    `}computeButtonClasses(e){return D({active:this.options.index===e})}createOptionHandler(e){return()=>{this.options.index=e,this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}}nextOption(){this.options.next(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}previousOption(){this.options.previous(),this.requestUpdate(),this.dispatchChange(this.options.getCurrent())}dispatchChange({value:e}){this.dispatchEvent(new CustomEvent(`change`,{detail:{value:e}}))}static get styles(){return o`
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
    `}};O([E({type:Object})],Dt.prototype,`options`,void 0),O([E({type:Object})],Dt.prototype,`value`,void 0),Dt=O([T(`lcd-selector-element`)],Dt);var G=function(e){return e[e.FREQUENCY=0]=`FREQUENCY`,e[e.OSCILLATOR_MIX=1]=`OSCILLATOR_MIX`,e[e.CUTOFF=2]=`CUTOFF`,e[e.RESONANCE=3]=`RESONANCE`,e[e.OSC1_CYCLE=4]=`OSC1_CYCLE`,e[e.OSC2_CYCLE=5]=`OSC2_CYCLE`,e}({}),K=class extends w{constructor(...e){super(...e),this.label=`LFO`,this.destinations=new mt([{value:G.OSCILLATOR_MIX,name:`OSC MIX`},{value:G.FREQUENCY,name:`FREQUENCY`},{value:G.CUTOFF,name:`CUTOFF`},{value:G.OSC1_CYCLE,name:`OSC1 CYCLE`},{value:G.OSC2_CYCLE,name:`OSC2 CYCLE`}]),this.shouldMidiLearn=!1,this.currentLearnerID=N.NONE,this.frequencyControlID=N.LFO1_FREQ,this.modAmountControlID=N.LFO1_MOD}onFrequencyChange(e){this.dispatchChange(H.FREQUENCY,e.detail.value)}onModAmountChange(e){this.dispatchChange(H.MOD_AMOUNT,e.detail.value)}onWaveFormChange(e){this.dispatchChange(H.WAVE_FORM,e.detail.value)}onDestinationChange(e){this.dispatchChange(H.DESTINATION,e.detail.value)}dispatchChange(e,t){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:e,value:t}}))}render(){return y`
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
    `}};O([E({type:String})],K.prototype,`label`,void 0),O([E({type:Object})],K.prototype,`state`,void 0),O([E({type:Boolean})],K.prototype,`shouldMidiLearn`,void 0),O([E({type:Number})],K.prototype,`currentLearnerID`,void 0),O([E({type:Number})],K.prototype,`frequencyControlID`,void 0),O([E({type:Number})],K.prototype,`modAmountControlID`,void 0),K=O([T(`lfo-element`)],K);function Ot(e){return`CHANNEL:${e<10?`0${e}`:`${e}`}`}var kt=new mt([{value:-1,name:`CHANNEL:ALL`},...Array.from({length:16},(e,t)=>({value:t,name:Ot(t+1)}))]),q=function(e){return e[e.MIDI_LEARN=0]=`MIDI_LEARN`,e[e.MIDI_CHANNEL=1]=`MIDI_CHANNEL`,e[e.PRESET=2]=`PRESET`,e}({}),At=new mt([{name:`SAWSEESS`,value:{osc1:{mode:{value:1},semiShift:{id:0,value:31.75,controller:-1},centShift:{id:1,value:63.5,controller:-1},cycle:{id:2,value:63.5,controller:-1}},osc2:{mode:{value:1},semiShift:{id:5,value:63.5,controller:-1},centShift:{id:6,value:84.66666666666666,controller:-1},cycle:{id:7,value:63.5,controller:-1}},osc2Amplitude:{id:3,value:24,controller:21},noiseLevel:{id:4,value:0,controller:-1},envelope:{attack:{id:11,value:0,controller:-1},decay:{id:12,value:34.925000000000004,controller:-1},sustain:{id:13,value:0,controller:-1},release:{id:14,value:0,controller:-1}},filter:{mode:{value:0},cutoff:{id:8,value:0,controller:14},resonance:{id:9,value:127,controller:15},drive:{id:10,value:34,controller:16}},cutoffMod:{attack:{id:21,value:0,controller:19},decay:{id:22,value:9,controller:20},amount:{id:19,value:21,controller:17},velocity:{id:20,value:21,controller:18}},lfo1:{mode:{value:2},destination:{value:0},frequency:{id:15,value:15.875,controller:-1},modAmount:{id:16,value:0,controller:-1}},lfo2:{mode:{value:2},destination:{value:2},frequency:{id:17,value:31.75,controller:-1},modAmount:{id:18,value:0,controller:-1}}}},{name:`GLAZZQON`,value:{osc1:{mode:{value:2},semiShift:{id:0,value:63.5,controller:-1},centShift:{id:1,value:63.5,controller:-1},cycle:{id:2,value:50.8,controller:-1}},osc2:{mode:{value:2},semiShift:{id:5,value:127,controller:-1},centShift:{id:6,value:76.5,controller:-1},cycle:{id:7,value:73.66666666666667,controller:-1}},osc2Amplitude:{id:3,value:0,controller:21},noiseLevel:{id:4,value:0,controller:-1},envelope:{attack:{id:11,value:0,controller:19},decay:{id:12,value:2.1166666666666734,controller:-1},sustain:{id:13,value:40,controller:19},release:{id:14,value:105,controller:20}},filter:{mode:{value:0},cutoff:{id:8,value:127,controller:14},resonance:{id:9,value:0,controller:15},drive:{id:10,value:0,controller:16}},cutoffMod:{attack:{id:21,value:0,controller:-1},decay:{id:22,value:35,controller:18},amount:{id:19,value:0,controller:17},velocity:{id:20,value:0,controller:18}},lfo1:{mode:{value:0},destination:{value:4},frequency:{id:15,value:44.875,controller:-1},modAmount:{id:16,value:0,controller:-1}},lfo2:{mode:{value:0},destination:{value:5},frequency:{id:17,value:56.75,controller:-1},modAmount:{id:18,value:12,controller:-1}}}}]),jt=class extends w{constructor(...e){super(...e),this.mode=q.PRESET}render(){return y`
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
    `}computeButtonClasses(e){return D({active:this.mode===e})}createSwitchModeHandler(e){switch(e){case q.MIDI_CHANNEL:return()=>{this.mode=q.MIDI_CHANNEL,this.dispatchChange()};case q.MIDI_LEARN:return()=>{this.mode=q.MIDI_LEARN,this.dispatchChange()};case q.PRESET:return()=>{this.mode=q.PRESET,this.dispatchChange()}}}nextOption(){this.options.next(),this.dispatchChange(!0),this.requestUpdate()}previousOption(){this.options.previous(),this.dispatchChange(!0),this.requestUpdate()}dispatchChange(e=!1){this.dispatchEvent(new CustomEvent(`change`,{detail:{type:this.mode,option:this.options.getCurrent(),shouldUpdate:e}}))}get options(){switch(this.mode){case q.PRESET:return At;case q.MIDI_CHANNEL:return kt;case q.MIDI_LEARN:default:return ht}}static get styles(){return o`
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
    `}};O([E({type:Number})],jt.prototype,`mode`,void 0),jt=O([T(`menu-element`)],jt);var Mt=class extends AudioWorkletNode{constructor(e,t,n){super(e,t,n)}send(e){this.port.postMessage(e)}dispose(){this.send({type:`__dispose`}),this.disconnect()}},Nt=class{constructor(e){e instanceof SharedArrayBuffer?this.buffer=e:this.buffer=new SharedArrayBuffer(e*Float32Array.BYTES_PER_ELEMENT),this.view=new Float32Array(this.buffer)}get length(){return this.view.length}set(e,t){this.view[e]=t}get(e){return this.view[e]}},Pt=8;function Ft(e){return(e.status&15)<<20|(e.channel&15)<<16|(e.data1&127)<<8|e.data2&127}var It=class{constructor(e){if(e instanceof SharedArrayBuffer)this.buffer=e,this.capacity=(e.byteLength-Pt)/(4*Float32Array.BYTES_PER_ELEMENT);else{this.capacity=e;let t=Pt+e*4*Float32Array.BYTES_PER_ELEMENT;this.buffer=new SharedArrayBuffer(t)}this.heads=new Int32Array(this.buffer,0,2),this.data=new Float32Array(this.buffer,Pt)}enqueue(e,t=0){let n=Atomics.load(this.heads,1),r=(n+1)%this.capacity;if(r===Atomics.load(this.heads,0))return!1;let i=n*4;return this.data[i]=Ft(e),this.data[i+1]=e.timestamp,this.data[i+2]=t,this.data[i+3]=0,Atomics.store(this.heads,1,r),!0}dequeue(e){let t=Atomics.load(this.heads,0);if(t===Atomics.load(this.heads,1))return!1;let n=t*4;return e[0]=this.data[n],e[1]=this.data[n+1],e[2]=this.data[n+2],e[3]=this.data[n+3],Atomics.store(this.heads,0,(t+1)%this.capacity),!0}enqueueRaw(e,t,n,r,i,a=0){let o=Atomics.load(this.heads,1),s=(o+1)%this.capacity;if(s===Atomics.load(this.heads,0))return!1;let c=(e&15)<<20|(t&15)<<16|(n&127)<<8|r&127,l=o*4;return this.data[l]=c,this.data[l+1]=i,this.data[l+2]=a,this.data[l+3]=0,Atomics.store(this.heads,1,s),!0}},J=function(e){return e[e.NOTE_OFF=8]=`NOTE_OFF`,e[e.NOTE_ON=9]=`NOTE_ON`,e[e.POLY_AFTERTOUCH=10]=`POLY_AFTERTOUCH`,e[e.CONTROL_CHANGE=11]=`CONTROL_CHANGE`,e[e.PROGRAM_CHANGE=12]=`PROGRAM_CHANGE`,e[e.CHANNEL_AFTERTOUCH=13]=`CHANNEL_AFTERTOUCH`,e[e.PITCH_BEND=14]=`PITCH_BEND`,e}({}),Y=Object.freeze({OSC1_MODE:0,OSC2_MODE:1,FILTER_MODE:2,LFO1_MODE:3,LFO1_DESTINATION:4,LFO2_MODE:5,LFO2_DESTINATION:6,AMPLITUDE_ATTACK:7,AMPLITUDE_DECAY:8,AMPLITUDE_SUSTAIN:9,AMPLITUDE_RELEASE:10,OSC1_SEMI_SHIFT:11,OSC1_CENT_SHIFT:12,OSC1_CYCLE:13,OSC2_SEMI_SHIFT:14,OSC2_CENT_SHIFT:15,OSC2_CYCLE:16,OSC2_AMPLITUDE:17,NOISE_LEVEL:18,CUTOFF:19,RESONANCE:20,DRIVE:21,CUTOFF_ENV_AMOUNT:22,CUTOFF_ENV_VELOCITY:23,CUTOFF_ENV_ATTACK:24,CUTOFF_ENV_DECAY:25,LFO1_FREQUENCY:26,LFO1_MOD_AMOUNT:27,LFO2_FREQUENCY:28,LFO2_MOD_AMOUNT:29}),Lt=30,Rt=64,X=Object.freeze([1,0,2,3]),zt=Object.freeze([0,1,3,2]),Bt=class extends Mt{get midiBuffer(){return this.midiRing.buffer}constructor(e){super(e,`synth`,{outputChannelCount:[2]}),this.params=new Nt(Lt),this.midiRing=new It(Rt),this.send({type:`__init_sab`,paramBuffer:this.params.buffer,midiBuffer:this.midiRing.buffer})}receive(e){let t=e.status===J.NOTE_ON||e.status===J.NOTE_OFF?Xe(e.data1):0;this.midiRing.enqueue(e,t)}noteOn(e,t,n){this.midiRing.enqueueRaw(J.NOTE_ON,0,e,n,performance.now(),t)}noteOff(e){this.midiRing.enqueueRaw(J.NOTE_OFF,0,e,0,performance.now(),0)}setParam(e,t){this.params.set(e,t)}},Z=class{constructor(e){this.value=e,this.clone=this.clone.bind(this)}clone(){return{...this}}},Q=class{constructor(e,t,n=-1){this.id=e,this.value=t,this.controller=n,this.clone=this.clone.bind(this)}clone(){return{...this}}};function Vt(e){let t=[];for(let n of Object.values(e))n instanceof Q?t.push([n.id,n]):n instanceof Object&&t.push(...Vt(n));return t}function Ht(e){let t=Vt(e);return new Map(t)}function Ut(e){return{osc1:{mode:new Z(e.osc1.mode.value),semiShift:new Q(N.OSC1_SEMI,e.osc1.semiShift.value,e.osc1.semiShift.controller),centShift:new Q(N.OSC1_CENT,e.osc1.centShift.value,e.osc1.centShift.controller),cycle:new Q(N.OSC1_CYCLE,e.osc1.cycle.value,e.osc1.cycle.controller)},osc2:{mode:new Z(e.osc2.mode.value),semiShift:new Q(N.OSC2_SEMI,e.osc2.semiShift.value,e.osc2.semiShift.controller),centShift:new Q(N.OSC2_CENT,e.osc2.centShift.value,e.osc2.centShift.controller),cycle:new Q(N.OSC2_CYCLE,e.osc2.cycle.value,e.osc2.cycle.controller)},osc2Amplitude:new Q(N.OSC_MIX,e.osc2Amplitude.value,e.osc2Amplitude.controller),noiseLevel:new Q(N.NOISE,e.noiseLevel.value,e.noiseLevel.controller),envelope:{attack:new Q(N.ATTACK,e.envelope.attack.value,e.envelope.attack.controller),decay:new Q(N.DECAY,e.envelope.decay.value,e.envelope.decay.controller),sustain:new Q(N.SUSTAIN,e.envelope.sustain.value,e.envelope.sustain.controller),release:new Q(N.RELEASE,e.envelope.release.value,e.envelope.release.controller)},filter:{mode:new Z(e.filter.mode.value),cutoff:new Q(N.CUTOFF,e.filter.cutoff.value,e.filter.cutoff.controller),resonance:new Q(N.RESONANCE,e.filter.resonance.value,e.filter.resonance.controller),drive:new Q(N.DRIVE,e.filter.drive.value,e.filter.drive.controller)},cutoffMod:{attack:new Q(N.CUT_ATTACK,e.cutoffMod.attack.value,e.cutoffMod.attack.controller),decay:new Q(N.CUT_DECAY,e.cutoffMod.decay.value,e.cutoffMod.decay.controller),amount:new Q(N.CUT_MOD,e.cutoffMod.amount.value,e.cutoffMod.amount.controller),velocity:new Q(N.CUT_VEL,e.cutoffMod.velocity.value,e.cutoffMod.velocity.controller)},lfo1:{mode:new Z(e.lfo1.mode.value),destination:new Z(e.lfo1.destination.value),frequency:new Q(N.LFO1_FREQ,e.lfo1.frequency.value,e.lfo1.frequency.controller),modAmount:new Q(N.LFO1_MOD,e.lfo1.modAmount.value,e.lfo1.modAmount.controller)},lfo2:{mode:new Z(e.lfo2.mode.value),destination:new Z(e.lfo2.destination.value),frequency:new Q(N.LFO2_FREQ,e.lfo2.frequency.value,e.lfo2.frequency.controller),modAmount:new Q(N.LFO2_MOD,e.lfo2.modAmount.value,e.lfo2.modAmount.controller)}}}function Wt(e){let t=Ut(e),n=Ht(t);return Object.assign(t,{findMidiControlById(e){return n.get(e)},getMidiControls(){return n.values()}})}var Gt=class extends EventTarget{constructor(...e){super(...e),this.observers=new Map}dispatch(e,t){return this.dispatchEvent(new CustomEvent(e,{detail:t})),this}subscribe(e,t){let n=e=>{t(e.detail)};return this.observers.set(t,n),this.addEventListener(e,n),this}unsubscribe(e,t){return this.removeEventListener(e,this.observers.get(t)),this.observers.delete(t),this}};new Gt,J.NOTE_ON;function Kt(e,t,n){if(e.length===0)return!1;let r=e[0];return r>=240?!1:(n.status=r>>4,n.channel=r&15,n.timestamp=t,n.data1=e.length>1?e[1]:0,n.data2=e.length>2?e[2]:0,!0)}function qt(e){return e.status===J.NOTE_ON&&e.data2>0}function Jt(e){return e.status===J.NOTE_OFF||e.status===J.NOTE_ON&&e.data2===0}function Yt(e){return e.status===J.CONTROL_CHANGE}var $=function(e){return e.NOTE_ON=`NOTE_ON`,e.NOTE_OFF=`NOTE_OFF`,e.OSC1=`OSC1`,e.OSC_MIX=`OSC_MIX`,e.NOISE=`NOISE`,e.OSC2=`OSC2`,e.FILTER=`FILTER`,e.ENVELOPE=`ENVELOPE`,e.LFO1=`LFO1`,e.LFO2=`LFO2`,e.CUTOFF_MOD=`CUTOFF_MOD`,e}({}),Xt=class extends Gt{constructor(e){super(),this.synthNode=null,this.controlMap=new Map,this.currentLearnerID=N.NONE,this.busSubscription=null,this.audioContext=e,this.output=new GainNode(e),this.setState(Wt(At.getCurrent().value))}init(){this.synthNode=new Bt(this.audioContext),this.synthNode.connect(this.output),this.syncParams()}connectBus(e){return this.busSubscription=e.subscribe(e=>this.receive(e)),this}receive(e){if(qt(e)){let t=Xe(e.data1);this.synthNode?.noteOn(e.data1,t,e.data2),this.dispatch($.NOTE_ON,{midiValue:e.data1,frequency:t,velocity:e.data2})}else Jt(e)?(this.synthNode?.noteOff(e.data1),this.dispatch($.NOTE_OFF,{midiValue:e.data1})):Yt(e)&&this.handleCC(e.data1,e.data2)}next({frequency:e,midiValue:t,velocity:n=60}){this.synthNode?.noteOn(t,e,n)}stop({midiValue:e}){this.synthNode?.noteOff(e)}connect(e){this.output.connect(e)}setLearnerID(e){this.currentLearnerID=e}mapControl(e,t){this.controlMap.set(e,t),this.currentLearnerID=N.NONE}handleCC(e,t){let n=this.currentLearnerID!==N.NONE,r=this.controlMap.get(e);if(n&&(r=this.currentLearnerID,this.controlMap.set(e,r),this.currentLearnerID=N.NONE),r===void 0)return;let i=this.state.findMidiControlById(r);i&&(i.controller=e,i.value=t,this.dispatchCC(i))}dispatchCC(e){switch(e.id){case N.OSC1_SEMI:return this.sendParam(Y.OSC1_SEMI_SHIFT,e.value),this.dispatch($.OSC1,{...this.state.osc1,semiShift:e.clone()});case N.OSC1_CENT:return this.sendParam(Y.OSC1_CENT_SHIFT,e.value),this.dispatch($.OSC1,{...this.state.osc1,centShift:e.clone()});case N.OSC1_CYCLE:return this.sendParam(Y.OSC1_CYCLE,e.value),this.dispatch($.OSC1,{...this.state.osc1,cycle:e.clone()});case N.OSC2_SEMI:return this.sendParam(Y.OSC2_SEMI_SHIFT,e.value),this.dispatch($.OSC2,{...this.state.osc2,semiShift:e.clone()});case N.OSC2_CENT:return this.sendParam(Y.OSC2_CENT_SHIFT,e.value),this.dispatch($.OSC2,{...this.state.osc2,centShift:e.clone()});case N.OSC2_CYCLE:return this.sendParam(Y.OSC2_CYCLE,e.value),this.dispatch($.OSC2,{...this.state.osc2,cycle:e.clone()});case N.OSC_MIX:return this.sendParam(Y.OSC2_AMPLITUDE,e.value),this.dispatch($.OSC_MIX,e.clone());case N.NOISE:return this.sendParam(Y.NOISE_LEVEL,e.value),this.dispatch($.NOISE,e.clone());case N.CUTOFF:return this.sendParam(Y.CUTOFF,e.value),this.dispatch($.FILTER,{...this.state.filter,cutoff:e.clone()});case N.RESONANCE:return this.sendParam(Y.RESONANCE,e.value),this.dispatch($.FILTER,{...this.state.filter,resonance:e.clone()});case N.DRIVE:return this.sendParam(Y.DRIVE,e.value),this.dispatch($.FILTER,{...this.state.filter,drive:e.clone()});case N.ATTACK:return this.sendParam(Y.AMPLITUDE_ATTACK,e.value),this.dispatch($.ENVELOPE,{...this.state.envelope,attack:e.clone()});case N.DECAY:return this.sendParam(Y.AMPLITUDE_DECAY,e.value),this.dispatch($.ENVELOPE,{...this.state.envelope,decay:e.clone()});case N.SUSTAIN:return this.sendParam(Y.AMPLITUDE_SUSTAIN,e.value),this.dispatch($.ENVELOPE,{...this.state.envelope,sustain:e.clone()});case N.RELEASE:return this.sendParam(Y.AMPLITUDE_RELEASE,e.value),this.dispatch($.ENVELOPE,{...this.state.envelope,release:e.clone()});case N.LFO1_FREQ:return this.sendParam(Y.LFO1_FREQUENCY,e.value),this.dispatch($.LFO1,{...this.state.lfo1,frequency:e.clone()});case N.LFO1_MOD:return this.sendParam(Y.LFO1_MOD_AMOUNT,e.value),this.dispatch($.LFO1,{...this.state.lfo1,modAmount:e.clone()});case N.LFO2_FREQ:return this.sendParam(Y.LFO2_FREQUENCY,e.value),this.dispatch($.LFO2,{...this.state.lfo2,frequency:e.clone()});case N.LFO2_MOD:return this.sendParam(Y.LFO2_MOD_AMOUNT,e.value),this.dispatch($.LFO2,{...this.state.lfo2,modAmount:e.clone()});case N.CUT_ATTACK:return this.sendParam(Y.CUTOFF_ENV_ATTACK,e.value),this.dispatch($.CUTOFF_MOD,{...this.state.cutoffMod,attack:e.clone()});case N.CUT_DECAY:return this.sendParam(Y.CUTOFF_ENV_DECAY,e.value),this.dispatch($.CUTOFF_MOD,{...this.state.cutoffMod,decay:e.clone()});case N.CUT_MOD:return this.sendParam(Y.CUTOFF_ENV_AMOUNT,e.value),this.dispatch($.CUTOFF_MOD,{...this.state.cutoffMod,amount:e.clone()});case N.CUT_VEL:return this.sendParam(Y.CUTOFF_ENV_VELOCITY,e.value),this.dispatch($.CUTOFF_MOD,{...this.state.cutoffMod,velocity:e.clone()})}}getState(){return{...this.state}}setState(e){return this.state=Wt(e),this.bindMidiControls(),this.syncParams(),this.getState()}bindMidiControls(){if(this.state){this.controlMap.clear();for(let e of this.state.getMidiControls())e.controller>=0&&this.controlMap.set(e.controller,e.id)}}setOsc1Mode(e){return this.state.osc1.mode.value=e,this.sendParam(Y.OSC1_MODE,X[e]),this}setOsc1SemiShift(e){return this.state.osc1.semiShift.value=e,this.sendParam(Y.OSC1_SEMI_SHIFT,e),this}setOsc1CentShift(e){return this.state.osc1.centShift.value=e,this.sendParam(Y.OSC1_CENT_SHIFT,e),this}setOsc1Cycle(e){return this.state.osc1.cycle.value=e,this.sendParam(Y.OSC1_CYCLE,e),this}get osc1(){return this.state.osc1}setOsc2Mode(e){return this.state.osc2.mode.value=e,this.sendParam(Y.OSC2_MODE,X[e]),this}setOsc2SemiShift(e){return this.state.osc2.semiShift.value=e,this.sendParam(Y.OSC2_SEMI_SHIFT,e),this}setOsc2CentShift(e){return this.state.osc2.centShift.value=e,this.sendParam(Y.OSC2_CENT_SHIFT,e),this}setOsc2Cycle(e){return this.state.osc2.cycle.value=e,this.sendParam(Y.OSC2_CYCLE,e),this}get osc2(){return this.state.osc2}setNoiseLevel(e){return this.state.noiseLevel.value=e,this.sendParam(Y.NOISE_LEVEL,e),this}setAmplitudeEnvelopeAttack(e){return this.state.envelope.attack.value=e,this.sendParam(Y.AMPLITUDE_ATTACK,e),this}setAmplitudeEnvelopeDecay(e){return this.state.envelope.decay.value=e,this.sendParam(Y.AMPLITUDE_DECAY,e),this}setAmplitudeEnvelopeSustain(e){return this.state.envelope.sustain.value=e,this.sendParam(Y.AMPLITUDE_SUSTAIN,e),this}setAmplitudeEnvelopeRelease(e){return this.state.envelope.release.value=e,this.sendParam(Y.AMPLITUDE_RELEASE,e),this}get envelope(){return this.state.envelope}setOsc2Amplitude(e){return this.state.osc2Amplitude.value=e,this.sendParam(Y.OSC2_AMPLITUDE,e),this}get osc2Amplitude(){return this.state.osc2Amplitude}setFilterMode(e){return this.state.filter.mode.value=e,this.sendParam(Y.FILTER_MODE,zt[e]),this}setFilterCutoff(e){return this.state.filter.cutoff.value=e,this.sendParam(Y.CUTOFF,e),this}setFilterResonance(e){return this.state.filter.resonance.value=e,this.sendParam(Y.RESONANCE,e),this}setDrive(e){return this.state.filter.drive.value=e,this.sendParam(Y.DRIVE,e),this}get filter(){return this.state.filter}setCutoffEnvelopeAmount(e){return this.state.cutoffMod.amount.value=e,this.sendParam(Y.CUTOFF_ENV_AMOUNT,e),this}setCutoffEnvelopeVelocity(e){return this.state.cutoffMod.velocity.value=e,this.sendParam(Y.CUTOFF_ENV_VELOCITY,e),this}setCutoffEnvelopeAttack(e){return this.state.cutoffMod.attack.value=e,this.sendParam(Y.CUTOFF_ENV_ATTACK,e),this}setCutoffEnvelopeDecay(e){return this.state.cutoffMod.decay.value=e,this.sendParam(Y.CUTOFF_ENV_DECAY,e),this}setLfo1Mode(e){return this.state.lfo1.mode.value=e,this.sendParam(Y.LFO1_MODE,X[e]),this}get lfo1(){return this.state.lfo1}setLfo1Destination(e){return this.state.lfo1.destination.value=e,this.sendParam(Y.LFO1_DESTINATION,e),this}setLfo1Frequency(e){return this.state.lfo1.frequency.value=e,this.sendParam(Y.LFO1_FREQUENCY,e),this}setLfo1ModAmount(e){return this.state.lfo1.modAmount.value=e,this.sendParam(Y.LFO1_MOD_AMOUNT,e),this}get lfo2(){return this.state.lfo2}setLfo2Mode(e){return this.state.lfo2.mode.value=e,this.sendParam(Y.LFO2_MODE,X[e]),this}setLfo2Destination(e){return this.state.lfo2.destination.value=e,this.sendParam(Y.LFO2_DESTINATION,e),this}setLfo2Frequency(e){return this.state.lfo2.frequency.value=e,this.sendParam(Y.LFO2_FREQUENCY,e),this}setLfo2ModAmount(e){return this.state.lfo2.modAmount.value=e,this.sendParam(Y.LFO2_MOD_AMOUNT,e),this}get cutoffMod(){return this.state.cutoffMod}dumpState(){console.log(JSON.stringify(this.state))}sendParam(e,t){this.synthNode?.setParam(e,t)}syncParams(){if(!this.synthNode)return;let e=this.state;this.sendParam(Y.OSC1_MODE,X[e.osc1.mode.value]),this.sendParam(Y.OSC1_SEMI_SHIFT,e.osc1.semiShift.value),this.sendParam(Y.OSC1_CENT_SHIFT,e.osc1.centShift.value),this.sendParam(Y.OSC1_CYCLE,e.osc1.cycle.value),this.sendParam(Y.OSC2_MODE,X[e.osc2.mode.value]),this.sendParam(Y.OSC2_SEMI_SHIFT,e.osc2.semiShift.value),this.sendParam(Y.OSC2_CENT_SHIFT,e.osc2.centShift.value),this.sendParam(Y.OSC2_CYCLE,e.osc2.cycle.value),this.sendParam(Y.OSC2_AMPLITUDE,e.osc2Amplitude.value),this.sendParam(Y.NOISE_LEVEL,e.noiseLevel.value),this.sendParam(Y.AMPLITUDE_ATTACK,e.envelope.attack.value),this.sendParam(Y.AMPLITUDE_DECAY,e.envelope.decay.value),this.sendParam(Y.AMPLITUDE_SUSTAIN,e.envelope.sustain.value),this.sendParam(Y.AMPLITUDE_RELEASE,e.envelope.release.value),this.sendParam(Y.FILTER_MODE,zt[e.filter.mode.value]),this.sendParam(Y.CUTOFF,e.filter.cutoff.value),this.sendParam(Y.RESONANCE,e.filter.resonance.value),this.sendParam(Y.DRIVE,e.filter.drive.value),this.sendParam(Y.CUTOFF_ENV_AMOUNT,e.cutoffMod.amount.value),this.sendParam(Y.CUTOFF_ENV_VELOCITY,e.cutoffMod.velocity.value),this.sendParam(Y.CUTOFF_ENV_ATTACK,e.cutoffMod.attack.value),this.sendParam(Y.CUTOFF_ENV_DECAY,e.cutoffMod.decay.value),this.sendParam(Y.LFO1_MODE,X[e.lfo1.mode.value]),this.sendParam(Y.LFO1_DESTINATION,e.lfo1.destination.value),this.sendParam(Y.LFO1_FREQUENCY,e.lfo1.frequency.value),this.sendParam(Y.LFO1_MOD_AMOUNT,e.lfo1.modAmount.value),this.sendParam(Y.LFO2_MODE,X[e.lfo2.mode.value]),this.sendParam(Y.LFO2_DESTINATION,e.lfo2.destination.value),this.sendParam(Y.LFO2_FREQUENCY,e.lfo2.frequency.value),this.sendParam(Y.LFO2_MOD_AMOUNT,e.lfo2.modAmount.value)}},Zt=class{constructor(e){this.connections=[],this.decodeBuffer={status:J.NOTE_ON,channel:0,data1:0,data2:0,timestamp:0},this.onMessage=e=>{if(Kt(e.data,e.timeStamp,this.decodeBuffer))for(let e=0,t=this.connections.length;e<t;e++){let t=this.connections[e];this.matchesFilter(t.filter)&&t.target.receive(this.decodeBuffer)}},this.port=e,this.id=e.id,this.name=e.name??`Unknown`,this.manufacturer=e.manufacturer??``,this.port.onmidimessage=this.onMessage}connect(e,t){let n={target:e,filter:t};return this.connections.push(n),{dispose:()=>{let e=this.connections.indexOf(n);e!==-1&&(this.connections[e]=this.connections[this.connections.length-1],this.connections.pop())}}}disconnect(){this.port.onmidimessage=null,this.connections.length=0}matchesFilter(e){if(!e)return!0;if(e.channel!==void 0){if(Array.isArray(e.channel)){if(!e.channel.includes(this.decodeBuffer.channel))return!1}else if(e.channel!==this.decodeBuffer.channel)return!1}if(e.status!==void 0){if(Array.isArray(e.status)){if(!e.status.includes(this.decodeBuffer.status))return!1}else if(e.status!==this.decodeBuffer.status)return!1}return!0}},Qt=class{constructor(e){this.sendBuf3=new Uint8Array(3),this.sendBuf2=new Uint8Array(2),this.port=e,this.id=e.id,this.name=e.name??`Unknown`,this.manufacturer=e.manufacturer??``}receive(e){let t=e.status<<4|e.channel;e.status===J.PROGRAM_CHANGE||e.status===J.CHANNEL_AFTERTOUCH?(this.sendBuf2[0]=t,this.sendBuf2[1]=e.data1,this.port.send(this.sendBuf2,e.timestamp)):(this.sendBuf3[0]=t,this.sendBuf3[1]=e.data1,this.sendBuf3[2]=e.data2,this.port.send(this.sendBuf3,e.timestamp))}disconnect(){this.port.close()}},$t=class{constructor(){this.inputs=new Map,this.outputs=new Map,this.midiAccess=null,this.listeners=[],this.onStateChange=e=>{let t=e.port;if(t){if(t.type===`input`){if(t.state===`connected`&&!this.inputs.has(t.id)){let e=this.registerInput(t);this.notify(e,`connected`)}else if(t.state===`disconnected`&&this.inputs.has(t.id)){let e=this.inputs.get(t.id);e.disconnect(),this.inputs.delete(t.id),this.notify(e,`disconnected`)}}else if(t.type===`output`){if(t.state===`connected`&&!this.outputs.has(t.id)){let e=this.registerOutput(t);this.notify(e,`connected`)}else if(t.state===`disconnected`&&this.outputs.has(t.id)){let e=this.outputs.get(t.id);e.disconnect(),this.outputs.delete(t.id),this.notify(e,`disconnected`)}}}}}async init(e){if(!navigator.requestMIDIAccess)throw Error(`Web MIDI API not supported in this browser`);return this.midiAccess=await navigator.requestMIDIAccess(e??{sysex:!1}),this.midiAccess.onstatechange=this.onStateChange,this.midiAccess.inputs.forEach(e=>this.registerInput(e)),this.midiAccess.outputs.forEach(e=>this.registerOutput(e)),this}findInput(e){let t=e.toLowerCase();for(let e of this.inputs.values())if(e.name.toLowerCase().includes(t))return e}findOutput(e){let t=e.toLowerCase();for(let e of this.outputs.values())if(e.name.toLowerCase().includes(t))return e}onPortChange(e){return this.listeners.push(e),()=>{let t=this.listeners.indexOf(e);t!==-1&&this.listeners.splice(t,1)}}destroy(){this.midiAccess&&(this.midiAccess.onstatechange=null);for(let e of this.inputs.values())e.disconnect();for(let e of this.outputs.values())e.disconnect();this.inputs.clear(),this.outputs.clear(),this.listeners.length=0}registerInput(e){let t=new Zt(e);return this.inputs.set(e.id,t),t}registerOutput(e){let t=new Qt(e);return this.outputs.set(e.id,t),t}notify(e,t){for(let n of this.listeners)n(e,t)}};function en(e){if(!e?.channel)return 65535;let t=Array.isArray(e.channel)?e.channel:[e.channel],n=0;for(let e of t)n|=1<<e;return n}function tn(e){if(!e?.status)return 127;let t=Array.isArray(e.status)?e.status:[e.status],n=0;for(let e of t)n|=1<<e-8;return n}var nn=class{constructor(){this.routes=[]}addRoute(e,t){let n={channelMask:en(t),statusMask:tn(t),handler:e};return this.routes.push(n),{dispose:()=>{let e=this.routes.indexOf(n);e!==-1&&(this.routes[e]=this.routes[this.routes.length-1],this.routes.pop())}}}dispatch(e){let t=1<<e.channel,n=1<<e.status-8;for(let r=0,i=this.routes.length;r<i;r++){let i=this.routes[r];i.channelMask&t&&i.statusMask&n&&i.handler(e)}}get routeCount(){return this.routes.length}clear(){this.routes.length=0}},rn=class{constructor(e){this.dispatcher=new nn,this.ringTargets=[],this.name=e}receive(e){this.dispatcher.dispatch(e),this.dispatchToRings(e)}send(e,t,n,r,i=performance.now()){let a={status:e,channel:t,data1:n,data2:r,timestamp:i};this.receive(a)}subscribe(e,t){return this.dispatcher.addRoute(e,t)}from(e,t){return e.connect(this,t)}subscribeRing(e,t){let n={ring:e,channelMask:t?.channel?Array.isArray(t.channel)?t.channel.reduce((e,t)=>e|1<<t,0):1<<t.channel:65535,statusMask:t?.status?Array.isArray(t.status)?t.status.reduce((e,t)=>e|1<<t-8,0):1<<t.status-8:127};return this.ringTargets.push(n),{dispose:()=>{let e=this.ringTargets.indexOf(n);e!==-1&&(this.ringTargets[e]=this.ringTargets[this.ringTargets.length-1],this.ringTargets.pop())}}}dispatchToRings(e){let t=1<<e.channel,n=1<<e.status-8;for(let r=0,i=this.ringTargets.length;r<i;r++){let i=this.ringTargets[r];if(i.channelMask&t&&i.statusMask&n){let t=e.status===J.NOTE_ON||e.status===J.NOTE_OFF?Xe(e.data1):0;i.ring.enqueue(e,t)}}}},an=class{constructor(e){this.port=e}channel(e){return this.channelFilter=e,this}notes(){return this.statusFilter=[J.NOTE_ON,J.NOTE_OFF],this}cc(){return this.statusFilter=J.CONTROL_CHANGE,this}pitchBend(){return this.statusFilter=J.PITCH_BEND,this}all(){return this.channelFilter=void 0,this.statusFilter=void 0,this}to(e){let t={};return this.channelFilter!==void 0&&(t.channel=this.channelFilter),this.statusFilter!==void 0&&(t.status=this.statusFilter),this.port.connect(e,Object.keys(t).length>0?t:void 0)}},on=class{constructor(e){this.buses=new Map,this.devices=e}input(e){let t=this.devices.findInput(e);if(!t)throw Error(`MIDI input "${e}" not found. Available: ${this.inputNames().join(`, `)}`);return new an(t)}output(e){let t=this.devices.findOutput(e);if(!t)throw Error(`MIDI output "${e}" not found. Available: ${this.outputNames().join(`, `)}`);return t}bus(e){let t=this.buses.get(e);return t||(t=new rn(e),this.buses.set(e,t)),t}inputNames(){return[...this.devices.inputs.values()].map(e=>e.name)}outputNames(){return[...this.devices.outputs.values()].map(e=>e.name)}onPortChange(e){return this.devices.onPortChange(e)}destroy(){this.devices.destroy(),this.buses.clear()}};async function sn(e){let t=new $t;return await t.init(e),new on(t)}var cn=60,ln=0,un=new Map([[`w`,48],[`x`,50],[`c`,52],[`v`,53],[`b`,55],[`n`,57],[`q`,59],[`s`,60],[`d`,62],[`f`,64],[`g`,65],[`h`,67],[`j`,69],[`k`,71],[`l`,72],[`m`,74],[`a`,49],[`z`,51],[`e`,54],[`r`,56],[`t`,58],[`y`,61],[`u`,63],[`i`,66],[`o`,68],[`p`,70]]),dn=class{constructor(){this.pressedKeys=new Set,this.connections=[],this.event={status:J.NOTE_ON,channel:ln,data1:0,data2:cn,timestamp:0},this.onKeyDown=e=>{let t=un.get(e.key);t===void 0||this.pressedKeys.has(e.key)||(this.pressedKeys.add(e.key),this.event.status=J.NOTE_ON,this.event.data1=t,this.event.data2=cn,this.event.timestamp=performance.now(),this.dispatch())},this.onKeyUp=e=>{if(!this.pressedKeys.delete(e.key))return;let t=un.get(e.key);t!==void 0&&(this.event.status=J.NOTE_OFF,this.event.data1=t,this.event.data2=0,this.event.timestamp=performance.now(),this.dispatch())},document.addEventListener(`keydown`,this.onKeyDown),document.addEventListener(`keyup`,this.onKeyUp)}connect(e,t){let n={target:e,filter:t};return this.connections.push(n),{dispose:()=>{let e=this.connections.indexOf(n);e!==-1&&(this.connections[e]=this.connections[this.connections.length-1],this.connections.pop())}}}destroy(){document.removeEventListener(`keydown`,this.onKeyDown),document.removeEventListener(`keyup`,this.onKeyUp),this.connections.length=0}dispatch(){for(let e=0,t=this.connections.length;e<t;e++)this.connections[e].target.receive(this.event)}},fn=class extends w{constructor(){super(),this.currentLearnerID=N.NONE,this.showVizualizer=!1,this.editMode=!1,this.pressedKeys=new Set,this.audioContext=new AudioContext,this.analyzer=this.audioContext.createAnalyser(),this.voiceManager=new Xt(this.audioContext),this.state=this.voiceManager.getState()}async connectedCallback(){super.connectedCallback(),await this.audioContext.audioWorklet.addModule(`synth-processor.js`),this.voiceManager.init(),this.midi=await sn(),this.midiBus=this.midi.bus(`main`),this.setUpVoiceManager(),this.analyzer.connect(this.audioContext.destination),this.registerVoiceHandlers()}setUpVoiceManager(){for(let e of this.midi.devices.inputs.values())e.connect(this.midiBus);this.midi.onPortChange((e,t)=>{t===`connected`&&`connect`in e&&e.connect(this.midiBus)}),new dn().connect(this.midiBus),this.voiceManager.connectBus(this.midiBus).connect(this.analyzer)}async onKeyOn(e){this.audioContext.state===`suspended`&&await this.audioContext.resume();let{frequency:t,midiValue:n}=e.detail;this.voiceManager.next({frequency:t,midiValue:n})}onKeyOff(e){let{midiValue:t}=e.detail;this.voiceManager.stop({midiValue:t})}registerVoiceHandlers(){this.voiceManager.subscribe($.NOTE_ON,e=>{this.pressedKeys.add(e.midiValue),this.pressedKeys=new Set([...this.pressedKeys.values()]),this.requestUpdate()}).subscribe($.NOTE_OFF,e=>{this.pressedKeys.delete(e.midiValue),this.pressedKeys=new Set([...this.pressedKeys.values()]),this.requestUpdate()}).subscribe($.OSC1,e=>{this.state.osc1=e,this.requestUpdate()}).subscribe($.OSC_MIX,e=>{this.state.osc2Amplitude=e,this.requestUpdate()}).subscribe($.NOISE,e=>{this.state.noiseLevel=e,this.requestUpdate()}).subscribe($.OSC2,e=>{this.state.osc2=e,this.requestUpdate()}).subscribe($.FILTER,e=>{this.state.filter=e,this.requestUpdate()}).subscribe($.ENVELOPE,e=>{this.state.envelope=e,this.requestUpdate()}).subscribe($.LFO1,e=>{this.state.lfo1=e,this.requestUpdate()}).subscribe($.LFO2,e=>{this.state.lfo2=e,this.requestUpdate()}).subscribe($.CUTOFF_MOD,e=>{this.state.cutoffMod=e,this.requestUpdate()})}onOsc1Change(e){switch(e.detail.type){case j.WAVE_FORM:this.voiceManager.setOsc1Mode(e.detail.value);break;case j.SEMI_SHIFT:this.voiceManager.setOsc1SemiShift(e.detail.value);break;case j.CENT_SHIFT:this.voiceManager.setOsc1CentShift(e.detail.value);break;case j.CYCLE:this.voiceManager.setOsc1Cycle(e.detail.value)}}onAmplitudeEnvelopeChange(e){switch(e.detail.type){case z.ATTACK:this.voiceManager.setAmplitudeEnvelopeAttack(e.detail.value);break;case z.DECAY:this.voiceManager.setAmplitudeEnvelopeDecay(e.detail.value);break;case z.SUSTAIN:this.voiceManager.setAmplitudeEnvelopeSustain(e.detail.value);break;case z.RELEASE:this.voiceManager.setAmplitudeEnvelopeRelease(e.detail.value);break}}onOscMixChange(e){switch(e.detail.type){case j.MIX:this.voiceManager.setOsc2Amplitude(e.detail.value);break;case j.NOISE:this.voiceManager.setNoiseLevel(e.detail.value);break}}onOsc2Change(e){switch(e.detail.type){case j.WAVE_FORM:this.voiceManager.setOsc2Mode(e.detail.value);break;case j.SEMI_SHIFT:this.voiceManager.setOsc2SemiShift(e.detail.value);break;case j.CENT_SHIFT:this.voiceManager.setOsc2CentShift(e.detail.value);break;case j.CYCLE:this.voiceManager.setOsc2Cycle(e.detail.value);break}}onFilterChange(e){switch(e.detail.type){case L.MODE:this.voiceManager.setFilterMode(e.detail.value);break;case L.CUTOFF:this.voiceManager.setFilterCutoff(e.detail.value);break;case L.RESONANCE:this.voiceManager.setFilterResonance(e.detail.value);break;case L.DRIVE:this.voiceManager.setDrive(e.detail.value);break}}onFilterEnvelopeChange(e){switch(e.detail.type){case V.ATTACK:this.voiceManager.setCutoffEnvelopeAttack(e.detail.value);break;case V.DECAY:this.voiceManager.setCutoffEnvelopeDecay(e.detail.value);break;case V.AMOUNT:this.voiceManager.setCutoffEnvelopeAmount(e.detail.value);break;case V.VELOCITY:this.voiceManager.setCutoffEnvelopeVelocity(e.detail.value);break}}onLfo1Change(e){switch(e.detail.type){case H.WAVE_FORM:this.voiceManager.setLfo1Mode(e.detail.value);break;case H.FREQUENCY:this.voiceManager.setLfo1Frequency(e.detail.value);break;case H.MOD_AMOUNT:this.voiceManager.setLfo1ModAmount(e.detail.value);break;case H.DESTINATION:this.voiceManager.setLfo1Destination(e.detail.value)}}onLfo2Change(e){switch(e.detail.type){case H.WAVE_FORM:this.voiceManager.setLfo2Mode(e.detail.value);break;case H.FREQUENCY:this.voiceManager.setLfo2Frequency(e.detail.value);break;case H.MOD_AMOUNT:this.voiceManager.setLfo2ModAmount(e.detail.value);break;case H.DESTINATION:this.voiceManager.setLfo2Destination(e.detail.value)}}async onMenuChange(e){let{type:t,option:n,shouldUpdate:r}=e.detail;switch(t){case q.MIDI_LEARN:this.currentLearnerID=n.value,r&&this.voiceManager.setLearnerID(this.currentLearnerID);break;case q.MIDI_CHANNEL:this.unlearn();break;case q.PRESET:this.unlearn(),r&&(this.state=this.voiceManager.setState(n.value));break}await this.requestUpdate()}unlearn(){this.currentLearnerID=N.NONE,this.voiceManager.setLearnerID(this.currentLearnerID)}computeVizualizerIfEnabled(){if(this.showVizualizer)return y`
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
          <div class="panels-row">
            <oscillator-element
              .currentLearnerID=${this.currentLearnerID}
              .semiControlID=${N.OSC1_SEMI}
              .centControlID=${N.OSC1_CENT}
              .cycleControlID=${N.OSC1_CYCLE}
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
              .semiControlID=${N.OSC2_SEMI}
              .centControlID=${N.OSC2_CENT}
              .cycleControlID=${N.OSC2_CYCLE}
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
              .frequencyControlID=${N.LFO1_FREQ}
              .modAmountControlID=${N.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${N.LFO2_FREQ}
              .modAmountControlID=${N.LFO2_MOD}
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
    `}};O([E({type:Object})],fn.prototype,`pressedKeys`,void 0),fn=O([T(`wasm-poly-element`)],fn);var pn=class extends w{render(){return y`<wasm-poly-element></wasm-poly-element>`}};pn=O([T(`root-element`)],pn);