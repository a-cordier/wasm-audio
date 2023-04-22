(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * True if the custom elements polyfill is in use.
     */
    const isCEPolyfill = typeof window !== 'undefined' &&
        window.customElements != null &&
        window.customElements.polyfillWrapFlushCallback !==
            undefined;
    /**
     * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
     * `container`.
     */
    const removeNodes = (container, start, end = null) => {
        while (start !== end) {
            const n = start.nextSibling;
            container.removeChild(start);
            start = n;
        }
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An expression marker with embedded unique key to avoid collision with
     * possible text in templates.
     */
    const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
    /**
     * An expression marker used text-positions, multi-binding attributes, and
     * attributes with markup-like text values.
     */
    const nodeMarker = `<!--${marker}-->`;
    const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
    /**
     * Suffix appended to all bound attribute names.
     */
    const boundAttributeSuffix = '$lit$';
    /**
     * An updatable Template that tracks the location of dynamic parts.
     */
    class Template {
        constructor(result, element) {
            this.parts = [];
            this.element = element;
            const nodesToRemove = [];
            const stack = [];
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
            const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            // Keeps track of the last index associated with a part. We try to delete
            // unnecessary nodes, but we never want to associate two different parts
            // to the same index. They must have a constant node between.
            let lastPartIndex = 0;
            let index = -1;
            let partIndex = 0;
            const { strings, values: { length } } = result;
            while (partIndex < length) {
                const node = walker.nextNode();
                if (node === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    continue;
                }
                index++;
                if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                    if (node.hasAttributes()) {
                        const attributes = node.attributes;
                        const { length } = attributes;
                        // Per
                        // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                        // attributes are not guaranteed to be returned in document order.
                        // In particular, Edge/IE can return them out of order, so we cannot
                        // assume a correspondence between part index and attribute index.
                        let count = 0;
                        for (let i = 0; i < length; i++) {
                            if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                                count++;
                            }
                        }
                        while (count-- > 0) {
                            // Get the template literal section leading up to the first
                            // expression in this attribute
                            const stringForPart = strings[partIndex];
                            // Find the attribute name
                            const name = lastAttributeNameRegex.exec(stringForPart)[2];
                            // Find the corresponding attribute
                            // All bound attributes have had a suffix added in
                            // TemplateResult#getHTML to opt out of special attribute
                            // handling. To look up the attribute value we also need to add
                            // the suffix.
                            const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                            const attributeValue = node.getAttribute(attributeLookupName);
                            node.removeAttribute(attributeLookupName);
                            const statics = attributeValue.split(markerRegex);
                            this.parts.push({ type: 'attribute', index, name, strings: statics });
                            partIndex += statics.length - 1;
                        }
                    }
                    if (node.tagName === 'TEMPLATE') {
                        stack.push(node);
                        walker.currentNode = node.content;
                    }
                }
                else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                    const data = node.data;
                    if (data.indexOf(marker) >= 0) {
                        const parent = node.parentNode;
                        const strings = data.split(markerRegex);
                        const lastIndex = strings.length - 1;
                        // Generate a new text node for each literal section
                        // These nodes are also used as the markers for node parts
                        for (let i = 0; i < lastIndex; i++) {
                            let insert;
                            let s = strings[i];
                            if (s === '') {
                                insert = createMarker();
                            }
                            else {
                                const match = lastAttributeNameRegex.exec(s);
                                if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                    s = s.slice(0, match.index) + match[1] +
                                        match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                                }
                                insert = document.createTextNode(s);
                            }
                            parent.insertBefore(insert, node);
                            this.parts.push({ type: 'node', index: ++index });
                        }
                        // If there's no text, we must insert a comment to mark our place.
                        // Else, we can trust it will stick around after cloning.
                        if (strings[lastIndex] === '') {
                            parent.insertBefore(createMarker(), node);
                            nodesToRemove.push(node);
                        }
                        else {
                            node.data = strings[lastIndex];
                        }
                        // We have a part for each match found
                        partIndex += lastIndex;
                    }
                }
                else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                    if (node.data === marker) {
                        const parent = node.parentNode;
                        // Add a new marker node to be the startNode of the Part if any of
                        // the following are true:
                        //  * We don't have a previousSibling
                        //  * The previousSibling is already the start of a previous part
                        if (node.previousSibling === null || index === lastPartIndex) {
                            index++;
                            parent.insertBefore(createMarker(), node);
                        }
                        lastPartIndex = index;
                        this.parts.push({ type: 'node', index });
                        // If we don't have a nextSibling, keep this node so we have an end.
                        // Else, we can remove it to save future costs.
                        if (node.nextSibling === null) {
                            node.data = '';
                        }
                        else {
                            nodesToRemove.push(node);
                            index--;
                        }
                        partIndex++;
                    }
                    else {
                        let i = -1;
                        while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                            // Comment node has a binding marker inside, make an inactive part
                            // The binding won't work, but subsequent bindings will
                            // TODO (justinfagnani): consider whether it's even worth it to
                            // make bindings in comments work
                            this.parts.push({ type: 'node', index: -1 });
                            partIndex++;
                        }
                    }
                }
            }
            // Remove text binding nodes after the walk to not disturb the TreeWalker
            for (const n of nodesToRemove) {
                n.parentNode.removeChild(n);
            }
        }
    }
    const endsWith = (str, suffix) => {
        const index = str.length - suffix.length;
        return index >= 0 && str.slice(index) === suffix;
    };
    const isTemplatePartActive = (part) => part.index !== -1;
    // Allows `document.createComment('')` to be renamed for a
    // small manual size-savings.
    const createMarker = () => document.createComment('');
    /**
     * This regex extracts the attribute name preceding an attribute-position
     * expression. It does this by matching the syntax allowed for attributes
     * against the string literal directly preceding the expression, assuming that
     * the expression is in an attribute-value position.
     *
     * See attributes in the HTML spec:
     * https://www.w3.org/TR/html5/syntax.html#elements-attributes
     *
     * " \x09\x0a\x0c\x0d" are HTML space characters:
     * https://www.w3.org/TR/html5/infrastructure.html#space-characters
     *
     * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
     * space character except " ".
     *
     * So an attribute is:
     *  * The name: any character except a control character, space character, ('),
     *    ("), ">", "=", or "/"
     *  * Followed by zero or more space characters
     *  * Followed by "="
     *  * Followed by zero or more space characters
     *  * Followed by:
     *    * Any character except space, ('), ("), "<", ">", "=", (`), or
     *    * (") then any non-("), or
     *    * (') then any non-(')
     */
    const lastAttributeNameRegex = 
    // eslint-disable-next-line no-control-regex
    /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const walkerNodeFilter = 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */;
    /**
     * Removes the list of nodes from a Template safely. In addition to removing
     * nodes from the Template, the Template part indices are updated to match
     * the mutated Template DOM.
     *
     * As the template is walked the removal state is tracked and
     * part indices are adjusted as needed.
     *
     * div
     *   div#1 (remove) <-- start removing (removing node is div#1)
     *     div
     *       div#2 (remove)  <-- continue removing (removing node is still div#1)
     *         div
     * div <-- stop removing since previous sibling is the removing node (div#1,
     * removed 4 nodes)
     */
    function removeNodesFromTemplate(template, nodesToRemove) {
        const { element: { content }, parts } = template;
        const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
        let partIndex = nextActiveIndexInTemplateParts(parts);
        let part = parts[partIndex];
        let nodeIndex = -1;
        let removeCount = 0;
        const nodesToRemoveInTemplate = [];
        let currentRemovingNode = null;
        while (walker.nextNode()) {
            nodeIndex++;
            const node = walker.currentNode;
            // End removal if stepped past the removing node
            if (node.previousSibling === currentRemovingNode) {
                currentRemovingNode = null;
            }
            // A node to remove was found in the template
            if (nodesToRemove.has(node)) {
                nodesToRemoveInTemplate.push(node);
                // Track node we're removing
                if (currentRemovingNode === null) {
                    currentRemovingNode = node;
                }
            }
            // When removing, increment count by which to adjust subsequent part indices
            if (currentRemovingNode !== null) {
                removeCount++;
            }
            while (part !== undefined && part.index === nodeIndex) {
                // If part is in a removed node deactivate it by setting index to -1 or
                // adjust the index as needed.
                part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
                // go to the next active part.
                partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                part = parts[partIndex];
            }
        }
        nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
    }
    const countNodes = (node) => {
        let count = (node.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */) ? 0 : 1;
        const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
        while (walker.nextNode()) {
            count++;
        }
        return count;
    };
    const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
        for (let i = startIndex + 1; i < parts.length; i++) {
            const part = parts[i];
            if (isTemplatePartActive(part)) {
                return i;
            }
        }
        return -1;
    };
    /**
     * Inserts the given node into the Template, optionally before the given
     * refNode. In addition to inserting the node into the Template, the Template
     * part indices are updated to match the mutated Template DOM.
     */
    function insertNodeIntoTemplate(template, node, refNode = null) {
        const { element: { content }, parts } = template;
        // If there's no refNode, then put node at end of template.
        // No part indices need to be shifted in this case.
        if (refNode === null || refNode === undefined) {
            content.appendChild(node);
            return;
        }
        const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
        let partIndex = nextActiveIndexInTemplateParts(parts);
        let insertCount = 0;
        let walkerIndex = -1;
        while (walker.nextNode()) {
            walkerIndex++;
            const walkerNode = walker.currentNode;
            if (walkerNode === refNode) {
                insertCount = countNodes(node);
                refNode.parentNode.insertBefore(node, refNode);
            }
            while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
                // If we've inserted the node, simply adjust all subsequent parts
                if (insertCount > 0) {
                    while (partIndex !== -1) {
                        parts[partIndex].index += insertCount;
                        partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                    }
                    return;
                }
                partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
            }
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const directives = new WeakMap();
    /**
     * Brands a function as a directive factory function so that lit-html will call
     * the function during template rendering, rather than passing as a value.
     *
     * A _directive_ is a function that takes a Part as an argument. It has the
     * signature: `(part: Part) => void`.
     *
     * A directive _factory_ is a function that takes arguments for data and
     * configuration and returns a directive. Users of directive usually refer to
     * the directive factory as the directive. For example, "The repeat directive".
     *
     * Usually a template author will invoke a directive factory in their template
     * with relevant arguments, which will then return a directive function.
     *
     * Here's an example of using the `repeat()` directive factory that takes an
     * array and a function to render an item:
     *
     * ```js
     * html`<ul><${repeat(items, (item) => html`<li>${item}</li>`)}</ul>`
     * ```
     *
     * When `repeat` is invoked, it returns a directive function that closes over
     * `items` and the template function. When the outer template is rendered, the
     * return directive function is called with the Part for the expression.
     * `repeat` then performs it's custom logic to render multiple items.
     *
     * @param f The directive factory function. Must be a function that returns a
     * function of the signature `(part: Part) => void`. The returned function will
     * be called with the part object.
     *
     * @example
     *
     * import {directive, html} from 'lit-html';
     *
     * const immutable = directive((v) => (part) => {
     *   if (part.value !== v) {
     *     part.setValue(v)
     *   }
     * });
     */
    const directive = (f) => ((...args) => {
        const d = f(...args);
        directives.set(d, true);
        return d;
    });
    const isDirective = (o) => {
        return typeof o === 'function' && directives.has(o);
    };

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * A sentinel value that signals that a value was handled by a directive and
     * should not be written to the DOM.
     */
    const noChange = {};
    /**
     * A sentinel value that signals a NodePart to fully clear its content.
     */
    const nothing = {};

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An instance of a `Template` that can be attached to the DOM and updated
     * with new values.
     */
    class TemplateInstance {
        constructor(template, processor, options) {
            this.__parts = [];
            this.template = template;
            this.processor = processor;
            this.options = options;
        }
        update(values) {
            let i = 0;
            for (const part of this.__parts) {
                if (part !== undefined) {
                    part.setValue(values[i]);
                }
                i++;
            }
            for (const part of this.__parts) {
                if (part !== undefined) {
                    part.commit();
                }
            }
        }
        _clone() {
            // There are a number of steps in the lifecycle of a template instance's
            // DOM fragment:
            //  1. Clone - create the instance fragment
            //  2. Adopt - adopt into the main document
            //  3. Process - find part markers and create parts
            //  4. Upgrade - upgrade custom elements
            //  5. Update - set node, attribute, property, etc., values
            //  6. Connect - connect to the document. Optional and outside of this
            //     method.
            //
            // We have a few constraints on the ordering of these steps:
            //  * We need to upgrade before updating, so that property values will pass
            //    through any property setters.
            //  * We would like to process before upgrading so that we're sure that the
            //    cloned fragment is inert and not disturbed by self-modifying DOM.
            //  * We want custom elements to upgrade even in disconnected fragments.
            //
            // Given these constraints, with full custom elements support we would
            // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
            //
            // But Safari does not implement CustomElementRegistry#upgrade, so we
            // can not implement that order and still have upgrade-before-update and
            // upgrade disconnected fragments. So we instead sacrifice the
            // process-before-upgrade constraint, since in Custom Elements v1 elements
            // must not modify their light DOM in the constructor. We still have issues
            // when co-existing with CEv0 elements like Polymer 1, and with polyfills
            // that don't strictly adhere to the no-modification rule because shadow
            // DOM, which may be created in the constructor, is emulated by being placed
            // in the light DOM.
            //
            // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
            // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
            // in one step.
            //
            // The Custom Elements v1 polyfill supports upgrade(), so the order when
            // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
            // Connect.
            const fragment = isCEPolyfill ?
                this.template.element.content.cloneNode(true) :
                document.importNode(this.template.element.content, true);
            const stack = [];
            const parts = this.template.parts;
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
            const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            let partIndex = 0;
            let nodeIndex = 0;
            let part;
            let node = walker.nextNode();
            // Loop through all the nodes and parts of a template
            while (partIndex < parts.length) {
                part = parts[partIndex];
                if (!isTemplatePartActive(part)) {
                    this.__parts.push(undefined);
                    partIndex++;
                    continue;
                }
                // Progress the tree walker until we find our next part's node.
                // Note that multiple parts may share the same node (attribute parts
                // on a single element), so this loop may not run at all.
                while (nodeIndex < part.index) {
                    nodeIndex++;
                    if (node.nodeName === 'TEMPLATE') {
                        stack.push(node);
                        walker.currentNode = node.content;
                    }
                    if ((node = walker.nextNode()) === null) {
                        // We've exhausted the content inside a nested template element.
                        // Because we still have parts (the outer for-loop), we know:
                        // - There is a template in the stack
                        // - The walker will find a nextNode outside the template
                        walker.currentNode = stack.pop();
                        node = walker.nextNode();
                    }
                }
                // We've arrived at our part's node.
                if (part.type === 'node') {
                    const part = this.processor.handleTextExpression(this.options);
                    part.insertAfterNode(node.previousSibling);
                    this.__parts.push(part);
                }
                else {
                    this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                }
                partIndex++;
            }
            if (isCEPolyfill) {
                document.adoptNode(fragment);
                customElements.upgrade(fragment);
            }
            return fragment;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * Our TrustedTypePolicy for HTML which is declared using the html template
     * tag function.
     *
     * That HTML is a developer-authored constant, and is parsed with innerHTML
     * before any untrusted expressions have been mixed in. Therefor it is
     * considered safe by construction.
     */
    const policy = window.trustedTypes &&
        trustedTypes.createPolicy('lit-html', { createHTML: (s) => s });
    const commentMarker = ` ${marker} `;
    /**
     * The return type of `html`, which holds a Template and the values from
     * interpolated expressions.
     */
    class TemplateResult {
        constructor(strings, values, type, processor) {
            this.strings = strings;
            this.values = values;
            this.type = type;
            this.processor = processor;
        }
        /**
         * Returns a string of HTML used to create a `<template>` element.
         */
        getHTML() {
            const l = this.strings.length - 1;
            let html = '';
            let isCommentBinding = false;
            for (let i = 0; i < l; i++) {
                const s = this.strings[i];
                // For each binding we want to determine the kind of marker to insert
                // into the template source before it's parsed by the browser's HTML
                // parser. The marker type is based on whether the expression is in an
                // attribute, text, or comment position.
                //   * For node-position bindings we insert a comment with the marker
                //     sentinel as its text content, like <!--{{lit-guid}}-->.
                //   * For attribute bindings we insert just the marker sentinel for the
                //     first binding, so that we support unquoted attribute bindings.
                //     Subsequent bindings can use a comment marker because multi-binding
                //     attributes must be quoted.
                //   * For comment bindings we insert just the marker sentinel so we don't
                //     close the comment.
                //
                // The following code scans the template source, but is *not* an HTML
                // parser. We don't need to track the tree structure of the HTML, only
                // whether a binding is inside a comment, and if not, if it appears to be
                // the first binding in an attribute.
                const commentOpen = s.lastIndexOf('<!--');
                // We're in comment position if we have a comment open with no following
                // comment close. Because <-- can appear in an attribute value there can
                // be false positives.
                isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                    s.indexOf('-->', commentOpen + 1) === -1;
                // Check to see if we have an attribute-like sequence preceding the
                // expression. This can match "name=value" like structures in text,
                // comments, and attribute values, so there can be false-positives.
                const attributeMatch = lastAttributeNameRegex.exec(s);
                if (attributeMatch === null) {
                    // We're only in this branch if we don't have a attribute-like
                    // preceding sequence. For comments, this guards against unusual
                    // attribute values like <div foo="<!--${'bar'}">. Cases like
                    // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                    // below.
                    html += s + (isCommentBinding ? commentMarker : nodeMarker);
                }
                else {
                    // For attributes we use just a marker sentinel, and also append a
                    // $lit$ suffix to the name to opt-out of attribute-specific parsing
                    // that IE and Edge do for style and certain SVG attributes.
                    html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                        attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                        marker;
                }
            }
            html += this.strings[l];
            return html;
        }
        getTemplateElement() {
            const template = document.createElement('template');
            let value = this.getHTML();
            if (policy !== undefined) {
                // this is secure because `this.strings` is a TemplateStringsArray.
                // TODO: validate this when
                // https://github.com/tc39/proposal-array-is-template-object is
                // implemented.
                value = policy.createHTML(value);
            }
            template.innerHTML = value;
            return template;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const isPrimitive = (value) => {
        return (value === null ||
            !(typeof value === 'object' || typeof value === 'function'));
    };
    const isIterable = (value) => {
        return Array.isArray(value) ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            !!(value && value[Symbol.iterator]);
    };
    /**
     * Writes attribute values to the DOM for a group of AttributeParts bound to a
     * single attribute. The value is only set once even if there are multiple parts
     * for an attribute.
     */
    class AttributeCommitter {
        constructor(element, name, strings) {
            this.dirty = true;
            this.element = element;
            this.name = name;
            this.strings = strings;
            this.parts = [];
            for (let i = 0; i < strings.length - 1; i++) {
                this.parts[i] = this._createPart();
            }
        }
        /**
         * Creates a single part. Override this to create a differnt type of part.
         */
        _createPart() {
            return new AttributePart(this);
        }
        _getValue() {
            const strings = this.strings;
            const l = strings.length - 1;
            const parts = this.parts;
            // If we're assigning an attribute via syntax like:
            //    attr="${foo}"  or  attr=${foo}
            // but not
            //    attr="${foo} ${bar}" or attr="${foo} baz"
            // then we don't want to coerce the attribute value into one long
            // string. Instead we want to just return the value itself directly,
            // so that sanitizeDOMValue can get the actual value rather than
            // String(value)
            // The exception is if v is an array, in which case we do want to smash
            // it together into a string without calling String() on the array.
            //
            // This also allows trusted values (when using TrustedTypes) being
            // assigned to DOM sinks without being stringified in the process.
            if (l === 1 && strings[0] === '' && strings[1] === '') {
                const v = parts[0].value;
                if (typeof v === 'symbol') {
                    return String(v);
                }
                if (typeof v === 'string' || !isIterable(v)) {
                    return v;
                }
            }
            let text = '';
            for (let i = 0; i < l; i++) {
                text += strings[i];
                const part = parts[i];
                if (part !== undefined) {
                    const v = part.value;
                    if (isPrimitive(v) || !isIterable(v)) {
                        text += typeof v === 'string' ? v : String(v);
                    }
                    else {
                        for (const t of v) {
                            text += typeof t === 'string' ? t : String(t);
                        }
                    }
                }
            }
            text += strings[l];
            return text;
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                this.element.setAttribute(this.name, this._getValue());
            }
        }
    }
    /**
     * A Part that controls all or part of an attribute value.
     */
    class AttributePart {
        constructor(committer) {
            this.value = undefined;
            this.committer = committer;
        }
        setValue(value) {
            if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
                this.value = value;
                // If the value is a not a directive, dirty the committer so that it'll
                // call setAttribute. If the value is a directive, it'll dirty the
                // committer if it calls setValue().
                if (!isDirective(value)) {
                    this.committer.dirty = true;
                }
            }
        }
        commit() {
            while (isDirective(this.value)) {
                const directive = this.value;
                this.value = noChange;
                directive(this);
            }
            if (this.value === noChange) {
                return;
            }
            this.committer.commit();
        }
    }
    /**
     * A Part that controls a location within a Node tree. Like a Range, NodePart
     * has start and end locations and can set and update the Nodes between those
     * locations.
     *
     * NodeParts support several value types: primitives, Nodes, TemplateResults,
     * as well as arrays and iterables of those types.
     */
    class NodePart {
        constructor(options) {
            this.value = undefined;
            this.__pendingValue = undefined;
            this.options = options;
        }
        /**
         * Appends this part into a container.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendInto(container) {
            this.startNode = container.appendChild(createMarker());
            this.endNode = container.appendChild(createMarker());
        }
        /**
         * Inserts this part after the `ref` node (between `ref` and `ref`'s next
         * sibling). Both `ref` and its next sibling must be static, unchanging nodes
         * such as those that appear in a literal section of a template.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterNode(ref) {
            this.startNode = ref;
            this.endNode = ref.nextSibling;
        }
        /**
         * Appends this part into a parent part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendIntoPart(part) {
            part.__insert(this.startNode = createMarker());
            part.__insert(this.endNode = createMarker());
        }
        /**
         * Inserts this part after the `ref` part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterPart(ref) {
            ref.__insert(this.startNode = createMarker());
            this.endNode = ref.endNode;
            ref.endNode = this.startNode;
        }
        setValue(value) {
            this.__pendingValue = value;
        }
        commit() {
            if (this.startNode.parentNode === null) {
                return;
            }
            while (isDirective(this.__pendingValue)) {
                const directive = this.__pendingValue;
                this.__pendingValue = noChange;
                directive(this);
            }
            const value = this.__pendingValue;
            if (value === noChange) {
                return;
            }
            if (isPrimitive(value)) {
                if (value !== this.value) {
                    this.__commitText(value);
                }
            }
            else if (value instanceof TemplateResult) {
                this.__commitTemplateResult(value);
            }
            else if (value instanceof Node) {
                this.__commitNode(value);
            }
            else if (isIterable(value)) {
                this.__commitIterable(value);
            }
            else if (value === nothing) {
                this.value = nothing;
                this.clear();
            }
            else {
                // Fallback, will render the string representation
                this.__commitText(value);
            }
        }
        __insert(node) {
            this.endNode.parentNode.insertBefore(node, this.endNode);
        }
        __commitNode(value) {
            if (this.value === value) {
                return;
            }
            this.clear();
            this.__insert(value);
            this.value = value;
        }
        __commitText(value) {
            const node = this.startNode.nextSibling;
            value = value == null ? '' : value;
            // If `value` isn't already a string, we explicitly convert it here in case
            // it can't be implicitly converted - i.e. it's a symbol.
            const valueAsString = typeof value === 'string' ? value : String(value);
            if (node === this.endNode.previousSibling &&
                node.nodeType === 3 /* Node.TEXT_NODE */) {
                // If we only have a single text node between the markers, we can just
                // set its value, rather than replacing it.
                // TODO(justinfagnani): Can we just check if this.value is primitive?
                node.data = valueAsString;
            }
            else {
                this.__commitNode(document.createTextNode(valueAsString));
            }
            this.value = value;
        }
        __commitTemplateResult(value) {
            const template = this.options.templateFactory(value);
            if (this.value instanceof TemplateInstance &&
                this.value.template === template) {
                this.value.update(value.values);
            }
            else {
                // Make sure we propagate the template processor from the TemplateResult
                // so that we use its syntax extension, etc. The template factory comes
                // from the render function options so that it can control template
                // caching and preprocessing.
                const instance = new TemplateInstance(template, value.processor, this.options);
                const fragment = instance._clone();
                instance.update(value.values);
                this.__commitNode(fragment);
                this.value = instance;
            }
        }
        __commitIterable(value) {
            // For an Iterable, we create a new InstancePart per item, then set its
            // value to the item. This is a little bit of overhead for every item in
            // an Iterable, but it lets us recurse easily and efficiently update Arrays
            // of TemplateResults that will be commonly returned from expressions like:
            // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
            // If _value is an array, then the previous render was of an
            // iterable and _value will contain the NodeParts from the previous
            // render. If _value is not an array, clear this part and make a new
            // array for NodeParts.
            if (!Array.isArray(this.value)) {
                this.value = [];
                this.clear();
            }
            // Lets us keep track of how many items we stamped so we can clear leftover
            // items from a previous render
            const itemParts = this.value;
            let partIndex = 0;
            let itemPart;
            for (const item of value) {
                // Try to reuse an existing part
                itemPart = itemParts[partIndex];
                // If no existing part, create a new one
                if (itemPart === undefined) {
                    itemPart = new NodePart(this.options);
                    itemParts.push(itemPart);
                    if (partIndex === 0) {
                        itemPart.appendIntoPart(this);
                    }
                    else {
                        itemPart.insertAfterPart(itemParts[partIndex - 1]);
                    }
                }
                itemPart.setValue(item);
                itemPart.commit();
                partIndex++;
            }
            if (partIndex < itemParts.length) {
                // Truncate the parts array so _value reflects the current state
                itemParts.length = partIndex;
                this.clear(itemPart && itemPart.endNode);
            }
        }
        clear(startNode = this.startNode) {
            removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
        }
    }
    /**
     * Implements a boolean attribute, roughly as defined in the HTML
     * specification.
     *
     * If the value is truthy, then the attribute is present with a value of
     * ''. If the value is falsey, the attribute is removed.
     */
    class BooleanAttributePart {
        constructor(element, name, strings) {
            this.value = undefined;
            this.__pendingValue = undefined;
            if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
                throw new Error('Boolean attributes can only contain a single expression');
            }
            this.element = element;
            this.name = name;
            this.strings = strings;
        }
        setValue(value) {
            this.__pendingValue = value;
        }
        commit() {
            while (isDirective(this.__pendingValue)) {
                const directive = this.__pendingValue;
                this.__pendingValue = noChange;
                directive(this);
            }
            if (this.__pendingValue === noChange) {
                return;
            }
            const value = !!this.__pendingValue;
            if (this.value !== value) {
                if (value) {
                    this.element.setAttribute(this.name, '');
                }
                else {
                    this.element.removeAttribute(this.name);
                }
                this.value = value;
            }
            this.__pendingValue = noChange;
        }
    }
    /**
     * Sets attribute values for PropertyParts, so that the value is only set once
     * even if there are multiple parts for a property.
     *
     * If an expression controls the whole property value, then the value is simply
     * assigned to the property under control. If there are string literals or
     * multiple expressions, then the strings are expressions are interpolated into
     * a string first.
     */
    class PropertyCommitter extends AttributeCommitter {
        constructor(element, name, strings) {
            super(element, name, strings);
            this.single =
                (strings.length === 2 && strings[0] === '' && strings[1] === '');
        }
        _createPart() {
            return new PropertyPart(this);
        }
        _getValue() {
            if (this.single) {
                return this.parts[0].value;
            }
            return super._getValue();
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.element[this.name] = this._getValue();
            }
        }
    }
    class PropertyPart extends AttributePart {
    }
    // Detect event listener options support. If the `capture` property is read
    // from the options object, then options are supported. If not, then the third
    // argument to add/removeEventListener is interpreted as the boolean capture
    // value so we should only pass the `capture` property.
    let eventOptionsSupported = false;
    // Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
    // blocks right into the body of a module
    (() => {
        try {
            const options = {
                get capture() {
                    eventOptionsSupported = true;
                    return false;
                }
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            window.addEventListener('test', options, options);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            window.removeEventListener('test', options, options);
        }
        catch (_e) {
            // event options not supported
        }
    })();
    class EventPart {
        constructor(element, eventName, eventContext) {
            this.value = undefined;
            this.__pendingValue = undefined;
            this.element = element;
            this.eventName = eventName;
            this.eventContext = eventContext;
            this.__boundHandleEvent = (e) => this.handleEvent(e);
        }
        setValue(value) {
            this.__pendingValue = value;
        }
        commit() {
            while (isDirective(this.__pendingValue)) {
                const directive = this.__pendingValue;
                this.__pendingValue = noChange;
                directive(this);
            }
            if (this.__pendingValue === noChange) {
                return;
            }
            const newListener = this.__pendingValue;
            const oldListener = this.value;
            const shouldRemoveListener = newListener == null ||
                oldListener != null &&
                    (newListener.capture !== oldListener.capture ||
                        newListener.once !== oldListener.once ||
                        newListener.passive !== oldListener.passive);
            const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
            if (shouldRemoveListener) {
                this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
            }
            if (shouldAddListener) {
                this.__options = getOptions(newListener);
                this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
            }
            this.value = newListener;
            this.__pendingValue = noChange;
        }
        handleEvent(event) {
            if (typeof this.value === 'function') {
                this.value.call(this.eventContext || this.element, event);
            }
            else {
                this.value.handleEvent(event);
            }
        }
    }
    // We copy options because of the inconsistent behavior of browsers when reading
    // the third argument of add/removeEventListener. IE11 doesn't support options
    // at all. Chrome 41 only reads `capture` if the argument is an object.
    const getOptions = (o) => o &&
        (eventOptionsSupported ?
            { capture: o.capture, passive: o.passive, once: o.once } :
            o.capture);

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The default TemplateFactory which caches Templates keyed on
     * result.type and result.strings.
     */
    function templateFactory(result) {
        let templateCache = templateCaches.get(result.type);
        if (templateCache === undefined) {
            templateCache = {
                stringsArray: new WeakMap(),
                keyString: new Map()
            };
            templateCaches.set(result.type, templateCache);
        }
        let template = templateCache.stringsArray.get(result.strings);
        if (template !== undefined) {
            return template;
        }
        // If the TemplateStringsArray is new, generate a key from the strings
        // This key is shared between all templates with identical content
        const key = result.strings.join(marker);
        // Check if we already have a Template for this key
        template = templateCache.keyString.get(key);
        if (template === undefined) {
            // If we have not seen this key before, create a new Template
            template = new Template(result, result.getTemplateElement());
            // Cache the Template for this key
            templateCache.keyString.set(key, template);
        }
        // Cache all future queries for this TemplateStringsArray
        templateCache.stringsArray.set(result.strings, template);
        return template;
    }
    const templateCaches = new Map();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const parts = new WeakMap();
    /**
     * Renders a template result or other value to a container.
     *
     * To update a container with new values, reevaluate the template literal and
     * call `render` with the new result.
     *
     * @param result Any value renderable by NodePart - typically a TemplateResult
     *     created by evaluating a template tag like `html` or `svg`.
     * @param container A DOM parent to render to. The entire contents are either
     *     replaced, or efficiently updated if the same result type was previous
     *     rendered there.
     * @param options RenderOptions for the entire render tree rendered to this
     *     container. Render options must *not* change between renders to the same
     *     container, as those changes will not effect previously rendered DOM.
     */
    const render = (result, container, options) => {
        let part = parts.get(container);
        if (part === undefined) {
            removeNodes(container, container.firstChild);
            parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
            part.appendInto(container);
        }
        part.setValue(result);
        part.commit();
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * Creates Parts when a template is instantiated.
     */
    class DefaultTemplateProcessor {
        /**
         * Create parts for an attribute-position binding, given the event, attribute
         * name, and string literals.
         *
         * @param element The element containing the binding
         * @param name  The attribute name
         * @param strings The string literals. There are always at least two strings,
         *   event for fully-controlled bindings with a single expression.
         */
        handleAttributeExpressions(element, name, strings, options) {
            const prefix = name[0];
            if (prefix === '.') {
                const committer = new PropertyCommitter(element, name.slice(1), strings);
                return committer.parts;
            }
            if (prefix === '@') {
                return [new EventPart(element, name.slice(1), options.eventContext)];
            }
            if (prefix === '?') {
                return [new BooleanAttributePart(element, name.slice(1), strings)];
            }
            const committer = new AttributeCommitter(element, name, strings);
            return committer.parts;
        }
        /**
         * Create parts for a text-position binding.
         * @param templateFactory
         */
        handleTextExpression(options) {
            return new NodePart(options);
        }
    }
    const defaultTemplateProcessor = new DefaultTemplateProcessor();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IMPORTANT: do not change the property name or the assignment expression.
    // This line will be used in regexes to search for lit-html usage.
    // TODO(justinfagnani): inject version number at build time
    if (typeof window !== 'undefined') {
        (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.4.1');
    }
    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     */
    const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // Get a key to lookup in `templateCaches`.
    const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
    let compatibleShadyCSSVersion = true;
    if (typeof window.ShadyCSS === 'undefined') {
        compatibleShadyCSSVersion = false;
    }
    else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
        console.warn(`Incompatible ShadyCSS version detected. ` +
            `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` +
            `@webcomponents/shadycss@1.3.1.`);
        compatibleShadyCSSVersion = false;
    }
    /**
     * Template factory which scopes template DOM using ShadyCSS.
     * @param scopeName {string}
     */
    const shadyTemplateFactory = (scopeName) => (result) => {
        const cacheKey = getTemplateCacheKey(result.type, scopeName);
        let templateCache = templateCaches.get(cacheKey);
        if (templateCache === undefined) {
            templateCache = {
                stringsArray: new WeakMap(),
                keyString: new Map()
            };
            templateCaches.set(cacheKey, templateCache);
        }
        let template = templateCache.stringsArray.get(result.strings);
        if (template !== undefined) {
            return template;
        }
        const key = result.strings.join(marker);
        template = templateCache.keyString.get(key);
        if (template === undefined) {
            const element = result.getTemplateElement();
            if (compatibleShadyCSSVersion) {
                window.ShadyCSS.prepareTemplateDom(element, scopeName);
            }
            template = new Template(result, element);
            templateCache.keyString.set(key, template);
        }
        templateCache.stringsArray.set(result.strings, template);
        return template;
    };
    const TEMPLATE_TYPES = ['html', 'svg'];
    /**
     * Removes all style elements from Templates for the given scopeName.
     */
    const removeStylesFromLitTemplates = (scopeName) => {
        TEMPLATE_TYPES.forEach((type) => {
            const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
            if (templates !== undefined) {
                templates.keyString.forEach((template) => {
                    const { element: { content } } = template;
                    // IE 11 doesn't support the iterable param Set constructor
                    const styles = new Set();
                    Array.from(content.querySelectorAll('style')).forEach((s) => {
                        styles.add(s);
                    });
                    removeNodesFromTemplate(template, styles);
                });
            }
        });
    };
    const shadyRenderSet = new Set();
    /**
     * For the given scope name, ensures that ShadyCSS style scoping is performed.
     * This is done just once per scope name so the fragment and template cannot
     * be modified.
     * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
     * to be scoped and appended to the document
     * (2) removes style elements from all lit-html Templates for this scope name.
     *
     * Note, <style> elements can only be placed into templates for the
     * initial rendering of the scope. If <style> elements are included in templates
     * dynamically rendered to the scope (after the first scope render), they will
     * not be scoped and the <style> will be left in the template and rendered
     * output.
     */
    const prepareTemplateStyles = (scopeName, renderedDOM, template) => {
        shadyRenderSet.add(scopeName);
        // If `renderedDOM` is stamped from a Template, then we need to edit that
        // Template's underlying template element. Otherwise, we create one here
        // to give to ShadyCSS, which still requires one while scoping.
        const templateElement = !!template ? template.element : document.createElement('template');
        // Move styles out of rendered DOM and store.
        const styles = renderedDOM.querySelectorAll('style');
        const { length } = styles;
        // If there are no styles, skip unnecessary work
        if (length === 0) {
            // Ensure prepareTemplateStyles is called to support adding
            // styles via `prepareAdoptedCssText` since that requires that
            // `prepareTemplateStyles` is called.
            //
            // ShadyCSS will only update styles containing @apply in the template
            // given to `prepareTemplateStyles`. If no lit Template was given,
            // ShadyCSS will not be able to update uses of @apply in any relevant
            // template. However, this is not a problem because we only create the
            // template for the purpose of supporting `prepareAdoptedCssText`,
            // which doesn't support @apply at all.
            window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
            return;
        }
        const condensedStyle = document.createElement('style');
        // Collect styles into a single style. This helps us make sure ShadyCSS
        // manipulations will not prevent us from being able to fix up template
        // part indices.
        // NOTE: collecting styles is inefficient for browsers but ShadyCSS
        // currently does this anyway. When it does not, this should be changed.
        for (let i = 0; i < length; i++) {
            const style = styles[i];
            style.parentNode.removeChild(style);
            condensedStyle.textContent += style.textContent;
        }
        // Remove styles from nested templates in this scope.
        removeStylesFromLitTemplates(scopeName);
        // And then put the condensed style into the "root" template passed in as
        // `template`.
        const content = templateElement.content;
        if (!!template) {
            insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
        }
        else {
            content.insertBefore(condensedStyle, content.firstChild);
        }
        // Note, it's important that ShadyCSS gets the template that `lit-html`
        // will actually render so that it can update the style inside when
        // needed (e.g. @apply native Shadow DOM case).
        window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
        const style = content.querySelector('style');
        if (window.ShadyCSS.nativeShadow && style !== null) {
            // When in native Shadow DOM, ensure the style created by ShadyCSS is
            // included in initially rendered output (`renderedDOM`).
            renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
        }
        else if (!!template) {
            // When no style is left in the template, parts will be broken as a
            // result. To fix this, we put back the style node ShadyCSS removed
            // and then tell lit to remove that node from the template.
            // There can be no style in the template in 2 cases (1) when Shady DOM
            // is in use, ShadyCSS removes all styles, (2) when native Shadow DOM
            // is in use ShadyCSS removes the style if it contains no content.
            // NOTE, ShadyCSS creates its own style so we can safely add/remove
            // `condensedStyle` here.
            content.insertBefore(condensedStyle, content.firstChild);
            const removes = new Set();
            removes.add(condensedStyle);
            removeNodesFromTemplate(template, removes);
        }
    };
    /**
     * Extension to the standard `render` method which supports rendering
     * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
     * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
     * or when the webcomponentsjs
     * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
     *
     * Adds a `scopeName` option which is used to scope element DOM and stylesheets
     * when native ShadowDOM is unavailable. The `scopeName` will be added to
     * the class attribute of all rendered DOM. In addition, any style elements will
     * be automatically re-written with this `scopeName` selector and moved out
     * of the rendered DOM and into the document `<head>`.
     *
     * It is common to use this render method in conjunction with a custom element
     * which renders a shadowRoot. When this is done, typically the element's
     * `localName` should be used as the `scopeName`.
     *
     * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
     * custom properties (needed only on older browsers like IE11) and a shim for
     * a deprecated feature called `@apply` that supports applying a set of css
     * custom properties to a given location.
     *
     * Usage considerations:
     *
     * * Part values in `<style>` elements are only applied the first time a given
     * `scopeName` renders. Subsequent changes to parts in style elements will have
     * no effect. Because of this, parts in style elements should only be used for
     * values that will never change, for example parts that set scope-wide theme
     * values or parts which render shared style elements.
     *
     * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
     * custom element's `constructor` is not supported. Instead rendering should
     * either done asynchronously, for example at microtask timing (for example
     * `Promise.resolve()`), or be deferred until the first time the element's
     * `connectedCallback` runs.
     *
     * Usage considerations when using shimmed custom properties or `@apply`:
     *
     * * Whenever any dynamic changes are made which affect
     * css custom properties, `ShadyCSS.styleElement(element)` must be called
     * to update the element. There are two cases when this is needed:
     * (1) the element is connected to a new parent, (2) a class is added to the
     * element that causes it to match different custom properties.
     * To address the first case when rendering a custom element, `styleElement`
     * should be called in the element's `connectedCallback`.
     *
     * * Shimmed custom properties may only be defined either for an entire
     * shadowRoot (for example, in a `:host` rule) or via a rule that directly
     * matches an element with a shadowRoot. In other words, instead of flowing from
     * parent to child as do native css custom properties, shimmed custom properties
     * flow only from shadowRoots to nested shadowRoots.
     *
     * * When using `@apply` mixing css shorthand property names with
     * non-shorthand names (for example `border` and `border-width`) is not
     * supported.
     */
    const render$1 = (result, container, options) => {
        if (!options || typeof options !== 'object' || !options.scopeName) {
            throw new Error('The `scopeName` option is required.');
        }
        const scopeName = options.scopeName;
        const hasRendered = parts.has(container);
        const needsScoping = compatibleShadyCSSVersion &&
            container.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */ &&
            !!container.host;
        // Handle first render to a scope specially...
        const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
        // On first scope render, render into a fragment; this cannot be a single
        // fragment that is reused since nested renders can occur synchronously.
        const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
        render(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
        // When performing first scope render,
        // (1) We've rendered into a fragment so that there's a chance to
        // `prepareTemplateStyles` before sub-elements hit the DOM
        // (which might cause them to render based on a common pattern of
        // rendering in a custom element's `connectedCallback`);
        // (2) Scope the template with ShadyCSS one time only for this scope.
        // (3) Render the fragment into the container and make sure the
        // container knows its `part` is the one we just rendered. This ensures
        // DOM will be re-used on subsequent renders.
        if (firstScopeRender) {
            const part = parts.get(renderContainer);
            parts.delete(renderContainer);
            // ShadyCSS might have style sheets (e.g. from `prepareAdoptedCssText`)
            // that should apply to `renderContainer` even if the rendered value is
            // not a TemplateInstance. However, it will only insert scoped styles
            // into the document if `prepareTemplateStyles` has already been called
            // for the given scope name.
            const template = part.value instanceof TemplateInstance ?
                part.value.template :
                undefined;
            prepareTemplateStyles(scopeName, renderContainer, template);
            removeNodes(container, container.firstChild);
            container.appendChild(renderContainer);
            parts.set(container, part);
        }
        // After elements have hit the DOM, update styling if this is the
        // initial render to this container.
        // This is needed whenever dynamic changes are made so it would be
        // safest to do every render; however, this would regress performance
        // so we leave it up to the user to call `ShadyCSS.styleElement`
        // for dynamic changes.
        if (!hasRendered && needsScoping) {
            window.ShadyCSS.styleElement(container.host);
        }
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    var _a;
    /**
     * Use this module if you want to create your own base class extending
     * [[UpdatingElement]].
     * @packageDocumentation
     */
    /*
     * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
     * replaced at compile time by the munged name for object[property]. We cannot
     * alias this function, so we have to use a small shim that has the same
     * behavior when not compiling.
     */
    window.JSCompiler_renameProperty =
        (prop, _obj) => prop;
    const defaultConverter = {
        toAttribute(value, type) {
            switch (type) {
                case Boolean:
                    return value ? '' : null;
                case Object:
                case Array:
                    // if the value is `null` or `undefined` pass this through
                    // to allow removing/no change behavior.
                    return value == null ? value : JSON.stringify(value);
            }
            return value;
        },
        fromAttribute(value, type) {
            switch (type) {
                case Boolean:
                    return value !== null;
                case Number:
                    return value === null ? null : Number(value);
                case Object:
                case Array:
                    // Type assert to adhere to Bazel's "must type assert JSON parse" rule.
                    return JSON.parse(value);
            }
            return value;
        }
    };
    /**
     * Change function that returns true if `value` is different from `oldValue`.
     * This method is used as the default for a property's `hasChanged` function.
     */
    const notEqual = (value, old) => {
        // This ensures (old==NaN, value==NaN) always returns false
        return old !== value && (old === old || value === value);
    };
    const defaultPropertyDeclaration = {
        attribute: true,
        type: String,
        converter: defaultConverter,
        reflect: false,
        hasChanged: notEqual
    };
    const STATE_HAS_UPDATED = 1;
    const STATE_UPDATE_REQUESTED = 1 << 2;
    const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
    const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
    /**
     * The Closure JS Compiler doesn't currently have good support for static
     * property semantics where "this" is dynamic (e.g.
     * https://github.com/google/closure-compiler/issues/3177 and others) so we use
     * this hack to bypass any rewriting by the compiler.
     */
    const finalized = 'finalized';
    /**
     * Base element class which manages element properties and attributes. When
     * properties change, the `update` method is asynchronously called. This method
     * should be supplied by subclassers to render updates as desired.
     * @noInheritDoc
     */
    class UpdatingElement extends HTMLElement {
        constructor() {
            super();
            this.initialize();
        }
        /**
         * Returns a list of attributes corresponding to the registered properties.
         * @nocollapse
         */
        static get observedAttributes() {
            // note: piggy backing on this to ensure we're finalized.
            this.finalize();
            const attributes = [];
            // Use forEach so this works even if for/of loops are compiled to for loops
            // expecting arrays
            this._classProperties.forEach((v, p) => {
                const attr = this._attributeNameForProperty(p, v);
                if (attr !== undefined) {
                    this._attributeToPropertyMap.set(attr, p);
                    attributes.push(attr);
                }
            });
            return attributes;
        }
        /**
         * Ensures the private `_classProperties` property metadata is created.
         * In addition to `finalize` this is also called in `createProperty` to
         * ensure the `@property` decorator can add property metadata.
         */
        /** @nocollapse */
        static _ensureClassProperties() {
            // ensure private storage for property declarations.
            if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
                this._classProperties = new Map();
                // NOTE: Workaround IE11 not supporting Map constructor argument.
                const superProperties = Object.getPrototypeOf(this)._classProperties;
                if (superProperties !== undefined) {
                    superProperties.forEach((v, k) => this._classProperties.set(k, v));
                }
            }
        }
        /**
         * Creates a property accessor on the element prototype if one does not exist
         * and stores a PropertyDeclaration for the property with the given options.
         * The property setter calls the property's `hasChanged` property option
         * or uses a strict identity check to determine whether or not to request
         * an update.
         *
         * This method may be overridden to customize properties; however,
         * when doing so, it's important to call `super.createProperty` to ensure
         * the property is setup correctly. This method calls
         * `getPropertyDescriptor` internally to get a descriptor to install.
         * To customize what properties do when they are get or set, override
         * `getPropertyDescriptor`. To customize the options for a property,
         * implement `createProperty` like this:
         *
         * static createProperty(name, options) {
         *   options = Object.assign(options, {myOption: true});
         *   super.createProperty(name, options);
         * }
         *
         * @nocollapse
         */
        static createProperty(name, options = defaultPropertyDeclaration) {
            // Note, since this can be called by the `@property` decorator which
            // is called before `finalize`, we ensure storage exists for property
            // metadata.
            this._ensureClassProperties();
            this._classProperties.set(name, options);
            // Do not generate an accessor if the prototype already has one, since
            // it would be lost otherwise and that would never be the user's intention;
            // Instead, we expect users to call `requestUpdate` themselves from
            // user-defined accessors. Note that if the super has an accessor we will
            // still overwrite it
            if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
                return;
            }
            const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
            const descriptor = this.getPropertyDescriptor(name, key, options);
            if (descriptor !== undefined) {
                Object.defineProperty(this.prototype, name, descriptor);
            }
        }
        /**
         * Returns a property descriptor to be defined on the given named property.
         * If no descriptor is returned, the property will not become an accessor.
         * For example,
         *
         *   class MyElement extends LitElement {
         *     static getPropertyDescriptor(name, key, options) {
         *       const defaultDescriptor =
         *           super.getPropertyDescriptor(name, key, options);
         *       const setter = defaultDescriptor.set;
         *       return {
         *         get: defaultDescriptor.get,
         *         set(value) {
         *           setter.call(this, value);
         *           // custom action.
         *         },
         *         configurable: true,
         *         enumerable: true
         *       }
         *     }
         *   }
         *
         * @nocollapse
         */
        static getPropertyDescriptor(name, key, options) {
            return {
                // tslint:disable-next-line:no-any no symbol in index
                get() {
                    return this[key];
                },
                set(value) {
                    const oldValue = this[name];
                    this[key] = value;
                    this
                        .requestUpdateInternal(name, oldValue, options);
                },
                configurable: true,
                enumerable: true
            };
        }
        /**
         * Returns the property options associated with the given property.
         * These options are defined with a PropertyDeclaration via the `properties`
         * object or the `@property` decorator and are registered in
         * `createProperty(...)`.
         *
         * Note, this method should be considered "final" and not overridden. To
         * customize the options for a given property, override `createProperty`.
         *
         * @nocollapse
         * @final
         */
        static getPropertyOptions(name) {
            return this._classProperties && this._classProperties.get(name) ||
                defaultPropertyDeclaration;
        }
        /**
         * Creates property accessors for registered properties and ensures
         * any superclasses are also finalized.
         * @nocollapse
         */
        static finalize() {
            // finalize any superclasses
            const superCtor = Object.getPrototypeOf(this);
            if (!superCtor.hasOwnProperty(finalized)) {
                superCtor.finalize();
            }
            this[finalized] = true;
            this._ensureClassProperties();
            // initialize Map populated in observedAttributes
            this._attributeToPropertyMap = new Map();
            // make any properties
            // Note, only process "own" properties since this element will inherit
            // any properties defined on the superClass, and finalization ensures
            // the entire prototype chain is finalized.
            if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
                const props = this.properties;
                // support symbols in properties (IE11 does not support this)
                const propKeys = [
                    ...Object.getOwnPropertyNames(props),
                    ...(typeof Object.getOwnPropertySymbols === 'function') ?
                        Object.getOwnPropertySymbols(props) :
                        []
                ];
                // This for/of is ok because propKeys is an array
                for (const p of propKeys) {
                    // note, use of `any` is due to TypeSript lack of support for symbol in
                    // index types
                    // tslint:disable-next-line:no-any no symbol in index
                    this.createProperty(p, props[p]);
                }
            }
        }
        /**
         * Returns the property name for the given attribute `name`.
         * @nocollapse
         */
        static _attributeNameForProperty(name, options) {
            const attribute = options.attribute;
            return attribute === false ?
                undefined :
                (typeof attribute === 'string' ?
                    attribute :
                    (typeof name === 'string' ? name.toLowerCase() : undefined));
        }
        /**
         * Returns true if a property should request an update.
         * Called when a property value is set and uses the `hasChanged`
         * option for the property if present or a strict identity check.
         * @nocollapse
         */
        static _valueHasChanged(value, old, hasChanged = notEqual) {
            return hasChanged(value, old);
        }
        /**
         * Returns the property value for the given attribute value.
         * Called via the `attributeChangedCallback` and uses the property's
         * `converter` or `converter.fromAttribute` property option.
         * @nocollapse
         */
        static _propertyValueFromAttribute(value, options) {
            const type = options.type;
            const converter = options.converter || defaultConverter;
            const fromAttribute = (typeof converter === 'function' ? converter : converter.fromAttribute);
            return fromAttribute ? fromAttribute(value, type) : value;
        }
        /**
         * Returns the attribute value for the given property value. If this
         * returns undefined, the property will *not* be reflected to an attribute.
         * If this returns null, the attribute will be removed, otherwise the
         * attribute will be set to the value.
         * This uses the property's `reflect` and `type.toAttribute` property options.
         * @nocollapse
         */
        static _propertyValueToAttribute(value, options) {
            if (options.reflect === undefined) {
                return;
            }
            const type = options.type;
            const converter = options.converter;
            const toAttribute = converter && converter.toAttribute ||
                defaultConverter.toAttribute;
            return toAttribute(value, type);
        }
        /**
         * Performs element initialization. By default captures any pre-set values for
         * registered properties.
         */
        initialize() {
            this._updateState = 0;
            this._updatePromise =
                new Promise((res) => this._enableUpdatingResolver = res);
            this._changedProperties = new Map();
            this._saveInstanceProperties();
            // ensures first update will be caught by an early access of
            // `updateComplete`
            this.requestUpdateInternal();
        }
        /**
         * Fixes any properties set on the instance before upgrade time.
         * Otherwise these would shadow the accessor and break these properties.
         * The properties are stored in a Map which is played back after the
         * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
         * (<=41), properties created for native platform properties like (`id` or
         * `name`) may not have default values set in the element constructor. On
         * these browsers native properties appear on instances and therefore their
         * default value will overwrite any element default (e.g. if the element sets
         * this.id = 'id' in the constructor, the 'id' will become '' since this is
         * the native platform default).
         */
        _saveInstanceProperties() {
            // Use forEach so this works even if for/of loops are compiled to for loops
            // expecting arrays
            this.constructor
                ._classProperties.forEach((_v, p) => {
                if (this.hasOwnProperty(p)) {
                    const value = this[p];
                    delete this[p];
                    if (!this._instanceProperties) {
                        this._instanceProperties = new Map();
                    }
                    this._instanceProperties.set(p, value);
                }
            });
        }
        /**
         * Applies previously saved instance properties.
         */
        _applyInstanceProperties() {
            // Use forEach so this works even if for/of loops are compiled to for loops
            // expecting arrays
            // tslint:disable-next-line:no-any
            this._instanceProperties.forEach((v, p) => this[p] = v);
            this._instanceProperties = undefined;
        }
        connectedCallback() {
            // Ensure first connection completes an update. Updates cannot complete
            // before connection.
            this.enableUpdating();
        }
        enableUpdating() {
            if (this._enableUpdatingResolver !== undefined) {
                this._enableUpdatingResolver();
                this._enableUpdatingResolver = undefined;
            }
        }
        /**
         * Allows for `super.disconnectedCallback()` in extensions while
         * reserving the possibility of making non-breaking feature additions
         * when disconnecting at some point in the future.
         */
        disconnectedCallback() {
        }
        /**
         * Synchronizes property values when attributes change.
         */
        attributeChangedCallback(name, old, value) {
            if (old !== value) {
                this._attributeToProperty(name, value);
            }
        }
        _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
            const ctor = this.constructor;
            const attr = ctor._attributeNameForProperty(name, options);
            if (attr !== undefined) {
                const attrValue = ctor._propertyValueToAttribute(value, options);
                // an undefined value does not change the attribute.
                if (attrValue === undefined) {
                    return;
                }
                // Track if the property is being reflected to avoid
                // setting the property again via `attributeChangedCallback`. Note:
                // 1. this takes advantage of the fact that the callback is synchronous.
                // 2. will behave incorrectly if multiple attributes are in the reaction
                // stack at time of calling. However, since we process attributes
                // in `update` this should not be possible (or an extreme corner case
                // that we'd like to discover).
                // mark state reflecting
                this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
                if (attrValue == null) {
                    this.removeAttribute(attr);
                }
                else {
                    this.setAttribute(attr, attrValue);
                }
                // mark state not reflecting
                this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
            }
        }
        _attributeToProperty(name, value) {
            // Use tracking info to avoid deserializing attribute value if it was
            // just set from a property setter.
            if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
                return;
            }
            const ctor = this.constructor;
            // Note, hint this as an `AttributeMap` so closure clearly understands
            // the type; it has issues with tracking types through statics
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const propName = ctor._attributeToPropertyMap.get(name);
            if (propName !== undefined) {
                const options = ctor.getPropertyOptions(propName);
                // mark state reflecting
                this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
                this[propName] =
                    // tslint:disable-next-line:no-any
                    ctor._propertyValueFromAttribute(value, options);
                // mark state not reflecting
                this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
            }
        }
        /**
         * This protected version of `requestUpdate` does not access or return the
         * `updateComplete` promise. This promise can be overridden and is therefore
         * not free to access.
         */
        requestUpdateInternal(name, oldValue, options) {
            let shouldRequestUpdate = true;
            // If we have a property key, perform property update steps.
            if (name !== undefined) {
                const ctor = this.constructor;
                options = options || ctor.getPropertyOptions(name);
                if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
                    if (!this._changedProperties.has(name)) {
                        this._changedProperties.set(name, oldValue);
                    }
                    // Add to reflecting properties set.
                    // Note, it's important that every change has a chance to add the
                    // property to `_reflectingProperties`. This ensures setting
                    // attribute + property reflects correctly.
                    if (options.reflect === true &&
                        !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
                        if (this._reflectingProperties === undefined) {
                            this._reflectingProperties = new Map();
                        }
                        this._reflectingProperties.set(name, options);
                    }
                }
                else {
                    // Abort the request if the property should not be considered changed.
                    shouldRequestUpdate = false;
                }
            }
            if (!this._hasRequestedUpdate && shouldRequestUpdate) {
                this._updatePromise = this._enqueueUpdate();
            }
        }
        /**
         * Requests an update which is processed asynchronously. This should
         * be called when an element should update based on some state not triggered
         * by setting a property. In this case, pass no arguments. It should also be
         * called when manually implementing a property setter. In this case, pass the
         * property `name` and `oldValue` to ensure that any configured property
         * options are honored. Returns the `updateComplete` Promise which is resolved
         * when the update completes.
         *
         * @param name {PropertyKey} (optional) name of requesting property
         * @param oldValue {any} (optional) old value of requesting property
         * @returns {Promise} A Promise that is resolved when the update completes.
         */
        requestUpdate(name, oldValue) {
            this.requestUpdateInternal(name, oldValue);
            return this.updateComplete;
        }
        /**
         * Sets up the element to asynchronously update.
         */
        async _enqueueUpdate() {
            this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
            try {
                // Ensure any previous update has resolved before updating.
                // This `await` also ensures that property changes are batched.
                await this._updatePromise;
            }
            catch (e) {
                // Ignore any previous errors. We only care that the previous cycle is
                // done. Any error should have been handled in the previous update.
            }
            const result = this.performUpdate();
            // If `performUpdate` returns a Promise, we await it. This is done to
            // enable coordinating updates with a scheduler. Note, the result is
            // checked to avoid delaying an additional microtask unless we need to.
            if (result != null) {
                await result;
            }
            return !this._hasRequestedUpdate;
        }
        get _hasRequestedUpdate() {
            return (this._updateState & STATE_UPDATE_REQUESTED);
        }
        get hasUpdated() {
            return (this._updateState & STATE_HAS_UPDATED);
        }
        /**
         * Performs an element update. Note, if an exception is thrown during the
         * update, `firstUpdated` and `updated` will not be called.
         *
         * You can override this method to change the timing of updates. If this
         * method is overridden, `super.performUpdate()` must be called.
         *
         * For instance, to schedule updates to occur just before the next frame:
         *
         * ```
         * protected async performUpdate(): Promise<unknown> {
         *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
         *   super.performUpdate();
         * }
         * ```
         */
        performUpdate() {
            // Abort any update if one is not pending when this is called.
            // This can happen if `performUpdate` is called early to "flush"
            // the update.
            if (!this._hasRequestedUpdate) {
                return;
            }
            // Mixin instance properties once, if they exist.
            if (this._instanceProperties) {
                this._applyInstanceProperties();
            }
            let shouldUpdate = false;
            const changedProperties = this._changedProperties;
            try {
                shouldUpdate = this.shouldUpdate(changedProperties);
                if (shouldUpdate) {
                    this.update(changedProperties);
                }
                else {
                    this._markUpdated();
                }
            }
            catch (e) {
                // Prevent `firstUpdated` and `updated` from running when there's an
                // update exception.
                shouldUpdate = false;
                // Ensure element can accept additional updates after an exception.
                this._markUpdated();
                throw e;
            }
            if (shouldUpdate) {
                if (!(this._updateState & STATE_HAS_UPDATED)) {
                    this._updateState = this._updateState | STATE_HAS_UPDATED;
                    this.firstUpdated(changedProperties);
                }
                this.updated(changedProperties);
            }
        }
        _markUpdated() {
            this._changedProperties = new Map();
            this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
        }
        /**
         * Returns a Promise that resolves when the element has completed updating.
         * The Promise value is a boolean that is `true` if the element completed the
         * update without triggering another update. The Promise result is `false` if
         * a property was set inside `updated()`. If the Promise is rejected, an
         * exception was thrown during the update.
         *
         * To await additional asynchronous work, override the `_getUpdateComplete`
         * method. For example, it is sometimes useful to await a rendered element
         * before fulfilling this Promise. To do this, first await
         * `super._getUpdateComplete()`, then any subsequent state.
         *
         * @returns {Promise} The Promise returns a boolean that indicates if the
         * update resolved without triggering another update.
         */
        get updateComplete() {
            return this._getUpdateComplete();
        }
        /**
         * Override point for the `updateComplete` promise.
         *
         * It is not safe to override the `updateComplete` getter directly due to a
         * limitation in TypeScript which means it is not possible to call a
         * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
         * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
         * This method should be overridden instead. For example:
         *
         *   class MyElement extends LitElement {
         *     async _getUpdateComplete() {
         *       await super._getUpdateComplete();
         *       await this._myChild.updateComplete;
         *     }
         *   }
         * @deprecated Override `getUpdateComplete()` instead for forward
         *     compatibility with `lit-element` 3.0 / `@lit/reactive-element`.
         */
        _getUpdateComplete() {
            return this.getUpdateComplete();
        }
        /**
         * Override point for the `updateComplete` promise.
         *
         * It is not safe to override the `updateComplete` getter directly due to a
         * limitation in TypeScript which means it is not possible to call a
         * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
         * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
         * This method should be overridden instead. For example:
         *
         *   class MyElement extends LitElement {
         *     async getUpdateComplete() {
         *       await super.getUpdateComplete();
         *       await this._myChild.updateComplete;
         *     }
         *   }
         */
        getUpdateComplete() {
            return this._updatePromise;
        }
        /**
         * Controls whether or not `update` should be called when the element requests
         * an update. By default, this method always returns `true`, but this can be
         * customized to control when to update.
         *
         * @param _changedProperties Map of changed properties with old values
         */
        shouldUpdate(_changedProperties) {
            return true;
        }
        /**
         * Updates the element. This method reflects property values to attributes.
         * It can be overridden to render and keep updated element DOM.
         * Setting properties inside this method will *not* trigger
         * another update.
         *
         * @param _changedProperties Map of changed properties with old values
         */
        update(_changedProperties) {
            if (this._reflectingProperties !== undefined &&
                this._reflectingProperties.size > 0) {
                // Use forEach so this works even if for/of loops are compiled to for
                // loops expecting arrays
                this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
                this._reflectingProperties = undefined;
            }
            this._markUpdated();
        }
        /**
         * Invoked whenever the element is updated. Implement to perform
         * post-updating tasks via DOM APIs, for example, focusing an element.
         *
         * Setting properties inside this method will trigger the element to update
         * again after this update cycle completes.
         *
         * @param _changedProperties Map of changed properties with old values
         */
        updated(_changedProperties) {
        }
        /**
         * Invoked when the element is first updated. Implement to perform one time
         * work on the element after update.
         *
         * Setting properties inside this method will trigger the element to update
         * again after this update cycle completes.
         *
         * @param _changedProperties Map of changed properties with old values
         */
        firstUpdated(_changedProperties) {
        }
    }
    _a = finalized;
    /**
     * Marks class as having finished creating properties.
     */
    UpdatingElement[_a] = true;

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const legacyCustomElement = (tagName, clazz) => {
        window.customElements.define(tagName, clazz);
        // Cast as any because TS doesn't recognize the return type as being a
        // subtype of the decorated class when clazz is typed as
        // `Constructor<HTMLElement>` for some reason.
        // `Constructor<HTMLElement>` is helpful to make sure the decorator is
        // applied to elements however.
        // tslint:disable-next-line:no-any
        return clazz;
    };
    const standardCustomElement = (tagName, descriptor) => {
        const { kind, elements } = descriptor;
        return {
            kind,
            elements,
            // This callback is called once the class is otherwise fully defined
            finisher(clazz) {
                window.customElements.define(tagName, clazz);
            }
        };
    };
    /**
     * Class decorator factory that defines the decorated class as a custom element.
     *
     * ```
     * @customElement('my-element')
     * class MyElement {
     *   render() {
     *     return html``;
     *   }
     * }
     * ```
     * @category Decorator
     * @param tagName The name of the custom element to define.
     */
    const customElement = (tagName) => (classOrDescriptor) => (typeof classOrDescriptor === 'function') ?
        legacyCustomElement(tagName, classOrDescriptor) :
        standardCustomElement(tagName, classOrDescriptor);
    const standardProperty = (options, element) => {
        // When decorating an accessor, pass it through and add property metadata.
        // Note, the `hasOwnProperty` check in `createProperty` ensures we don't
        // stomp over the user's accessor.
        if (element.kind === 'method' && element.descriptor &&
            !('value' in element.descriptor)) {
            return Object.assign(Object.assign({}, element), { finisher(clazz) {
                    clazz.createProperty(element.key, options);
                } });
        }
        else {
            // createProperty() takes care of defining the property, but we still
            // must return some kind of descriptor, so return a descriptor for an
            // unused prototype field. The finisher calls createProperty().
            return {
                kind: 'field',
                key: Symbol(),
                placement: 'own',
                descriptor: {},
                // When @babel/plugin-proposal-decorators implements initializers,
                // do this instead of the initializer below. See:
                // https://github.com/babel/babel/issues/9260 extras: [
                //   {
                //     kind: 'initializer',
                //     placement: 'own',
                //     initializer: descriptor.initializer,
                //   }
                // ],
                initializer() {
                    if (typeof element.initializer === 'function') {
                        this[element.key] = element.initializer.call(this);
                    }
                },
                finisher(clazz) {
                    clazz.createProperty(element.key, options);
                }
            };
        }
    };
    const legacyProperty = (options, proto, name) => {
        proto.constructor
            .createProperty(name, options);
    };
    /**
     * A property decorator which creates a LitElement property which reflects a
     * corresponding attribute value. A [[`PropertyDeclaration`]] may optionally be
     * supplied to configure property features.
     *
     * This decorator should only be used for public fields. Private or protected
     * fields should use the [[`internalProperty`]] decorator.
     *
     * @example
     * ```ts
     * class MyElement {
     *   @property({ type: Boolean })
     *   clicked = false;
     * }
     * ```
     * @category Decorator
     * @ExportDecoratedItems
     */
    function property(options) {
        // tslint:disable-next-line:no-any decorator
        return (protoOrDescriptor, name) => (name !== undefined) ?
            legacyProperty(options, protoOrDescriptor, name) :
            standardProperty(options, protoOrDescriptor);
    }

    /**
    @license
    Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
    This code may only be used under the BSD style license found at
    http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
    http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
    found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
    part of the polymer project is also subject to an additional IP rights grant
    found at http://polymer.github.io/PATENTS.txt
    */
    /**
     * Whether the current browser supports `adoptedStyleSheets`.
     */
    const supportsAdoptingStyleSheets = (window.ShadowRoot) &&
        (window.ShadyCSS === undefined || window.ShadyCSS.nativeShadow) &&
        ('adoptedStyleSheets' in Document.prototype) &&
        ('replace' in CSSStyleSheet.prototype);
    const constructionToken = Symbol();
    class CSSResult {
        constructor(cssText, safeToken) {
            if (safeToken !== constructionToken) {
                throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
            }
            this.cssText = cssText;
        }
        // Note, this is a getter so that it's lazy. In practice, this means
        // stylesheets are not created until the first element instance is made.
        get styleSheet() {
            if (this._styleSheet === undefined) {
                // Note, if `supportsAdoptingStyleSheets` is true then we assume
                // CSSStyleSheet is constructable.
                if (supportsAdoptingStyleSheets) {
                    this._styleSheet = new CSSStyleSheet();
                    this._styleSheet.replaceSync(this.cssText);
                }
                else {
                    this._styleSheet = null;
                }
            }
            return this._styleSheet;
        }
        toString() {
            return this.cssText;
        }
    }
    /**
     * Wrap a value for interpolation in a [[`css`]] tagged template literal.
     *
     * This is unsafe because untrusted CSS text can be used to phone home
     * or exfiltrate data to an attacker controlled site. Take care to only use
     * this with trusted input.
     */
    const unsafeCSS = (value) => {
        return new CSSResult(String(value), constructionToken);
    };
    const textFromCSSResult = (value) => {
        if (value instanceof CSSResult) {
            return value.cssText;
        }
        else if (typeof value === 'number') {
            return value;
        }
        else {
            throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
        }
    };
    /**
     * Template tag which which can be used with LitElement's [[LitElement.styles |
     * `styles`]] property to set element styles. For security reasons, only literal
     * string values may be used. To incorporate non-literal values [[`unsafeCSS`]]
     * may be used inside a template string part.
     */
    const css = (strings, ...values) => {
        const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
        return new CSSResult(cssText, constructionToken);
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IMPORTANT: do not change the property name or the assignment expression.
    // This line will be used in regexes to search for LitElement usage.
    // TODO(justinfagnani): inject version number at build time
    (window['litElementVersions'] || (window['litElementVersions'] = []))
        .push('2.5.1');
    /**
     * Sentinal value used to avoid calling lit-html's render function when
     * subclasses do not implement `render`
     */
    const renderNotImplemented = {};
    /**
     * Base element class that manages element properties and attributes, and
     * renders a lit-html template.
     *
     * To define a component, subclass `LitElement` and implement a
     * `render` method to provide the component's template. Define properties
     * using the [[`properties`]] property or the [[`property`]] decorator.
     */
    class LitElement extends UpdatingElement {
        /**
         * Return the array of styles to apply to the element.
         * Override this method to integrate into a style management system.
         *
         * @nocollapse
         */
        static getStyles() {
            return this.styles;
        }
        /** @nocollapse */
        static _getUniqueStyles() {
            // Only gather styles once per class
            if (this.hasOwnProperty(JSCompiler_renameProperty('_styles', this))) {
                return;
            }
            // Take care not to call `this.getStyles()` multiple times since this
            // generates new CSSResults each time.
            // TODO(sorvell): Since we do not cache CSSResults by input, any
            // shared styles will generate new stylesheet objects, which is wasteful.
            // This should be addressed when a browser ships constructable
            // stylesheets.
            const userStyles = this.getStyles();
            if (Array.isArray(userStyles)) {
                // De-duplicate styles preserving the _last_ instance in the set.
                // This is a performance optimization to avoid duplicated styles that can
                // occur especially when composing via subclassing.
                // The last item is kept to try to preserve the cascade order with the
                // assumption that it's most important that last added styles override
                // previous styles.
                const addStyles = (styles, set) => styles.reduceRight((set, s) => 
                // Note: On IE set.add() does not return the set
                Array.isArray(s) ? addStyles(s, set) : (set.add(s), set), set);
                // Array.from does not work on Set in IE, otherwise return
                // Array.from(addStyles(userStyles, new Set<CSSResult>())).reverse()
                const set = addStyles(userStyles, new Set());
                const styles = [];
                set.forEach((v) => styles.unshift(v));
                this._styles = styles;
            }
            else {
                this._styles = userStyles === undefined ? [] : [userStyles];
            }
            // Ensure that there are no invalid CSSStyleSheet instances here. They are
            // invalid in two conditions.
            // (1) the sheet is non-constructible (`sheet` of a HTMLStyleElement), but
            //     this is impossible to check except via .replaceSync or use
            // (2) the ShadyCSS polyfill is enabled (:. supportsAdoptingStyleSheets is
            //     false)
            this._styles = this._styles.map((s) => {
                if (s instanceof CSSStyleSheet && !supportsAdoptingStyleSheets) {
                    // Flatten the cssText from the passed constructible stylesheet (or
                    // undetectable non-constructible stylesheet). The user might have
                    // expected to update their stylesheets over time, but the alternative
                    // is a crash.
                    const cssText = Array.prototype.slice.call(s.cssRules)
                        .reduce((css, rule) => css + rule.cssText, '');
                    return unsafeCSS(cssText);
                }
                return s;
            });
        }
        /**
         * Performs element initialization. By default this calls
         * [[`createRenderRoot`]] to create the element [[`renderRoot`]] node and
         * captures any pre-set values for registered properties.
         */
        initialize() {
            super.initialize();
            this.constructor._getUniqueStyles();
            this.renderRoot = this.createRenderRoot();
            // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
            // element's getRootNode(). While this could be done, we're choosing not to
            // support this now since it would require different logic around de-duping.
            if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
                this.adoptStyles();
            }
        }
        /**
         * Returns the node into which the element should render and by default
         * creates and returns an open shadowRoot. Implement to customize where the
         * element's DOM is rendered. For example, to render into the element's
         * childNodes, return `this`.
         * @returns {Element|DocumentFragment} Returns a node into which to render.
         */
        createRenderRoot() {
            return this.attachShadow(this.constructor.shadowRootOptions);
        }
        /**
         * Applies styling to the element shadowRoot using the [[`styles`]]
         * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
         * available and will fallback otherwise. When Shadow DOM is polyfilled,
         * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
         * is available but `adoptedStyleSheets` is not, styles are appended to the
         * end of the `shadowRoot` to [mimic spec
         * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
         */
        adoptStyles() {
            const styles = this.constructor._styles;
            if (styles.length === 0) {
                return;
            }
            // There are three separate cases here based on Shadow DOM support.
            // (1) shadowRoot polyfilled: use ShadyCSS
            // (2) shadowRoot.adoptedStyleSheets available: use it
            // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
            // rendering
            if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
                window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
            }
            else if (supportsAdoptingStyleSheets) {
                this.renderRoot.adoptedStyleSheets =
                    styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
            }
            else {
                // This must be done after rendering so the actual style insertion is done
                // in `update`.
                this._needsShimAdoptedStyleSheets = true;
            }
        }
        connectedCallback() {
            super.connectedCallback();
            // Note, first update/render handles styleElement so we only call this if
            // connected after first update.
            if (this.hasUpdated && window.ShadyCSS !== undefined) {
                window.ShadyCSS.styleElement(this);
            }
        }
        /**
         * Updates the element. This method reflects property values to attributes
         * and calls `render` to render DOM via lit-html. Setting properties inside
         * this method will *not* trigger another update.
         * @param _changedProperties Map of changed properties with old values
         */
        update(changedProperties) {
            // Setting properties in `render` should not trigger an update. Since
            // updates are allowed after super.update, it's important to call `render`
            // before that.
            const templateResult = this.render();
            super.update(changedProperties);
            // If render is not implemented by the component, don't call lit-html render
            if (templateResult !== renderNotImplemented) {
                this.constructor
                    .render(templateResult, this.renderRoot, { scopeName: this.localName, eventContext: this });
            }
            // When native Shadow DOM is used but adoptedStyles are not supported,
            // insert styling after rendering to ensure adoptedStyles have highest
            // priority.
            if (this._needsShimAdoptedStyleSheets) {
                this._needsShimAdoptedStyleSheets = false;
                this.constructor._styles.forEach((s) => {
                    const style = document.createElement('style');
                    style.textContent = s.cssText;
                    this.renderRoot.appendChild(style);
                });
            }
        }
        /**
         * Invoked on each update to perform rendering tasks. This method may return
         * any value renderable by lit-html's `NodePart` - typically a
         * `TemplateResult`. Setting properties inside this method will *not* trigger
         * the element to update.
         */
        render() {
            return renderNotImplemented;
        }
    }
    /**
     * Ensure this class is marked as `finalized` as an optimization ensuring
     * it will not needlessly try to `finalize`.
     *
     * Note this property name is a string to prevent breaking Closure JS Compiler
     * optimizations. See updating-element.ts for more information.
     */
    LitElement['finalized'] = true;
    /**
     * Reference to the underlying library method used to render the element's
     * DOM. By default, points to the `render` method from lit-html's shady-render
     * module.
     *
     * **Most users will never need to touch this property.**
     *
     * This  property should not be confused with the `render` instance method,
     * which should be overridden to define a template for the element.
     *
     * Advanced users creating a new base class based on LitElement can override
     * this property to point to a custom render method with a signature that
     * matches [shady-render's `render`
     * method](https://lit-html.polymer-project.org/api/modules/shady_render.html#render).
     *
     * @nocollapse
     */
    LitElement.render = render$1;
    /** @nocollapse */
    LitElement.shadowRootOptions = { mode: 'open' };

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IE11 doesn't support classList on SVG elements, so we emulate it with a Set
    class ClassList {
        constructor(element) {
            this.classes = new Set();
            this.changed = false;
            this.element = element;
            const classList = (element.getAttribute('class') || '').split(/\s+/);
            for (const cls of classList) {
                this.classes.add(cls);
            }
        }
        add(cls) {
            this.classes.add(cls);
            this.changed = true;
        }
        remove(cls) {
            this.classes.delete(cls);
            this.changed = true;
        }
        commit() {
            if (this.changed) {
                let classString = '';
                this.classes.forEach((cls) => classString += cls + ' ');
                this.element.setAttribute('class', classString);
            }
        }
    }
    /**
     * Stores the ClassInfo object applied to a given AttributePart.
     * Used to unset existing values when a new ClassInfo object is applied.
     */
    const previousClassesCache = new WeakMap();
    /**
     * A directive that applies CSS classes. This must be used in the `class`
     * attribute and must be the only part used in the attribute. It takes each
     * property in the `classInfo` argument and adds the property name to the
     * element's `class` if the property value is truthy; if the property value is
     * falsey, the property name is removed from the element's `class`. For example
     * `{foo: bar}` applies the class `foo` if the value of `bar` is truthy.
     * @param classInfo {ClassInfo}
     */
    const classMap = directive((classInfo) => (part) => {
        if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
            part.committer.name !== 'class' || part.committer.parts.length > 1) {
            throw new Error('The `classMap` directive must be used in the `class` attribute ' +
                'and must be the only part in the attribute.');
        }
        const { committer } = part;
        const { element } = committer;
        let previousClasses = previousClassesCache.get(part);
        if (previousClasses === undefined) {
            // Write static classes once
            // Use setAttribute() because className isn't a string on SVG elements
            element.setAttribute('class', committer.strings.join(' '));
            previousClassesCache.set(part, previousClasses = new Set());
        }
        const classList = (element.classList || new ClassList(element));
        // Remove old classes that no longer apply
        // We use forEach() instead of for-of so that re don't require down-level
        // iteration.
        previousClasses.forEach((name) => {
            if (!(name in classInfo)) {
                classList.remove(name);
                previousClasses.delete(name);
            }
        });
        // Add or remove classes based on their classMap value
        for (const name in classInfo) {
            const value = classInfo[name];
            if (value != previousClasses.has(name)) {
                // We explicitly want a loose truthy check of `value` because it seems
                // more convenient that '' and 0 are skipped.
                if (value) {
                    classList.add(name);
                    previousClasses.add(name);
                }
                else {
                    classList.remove(name);
                    previousClasses.delete(name);
                }
            }
        }
        if (typeof classList.commit === 'function') {
            classList.commit();
        }
    });

    /**
     * pitchClasses provides the chromatic scale symbols exported as a list:
     * 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
     * @type {Array}
     */
    const pitchClasses = Object.freeze([
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
    ]);
    /**
     * Computes the frequency value of the given midi note
     * with custom tuning
     * @param {number} midiValue - Midi value (0 to 127) of the note
     * @param {number} tuning - The frequency associated to midi value 69 (A4)
     * @returns {number|function} The computed frequency or a computing function
     */
    function midiToFrequency(midiValue, tuning = 440) {
        if (midiValue >= 0 && midiValue <= 127) {
            return tuning * 2 ** ((midiValue - 69) / 12);
        }
        return null;
    }
    /**
     * Computes the midiValue value of the given note in the given octave
     * @param {string} pitchClass - Note in scale (english notation)
     * @param {number} octave - Octave value for note
     */
    function noteToMidi(pitchClass, octave) {
        return (octave + 1) * 12 + pitchClasses.indexOf(pitchClass);
    }
    /**
     * Computes the pitch class as a string representation and octave for the given midi value
     * @param {number} midiValue - midi value for note
     * @returns {Note}
     */
    function midiToNote({ value, velocity = 100 }) {
        const pitchClassIndex = (value - 12 * 2) % 12;
        const octave = (value - pitchClassIndex - 12) / 12;
        return {
            pitchClass: pitchClasses[pitchClassIndex],
            octave,
            frequency: midiToFrequency(value),
            midiValue: value,
            velocity,
        };
    }
    /**
     * Computes the pitch class as a number from 0 to 11
     * @param midiValue - midi value for note
     * @returns {number}
     */
    function computePitchClassIndex(midiValue) {
        return (midiValue - 12 * 2) % 12;
    }
    /**
     *
     * @param midiValue - midi value for note
     * @returns {number} the octave in which the pitchClass for this midi value lies
     */
    function computeOctave(midiValue) {
        return (midiValue - computePitchClassIndex(midiValue) - 12) / 12;
    }
    /**
     * Computes the frequency value of the given note in the given octave
     * @param {string} pitchClass - Note in scale (english notation)
     * @param {number} octave - Octave value for note
     * @param {number} tuning - The frequency associated to midi value 69 (A4)
     */
    function symbolToFrequency(pitchClass, octave, tuning = 440) {
        return midiToFrequency(noteToMidi(pitchClass, octave), tuning);
    }
    /**
     * Pre-computes all the notes within a given octave
     * @param {number} octave - Octave value for note
     * @param {number} tuning - The frequency associated to midi value 69 (A4)
     */
    function createNotes(octave, tuning = 440) {
        return pitchClasses
            .map((pitchClass) => {
            return {
                pitchClass,
                octave,
                frequency: symbolToFrequency(pitchClass, octave, tuning),
                midiValue: noteToMidi(pitchClass, octave),
                velocity: 127,
            };
        })
            .filter((note) => note.frequency !== null);
    }
    /**
     * Pre-computes all the octaves within the midi notes range [16:127]
     * @param {number} tuning - The frequency associated to midi value 69 (A4)
     */
    function createMidiOctaves(tuning = 440) {
        const octaves = [];
        for (let i = 0; i < 10; ++i) {
            octaves.push(createNotes(i, tuning));
        }
        return octaves;
    }

    const octaves = createMidiOctaves(440).map(mapKeys);
    function mapKeys(octave) {
        return octave.map((note) => {
            const isSharp = note.pitchClass.endsWith("#");
            const pitch = isSharp
                ? note.pitchClass.replace("#", "--sharp")
                : note.pitchClass;
            return Object.assign(Object.assign({}, note), { classes: {
                    [pitch]: true,
                    "key--sharp": isSharp,
                    "key--whole": !isSharp,
                    key: true,
                } });
        });
    }
    let Keys = class Keys extends LitElement {
        constructor() {
            super(...arguments);
            this.lowerKey = 36;
            this.higherKey = 61;
            this.mouseControlledKey = null;
        }
        get octaves() {
            return octaves.slice(computeOctave(this.lowerKey), computeOctave(this.higherKey) + 1);
        }
        async connectedCallback() {
            super.connectedCallback();
            this.registerMouseUpHandler();
        }
        registerMouseUpHandler() {
            document.addEventListener("mouseup", this.mouseUp.bind(this));
        }
        mouseUp() {
            if (!!this.mouseControlledKey) {
                this.keyOff(this.mouseControlledKey);
                this.mouseControlledKey = null;
            }
        }
        mouseDown(key) {
            return async (event) => {
                if (event.button !== 0) {
                    return;
                }
                this.mouseControlledKey = key;
                await this.keyOn(key);
            };
        }
        mouseEnter(key) {
            return async () => {
                if (!!this.mouseControlledKey) {
                    await this.keyOff(this.mouseControlledKey);
                    this.mouseControlledKey = key;
                    await this.keyOn(key);
                }
            };
        }
        findKey(midiValue) {
            return octaves[computeOctave(midiValue)][computePitchClassIndex(midiValue)];
        }
        async keyOn(key) {
            this.pressedKeys.add(key.midiValue);
            this.dispatchEvent(new CustomEvent("keyOn", {
                detail: key,
            }));
            await this.requestUpdate();
        }
        async keyOff(key) {
            this.pressedKeys.delete(key.midiValue);
            this.dispatchEvent(new CustomEvent("keyOff", {
                detail: key,
            }));
            await this.requestUpdate();
        }
        createOctaveElement(keys) {
            return html `
      <div class="octave">
        ${keys.map(this.createKeyElement.bind(this))}
      </div>
    `;
        }
        createKeyElement(key) {
            return html `
      <div
        @mousedown=${this.mouseDown(key)}
        @mouseenter=${this.mouseEnter(key)}
        id="${key.midiValue}"
        class="${this.computeKeyClasses(key)}"
      ></div>
    `;
        }
        computeKeyClasses(key) {
            return classMap(Object.assign(Object.assign({}, key.classes), { "key--pressed": this.pressedKeys && this.pressedKeys.has(key.midiValue) }));
        }
        render() {
            return html `
      <div class="octaves">
        ${this.octaves.map(this.createOctaveElement.bind(this))}
      </div>
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Keys.prototype, "lowerKey", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Keys.prototype, "higherKey", void 0);
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], Keys.prototype, "pressedKeys", void 0);
    Keys = __decorate([
        customElement("keys-element")
    ], Keys);

    let Visualizer = class Visualizer extends LitElement {
        constructor() {
            super(...arguments);
            this.width = 1024;
            this.height = 512;
        }
        firstUpdated() {
            this.canvas = this.shadowRoot.getElementById("visualizer");
            this.canvasContext = this.canvas.getContext("2d");
            this.draw();
        }
        connectedCallback() {
            super.connectedCallback();
            this.analyser.fftSize = 2048 * 2;
            this.buffer = new Uint8Array(this.analyser.fftSize);
        }
        draw() {
            if (!this.analyser) {
                return;
            }
            this.drawOscilloscope();
        }
        drawOscilloscope() {
            this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const sliceWidth = (this.canvas.width / this.analyser.fftSize) * 4;
            this.analyser.getByteTimeDomainData(this.buffer);
            this.canvasContext.beginPath();
            this.buffer.forEach((v, i) => {
                const y = (v / 128) * (this.canvas.height / 2);
                const x = i * sliceWidth;
                this.canvasContext.lineTo(x, y);
            });
            this.canvasContext.lineWidth = 1;
            this.canvasContext.strokeStyle = "#b4d455";
            this.canvasContext.stroke();
            requestAnimationFrame(this.drawOscilloscope.bind(this));
        }
        render() {
            return html `
      <canvas
        class="test"
        id="visualizer"
        width=${this.width}
        height=${this.height}
      ></canvas>
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
      canvas {
        border: 1px solid grey;
        border-radius: 0.25rem;
      }
    `;
        }
    };
    __decorate([
        property({ attribute: false }),
        __metadata("design:type", Object)
    ], Visualizer.prototype, "analyser", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Visualizer.prototype, "width", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Visualizer.prototype, "height", void 0);
    Visualizer = __decorate([
        customElement("visualizer-element")
    ], Visualizer);

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
    var OscillatorMode;
    (function (OscillatorMode) {
        OscillatorMode[OscillatorMode["SINE"] = 0] = "SINE";
        OscillatorMode[OscillatorMode["SAWTOOTH"] = 1] = "SAWTOOTH";
        OscillatorMode[OscillatorMode["SQUARE"] = 2] = "SQUARE";
        OscillatorMode[OscillatorMode["TRIANGLE"] = 3] = "TRIANGLE";
    })(OscillatorMode || (OscillatorMode = {}));

    let SineWaveIcon = class SineWaveIcon extends LitElement {
        render() {
            return html `
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
    `;
        }
        static get styles() {
            return css `
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `;
        }
    };
    SineWaveIcon = __decorate([
        customElement("sine-wave-icon")
    ], SineWaveIcon);

    let SquareWaveIcon = class SquareWaveIcon extends LitElement {
        render() {
            return html `
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
    `;
        }
        static get styles() {
            return css `
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `;
        }
    };
    SquareWaveIcon = __decorate([
        customElement("square-wave-icon")
    ], SquareWaveIcon);

    let SawWaveIcon = class SawWaveIcon extends LitElement {
        render() {
            return html `
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
    `;
        }
        static get styles() {
            return css `
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
      }
    `;
        }
    };
    SawWaveIcon = __decorate([
        customElement("saw-wave-icon")
    ], SawWaveIcon);

    let TriangleWaveIcon = class TriangleWaveIcon extends LitElement {
        render() {
            return html `
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
    `;
        }
        static get styles() {
            return css `
      svg {
        width: 12px;
        stroke: var(--stroke-color, #000);
        margin-left: 1px;
      }
    `;
        }
    };
    TriangleWaveIcon = __decorate([
        customElement("triangle-wave-icon")
    ], TriangleWaveIcon);

    let WaveSelector = class WaveSelector extends LitElement {
        constructor() {
            super(...arguments);
            this.value = OscillatorMode.SINE;
        }
        async onSawSelect() {
            this.value = OscillatorMode.SAWTOOTH;
            this.dispatchSelect();
        }
        async onSquareSelect() {
            this.value = OscillatorMode.SQUARE;
            this.dispatchSelect();
        }
        async onSineSelect() {
            this.value = OscillatorMode.SINE;
            this.dispatchSelect();
        }
        async onTriangleSelect() {
            this.value = OscillatorMode.TRIANGLE;
            this.dispatchSelect();
        }
        dispatchSelect() {
            this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
        }
        render() {
            return html `
      <div class="wave-selector">
        <button
          class="${this.computeButtonClasses(OscillatorMode.SAWTOOTH)}"
          @click=${this.onSawSelect}
        >
          <saw-wave-icon class="icon"></saw-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(OscillatorMode.SQUARE)}"
          @click=${this.onSquareSelect}
        >
          <square-wave-icon class="icon"></square-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(OscillatorMode.TRIANGLE)}"
          @click=${this.onTriangleSelect}
        >
          <triangle-wave-icon class="icon"></triangle-wave-icon>
        </button>
        <button
          class="${this.computeButtonClasses(OscillatorMode.SINE)}"
          @click=${this.onSineSelect}
        >
          <sine-wave-icon class="icon"></sine-wave-icon>
        </button>
      </div>
    `;
        }
        computeButtonClasses(wave) {
            return classMap({
                active: wave === this.value,
            });
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], WaveSelector.prototype, "value", void 0);
    WaveSelector = __decorate([
        customElement("wave-selector-element")
    ], WaveSelector);

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
    var OscillatorEvent;
    (function (OscillatorEvent) {
        OscillatorEvent[OscillatorEvent["WAVE_FORM"] = 0] = "WAVE_FORM";
        OscillatorEvent[OscillatorEvent["SEMI_SHIFT"] = 1] = "SEMI_SHIFT";
        OscillatorEvent[OscillatorEvent["CENT_SHIFT"] = 2] = "CENT_SHIFT";
        OscillatorEvent[OscillatorEvent["CYCLE"] = 3] = "CYCLE";
        OscillatorEvent[OscillatorEvent["MIX"] = 4] = "MIX";
        OscillatorEvent[OscillatorEvent["NOISE"] = 5] = "NOISE";
    })(OscillatorEvent || (OscillatorEvent = {}));

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
    function clamp(range, value) {
        if (value >= range.max)
            return range.max;
        if (value <= range.min)
            return range.min;
        return value;
    }

    function scale(value, range, newRange) {
        return Math.round(newRange.min + ((value - range.min) * (newRange.max - newRange.min)) / (range.max - range.min));
    }
    const ANGLE_RANGE = {
        min: -135,
        max: 135,
    };
    const MIDI_RANGE = {
        min: 0,
        max: 127,
    };
    let Knob = class Knob extends LitElement {
        constructor() {
            super(...arguments);
            this.range = MIDI_RANGE;
            this.value = 64;
            this.step = 1;
            this.angle = 0;
        }
        async connectedCallback() {
            super.connectedCallback();
            this.updateAngle();
        }
        toggleActive() {
            const drag = (event) => {
                event.preventDefault();
                this.updateValue(this.computeStep(-event.movementY, event.altKey));
            };
            const destroy = () => {
                document.removeEventListener("mouseup", destroy);
                document.removeEventListener("mousemove", drag);
            };
            document.addEventListener("mousemove", drag);
            document.addEventListener("mouseup", destroy);
        }
        onWheel(event) {
            event.preventDefault();
            this.updateValue(this.computeStep(event.deltaY, event.altKey));
        }
        updateAngle() {
            this.angle = scale(this.value, this.range, ANGLE_RANGE);
        }
        updateValue(step) {
            this.value = clamp(this.range, this.value + step);
        }
        computeStep(increment, sharp = false) {
            return this.computeStepMultiplier(increment, sharp) * this.step;
        }
        computeStepMultiplier(increment, sharp = false) {
            const multiplier = increment < 0 ? -1 : 1;
            return sharp ? multiplier * 0.25 : multiplier;
        }
        updated(changedProperties) {
            if (changedProperties.has("value")) {
                this.updateAngle();
                this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
            }
        }
        render() {
            return html `
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
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], Knob.prototype, "range", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Knob.prototype, "value", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Knob.prototype, "step", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Knob.prototype, "angle", void 0);
    __decorate([
        property({ type: String }),
        __metadata("design:type", String)
    ], Knob.prototype, "label", void 0);
    Knob = __decorate([
        customElement("knob-element")
    ], Knob);

    let PanelWrapper = class PanelWrapper extends LitElement {
        constructor() {
            super(...arguments);
            this.label = String();
        }
        render() {
            return html `
      <div class="wrapper">
          <label>${this.label}</label>
          <div class="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: String }),
        __metadata("design:type", Object)
    ], PanelWrapper.prototype, "label", void 0);
    PanelWrapper = __decorate([
        customElement("panel-wrapper-element")
    ], PanelWrapper);

    class SelectOptions {
        constructor(options) {
            this.currentOption = 0;
            this.options = options;
            this.map = options.map.bind(options);
        }
        get size() {
            return this.options.length;
        }
        set index(index) {
            this.currentOption = index - 1;
            this.next();
        }
        get index() {
            return this.currentOption;
        }
        selectValue(value) {
            const idx = this.options.findIndex((option) => option.value === value);
            if (idx > -1) {
                this.currentOption = idx;
            }
        }
        select(index) {
            this.currentOption = index;
            return this;
        }
        next() {
            if (++this.currentOption >= this.options.length) {
                this.currentOption = 0;
            }
            return this;
        }
        previous() {
            if (--this.currentOption < 0) {
                this.currentOption = this.options.length - 1;
            }
            return this;
        }
        getCurrent() {
            return this.options[this.currentOption];
        }
    }

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
    var MidiControlID;
    (function (MidiControlID) {
        MidiControlID[MidiControlID["NONE"] = -1] = "NONE";
        MidiControlID[MidiControlID["OSC1_SEMI"] = 0] = "OSC1_SEMI";
        MidiControlID[MidiControlID["OSC1_CENT"] = 1] = "OSC1_CENT";
        MidiControlID[MidiControlID["OSC1_CYCLE"] = 2] = "OSC1_CYCLE";
        MidiControlID[MidiControlID["OSC_MIX"] = 3] = "OSC_MIX";
        MidiControlID[MidiControlID["NOISE"] = 4] = "NOISE";
        MidiControlID[MidiControlID["OSC2_SEMI"] = 5] = "OSC2_SEMI";
        MidiControlID[MidiControlID["OSC2_CENT"] = 6] = "OSC2_CENT";
        MidiControlID[MidiControlID["OSC2_CYCLE"] = 7] = "OSC2_CYCLE";
        MidiControlID[MidiControlID["CUTOFF"] = 8] = "CUTOFF";
        MidiControlID[MidiControlID["RESONANCE"] = 9] = "RESONANCE";
        MidiControlID[MidiControlID["DRIVE"] = 10] = "DRIVE";
        MidiControlID[MidiControlID["ATTACK"] = 11] = "ATTACK";
        MidiControlID[MidiControlID["DECAY"] = 12] = "DECAY";
        MidiControlID[MidiControlID["SUSTAIN"] = 13] = "SUSTAIN";
        MidiControlID[MidiControlID["RELEASE"] = 14] = "RELEASE";
        MidiControlID[MidiControlID["LFO1_FREQ"] = 15] = "LFO1_FREQ";
        MidiControlID[MidiControlID["LFO1_MOD"] = 16] = "LFO1_MOD";
        MidiControlID[MidiControlID["LFO2_FREQ"] = 17] = "LFO2_FREQ";
        MidiControlID[MidiControlID["LFO2_MOD"] = 18] = "LFO2_MOD";
        MidiControlID[MidiControlID["CUT_MOD"] = 19] = "CUT_MOD";
        MidiControlID[MidiControlID["CUT_VEL"] = 20] = "CUT_VEL";
        MidiControlID[MidiControlID["CUT_ATTACK"] = 21] = "CUT_ATTACK";
        MidiControlID[MidiControlID["CUT_DECAY"] = 22] = "CUT_DECAY";
    })(MidiControlID || (MidiControlID = {}));
    function toSelectOption(option) {
        return {
            name: MidiControlID[option].replace(/_/g, " "),
            value: option,
        };
    }
    const MidiLearnOptions = new SelectOptions([
        toSelectOption(MidiControlID.OSC1_SEMI),
        toSelectOption(MidiControlID.OSC1_CENT),
        toSelectOption(MidiControlID.OSC1_CYCLE),
        toSelectOption(MidiControlID.OSC_MIX),
        toSelectOption(MidiControlID.NOISE),
        toSelectOption(MidiControlID.OSC2_SEMI),
        toSelectOption(MidiControlID.OSC2_CENT),
        toSelectOption(MidiControlID.OSC2_CYCLE),
        toSelectOption(MidiControlID.ATTACK),
        toSelectOption(MidiControlID.DECAY),
        toSelectOption(MidiControlID.SUSTAIN),
        toSelectOption(MidiControlID.RELEASE),
        toSelectOption(MidiControlID.CUTOFF),
        toSelectOption(MidiControlID.RESONANCE),
        toSelectOption(MidiControlID.DRIVE),
        toSelectOption(MidiControlID.CUT_MOD),
        toSelectOption(MidiControlID.CUT_VEL),
        toSelectOption(MidiControlID.CUT_ATTACK),
        toSelectOption(MidiControlID.CUT_DECAY),
        toSelectOption(MidiControlID.LFO1_FREQ),
        toSelectOption(MidiControlID.LFO1_MOD),
        toSelectOption(MidiControlID.LFO2_FREQ),
        toSelectOption(MidiControlID.LFO2_MOD),
    ]);

    let Oscillator = class Oscillator extends LitElement {
        constructor() {
            super();
            this.label = "Osc";
            this.currentLearnerID = MidiControlID.NONE;
            this.semiControlID = MidiControlID.OSC1_SEMI;
            this.centControlID = MidiControlID.OSC1_CENT;
            this.cycleControlID = MidiControlID.OSC1_CYCLE;
            this.cycleRange = { min: 5, max: 122 };
        }
        connectedCallback() {
            super.connectedCallback();
        }
        onSemiShift(event) {
            this.dispatchChange(OscillatorEvent.SEMI_SHIFT, event.detail.value);
        }
        get semiShiftValue() {
            return this.state.semiShift.value;
        }
        onCentShift(event) {
            this.dispatchChange(OscillatorEvent.CENT_SHIFT, event.detail.value);
        }
        get centShiftValue() {
            return this.state.centShift.value;
        }
        onCycleChange(event) {
            this.dispatchChange(OscillatorEvent.CYCLE, event.detail.value);
        }
        get cycleValue() {
            return this.state.cycle.value;
        }
        onWaveFormChange(event) {
            this.dispatchChange(OscillatorEvent.WAVE_FORM, event.detail.value);
        }
        dispatchChange(type, value) {
            this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
        }
        render() {
            return html `
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
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: String }),
        __metadata("design:type", Object)
    ], Oscillator.prototype, "label", void 0);
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], Oscillator.prototype, "state", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Oscillator.prototype, "currentLearnerID", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Oscillator.prototype, "semiControlID", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Oscillator.prototype, "centControlID", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Oscillator.prototype, "cycleControlID", void 0);
    Oscillator = __decorate([
        customElement("oscillator-element"),
        __metadata("design:paramtypes", [])
    ], Oscillator);

    let OscillatorMix = class OscillatorMix extends LitElement {
        constructor() {
            super(...arguments);
            this.currentLearnerID = MidiControlID.NONE;
        }
        render() {
            return html `
        <panel-wrapper-element class="oscillator-mix">
            <div class="oscillator-mix-control">
                <midi-control-wrapper
                .controlID=${MidiControlID.OSC_MIX}
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
                .controlID=${MidiControlID.NOISE}
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
    `;
        }
        onMixChange(event) {
            this.dispatchChange(OscillatorEvent.MIX, event.detail.value);
        }
        onNoiseChange(event) {
            this.dispatchChange(OscillatorEvent.NOISE, event.detail.value);
        }
        dispatchChange(type, value) {
            this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], OscillatorMix.prototype, "currentLearnerID", void 0);
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], OscillatorMix.prototype, "mix", void 0);
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], OscillatorMix.prototype, "noise", void 0);
    OscillatorMix = __decorate([
        customElement("oscillator-mix-element")
    ], OscillatorMix);

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
    var FilterEvent;
    (function (FilterEvent) {
        FilterEvent[FilterEvent["MODE"] = 0] = "MODE";
        FilterEvent[FilterEvent["CUTOFF"] = 1] = "CUTOFF";
        FilterEvent[FilterEvent["RESONANCE"] = 2] = "RESONANCE";
        FilterEvent[FilterEvent["DRIVE"] = 3] = "DRIVE";
    })(FilterEvent || (FilterEvent = {}));

    var _a$1;
    let MidiControlWrapper = class MidiControlWrapper extends LitElement {
        constructor() {
            super(...arguments);
            this.currentLearnerID = MidiControlID.NONE;
        }
        get hasFocus() {
            return this.currentLearnerID === this.controlID;
        }
        render() {
            return html `
      <div class="${this.computeClassMap()}">
        <slot></slot>
      </div>
    `;
        }
        computeClassMap() {
            return classMap({
                wrapper: true,
                focus: this.hasFocus,
            });
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
      .wrapper.focus {
        animation: control-focus 1s ease-in-out infinite;
      }

      @keyframes control-focus {
        to {
          --control-handle-color: var(--control-hander-color-focused);  
        }
      }
    `;
        }
    };
    __decorate([
        property({ type: Number }),
        __metadata("design:type", typeof (_a$1 = typeof MidiControlID !== "undefined" && MidiControlID) === "function" ? _a$1 : Object)
    ], MidiControlWrapper.prototype, "controlID", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], MidiControlWrapper.prototype, "currentLearnerID", void 0);
    MidiControlWrapper = __decorate([
        customElement("midi-control-wrapper")
    ], MidiControlWrapper);

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
    var FilterMode;
    (function (FilterMode) {
        FilterMode[FilterMode["LOWPASS"] = 0] = "LOWPASS";
        FilterMode[FilterMode["LOWPASS_PLUS"] = 1] = "LOWPASS_PLUS";
        FilterMode[FilterMode["BANDPASS"] = 2] = "BANDPASS";
        FilterMode[FilterMode["HIGHPASS"] = 3] = "HIGHPASS";
    })(FilterMode || (FilterMode = {}));

    let FilterSelector = class FilterSelector extends LitElement {
        constructor() {
            super(...arguments);
            this.value = FilterMode.LOWPASS;
        }
        async onLpSelect() {
            this.value = FilterMode.LOWPASS;
            this.dispatchSelect();
        }
        async onLpPlusSelect() {
            this.value = FilterMode.LOWPASS_PLUS;
            this.dispatchSelect();
        }
        async onBpSelect() {
            this.value = FilterMode.BANDPASS;
            this.dispatchSelect();
        }
        async onHpSelect() {
            this.value = FilterMode.HIGHPASS;
            this.dispatchSelect();
        }
        dispatchSelect() {
            this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
        }
        render() {
            return html `
      <div class="filter-selector">
        <button
          class="${this.computeButtonClasses(FilterMode.LOWPASS_PLUS)}"
          @click=${this.onLpPlusSelect}
        >
          L+
        </button>
        <button
          class="${this.computeButtonClasses(FilterMode.LOWPASS)}"
          @click=${this.onLpSelect}
        >
          LP
        </button>
        <button
          class="${this.computeButtonClasses(FilterMode.BANDPASS)}"
          @click=${this.onBpSelect}
        >
          BP
        </button>
        <button
          class="${this.computeButtonClasses(FilterMode.HIGHPASS)}"
          @click=${this.onHpSelect}
        >
          HP
        </button>
      </div>
    `;
        }
        computeButtonClasses(mode) {
            return classMap({
                active: mode === this.value,
            });
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], FilterSelector.prototype, "value", void 0);
    FilterSelector = __decorate([
        customElement("filter-selector-element")
    ], FilterSelector);

    let Filter = class Filter extends LitElement {
        constructor() {
            super(...arguments);
            this.currentLearnerID = MidiControlID.NONE;
        }
        onCutoffChange(event) {
            this.dispatchChange(FilterEvent.CUTOFF, event.detail.value);
        }
        onResonanceChange(event) {
            this.dispatchChange(FilterEvent.RESONANCE, event.detail.value);
        }
        onDriveChange(event) {
            this.dispatchChange(FilterEvent.DRIVE, event.detail.value);
        }
        onTypeChange(event) {
            this.dispatchChange(FilterEvent.MODE, event.detail.value);
        }
        dispatchChange(type, value) {
            this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
        }
        render() {
            return html `
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
                  controlID=${MidiControlID.CUTOFF}
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
                  controlID=${MidiControlID.RESONANCE}
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
                  controlID=${MidiControlID.DRIVE}
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
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], Filter.prototype, "state", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Filter.prototype, "currentLearnerID", void 0);
    Filter = __decorate([
        customElement("filter-element")
    ], Filter);

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
    var OscillatorEnvelopeEvent;
    (function (OscillatorEnvelopeEvent) {
        OscillatorEnvelopeEvent[OscillatorEnvelopeEvent["ATTACK"] = 0] = "ATTACK";
        OscillatorEnvelopeEvent[OscillatorEnvelopeEvent["DECAY"] = 1] = "DECAY";
        OscillatorEnvelopeEvent[OscillatorEnvelopeEvent["SUSTAIN"] = 2] = "SUSTAIN";
        OscillatorEnvelopeEvent[OscillatorEnvelopeEvent["RELEASE"] = 3] = "RELEASE";
    })(OscillatorEnvelopeEvent || (OscillatorEnvelopeEvent = {}));

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * Stores the StyleInfo object applied to a given AttributePart.
     * Used to unset existing values when a new StyleInfo object is applied.
     */
    const previousStylePropertyCache = new WeakMap();
    /**
     * A directive that applies CSS properties to an element.
     *
     * `styleMap` can only be used in the `style` attribute and must be the only
     * expression in the attribute. It takes the property names in the `styleInfo`
     * object and adds the property values as CSS properties. Property names with
     * dashes (`-`) are assumed to be valid CSS property names and set on the
     * element's style object using `setProperty()`. Names without dashes are
     * assumed to be camelCased JavaScript property names and set on the element's
     * style object using property assignment, allowing the style object to
     * translate JavaScript-style names to CSS property names.
     *
     * For example `styleMap({backgroundColor: 'red', 'border-top': '5px', '--size':
     * '0'})` sets the `background-color`, `border-top` and `--size` properties.
     *
     * @param styleInfo {StyleInfo}
     */
    const styleMap = directive((styleInfo) => (part) => {
        if (!(part instanceof AttributePart) || (part instanceof PropertyPart) ||
            part.committer.name !== 'style' || part.committer.parts.length > 1) {
            throw new Error('The `styleMap` directive must be used in the style attribute ' +
                'and must be the only part in the attribute.');
        }
        const { committer } = part;
        const { style } = committer.element;
        let previousStyleProperties = previousStylePropertyCache.get(part);
        if (previousStyleProperties === undefined) {
            // Write static styles once
            style.cssText = committer.strings.join(' ');
            previousStylePropertyCache.set(part, previousStyleProperties = new Set());
        }
        // Remove old properties that no longer exist in styleInfo
        // We use forEach() instead of for-of so that re don't require down-level
        // iteration.
        previousStyleProperties.forEach((name) => {
            if (!(name in styleInfo)) {
                previousStyleProperties.delete(name);
                if (name.indexOf('-') === -1) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    style[name] = null;
                }
                else {
                    style.removeProperty(name);
                }
            }
        });
        // Add or update properties
        for (const name in styleInfo) {
            previousStyleProperties.add(name);
            if (name.indexOf('-') === -1) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style[name] = styleInfo[name];
            }
            else {
                style.setProperty(name, styleInfo[name]);
            }
        }
    });

    let Fader = class Fader extends LitElement {
        constructor() {
            super(...arguments);
            this.label = String();
            this.value = 127;
        }
        toggleActive(event) {
            const host = this.shadowRoot.host;
            const parent = host.offsetParent;
            const wrapper = this.cursorWrapperElement;
            const height = wrapper.offsetHeight;
            const position = event.pageY - (parent.offsetTop + wrapper.offsetTop);
            this.updateValue((1 - position / height) * 127);
            const drag = (event) => {
                event.preventDefault();
                this.updateValue(this.value - event.movementY);
            };
            const destroy = () => {
                document.removeEventListener("mouseup", destroy);
                document.removeEventListener("mousemove", drag);
            };
            document.addEventListener("mousemove", drag);
            document.addEventListener("mouseup", destroy);
        }
        onWheel(event) {
            event.preventDefault();
            this.updateValue(this.value + event.deltaY);
        }
        updateValue(value) {
            this.value = clamp({ min: 0, max: 127 }, value);
            this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
        }
        computeFaderCursorStyle() {
            return styleMap({
                height: `${(this.value / 127) * 100}%`,
            });
        }
        get cursorElement() {
            return html ` <div
      class="fader-cursor"
      style="${this.computeFaderCursorStyle()}"
    ></div>`;
        }
        get cursorWrapperElement() {
            return this.shadowRoot.querySelector(".cursor-wrapper");
        }
        render() {
            return html `
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
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: String }),
        __metadata("design:type", Object)
    ], Fader.prototype, "label", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Fader.prototype, "value", void 0);
    Fader = __decorate([
        customElement("fader-element")
    ], Fader);

    let Envelope = class Envelope extends LitElement {
        constructor() {
            super(...arguments);
            this.label = "Envelope";
            this.currentLearnerID = MidiControlID.NONE;
        }
        onAttackChange(event) {
            this.dispatchChange(OscillatorEnvelopeEvent.ATTACK, event.detail.value);
        }
        onDecayChange(event) {
            this.dispatchChange(OscillatorEnvelopeEvent.DECAY, event.detail.value);
        }
        onSustainChange(event) {
            this.dispatchChange(OscillatorEnvelopeEvent.SUSTAIN, event.detail.value);
        }
        onReleaseChange(event) {
            this.dispatchChange(OscillatorEnvelopeEvent.RELEASE, event.detail.value);
        }
        dispatchChange(type, value) {
            this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
        }
        render() {
            return html `
      <panel-wrapper-element .label=${this.label}>
        <div class="envelope-controls">
          <midi-control-wrapper
            .controlID=${MidiControlID.ATTACK}
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
            .controlID=${MidiControlID.DECAY}
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
            .controlID=${MidiControlID.SUSTAIN}
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
            .controlID=${MidiControlID.RELEASE}
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
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: String }),
        __metadata("design:type", Object)
    ], Envelope.prototype, "label", void 0);
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], Envelope.prototype, "state", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Envelope.prototype, "currentLearnerID", void 0);
    Envelope = __decorate([
        customElement("envelope-element")
    ], Envelope);

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
    var FilterEnvelopeEvent;
    (function (FilterEnvelopeEvent) {
        FilterEnvelopeEvent[FilterEnvelopeEvent["ATTACK"] = 0] = "ATTACK";
        FilterEnvelopeEvent[FilterEnvelopeEvent["DECAY"] = 1] = "DECAY";
        FilterEnvelopeEvent[FilterEnvelopeEvent["AMOUNT"] = 2] = "AMOUNT";
        FilterEnvelopeEvent[FilterEnvelopeEvent["VELOCITY"] = 3] = "VELOCITY";
    })(FilterEnvelopeEvent || (FilterEnvelopeEvent = {}));

    let FilterEnvelope = class FilterEnvelope extends LitElement {
        constructor() {
            super(...arguments);
            this.currentLearnerID = MidiControlID.NONE;
        }
        onAttackChange(event) {
            this.dispatchChange(FilterEnvelopeEvent.ATTACK, event.detail.value);
        }
        onDecayChange(event) {
            this.dispatchChange(FilterEnvelopeEvent.DECAY, event.detail.value);
        }
        onAmountChange(event) {
            this.dispatchChange(FilterEnvelopeEvent.AMOUNT, event.detail.value);
        }
        onVelocityChange(event) {
            this.dispatchChange(FilterEnvelopeEvent.VELOCITY, event.detail.value);
        }
        dispatchChange(type, value) {
            this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
        }
        render() {
            return html `
      <panel-wrapper-element label="Filter Mod.">
        <div class="envelope-controls">
          <div class="time-controls">
            <midi-control-wrapper
              controlID=${MidiControlID.CUT_ATTACK}
              currentLearnerID=${this.currentLearnerID}
            >
              <fader-element
                label="A"
                .value=${this.state.attack.value}
                @change=${this.onAttackChange}
              ></fader-element>
            </midi-control-wrapper>
            <midi-control-wrapper
              controlID=${MidiControlID.CUT_DECAY}
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
                controlID=${MidiControlID.CUT_MOD}
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
                controlID=${MidiControlID.CUT_VEL}
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
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], FilterEnvelope.prototype, "state", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], FilterEnvelope.prototype, "currentLearnerID", void 0);
    FilterEnvelope = __decorate([
        customElement("filter-envelope-element")
    ], FilterEnvelope);

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
    var LfoEvent;
    (function (LfoEvent) {
        LfoEvent[LfoEvent["WAVE_FORM"] = 0] = "WAVE_FORM";
        LfoEvent[LfoEvent["FREQUENCY"] = 1] = "FREQUENCY";
        LfoEvent[LfoEvent["MOD_AMOUNT"] = 2] = "MOD_AMOUNT";
        LfoEvent[LfoEvent["DESTINATION"] = 3] = "DESTINATION";
    })(LfoEvent || (LfoEvent = {}));

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
    const $ = true;
    const _ = false;
    const chars = {
        A: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, $, $, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
        ],
        B: [
            [$, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, $, $, _],
        ],
        C: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        D: [
            [$, $, $, _, _],
            [$, _, _, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, $, _],
            [$, $, $, _, _],
        ],
        E: [
            [$, $, $, $, $],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, $, $, $, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, $, $, $, $],
        ],
        F: [
            [$, $, $, $, $],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, $, $, $, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
        ],
        G: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, _],
            [$, _, $, $, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, $],
        ],
        H: [
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, $, $, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
        ],
        I: [
            [_, $, $, $, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, $, $, $, _],
        ],
        J: [
            [_, _, $, $, $],
            [_, _, _, $, _],
            [_, _, _, $, _],
            [_, _, _, $, _],
            [_, _, _, $, _],
            [$, _, _, $, _],
            [_, $, $, _, _],
        ],
        K: [
            [$, _, _, _, $],
            [$, _, _, $, _],
            [$, _, $, _, _],
            [$, $, _, _, _],
            [$, _, $, _, _],
            [$, _, _, $, _],
            [$, _, _, _, $],
        ],
        L: [
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, $, $, $, $],
        ],
        M: [
            [$, _, _, _, $],
            [$, $, _, $, $],
            [$, _, $, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
        ],
        N: [
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, _, _, $],
            [$, _, $, _, $],
            [$, _, _, $, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
        ],
        O: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        P: [
            [$, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, $, $, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [$, _, _, _, _],
        ],
        Q: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, $, _, $],
            [$, _, _, $, _],
            [_, $, $, _, $],
        ],
        R: [
            [$, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, $, $, _],
            [$, _, $, _, _],
            [$, _, _, $, _],
            [$, _, _, _, $],
        ],
        S: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, _],
            [_, $, $, $, _],
            [_, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        T: [
            [$, $, $, $, $],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
        ],
        U: [
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        V: [
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, _, $, _],
            [_, _, $, _, _],
        ],
        W: [
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, _, $, _, $],
            [$, _, $, _, $],
            [$, _, $, _, $],
            [_, $, _, $, _],
        ],
        X: [
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, _, $, _],
            [_, _, $, _, _],
            [_, $, _, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
        ],
        Y: [
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, _, $, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
        ],
        Z: [
            [$, $, $, $, $],
            [_, _, _, _, $],
            [_, _, _, $, _],
            [_, _, $, _, _],
            [_, $, _, _, _],
            [$, _, _, _, _],
            [$, $, $, $, $],
        ],
        0: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, $, $],
            [$, _, $, _, $],
            [$, $, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        1: [
            [_, _, $, $, _],
            [_, $, _, $, _],
            [$, _, _, $, _],
            [_, _, _, $, _],
            [_, _, _, $, _],
            [_, _, _, $, _],
            [_, _, _, $, _],
        ],
        2: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [_, _, _, _, $],
            [_, _, $, $, _],
            [_, $, _, _, _],
            [$, _, _, _, _],
            [$, $, $, $, $],
        ],
        3: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [_, _, _, _, $],
            [_, _, $, $, _],
            [_, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        4: [
            [_, _, $, $, _],
            [_, $, _, $, _],
            [$, _, _, $, _],
            [$, _, _, $, _],
            [$, $, $, $, $],
            [_, _, _, $, _],
            [_, _, _, $, _],
        ],
        5: [
            [$, $, $, $, $],
            [$, _, _, _, _],
            [$, _, _, _, _],
            [_, $, $, $, _],
            [_, _, _, _, $],
            [_, _, _, _, $],
            [$, $, $, $, _],
        ],
        6: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, _],
            [$, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        7: [
            [$, $, $, $, $],
            [_, _, _, _, $],
            [_, _, _, $, _],
            [_, _, $, _, _],
            [_, $, _, _, _],
            [_, $, _, _, _],
            [_, $, _, _, _],
        ],
        8: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [_, $, $, $, _],
        ],
        9: [
            [_, $, $, $, _],
            [$, _, _, _, $],
            [$, _, _, _, $],
            [$, $, $, $, $],
            [_, _, _, _, $],
            [_, _, _, _, $],
            [$, $, $, $, _],
        ],
        " ": [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
        ],
        _: [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [$, $, $, $, $],
        ],
        ":": [
            [_, _, _, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, _, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
            [_, _, _, _, _],
        ],
        ".": [
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, _, _, _],
            [_, _, $, _, _],
            [_, _, $, _, _],
        ],
    };

    let LCDChar = class LCDChar extends LitElement {
        render() {
            return html `
      <div class="lcd-char">
        ${this.char.map((ledRow) => this.createLedRow(ledRow))}
      </div>
    `;
        }
        createLedRow(led) {
            return html `
      <div class="led-row">
        ${led.map((led) => this.createLed(led))}
      </div>
    `;
        }
        createLed(isOn) {
            return isOn
                ? html `<div class="led on"></div>`
                : html `<div class="led"></div>`;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Array }),
        __metadata("design:type", Array)
    ], LCDChar.prototype, "char", void 0);
    LCDChar = __decorate([
        customElement("lcd-char-element")
    ], LCDChar);

    let LCD = class LCD extends LitElement {
        render() {
            return html `
      <div class="lcd">
        ${Array.from(this.text).map(this.createLcdChar)}
      </div>
    `;
        }
        createLcdChar(char) {
            const lcdChar = chars[char];
            return html `
      <lcd-char-element .char=${lcdChar} class="char"></lcd-char-element>
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: String }),
        __metadata("design:type", Object)
    ], LCD.prototype, "text", void 0);
    LCD = __decorate([
        customElement("lcd-element")
    ], LCD);

    var _a$2;
    let LCDSelector = class LCDSelector extends LitElement {
        render() {
            return html `
      <div class="lcd-selector">
        <lcd-element .text=${this.options.getCurrent().name}></lcd-element>
        <div class="options">${this.options.map(this.createOptionSelector.bind(this))}</div>
      </div>
    `;
        }
        async connectedCallback() {
            super.connectedCallback();
            this.options.selectValue(this.value);
        }
        createOptionSelector(_, index) {
            return html `
      <button @click=${this.createOptionHandler(index)} class="${this.computeButtonClasses(index)}">${index}</button>
    `;
        }
        computeButtonClasses(index) {
            return classMap({
                active: this.options.index === index,
            });
        }
        createOptionHandler(index) {
            return () => {
                this.options.index = index;
                this.requestUpdate();
                this.dispatchChange(this.options.getCurrent());
            };
        }
        nextOption() {
            this.options.next();
            this.requestUpdate();
            this.dispatchChange(this.options.getCurrent());
        }
        previousOption() {
            this.options.previous();
            this.requestUpdate();
            this.dispatchChange(this.options.getCurrent());
        }
        dispatchChange({ value }) {
            this.dispatchEvent(new CustomEvent("change", { detail: { value } }));
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Object }),
        __metadata("design:type", typeof (_a$2 = typeof SelectOptions !== "undefined" && SelectOptions) === "function" ? _a$2 : Object)
    ], LCDSelector.prototype, "options", void 0);
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], LCDSelector.prototype, "value", void 0);
    LCDSelector = __decorate([
        customElement("lcd-selector-element")
    ], LCDSelector);

    var LfoDestination;
    (function (LfoDestination) {
        LfoDestination[LfoDestination["FREQUENCY"] = 0] = "FREQUENCY";
        LfoDestination[LfoDestination["OSCILLATOR_MIX"] = 1] = "OSCILLATOR_MIX";
        LfoDestination[LfoDestination["CUTOFF"] = 2] = "CUTOFF";
        LfoDestination[LfoDestination["RESONANCE"] = 3] = "RESONANCE";
        LfoDestination[LfoDestination["OSC1_CYCLE"] = 4] = "OSC1_CYCLE";
        LfoDestination[LfoDestination["OSC2_CYCLE"] = 5] = "OSC2_CYCLE";
    })(LfoDestination || (LfoDestination = {}));

    let Lfo = class Lfo extends LitElement {
        constructor() {
            super(...arguments);
            this.label = "LFO";
            this.destinations = new SelectOptions([
                { value: LfoDestination.OSCILLATOR_MIX, name: "OSC MIX" },
                { value: LfoDestination.FREQUENCY, name: "FREQUENCY" },
                { value: LfoDestination.CUTOFF, name: "CUTOFF" },
                // { value: LfoDestination.RESONANCE, name: "RESONANCE" },
                { value: LfoDestination.OSC1_CYCLE, name: "OSC1 CYCLE" },
                { value: LfoDestination.OSC2_CYCLE, name: "OSC2 CYCLE" },
            ]);
            this.shouldMidiLearn = false;
            this.currentLearnerID = MidiControlID.NONE;
            this.frequencyControlID = MidiControlID.LFO1_FREQ;
            this.modAmountControlID = MidiControlID.LFO1_MOD;
        }
        onFrequencyChange(event) {
            this.dispatchChange(LfoEvent.FREQUENCY, event.detail.value);
        }
        onModAmountChange(event) {
            this.dispatchChange(LfoEvent.MOD_AMOUNT, event.detail.value);
        }
        onWaveFormChange(event) {
            this.dispatchChange(LfoEvent.WAVE_FORM, event.detail.value);
        }
        onDestinationChange(event) {
            this.dispatchChange(LfoEvent.DESTINATION, event.detail.value);
        }
        dispatchChange(type, value) {
            this.dispatchEvent(new CustomEvent("change", { detail: { type, value } }));
        }
        render() {
            return html `
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
    `;
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: String }),
        __metadata("design:type", Object)
    ], Lfo.prototype, "label", void 0);
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], Lfo.prototype, "state", void 0);
    __decorate([
        property({ type: Boolean }),
        __metadata("design:type", Object)
    ], Lfo.prototype, "shouldMidiLearn", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Lfo.prototype, "currentLearnerID", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Lfo.prototype, "frequencyControlID", void 0);
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Lfo.prototype, "modAmountControlID", void 0);
    Lfo = __decorate([
        customElement("lfo-element")
    ], Lfo);

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
    function times(op, length) {
        return Array.from({ length }).map((_, i) => op(i));
    }

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
    function strPad(n) {
        return `CHANNEL:${n < 10 ? `0${n}` : `${n}`}`;
    }
    function channel(value, name = strPad(value + 1)) {
        return { value, name };
    }
    const length = 16; // max number of Midi channels
    const MidiChannels = times(channel, length);
    const MidiOmniChannel = -1;
    MidiChannels.unshift(channel(MidiOmniChannel, "CHANNEL:ALL"));

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
    const MidiChannelOptions = new SelectOptions(MidiChannels);

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
    var MenuMode;
    (function (MenuMode) {
        MenuMode[MenuMode["MIDI_LEARN"] = 0] = "MIDI_LEARN";
        MenuMode[MenuMode["MIDI_CHANNEL"] = 1] = "MIDI_CHANNEL";
        MenuMode[MenuMode["PRESET"] = 2] = "PRESET";
    })(MenuMode || (MenuMode = {}));

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
    const PresetOptions = new SelectOptions([
        {
            name: "SAWSEESS",
            value: {
                osc1: {
                    mode: { value: 1 },
                    semiShift: { id: 0, value: 31.75, controller: -1 },
                    centShift: { id: 1, value: 63.5, controller: -1 },
                    cycle: { id: 2, value: 63.5, controller: -1 },
                },
                osc2: {
                    mode: { value: 1 },
                    semiShift: { id: 5, value: 63.5, controller: -1 },
                    centShift: { id: 6, value: 84.66666666666666, controller: -1 },
                    cycle: { id: 7, value: 63.5, controller: -1 },
                },
                osc2Amplitude: { id: 3, value: 24, controller: 21 },
                noiseLevel: { id: 4, value: 0, controller: -1 },
                envelope: {
                    attack: { id: 11, value: 0, controller: -1 },
                    decay: { id: 12, value: 34.925000000000004, controller: -1 },
                    sustain: { id: 13, value: 0, controller: -1 },
                    release: { id: 14, value: 0, controller: -1 },
                },
                filter: {
                    mode: { value: 0 },
                    cutoff: { id: 8, value: 0, controller: 14 },
                    resonance: { id: 9, value: 127, controller: 15 },
                    drive: { id: 10, value: 34, controller: 16 },
                },
                cutoffMod: {
                    attack: { id: 21, value: 0, controller: 19 },
                    decay: { id: 22, value: 9, controller: 20 },
                    amount: { id: 19, value: 21, controller: 17 },
                    velocity: { id: 20, value: 21, controller: 18 },
                },
                lfo1: {
                    mode: { value: 2 },
                    destination: { value: 0 },
                    frequency: { id: 15, value: 15.875, controller: -1 },
                    modAmount: { id: 16, value: 0, controller: -1 },
                },
                lfo2: {
                    mode: { value: 2 },
                    destination: { value: 2 },
                    frequency: { id: 17, value: 31.75, controller: -1 },
                    modAmount: { id: 18, value: 0, controller: -1 },
                },
            },
        },
        {
            name: "GLAZZQON",
            value: {
                osc1: {
                    mode: { value: 2 },
                    semiShift: { id: 0, value: 63.5, controller: -1 },
                    centShift: { id: 1, value: 63.5, controller: -1 },
                    cycle: { id: 2, value: 50.8, controller: -1 },
                },
                osc2: {
                    mode: { value: 2 },
                    semiShift: { id: 5, value: 127, controller: -1 },
                    centShift: { id: 6, value: 76.5, controller: -1 },
                    cycle: { id: 7, value: 73.66666666666667, controller: -1 },
                },
                osc2Amplitude: { id: 3, value: 0, controller: 21 },
                noiseLevel: { id: 4, value: 0, controller: -1 },
                envelope: {
                    attack: { id: 11, value: 0, controller: 19 },
                    decay: { id: 12, value: 2.1166666666666734, controller: -1 },
                    sustain: { id: 13, value: 40, controller: 19 },
                    release: { id: 14, value: 105, controller: 20 },
                },
                filter: {
                    mode: { value: 0 },
                    cutoff: { id: 8, value: 127, controller: 14 },
                    resonance: { id: 9, value: 0, controller: 15 },
                    drive: { id: 10, value: 0, controller: 16 },
                },
                cutoffMod: {
                    attack: { id: 21, value: 0, controller: -1 },
                    decay: { id: 22, value: 35, controller: 18 },
                    amount: { id: 19, value: 0, controller: 17 },
                    velocity: { id: 20, value: 0, controller: 18 },
                },
                lfo1: {
                    mode: { value: 0 },
                    destination: { value: 4 },
                    frequency: { id: 15, value: 44.875, controller: -1 },
                    modAmount: { id: 16, value: 0, controller: -1 },
                },
                lfo2: {
                    mode: { value: 0 },
                    destination: { value: 5 },
                    frequency: { id: 17, value: 56.75, controller: -1 },
                    modAmount: { id: 18, value: 12, controller: -1 },
                },
            },
        },
    ]);

    let Menu = class Menu extends LitElement {
        constructor() {
            super(...arguments);
            this.mode = MenuMode.PRESET;
        }
        render() {
            return html `
      <div class="menu">
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(MenuMode.PRESET)}"
            @click=${this.createSwitchModeHandler(MenuMode.PRESET)}
          >
            PRESET
          </button>
        </div>
        <div class="button-wrapper channel">
          <button
            class="${this.computeButtonClasses(MenuMode.MIDI_CHANNEL)}"
            @click=${this.createSwitchModeHandler(MenuMode.MIDI_CHANNEL)}
          >
            CHANNEL
          </button>
        </div>
        <div class="button-wrapper">
          <button
            class="${this.computeButtonClasses(MenuMode.MIDI_LEARN)}"
            @click=${this.createSwitchModeHandler(MenuMode.MIDI_LEARN)}
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
    `;
        }
        computeButtonClasses(mode) {
            return classMap({
                active: this.mode === mode,
            });
        }
        createSwitchModeHandler(mode) {
            switch (mode) {
                case MenuMode.MIDI_CHANNEL:
                    return () => {
                        this.mode = MenuMode.MIDI_CHANNEL;
                        this.dispatchChange();
                    };
                case MenuMode.MIDI_LEARN:
                    return () => {
                        this.mode = MenuMode.MIDI_LEARN;
                        this.dispatchChange();
                    };
                case MenuMode.PRESET:
                    return () => {
                        this.mode = MenuMode.PRESET;
                        this.dispatchChange();
                    };
            }
        }
        nextOption() {
            this.options.next();
            this.dispatchChange(true);
            this.requestUpdate();
        }
        previousOption() {
            this.options.previous();
            this.dispatchChange(true);
            this.requestUpdate();
        }
        dispatchChange(shouldUpdate = false) {
            this.dispatchEvent(new CustomEvent("change", {
                detail: {
                    type: this.mode,
                    option: this.options.getCurrent(),
                    shouldUpdate,
                },
            }));
        }
        get options() {
            switch (this.mode) {
                case MenuMode.PRESET:
                    return PresetOptions;
                case MenuMode.MIDI_CHANNEL:
                    return MidiChannelOptions;
                case MenuMode.MIDI_LEARN:
                default:
                    return MidiLearnOptions;
            }
        }
        static get styles() {
            // noinspection CssUnresolvedCustomProperty
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Number }),
        __metadata("design:type", Object)
    ], Menu.prototype, "mode", void 0);
    Menu = __decorate([
        customElement("menu-element")
    ], Menu);

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
    const BooleanParam = Object.freeze({
      TRUE: 1,
      FALSE: 0,
    });

    const VoiceState = Object.freeze({
      DISPOSED: 0,
      STARTED: 1,
      STOPPING: 2,
      STOPPED: 3,
    });

    const WaveFormParam = Object.freeze({
      SINE: 0,
      SAWTOOTH: 1,
      SQUARE: 2,
      TRIANGLE: 3,
    });

    const FilterModeParam = Object.freeze({
      LOWPASS: 0,
      LOWPASS_PLUS: 1,
      BANDPASS: 2,
      HIGHPASS: 3,
    });

    const LfoDestinationParam = Object.freeze({
      FREQUENCY: 0,
      OSCILLATOR_MIX: 1,
      CUTOFF: 2,
      RESONANCE: 3,
      OSC1_CYCLE: 4,
      OSC2_CYCLE: 5,
    });

    const staticParameterDescriptors = [
      {
        name: "state",
        defaultValue: VoiceState.DISPOSED,
        minValue: VoiceState.DISPOSED,
        maxValue: VoiceState.STOPPED,
        automationRate: "k-rate",
      },
      {
        name: "osc1",
        defaultValue: WaveFormParam.SINE,
        minValue: BooleanParam.SINE,
        maxValue: BooleanParam.TRIANGLE,
        automationRate: "k-rate",
      },
      {
        name: "osc2",
        defaultValue: WaveFormParam.SINE,
        minValue: BooleanParam.SINE,
        maxValue: BooleanParam.TRIANGLE,
        automationRate: "k-rate",
      },
      {
        name: "lfo1Mode",
        defaultValue: WaveFormParam.SINE,
        minValue: BooleanParam.SINE,
        maxValue: BooleanParam.TRIANGLE,
        automationRate: "k-rate",
      },
      {
        name: "lfo2Mode",
        defaultValue: WaveFormParam.SINE,
        minValue: BooleanParam.SINE,
        maxValue: BooleanParam.TRIANGLE,
        automationRate: "k-rate",
      },
      {
        name: "lfo1Destination",
        defaultValue: LfoDestinationParam.OSCILLATOR_MIX,
        minValue: LfoDestinationParam.FREQUENCY,
        maxValue: LfoDestinationParam.OSC_2_CYCLE,
        automationRate: "k-rate",
      },
      {
        name: "lfo2Destination",
        defaultValue: LfoDestinationParam.CUTOFF,
        minValue: LfoDestinationParam.FREQUENCY,
        maxValue: LfoDestinationParam.OSC_2_CYCLE,
        automationRate: "k-rate",
      },
      {
        name: "filterMode",
        defaultValue: FilterModeParam.LOWPASS,
        minValue: FilterModeParam.LOWPASS,
        maxValue: FilterModeParam.HIGHPASS,
        automationRate: "k-rate",
      },
      {
        name: "velocity",
        defaultValue: 127,
        minValue: 0,
        maxValue: 127,
        automationRate: "k-rate",
      },
    ];

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
    class WasmVoiceNode extends AudioWorkletNode {
        constructor(audioContext) {
            super(audioContext, "voice");
            this.params = this.parameters;
        }
        start() {
            this.params.get("state").value = VoiceState.STARTED;
        }
        stop() {
            this.params.get("state").value = VoiceState.STOPPED;
        }
        get frequency() {
            return this.params.get("frequency");
        }
        get velocity() {
            return this.params.get("velocity");
        }
        get amplitude() {
            return this.params.get("amplitude");
        }
        get amplitudeAttack() {
            return this.params.get("amplitudeAttack");
        }
        get amplitudeDecay() {
            return this.params.get("amplitudeDecay");
        }
        get amplitudeSustain() {
            return this.params.get("amplitudeSustain");
        }
        get amplitudeRelease() {
            return this.params.get("amplitudeRelease");
        }
        get cutoff() {
            return this.params.get("cutoff");
        }
        get resonance() {
            return this.params.get("resonance");
        }
        get drive() {
            return this.params.get("drive");
        }
        get cutoffEnvelopeAmount() {
            return this.params.get("cutoffEnvelopeAmount");
        }
        get cutoffEnvelopeVelocity() {
            return this.params.get("cutoffEnvelopeVelocity");
        }
        get cutoffAttack() {
            return this.params.get("cutoffAttack");
        }
        get cutoffDecay() {
            return this.params.get("cutoffDecay");
        }
        get osc1SemiShift() {
            return this.params.get("osc1SemiShift");
        }
        get osc1CentShift() {
            return this.params.get("osc1CentShift");
        }
        get osc1Cycle() {
            return this.params.get("osc1Cycle");
        }
        get osc2SemiShift() {
            return this.params.get("osc2SemiShift");
        }
        get osc2CentShift() {
            return this.params.get("osc2CentShift");
        }
        get osc2Cycle() {
            return this.params.get("osc2Cycle");
        }
        get osc2Amplitude() {
            return this.params.get("osc2Amplitude");
        }
        get noiseLevel() {
            return this.params.get("noiseLevel");
        }
        get osc1() {
            return this.params.get("osc1");
        }
        get osc2() {
            return this.params.get("osc2");
        }
        get filterMode() {
            return this.params.get("filterMode");
        }
        get lfo1Frequency() {
            return this.params.get("lfo1Frequency");
        }
        get lfo1ModAmount() {
            return this.params.get("lfo1ModAmount");
        }
        get lfo1Mode() {
            return this.params.get("lfo1Mode");
        }
        get lfo1Destination() {
            return this.params.get("lfo1Destination");
        }
        get lfo2Frequency() {
            return this.params.get("lfo2Frequency");
        }
        get lfo2ModAmount() {
            return this.params.get("lfo2ModAmount");
        }
        get lfo2Mode() {
            return this.params.get("lfo2Mode");
        }
        get lfo2Destination() {
            return this.params.get("lfo2Destination");
        }
    }

    class SelectControl {
        constructor(value) {
            this.value = value;
            this.clone = this.clone.bind(this);
        }
        clone() {
            return Object.assign({}, this);
        }
    }
    class MidiControl {
        constructor(id, value, controller = -1) {
            this.id = id;
            this.value = value;
            this.controller = controller;
            this.clone = this.clone.bind(this);
        }
        clone() {
            return Object.assign({}, this);
        }
    }

    function findMidiControlEntries(state) {
        const midiControls = [];
        for (const value of Object.values(state)) {
            if (value instanceof MidiControl) {
                midiControls.push([value.id, value]);
            }
            else if (value instanceof Object) {
                midiControls.push(...findMidiControlEntries(value));
            }
        }
        return midiControls;
    }
    function computeMidiControlMap(state) {
        const midiControlEntries = findMidiControlEntries(state);
        return new Map(midiControlEntries);
    }
    function mapState(state) {
        return {
            osc1: {
                mode: new SelectControl(state.osc1.mode.value),
                semiShift: new MidiControl(MidiControlID.OSC1_SEMI, state.osc1.semiShift.value, state.osc1.semiShift.controller),
                centShift: new MidiControl(MidiControlID.OSC1_CENT, state.osc1.centShift.value, state.osc1.centShift.controller),
                cycle: new MidiControl(MidiControlID.OSC1_CYCLE, state.osc1.cycle.value, state.osc1.cycle.controller),
            },
            osc2: {
                mode: new SelectControl(state.osc2.mode.value),
                semiShift: new MidiControl(MidiControlID.OSC2_SEMI, state.osc2.semiShift.value, state.osc2.semiShift.controller),
                centShift: new MidiControl(MidiControlID.OSC2_CENT, state.osc2.centShift.value, state.osc2.centShift.controller),
                cycle: new MidiControl(MidiControlID.OSC2_CYCLE, state.osc2.cycle.value, state.osc2.cycle.controller),
            },
            osc2Amplitude: new MidiControl(MidiControlID.OSC_MIX, state.osc2Amplitude.value, state.osc2Amplitude.controller),
            noiseLevel: new MidiControl(MidiControlID.NOISE, state.noiseLevel.value, state.noiseLevel.controller),
            envelope: {
                attack: new MidiControl(MidiControlID.ATTACK, state.envelope.attack.value, state.envelope.attack.controller),
                decay: new MidiControl(MidiControlID.DECAY, state.envelope.decay.value, state.envelope.decay.controller),
                sustain: new MidiControl(MidiControlID.SUSTAIN, state.envelope.sustain.value, state.envelope.sustain.controller),
                release: new MidiControl(MidiControlID.RELEASE, state.envelope.release.value, state.envelope.release.controller),
            },
            filter: {
                mode: new SelectControl(state.filter.mode.value),
                cutoff: new MidiControl(MidiControlID.CUTOFF, state.filter.cutoff.value, state.filter.cutoff.controller),
                resonance: new MidiControl(MidiControlID.RESONANCE, state.filter.resonance.value, state.filter.resonance.controller),
                drive: new MidiControl(MidiControlID.DRIVE, state.filter.drive.value, state.filter.drive.controller),
            },
            cutoffMod: {
                attack: new MidiControl(MidiControlID.CUT_ATTACK, state.cutoffMod.attack.value, state.cutoffMod.attack.controller),
                decay: new MidiControl(MidiControlID.CUT_DECAY, state.cutoffMod.decay.value, state.cutoffMod.decay.controller),
                amount: new MidiControl(MidiControlID.CUT_MOD, state.cutoffMod.amount.value, state.cutoffMod.amount.controller),
                velocity: new MidiControl(MidiControlID.CUT_VEL, state.cutoffMod.velocity.value, state.cutoffMod.velocity.controller),
            },
            lfo1: {
                mode: new SelectControl(state.lfo1.mode.value),
                destination: new SelectControl(state.lfo1.destination.value),
                frequency: new MidiControl(MidiControlID.LFO1_FREQ, state.lfo1.frequency.value, state.lfo1.frequency.controller),
                modAmount: new MidiControl(MidiControlID.LFO1_MOD, state.lfo1.modAmount.value, state.lfo1.modAmount.controller),
            },
            lfo2: {
                mode: new SelectControl(state.lfo2.mode.value),
                destination: new SelectControl(state.lfo2.destination.value),
                frequency: new MidiControl(MidiControlID.LFO2_FREQ, state.lfo2.frequency.value, state.lfo2.frequency.controller),
                modAmount: new MidiControl(MidiControlID.LFO2_MOD, state.lfo2.modAmount.value, state.lfo2.modAmount.controller),
            },
        };
    }
    function createVoiceState(state) {
        const newState = mapState(state);
        const midiControlMap = computeMidiControlMap(newState);
        return Object.assign(newState, {
            findMidiControlById(id) {
                return midiControlMap.get(id);
            },
            getMidiControls() {
                return midiControlMap.values();
            },
        });
    }

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
    class Dispatcher extends EventTarget {
        constructor() {
            super(...arguments);
            this.observers = new Map();
        }
        dispatch(actionId, detail) {
            this.dispatchEvent(new CustomEvent(actionId, { detail }));
            return this;
        }
        subscribe(actionId, callback) {
            const observer = (event) => {
                callback(event.detail);
            };
            this.observers.set(callback, observer);
            this.addEventListener(actionId, observer);
            return this;
        }
        unsubscribe(actionId, callback) {
            this.removeEventListener(actionId, this.observers.get(callback));
            this.observers.delete(callback);
            return this;
        }
    }
    const GlobalDispatcher = new Dispatcher();

    var MidiMessageEvent;
    (function (MidiMessageEvent) {
        MidiMessageEvent["NOTE_ON"] = "NOTE_ON";
        MidiMessageEvent["NOTE_OFF"] = "NOTE_OFF";
        MidiMessageEvent["NOTE_CHANGE"] = "NOTE_CHANGE";
        MidiMessageEvent["CONTROL_CHANGE"] = "CONTROL_CHANGE";
    })(MidiMessageEvent || (MidiMessageEvent = {}));

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
    var VoiceEvent;
    (function (VoiceEvent) {
        VoiceEvent["NOTE_ON"] = "NOTE_ON";
        VoiceEvent["NOTE_OFF"] = "NOTE_OFF";
        VoiceEvent["OSC1"] = "OSC1";
        VoiceEvent["OSC_MIX"] = "OSC_MIX";
        VoiceEvent["NOISE"] = "NOISE";
        VoiceEvent["OSC2"] = "OSC2";
        VoiceEvent["FILTER"] = "FILTER";
        VoiceEvent["ENVELOPE"] = "ENVELOPE";
        VoiceEvent["LFO1"] = "LFO1";
        VoiceEvent["LFO2"] = "LFO2";
        VoiceEvent["CUTOFF_MOD"] = "CUTOFF_MOD";
    })(VoiceEvent || (VoiceEvent = {}));

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
    var KeyboardMessage;
    (function (KeyboardMessage) {
        KeyboardMessage["NOTE_ON"] = "NOTE_ON";
        KeyboardMessage["NOTE_OFF"] = "NOTE_OFF";
    })(KeyboardMessage || (KeyboardMessage = {}));

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
    function* createVoiceGenerator(audioContext) {
        for (;;) {
            yield new WasmVoiceNode(audioContext);
        }
    }
    class VoiceManager extends Dispatcher {
        constructor(audioContext) {
            super();
            this.voiceGenerator = createVoiceGenerator(audioContext);
            this.voices = new Map();
            this.output = new GainNode(audioContext);
            this.onMidiNoteOn = this.onMidiNoteOn.bind(this);
            this.onMidiNoteOff = this.onMidiNoteOff.bind(this);
            this.onMidiCC = this.onMidiCC.bind(this);
            this.setState(createVoiceState(PresetOptions.getCurrent().value));
        }
        next({ frequency, midiValue, velocity = 60 }) {
            if (this.voices.has(midiValue)) {
                return this.voices.get(midiValue);
            }
            const voice = this.voiceGenerator.next().value;
            voice.frequency.value = frequency;
            voice.velocity.value = velocity;
            voice.osc1.value = this.state.osc1.mode.value;
            voice.osc1SemiShift.value = this.state.osc1.semiShift.value;
            voice.osc1CentShift.value = this.state.osc1.centShift.value;
            voice.osc1Cycle.value = this.state.osc1.cycle.value;
            voice.osc2.value = this.state.osc2.mode.value;
            voice.osc2SemiShift.value = this.state.osc2.semiShift.value;
            voice.osc2CentShift.value = this.state.osc2.centShift.value;
            voice.osc2Cycle.value = this.state.osc2.cycle.value;
            voice.osc2Amplitude.value = this.state.osc2Amplitude.value;
            voice.noiseLevel.value = this.state.noiseLevel.value;
            voice.amplitudeAttack.value = this.state.envelope.attack.value;
            voice.amplitudeDecay.value = this.state.envelope.decay.value;
            voice.amplitudeSustain.value = this.state.envelope.sustain.value;
            voice.amplitudeRelease.value = this.state.envelope.release.value;
            voice.filterMode.value = this.state.filter.mode.value;
            voice.cutoff.value = this.state.filter.cutoff.value;
            voice.resonance.value = this.state.filter.resonance.value;
            voice.drive.value = this.state.filter.drive.value;
            voice.cutoffAttack.value = this.state.cutoffMod.attack.value;
            voice.cutoffDecay.value = this.state.cutoffMod.decay.value;
            voice.cutoffEnvelopeAmount.value = this.state.cutoffMod.amount.value;
            voice.cutoffEnvelopeVelocity.value = this.state.cutoffMod.velocity.value;
            voice.lfo1Frequency.value = this.state.lfo1.frequency.value;
            voice.lfo1ModAmount.value = this.state.lfo1.modAmount.value;
            voice.lfo1Mode.value = this.state.lfo1.mode.value;
            voice.lfo1Destination.value = this.state.lfo1.destination.value;
            voice.lfo2Frequency.value = this.state.lfo2.frequency.value;
            voice.lfo2ModAmount.value = this.state.lfo2.modAmount.value;
            voice.lfo2Mode.value = this.state.lfo2.mode.value;
            voice.lfo2Destination.value = this.state.lfo2.destination.value;
            this.voices.set(midiValue, voice);
            voice.start();
            voice.connect(this.output);
            return voice;
        }
        setMidiController(midiController) {
            this.midiController = midiController
                .subscribe(MidiMessageEvent.NOTE_ON, this.onMidiNoteOn)
                .subscribe(MidiMessageEvent.NOTE_OFF, this.onMidiNoteOff)
                .subscribe(MidiMessageEvent.CONTROL_CHANGE, this.onMidiCC);
            this.bindMidiControls();
            return this;
        }
        setKeyBoardcontroller(keyBoardController) {
            keyBoardController
                .subscribe(KeyboardMessage.NOTE_ON, this.onMidiNoteOn)
                .subscribe(KeyboardMessage.NOTE_OFF, this.onMidiNoteOff);
            return this;
        }
        onMidiNoteOn(message) {
            const note = midiToNote(message.data);
            this.next(note);
            this.dispatch(VoiceEvent.NOTE_ON, note);
        }
        onMidiNoteOff(message) {
            const note = { midiValue: message.data.value };
            this.stop(note);
            this.dispatch(VoiceEvent.NOTE_OFF, note);
        }
        onMidiCC(message) {
            const midiControl = this.state.findMidiControlById(message.controlID);
            if (!midiControl) {
                return;
            }
            midiControl.controller = message.data.control;
            midiControl.value = message.data.value;
            if (message.isMidiLearning) {
                this.midiController.mapControl(message.data.control, midiControl.id);
            }
            this.dispatchCC(midiControl);
        }
        dispatchCC(control) {
            switch (control.id) {
                case MidiControlID.OSC1_SEMI:
                    return this.dispatch(VoiceEvent.OSC1, Object.assign(Object.assign({}, this.state.osc1), { semiShift: control.clone() }));
                case MidiControlID.OSC1_CENT:
                    return this.dispatch(VoiceEvent.OSC1, Object.assign(Object.assign({}, this.state.osc1), { centShift: control.clone() }));
                case MidiControlID.OSC1_CYCLE:
                    return this.dispatch(VoiceEvent.OSC1, Object.assign(Object.assign({}, this.state.osc1), { cycle: control.clone() }));
                case MidiControlID.OSC2_SEMI:
                    return this.dispatch(VoiceEvent.OSC2, Object.assign(Object.assign({}, this.state.osc2), { centShift: control.clone() }));
                case MidiControlID.OSC2_CENT:
                    return this.dispatch(VoiceEvent.OSC2, Object.assign(Object.assign({}, this.state.osc2), { centShift: control.clone() }));
                case MidiControlID.OSC2_CYCLE:
                    return this.dispatch(VoiceEvent.OSC2, Object.assign(Object.assign({}, this.state.osc2), { cycle: control.clone() }));
                case MidiControlID.OSC_MIX:
                    return this.dispatch(VoiceEvent.OSC_MIX, control.clone());
                case MidiControlID.NOISE:
                    return this.dispatch(VoiceEvent.NOISE, control.clone());
                case MidiControlID.CUTOFF:
                    return this.dispatch(VoiceEvent.FILTER, Object.assign(Object.assign({}, this.state.filter), { cutoff: control.clone() }));
                case MidiControlID.RESONANCE:
                    return this.dispatch(VoiceEvent.FILTER, Object.assign(Object.assign({}, this.state.filter), { resonance: control.clone() }));
                case MidiControlID.DRIVE:
                    return this.dispatch(VoiceEvent.FILTER, Object.assign(Object.assign({}, this.state.filter), { drive: control.clone() }));
                case MidiControlID.ATTACK:
                    return this.dispatch(VoiceEvent.ENVELOPE, Object.assign(Object.assign({}, this.state.envelope), { attack: control.clone() }));
                case MidiControlID.DECAY:
                    return this.dispatch(VoiceEvent.ENVELOPE, Object.assign(Object.assign({}, this.state.envelope), { decay: control.clone() }));
                case MidiControlID.SUSTAIN:
                    return this.dispatch(VoiceEvent.ENVELOPE, Object.assign(Object.assign({}, this.state.envelope), { sustain: control.clone() }));
                case MidiControlID.RELEASE:
                    return this.dispatch(VoiceEvent.ENVELOPE, Object.assign(Object.assign({}, this.state.envelope), { release: control.clone() }));
                case MidiControlID.LFO1_FREQ:
                    return this.dispatch(VoiceEvent.LFO1, Object.assign(Object.assign({}, this.state.lfo1), { frequency: control.clone() }));
                case MidiControlID.LFO1_MOD:
                    return this.dispatch(VoiceEvent.LFO1, Object.assign(Object.assign({}, this.state.lfo1), { modAmount: control.clone() }));
                case MidiControlID.LFO2_FREQ:
                    return this.dispatch(VoiceEvent.LFO2, Object.assign(Object.assign({}, this.state.lfo2), { frequency: control.clone() }));
                case MidiControlID.LFO2_MOD:
                    return this.dispatch(VoiceEvent.LFO2, Object.assign(Object.assign({}, this.state.lfo2), { modAmount: control.clone() }));
                case MidiControlID.CUT_ATTACK:
                    return this.dispatch(VoiceEvent.CUTOFF_MOD, Object.assign(Object.assign({}, this.state.cutoffMod), { attack: control.clone() }));
                case MidiControlID.CUT_DECAY:
                    return this.dispatch(VoiceEvent.CUTOFF_MOD, Object.assign(Object.assign({}, this.state.cutoffMod), { decay: control.clone() }));
                case MidiControlID.CUT_MOD:
                    return this.dispatch(VoiceEvent.CUTOFF_MOD, Object.assign(Object.assign({}, this.state.cutoffMod), { amount: control.clone() }));
                case MidiControlID.CUT_VEL:
                    return this.dispatch(VoiceEvent.CUTOFF_MOD, Object.assign(Object.assign({}, this.state.cutoffMod), { velocity: control.clone() }));
            }
        }
        stop({ midiValue }) {
            if (this.voices.has(midiValue)) {
                this.voices.get(midiValue).stop();
                this.voices.delete(midiValue);
            }
        }
        connect(input) {
            this.output.connect(input);
        }
        getState() {
            return Object.assign({}, this.state);
        }
        setState(newState) {
            this.state = createVoiceState(newState);
            this.bindMidiControls();
            return this.getState();
        }
        bindMidiControls() {
            if (!this.state) {
                return;
            }
            if (!this.midiController) {
                return;
            }
            for (const control of this.state.getMidiControls()) {
                this.midiController.mapControl(control.controller, control.id);
            }
        }
        setOsc1Mode(newMode) {
            this.state.osc1.mode.value = newMode;
            this.dispatchUpdate((voice) => (voice.osc1.value = newMode));
            return this;
        }
        setOsc1SemiShift(newSemiShift) {
            this.state.osc1.semiShift.value = newSemiShift;
            this.dispatchUpdate((voice) => (voice.osc1SemiShift.value = newSemiShift));
            return this;
        }
        setOsc1CentShift(newCentShift) {
            this.state.osc1.centShift.value = newCentShift;
            this.dispatchUpdate((voice) => (voice.osc1CentShift.value = newCentShift));
            return this;
        }
        setOsc1Cycle(newCycle) {
            this.state.osc1.cycle.value = newCycle;
            this.dispatchUpdate((voice) => (voice.osc1Cycle.value = newCycle));
            return this;
        }
        get osc1() {
            return this.state.osc1;
        }
        setOsc2Mode(newMode) {
            this.state.osc2.mode.value = newMode;
            this.dispatchUpdate((voice) => (voice.osc2.value = newMode));
            return this;
        }
        setOsc2SemiShift(newSemiShift) {
            this.state.osc2.semiShift.value = newSemiShift;
            this.dispatchUpdate((voice) => (voice.osc2SemiShift.value = newSemiShift));
            return this;
        }
        setOsc2CentShift(newCentShift) {
            this.state.osc2.centShift.value = newCentShift;
            this.dispatchUpdate((voice) => (voice.osc2CentShift.value = newCentShift));
            return this;
        }
        setOsc2Cycle(newCycle) {
            this.state.osc2.cycle.value = newCycle;
            this.dispatchUpdate((voice) => (voice.osc2Cycle.value = newCycle));
            return this;
        }
        get osc2() {
            return this.state.osc2;
        }
        setNoiseLevel(newLevel) {
            this.state.noiseLevel.value = newLevel;
            this.dispatchUpdate((voice) => (voice.noiseLevel.value = newLevel));
            return this;
        }
        setAmplitudeEnvelopeAttack(newAttackTime) {
            this.state.envelope.attack.value = newAttackTime;
            return this;
        }
        setAmplitudeEnvelopeDecay(newDecayTime) {
            this.state.envelope.decay.value = newDecayTime;
            return this;
        }
        setAmplitudeEnvelopeSustain(newSustainLevel) {
            this.state.envelope.sustain.value = newSustainLevel;
            return this;
        }
        setAmplitudeEnvelopeRelease(newReleaseTime) {
            this.state.envelope.release.value = newReleaseTime;
            return this;
        }
        get envelope() {
            return this.state.envelope;
        }
        setOsc2Amplitude(newOsc2Amplitude) {
            this.state.osc2Amplitude.value = newOsc2Amplitude;
            this.dispatchUpdate((voice) => (voice.osc2Amplitude.value = newOsc2Amplitude));
            return this;
        }
        get osc2Amplitude() {
            return this.state.osc2Amplitude;
        }
        setFilterMode(newMode) {
            this.state.filter.mode.value = newMode;
            this.dispatchUpdate((voice) => (voice.filterMode.value = newMode));
            return this;
        }
        setFilterCutoff(newCutoff) {
            this.state.filter.cutoff.value = newCutoff;
            this.dispatchUpdate((voice) => (voice.cutoff.value = newCutoff));
            return this;
        }
        setFilterResonance(newResonance) {
            this.state.filter.resonance.value = newResonance;
            this.dispatchUpdate((voice) => (voice.resonance.value = newResonance));
            return this;
        }
        setDrive(newDrive) {
            this.state.filter.drive.value = newDrive;
            this.dispatchUpdate((voice) => (voice.drive.value = newDrive));
            return this;
        }
        get filter() {
            return this.state.filter;
        }
        setCutoffEnvelopeAmount(newAmount) {
            this.state.cutoffMod.amount.value = newAmount;
            return this;
        }
        setCutoffEnvelopeVelocity(newVelocity) {
            this.state.cutoffMod.velocity.value = newVelocity;
            return this;
        }
        setCutoffEnvelopeAttack(newAttackTime) {
            this.state.cutoffMod.attack.value = newAttackTime;
            return this;
        }
        setCutoffEnvelopeDecay(newDecayTime) {
            this.state.cutoffMod.decay.value = newDecayTime;
            return this;
        }
        setLfo1Mode(newMode) {
            this.state.lfo1.mode.value = newMode;
            this.dispatchUpdate((voice) => (voice.lfo1Mode.value = newMode));
            return this;
        }
        get lfo1() {
            return this.state.lfo1;
        }
        setLfo1Destination(newDestination) {
            this.state.lfo1.destination.value = newDestination;
            this.dispatchUpdate((voice) => (voice.lfo1Destination.value = newDestination));
            return this;
        }
        setLfo1Frequency(newFrequency) {
            this.state.lfo1.frequency.value = newFrequency;
            this.dispatchUpdate((voice) => (voice.lfo1Frequency.value = newFrequency));
            return this;
        }
        setLfo1ModAmount(newAmount) {
            this.state.lfo1.modAmount.value = newAmount;
            this.dispatchUpdate((voice) => (voice.lfo1ModAmount.value = newAmount));
            return this;
        }
        get lfo2() {
            return this.state.lfo2;
        }
        setLfo2Mode(newMode) {
            this.state.lfo2.mode.value = newMode;
            this.dispatchUpdate((voice) => (voice.lfo2Mode.value = newMode));
            return this;
        }
        setLfo2Destination(newDestination) {
            this.state.lfo2.destination.value = newDestination;
            this.dispatchUpdate((voice) => (voice.lfo2Destination.value = newDestination));
            return this;
        }
        setLfo2Frequency(newFrequency) {
            this.state.lfo2.frequency.value = newFrequency;
            this.dispatchUpdate((voice) => (voice.lfo2Frequency.value = newFrequency));
            return this;
        }
        setLfo2ModAmount(newAmount) {
            this.state.lfo2.modAmount.value = newAmount;
            this.dispatchUpdate((voice) => (voice.lfo2ModAmount.value = newAmount));
            return this;
        }
        get cutoffMod() {
            return this.state.cutoffMod;
        }
        dispatchUpdate(doUpdate) {
            for (const voice of this.voices.values()) {
                doUpdate(voice);
            }
        }
        dumpState() {
            console.log(JSON.stringify(this.state));
        }
    }

    const Status = Object.freeze({
        NOTE_OFF: 0x08,
        NOTE_ON: 0x09,
        NOTE_AFTER_TOUCH: 0x0a,
        CONTROL_CHANGE: 0x0b,
        PROGRAM_CHANGE: 0x0c,
        CHANNEL_AFTER_TOUCH: 0x0d,
        PITCH_BEND: 0x0e,
        SYSEX_MESSAGE: 0xf0,
    });
    function isControlChange(message) {
        return message && message.status === Status.CONTROL_CHANGE;
    }
    function Note(data, channel) {
        return {
            data: {
                value: data.getUint8(1),
                velocity: data.getUint8(2),
                channel,
            },
        };
    }
    function NoteOn(data, channel) {
        return Object.assign(Object.assign({}, Note(data, channel)), { status: Status.NOTE_ON });
    }
    function NoteOff(data, channel) {
        return Object.assign(Object.assign({}, Note(data, channel)), { status: Status.NOTE_OFF });
    }
    function NoteAfterTouch(data, channel) {
        return {
            status: Status.NOTE_AFTER_TOUCH,
            data: {
                note: data.getUint8(0),
                value: data.getUint8(1),
                channel,
            },
        };
    }
    function ControlChange(data, channel) {
        return {
            status: Status.CONTROL_CHANGE,
            data: {
                control: data.getUint8(1),
                value: data.getUint8(2),
                channel,
            },
        };
    }
    function ProgramChange(data, channel) {
        return {
            status: Status.PROGRAM_CHANGE,
            data: {
                value: data.getUint8(0),
                channel,
            },
        };
    }
    function ChannelAfterTouch(data, channel, offset) {
        return {
            status: Status.CHANNEL_AFTER_TOUCH,
            data: {
                value: data.getUint8(offset),
                channel,
            },
        };
    }
    function newMidiMessage(data, offset = 0) {
        const status = data.getUint8(offset) >> 4;
        const channel = data.getUint8(offset) & 0xf;
        switch (status) {
            case Status.NOTE_ON:
                return NoteOn(data, channel);
            case Status.NOTE_OFF:
                return NoteOff(data, channel);
            case Status.NOTE_AFTER_TOUCH:
                return NoteAfterTouch(data, channel);
            case Status.CONTROL_CHANGE:
                return ControlChange(data, channel);
            case Status.PROGRAM_CHANGE:
                return ProgramChange(data, channel);
            case Status.CHANNEL_AFTER_TOUCH:
                return ChannelAfterTouch(data, channel, offset);
            // ignore unknown running status
        }
    }

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
    async function createMidiController(channel = MidiOmniChannel) {
        const midiNavigator = navigator;
        const midiDispatcher = new Dispatcher();
        const controlMap = new Map();
        let midiAccess;
        let currentLearnerID = MidiControlID.NONE;
        let currentChannel = channel;
        if (!midiNavigator.requestMIDIAccess) {
            return Promise.reject("MIDI is not supported");
        }
        try {
            midiAccess = await midiNavigator.requestMIDIAccess();
        }
        catch (error) {
            return Promise.reject("Error requesting MIDI access");
        }
        for (const input of midiAccess.inputs.values()) {
            input.onmidimessage = (message) => {
                const midiMessage = newMidiMessage(new DataView(message.data.buffer));
                dispatchMessageIfNeeded(midiMessage);
            };
        }
        function dispatchMessageIfNeeded(message) {
            if (!message) {
                return;
            }
            const messageChannel = message.data.channel;
            if (isControlChange(message)) {
                return dispatchControlChangeMessage(message);
            }
            if (messageChannel !== currentChannel && currentChannel !== MidiOmniChannel) {
                return;
            }
            if (message.status === Status.NOTE_ON) {
                midiDispatcher.dispatch(MidiMessageEvent.NOTE_ON, message);
            }
            if (message.status === Status.NOTE_OFF) {
                midiDispatcher.dispatch(MidiMessageEvent.NOTE_OFF, message);
            }
        }
        function dispatchControlChangeMessage(message) {
            message.isMidiLearning = currentLearnerID !== MidiControlID.NONE;
            message.controlID = controlMap.get(message.data.control);
            if (message.isMidiLearning) {
                message.controlID = currentLearnerID;
            }
            midiDispatcher.dispatch(MidiMessageEvent.CONTROL_CHANGE, message);
        }
        return Object.assign(midiDispatcher, {
            setCurrentChannel(channel) {
                currentChannel = channel;
            },
            setCurrentLearnerID(id) {
                currentLearnerID = id;
            },
            mapControl(midiControl, id) {
                controlMap.delete(midiControl);
                controlMap.set(midiControl, id);
                currentLearnerID = MidiControlID.NONE;
            },
        });
    }

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
    const midiOctaves = createMidiOctaves(440);
    /* prettier-ignore */
    const keyMapping = new Map([
        ["w", midiOctaves[3][0]],
        ["x", midiOctaves[3][2]],
        ["c", midiOctaves[3][4]],
        ["v", midiOctaves[3][5]],
        ["b", midiOctaves[3][7]],
        ["n", midiOctaves[3][9]],
        ["q", midiOctaves[3][11]],
        ["s", midiOctaves[4][0]],
        ["d", midiOctaves[4][2]],
        ["f", midiOctaves[4][4]],
        ["g", midiOctaves[4][5]],
        ["h", midiOctaves[4][7]],
        ["j", midiOctaves[4][9]],
        ["k", midiOctaves[4][11]],
        ["l", midiOctaves[5][0]],
        ["m", midiOctaves[5][2]],
        ["a", midiOctaves[3][1]],
        ["z", midiOctaves[3][3]],
        ["e", midiOctaves[3][6]],
        ["r", midiOctaves[3][8]],
        ["t", midiOctaves[3][10]],
        ["y", midiOctaves[4][1]],
        ["u", midiOctaves[4][3]],
        ["i", midiOctaves[4][6]],
        ["o", midiOctaves[4][8]],
        ["p", midiOctaves[4][10]],
    ]);
    class KeyBoardController extends Dispatcher {
        constructor() {
            super();
            this.pressedKeys = new Set();
            this.registerKeyDownHandler();
            this.registerKeyUpHandler();
        }
        registerKeyDownHandler() {
            document.addEventListener("keydown", ({ key }) => {
                if (keyMapping.has(key) && !this.pressedKeys.has(key)) {
                    this.pressedKeys.add(key);
                    this.dispatch(KeyboardMessage.NOTE_ON, {
                        data: {
                            value: keyMapping.get(key).midiValue,
                            velocity: 60,
                            channel: MidiOmniChannel,
                        },
                    });
                }
            });
        }
        registerKeyUpHandler() {
            document.addEventListener("keyup", ({ key }) => {
                if (this.pressedKeys.delete(key)) {
                    this.dispatch(KeyboardMessage.NOTE_OFF, {
                        data: {
                            value: keyMapping.get(key).midiValue,
                            channel: MidiOmniChannel,
                        },
                    });
                }
            });
        }
    }

    let WasmPoly = class WasmPoly extends LitElement {
        constructor() {
            super();
            this.currentLearnerID = MidiControlID.NONE;
            this.showVizualizer = false;
            this.editMode = false;
            this.pressedKeys = new Set();
            this.audioContext = new AudioContext();
            this.analyzer = this.audioContext.createAnalyser();
            this.voiceManager = new VoiceManager(this.audioContext);
            this.state = this.voiceManager.getState();
        }
        async connectedCallback() {
            super.connectedCallback();
            await this.audioContext.audioWorklet.addModule("voice-processor.js");
            this.midiController = await createMidiController(MidiOmniChannel);
            this.setUpVoiceManager();
            this.analyzer.connect(this.audioContext.destination);
            this.registerVoiceHandlers();
        }
        setUpVoiceManager() {
            this.voiceManager
                .setMidiController(this.midiController)
                .setKeyBoardcontroller(new KeyBoardController())
                .connect(this.analyzer);
        }
        async onKeyOn(event) {
            if (this.audioContext.state === "suspended") {
                await this.audioContext.resume();
            }
            const { frequency, midiValue } = event.detail;
            this.voiceManager.next({ frequency, midiValue });
        }
        onKeyOff(event) {
            const { midiValue } = event.detail;
            this.voiceManager.stop({ midiValue });
        }
        registerVoiceHandlers() {
            this.voiceManager
                .subscribe(VoiceEvent.NOTE_ON, (note) => {
                this.pressedKeys.add(note.midiValue);
                this.pressedKeys = new Set([...this.pressedKeys.values()]);
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.NOTE_OFF, (note) => {
                this.pressedKeys.delete(note.midiValue);
                this.pressedKeys = new Set([...this.pressedKeys.values()]);
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.OSC1, (newState) => {
                this.state.osc1 = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.OSC_MIX, (newState) => {
                this.state.osc2Amplitude = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.NOISE, (newState) => {
                this.state.noiseLevel = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.OSC2, (newState) => {
                this.state.osc2 = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.FILTER, (newState) => {
                this.state.filter = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.ENVELOPE, (newState) => {
                this.state.envelope = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.LFO1, (newState) => {
                this.state.lfo1 = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.LFO2, (newState) => {
                this.state.lfo2 = newState;
                this.requestUpdate();
            })
                .subscribe(VoiceEvent.CUTOFF_MOD, (newState) => {
                this.state.cutoffMod = newState;
                this.requestUpdate();
            });
        }
        onOsc1Change(event) {
            switch (event.detail.type) {
                case OscillatorEvent.WAVE_FORM:
                    this.voiceManager.setOsc1Mode(event.detail.value);
                    break;
                case OscillatorEvent.SEMI_SHIFT:
                    this.voiceManager.setOsc1SemiShift(event.detail.value);
                    break;
                case OscillatorEvent.CENT_SHIFT:
                    this.voiceManager.setOsc1CentShift(event.detail.value);
                    break;
                case OscillatorEvent.CYCLE:
                    this.voiceManager.setOsc1Cycle(event.detail.value);
            }
        }
        onAmplitudeEnvelopeChange(event) {
            switch (event.detail.type) {
                case OscillatorEnvelopeEvent.ATTACK:
                    this.voiceManager.setAmplitudeEnvelopeAttack(event.detail.value);
                    break;
                case OscillatorEnvelopeEvent.DECAY:
                    this.voiceManager.setAmplitudeEnvelopeDecay(event.detail.value);
                    break;
                case OscillatorEnvelopeEvent.SUSTAIN:
                    this.voiceManager.setAmplitudeEnvelopeSustain(event.detail.value);
                    break;
                case OscillatorEnvelopeEvent.RELEASE:
                    this.voiceManager.setAmplitudeEnvelopeRelease(event.detail.value);
                    break;
            }
        }
        onOscMixChange(event) {
            switch (event.detail.type) {
                case OscillatorEvent.MIX:
                    this.voiceManager.setOsc2Amplitude(event.detail.value);
                    break;
                case OscillatorEvent.NOISE:
                    this.voiceManager.setNoiseLevel(event.detail.value);
                    break;
            }
        }
        onOsc2Change(event) {
            switch (event.detail.type) {
                case OscillatorEvent.WAVE_FORM:
                    this.voiceManager.setOsc2Mode(event.detail.value);
                    break;
                case OscillatorEvent.SEMI_SHIFT:
                    this.voiceManager.setOsc2SemiShift(event.detail.value);
                    break;
                case OscillatorEvent.CENT_SHIFT:
                    this.voiceManager.setOsc2CentShift(event.detail.value);
                    break;
                case OscillatorEvent.CYCLE:
                    this.voiceManager.setOsc2Cycle(event.detail.value);
                    break;
            }
        }
        onFilterChange(event) {
            switch (event.detail.type) {
                case FilterEvent.MODE:
                    this.voiceManager.setFilterMode(event.detail.value);
                    break;
                case FilterEvent.CUTOFF:
                    this.voiceManager.setFilterCutoff(event.detail.value);
                    break;
                case FilterEvent.RESONANCE:
                    this.voiceManager.setFilterResonance(event.detail.value);
                    break;
                case FilterEvent.DRIVE:
                    this.voiceManager.setDrive(event.detail.value);
                    break;
            }
        }
        onFilterEnvelopeChange(event) {
            switch (event.detail.type) {
                case FilterEnvelopeEvent.ATTACK:
                    this.voiceManager.setCutoffEnvelopeAttack(event.detail.value);
                    break;
                case FilterEnvelopeEvent.DECAY:
                    this.voiceManager.setCutoffEnvelopeDecay(event.detail.value);
                    break;
                case FilterEnvelopeEvent.AMOUNT:
                    this.voiceManager.setCutoffEnvelopeAmount(event.detail.value);
                    break;
                case FilterEnvelopeEvent.VELOCITY:
                    this.voiceManager.setCutoffEnvelopeVelocity(event.detail.value);
                    break;
            }
        }
        onLfo1Change(event) {
            switch (event.detail.type) {
                case LfoEvent.WAVE_FORM:
                    this.voiceManager.setLfo1Mode(event.detail.value);
                    break;
                case LfoEvent.FREQUENCY:
                    this.voiceManager.setLfo1Frequency(event.detail.value);
                    break;
                case LfoEvent.MOD_AMOUNT:
                    this.voiceManager.setLfo1ModAmount(event.detail.value);
                    break;
                case LfoEvent.DESTINATION:
                    this.voiceManager.setLfo1Destination(event.detail.value);
            }
        }
        onLfo2Change(event) {
            switch (event.detail.type) {
                case LfoEvent.WAVE_FORM:
                    this.voiceManager.setLfo2Mode(event.detail.value);
                    break;
                case LfoEvent.FREQUENCY:
                    this.voiceManager.setLfo2Frequency(event.detail.value);
                    break;
                case LfoEvent.MOD_AMOUNT:
                    this.voiceManager.setLfo2ModAmount(event.detail.value);
                    break;
                case LfoEvent.DESTINATION:
                    this.voiceManager.setLfo2Destination(event.detail.value);
            }
        }
        async onMenuChange(event) {
            const { type, option, shouldUpdate } = event.detail;
            switch (type) {
                case MenuMode.MIDI_LEARN:
                    this.currentLearnerID = option.value;
                    if (shouldUpdate) {
                        this.midiController.setCurrentLearnerID(this.currentLearnerID);
                    }
                    break;
                case MenuMode.MIDI_CHANNEL:
                    this.unlearn();
                    if (shouldUpdate) {
                        this.midiController.setCurrentChannel(option.value);
                    }
                    break;
                case MenuMode.PRESET:
                    this.unlearn();
                    if (shouldUpdate) {
                        this.state = this.voiceManager.setState(option.value);
                    }
                    break;
            }
            await this.requestUpdate();
        }
        unlearn() {
            this.currentLearnerID = MidiControlID.NONE;
            this.midiController.setCurrentLearnerID(this.currentLearnerID);
        }
        computeVizualizerIfEnabled() {
            if (this.showVizualizer) {
                return html `
        <div class="visualizer">
          <visualizer-element
            .analyser=${this.analyzer}
            width="650"
            height="200"
          ></visualizer-element>
        </div>
      `;
            }
        }
        computeDumpButtonIfEnabled() {
            if (this.editMode) {
                return html `<button @click=${this.voiceManager.dumpState}>Dump</button>`;
            }
        }
        render() {
            return html `
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
              .semiControlID=${MidiControlID.OSC1_SEMI}
              .centControlID=${MidiControlID.OSC1_CENT}
              .cycleControlID=${MidiControlID.OSC1_CYCLE}
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
              .semiControlID=${MidiControlID.OSC2_SEMI}
              .centControlID=${MidiControlID.OSC2_CENT}
              .cycleControlID=${MidiControlID.OSC2_CYCLE}
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
              .frequencyControlID=${MidiControlID.LFO1_FREQ}
              .modAmountControlID=${MidiControlID.LFO1_MOD}
              label="LFO 1"
              .state=${this.state.lfo1}
              @change=${this.onLfo1Change}
            ></lfo-element>
            <lfo-element
              .currentLearnerID=${this.currentLearnerID}
              .frequencyControlID=${MidiControlID.LFO2_FREQ}
              .modAmountControlID=${MidiControlID.LFO2_MOD}
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
    `;
        }
        static get styles() {
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: Object }),
        __metadata("design:type", Object)
    ], WasmPoly.prototype, "pressedKeys", void 0);
    WasmPoly = __decorate([
        customElement("wasm-poly-element"),
        __metadata("design:paramtypes", [])
    ], WasmPoly);

    let Error$1 = class Error extends LitElement {
        render() {
            return html `
      <div class="error">
        <div class="content">
            <div class="heading">SORRY!</div>
            <div class="message">${this.message}</div>
        </div>  
      </div>
    `;
        }
        static get styles() {
            return css `
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
    `;
        }
    };
    __decorate([
        property({ type: String }),
        __metadata("design:type", String)
    ], Error$1.prototype, "message", void 0);
    Error$1 = __decorate([
        customElement("error-element")
    ], Error$1);

    const wasmTestedVersion = 84;
    var BrowserStatus;
    (function (BrowserStatus) {
        BrowserStatus[BrowserStatus["OK"] = 0] = "OK";
        BrowserStatus[BrowserStatus["NOK"] = 1] = "NOK";
    })(BrowserStatus || (BrowserStatus = {}));
    function isChrome() {
        return RegExp(/Chrom(?:e|ium)\/([0-9]+)/).test(navigator.userAgent);
    }
    function isUpToDate() {
        let version = navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/);
        if (version == null || version.length != 5) {
            return false;
        }
        version = version.map((v) => parseInt(v, 10));
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
    function getBrowserState() {
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
    let Root = class Root extends LitElement {
        render() {
            const { status, message } = browserState;
            return status === BrowserStatus.OK ?
                html `<wasm-poly-element></wasm-poly-element>` :
                html `<error-element .message=${message}></error-element>
    `;
        }
    };
    Root = __decorate([
        customElement("root-element")
    ], Root);

})));
