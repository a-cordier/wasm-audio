(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }
  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }
  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }
  function _construct(Parent, args, Class) {
    if (_isNativeReflectConstruct()) {
      _construct = Reflect.construct.bind();
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }
    return _construct.apply(null, arguments);
  }
  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }
  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;
    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;
      if (typeof Class !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }
      if (typeof _cache !== "undefined") {
        if (_cache.has(Class)) return _cache.get(Class);
        _cache.set(Class, Wrapper);
      }
      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }
      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      return _setPrototypeOf(Wrapper, Class);
    };
    return _wrapNativeSuper(Class);
  }
  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
  }
  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }
    return _assertThisInitialized(self);
  }
  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();
    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
        result;
      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;
        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }
      return _possibleConstructorReturn(this, result);
    };
  }
  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }
  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }
  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  /**
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License"); you may not
   * use this file except in compliance with the License. You may obtain a copy of
   * the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   * License for the specific language governing permissions and limitations under
   * the License.
   */

  // Basic byte unit of WASM heap. (16 bit = 2 bytes)
  var BYTES_PER_UNIT = Uint16Array.BYTES_PER_ELEMENT; // 2

  // Byte per audio sample. (32 bit float)
  var BYTES_PER_SAMPLE = Float32Array.BYTES_PER_ELEMENT; // 4

  // The max audio channel on Chrome is 32.
  var MAX_CHANNEL_COUNT = 32;

  // WebAudio's render quantum size.
  var RENDER_QUANTUM_FRAMES = 128;

  /**
   * A WASM HEAP wrapper for AudioBuffer class. This breaks down the AudioBuffer
   * into an Array of Float32Array for the convinient WASM opearion.
   *
   * @class
   * @dependency wasm A WASM module generated by the emscripten glue code.
   */
  var HeapAudioBuffer = /*#__PURE__*/function () {
    /**
     * @constructor
     * @param  {object} wasm WASM module generated by Emscripten.
     * @param  {number} length Buffer frame length.
     * @param  {number} channelCount Number of channels.
     * @param  {number=} maxChannelCount Maximum number of channels.
     */
    function HeapAudioBuffer(wasm, length, channelCount, maxChannelCount) {
      _classCallCheck(this, HeapAudioBuffer);
      // The |channelCount| must be greater than 0, and less than or equal to
      // the maximum channel count.
      this._isInitialized = false;
      this._module = wasm;
      this._length = length;
      this._maxChannelCount = maxChannelCount ? Math.min(maxChannelCount, MAX_CHANNEL_COUNT) : channelCount;
      this._channelCount = channelCount;
      this._allocateHeap();
      this._isInitialized = true;
    }

    /**
     * Allocates memory in the WASM heap and set up Float32Array views for the
     * channel data.
     *
     * @private
     */
    _createClass(HeapAudioBuffer, [{
      key: "_allocateHeap",
      value: function _allocateHeap() {
        var channelByteSize = this._length * BYTES_PER_SAMPLE; // 512
        var dataByteSize = this._maxChannelCount * channelByteSize; // 1024
        this._dataPtr = this._module._malloc(dataByteSize);
        this._channelData = [];
        for (var i = 0; i < this._channelCount; ++i) {
          var startByteOffset = this._dataPtr + i * channelByteSize;
          var endByteOffset = startByteOffset + channelByteSize;
          // Get the actual array index by dividing the byte offset by 2 bytes.
          this._channelData[i] = this._module.HEAPF32.subarray(startByteOffset >> BYTES_PER_UNIT, endByteOffset >> BYTES_PER_UNIT);
        }
      }

      /**
       * Adapt the current channel count to the new input buffer.
       *
       * @param  {number} newChannelCount The new channel count.
       */
    }, {
      key: "adaptChannel",
      value: function adaptChannel(newChannelCount) {
        if (newChannelCount < this._maxChannelCount) {
          this._channelCount = newChannelCount;
        }
      }

      /**
       * Getter for the buffer length in frames.
       *
       * @return {?number} Buffer length in frames.
       */
    }, {
      key: "length",
      get: function get() {
        return this._isInitialized ? this._length : null;
      }

      /**
       * Getter for the number of channels.
       *
       * @return {?number} Buffer length in frames.
       */
    }, {
      key: "numberOfChannels",
      get: function get() {
        return this._isInitialized ? this._channelCount : null;
      }

      /**
       * Getter for the maxixmum number of channels allowed for the instance.
       *
       * @return {?number} Buffer length in frames.
       */
    }, {
      key: "maxChannelCount",
      get: function get() {
        return this._isInitialized ? this._maxChannelCount : null;
      }

      /**
       * Returns a Float32Array object for a given channel index. If the channel
       * index is undefined, it returns the reference to the entire array of channel
       * data.
       *
       * @param  {number|undefined} channelIndex Channel index.
       * @return {?Array} a channel data array or an
       * array of channel data.
       */
    }, {
      key: "getChannelData",
      value: function getChannelData(channelIndex) {
        if (channelIndex >= this._channelCount) {
          return null;
        }
        return typeof channelIndex === "undefined" ? this._channelData : this._channelData[channelIndex];
      }

      /**
       * Returns the base address of the allocated memory space in the WASM heap.
       *
       * @return {number} WASM Heap address.
       */
    }, {
      key: "getHeapAddress",
      value: function getHeapAddress() {
        return this._dataPtr;
      }

      /**
       * Frees the allocated memory space in the WASM heap.
       */
    }, {
      key: "free",
      value: function free() {
        // this._channelData = null;
        this._module._free(this._dataPtr);
      }
    }]);
    return HeapAudioBuffer;
  }(); // class HeapAudioBuffer
  /**
   * Simplified buffer used with parameters, that don't need to
   * account for channels
   * @Author Antoine CORDIER
   */
  var HeapParameterBuffer = /*#__PURE__*/function (_HeapAudioBuffer) {
    _inherits(HeapParameterBuffer, _HeapAudioBuffer);
    var _super = _createSuper(HeapParameterBuffer);
    function HeapParameterBuffer(wasm, length) {
      _classCallCheck(this, HeapParameterBuffer);
      return _super.call(this, wasm, length, 1, 1);
    }
    _createClass(HeapParameterBuffer, [{
      key: "getData",
      value: function getData() {
        return this.getChannelData(0);
      }
    }]);
    return HeapParameterBuffer;
  }(HeapAudioBuffer);

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
  var BooleanParam = Object.freeze({
    TRUE: 1,
    FALSE: 0
  });
  var VoiceState = Object.freeze({
    DISPOSED: 0,
    STARTED: 1,
    STOPPING: 2,
    STOPPED: 3
  });
  var WaveFormParam = Object.freeze({
    SINE: 0,
    SAWTOOTH: 1,
    SQUARE: 2,
    TRIANGLE: 3
  });
  var FilterModeParam = Object.freeze({
    LOWPASS: 0,
    LOWPASS_PLUS: 1,
    BANDPASS: 2,
    HIGHPASS: 3
  });
  var LfoDestinationParam = Object.freeze({
    FREQUENCY: 0,
    OSCILLATOR_MIX: 1,
    CUTOFF: 2,
    RESONANCE: 3,
    OSC1_CYCLE: 4,
    OSC2_CYCLE: 5
  });
  var staticParameterDescriptors = [{
    name: "state",
    defaultValue: VoiceState.DISPOSED,
    minValue: VoiceState.DISPOSED,
    maxValue: VoiceState.STOPPED,
    automationRate: "k-rate"
  }, {
    name: "osc1",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate"
  }, {
    name: "osc2",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate"
  }, {
    name: "lfo1Mode",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate"
  }, {
    name: "lfo2Mode",
    defaultValue: WaveFormParam.SINE,
    minValue: BooleanParam.SINE,
    maxValue: BooleanParam.TRIANGLE,
    automationRate: "k-rate"
  }, {
    name: "lfo1Destination",
    defaultValue: LfoDestinationParam.OSCILLATOR_MIX,
    minValue: LfoDestinationParam.FREQUENCY,
    maxValue: LfoDestinationParam.OSC_2_CYCLE,
    automationRate: "k-rate"
  }, {
    name: "lfo2Destination",
    defaultValue: LfoDestinationParam.CUTOFF,
    minValue: LfoDestinationParam.FREQUENCY,
    maxValue: LfoDestinationParam.OSC_2_CYCLE,
    automationRate: "k-rate"
  }, {
    name: "filterMode",
    defaultValue: FilterModeParam.LOWPASS,
    minValue: FilterModeParam.LOWPASS,
    maxValue: FilterModeParam.HIGHPASS,
    automationRate: "k-rate"
  }, {
    name: "velocity",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }];
  var automatedParameterDescriptors = [{
    name: "frequency",
    defaultValue: 440,
    minValue: 0,
    maxValue: 16744,
    automationRate: "a-rate"
  }, {
    name: "amplitude",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 1,
    automationRate: "a-rate"
  }, {
    name: "amplitudeAttack",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "amplitudeDecay",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "amplitudeSustain",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "amplitudeRelease",
    defaultValue: 0.5,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "cutoff",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "resonance",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "drive",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "cutoffAttack",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "cutoffDecay",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "cutoffEnvelopeAmount",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "cutoffEnvelopeVelocity",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "osc1SemiShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "osc1CentShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "osc1Cycle",
    defaultValue: 127 / 2,
    minValue: 5,
    maxValue: 122,
    automationRate: "k-rate"
  }, {
    name: "osc2SemiShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "osc2CentShift",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  }, {
    name: "osc2Cycle",
    defaultValue: 127 / 2,
    minValue: 5,
    maxValue: 122,
    automationRate: "k-rate"
  }, {
    name: "osc2Amplitude",
    defaultValue: 127 / 2,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "noiseLevel",
    defaultValue: 0,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "lfo1Frequency",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "lfo1ModAmount",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "lfo2Frequency",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }, {
    name: "lfo2ModAmount",
    defaultValue: 127,
    minValue: 0,
    maxValue: 127,
    automationRate: "a-rate"
  }];

  // The Module object: Our interface to the outside world. We import
  // and export values on it. There are various ways Module can be used:
  // 1. Not defined. We create it here
  // 2. A function parameter, function(Module) { ..generated code.. }
  // 3. pre-run appended it, var Module = {}; ..generated code..
  // 4. External script tag defines var Module.
  // We need to check if Module already exists (e.g. case 3 above).
  // Substitution will be replaced with actual code on later stage of the build,
  // this way Closure Compiler will not mangle it (e.g. case 4. above).
  // Note that if you want to run closure, and also to use Module
  // after the generated code, you will need to define   var Module = {};
  // before the code. Then that object will be used in the code, and you
  // can continue to use Module afterwards as well.
  var Module = typeof Module !== 'undefined' ? Module : {};

  // See https://caniuse.com/mdn-javascript_builtins_object_assign
  var objAssign = Object.assign;

  // --pre-jses are emitted after the Module integration code, so that they can
  // refer to Module (if they choose; they can also define Module)

  // Sometimes an existing Module object exists with properties
  // meant to overwrite the default module functionality. Here
  // we collect those properties and reapply _after_ we configure
  // the current environment's defaults to avoid having to be so
  // defensive during initialization.
  var moduleOverrides = objAssign({}, Module);
  var arguments_ = [];
  var thisProgram = './this.program';

  // Determine the runtime environment we are in. You can customize this by
  // setting the ENVIRONMENT setting at compile time (see settings.js).

  // Attempt to auto-detect the environment
  var ENVIRONMENT_IS_WEB = (typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object';
  var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
  // N.b. Electron.js environment is simultaneously a NODE-environment, but
  // also a web environment.
  var ENVIRONMENT_IS_NODE = (typeof process === "undefined" ? "undefined" : _typeof(process)) === 'object' && _typeof(process.versions) === 'object' && typeof process.versions.node === 'string';

  // `/` should be present at the end if `scriptDirectory` is not empty
  var scriptDirectory = '';
  function locateFile(path) {
    if (Module['locateFile']) {
      return Module['locateFile'](path, scriptDirectory);
    }
    return scriptDirectory + path;
  }

  // Hooks that are implemented differently in different runtime environments.
  var read_, readBinary;
  var fs;
  var nodePath;
  var requireNodeFS;
  if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
      scriptDirectory = require('path').dirname(scriptDirectory) + '/';
    } else {
      scriptDirectory = __dirname + '/';
    }

    // include: node_shell_read.js

    requireNodeFS = function requireNodeFS() {
      // Use nodePath as the indicator for these not being initialized,
      // since in some environments a global fs may have already been
      // created.
      if (!nodePath) {
        fs = require('fs');
        nodePath = require('path');
      }
    };
    read_ = function shell_read(filename, binary) {
      var ret = tryParseAsDataURI(filename);
      if (ret) {
        return binary ? ret : ret.toString();
      }
      requireNodeFS();
      filename = nodePath['normalize'](filename);
      return fs.readFileSync(filename, binary ? null : 'utf8');
    };
    readBinary = function readBinary(filename) {
      var ret = read_(filename, true);
      if (!ret.buffer) {
        ret = new Uint8Array(ret);
      }
      return ret;
    };

    // end include: node_shell_read.js
    if (process['argv'].length > 1) {
      thisProgram = process['argv'][1].replace(/\\/g, '/');
    }
    arguments_ = process['argv'].slice(2);
    if (typeof module !== 'undefined') {
      module['exports'] = Module;
    }
    process['on']('uncaughtException', function (ex) {
      // suppress ExitStatus exceptions from showing an error
      if (!(ex instanceof ExitStatus)) {
        throw ex;
      }
    });

    // Without this older versions of node (< v15) will log unhandled rejections
    // but return 0, which is not normally the desired behaviour.  This is
    // not be needed with node v15 and about because it is now the default
    // behaviour:
    // See https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    process['on']('unhandledRejection', function (reason) {
      throw reason;
    });
    Module['inspect'] = function () {
      return '[Emscripten Module object]';
    };
  } else
    // Note that this includes Node.js workers when relevant (pthreads is enabled).
    // Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
    // ENVIRONMENT_IS_NODE.
    if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        // Check worker, not web, since window could be polyfilled
        scriptDirectory = self.location.href;
      } else if (typeof document !== 'undefined' && document.currentScript) {
        // web
        scriptDirectory = document.currentScript.src;
      }
      // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
      // otherwise, slice off the final part of the url to find the script directory.
      // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
      // and scriptDirectory will correctly be replaced with an empty string.
      // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
      // they are removed because they could contain a slash.
      if (scriptDirectory.indexOf('blob:') !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf('/') + 1);
      } else {
        scriptDirectory = '';
      }

      // Differentiate the Web Worker from the Node Worker case, as reading must
      // be done differently.
      {
        // include: web_or_worker_shell_read.js

        read_ = function read_(url) {
          try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.send(null);
            return xhr.responseText;
          } catch (err) {
            var data = tryParseAsDataURI(url);
            if (data) {
              return intArrayToString(data);
            }
            throw err;
          }
        };
        if (ENVIRONMENT_IS_WORKER) {
          readBinary = function readBinary(url) {
            try {
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              xhr.responseType = 'arraybuffer';
              xhr.send(null);
              return new Uint8Array( /** @type{!ArrayBuffer} */xhr.response);
            } catch (err) {
              var data = tryParseAsDataURI(url);
              if (data) {
                return data;
              }
              throw err;
            }
          };
        }

        // end include: web_or_worker_shell_read.js
      }
    }
  var out = Module['print'] || console.log.bind(console);
  var err = Module['printErr'] || console.warn.bind(console);

  // Merge back in the overrides
  objAssign(Module, moduleOverrides);
  // Free the object hierarchy contained in the overrides, this lets the GC
  // reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
  moduleOverrides = null;

  // Emit code to handle expected values on the Module object. This applies Module.x
  // to the proper local x. This has two benefits: first, we only emit it if it is
  // expected to arrive, and second, by using a local everywhere else that can be
  // minified.

  if (Module['arguments']) arguments_ = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  // === Preamble library stuff ===

  // Documentation for the public APIs defined in this file must be updated in:
  //    site/source/docs/api_reference/preamble.js.rst
  // A prebuilt local version of the documentation is available at:
  //    site/build/text/docs/api_reference/preamble.js.txt
  // You can also build docs locally as HTML or other formats in site/
  // An online HTML version (which may be of a different version of Emscripten)
  //    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

  var wasmBinary;
  if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
  if ((typeof WebAssembly === "undefined" ? "undefined" : _typeof(WebAssembly)) !== 'object') {
    abort('no native wasm support detected');
  }

  // end include: runtime_safe_heap.js
  // Wasm globals

  var wasmMemory;

  //========================================
  // Runtime essentials
  //========================================

  // whether we are quitting the application. no code should run after this.
  // set in exit() and abort()
  var ABORT = false;

  /** @type {function(*, string=)} */
  function assert(condition, text) {
    if (!condition) {
      // This build was created without ASSERTIONS defined.  `assert()` should not
      // ever be called in this configuration but in case there are callers in
      // the wild leave this simple abort() implemenation here for now.
      abort(text);
    }
  }

  // include: runtime_strings.js

  // runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

  // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
  // a copy of that string as a Javascript String object.

  var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

  /**
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @return {string}
   */
  function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
    // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
    // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
    while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
      return UTF8Decoder.decode(heap.subarray(idx, endPtr));
    } else {
      var str = '';
      // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heap[idx++];
        if (!(u0 & 0x80)) {
          str += String.fromCharCode(u0);
          continue;
        }
        var u1 = heap[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) {
          str += String.fromCharCode((u0 & 31) << 6 | u1);
          continue;
        }
        var u2 = heap[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = (u0 & 15) << 12 | u1 << 6 | u2;
        } else {
          u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
        }
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | ch >> 10, 0xDC00 | ch & 0x3FF);
        }
      }
    }
    return str;
  }

  // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
  // copy of that string as a Javascript String object.
  // maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
  //                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
  //                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
  //                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
  //                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
  //                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
  //                 throw JS JIT optimizations off, so it is worth to consider consistently using one
  //                 style or the other.
  /**
   * @param {number} ptr
   * @param {number=} maxBytesToRead
   * @return {string}
   */
  function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
  }

  // Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
  // encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
  // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Parameters:
  //   str: the Javascript string to copy.
  //   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
  //   outIdx: The starting offset in the array to begin the copying.
  //   maxBytesToWrite: The maximum number of bytes this function can write to the array.
  //                    This count should include the null terminator,
  //                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
  //                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
  // Returns the number of bytes written, EXCLUDING the null terminator.

  function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0))
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
      return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
      var u = str.charCodeAt(i); // possibly a lead surrogate
      if (u >= 0xD800 && u <= 0xDFFF) {
        var u1 = str.charCodeAt(++i);
        u = 0x10000 + ((u & 0x3FF) << 10) | u1 & 0x3FF;
      }
      if (u <= 0x7F) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u;
      } else if (u <= 0x7FF) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 0xC0 | u >> 6;
        heap[outIdx++] = 0x80 | u & 63;
      } else if (u <= 0xFFFF) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 0xE0 | u >> 12;
        heap[outIdx++] = 0x80 | u >> 6 & 63;
        heap[outIdx++] = 0x80 | u & 63;
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++] = 0xF0 | u >> 18;
        heap[outIdx++] = 0x80 | u >> 12 & 63;
        heap[outIdx++] = 0x80 | u >> 6 & 63;
        heap[outIdx++] = 0x80 | u & 63;
      }
    }
    // Null-terminate the pointer to the buffer.
    heap[outIdx] = 0;
    return outIdx - startIdx;
  }

  // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
  // null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
  // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Returns the number of bytes written, EXCLUDING the null terminator.

  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  }

  // Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
  function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var u = str.charCodeAt(i); // possibly a lead surrogate
      if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | str.charCodeAt(++i) & 0x3FF;
      if (u <= 0x7F) ++len;else if (u <= 0x7FF) len += 2;else if (u <= 0xFFFF) len += 3;else len += 4;
    }
    return len;
  }

  // Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
  // a copy of that string as a Javascript String object.

  var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
  function UTF16ToString(ptr, maxBytesToRead) {
    var endPtr = ptr;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
    // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
    var idx = endPtr >> 1;
    var maxIdx = idx + maxBytesToRead / 2;
    // If maxBytesToRead is not passed explicitly, it will be undefined, and this
    // will always evaluate to true. This saves on code size.
    while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
    endPtr = idx << 1;
    if (endPtr - ptr > 32 && UTF16Decoder) {
      return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
    } else {
      var str = '';

      // If maxBytesToRead is not passed explicitly, it will be undefined, and the for-loop's condition
      // will always evaluate to true. The loop is then terminated on the first null char.
      for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
        var codeUnit = HEAP16[ptr + i * 2 >> 1];
        if (codeUnit == 0) break;
        // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
        str += String.fromCharCode(codeUnit);
      }
      return str;
    }
  }

  // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
  // null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
  // Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Parameters:
  //   str: the Javascript string to copy.
  //   outPtr: Byte address in Emscripten HEAP where to write the string to.
  //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
  //                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
  //                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
  // Returns the number of bytes written, EXCLUDING the null terminator.

  function stringToUTF16(str, outPtr, maxBytesToWrite) {
    // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
    if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 0x7FFFFFFF;
    }
    if (maxBytesToWrite < 2) return 0;
    maxBytesToWrite -= 2; // Null terminator.
    var startPtr = outPtr;
    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
      // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
      var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
      HEAP16[outPtr >> 1] = codeUnit;
      outPtr += 2;
    }
    // Null-terminate the pointer to the HEAP.
    HEAP16[outPtr >> 1] = 0;
    return outPtr - startPtr;
  }

  // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

  function lengthBytesUTF16(str) {
    return str.length * 2;
  }
  function UTF32ToString(ptr, maxBytesToRead) {
    var i = 0;
    var str = '';
    // If maxBytesToRead is not passed explicitly, it will be undefined, and this
    // will always evaluate to true. This saves on code size.
    while (!(i >= maxBytesToRead / 4)) {
      var utf32 = HEAP32[ptr + i * 4 >> 2];
      if (utf32 == 0) break;
      ++i;
      // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      if (utf32 >= 0x10000) {
        var ch = utf32 - 0x10000;
        str += String.fromCharCode(0xD800 | ch >> 10, 0xDC00 | ch & 0x3FF);
      } else {
        str += String.fromCharCode(utf32);
      }
    }
    return str;
  }

  // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
  // null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
  // Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
  // Parameters:
  //   str: the Javascript string to copy.
  //   outPtr: Byte address in Emscripten HEAP where to write the string to.
  //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
  //                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
  //                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
  // Returns the number of bytes written, EXCLUDING the null terminator.

  function stringToUTF32(str, outPtr, maxBytesToWrite) {
    // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
    if (maxBytesToWrite === undefined) {
      maxBytesToWrite = 0x7FFFFFFF;
    }
    if (maxBytesToWrite < 4) return 0;
    var startPtr = outPtr;
    var endPtr = startPtr + maxBytesToWrite - 4;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
      if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
        var trailSurrogate = str.charCodeAt(++i);
        codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | trailSurrogate & 0x3FF;
      }
      HEAP32[outPtr >> 2] = codeUnit;
      outPtr += 4;
      if (outPtr + 4 > endPtr) break;
    }
    // Null-terminate the pointer to the HEAP.
    HEAP32[outPtr >> 2] = 0;
    return outPtr - startPtr;
  }

  // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

  function lengthBytesUTF32(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var codeUnit = str.charCodeAt(i);
      if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
      len += 4;
    }
    return len;
  }
  var buffer, /** @type {Int8Array} */
    HEAP8, /** @type {Uint8Array} */
    HEAPU8, /** @type {Int16Array} */
    HEAP16, /** @type {Uint16Array} */
    HEAPU16, /** @type {Int32Array} */
    HEAP32, /** @type {Uint32Array} */
    HEAPU32, /** @type {Float32Array} */
    HEAPF32, /** @type {Float64Array} */
    HEAPF64;
  function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module['HEAP8'] = HEAP8 = new Int8Array(buf);
    Module['HEAP16'] = HEAP16 = new Int16Array(buf);
    Module['HEAP32'] = HEAP32 = new Int32Array(buf);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
  }

  // include: runtime_init_table.js
  // In regular non-RELOCATABLE mode the table is exported
  // from the wasm module and this will be assigned once
  // the exports are available.
  var wasmTable;

  // end include: runtime_init_table.js
  // include: runtime_stack_check.js

  // end include: runtime_stack_check.js
  // include: runtime_assertions.js

  // end include: runtime_assertions.js
  var __ATPRERUN__ = []; // functions called before the runtime is initialized
  var __ATINIT__ = []; // functions called during startup
  var __ATPOSTRUN__ = []; // functions called after the main() is called
  function preRun() {
    if (Module['preRun']) {
      if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
      while (Module['preRun'].length) {
        addOnPreRun(Module['preRun'].shift());
      }
    }
    callRuntimeCallbacks(__ATPRERUN__);
  }
  function initRuntime() {
    callRuntimeCallbacks(__ATINIT__);
  }
  function postRun() {
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length) {
        addOnPostRun(Module['postRun'].shift());
      }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
  }
  function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
  }
  function addOnInit(cb) {
    __ATINIT__.unshift(cb);
  }
  function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
  }

  // include: runtime_math.js

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

  // end include: runtime_math.js
  // A counter of dependencies for calling run(). If we need to
  // do asynchronous work before running, increment this and
  // decrement it. Incrementing must happen in a place like
  // Module.preRun (used by emcc to add file preloading).
  // Note that you can add dependencies in preRun, even though
  // it happens right before run - run will be postponed until
  // the dependencies are met.
  var runDependencies = 0;
  var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
  function addRunDependency(id) {
    runDependencies++;
    if (Module['monitorRunDependencies']) {
      Module['monitorRunDependencies'](runDependencies);
    }
  }
  function removeRunDependency(id) {
    runDependencies--;
    if (Module['monitorRunDependencies']) {
      Module['monitorRunDependencies'](runDependencies);
    }
    if (runDependencies == 0) {
      if (dependenciesFulfilled) {
        var callback = dependenciesFulfilled;
        dependenciesFulfilled = null;
        callback(); // can add another dependenciesFulfilled
      }
    }
  }

  Module["preloadedImages"] = {}; // maps url to image data
  Module["preloadedAudios"] = {}; // maps url to audio data

  /** @param {string|number=} what */
  function abort(what) {
    {
      if (Module['onAbort']) {
        Module['onAbort'](what);
      }
    }
    what = 'Aborted(' + what + ')';
    // TODO(sbc): Should we remove printing and leave it up to whoever
    // catches the exception?
    err(what);
    ABORT = true;
    what += '. Build with -s ASSERTIONS=1 for more info.';

    // Use a wasm runtime error, because a JS error might be seen as a foreign
    // exception, which means we'd run destructors on it. We need the error to
    // simply make the program stop.
    var e = new WebAssembly.RuntimeError(what);

    // Throw the error whether or not MODULARIZE is set because abort is used
    // in code paths apart from instantiation where an exception is expected
    // to be thrown when abort is called.
    throw e;
  }

  // {{MEM_INITIALIZER}}

  // include: memoryprofiler.js

  // end include: memoryprofiler.js
  // include: URIUtils.js

  // Prefix of data URIs emitted by SINGLE_FILE and related options.
  var dataURIPrefix = 'data:application/octet-stream;base64,';

  // Indicates whether filename is a base64 data URI.
  function isDataURI(filename) {
    // Prefix of data URIs emitted by SINGLE_FILE and related options.
    return filename.startsWith(dataURIPrefix);
  }

  // end include: URIUtils.js
  var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB3IGAgAAhYAJ/fwBgAX8AYAF/AX9gBH9/f38AYAV/f39/fwBgBn9/f39/fwBgA39/fwBgA39/fwF/YAJ/fwF/YAAAYAF/AX1gAAF/YAF8AXxgAX0BfWADf319AX9gBH99fX0BfWACf30AYAN/f30AYAF8AX1gAnx8AXxgAX8BfGANf39/f39/f39/f39/fwBgCH9/f39/f39/AGACf30BfWAFf39/f38Bf2ACfX8Bf2AEf39/fwF/YAJ/fAF8YAF+AX9gA3x+fgF8YAJ8fwF8YAV/f39+fgBgB39/f39/f38AApKEgIAAEgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9jbGFzcwAVA2VudiJfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2NvbnN0cnVjdG9yAAUDZW52H19lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfZnVuY3Rpb24AFgNlbnYVX2VtYmluZF9yZWdpc3Rlcl9lbnVtAAMDZW52G19lbWJpbmRfcmVnaXN0ZXJfZW51bV92YWx1ZQAGA2VudgR0aW1lAAIDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAAAA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wABANlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAAQDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQABgNlbnYbX2VtYmluZF9yZWdpc3Rlcl9zdGRfc3RyaW5nAAADZW52HF9lbWJpbmRfcmVnaXN0ZXJfc3RkX3dzdHJpbmcABgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9lbXZhbAAAA2VudhxfZW1iaW5kX3JlZ2lzdGVyX21lbW9yeV92aWV3AAYDZW52BWFib3J0AAkDZW52FmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAAAgNlbnYVZW1zY3JpcHRlbl9tZW1jcHlfYmlnAAcDZW52F19lbWJpbmRfcmVnaXN0ZXJfYmlnaW50ACADkYGAgACPAQkCAgEOCAMEEBEABgAGAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAYAAAAAAggBAAEGCgoAAQoRChcOAQ8BAgkCCQkBCxISDBgZDQICAQILCAIBAQEBAQEBAQcHAgcHGgMDAwMIAwcHCAgEAwQFBAQEBQUFAgsCAQsC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Cw0AIABBoARqIAE2AgALDQAgAEGkBGogATYCAAsNACAAQagEaiABNgIACw0AIABBrARqIAE2AgALDQAgAEGwBGogATYCAAsNACAAKAKAAyABNgIECzsBAX8gASAAKAIEIgNBAXVqIQEgACgCACEAAkAgA0EBcUUNACABKAIAIABqKAIAIQALIAEgAiAAEQAACw0AIABBtARqIAE2AgALDQAgAEG4BGogATYCAAsNACAAQbwEaiABNgIACw0AIABBwARqIAE2AgALDQAgAEHEBGogATYCAAsNACAAQcgEaiABNgIACw0AIABBzARqIAE2AgALDQAgAEHQBGogATYCAAsNACAAQdQEaiABNgIACwoAIAAgATYCuAELCgAgACABNgLcAQs7AQF/IAEgACgCBCIDQQF1aiEBIAAoAgAhAAJAIANBAXFFDQAgASgCACAAaigCACEACyABIAIgABEAAAsNACAAQdgEaiABNgIACw0AIABB3ARqIAE2AgALCgAgACABNgLgAQsKACAAIAE2AoQCCwsAIAAoAvwDQQNGCzkBAX8gASAAKAIEIgJBAXVqIQEgACgCACEAAkAgAkEBcUUNACABKAIAIABqKAIAIQALIAEgABECAAuJAQICfQF/IABBAjYC/AMCQCAAQZACaigCAEEDRg0AIABB3AJqIABBjAJqKgIAIgE4AgAgAEHwAmpDvTeGNSAAQeACaioCACICIAJDAAAAAFsbEJEBQ703hjUgASABQwAAAABbGxCRAZMgAEHkAmooAgAiA7NDvTeGNSADG5U4AgALIABBBDYCkAILOQEBfyABIAAoAgQiAkEBdWohASAAKAIAIQACQCACQQFxRQ0AIAEoAgAgAGooAgAhAAsgASAAEQEAC3cBAX8gACgCgAMiASABKAIAKAIMEQEAIABB6AJqQQA2AgAgAEHEAmpBADYCACAAQaACakEANgIAIABB5ANqQQA2AgAgAEHAA2pBADYCACAAQZwDakEANgIAIABBkAJqQQA2AgAgAEEANgL8AyAAQYwDakEANgIAC44HAgR9A38gACABNgKABCAAQYAEaiACEEYgABBHIABB/ABqIABB6ARqKgIAIgM4AgAgACADOAIQIABBgAFqIABB7ARqKgIAIgM4AgAgACADOAIUIABBiAFqIABB8ARqKgIAIgM4AgAgACADOAIc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IAEtAAAhAgJAIAAtAAAiA0UNACADIAJB/wFxRw0AA0AgAS0AASECIAAtAAEiA0UNASABQQFqIQEgAEEBaiEAIAMgAkH/AXFGDQALCyADIAJB/wFxawsKACAAEIYBGiAACwIACwIACwsAIAAQYxogABBfCwsAIAAQYxogABBfCwsAIAAQYxogABBfCwsAIAAQYxogABBfCwsAIAAQYxogABBfCwsAIAAQYxogABBfCwoAIAAgAUEAEG0LLQACQCACDQAgACgCBCABKAIERg8LAkAgACABRw0AQQEPCyAAEG4gARBuEGJFCwcAIAAoAgQLCgAgACABQQAQbQusAQECfyMAQcAAayIDJABBASEEAkAgACABQQAQbQ0AQQAhBCABRQ0AQQAhBCABQdQ1QYQ2QQAQcSIBRQ0AIANBCGpBBHJBAEE0EI0BGiADQQE2AjggA0F/NgIUIAMgADYCECADIAE2AgggASADQQhqIAIoAgBBASABKAIAKAIcEQMAAkAgAygCICIEQQFHDQAgAiADKAIYNgIACyAEQQFGIQQLIANBwABqJAAgBAupAgEDfyMAQcAAayIEJAAgACgCACIFQXxqKAIAIQYgBUF4aigCACEFIAQgAzYCFCAEIAE2AhAgBCAANgIMIAQgAjYCCEEAIQEgBEEYakEAQScQjQEaIAAgBWohAAJAAkAgBiACQQAQbUUNACAEQQE2AjggBiAEQQhqIAAgAEEBQQAgBigCACgCFBEFACAAQQAgBCgCIEEBRhshAQwBCyAGIARBCGogAEEBQQAgBigCACgCGBEEAAJAAkAgBCgCLA4CAAECCyAEKAIcQQAgBCgCKEEBRhtBACAEKAIkQQFGG0EAIAQoAjBBAUYbIQEMAQsCQCAEKAIgQQFGDQAgBCgCMA0BIAQoAiRBAUcNASAEKAIoQQFHDQELIAQoAhghAQsgBEHAAGokACABC2ABAX8CQCABKAIQIgQNACABQQE2AiQgASADNgIYIAEgAjYCEA8LAkACQCAEIAJHDQAgASgCGEECRw0BIAEgAzYCGA8LIAFBAToANiABQQI2AhggASABKAIkQQFqNgIkCwsdAAJAIAAgASgCCEEAEG1FDQAgASABIAIgAxByCws2AAJAIAAgASgCCEEAEG1FDQAgASABIAIgAxByDwsgACgCCCIAIAEgAiADIAAoAgAo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QUBqIgVLDQADQCACIAEoAgA2AgAgAiABKAIENgIEIAIgASgCCDYCCCACIAEoAgw2AgwgAiABKAIQNgIQIAIgASgCFDYCFCACIAEoAhg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUHAAGohASACQcAAaiICIAVNDQALCyACIARPDQEDQCACIAEoAgA2AgAgAUEEaiEBIAJBBGoiAiAESQ0ADAILAAsCQCADQQRPDQAgACECDAELAkAgA0F8aiIEIABPDQAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCwJAIAIgA08NAANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC/ICAgN/AX4CQCACRQ0AIAAgAToAACACIABqIgNBf2ogAToAACACQQNJDQAgACABOgACIAAgAToAASADQX1qIAE6AAAgA0F+aiABOgAAIAJBB0kNACAAIAE6AAMgA0F8aiABOgAAIAJBCUkNACAAQQAgAGtBA3EiBGoiAyABQf8BcUGBgoQIbCIBNgIAIAMgAiAEa0F8cSIEaiICQXxqIAE2AgAgBEEJSQ0AIAMgATYCCCADIAE2AgQgAkF4aiABNgIAIAJBdGogATYCACAEQRlJDQAgAyABNgIYIAMgATYCFCADIAE2AhAgAyABNgIMIAJBcGogATYCACACQWxqIAE2AgAgAkFoaiABNgIAIAJBZGogATYCACAEIANBBHFBGHIiBWsiAkEgSQ0AIAGtQoGAgIAQfiEGIAMgBWohAQNAIAEgBjcDGCABIAY3AxAgASAGNwMIIAEgBjcDACABQSBqIQEgAkFgaiICQR9LDQALCyAAC6sEAgR+An8CQAJAIAG9IgJCAYYiA1ANACACQv///////////wCDQoCAgICAgID4/wBWDQAgAL0iBEI0iKdB/w9xIgZB/w9HDQELIAAgAaIiASABow8LAkAgBEIBhiIFIANWDQAgAEQAAAAAAAAAAKIgACAFIANRGw8LIAJCNIinQf8PcSEHAkACQCAGDQBBACEGAkAgBEIMhiIDQgBTDQADQCAGQX9qIQYgA0IBhiIDQn9VDQALCyAEQQEgBmuthiEDDAELIARC/////////weDQoCAgICAgIAIhCEDCwJAAkAgBw0AQQAhBwJAIAJCDIYiBUIAUw0AA0AgB0F/aiEHIAVCAYYiBUJ/VQ0ACwsgAkEBIAdrrYYhAgwBCyACQv////////8Hg0KAgICAgICACIQhAgsCQCAGIAdMDQADQAJAIAMgAn0iBUIAUw0AIAUhAyAFQgBSDQAgAEQAAAAAAAAAAKIPCyADQgGGIQMgBkF/aiIGIAdKDQALIAchBgsCQCADIAJ9IgVCAFMNACAFIQMgBUIAUg0AIABEAAAAAAAAAACiDwsCQAJAIANC/////////wdYDQAgAyEFDAELA0AgBkF/aiEGIANCgICAgICAgARUIQcgA0IBhiIFIQMgBw0ACwsgBEKAgICAgICAgIB/gyEDAkACQCAGQQFIDQAgBUKAgICAgICAeHwgBq1CNIaEIQUMAQsgBUEBIAZrrYghBQsgBSADhL8LJgEBfyMAQRBrIgFDAACAv0MAAIA/IAAbOAIMIAEqAgxDAAAAAJULDAAgACAAkyIAIACVC/YBAgJ/AnwCQCAAvCIBQYCAgPwDRw0AQwAAAAAPCwJAAkAgAUGAgICEeGpB////h3hLDQACQCABQQF0IgINAEEBEI8BDwsgAUGAgID8B0YNAQJAAkAgAUEASA0AIAJBgICAeEkNAQsgABCQAQ8LIABDAAAAS5S8QYCAgKR/aiEBC0EAKwPYPiABIAFBgIC0hnxqIgJBgICAfHFrvrsgAkEPdkHwAXEiAUHQPGorAwCiRAAAAAAAAPC/oCIDIAOiIgSiQQArA+A+IAOiQQArA+g+oKAgBKIgAkEXdbdBACsD0D6iIAFB2DxqKwMAoCADoKC2IQALIAALDAAgACAAoSIAIACjCxAAIAGaIAEgABsQlAEgAaILFQEBfyMAQRBrIgEgADkDCCABKwMICxAAIABEAAAAAAAAAHAQkwELEAAgAEQAAAAAAAAAEBCTAQsFACAAmQugCQMGfwN+CXwjAEEQayICJAAgAb0iCEI0iKciA0H/D3EiBEHCd2ohBQJAAkACQCAAvSIJQjSIpyIGQYFwakGCcEkNAEEAIQcgBUH/fksNAQsCQCAIQgGGIgpCf3xC/////////29UDQBEAAAAAAAA8D8hCyAKUA0CIAlCgICAgICAgPg/UQ0CAkACQCAJQgGGIglCgICAgICAgHBWDQAgCkKBgICAgICAcFQNAQsgACABoCELDAMLIAlCgICAgICAgPD/AFENAkQAAAAAAAAAACABIAGiIAhCP4inQQFzIAlCgICAgICAgPD/AFRGGyELDAILAkAgCUIBhkJ/fEL/////////b1QNACAAIACiIQsCQCAJQn9VDQAgC5ogCyAIEJkBQQFGGyELCyAIQn9VDQIgAkQAAAAAAADwPyALozkDCCACKwMIIQsMAgtBACEHAkAgCUJ/VQ0AAkAgCBCZASIHDQAgABCSASELDAMLIAZB/w9xIQYgCUL///////////8AgyEJIAdBAUZBEnQhBwsCQCAFQf9+Sw0ARAAAAAAAAPA/IQsgCUKAgICAgICA+D9RDQICQCAEQb0HSw0AIAEgAZogCUKAgICAgICA+D9WG0QAAAAAAADwP6AhCwwDCwJAIANBgBBJIAlCgYCAgICAgPg/VEYNAEEAEJUBIQsMAwtBABCWASELDAILIAYNACAARAAAAAAAADBDor1C////////////AINCgICAgICAgOB8fCEJCwJAIAhCgICAQIO/IgwgCSAJQoCAgICw1dqMQHwiCEKAgICAgICAeIN9IglCgICAgAh8QoCAgIBwg78iCyAIQi2Ip0H/AHFBBXQiBUGo0ABqKwMAIg2iRAAAAAAAAPC/oCIAIABBACsD8E8iDqIiD6IiECAIQjSHp7ciEUEAKwPgT6IgBUG40ABqKwMAoCISIAAgDSAJvyALoaIiE6AiAKAiC6AiDSAQIAsgDaGgIBMgDyAOIACiIg6goiARQQArA+hPoiAFQcDQAGorAwCgIAAgEiALoaCgoKAgACAAIA6iIguiIAsgCyAAQQArA6BQokEAKwOYUKCiIABBACsDkFCiQQArA4hQoKCiIABBACsDgFCiQQArA/hPoKCioCIPoCILvUKAgIBAg78iDqIiAL0iCUI0iKdB/w9xIgVBt3hqQT9JDQACQCAFQcgHSw0AIABEAAAAAAAA8D+gIgCaIAAgBxshCwwCCyAFQYkISSEGQQAhBSAGDQACQCAJQn9VDQAgBxCWASELDAILIAcQlQEhCwwBCyABIAyhIA6iIA8gDSALoaAgCyAOoaAgAaKgIABBACsD8D6iQQArA/g+IgGgIgsgAaEiAUEAKwOIP6IgAUEAKwOAP6IgAKCgoCIAIACiIgEgAaIgAEEAKwOoP6JBACsDoD+goiABIABBACsDmD+iQQArA5A/oKIgC70iCadBBHRB8A9xIgZB4D9qKwMAIACgoKAhACAGQeg/aikDACAJIAetfEIthnwhCAJAIAUNACAAIAggCRCaASELDAELIAi/IgEgAKIgAaAhCwsgAkEQaiQAIAsLVQICfwF+QQAhAQJAIABCNIinQf8PcSICQf8HSQ0AQQIhASACQbMISw0AQQAhAUIBQbMIIAJrrYYiA0J/fCAAg0IAUg0AQQJBASADIACDUBshAQsgAQuKAgIBfwR8IwBBEGsiAyQAAkACQCACQoCAgIAIg0IAUg0AIAFCgICAgICAgPhAfL8iBCAAoiAEoEQAAAAAAAAAf6IhAAwBCwJAIAFCgICAgICAgPA/fCIBvyIEIACiIgUgBKAiABCXAUQAAAAAAADwP2NFDQAgA0KAgICAgICACDcDCCADIAMrAwhEAAAAAAAAEACiOQMIIAFCgICAgICAgICAf4O/IABEAAAAAAAA8L9EAAAAAAAA8D8gAEQAAAAAAAAAAGMbIgagIgcgBSAEIAChoCAAIAYgB6GgoKAgBqEiACAARAAAAAAAAAAAYRshAAsgAEQAAAAAAAAQAKIhAAsgA0EQaiQAIAALrgEAAkACQCABQYAISA0AIABEAAAAAAAA4H+iIQACQCABQf8PTw0AIAFBgXhqIQEMAgsgAEQAAAAAAADgf6IhACABQf0XIAFB/RdJG0GCcGohAQwBCyABQYF4Sg0AIABEAAAAAAAAYAOiIQACQCABQbhwTQ0AIAFByQdqIQEMAQsgAEQAAAAAAABgA6IhACABQfBoIAFB8GhLG0GSD2ohAQsgACABQf8Haq1CNIa/oguHAQEDfyAAIQECQAJAIABBA3FFDQAgACEBA0AgAS0AAEUNAiABQQFqIgFBA3ENAAsLA0AgASICQQRqIQEgAigCACIDQX9zIANB//37d2pxQYCBgoR4cUUNAAsCQCADQf8BcQ0AIAIgAGsPCwNAIAItAAEhAyACQQFqIgEhAiADDQALCyABIABrCwQAIwALBgAgACQACxIBAn8jACAAa0FwcSIBJAAgAQscACAAIAEgAiADpyADQiCIpyAEpyAEQiCIpxARCwu76ICAAAIAQYAIC6hoc2V0VmVsb2NpdHkAc2V0Q3V0b2ZmRW52ZWxvcGVWZWxvY2l0eQBzZXRMZm8yRnJlcXVlbmN5AHNldExmbzFGcmVxdWVuY3kAc2V0Q3V0b2ZmRW52ZWxvcGVEZWNheQBzZXRBbXBsaXR1ZGVEZWNheQB1bnNpZ25lZCBzaG9ydABzZXRDdXRvZmZFbnZlbG9wZUFtb3VudABzZXRMZm8yTW9kQW1vdW50AHNldExmbzFNb2RBbW91bnQAdW5zaWduZWQgaW50AHNldE9zYzJDZW50U2hpZnQAc2V0T3NjMUNlbnRTaGlmdABzZXRPc2MyU2VtaVNoaWZ0AHNldE9zYzFTZW1pU2hpZnQAcmVzZXQAZmxvYXQAdWludDY0X3QAcHJvY2VzcwB1bnNpZ25lZCBjaGFyAExmb0Rlc3RpbmF0aW9uAHNldExmbzJEZXN0aW5hdGlvbgBzZXRMZm8xRGVzdGluYXRpb24Ac2V0QW1wbGl0dWRlU3VzdGFpbgBXYXZlRm9ybQBib29sAHNldE5vaXNlTGV2ZWwAVm9pY2VLZXJuZWwAZW1zY3JpcHRlbjo6dmFsAHNldEN1dG9mZkVudmVsb3BlQXR0YWNrAHNldEFtcGxpdHVkZUF0dGFjawB1bnNpZ25lZCBsb25nAHN0ZDo6d3N0cmluZwBzdGQ6OnN0cmluZwBzdGQ6OnUxNnN0cmluZwBzdGQ6OnUzMnN0cmluZwBzZXRDdXRvZmYAc2V0RHJpdmUAVm9pY2VTdGF0ZQBzZXRBbXBsaXR1ZGVSZWxlYXNlAHNldE9zYzJDeWNsZQBzZXRPc2MxQ3ljbGUAZG91YmxlAGVudGVyUmVsZWFzZVN0YWdlAHNldE9zYzJBbXBsaXR1ZGUAc2V0RmlsdGVyTW9kZQBzZXRMZm8yTW9kZQBzZXRPc2MyTW9kZQBzZXRMZm8xTW9kZQBzZXRPc2MxTW9kZQBzZXRSZXNvbmFuY2UAdm9pZABpc1N0b3BwZWQARlJFUVVFTkNZAE9TQ0lMTEFUT1JfTUlYAFNBVwBMT1dQQVNTX1BMVVMATE9XUEFTUwBISUdIUEFTUwBCQU5EUEFTUwBTVE9QUElORwBDVVRPRkYAU1FVQVJFAFNJTkUAVFJJQU5HTEUAT1NDMl9DWUNMRQBPU0MxX0NZQ0xFAFJFU09OQU5DRQBTVEFSVEVEAERJU1BPU0VEAFNUT1BQRUQAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgBONVZvaWNlNktlcm5lbEUAAAAARB0AAPkJAABQTjVWb2ljZTZLZXJuZWxFAAAAACQeAAAUCgAAAAAAAAwKAABQS041Vm9pY2U2S2VybmVsRQAAACQeAAA4CgAAAQAAAAwKAABpaQB2AHZpACgKAADcHAAA3BwAAGlpZmYAAAAAAAAAAMQKAAAwAAAAMQAAADIAAAAzAAAATjZGaWx0ZXIxNFJlc29uYW50S2VybmVsRQBONkZpbHRlcjZLZXJuZWxFAABEHQAAqgoAAGwdAACQCgAAvAoAADQcAAAoCgAAuBwAAKAcAAC4HAAAdmlpaWlpAAA0HAAAKAoAANwcAAB2aWlmAAAAADQcAAAoCgAAIAsAAE4xME9zY2lsbGF0b3I0TW9kZUUA+BwAAAwLAAB2aWlpAAAAADQcAAAoCgAAuBwAADQcAAAoCgAAWAsAAE42RmlsdGVyNE1vZGVFAAD4HAAASAsAADQcAAAoCgAAiAsAAE41Vm9pY2UxNExmb0Rlc3RpbmF0aW9uRQAAAAD4HAAAbAsAAEwcAAAoCgAAaWlpADQcAAAoCgAAdmlpAE41Vm9pY2U1U3RhdGVFAAD4HAAAqAsAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAE5TdDNfXzIyMV9fYmFzaWNfc3RyaW5nX2NvbW1vbklMYjFFRUUAAAAARB0AAP8LAADIHQAAwAsAAAAAAAABAAAAKAwAAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAyB0AAEgMAAAAAAAAAQAAACgMAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAMgdAACgDAAAAAAAAAEAAAAoDAAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAyB0AAPgMAAAAAAAAAQAAACgMAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAADIHQAAVA0AAAAAAAABAAAAKAwAAAAAAABOMTBlbXNjcmlwdGVuM3ZhbEUAAEQdAACwDQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAABEHQAAzA0AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWFFRQAARB0AAPQNAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUAAEQdAAAcDgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAABEHQAARA4A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';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  function getBinary(file) {
    try {
      if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary);
      }
      var binary = tryParseAsDataURI(file);
      if (binary) {
        return binary;
      }
      if (readBinary) {
        return readBinary(file);
      } else {
        throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
      }
    } catch (err) {
      abort(err);
    }
  }
  function instantiateSync(file, info) {
    var instance;
    var module;
    var binary;
    try {
      binary = getBinary(file);
      module = new WebAssembly.Module(binary);
      instance = new WebAssembly.Instance(module, info);
    } catch (e) {
      var str = e.toString();
      err('failed to compile wasm module: ' + str);
      if (str.includes('imported Memory') || str.includes('memory import')) {
        err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
      }
      throw e;
    }
    return [instance, module];
  }

  // Create the wasm instance.
  // Receives the wasm imports, returns the exports.
  function createWasm() {
    // prepare imports
    var info = {
      'env': asmLibraryArg,
      'wasi_snapshot_preview1': asmLibraryArg
    };
    // Load the wasm module and create an instance of using native support in the JS engine.
    // handle a generated wasm instance, receiving its exports and
    // performing other necessary setup
    /** @param {WebAssembly.Module=} module*/
    function receiveInstance(instance, module) {
      var exports = instance.exports;
      Module['asm'] = exports;
      wasmMemory = Module['asm']['memory'];
      updateGlobalBufferAndViews(wasmMemory.buffer);
      wasmTable = Module['asm']['__indirect_function_table'];
      addOnInit(Module['asm']['__wasm_call_ctors']);
      removeRunDependency();
    }
    // we can't run yet (except in a pthread, where we have a custom sync instantiator)
    addRunDependency();

    // Prefer streaming instantiation if available.

    // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
    // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
    // to any other async startup actions they are performing.
    if (Module['instantiateWasm']) {
      try {
        var exports = Module['instantiateWasm'](info, receiveInstance);
        return exports;
      } catch (e) {
        err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
      }
    }
    var result = instantiateSync(wasmBinaryFile, info);
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
    // the above line no longer optimizes out down to the following line.
    // When the regression is fixed, we can remove this if/else.
    receiveInstance(result[0]);
    return Module['asm']; // exports were assigned here
  }
  function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
      var callback = callbacks.shift();
      if (typeof callback == 'function') {
        callback(Module); // Pass the module as the first argument.
        continue;
      }
      var func = callback.func;
      if (typeof func === 'number') {
        if (callback.arg === undefined) {
          getWasmTableEntry(func)();
        } else {
          getWasmTableEntry(func)(callback.arg);
        }
      } else {
        func(callback.arg === undefined ? null : callback.arg);
      }
    }
  }
  var wasmTableMirror = [];
  function getWasmTableEntry(funcPtr) {
    var func = wasmTableMirror[funcPtr];
    if (!func) {
      if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
      wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
    }
    return func;
  }
  function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {}
  function getShiftFromSize(size) {
    switch (size) {
      case 1:
        return 0;
      case 2:
        return 1;
      case 4:
        return 2;
      case 8:
        return 3;
      default:
        throw new TypeError('Unknown type size: ' + size);
    }
  }
  function embind_init_charCodes() {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
      codes[i] = String.fromCharCode(i);
    }
    embind_charCodes = codes;
  }
  var embind_charCodes = undefined;
  function readLatin1String(ptr) {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
      ret += embind_charCodes[HEAPU8[c++]];
    }
    return ret;
  }
  var awaitingDependencies = {};
  var registeredTypes = {};
  var typeDependencies = {};
  var char_0 = 48;
  var char_9 = 57;
  function makeLegalFunctionName(name) {
    if (undefined === name) {
      return '_unknown';
    }
    name = name.replace(/[^a-zA-Z0-9_]/g, '$');
    var f = name.charCodeAt(0);
    if (f >= char_0 && f <= char_9) {
      return '_' + name;
    } else {
      return name;
    }
  }
  function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    /*jshint evil:true*/
    return new Function("body", "return function " + name + "() {\n" + "    \"use strict\";" + "    return body.apply(this, arguments);\n" + "};\n")(body);
  }
  function extendError(baseErrorType, errorName) {
    var errorClass = createNamedFunction(errorName, function (message) {
      this.name = errorName;
      this.message = message;
      var stack = new Error(message).stack;
      if (stack !== undefined) {
        this.stack = this.toString() + '\n' + stack.replace(/^Error(:[^\n]*)?\n/, '');
      }
    });
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = function () {
      if (this.message === undefined) {
        return this.name;
      } else {
        return this.name + ': ' + this.message;
      }
    };
    return errorClass;
  }
  var BindingError = undefined;
  function throwBindingError(message) {
    throw new BindingError(message);
  }
  var InternalError = undefined;
  function throwInternalError(message) {
    throw new InternalError(message);
  }
  function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
    myTypes.forEach(function (type) {
      typeDependencies[type] = dependentTypes;
    });
    function onComplete(typeConverters) {
      var myTypeConverters = getTypeConverters(typeConverters);
      if (myTypeConverters.length !== myTypes.length) {
        throwInternalError('Mismatched type converter count');
      }
      for (var i = 0; i < myTypes.length; ++i) {
        registerType(myTypes[i], myTypeConverters[i]);
      }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach(function (dt, i) {
      if (registeredTypes.hasOwnProperty(dt)) {
        typeConverters[i] = registeredTypes[dt];
      } else {
        unregisteredTypes.push(dt);
        if (!awaitingDependencies.hasOwnProperty(dt)) {
          awaitingDependencies[dt] = [];
        }
        awaitingDependencies[dt].push(function () {
          typeConverters[i] = registeredTypes[dt];
          ++registered;
          if (registered === unregisteredTypes.length) {
            onComplete(typeConverters);
          }
        });
      }
    });
    if (0 === unregisteredTypes.length) {
      onComplete(typeConverters);
    }
  }
  /** @param {Object=} options */
  function registerType(rawType, registeredInstance, options) {
    options = options || {};
    if (!('argPackAdvance' in registeredInstance)) {
      throw new TypeError('registerType registeredInstance requires argPackAdvance');
    }
    var name = registeredInstance.name;
    if (!rawType) {
      throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
      if (options.ignoreDuplicateRegistrations) {
        return;
      } else {
        throwBindingError("Cannot register type '" + name + "' twice");
      }
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
      var callbacks = awaitingDependencies[rawType];
      delete awaitingDependencies[rawType];
      callbacks.forEach(function (cb) {
        cb();
      });
    }
  }
  function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      'fromWireType': function fromWireType(wt) {
        // ambiguous emscripten ABI: sometimes return values are
        // true or false, and sometimes integers (0 or 1)
        return !!wt;
      },
      'toWireType': function toWireType(destructors, o) {
        return o ? trueValue : falseValue;
      },
      'argPackAdvance': 8,
      'readValueFromPointer': function readValueFromPointer(pointer) {
        // TODO: if heap is fixed (like in asm.js) this could be executed outside
        var heap;
        if (size === 1) {
          heap = HEAP8;
        } else if (size === 2) {
          heap = HEAP16;
        } else if (size === 4) {
          heap = HEAP32;
        } else {
          throw new TypeError("Unknown boolean type size: " + name);
        }
        return this['fromWireType'](heap[pointer >> shift]);
      },
      destructorFunction: null // This type does not need a destructor
    });
  }

  function ClassHandle_isAliasOf(other) {
    if (!(this instanceof ClassHandle)) {
      return false;
    }
    if (!(other instanceof ClassHandle)) {
      return false;
    }
    var leftClass = this.$$.ptrType.registeredClass;
    var left = this.$$.ptr;
    var rightClass = other.$$.ptrType.registeredClass;
    var right = other.$$.ptr;
    while (leftClass.baseClass) {
      left = leftClass.upcast(left);
      leftClass = leftClass.baseClass;
    }
    while (rightClass.baseClass) {
      right = rightClass.upcast(right);
      rightClass = rightClass.baseClass;
    }
    return leftClass === rightClass && left === right;
  }
  function shallowCopyInternalPointer(o) {
    return {
      count: o.count,
      deleteScheduled: o.deleteScheduled,
      preservePointerOnDelete: o.preservePointerOnDelete,
      ptr: o.ptr,
      ptrType: o.ptrType,
      smartPtr: o.smartPtr,
      smartPtrType: o.smartPtrType
    };
  }
  function throwInstanceAlreadyDeleted(obj) {
    function getInstanceTypeName(handle) {
      return handle.$$.ptrType.registeredClass.name;
    }
    throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
  }
  var finalizationGroup = false;
  function detachFinalizer(handle) {}
  function runDestructor($$) {
    if ($$.smartPtr) {
      $$.smartPtrType.rawDestructor($$.smartPtr);
    } else {
      $$.ptrType.registeredClass.rawDestructor($$.ptr);
    }
  }
  function releaseClassHandle($$) {
    $$.count.value -= 1;
    var toDelete = 0 === $$.count.value;
    if (toDelete) {
      runDestructor($$);
    }
  }
  function attachFinalizer(handle) {
    if ('undefined' === typeof FinalizationGroup) {
      attachFinalizer = function attachFinalizer(handle) {
        return handle;
      };
      return handle;
    }
    // If the running environment has a FinalizationGroup (see
    // https://github.com/tc39/proposal-weakrefs), then attach finalizers
    // for class handles.  We check for the presence of FinalizationGroup
    // at run-time, not build-time.
    finalizationGroup = new FinalizationGroup(function (iter) {
      for (var result = iter.next(); !result.done; result = iter.next()) {
        var $$ = result.value;
        if (!$$.ptr) {
          console.warn('object already deleted: ' + $$.ptr);
        } else {
          releaseClassHandle($$);
        }
      }
    });
    attachFinalizer = function attachFinalizer(handle) {
      finalizationGroup.register(handle, handle.$$, handle.$$);
      return handle;
    };
    detachFinalizer = function detachFinalizer(handle) {
      finalizationGroup.unregister(handle.$$);
    };
    return attachFinalizer(handle);
  }
  function ClassHandle_clone() {
    if (!this.$$.ptr) {
      throwInstanceAlreadyDeleted(this);
    }
    if (this.$$.preservePointerOnDelete) {
      this.$$.count.value += 1;
      return this;
    } else {
      var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
        $$: {
          value: shallowCopyInternalPointer(this.$$)
        }
      }));
      clone.$$.count.value += 1;
      clone.$$.deleteScheduled = false;
      return clone;
    }
  }
  function ClassHandle_delete() {
    if (!this.$$.ptr) {
      throwInstanceAlreadyDeleted(this);
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
      throwBindingError('Object already scheduled for deletion');
    }
    detachFinalizer(this);
    releaseClassHandle(this.$$);
    if (!this.$$.preservePointerOnDelete) {
      this.$$.smartPtr = undefined;
      this.$$.ptr = undefined;
    }
  }
  function ClassHandle_isDeleted() {
    return !this.$$.ptr;
  }
  var delayFunction = undefined;
  var deletionQueue = [];
  function flushPendingDeletes() {
    while (deletionQueue.length) {
      var obj = deletionQueue.pop();
      obj.$$.deleteScheduled = false;
      obj['delete']();
    }
  }
  function ClassHandle_deleteLater() {
    if (!this.$$.ptr) {
      throwInstanceAlreadyDeleted(this);
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
      throwBindingError('Object already scheduled for deletion');
    }
    deletionQueue.push(this);
    if (deletionQueue.length === 1 && delayFunction) {
      delayFunction(flushPendingDeletes);
    }
    this.$$.deleteScheduled = true;
    return this;
  }
  function init_ClassHandle() {
    ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
    ClassHandle.prototype['clone'] = ClassHandle_clone;
    ClassHandle.prototype['delete'] = ClassHandle_delete;
    ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
    ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
  }
  function ClassHandle() {}
  var registeredPointers = {};
  function ensureOverloadTable(proto, methodName, humanName) {
    if (undefined === proto[methodName].overloadTable) {
      var prevFunc = proto[methodName];
      // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
      proto[methodName] = function () {
        // TODO This check can be removed in -O3 level "unsafe" optimizations.
        if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
          throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
        }
        return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
      };
      // Move the previous function into the overload table.
      proto[methodName].overloadTable = [];
      proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
    }
  }
  /** @param {number=} numArguments */
  function exposePublicSymbol(name, value, numArguments) {
    if (Module.hasOwnProperty(name)) {
      if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
        throwBindingError("Cannot register public name '" + name + "' twice");
      }

      // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
      // that routes between the two.
      ensureOverloadTable(Module, name, name);
      if (Module.hasOwnProperty(numArguments)) {
        throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
      }
      // Add the new function into the overload table.
      Module[name].overloadTable[numArguments] = value;
    } else {
      Module[name] = value;
      if (undefined !== numArguments) {
        Module[name].numArguments = numArguments;
      }
    }
  }

  /** @constructor */
  function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
    this.name = name;
    this.constructor = constructor;
    this.instancePrototype = instancePrototype;
    this.rawDestructor = rawDestructor;
    this.baseClass = baseClass;
    this.getActualType = getActualType;
    this.upcast = upcast;
    this.downcast = downcast;
    this.pureVirtualFunctions = [];
  }
  function upcastPointer(ptr, ptrClass, desiredClass) {
    while (ptrClass !== desiredClass) {
      if (!ptrClass.upcast) {
        throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
      }
      ptr = ptrClass.upcast(ptr);
      ptrClass = ptrClass.baseClass;
    }
    return ptr;
  }
  function constNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
      if (this.isReference) {
        throwBindingError('null is not a valid ' + this.name);
      }
      return 0;
    }
    if (!handle.$$) {
      throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
      throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr;
  }
  function genericPointerToWireType(destructors, handle) {
    var ptr;
    if (handle === null) {
      if (this.isReference) {
        throwBindingError('null is not a valid ' + this.name);
      }
      if (this.isSmartPointer) {
        ptr = this.rawConstructor();
        if (destructors !== null) {
          destructors.push(this.rawDestructor, ptr);
        }
        return ptr;
      } else {
        return 0;
      }
    }
    if (!handle.$$) {
      throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
      throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    if (!this.isConst && handle.$$.ptrType.isConst) {
      throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    if (this.isSmartPointer) {
      // TODO: this is not strictly true
      // We could support BY_EMVAL conversions from raw pointers to smart pointers
      // because the smart pointer can hold a reference to the handle
      if (undefined === handle.$$.smartPtr) {
        throwBindingError('Passing raw pointer to smart pointer is illegal');
      }
      switch (this.sharingPolicy) {
        case 0:
          // NONE
          // no upcasting
          if (handle.$$.smartPtrType === this) {
            ptr = handle.$$.smartPtr;
          } else {
            throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
          }
          break;
        case 1:
          // INTRUSIVE
          ptr = handle.$$.smartPtr;
          break;
        case 2:
          // BY_EMVAL
          if (handle.$$.smartPtrType === this) {
            ptr = handle.$$.smartPtr;
          } else {
            var clonedHandle = handle['clone']();
            ptr = this.rawShare(ptr, Emval.toHandle(function () {
              clonedHandle['delete']();
            }));
            if (destructors !== null) {
              destructors.push(this.rawDestructor, ptr);
            }
          }
          break;
        default:
          throwBindingError('Unsupporting sharing policy');
      }
    }
    return ptr;
  }
  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
      if (this.isReference) {
        throwBindingError('null is not a valid ' + this.name);
      }
      return 0;
    }
    if (!handle.$$) {
      throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
    }
    if (!handle.$$.ptr) {
      throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
    }
    if (handle.$$.ptrType.isConst) {
      throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr;
  }
  function simpleReadValueFromPointer(pointer) {
    return this['fromWireType'](HEAPU32[pointer >> 2]);
  }
  function RegisteredPointer_getPointee(ptr) {
    if (this.rawGetPointee) {
      ptr = this.rawGetPointee(ptr);
    }
    return ptr;
  }
  function RegisteredPointer_destructor(ptr) {
    if (this.rawDestructor) {
      this.rawDestructor(ptr);
    }
  }
  function RegisteredPointer_deleteObject(handle) {
    if (handle !== null) {
      handle['delete']();
    }
  }
  function downcastPointer(ptr, ptrClass, desiredClass) {
    if (ptrClass === desiredClass) {
      return ptr;
    }
    if (undefined === desiredClass.baseClass) {
      return null; // no conversion
    }

    var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
    if (rv === null) {
      return null;
    }
    return desiredClass.downcast(rv);
  }
  function getInheritedInstanceCount() {
    return Object.keys(registeredInstances).length;
  }
  function getLiveInheritedInstances() {
    var rv = [];
    for (var k in registeredInstances) {
      if (registeredInstances.hasOwnProperty(k)) {
        rv.push(registeredInstances[k]);
      }
    }
    return rv;
  }
  function setDelayFunction(fn) {
    delayFunction = fn;
    if (deletionQueue.length && delayFunction) {
      delayFunction(flushPendingDeletes);
    }
  }
  function init_embind() {
    Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
    Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
    Module['flushPendingDeletes'] = flushPendingDeletes;
    Module['setDelayFunction'] = setDelayFunction;
  }
  var registeredInstances = {};
  function getBasestPointer(class_, ptr) {
    if (ptr === undefined) {
      throwBindingError('ptr should not be undefined');
    }
    while (class_.baseClass) {
      ptr = class_.upcast(ptr);
      class_ = class_.baseClass;
    }
    return ptr;
  }
  function getInheritedInstance(class_, ptr) {
    ptr = getBasestPointer(class_, ptr);
    return registeredInstances[ptr];
  }
  function makeClassHandle(prototype, record) {
    if (!record.ptrType || !record.ptr) {
      throwInternalError('makeClassHandle requires ptr and ptrType');
    }
    var hasSmartPtrType = !!record.smartPtrType;
    var hasSmartPtr = !!record.smartPtr;
    if (hasSmartPtrType !== hasSmartPtr) {
      throwInternalError('Both smartPtrType and smartPtr must be specified');
    }
    record.count = {
      value: 1
    };
    return attachFinalizer(Object.create(prototype, {
      $$: {
        value: record
      }
    }));
  }
  function RegisteredPointer_fromWireType(ptr) {
    // ptr is a raw pointer (or a raw smartpointer)

    // rawPointer is a maybe-null raw pointer
    var rawPointer = this.getPointee(ptr);
    if (!rawPointer) {
      this.destructor(ptr);
      return null;
    }
    var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
    if (undefined !== registeredInstance) {
      // JS object has been neutered, time to repopulate it
      if (0 === registeredInstance.$$.count.value) {
        registeredInstance.$$.ptr = rawPointer;
        registeredInstance.$$.smartPtr = ptr;
        return registeredInstance['clone']();
      } else {
        // else, just increment reference count on existing object
        // it already has a reference to the smart pointer
        var rv = registeredInstance['clone']();
        this.destructor(ptr);
        return rv;
      }
    }
    function makeDefaultHandle() {
      if (this.isSmartPointer) {
        return makeClassHandle(this.registeredClass.instancePrototype, {
          ptrType: this.pointeeType,
          ptr: rawPointer,
          smartPtrType: this,
          smartPtr: ptr
        });
      } else {
        return makeClassHandle(this.registeredClass.instancePrototype, {
          ptrType: this,
          ptr: ptr
        });
      }
    }
    var actualType = this.registeredClass.getActualType(rawPointer);
    var registeredPointerRecord = registeredPointers[actualType];
    if (!registeredPointerRecord) {
      return makeDefaultHandle.call(this);
    }
    var toType;
    if (this.isConst) {
      toType = registeredPointerRecord.constPointerType;
    } else {
      toType = registeredPointerRecord.pointerType;
    }
    var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
    if (dp === null) {
      return makeDefaultHandle.call(this);
    }
    if (this.isSmartPointer) {
      return makeClassHandle(toType.registeredClass.instancePrototype, {
        ptrType: toType,
        ptr: dp,
        smartPtrType: this,
        smartPtr: ptr
      });
    } else {
      return makeClassHandle(toType.registeredClass.instancePrototype, {
        ptrType: toType,
        ptr: dp
      });
    }
  }
  function init_RegisteredPointer() {
    RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
    RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
    RegisteredPointer.prototype['argPackAdvance'] = 8;
    RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
    RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
    RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
  }
  /** @constructor
      @param {*=} pointeeType,
      @param {*=} sharingPolicy,
      @param {*=} rawGetPointee,
      @param {*=} rawConstructor,
      @param {*=} rawShare,
      @param {*=} rawDestructor,
       */
  function RegisteredPointer(name, registeredClass, isReference, isConst,
  // smart pointer properties
  isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
    this.name = name;
    this.registeredClass = registeredClass;
    this.isReference = isReference;
    this.isConst = isConst;

    // smart pointer properties
    this.isSmartPointer = isSmartPointer;
    this.pointeeType = pointeeType;
    this.sharingPolicy = sharingPolicy;
    this.rawGetPointee = rawGetPointee;
    this.rawConstructor = rawConstructor;
    this.rawShare = rawShare;
    this.rawDestructor = rawDestructor;
    if (!isSmartPointer && registeredClass.baseClass === undefined) {
      if (isConst) {
        this['toWireType'] = constNoSmartPtrRawPointerToWireType;
        this.destructorFunction = null;
      } else {
        this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
        this.destructorFunction = null;
      }
    } else {
      this['toWireType'] = genericPointerToWireType;
      // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
      // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
      // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
      //       craftInvokerFunction altogether.
    }
  }

  /** @param {number=} numArguments */
  function replacePublicSymbol(name, value, numArguments) {
    if (!Module.hasOwnProperty(name)) {
      throwInternalError('Replacing nonexistant public symbol');
    }
    // If there's an overload table for this symbol, replace the symbol in the overload table instead.
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
      Module[name].overloadTable[numArguments] = value;
    } else {
      Module[name] = value;
      Module[name].argCount = numArguments;
    }
  }
  function dynCallLegacy(sig, ptr, args) {
    var f = Module["dynCall_" + sig];
    return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
  }
  function dynCall(sig, ptr, args) {
    // Without WASM_BIGINT support we cannot directly call function with i64 as
    // part of thier signature, so we rely the dynCall functions generated by
    // wasm-emscripten-finalize
    if (sig.includes('j')) {
      return dynCallLegacy(sig, ptr, args);
    }
    return getWasmTableEntry(ptr).apply(null, args);
  }
  function getDynCaller(sig, ptr) {
    var argCache = [];
    return function () {
      argCache.length = arguments.length;
      for (var i = 0; i < arguments.length; i++) {
        argCache[i] = arguments[i];
      }
      return dynCall(sig, ptr, argCache);
    };
  }
  function embind__requireFunction(signature, rawFunction) {
    signature = readLatin1String(signature);
    function makeDynCaller() {
      if (signature.includes('j')) {
        return getDynCaller(signature, rawFunction);
      }
      return getWasmTableEntry(rawFunction);
    }
    var fp = makeDynCaller();
    if (typeof fp !== "function") {
      throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
    }
    return fp;
  }
  var UnboundTypeError = undefined;
  function getTypeName(type) {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv;
  }
  function throwUnboundTypeError(message, types) {
    var unboundTypes = [];
    var seen = {};
    function visit(type) {
      if (seen[type]) {
        return;
      }
      if (registeredTypes[type]) {
        return;
      }
      if (typeDependencies[type]) {
        typeDependencies[type].forEach(visit);
        return;
      }
      unboundTypes.push(type);
      seen[type] = true;
    }
    types.forEach(visit);
    throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
  }
  function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
    name = readLatin1String(name);
    getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
    if (upcast) {
      upcast = embind__requireFunction(upcastSignature, upcast);
    }
    if (downcast) {
      downcast = embind__requireFunction(downcastSignature, downcast);
    }
    rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
    var legalFunctionName = makeLegalFunctionName(name);
    exposePublicSymbol(legalFunctionName, function () {
      // this code cannot run if baseClassRawType is zero
      throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
    });
    whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function (base) {
      base = base[0];
      var baseClass;
      var basePrototype;
      if (baseClassRawType) {
        baseClass = base.registeredClass;
        basePrototype = baseClass.instancePrototype;
      } else {
        basePrototype = ClassHandle.prototype;
      }
      var constructor = createNamedFunction(legalFunctionName, function () {
        if (Object.getPrototypeOf(this) !== instancePrototype) {
          throw new BindingError("Use 'new' to construct " + name);
        }
        if (undefined === registeredClass.constructor_body) {
          throw new BindingError(name + " has no accessible constructor");
        }
        var body = registeredClass.constructor_body[arguments.length];
        if (undefined === body) {
          throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
        }
        return body.apply(this, arguments);
      });
      var instancePrototype = Object.create(basePrototype, {
        constructor: {
          value: constructor
        }
      });
      constructor.prototype = instancePrototype;
      var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
      var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
      var pointerConverter = new RegisteredPointer(name + '*', registeredClass, false, false, false);
      var constPointerConverter = new RegisteredPointer(name + ' const*', registeredClass, false, true, false);
      registeredPointers[rawType] = {
        pointerType: pointerConverter,
        constPointerType: constPointerConverter
      };
      replacePublicSymbol(legalFunctionName, constructor);
      return [referenceConverter, pointerConverter, constPointerConverter];
    });
  }
  function heap32VectorToArray(count, firstElement) {
    var array = [];
    for (var i = 0; i < count; i++) {
      array.push(HEAP32[(firstElement >> 2) + i]);
    }
    return array;
  }
  function runDestructors(destructors) {
    while (destructors.length) {
      var ptr = destructors.pop();
      var del = destructors.pop();
      del(ptr);
    }
  }
  function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
    assert(argCount > 0);
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    invoker = embind__requireFunction(invokerSignature, invoker);
    whenDependentTypesAreResolved([], [rawClassType], function (classType) {
      classType = classType[0];
      var humanName = 'constructor ' + classType.name;
      if (undefined === classType.registeredClass.constructor_body) {
        classType.registeredClass.constructor_body = [];
      }
      if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
        throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
      }
      classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
        throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
      };
      whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
        // Insert empty slot for context type (argTypes[1]).
        argTypes.splice(1, 0, null);
        classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
        return [];
      });
      return [];
    });
  }
  function new_(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
      throw new TypeError('new_ called with constructor type ' + _typeof(constructor) + " which is not a function");
    }

    /*
     * Previously, the following line was just:
        function dummy() {};
        * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
     * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
     * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
     * to write a test for this behavior.  -NRD 2013.02.22
     */
    var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function () {});
    dummy.prototype = constructor.prototype;
    var obj = new dummy();
    var r = constructor.apply(obj, argumentList);
    return r instanceof Object ? r : obj;
  }
  function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
    // humanName: a human-readable string name for the function to be generated.
    // argTypes: An array that contains the embind type objects for all types in the function signature.
    //    argTypes[0] is the type object for the function return value.
    //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
    //    argTypes[2...] are the actual function parameters.
    // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
    // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
    // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
    var argCount = argTypes.length;
    if (argCount < 2) {
      throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
    }
    var isClassMethodFunc = argTypes[1] !== null && classType !== null;

    // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
    // TODO: This omits argument count check - enable only at -O3 or similar.
    //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
    //       return FUNCTION_TABLE[fn];
    //    }

    // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
    // TODO: Remove this completely once all function invokers are being dynamically generated.
    var needsDestructorStack = false;
    for (var i = 1; i < argTypes.length; ++i) {
      // Skip return value at index 0 - it's not deleted here.
      if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
        // The type does not define a destructor function - must use dynamic stack
        needsDestructorStack = true;
        break;
      }
    }
    var returns = argTypes[0].name !== "void";
    var argsList = "";
    var argsListWired = "";
    for (var i = 0; i < argCount - 2; ++i) {
      argsList += (i !== 0 ? ", " : "") + "arg" + i;
      argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
    }
    var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
    if (needsDestructorStack) {
      invokerFnBody += "var destructors = [];\n";
    }
    var dtorStack = needsDestructorStack ? "destructors" : "null";
    var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
    var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    if (isClassMethodFunc) {
      invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
    }
    for (var i = 0; i < argCount - 2; ++i) {
      invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
      args1.push("argType" + i);
      args2.push(argTypes[i + 2]);
    }
    if (isClassMethodFunc) {
      argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
    }
    invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
    if (needsDestructorStack) {
      invokerFnBody += "runDestructors(destructors);\n";
    } else {
      for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
        // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
        var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
        if (argTypes[i].destructorFunction !== null) {
          invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
          args1.push(paramName + "_dtor");
          args2.push(argTypes[i].destructorFunction);
        }
      }
    }
    if (returns) {
      invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
    }
    invokerFnBody += "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction;
  }
  function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr,
  // [ReturnType, ThisType, Args...]
  invokerSignature, rawInvoker, context, isPureVirtual) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
    whenDependentTypesAreResolved([], [rawClassType], function (classType) {
      classType = classType[0];
      var humanName = classType.name + '.' + methodName;
      if (methodName.startsWith("@@")) {
        methodName = Symbol[methodName.substring(2)];
      }
      if (isPureVirtual) {
        classType.registeredClass.pureVirtualFunctions.push(methodName);
      }
      function unboundTypesHandler() {
        throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
      }
      var proto = classType.registeredClass.instancePrototype;
      var method = proto[methodName];
      if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
        // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
        unboundTypesHandler.argCount = argCount - 2;
        unboundTypesHandler.className = classType.name;
        proto[methodName] = unboundTypesHandler;
      } else {
        // There was an existing function with the same name registered. Set up a function overload routing table.
        ensureOverloadTable(proto, methodName, humanName);
        proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
      }
      whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
        var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);

        // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
        // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
        if (undefined === proto[methodName].overloadTable) {
          // Set argCount in case an overload is registered later
          memberFunction.argCount = argCount - 2;
          proto[methodName] = memberFunction;
        } else {
          proto[methodName].overloadTable[argCount - 2] = memberFunction;
        }
        return [];
      });
      return [];
    });
  }
  var emval_free_list = [];
  var emval_handle_array = [{}, {
    value: undefined
  }, {
    value: null
  }, {
    value: true
  }, {
    value: false
  }];
  function __emval_decref(handle) {
    if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
      emval_handle_array[handle] = undefined;
      emval_free_list.push(handle);
    }
  }
  function count_emval_handles() {
    var count = 0;
    for (var i = 5; i < emval_handle_array.length; ++i) {
      if (emval_handle_array[i] !== undefined) {
        ++count;
      }
    }
    return count;
  }
  function get_first_emval() {
    for (var i = 5; i < emval_handle_array.length; ++i) {
      if (emval_handle_array[i] !== undefined) {
        return emval_handle_array[i];
      }
    }
    return null;
  }
  function init_emval() {
    Module['count_emval_handles'] = count_emval_handles;
    Module['get_first_emval'] = get_first_emval;
  }
  var Emval = {
    toValue: function toValue(handle) {
      if (!handle) {
        throwBindingError('Cannot use deleted val. handle = ' + handle);
      }
      return emval_handle_array[handle].value;
    },
    toHandle: function toHandle(value) {
      switch (value) {
        case undefined:
          {
            return 1;
          }
        case null:
          {
            return 2;
          }
        case true:
          {
            return 3;
          }
        case false:
          {
            return 4;
          }
        default:
          {
            var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
            emval_handle_array[handle] = {
              refcount: 1,
              value: value
            };
            return handle;
          }
      }
    }
  };
  function __embind_register_emval(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      'fromWireType': function fromWireType(handle) {
        var rv = Emval.toValue(handle);
        __emval_decref(handle);
        return rv;
      },
      'toWireType': function toWireType(destructors, value) {
        return Emval.toHandle(value);
      },
      'argPackAdvance': 8,
      'readValueFromPointer': simpleReadValueFromPointer,
      destructorFunction: null // This type does not need a destructor

      // TODO: do we need a deleteObject here?  write a test where
      // emval is passed into JS via an interface
    });
  }

  function enumReadValueFromPointer(name, shift, signed) {
    switch (shift) {
      case 0:
        return function (pointer) {
          var heap = signed ? HEAP8 : HEAPU8;
          return this['fromWireType'](heap[pointer]);
        };
      case 1:
        return function (pointer) {
          var heap = signed ? HEAP16 : HEAPU16;
          return this['fromWireType'](heap[pointer >> 1]);
        };
      case 2:
        return function (pointer) {
          var heap = signed ? HEAP32 : HEAPU32;
          return this['fromWireType'](heap[pointer >> 2]);
        };
      default:
        throw new TypeError("Unknown integer type: " + name);
    }
  }
  function __embind_register_enum(rawType, name, size, isSigned) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    function ctor() {}
    ctor.values = {};
    registerType(rawType, {
      name: name,
      constructor: ctor,
      'fromWireType': function fromWireType(c) {
        return this.constructor.values[c];
      },
      'toWireType': function toWireType(destructors, c) {
        return c.value;
      },
      'argPackAdvance': 8,
      'readValueFromPointer': enumReadValueFromPointer(name, shift, isSigned),
      destructorFunction: null
    });
    exposePublicSymbol(name, ctor);
  }
  function requireRegisteredType(rawType, humanName) {
    var impl = registeredTypes[rawType];
    if (undefined === impl) {
      throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
    }
    return impl;
  }
  function __embind_register_enum_value(rawEnumType, name, enumValue) {
    var enumType = requireRegisteredType(rawEnumType, 'enum');
    name = readLatin1String(name);
    var Enum = enumType.constructor;
    var Value = Object.create(enumType.constructor.prototype, {
      value: {
        value: enumValue
      },
      constructor: {
        value: createNamedFunction(enumType.name + '_' + name, function () {})
      }
    });
    Enum.values[enumValue] = Value;
    Enum[name] = Value;
  }
  function _embind_repr(v) {
    if (v === null) {
      return 'null';
    }
    var t = _typeof(v);
    if (t === 'object' || t === 'array' || t === 'function') {
      return v.toString();
    } else {
      return '' + v;
    }
  }
  function floatReadValueFromPointer(name, shift) {
    switch (shift) {
      case 2:
        return function (pointer) {
          return this['fromWireType'](HEAPF32[pointer >> 2]);
        };
      case 3:
        return function (pointer) {
          return this['fromWireType'](HEAPF64[pointer >> 3]);
        };
      default:
        throw new TypeError("Unknown float type: " + name);
    }
  }
  function __embind_register_float(rawType, name, size) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      'fromWireType': function fromWireType(value) {
        return value;
      },
      'toWireType': function toWireType(destructors, value) {
        // The VM will perform JS to Wasm value conversion, according to the spec:
        // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
        return value;
      },
      'argPackAdvance': 8,
      'readValueFromPointer': floatReadValueFromPointer(name, shift),
      destructorFunction: null // This type does not need a destructor
    });
  }

  function integerReadValueFromPointer(name, shift, signed) {
    // integers are quite common, so generate very specialized functions
    switch (shift) {
      case 0:
        return signed ? function readS8FromPointer(pointer) {
          return HEAP8[pointer];
        } : function readU8FromPointer(pointer) {
          return HEAPU8[pointer];
        };
      case 1:
        return signed ? function readS16FromPointer(pointer) {
          return HEAP16[pointer >> 1];
        } : function readU16FromPointer(pointer) {
          return HEAPU16[pointer >> 1];
        };
      case 2:
        return signed ? function readS32FromPointer(pointer) {
          return HEAP32[pointer >> 2];
        } : function readU32FromPointer(pointer) {
          return HEAPU32[pointer >> 2];
        };
      default:
        throw new TypeError("Unknown integer type: " + name);
    }
  }
  function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
    name = readLatin1String(name);
    var shift = getShiftFromSize(size);
    var fromWireType = function fromWireType(value) {
      return value;
    };
    if (minRange === 0) {
      var bitshift = 32 - 8 * size;
      fromWireType = function fromWireType(value) {
        return value << bitshift >>> bitshift;
      };
    }
    var isUnsignedType = name.includes('unsigned');
    var checkAssertions = function checkAssertions(value, toTypeName) {};
    var toWireType;
    if (isUnsignedType) {
      toWireType = function toWireType(destructors, value) {
        checkAssertions(value, this.name);
        return value >>> 0;
      };
    } else {
      toWireType = function toWireType(destructors, value) {
        checkAssertions(value, this.name);
        // The VM will perform JS to Wasm value conversion, according to the spec:
        // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
        return value;
      };
    }
    registerType(primitiveType, {
      name: name,
      'fromWireType': fromWireType,
      'toWireType': toWireType,
      'argPackAdvance': 8,
      'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
      destructorFunction: null // This type does not need a destructor
    });
  }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
    var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
    var TA = typeMapping[dataTypeIndex];
    function decodeMemoryView(handle) {
      handle = handle >> 2;
      var heap = HEAPU32;
      var size = heap[handle]; // in elements
      var data = heap[handle + 1]; // byte offset into emscripten heap
      return new TA(buffer, data, size);
    }
    name = readLatin1String(name);
    registerType(rawType, {
      name: name,
      'fromWireType': decodeMemoryView,
      'argPackAdvance': 8,
      'readValueFromPointer': decodeMemoryView
    }, {
      ignoreDuplicateRegistrations: true
    });
  }
  function __embind_register_std_string(rawType, name) {
    name = readLatin1String(name);
    var stdStringIsUTF8
    //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
    = name === "std::string";
    registerType(rawType, {
      name: name,
      'fromWireType': function fromWireType(value) {
        var length = HEAPU32[value >> 2];
        var str;
        if (stdStringIsUTF8) {
          var decodeStartPtr = value + 4;
          // Looping here to support possible embedded '0' bytes
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = value + 4 + i;
            if (i == length || HEAPU8[currentBytePtr] == 0) {
              var maxRead = currentBytePtr - decodeStartPtr;
              var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
              if (str === undefined) {
                str = stringSegment;
              } else {
                str += String.fromCharCode(0);
                str += stringSegment;
              }
              decodeStartPtr = currentBytePtr + 1;
            }
          }
        } else {
          var a = new Array(length);
          for (var i = 0; i < length; ++i) {
            a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
          }
          str = a.join('');
        }
        _free(value);
        return str;
      },
      'toWireType': function toWireType(destructors, value) {
        if (value instanceof ArrayBuffer) {
          value = new Uint8Array(value);
        }
        var getLength;
        var valueIsOfTypeString = typeof value === 'string';
        if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
          throwBindingError('Cannot pass non-string to std::string');
        }
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          getLength = function getLength() {
            return lengthBytesUTF8(value);
          };
        } else {
          getLength = function getLength() {
            return value.length;
          };
        }

        // assumes 4-byte alignment
        var length = getLength();
        var ptr = _malloc(4 + length + 1);
        HEAPU32[ptr >> 2] = length;
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          stringToUTF8(value, ptr + 4, length + 1);
        } else {
          if (valueIsOfTypeString) {
            for (var i = 0; i < length; ++i) {
              var charCode = value.charCodeAt(i);
              if (charCode > 255) {
                _free(ptr);
                throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
              }
              HEAPU8[ptr + 4 + i] = charCode;
            }
          } else {
            for (var i = 0; i < length; ++i) {
              HEAPU8[ptr + 4 + i] = value[i];
            }
          }
        }
        if (destructors !== null) {
          destructors.push(_free, ptr);
        }
        return ptr;
      },
      'argPackAdvance': 8,
      'readValueFromPointer': simpleReadValueFromPointer,
      destructorFunction: function destructorFunction(ptr) {
        _free(ptr);
      }
    });
  }
  function __embind_register_std_wstring(rawType, charSize, name) {
    name = readLatin1String(name);
    var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
    if (charSize === 2) {
      decodeString = UTF16ToString;
      encodeString = stringToUTF16;
      lengthBytesUTF = lengthBytesUTF16;
      getHeap = function getHeap() {
        return HEAPU16;
      };
      shift = 1;
    } else if (charSize === 4) {
      decodeString = UTF32ToString;
      encodeString = stringToUTF32;
      lengthBytesUTF = lengthBytesUTF32;
      getHeap = function getHeap() {
        return HEAPU32;
      };
      shift = 2;
    }
    registerType(rawType, {
      name: name,
      'fromWireType': function fromWireType(value) {
        // Code mostly taken from _embind_register_std_string fromWireType
        var length = HEAPU32[value >> 2];
        var HEAP = getHeap();
        var str;
        var decodeStartPtr = value + 4;
        // Looping here to support possible embedded '0' bytes
        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = value + 4 + i * charSize;
          if (i == length || HEAP[currentBytePtr >> shift] == 0) {
            var maxReadBytes = currentBytePtr - decodeStartPtr;
            var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
            if (str === undefined) {
              str = stringSegment;
            } else {
              str += String.fromCharCode(0);
              str += stringSegment;
            }
            decodeStartPtr = currentBytePtr + charSize;
          }
        }
        _free(value);
        return str;
      },
      'toWireType': function toWireType(destructors, value) {
        if (!(typeof value === 'string')) {
          throwBindingError('Cannot pass non-string to C++ string type ' + name);
        }

        // assumes 4-byte alignment
        var length = lengthBytesUTF(value);
        var ptr = _malloc(4 + length + charSize);
        HEAPU32[ptr >> 2] = length >> shift;
        encodeString(value, ptr + 4, length + charSize);
        if (destructors !== null) {
          destructors.push(_free, ptr);
        }
        return ptr;
      },
      'argPackAdvance': 8,
      'readValueFromPointer': simpleReadValueFromPointer,
      destructorFunction: function destructorFunction(ptr) {
        _free(ptr);
      }
    });
  }
  function __embind_register_void(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
      isVoid: true,
      // void return values can be optimized out sometimes
      name: name,
      'argPackAdvance': 0,
      'fromWireType': function fromWireType() {
        return undefined;
      },
      'toWireType': function toWireType(destructors, o) {
        // TODO: assert if anything else is given?
        return undefined;
      }
    });
  }
  function _abort() {
    abort('');
  }
  function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num);
  }
  function abortOnCannotGrowMemory(requestedSize) {
    abort('OOM');
  }
  function _emscripten_resize_heap(requestedSize) {
    var oldSize = HEAPU8.length;
    abortOnCannotGrowMemory();
  }
  function _time(ptr) {
    var ret = Date.now() / 1000 | 0;
    if (ptr) {
      HEAP32[ptr >> 2] = ret;
    }
    return ret;
  }
  embind_init_charCodes();
  BindingError = Module['BindingError'] = extendError(Error, 'BindingError');
  InternalError = Module['InternalError'] = extendError(Error, 'InternalError');
  init_ClassHandle();
  init_RegisteredPointer();
  init_embind();
  UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');
  init_emval();
  function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      var chr = array[i];
      if (chr > 0xFF) {
        chr &= 0xFF;
      }
      ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
  }

  // Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

  // This code was written by Tyler Akins and has been placed in the
  // public domain.  It would be nice if you left this header intact.
  // Base64 code from Tyler Akins -- http://rumkin.com

  /**
   * Decodes a base64 string.
   * @param {string} input The string to decode.
   */
  var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    do {
      enc1 = keyStr.indexOf(input.charAt(i++));
      enc2 = keyStr.indexOf(input.charAt(i++));
      enc3 = keyStr.indexOf(input.charAt(i++));
      enc4 = keyStr.indexOf(input.charAt(i++));
      chr1 = enc1 << 2 | enc2 >> 4;
      chr2 = (enc2 & 15) << 4 | enc3 >> 2;
      chr3 = (enc3 & 3) << 6 | enc4;
      output = output + String.fromCharCode(chr1);
      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3);
      }
    } while (i < input.length);
    return output;
  };

  // Converts a string of base64 into a byte array.
  // Throws error on invalid input.
  function intArrayFromBase64(s) {
    if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
      var buf = Buffer.from(s, 'base64');
      return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
    }
    try {
      var decoded = decodeBase64(s);
      var bytes = new Uint8Array(decoded.length);
      for (var i = 0; i < decoded.length; ++i) {
        bytes[i] = decoded.charCodeAt(i);
      }
      return bytes;
    } catch (_) {
      throw new Error('Converting base64 string to bytes failed.');
    }
  }

  // If filename is a base64 data URI, parses and returns data (Buffer on node,
  // Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
  function tryParseAsDataURI(filename) {
    if (!isDataURI(filename)) {
      return;
    }
    return intArrayFromBase64(filename.slice(dataURIPrefix.length));
  }
  var asmLibraryArg = {
    "_embind_register_bigint": __embind_register_bigint,
    "_embind_register_bool": __embind_register_bool,
    "_embind_register_class": __embind_register_class,
    "_embind_register_class_constructor": __embind_register_class_constructor,
    "_embind_register_class_function": __embind_register_class_function,
    "_embind_register_emval": __embind_register_emval,
    "_embind_register_enum": __embind_register_enum,
    "_embind_register_enum_value": __embind_register_enum_value,
    "_embind_register_float": __embind_register_float,
    "_embind_register_integer": __embind_register_integer,
    "_embind_register_memory_view": __embind_register_memory_view,
    "_embind_register_std_string": __embind_register_std_string,
    "_embind_register_std_wstring": __embind_register_std_wstring,
    "_embind_register_void": __embind_register_void,
    "abort": _abort,
    "emscripten_memcpy_big": _emscripten_memcpy_big,
    "emscripten_resize_heap": _emscripten_resize_heap,
    "time": _time
  };
  var asm = createWasm();
  /** @type {function(...*):?} */
  var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["__wasm_call_ctors"];

  /** @type {function(...*):?} */
  var ___getTypeName = Module["___getTypeName"] = asm["__getTypeName"];

  /** @type {function(...*):?} */
  var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = asm["__embind_register_native_and_builtin_types"];

  /** @type {function(...*):?} */
  var ___errno_location = Module["___errno_location"] = asm["__errno_location"];

  /** @type {function(...*):?} */
  var _malloc = Module["_malloc"] = asm["malloc"];

  /** @type {function(...*):?} */
  var stackSave = Module["stackSave"] = asm["stackSave"];

  /** @type {function(...*):?} */
  var stackRestore = Module["stackRestore"] = asm["stackRestore"];

  /** @type {function(...*):?} */
  var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];

  /** @type {function(...*):?} */
  var _free = Module["_free"] = asm["free"];

  // === Auto-generated postamble setup entry stuff ===

  var calledRun;

  /**
   * @constructor
   * @this {ExitStatus}
   */
  function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status;
  }
  dependenciesFulfilled = function runCaller() {
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
  };

  /** @type {function(Array=)} */
  function run(args) {
    if (runDependencies > 0) {
      return;
    }
    preRun();

    // a preRun added a dependency, run will be called later
    if (runDependencies > 0) {
      return;
    }
    function doRun() {
      // run may have just been called through dependencies being fulfilled just in this very frame,
      // or while the async setStatus time below was happening
      if (calledRun) return;
      calledRun = true;
      Module['calledRun'] = true;
      if (ABORT) return;
      initRuntime();
      if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();
      postRun();
    }
    if (Module['setStatus']) {
      Module['setStatus']('Running...');
      setTimeout(function () {
        setTimeout(function () {
          Module['setStatus']('');
        }, 1);
        doRun();
      }, 1);
    } else {
      doRun();
    }
  }
  Module['run'] = run;
  if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
      Module['preInit'].pop()();
    }
  }
  run();

  var _Object$freeze, _Object$freeze2, _Object$freeze3;
  var waveforms = Object.freeze((_Object$freeze = {}, _defineProperty(_Object$freeze, WaveFormParam.SINE, Module.WaveForm.SINE), _defineProperty(_Object$freeze, WaveFormParam.SAWTOOTH, Module.WaveForm.SAW), _defineProperty(_Object$freeze, WaveFormParam.SQUARE, Module.WaveForm.SQUARE), _defineProperty(_Object$freeze, WaveFormParam.TRIANGLE, Module.WaveForm.TRIANGLE), _Object$freeze));
  var FilterMode = Object.freeze((_Object$freeze2 = {}, _defineProperty(_Object$freeze2, FilterModeParam.LOWPASS, Module.FilterMode.LOWPASS), _defineProperty(_Object$freeze2, FilterModeParam.LOWPASS_PLUS, Module.FilterMode.LOWPASS_PLUS), _defineProperty(_Object$freeze2, FilterModeParam.BANDPASS, Module.FilterMode.BANDPASS), _defineProperty(_Object$freeze2, FilterModeParam.HIGHPASS, Module.FilterMode.HIGHPASS), _Object$freeze2));
  var LfoDestination = Object.freeze((_Object$freeze3 = {}, _defineProperty(_Object$freeze3, LfoDestinationParam.FREQUENCY, Module.LfoDestination.FREQUENCY), _defineProperty(_Object$freeze3, LfoDestinationParam.OSCILLATOR_MIX, Module.LfoDestination.OSCILLATOR_MIX), _defineProperty(_Object$freeze3, LfoDestinationParam.CUTOFF, Module.LfoDestination.CUTOFF), _defineProperty(_Object$freeze3, LfoDestinationParam.RESONANCE, Module.LfoDestination.RESONANCE), _defineProperty(_Object$freeze3, LfoDestinationParam.OSC1_CYCLE, Module.LfoDestination.OSC1_CYCLE), _defineProperty(_Object$freeze3, LfoDestinationParam.OSC2_CYCLE, Module.LfoDestination.OSC2_CYCLE), _Object$freeze3));
  function createParameterBuffers() {
    var parameterDescriptors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    return new Map(parameterDescriptors.map(toParameterBufferEntry));
  }
  function toParameterBufferEntry(descriptor) {
    return [descriptor.name, new HeapParameterBuffer(Module, RENDER_QUANTUM_FRAMES)];
  }
  function kValueOf(param) {
    return param[0];
  }
  function isStarted(parameters) {
    return kValueOf(parameters.state) === VoiceState.STARTED;
  }
  function isStopped(parameters) {
    return kValueOf(parameters.state) === VoiceState.STOPPED;
  }
  var KernelPool = /*#__PURE__*/function () {
    function KernelPool() {
      var length = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 8;
      _classCallCheck(this, KernelPool);
      _defineProperty(this, "pool", []);
      this.pool = Array.from({
        length: length
      }).map(function () {
        return new Module.VoiceKernel(sampleRate, RENDER_QUANTUM_FRAMES);
      });
    }
    _createClass(KernelPool, [{
      key: "acquire",
      value: function acquire() {
        return this.pool.shift();
      }
    }, {
      key: "release",
      value: function release(kernel) {
        kernel.reset();
        this.pool.push(kernel);
      }
    }]);
    return KernelPool;
  }();
  var pool = new KernelPool(16);
  var VoiceProcessor = /*#__PURE__*/function (_AudioWorkletProcesso) {
    _inherits(VoiceProcessor, _AudioWorkletProcesso);
    var _super = _createSuper(VoiceProcessor);
    function VoiceProcessor() {
      var _this;
      _classCallCheck(this, VoiceProcessor);
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _super.call.apply(_super, [this].concat(args));
      _defineProperty(_assertThisInitialized(_this), "outputBuffer", new HeapAudioBuffer(Module, RENDER_QUANTUM_FRAMES, 2, MAX_CHANNEL_COUNT));
      _defineProperty(_assertThisInitialized(_this), "parameterBuffers", createParameterBuffers(automatedParameterDescriptors));
      _defineProperty(_assertThisInitialized(_this), "kernel", pool.acquire());
      _defineProperty(_assertThisInitialized(_this), "state", VoiceState.DISPOSED);
      return _this;
    }
    _createClass(VoiceProcessor, [{
      key: "process",
      value: function process(inputs, outputs, parameters) {
        if (!isStarted(parameters) && this.state === VoiceState.DISPOSED) {
          return true;
        }
        if (this.state === VoiceState.DISPOSED) {
          this.state = VoiceState.STARTED;
        }
        if (this.kernel.isStopped()) {
          this.freeBuffers();
          pool.release(this.kernel);
          return false;
        }
        var output = outputs[0];
        var channelCount = output.length;
        this.allocateBuffers(channelCount, parameters);
        if (isStopped(parameters) && this.state !== VoiceState.STOPPING) {
          this.kernel.enterReleaseStage();
          this.state = VoiceState.STOPPING;
        }
        this.kernel.setVelocity(kValueOf(parameters.velocity));

        // Envelope parameters
        this.kernel.setAmplitudeAttack(this.parameterBuffers.get("amplitudeAttack").getHeapAddress());
        this.kernel.setAmplitudeDecay(this.parameterBuffers.get("amplitudeDecay").getHeapAddress());
        this.kernel.setAmplitudeSustain(this.parameterBuffers.get("amplitudeSustain").getHeapAddress());
        this.kernel.setAmplitudeRelease(this.parameterBuffers.get("amplitudeRelease").getHeapAddress());

        // First oscillator parameters
        this.kernel.setOsc1Mode(waveforms[kValueOf(parameters.osc1)]);
        this.kernel.setOsc1SemiShift(this.parameterBuffers.get("osc1SemiShift").getHeapAddress());
        this.kernel.setOsc1CentShift(this.parameterBuffers.get("osc1CentShift").getHeapAddress());
        this.kernel.setOsc1Cycle(this.parameterBuffers.get("osc1Cycle").getHeapAddress());

        // Second oscillator parameters
        this.kernel.setOsc2Mode(waveforms[kValueOf(parameters.osc2)]);
        this.kernel.setOsc2SemiShift(this.parameterBuffers.get("osc2SemiShift").getHeapAddress());
        this.kernel.setOsc2CentShift(this.parameterBuffers.get("osc2CentShift").getHeapAddress());
        this.kernel.setOsc2Cycle(this.parameterBuffers.get("osc2Cycle").getHeapAddress());
        this.kernel.setOsc2Amplitude(this.parameterBuffers.get("osc2Amplitude").getHeapAddress());
        this.kernel.setNoiseLevel(this.parameterBuffers.get("noiseLevel").getHeapAddress());

        // Filter parameters
        this.kernel.setFilterMode(FilterMode[kValueOf(parameters.filterMode)]);
        this.kernel.setCutoff(this.parameterBuffers.get("cutoff").getHeapAddress());
        this.kernel.setResonance(this.parameterBuffers.get("resonance").getHeapAddress());
        this.kernel.setDrive(this.parameterBuffers.get("drive").getHeapAddress());

        // Filter cutoff modulation parameters
        this.kernel.setCutoffEnvelopeAmount(this.parameterBuffers.get("cutoffEnvelopeAmount").getHeapAddress());
        this.kernel.setCutoffEnvelopeVelocity(this.parameterBuffers.get("cutoffEnvelopeVelocity").getHeapAddress());
        this.kernel.setCutoffEnvelopeAttack(this.parameterBuffers.get("cutoffAttack").getHeapAddress());
        this.kernel.setCutoffEnvelopeDecay(this.parameterBuffers.get("cutoffDecay").getHeapAddress());

        // First LFO parameters
        this.kernel.setLfo1Destination(LfoDestination[kValueOf(parameters.lfo1Destination)]);
        this.kernel.setLfo1Mode(waveforms[kValueOf(parameters.lfo1Mode)]);
        this.kernel.setLfo1Frequency(this.parameterBuffers.get("lfo1Frequency").getHeapAddress());
        this.kernel.setLfo1ModAmount(this.parameterBuffers.get("lfo1ModAmount").getHeapAddress());

        // Second LFO parameters
        this.kernel.setLfo2Destination(LfoDestination[kValueOf(parameters.lfo2Destination)]);
        this.kernel.setLfo2Mode(waveforms[kValueOf(parameters.lfo2Mode)]);
        this.kernel.setLfo2Frequency(this.parameterBuffers.get("lfo2Frequency").getHeapAddress());
        this.kernel.setLfo2ModAmount(this.parameterBuffers.get("lfo2ModAmount").getHeapAddress());

        // Web Assembly computation
        this.kernel.process(this.outputBuffer.getHeapAddress(), channelCount, this.parameterBuffers.get("frequency").getHeapAddress());

        // Web Audio rendering
        for (var channel = 0; channel < channelCount; ++channel) {
          output[channel].set(this.outputBuffer.getChannelData(channel));
        }
        return true;
      }
    }, {
      key: "allocateBuffers",
      value: function allocateBuffers(channelCount, parameters) {
        this.outputBuffer.adaptChannel(channelCount);
        this.parameterBuffers.forEach(function (buffer, name) {
          buffer.getData().set(parameters[name]);
        });
      }
    }, {
      key: "freeBuffers",
      value: function freeBuffers() {
        this.outputBuffer.free();
        this.parameterBuffers.forEach(function (buffer) {
          buffer.free();
        });
      }
    }], [{
      key: "parameterDescriptors",
      get: function get() {
        return [].concat(_toConsumableArray(staticParameterDescriptors), _toConsumableArray(automatedParameterDescriptors));
      }
    }]);
    return VoiceProcessor;
  }( /*#__PURE__*/_wrapNativeSuper(AudioWorkletProcessor)); // noinspection JSUnresolvedFunction
  registerProcessor("voice", VoiceProcessor);

})));
