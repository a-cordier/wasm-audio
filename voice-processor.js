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

  // include: shell.js
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
  var Module = typeof Module != 'undefined' ? Module : {};

  // --pre-jses are emitted after the Module integration code, so that they can
  // refer to Module (if they choose; they can also define Module)

  // Sometimes an existing Module object exists with properties
  // meant to overwrite the default module functionality. Here
  // we collect those properties and reapply _after_ we configure
  // the current environment's defaults to avoid having to be so
  // defensive during initialization.
  var moduleOverrides = Object.assign({}, Module);
  var arguments_ = [];
  var thisProgram = './this.program';

  // Determine the runtime environment we are in. You can customize this by
  // setting the ENVIRONMENT setting at compile time (see settings.js).

  // Attempt to auto-detect the environment
  var ENVIRONMENT_IS_WEB = (typeof window === "undefined" ? "undefined" : _typeof(window)) == 'object';
  var ENVIRONMENT_IS_WORKER = typeof importScripts == 'function';
  // N.b. Electron.js environment is simultaneously a NODE-environment, but
  // also a web environment.
  var ENVIRONMENT_IS_NODE = (typeof process === "undefined" ? "undefined" : _typeof(process)) == 'object' && _typeof(process.versions) == 'object' && typeof process.versions.node == 'string';

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
  if (ENVIRONMENT_IS_NODE) {
    // `require()` is no-op in an ESM module, use `createRequire()` to construct
    // the require()` function.  This is only necessary for multi-environment
    // builds, `-sENVIRONMENT=node` emits a static import declaration instead.
    // TODO: Swap all `require()`'s with `import()`'s?
    // These modules will usually be used on Node.js. Load them eagerly to avoid
    // the complexity of lazy-loading.
    var fs = require('fs');
    var nodePath = require('path');
    if (ENVIRONMENT_IS_WORKER) {
      scriptDirectory = nodePath.dirname(scriptDirectory) + '/';
    } else {
      scriptDirectory = __dirname + '/';
    }

    // include: node_shell_read.js
    read_ = function read_(filename, binary) {
      var ret = tryParseAsDataURI(filename);
      if (ret) {
        return binary ? ret : ret.toString();
      }
      // We need to re-wrap `file://` strings to URLs. Normalizing isn't
      // necessary in that case, the path should already be absolute.
      filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
      return fs.readFileSync(filename, binary ? undefined : 'utf8');
    };
    readBinary = function readBinary(filename) {
      var ret = read_(filename, true);
      if (!ret.buffer) {
        ret = new Uint8Array(ret);
      }
      return ret;
    };

    // end include: node_shell_read.js
    if (!Module['thisProgram'] && process.argv.length > 1) {
      thisProgram = process.argv[1].replace(/\\/g, '/');
    }
    arguments_ = process.argv.slice(2);
    if (typeof module != 'undefined') {
      module['exports'] = Module;
    }
    process.on('uncaughtException', function (ex) {
      // suppress ExitStatus exceptions from showing an error
      if (ex !== 'unwind' && !(ex instanceof ExitStatus) && !(ex.context instanceof ExitStatus)) {
        throw ex;
      }
    });

    // Without this older versions of node (< v15) will log unhandled rejections
    // but return 0, which is not normally the desired behaviour.  This is
    // not be needed with node v15 and about because it is now the default
    // behaviour:
    // See https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
    var nodeMajor = process.versions.node.split(".")[0];
    if (nodeMajor < 15) {
      process.on('unhandledRejection', function (reason) {
        throw reason;
      });
    }
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
      } else if (typeof document != 'undefined' && document.currentScript) {
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
  Object.assign(Module, moduleOverrides);
  // Free the object hierarchy contained in the overrides, this lets the GC
  // reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
  moduleOverrides = null;

  // Emit code to handle expected values on the Module object. This applies Module.x
  // to the proper local x. This has two benefits: first, we only emit it if it is
  // expected to arrive, and second, by using a local everywhere else that can be
  // minified.

  if (Module['arguments']) arguments_ = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  // perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message

  // end include: shell.js
  // include: preamble.js
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
  if ((typeof WebAssembly === "undefined" ? "undefined" : _typeof(WebAssembly)) != 'object') {
    abort('no native wasm support detected');
  }

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

  // Memory management

  var HEAP8, /** @type {!Uint8Array} */
    HEAPU8, /** @type {!Int16Array} */
    HEAP16, /** @type {!Uint16Array} */
    HEAPU16, /** @type {!Int32Array} */
    HEAP32, /** @type {!Uint32Array} */
    HEAPU32, /** @type {!Float32Array} */
    HEAPF32, /** @type {!Float64Array} */
    HEAPF64;
  function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module['HEAP8'] = HEAP8 = new Int8Array(b);
    Module['HEAP16'] = HEAP16 = new Int16Array(b);
    Module['HEAP32'] = HEAP32 = new Int32Array(b);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
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

  /** @param {string|number=} what */
  function abort(what) {
    if (Module['onAbort']) {
      Module['onAbort'](what);
    }
    what = 'Aborted(' + what + ')';
    // TODO(sbc): Should we remove printing and leave it up to whoever
    // catches the exception?
    err(what);
    ABORT = true;
    what += '. Build with -sASSERTIONS for more info.';

    // Use a wasm runtime error, because a JS error might be seen as a foreign
    // exception, which means we'd run destructors on it. We need the error to
    // simply make the program stop.
    // FIXME This approach does not work in Wasm EH because it currently does not assume
    // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
    // a trap or not based on a hidden field within the object. So at the moment
    // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
    // allows this in the wasm spec.

    // Suppress closure compiler warning here. Closure compiler's builtin extern
    // defintion for WebAssembly.RuntimeError claims it takes no arguments even
    // though it can.
    // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
    /** @suppress {checkTypes} */
    var e = new WebAssembly.RuntimeError(what);

    // Throw the error whether or not MODULARIZE is set because abort is used
    // in code paths apart from instantiation where an exception is expected
    // to be thrown when abort is called.
    throw e;
  }

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

  // Indicates whether filename is delivered via file protocol (as opposed to http/https)
  function isFileURI(filename) {
    return filename.startsWith('file://');
  }

  // end include: URIUtils.js
  // include: runtime_exceptions.js
  // end include: runtime_exceptions.js
  var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABgYKAgAAoYAJ/fwBgAX8AYAF/AX9gAABgBH9/f38AYAN/f38AYAV/f39/fwBgA39/fwF/YAZ/f39/f38AYAJ/fwF/YAABf2ABfwF9YAF8AXxgAX0BfWADf319AX9gBH99fX0BfWACf30AYAN/f30AYAJ8fAF8YAF/AXxgAX4Bf2ABfAF9YA1/f39/f39/f39/f39/AGAJf39/f39/f39/AGAAAXxgAn99AX1gAX8BfmABfAF+YAJ/fAF8YAF8AX9gAn5/AXxgA3x8fwF8YAN8fn4BfGABfABgAnx/AXxgBX9/f39/AX9gAn1/AX9gBH9/f38Bf2AFf39/fn4AYAd/f39/f39/AAKhhICAABIDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAFgNlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgAIA2Vudh9fZW1iaW5kX3JlZ2lzdGVyX2NsYXNzX2Z1bmN0aW9uABcDZW52FV9lbWJpbmRfcmVnaXN0ZXJfZW51bQAEA2VudhtfZW1iaW5kX3JlZ2lzdGVyX2VudW1fdmFsdWUABQNlbnYVX2VtYmluZF9yZWdpc3Rlcl92b2lkAAADZW52FV9lbWJpbmRfcmVnaXN0ZXJfYm9vbAAGA2VudhhfZW1iaW5kX3JlZ2lzdGVyX2ludGVnZXIABgNlbnYWX2VtYmluZF9yZWdpc3Rlcl9mbG9hdAAFA2VudhtfZW1iaW5kX3JlZ2lzdGVyX3N0ZF9zdHJpbmcAAANlbnYcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwAFA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2VtdmFsAAADZW52HF9lbWJpbmRfcmVnaXN0ZXJfbWVtb3J5X3ZpZXcABQNlbnYTZW1zY3JpcHRlbl9kYXRlX25vdwAYA2VudhVlbXNjcmlwdGVuX21lbWNweV9iaWcABQNlbnYWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAACA2VudgVhYm9ydAADA2VudhdfZW1iaW5kX3JlZ2lzdGVyX2JpZ2ludAAnA5qBgIAAmAEDAwIBDgkEBhARAAUABQAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAFAAAAAAIJAQABBQsLDgIBDwEAAQsRCxkDAwMDAwID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RQ0AIAEoAgAgAGooAgAhAAwBCyAAIQALIAEgAiAAEQAACw0AIABBhARqIAE2AgALRAEBfyABIAAoAgQiA0EBdWohASAAKAIAIQACQAJAIANBAXFFDQAgASgCACAAaigCACEADAELIAAhAAsgASACIAARAAALDQAgAEGIBGogATYCAAsNACAAQYwEaiABNgIACxQAIAAgATYCJCAAQZABaiABNgIACw0AIABBlARqIAE2AgALDQAgAEGYBGogATYCAAsNACAAQZwEaiABNgIACw0AIABBkARqIAE2AgALDQAgAEGgBGogATYCAAsNACAAQaQEaiABNgIACw0AIABBqARqIAE2AgALDQAgAEGsBGogATYCAAsNACAAQbAEaiABNgIACw0AIAAoAoADIAE2AgQLRAEBfyABIAAoAgQiA0EBdWohASAAKAIAIQACQAJAIANBAXFFDQAgASgCACAAaigCACEADAELIAAhAAsgASACIAARAAALDQAgAEG0BGogATYCAAsNACAAQbgEaiABNgIACw0AIABBvARqIAE2AgALDQAgAEHABGogATYCAAsNACAAQcQEaiABNgIACw0AIABByARqIAE2AgALDQAgAEHMBGogATYCAAsNACAAQdAEaiABNgIACw0AIABB1ARqIAE2AgALCgAgACABNgK4AQsKACAAIAE2AtwBC0QBAX8gASAAKAIEIgNBAXVqIQEgACgCACEAAkACQCADQQFxRQ0AIAEoAgAgAGooAgAhAAwBCyAAIQALIAEgAiAAEQAACw0AIABB2ARqIAE2AgALDQAgAEHcBGogATYCAAsKACAAIAE2AuABCwoAIAAgATYChAILCwAgACgC/ANBA0YLQgEBfyABIAAoAgQiAkEBdWohASAAKAIAIQACQAJAIAJBAXFFDQAgASgCACAAaigCACEADAELIAAhAAsgASAAEQIAC4cBAgJ9AX8gAEECNgL8AwJAIABBkAJqKAIAQQNGDQAgAEHcAmogAEGMAmoqAgAiATgCACAAQfACakO9N4Y1IABB4AJqKgIAIgIgAkMAAAAAWxsQYkO9N4Y1IAEgAUMAAAAAWxsQYpMgAEHkAmooAgAiA7NDvTeGNSADG5U4AgALIABBBDYCkAILQgEBfyABIAAoAgQiAkEBdWohASAAKAIAIQACQAJAIAJBAXFFDQAgASgCACAAaigCACEADAELIAAhAAsgASAAEQEAC3cBAX8gACgCgAMiASABKAIAKAIMEQEAIABB6AJqQQA2AgAgAEHEAmpBADYCACAAQaACakEANgIAIABB5ANqQQA2AgAgAEHAA2pBADYCACAAQZwDakEANgIAIABBkAJqQQA2AgAgAEEANgL8AyAAQYwDakEANgIAC48HAgR9A38gACABNgKABCAAQYAEaiACEEsgABBMIABB/ABqIABB6ARqKgIAIgM4AgAgACADOAIQIABBgAFqIABB7ARqKgIAIgM4AgAgACADOAIUIABBiAFqIABB8ARqKgIAIgM4AgAgACADOAIcIABBoAFqIABB9ARqKgIAIgM4AgAgAEE0aiADOAIAIABBpAFqIABB+ARqKgIAIgM4AgAgAEE4aiADOAIAIABBrAFqIABB/ARqKgIAIgM4AgAgAEHAAGogAzgCACAAQZwCaiECAkACQCAAQYwFaioCACAAKgKIAiIElCIDi0MAAABPXUUNACADqCEBDAELQYCAgIB4IQELIAIgASIBNgIAIABBvAJqIABBlAVqKgIAIgM4AgAgAEHcAmogAzgCACAAQcACaiEHAkACQCAEIABBkAVqKgIAlCIFi0MAAABPXUUNACAFqCECDAELQYCAgIB4IQILIAcgAiICNgIAIABB5AJqIQgCQAJAIAQgAEGYBWoqAgCUIgSLQwAAAE9dRQ0AIASoIQcMAQtBgICAgHghBwsgCCAHIgc2AgAgAEGYA2ohCQJAAkAgAEGsBWoqAgAgACoChAMiBZQiBItDAAAAT11FDQAgBKghCAwBC0GAgICAeCEICyAJIAgiCDYCACAAQZQCaioCACEEIABBqAJqQ703hjUgAEGYAmoqAgAiBiAGQwAAAABbGxBiQ703hjUgBCAEQwAAAABbGxBikyABs0O9N4Y1IAEblTgCAEO9N4Y1IABBuAJqKgIAIgQgBEMAAAAAWxsQYiEEIABBzAJqQ703hjUgAyADQwAAAABbGxBiIgMgBJMgArNDvTeGNSACG5U4AgAgAEHwAmpDvTeGNSAAQeACaioCACIEIARDAAAAAFsbEGIgA5MgB7NDvTeGNSAHG5U4AgAgAEG8A2ohAgJAAkAgBSAAQbAFaioCAJQiA4tDAAAAT11FDQAgA6ghAQwBC0GAgICAeCEBCyACIAEiATYC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QRxBICACIABB3ABqKAIASBtqQdQAaigCADYCCCABDwsgACoCBCEBCyABC90KAgF9An8gAEIANwIEIAAgATgCICAAQoCAgPiDgICAPzcCGCAAQRRqQQA2AgAgAEEMakIANwIAQQAQXKcQciAAQThqQQA2AgAgAEEwakIANwIAIABBKGpCADcCACAAQcQAaiABOAIAIABBPGpCgICA+IOAgIA/NwIAQQAQXKcQciAAQdwAakEANgIAIABB1ABqQgA3AgAgAEHMAGpCADcCACAAQegAaiABOAIAIABB4ABqQoCAgPiDgICAPzcCAEEAEFynEHIgAEGAAWpBADYCACAAQfgAakIANwIAIABB8ABqQgA3AgAgAEGMAWogATgCACAAQYQBakKAgID4g4CAgD83AgBBABBcpxByIABBpAFqQQA2AgAgAEGcAWpCADcCACAAQZQBakIANwIAIABBsAFqIAE4AgAgAEGoAWpCgICA+IOAgIA/NwIAQQAQXKcQciAAQcwBakEANgIAIABBxAFqQgA3AgAgAEG8AWpCADcCACAAQdgBaiABOAIAIABB0AFqQoCAgPiDgICAPzcCAEEAEFynEHIgAEH0AWpBADYCACAAQewBakIANwIAIABB5AFqQgA3AgAgAEGAAmogATgCACAAQfgBakKAgID4g4CAgD83AgBBABBcpxByIABB/AJqQQU2AgAgAEH0AmpCgYCAgMAANwIAAkACQCABQ2ZmZj+UIgOLQwAAAE9dRQ0AIAOoIQQMAQtBgICAgHghBAsgAEHwAmpDAAAAACAEIgSzlUMAAAAAIAQbOAIAIABB6AJqQQA2AgAgAEHkAmogBDYCACAAQeACakEANgIAIABB2AJqQgM3AgAgAEHQAmpCgICAgCA3AgACQAJAIAFDAAAAP5QiA4tDAAAAT11FDQAgA6ghBAwBC0GAgICAeCEECyAAQcwCakNVDF3BIAQiBLNDvTeGNSAEGyIDlTgCACAAQcQCakEANgIAIABBwAJqIAQ2AgAgAEG8AmpBADYCACAAQbQCakKCgICAgICAwD83AgAgAEGsAmpCgYCAgBA3AgAgAEGoAmpDVQxdQSADlTgCACAAQaACakEANgIAIABBnAJqIAQ2AgAgAEGYAmpBgICA/AM2AgAgAEGQAmpCADcCACAAIAE4AogCQRgQgwEiBEEANgIE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bG9jaXR5AHNldEN1dG9mZkVudmVsb3BlVmVsb2NpdHkAc2V0TGZvMkZyZXF1ZW5jeQBzZXRMZm8xRnJlcXVlbmN5AHNldEN1dG9mZkVudmVsb3BlRGVjYXkAc2V0QW1wbGl0dWRlRGVjYXkAdW5zaWduZWQgc2hvcnQAc2V0Q3V0b2ZmRW52ZWxvcGVBbW91bnQAc2V0TGZvMk1vZEFtb3VudABzZXRMZm8xTW9kQW1vdW50AHVuc2lnbmVkIGludABzZXRPc2MyQ2VudFNoaWZ0AHNldE9zYzFDZW50U2hpZnQAc2V0T3NjMlNlbWlTaGlmdABzZXRPc2MxU2VtaVNoaWZ0AHJlc2V0AGZsb2F0AHVpbnQ2NF90AHByb2Nlc3MAdW5zaWduZWQgY2hhcgBMZm9EZXN0aW5hdGlvbgBzZXRMZm8yRGVzdGluYXRpb24Ac2V0TGZvMURlc3RpbmF0aW9uAHNldEFtcGxpdHVkZVN1c3RhaW4AV2F2ZUZvcm0AYm9vbABzZXROb2lzZUxldmVsAFZvaWNlS2VybmVsAGVtc2NyaXB0ZW46OnZhbABzZXRDdXRvZmZFbnZlbG9wZUF0dGFjawBzZXRBbXBsaXR1ZGVBdHRhY2sAdW5zaWduZWQgbG9uZwBzdGQ6OndzdHJpbmcAc3RkOjpzdHJpbmcAc3RkOjp1MTZzdHJpbmcAc3RkOjp1MzJzdHJpbmcAc2V0Q3V0b2ZmAHNldERyaXZlAFZvaWNlU3RhdGUAc2V0QW1wbGl0dWRlUmVsZWFzZQBzZXRPc2MyQ3ljbGUAc2V0T3NjMUN5Y2xlAGRvdWJsZQBlbnRlclJlbGVhc2VTdGFnZQBzZXRPc2MyQW1wbGl0dWRlAHNldEZpbHRlck1vZGUAc2V0TGZvMk1vZGUAc2V0T3NjMk1vZGUAc2V0TGZvMU1vZGUAc2V0T3NjMU1vZGUAc2V0UmVzb25hbmNlAHZvaWQAaXNTdG9wcGVkAEZSRVFVRU5DWQBPU0NJTExBVE9SX01JWABTQVcATE9XUEFTU19QTFVTAExPV1BBU1MASElHSFBBU1MAQkFORFBBU1MAU1RPUFBJTkcAQ1VUT0ZGAFNRVUFSRQBTSU5FAFRSSUFOR0xFAE9TQzJfQ1lDTEUAT1NDMV9DWUNMRQBSRVNPTkFOQ0UAU1RBUlRFRABESVNQT1NFRABTVE9QUEVEAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50NjRfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50NjRfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AE41Vm9pY2U2S2VybmVsRQAkNwAAPAoAAFBONVZvaWNlNktlcm5lbEUAAAAAqDcAAFQKAAAAAAAATAoAAFBLTjVWb2ljZTZLZXJuZWxFAAAAqDcAAHgKAAABAAAATAoAAGlpAHYAdmkAaAoAALw2AAC8NgAAaWlmZgAAAAAAAAAABAsAADUAAAA2AAAANwAAADgAAABONkZpbHRlcjE0UmVzb25hbnRLZXJuZWxFAE42RmlsdGVyNktlcm5lbEUAACQ3AADqCgAATDcAANAKAAD8CgAAFDYAAGgKAACYNgAAgDYAAJg2AAB2aWlpaWkAABQ2AABoCgAAvDYAAHZpaWYAAAAAFDYAAGgKAABgCwAATjEwT3NjaWxsYXRvcjRNb2RlRQDYNgAATAsAAHZpaWkAAAAAFDYAAGgKAACYNgAAFDYAAGgKAACYCwAATjZGaWx0ZXI0TW9kZUUAANg2AACICwAAFDYAAGgKAADICwAATjVWb2ljZTE0TGZvRGVzdGluYXRpb25FAAAAANg2AACsCwAALDYAAGgKAABpaWkAFDYAAGgKAAB2aWkATjVWb2ljZTVTdGF0ZUUAANg2AADoCwAATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUAACQ3AAAADAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAACQ3AABIDAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAACQ3AACQDAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURzTlNfMTFjaGFyX3RyYWl0c0lEc0VFTlNfOWFsbG9jYXRvcklEc0VFRUUAAAAkNwAA2AwAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90cmFpdHNJRGlFRU5TXzlhbGxvY2F0b3JJRGlFRUVFAAAAJDcAACQNAABOMTBlbXNjcmlwdGVuM3ZhbEUAACQ3AABwDQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAAAkNwAAjA0AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWFFRQAAJDcAALQNAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUAACQ3AADcDQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAAAkNwAABA4AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXRFRQAAJDcAACwOAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUAACQ3AABUDgAATjEwZW1zY3JpcHRlbjExbWVtb3J5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';
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
      }
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
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
      'env': wasmImports,
      'wasi_snapshot_preview1': wasmImports
    };
    // Load the wasm module and create an instance of using native support in the JS engine.
    // handle a generated wasm instance, receiving its exports and
    // performing other necessary setup
    /** @param {WebAssembly.Module=} module*/
    function receiveInstance(instance, module) {
      var exports = instance.exports;
      Module['asm'] = exports;
      wasmMemory = Module['asm']['memory'];
      updateMemoryViews();
      wasmTable = Module['asm']['__indirect_function_table'];
      addOnInit(Module['asm']['__wasm_call_ctors']);
      removeRunDependency();
      return exports;
    }
    // wait for the pthread pool (if any)
    addRunDependency();

    // Prefer streaming instantiation if available.

    // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
    // to manually instantiate the Wasm module themselves. This allows pages to
    // run the instantiation parallel to any other async startup actions they are
    // performing.
    // Also pthreads and wasm workers initialize the wasm instance through this
    // path.
    if (Module['instantiateWasm']) {
      try {
        return Module['instantiateWasm'](info, receiveInstance);
      } catch (e) {
        err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
      }
    }
    var result = instantiateSync(wasmBinaryFile, info);
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
    // the above line no longer optimizes out down to the following line.
    // When the regression is fixed, we can remove this if/else.
    return receiveInstance(result[0]);
  }

  // include: runtime_debug.js
  // end include: runtime_debug.js
  // === Body ===

  // end include: preamble.js

  /** @constructor */
  function ExitStatus(status) {
    this.name = 'ExitStatus';
    this.message = 'Program terminated with exit(' + status + ')';
    this.status = status;
  }
  function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
      // Pass the module as the first argument.
      callbacks.shift()(Module);
    }
  }
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
    }
    return name;
  }
  function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    // Use an abject with a computed property name to create a new function with
    // a name specified at runtime, but without using `new Function` or `eval`.
    return _defineProperty({}, name, function () {
      return body.apply(this, arguments);
    })[name];
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
  function registerType(rawType, registeredInstance) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
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
        return cb();
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
  var finalizationRegistry = false;
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
  var registeredPointers = {};
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
  var deletionQueue = [];
  function flushPendingDeletes() {
    while (deletionQueue.length) {
      var obj = deletionQueue.pop();
      obj.$$.deleteScheduled = false;
      obj['delete']();
    }
  }
  var delayFunction = undefined;
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
  function attachFinalizer(handle) {
    if ('undefined' === typeof FinalizationRegistry) {
      attachFinalizer = function attachFinalizer(handle) {
        return handle;
      };
      return handle;
    }
    // If the running environment has a FinalizationRegistry (see
    // https://github.com/tc39/proposal-weakrefs), then attach finalizers
    // for class handles.  We check for the presence of FinalizationRegistry
    // at run-time, not build-time.
    finalizationRegistry = new FinalizationRegistry(function (info) {
      releaseClassHandle(info.$$);
    });
    attachFinalizer = function attachFinalizer(handle) {
      var $$ = handle.$$;
      var hasSmartPtr = !!$$.smartPtr;
      if (hasSmartPtr) {
        // We should not call the destructor on raw pointers in case other code expects the pointee to live
        var info = {
          $$: $$
        };
        finalizationRegistry.register(handle, info, handle);
      }
      return handle;
    };
    detachFinalizer = function detachFinalizer(handle) {
      return finalizationRegistry.unregister(handle);
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
      throwBindingError('Cannot pass "' + embindRepr(handle) + '" as a ' + this.name);
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
      throwBindingError('Cannot pass "' + embindRepr(handle) + '" as a ' + this.name);
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
      throwBindingError('Cannot pass "' + embindRepr(handle) + '" as a ' + this.name);
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
    return this['fromWireType'](HEAP32[pointer >> 2]);
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
    var f = Module['dynCall_' + sig];
    return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
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

  /** @param {Object=} args */
  function dynCall(sig, ptr, args) {
    // Without WASM_BIGINT support we cannot directly call function with i64 as
    // part of thier signature, so we rely the dynCall functions generated by
    // wasm-emscripten-finalize
    if (sig.includes('j')) {
      return dynCallLegacy(sig, ptr, args);
    }
    var rtn = getWasmTableEntry(ptr).apply(null, args);
    return rtn;
  }
  function getDynCaller(sig, ptr) {
    var argCache = [];
    return function () {
      argCache.length = 0;
      Object.assign(argCache, arguments);
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
    if (typeof fp != "function") {
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
      // TODO(https://github.com/emscripten-core/emscripten/issues/17310):
      // Find a way to hoist the `>> 2` or `>> 3` out of this loop.
      array.push(HEAPU32[firstElement + i * 4 >> 2]);
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
  function newFunc(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
      throw new TypeError('new_ called with constructor type ' + _typeof(constructor) + " which is not a function");
    }
    /*
     * Previously, the following line was just:
     *   function dummy() {};
     * Unfortunately, Chrome was preserving 'dummy' as the object's name, even
     * though at creation, the 'dummy' has the correct constructor name.  Thus,
     * objects created with IMVU.new would show up in the debugger as 'dummy',
     * which isn't very helpful.  Using IMVU.createNamedFunction addresses the
     * issue.  Doublely-unfortunately, there's no way to write a test for this
     * behavior.  -NRD 2013.02.22
     */
    var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function () {});
    dummy.prototype = constructor.prototype;
    var obj = new dummy();
    var r = constructor.apply(obj, argumentList);
    return r instanceof Object ? r : obj;
  }
  function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, /** boolean= */isAsync) {
    // humanName: a human-readable string name for the function to be generated.
    // argTypes: An array that contains the embind type objects for all types in the function signature.
    //    argTypes[0] is the type object for the function return value.
    //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
    //    argTypes[2...] are the actual function parameters.
    // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
    // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
    // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
    // isAsync: Optional. If true, returns an async function. Async bindings are only supported with JSPI.
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
    invokerFnBody += (returns || isAsync ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
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
    return newFunc(Function, args1).apply(null, args2);
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
      classType.registeredClass.constructor_body[argCount - 1] = function () {
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
  function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr,
  // [ReturnType, ThisType, Args...]
  invokerSignature, rawInvoker, context, isPureVirtual, isAsync) {
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
        // This is the first overload to be registered, OR we are replacing a
        // function in the base class with a function in the derived class.
        unboundTypesHandler.argCount = argCount - 2;
        unboundTypesHandler.className = classType.name;
        proto[methodName] = unboundTypesHandler;
      } else {
        // There was an existing function with the same name registered. Set up
        // a function overload routing table.
        ensureOverloadTable(proto, methodName, humanName);
        proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
      }
      whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
        var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);

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

  /** @constructor */
  function HandleAllocator() {
    // Reserve slot 0 so that 0 is always an invalid handle
    this.allocated = [undefined];
    this.freelist = [];
    this.get = function (id) {
      return this.allocated[id];
    };
    this.allocate = function (handle) {
      var id = this.freelist.pop() || this.allocated.length;
      this.allocated[id] = handle;
      return id;
    };
    this.free = function (id) {
      // Set the slot to `undefined` rather than using `delete` here since
      // apparently arrays with holes in them can be less efficient.
      this.allocated[id] = undefined;
      this.freelist.push(id);
    };
  }
  var emval_handles = new HandleAllocator();
  function __emval_decref(handle) {
    if (handle >= emval_handles.reserved && 0 === --emval_handles.get(handle).refcount) {
      emval_handles.free(handle);
    }
  }
  function count_emval_handles() {
    var count = 0;
    for (var i = emval_handles.reserved; i < emval_handles.allocated.length; ++i) {
      if (emval_handles.allocated[i] !== undefined) {
        ++count;
      }
    }
    return count;
  }
  function init_emval() {
    // reserve some special values. These never get de-allocated.
    // The HandleAllocator takes care of reserving zero.
    emval_handles.allocated.push({
      value: undefined
    }, {
      value: null
    }, {
      value: true
    }, {
      value: false
    });
    emval_handles.reserved = emval_handles.allocated.length;
    Module['count_emval_handles'] = count_emval_handles;
  }
  var Emval = {
    toValue: function toValue(handle) {
      if (!handle) {
        throwBindingError('Cannot use deleted val. handle = ' + handle);
      }
      return emval_handles.get(handle).value;
    },
    toHandle: function toHandle(value) {
      switch (value) {
        case undefined:
          return 1;
        case null:
          return 2;
        case true:
          return 3;
        case false:
          return 4;
        default:
          {
            return emval_handles.allocate({
              refcount: 1,
              value: value
            });
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
  function embindRepr(v) {
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
      return new TA(heap.buffer, data, size);
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
  function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
    // undefined and false each don't write out any bytes.
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
      // unit, not a Unicode code point of the character! So decode
      // UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
      // and https://www.ietf.org/rfc/rfc2279.txt
      // and https://tools.ietf.org/html/rfc3629
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
  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  }
  function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
      // unit, not a Unicode code point of the character! So decode
      // UTF16->UTF32->UTF8.
      // See http://unicode.org/faq/utf_bom.html#utf16-3
      var c = str.charCodeAt(i); // possibly a lead surrogate
      if (c <= 0x7F) {
        len++;
      } else if (c <= 0x7FF) {
        len += 2;
      } else if (c >= 0xD800 && c <= 0xDFFF) {
        len += 4;
        ++i;
      } else {
        len += 3;
      }
    }
    return len;
  }
  var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

  /**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @return {string}
   */
  function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on
    // null terminator by itself.  Also, use the length info to avoid running tiny
    // strings through TextDecoder, since .subarray() allocates garbage.
    // (As a tiny code save trick, compare endPtr against endIdx using a negation,
    // so that undefined means Infinity)
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
      return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
    }
    var str = '';
    // If building with TextDecoder, we have already computed the string length
    // above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heapOrArray[idx++];
      if (!(u0 & 0x80)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
      }
      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | ch >> 10, 0xDC00 | ch & 0x3FF);
      }
    }
    return str;
  }

  /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first   byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index (i.e. maxBytesToRead will not
   *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
   *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
   *   JS JIT optimizations off, so it is worth to consider consistently using one
   * @return {string}
   */
  function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
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
        var payload = value + 4;
        var str;
        if (stdStringIsUTF8) {
          var decodeStartPtr = payload;
          // Looping here to support possible embedded '0' bytes
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = payload + i;
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
            a[i] = String.fromCharCode(HEAPU8[payload + i]);
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
        var length;
        var valueIsOfTypeString = typeof value == 'string';
        if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
          throwBindingError('Cannot pass non-string to std::string');
        }
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          length = lengthBytesUTF8(value);
        } else {
          length = value.length;
        }

        // assumes 4-byte alignment
        var base = _malloc(4 + length + 1);
        var ptr = base + 4;
        HEAPU32[base >> 2] = length;
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          stringToUTF8(value, ptr, length + 1);
        } else {
          if (valueIsOfTypeString) {
            for (var i = 0; i < length; ++i) {
              var charCode = value.charCodeAt(i);
              if (charCode > 255) {
                _free(ptr);
                throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
              }
              HEAPU8[ptr + i] = charCode;
            }
          } else {
            for (var i = 0; i < length; ++i) {
              HEAPU8[ptr + i] = value[i];
            }
          }
        }
        if (destructors !== null) {
          destructors.push(_free, base);
        }
        return base;
      },
      'argPackAdvance': 8,
      'readValueFromPointer': simpleReadValueFromPointer,
      destructorFunction: function destructorFunction(ptr) {
        _free(ptr);
      }
    });
  }
  var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;
  function UTF16ToString(ptr, maxBytesToRead) {
    var endPtr = ptr;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on
    // null terminator by itself.
    // Also, use the length info to avoid running tiny strings through
    // TextDecoder, since .subarray() allocates garbage.
    var idx = endPtr >> 1;
    var maxIdx = idx + maxBytesToRead / 2;
    // If maxBytesToRead is not passed explicitly, it will be undefined, and this
    // will always evaluate to true. This saves on code size.
    while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
    endPtr = idx << 1;
    if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));

    // Fallback: decode without UTF16Decoder
    var str = '';

    // If maxBytesToRead is not passed explicitly, it will be undefined, and the
    // for-loop's condition will always evaluate to true. The loop is then
    // terminated on the first null char.
    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
      var codeUnit = HEAP16[ptr + i * 2 >> 1];
      if (codeUnit == 0) break;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can
      // pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
    return str;
  }
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
        if (!(typeof value == 'string')) {
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
  function _emscripten_date_now() {
    return Date.now();
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
  embind_init_charCodes();
  BindingError = Module['BindingError'] = extendError(Error, 'BindingError');
  InternalError = Module['InternalError'] = extendError(Error, 'InternalError');
  init_ClassHandle();
  init_embind();
  init_RegisteredPointer();
  UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');
  init_emval();
  // include: base64Utils.js
  // Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

  // This code was written by Tyler Akins and has been placed in the
  // public domain.  It would be nice if you left this header intact.
  // Base64 code from Tyler Akins -- http://rumkin.com

  /**
   * Decodes a base64 string.
   * @param {string} input The string to decode.
   */
  var decodeBase64 = typeof atob == 'function' ? atob : function (input) {
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
    if (typeof ENVIRONMENT_IS_NODE == 'boolean' && ENVIRONMENT_IS_NODE) {
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

  // end include: base64Utils.js
  var wasmImports = {
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
    "emscripten_date_now": _emscripten_date_now,
    "emscripten_memcpy_big": _emscripten_memcpy_big,
    "emscripten_resize_heap": _emscripten_resize_heap
  };
  var asm = createWasm();
  /** @type {function(...*):?} */
  var ___wasm_call_ctors = asm["__wasm_call_ctors"];
  /** @type {function(...*):?} */
  var ___getTypeName = Module["___getTypeName"] = asm["__getTypeName"];
  /** @type {function(...*):?} */
  var __embind_initialize_bindings = Module["__embind_initialize_bindings"] = asm["_embind_initialize_bindings"];
  /** @type {function(...*):?} */
  var ___errno_location = asm["__errno_location"];
  /** @type {function(...*):?} */
  var _malloc = Module["_malloc"] = asm["malloc"];
  /** @type {function(...*):?} */
  var _free = asm["free"];
  /** @type {function(...*):?} */
  var stackSave = asm["stackSave"];
  /** @type {function(...*):?} */
  var stackRestore = asm["stackRestore"];
  /** @type {function(...*):?} */
  var stackAlloc = asm["stackAlloc"];

  // include: postamble.js
  // === Auto-generated postamble setup entry stuff ===

  var calledRun;
  dependenciesFulfilled = function runCaller() {
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
  };

  function run() {
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
  if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
      Module['preInit'].pop()();
    }
  }
  run();
  // end include: /home/runner/work/wasm-audio/wasm-audio/src/worklets/em-es6-module.js

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
