/**
 * @license
 * Copyright 2010 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

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

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;




// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }


/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);
    if (ret) {
      return binary ? ret : ret.toString();
    }
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };




  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  process['on']('unhandledRejection', abort);

  quit_ = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };



} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr !== 'undefined' ? printErr : print);
  }


} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {


/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

  read_ = function shell_read(url) {
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
        return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };




  }

  setWindowTitle = function(title) { document.title = title };
} else
{
}


// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module['arguments']) arguments_ = Module['arguments'];
if (Module['thisProgram']) thisProgram = Module['thisProgram'];
if (Module['quit']) quit_ = Module['quit'];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message



/**
 * @license
 * Copyright 2017 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;


function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}





/**
 * @license
 * Copyright 2020 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */


// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function === "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    return new WebAssembly.Function(type, func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;

  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    for (var i = 0; i < table.length; i++) {
      var item = table.get(i);
      // Ignore null values.
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  }

  // It's not in the table, add it now.


  var ret;
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    ret = freeTableIndexes.pop();
  } else {
    ret = table.length;
    // Grow the table
    try {
      table.grow(1);
    } catch (err) {
      if (!(err instanceof RangeError)) {
        throw err;
      }
      throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
    }
  }

  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);

  return ret;
}

function removeFunctionWasm(index) {
  functionsInTableMap.delete(wasmTable.get(index));
  freeTableIndexes.push(index);
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {

  return addFunctionWasm(func, sig);
}

function removeFunction(index) {
  removeFunctionWasm(index);
}



var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


/**
 * @license
 * Copyright 2020 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */




function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

/** @param {Array=} args */
function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};


// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;



/**
 * @license
 * Copyright 2010 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


var wasmBinary;if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
var noExitRuntime;if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];


if (typeof WebAssembly !== 'object') {
  err('no native wasm support detected');
}


/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}





// Wasm globals

var wasmMemory;

// In fastcomp asm.js, we don't need a wasm Table at all.
// In the wasm backend, we polyfill the WebAssembly object,
// so this creates a (non-native-wasm) table for us.
var wasmTable = new WebAssembly.Table({
  'initial': 90,
  'maximum': 90 + 0,
  'element': 'anyfunc'
});


//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);

  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}


/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

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
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heap[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heap[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
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
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
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
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
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
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}



/**
 * @license
 * Copyright 2020 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
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
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0) return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
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
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
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

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
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

var STATIC_BASE = 1024,
    STACK_BASE = 5252976,
    STACKTOP = STACK_BASE,
    STACK_MAX = 10096,
    DYNAMIC_BASE = 5252976,
    DYNAMICTOP_PTR = 9936;




var TOTAL_STACK = 5242880;

var INITIAL_INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 134217728;




/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */




// In standalone mode, the wasm creates the memory, and the user can't provide it.
// In non-standalone/normal mode, we create the memory here.

/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)

  if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
  } else
  {
    wasmMemory = new WebAssembly.Memory({
      'initial': INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
      ,
      'maximum': INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
    });
  }


if (wasmMemory) {
  buffer = wasmMemory.buffer;
}

// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['INITIAL_MEMORY'].
INITIAL_INITIAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;




/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */




/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */




function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback(Module); // Pass the module as the first argument.
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


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
  runtimeInitialized = true;
  
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  runtimeExited = true;
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

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

/** @param {number|boolean=} ignore */
function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
/** @param {number|boolean=} ignore */
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


/**
 * @license
 * Copyright 2019 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

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
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
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
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  out(what);
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  what = 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';

  // Throw a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  throw new WebAssembly.RuntimeError(what);
}


var memoryInitializer = null;


/**
 * @license
 * Copyright 2015 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */







/**
 * @license
 * Copyright 2017 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

function hasPrefix(str, prefix) {
  return String.prototype.startsWith ?
      str.startsWith(prefix) :
      str.indexOf(prefix) === 0;
}

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return hasPrefix(filename, fileURIPrefix);
}



var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB9wIzYAABf2ABfwF/YAF/AGACf38Bf2ACf38AYAN/f38Bf2AAAGACf30AYAN/f38AYAR/f39/AGAFf39/f38AYAZ/f39/f38AYAJ/fQF9YAR/f39/AX9gAn99AX9gAX0BfWAFf39/f38Bf2ADf399AGAGf3x/f39/AX9gAX8BfWAEf35+fwBgAn5/AX9gA39+fwF+YAJ/fwF9YAF8AX1gAnx/AXxgB39/f39/f38AYAh/f39/f39/fwBgDH9/f39/f39/f39/fwBgDX9/f39/f39/f39/f38AYAR/f399AGAHf39/f39/fwF/YAd/f399fX9/AX9gB39/fH9/f38Bf2AEf35/fwF/YAN/fX0Bf2AGf319fX19AX9gA35/fwF/YAJ9fwF/YAR/f35/AX5gAXwBfmADf39/AX1gBX9/f39/AX1gA399fwF9YAN/fX0BfWAEf319fQF9YAN9fX8BfWAEfX1/fwF9YAJ+fgF8YAF8AXxgAnx8AXwCowYdA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzAB0DZW52Gl9lbWJpbmRfcmVnaXN0ZXJfc21hcnRfcHRyABwDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IACwNlbnYVX2VtYmluZF9yZWdpc3Rlcl9lbnVtAAkDZW52G19lbWJpbmRfcmVnaXN0ZXJfZW51bV92YWx1ZQAIA2Vudg1fZW12YWxfZGVjcmVmAAIDZW52EV9lbXZhbF90YWtlX3ZhbHVlAAMDZW52DV9lbXZhbF9pbmNyZWYAAgNlbnYLX2VtdmFsX2NhbGwADQNlbnYYX19jeGFfYWxsb2NhdGVfZXhjZXB0aW9uAAEDZW52C19fY3hhX3Rocm93AAgDZW52H19lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfZnVuY3Rpb24AGwNlbnYFYWJvcnQABhZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX2Nsb3NlAAEWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF93cml0ZQANA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQABANlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAAoDZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwAEA2Vudhxf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GguFCAEDfyMAQdABayIBJAAQMBAxIQIQMSEDEDIQMxA0EDEQNUEBEDcgAhA3IANBgAgQOEECEAAQOhAyQYAIEDsQNUEDED1BBBA/QQUQOEEGEAEQMiABQcgBahBCIAFByAFqEEMQNUEHQQgQAiABQQA2AswBIAFBCTYCyAEgASABKQPIATcDwAFBjAggAUHAAWoQRyABQQA2AswBIAFBCjYCyAEgASABKQPIATcDuAFBlAggAUG4AWoQSSABQQA2AswBIAFBCzYCyAEgASABKQPIATcDsAFBoAggAUGwAWoQSyABQQA2AswBIAFBDDYCyAEgASABKQPIATcDqAFBsQggAUGoAWoQSyABQQA2AswBIAFBDTYCyAEgASABKQPIATcDoAFBwgggAUGgAWoQSSABQQA2AswBIAFBDjYCyAEgASABKQPIATcDmAFBzgggAUGYAWoQSyABQQA2AswBIAFBDzYCyAEgASABKQPIATcDkAFB3wggAUGQAWoQSyABQQA2AswBIAFBEDYCyAEgASABKQPIATcDiAFB8AggAUGIAWoQUSABQQA2AswBIAFBETYCyAEgASABKQPIATcDgAFBgQkgAUGAAWoQSyABQQA2AswBIAFBEjYCyAEgASABKQPIATcDeEGUCSABQfgAahBLIAFBADYCzAEgAUETNgLIASABIAEpA8gBNwNwQaYJIAFB8ABqEEsgAUEANgLMASABQRQ2AsgBIAEgASkDyAE3A2hBugkgAUHoAGoQSyABQQA2AswBIAFBFTYCyAEgASABKQPIATcDYEHOCSABQeAAahBXIAFBADYCzAEgAUEWNgLIASABIAEpA8gBNwNYQdwJIAFB2ABqEFEgAUEANgLMASABQRc2AsgBIAEgASkDyAE3A1BB5gkgAUHQAGoQUSABQQA2AswBIAFBGDYCyAEgASABKQPIATcDSEHzCSABQcgAahBLIAFBADYCzAEgAUEZNgLIASABIAEpA8gBNwNAQYsKIAFBQGsQSyABQQA2AswBIAFBGjYCyAEgASABKQPIATcDOEGjCiABQThqEEsgAUEANgLMASABQRs2AsgBIAEgASkDyAE3AzBBugogAUEwahBRIAFBADYCzAEgAUEcNgLIASABIAEpA8gBNwMoQcoKIAFBKGoQUSABQQA2AswBIAFBHTYCyAEgASABKQPIATcD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ARDBASgCADYCACAACw8AIAAgARDBARDhARogAAsPACAAIAEQwQEQ4wEaIAALCgAgARDBARogAAsKACAAELsBGiAACxsAIABB5A02AgAgAEEMahDXARogABDBARogAAsKACAAEM8BGiAACwoAIAAQ1gEQwgILKQAgAEEMaiIAEMYBENoBIAAQxgEQxgEoAgAQ2wEgABDGARDaARC7ARoLCgAgAEEEahDBAQs4ACMAQRBrIgEkACABQQhqIAAQ5QEgAUEIahC8ARogARDmASAAIAEQ5wEaIAEQvAEaIAFBEGokAAskAQF/QQAhAiABQeAPEN0BBH8gAEEMahDGARDaARDBAQUgAgsLDQAgACgCBCABKAIERgs6AQN/IwBBEGsiASQAIAFBCGogAEEMaiICEMYBEN8BIQMgAhDGARogAyAAEMYBQQEQ4AEgAUEQaiQACwQAIAALDgAgASACQRRsQQQQ7QELDAAgACABEOIBGiAACxUAIAAgASgCADYCACABQQA2AgAgAAscACAAIAEoAgA2AgAgAEEEaiABQQRqEOQBGiAACwwAIAAgARDhARogAAsLACAAIAFBKRDoAQsKACAAQQEQvgEaCxwAIAAoAgAQBSAAIAEoAgA2AgAgAUEANgIAIAALQAECfyMAQRBrIgMkACADEOkBIQQgACABKAIAIANBCGoQ6gEgA0EIahDrASAEEMYBIAIRDQAQvgEaIANBEGokAAsoAQF/IwBBEGsiASQAIAEgABDBATYCDCABQQxqEMkBIAFBEGokACAACwQAQQALBQAQ7AELBQBBjA8LCwAgACABIAIQ7gELCQAgACABEO8BCwcAIAAQ8AELBwAgABDCAgsPACAAEPIBBEAgABC+AgsLKAEBf0EAIQEgAEEEahDzAUF/RgR/IAAgACgCACgCCBECAEEBBSABCwsTACAAIAAoAgBBf2oiADYCACAACx8AIAAgASgCADYCACAAIAEoAgQ2AgQgAUIANwIAIAALHwAgABD+ASABSQRAQaAQEP8BAAsgAUHoA2xBBBCAAgsSACAAIAI2AgQgACABNgIAIAALLQEBfyMAQRBrIgMkACADIAE2AgwgACADQQxqIAIQwQEQgQIaIANBEGokACAACwoAIAAQxgEoAgALOQEBfyMAQRBrIgEkACAAQQAQzAEaIABB7BA2AgAgAEEMaiAB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IASgELYCIQAMAQsgAUGAgID8B08EQCAAIACTIQAMAQsgACACQQhqELoCQQNxIgFBAk0EQAJAAkACQCABQQFrDgIBAgALIAIrAwgQtgIhAAwDCyACKwMIELcCIQAMAgsgAisDCJoQtgIhAAwBCyACKwMIELcCjCEACyACQRBqJAAgAAuQAgICfwJ9AkACQCAAvCIBQYCAgARPQQAgAUF/ShtFBEAgAUH/////B3FFBEBDAACAvyAAIACUlQ8LIAFBf0wEQCAAIACTQwAAAACVDwsgAEMAAABMlLwhAUHofiECDAELIAFB////+wdLDQFBgX8hAkMAAAAAIQAgAUGAgID8A0YNAQsgAiABQY32qwJqIgFBF3ZqsiIDQ4BxMT+UIAFB////A3FB84nU+QNqvkMAAIC/kiIAIAND0fcXN5QgACAAQwAAAECSlSIDIAAgAEMAAAA/lJQiBCADIAOUIgAgACAAlCIAQ+7pkT6UQ6qqKj+SlCAAIABDJp54PpRDE87MPpKUkpKUkiAEk5KSIQALIAALAwAACzoBAX8gAEEIaiIBQQIQvwJFBEAgACAAKAIAKAIQEQIADwsgARDzAUF/RgRAIAAgACgCACgCEBECAAsLFAACQCABQX9qQQRLDQALIAAoAgALBABBAAswAQF/IABBASAAGyEBAkADQCABEPsDIgANARDlAiIABEAgABEGAAwBCwsQDAALIAALBwAgABD8AwsMACAAQcwvNgIAIAALPAECfyABEIUEIgJBDWoQwQIiA0EANgIIIAMgAjYCBCADIAI2AgAgACADEMUCIAEgAkEBahCABDYCACAACwcAIABBDGoLHQAgABDDAhogAEH4LzYCACAAQQRqIAEQxAIaIAALDAAgACgCPBDBARANCwYAQfjIAAsVACAARQRAQQAPCxDIAiAANgIAQX8LyQIBBn8jAEEgayIDJAAgAyAAKAIcIgQ2AhAgACgCFCEFIAMgAjYCHCADIAE2AhggAyAFIARrIgE2AhQgASACaiEFQQIhBiADQRBqIQECfwJAAkAgACgCPCADQRBqQQIgA0EMahAOEMkCRQRAA0AgBSADKAIMIgRGDQIgBEF/TA0DIAFBCGogASAEIAEoAgQiB0siCBsiASAEIAdBACAIG2siByABKAIAajYCACABIAEoAgQgB2s2AgQgBSAEayEFIAAoAjwgASAGIAhrIgYgA0EMahAOEMkCRQ0ACwsgA0F/NgIMIAVBf0cNAQsgACAAKAIsIgE2AhwgACABNgIUIAAgASAAKAIwajYCECACDAELIABBADYCHCAAQgA3AxAgACAAKAIAQSByNgIAQQAgBkECRg0AGiACIAEoAgRrCyEEIANBIGokACAECzYBAX8jAEEQayIDJAAgACgCPCABIAJB/wFxIANBCGoQnAQQyQIaIAMpAwghASADQRBqJAAgAQsKACAAQVBqQQpJCwYAQajGAAuWAgBBASECAkAgAAR/IAFB/wBNDQECQBDPAigCsAEoAgBFBEAgAUGAf3FBgL8DRg0DEMgCQRk2AgAMAQsgAUH/D00EQCAAIAFBP3FBgAFyOgABIAAgAUEGdkHAAXI6AABBAg8LIAFBgLADT0EAIAFBgEBxQYDAA0cbRQRAIAAgAUE/cUGAAXI6AAIgACABQQx2QeABcjoAACAAIAFBBnZBP3FBgAFyOgABQQMPCyABQYCAfGpB//8/TQRAIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBA8LEMgCQRk2AgALQX8FIAILDwsgACABOgAAQQELBQAQzQILFAAgAEUEQEEADwsgACABQQAQzgIL6AEBAn8gAkEARyEDAkACQAJAAkAgAkUNACAAQQNxRQ0AIAFB/wFxIQQDQCAALQAAIARGDQIgAEEBaiEAIAJBf2oiAkEARyEDIAJFDQEgAEEDcQ0ACwsgA0UNAQsgAC0AACABQf8BcUYNAQJAIAJBBE8EQCABQf8BcUGBgoQIbCEEA0AgACgCACAEcyIDQX9zIANB//37d2pxQYCBgoR4cQ0CIABBBGohACACQXxqIgJBA0sNAAsLIAJFDQELIAFB/wFxIQMDQCAALQAAIANGDQIgAEEBaiEAIAJBf2oiAg0ACwtBAA8LIAALfwIBfwF+IAC9IgNCNIinQf8PcSICQf8PRwR8IAJFBEAgASAARAAAAAAAAAAAYQR/QQAFIABEAAAAAAAA8EOiIAEQ0gIhACABKAIAQUBqCzYCACAADwsgASACQYJ4ajYCACADQv////////+HgH+DQoCAgICAgIDwP4S/BSAACwtQAQF+AkAgA0HAAHEEQCABIANBQGqthiECQgAhAQwBCyADRQ0AIAIgA60iBIYgAUHAACADa62IhCECIAEgBIYhAQsgACABNwMAIAAgAjcDCAtQAQF+AkAgA0HAAHEEQCACIANBQGqtiCEBQgAhAgwBCyADRQ0AIAJBwAAgA2uthiABIAOtIgSIhCEBIAIgBIghAgsgACABNwMAIAAgAjcDCAvZAwICfwJ+IwBBIGsiAiQAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFQEQCABQgSGIABCPIiEIQQgAEL//////////w+DIgBCgYCAgICAgIAIWgRAIARCgYCAgICAgIDAAHwhBQwCCyAEQoCAgICAgICAQH0hBSAAQoCAgICAgICACIVCAFINASAFQgGDIAV8IQUMAQsgAFAgBEKAgICAgIDA//8AVCAEQoCAgICAgMD//wBRG0UEQCABQgSGIABCPIiEQv////////8Dg0KAgICAgICA/P8AhCEFDAELQoCAgICAgID4/wAhBSAEQv///////7//wwBWDQBCACEFIARCMIinIgNBkfcASQ0AIAJBEGogACABQv///////z+DQoCAgICAgMAAhCIEIANB/4h/ahDTAiACIAAgBEGB+AAgA2sQ1AIgAikDCEIEhiACKQMAIgRCPIiEIQUgAikDECACKQMYhEIAUq0gBEL//////////w+DhCIEQoGAgICAgICACFoEQCAFQgF8IQUMAQsgBEKAgICAgICAgAiFQgBSDQAgBUIBgyAFfCEFCyACQSBqJAAgBSABQoCAgICAgICAgH+DhL8LgwMBA38jAEHQAWsiBSQAIAUgAjYCzAFBACECIAVBoAFqQQBBKBCBBBogBSAFKALMATYCyAECQEEAIAEgBUHIAWogBUHQAGogBUGgAWogAyAEENcCQQBIBEBBfyEBDAELIAAoAkxBAE4EQCAAEEIhAgsgACgCACEGIAAsAEpBAEwEQCAAIAZBX3E2AgALIAZBIHEhBgJ/IAAoAjAEQCAAIAEgBUHIAWogBUHQAGogBUGgAWogAyAEENcCDAELIABB0AA2AjAgACAFQdAAajYCECAAIAU2AhwgACAFNgIUIAAoAiwhByAAIAU2AiwgACABIAVByAFqIAVB0ABqIAVBoAFqIAMgBBDXAiIBIAdFDQAaIABBAEEAIAAoAiQR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IAFBIHI2AgBBfw8LIABCADcCBCAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQQQALkAEBA38jAEEQayIDJAAgAyABOgAPAkAgACgCECICRQRAQX8hAiAAEIIEDQEgACgCECECCwJAIAAoAhQiBCACTw0AIAFB/wFxIgIgACwAS0YNACAAIARBAWo2AhQgBCABOgAADAELQX8hAiAAIANBD2pBASAAKAIkEQUAQQFHDQAgAy0ADyECCyADQRBqJAAgAgvAAQEEfwJAIAIoAhAiAwR/IAMFQQAhBCACEIIEDQEgAigCEAsgAigCFCIFayABSQRAIAIgACABIAIoAiQRBQAPC0EAIQYCQCACLABLQQBIDQAgASEEA0AgBCIDRQ0BIAAgA0F/aiIEai0AAEEKRw0ACyACIAAgAyACKAIkEQUAIgQgA0kNASABIANrIQEgACADaiEAIAIoAhQhBSADIQYLIAUgACABEIAEGiACIAIoAhQgAWo2AhQgASAGaiEECyAEC5QBAQN/IAAhAQJAAkAgAEEDcUUNACAALQAARQRAQQAPCyAAIQEDQCABQQFqIgFBA3FFDQEgAS0AAA0ACwwBCwNAIAEiAkEEaiEBIAIoAgAiA0F/cyADQf/9+3dqcUGAgYKEeHFFDQALIANB/wFxRQRAIAIgAGsPCwNAIAItAAEhAyACQQFqIgEhAiADDQALCyABIABrCx8AQbzNACgCAEUEQEHAzQAgATYCAEG8zQAgADYCAAsLBAAjAAsQACMAIABrQXBxIgAkACAACwYAIAAkAAsGACAAQAALCQAgASAAEQEACwkAIAEgABECAAsHACAAEQAACwsAIAEgAiAAEQMACw8AIAEgAiADIAQgABEJAAsLACABIAIgABEEAAsLACABIAIgABEHAAsRACABIAIgAyAEIAUgABEKAAsNACABIAIgAyAAEQgACw0AIAEgAiADIAAREQALDwAgASACIAMgBCAAEQ0ACwcAIAARBgALDQAgASACIAMgABEFAAsNACABIAIgAyAAERYACxMAIAEgAiADIAQgBSAGIAAREgALEwAgASACIAMgBCAFIAYgABELAAsiAQF+IAAgASACrSADrUIghoQgBBCYBCIFQiCIpxAZIAWnCxMAIAAgAacgAUIgiKcgAiADEBoLC6g8FgBBgAgLsgtWb2ljZUtlcm5lbABwcm9jZXNzAHNldE9zYzFNb2RlAHNldE9zYzFTZW1pU2hpZnQAc2V0T3NjMUNlbnRTaGlmdABzZXRPc2MyTW9kZQBzZXRPc2MyU2VtaVNoaWZ0AHNldE9zYzJDZW50U2hpZnQAc2V0T3NjMkFtcGxpdHVkZQBzZXRBbXBsaXR1ZGVBdHRhY2sAc2V0QW1wbGl0dWRlRGVjYXkAc2V0QW1wbGl0dWRlU3VzdGFpbgBzZXRBbXBsaXR1ZGVSZWxlYXNlAHNldEZpbHRlck1vZGUAc2V0Q3V0b2ZmAHNldFJlc29uYW5jZQBzZXRDdXRvZmZFbnZlbG9wZUFtb3VudABzZXRDdXRvZmZFbnZlbG9wZUF0dGFjawBzZXRDdXRvZmZFbnZlbG9wZURlY2F5AHNldExmb0ZyZXF1ZW5jeQBzZXRMZm9Nb2RBbW91bnQAc2V0TGZvTW9kZQBzZXRMZm9EZXN0aW5hdGlvbgBpc1N0b3BwZWQAZW50ZXJSZWxlYXNlU3RhZ2UAV2F2ZUZvcm0AU0lORQBTQVcAU1FVQVJFAFRSSUFOR0xFAEZpbHRlck1vZGUATE9XUEFTUwBMT1dQQVNTX1BMVVMAQkFORFBBU1MASElHSFBBU1MAVm9pY2VTdGF0ZQBESVNQT1NFRABTVEFSVEVEAFNUT1BQSU5HAFNUT1BQRUQATGZvRGVzdGluYXRpb24ARlJFUVVFTkNZAE9TQ0lMTEFUT1JfTUlYAENVVE9GRgBJTlZFUlNFRF9SRVNPTkFOQ0UAUkVTT05BTkNFADExVm9pY2VLZXJuZWwAAADoGgAAYAYAAFAxMVZvaWNlS2VybmVsAADIGwAAeAYAAAAAAABwBgAAUEsxMVZvaWNlS2VybmVsAMgbAACYBgAAAQAAAHAGAABpaQB2AHZpAE4xMGVtc2NyaXB0ZW4zdmFsRQAA6BoAAMAGAAAAAAAAgAcAACsAAAAsAAAALQAAAC4AAAAvAAAATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUDExVm9pY2VLZXJuZWxOMTBlbXNjcmlwdGVuMTVzbWFydF9wdHJfdHJhaXRJTlNfMTBzaGFyZWRfcHRySVMxX0VFRTExdmFsX2RlbGV0ZXJFTlNfOWFsbG9jYXRvcklTMV9FRUVFAAAAABAbAAD4BgAA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dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4ATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUATlN0M19fMjIxX19iYXNpY19zdHJpbmdfY29tbW9uSUxiMUVFRQAA6BoAADEfAABsGwAA8h4AAAAAAAABAAAAWB8AAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAbBsAAHgfAAAAAAAAAQAAAFgfAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAGwbAADQHwAAAAAAAAEAAABYHwAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAbBsAACggAAAAAAAAAQAAAFgfAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAABsGwAAhCAAAAAAAAABAAAAWB8AAAAAAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ljRUUAAOgaAADgIAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJYUVFAADoGgAACCEAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWhFRQAA6BoAADAhAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lzRUUAAOgaAABYIQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJdEVFAADoGgAAgCEAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWlFRQAA6BoAAKghAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lqRUUAAOgaAADQIQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbEVFAADoGgAA+CEAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SW1FRQAA6BoAACAiAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lmRUUAAOgaAABIIgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZEVFAADoGgAAcCIAQZjFAAsBBQBBpMUACwE4AEG8xQALCjkAAAA6AAAAhCQAQdTFAAsBAgBB48UACwX//////wBB2McACwKsJA==';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    var binary = tryParseAsDataURI(wasmBinaryFile);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(wasmBinaryFile);
    } else {
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, and have the Fetch api, use that;
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function'
      // Let's not use fetch to get objects over file:// as it's most likely Cordova which doesn't support fetch for file://
      && !isFileURI(wasmBinaryFile)
      ) {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
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
    removeRunDependency('wasm-instantiate');
  }
  // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');


  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }


  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);
      abort(reason);
    });
  }

  // Prefer streaming instantiation if available.
  function instantiateSync() {
    var instance;
    var module;
    var binary;
    try {
      binary = getBinary();
      module = new WebAssembly.Module(binary);
      instance = new WebAssembly.Instance(module, info);
    } catch (e) {
      var str = e.toString();
      err('failed to compile wasm module: ' + str);
      if (str.indexOf('imported Memory') >= 0 ||
          str.indexOf('memory import') >= 0) {
        err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
      }
      throw e;
    }
    receiveInstance(instance, module);
  }
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  instantiateSync();
  return Module['asm']; // exports were assigned here
}


// Globals used by JS i64 conversions
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};




// STATICTOP = STATIC_BASE + 9072;
/* global initializers */  __ATINIT__.push({ func: function() { ___wasm_call_ctors() } });




/* no memory initializer */
// {{PRE_LIBRARY}}


  function demangle(func) {
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  
  var ___exception_infos={};
  
  var ___exception_last=0;
  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return __ZSt18uncaught_exceptionv.uncaught_exceptions > 0;
    }function ___cxa_throw(ptr, type, destructor) {
      ___exception_infos[ptr] = {
        ptr: ptr,
        adjusted: [ptr],
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
      };
      ___exception_last = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exceptions = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exceptions++;
      }
      throw ptr;
    }

  
  function getShiftFromSize(size) {
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
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
    }var embind_charCodes=undefined;function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  
  var awaitingDependencies={};
  
  var registeredTypes={};
  
  var typeDependencies={};
  
  
  
  
  
  
  var char_0=48;
  
  var char_9=57;function makeLegalFunctionName(name) {
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
    }function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          this.name = errorName;
          this.message = message;
  
          var stack = (new Error(message)).stack;
          if (stack !== undefined) {
              this.stack = this.toString() + '\n' +
                  stack.replace(/^Error(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
          if (this.message === undefined) {
              return this.name;
          } else {
              return this.name + ': ' + this.message;
          }
      };
  
      return errorClass;
    }var BindingError=undefined;function throwBindingError(message) {
      throw new BindingError(message);
    }
  
  
  
  var InternalError=undefined;function throwInternalError(message) {
      throw new InternalError(message);
    }function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
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
      dependentTypes.forEach(function(dt, i) {
          if (registeredTypes.hasOwnProperty(dt)) {
              typeConverters[i] = registeredTypes[dt];
          } else {
              unregisteredTypes.push(dt);
              if (!awaitingDependencies.hasOwnProperty(dt)) {
                  awaitingDependencies[dt] = [];
              }
              awaitingDependencies[dt].push(function() {
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
    }/** @param {Object=} options */
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
          callbacks.forEach(function(cb) {
              cb();
          });
      }
    }function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
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
          destructorFunction: null, // This type does not need a destructor
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
          smartPtrType: o.smartPtrType,
      };
    }
  
  function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    }
  
  
  var finalizationGroup=false;
  
  function detachFinalizer(handle) {}
  
  
  function runDestructor($$) {
      if ($$.smartPtr) {
          $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
          $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }function releaseClassHandle($$) {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
          runDestructor($$);
      }
    }function attachFinalizer(handle) {
      if ('undefined' === typeof FinalizationGroup) {
          attachFinalizer = function (handle) { return handle; };
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
      attachFinalizer = function(handle) {
          finalizationGroup.register(handle, handle.$$, handle.$$);
          return handle;
      };
      detachFinalizer = function(handle) {
          finalizationGroup.unregister(handle.$$);
      };
      return attachFinalizer(handle);
    }function ClassHandle_clone() {
      if (!this.$$.ptr) {
          throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.preservePointerOnDelete) {
          this.$$.count.value += 1;
          return this;
      } else {
          var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
              $$: {
                  value: shallowCopyInternalPointer(this.$$),
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
  
  
  var delayFunction=undefined;
  
  var deletionQueue=[];
  
  function flushPendingDeletes() {
      while (deletionQueue.length) {
          var obj = deletionQueue.pop();
          obj.$$.deleteScheduled = false;
          obj['delete']();
      }
    }function ClassHandle_deleteLater() {
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
    }function init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    }function ClassHandle() {
    }
  
  var registeredPointers={};
  
  
  function ensureOverloadTable(proto, methodName, humanName) {
      if (undefined === proto[methodName].overloadTable) {
          var prevFunc = proto[methodName];
          // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
          proto[methodName] = function() {
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
    }/** @param {number=} numArguments */
  function exposePublicSymbol(name, value, numArguments) {
      if (Module.hasOwnProperty(name)) {
          if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
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
      }
      else {
          Module[name] = value;
          if (undefined !== numArguments) {
              Module[name].numArguments = numArguments;
          }
      }
    }
  
  /** @constructor */
  function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast
    ) {
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
    }function constNoSmartPtrRawPointerToWireType(destructors, handle) {
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
              case 0: // NONE
                  // no upcasting
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
                  }
                  break;
  
              case 1: // INTRUSIVE
                  ptr = handle.$$.smartPtr;
                  break;
  
              case 2: // BY_EMVAL
                  if (handle.$$.smartPtrType === this) {
                      ptr = handle.$$.smartPtr;
                  } else {
                      var clonedHandle = handle['clone']();
                      ptr = this.rawShare(
                          ptr,
                          __emval_register(function() {
                              clonedHandle['delete']();
                          })
                      );
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
    }function init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    }var registeredInstances={};
  
  function getBasestPointer(class_, ptr) {
      if (ptr === undefined) {
          throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
          ptr = class_.upcast(ptr);
          class_ = class_.baseClass;
      }
      return ptr;
    }function getInheritedInstance(class_, ptr) {
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
      record.count = { value: 1 };
      return attachFinalizer(Object.create(prototype, {
          $$: {
              value: record,
          },
      }));
    }function RegisteredPointer_fromWireType(ptr) {
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
                  smartPtr: ptr,
              });
          } else {
              return makeClassHandle(this.registeredClass.instancePrototype, {
                  ptrType: this,
                  ptr: ptr,
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
      var dp = downcastPointer(
          rawPointer,
          this.registeredClass,
          toType.registeredClass);
      if (dp === null) {
          return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
              smartPtrType: this,
              smartPtr: ptr,
          });
      } else {
          return makeClassHandle(toType.registeredClass.instancePrototype, {
              ptrType: toType,
              ptr: dp,
          });
      }
    }function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    }/** @constructor
      @param {*=} pointeeType,
      @param {*=} sharingPolicy,
      @param {*=} rawGetPointee,
      @param {*=} rawConstructor,
      @param {*=} rawShare,
      @param {*=} rawDestructor,
       */
  function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
  
      // smart pointer properties
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
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
      }
      else {
          Module[name] = value;
          Module[name].argCount = numArguments;
      }
    }
  
  function embind__requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
  
      function makeDynCaller(dynCall) {
          var args = [];
          for (var i = 1; i < signature.length; ++i) {
              args.push('a' + i);
          }
  
          var name = 'dynCall_' + signature + '_' + rawFunction;
          var body = 'return function ' + name + '(' + args.join(', ') + ') {\n';
          body    += '    return dynCall(rawFunction' + (args.length ? ', ' : '') + args.join(', ') + ');\n';
          body    += '};\n';
  
          return (new Function('dynCall', 'rawFunction', body))(dynCall, rawFunction);
      }
  
      var dc = Module['dynCall_' + signature];
      var fp = makeDynCaller(dc);
  
      if (typeof fp !== "function") {
          throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
      }
      return fp;
    }
  
  
  var UnboundTypeError=undefined;
  
  function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    }function throwUnboundTypeError(message, types) {
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
    }function __embind_register_class(
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor
    ) {
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
  
      exposePublicSymbol(legalFunctionName, function() {
          // this code cannot run if baseClassRawType is zero
          throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
      });
  
      whenDependentTypesAreResolved(
          [rawType, rawPointerType, rawConstPointerType],
          baseClassRawType ? [baseClassRawType] : [],
          function(base) {
              base = base[0];
  
              var baseClass;
              var basePrototype;
              if (baseClassRawType) {
                  baseClass = base.registeredClass;
                  basePrototype = baseClass.instancePrototype;
              } else {
                  basePrototype = ClassHandle.prototype;
              }
  
              var constructor = createNamedFunction(legalFunctionName, function() {
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
                  constructor: { value: constructor },
              });
  
              constructor.prototype = instancePrototype;
  
              var registeredClass = new RegisteredClass(
                  name,
                  constructor,
                  instancePrototype,
                  rawDestructor,
                  baseClass,
                  getActualType,
                  upcast,
                  downcast);
  
              var referenceConverter = new RegisteredPointer(
                  name,
                  registeredClass,
                  true,
                  false,
                  false);
  
              var pointerConverter = new RegisteredPointer(
                  name + '*',
                  registeredClass,
                  false,
                  false,
                  false);
  
              var constPointerConverter = new RegisteredPointer(
                  name + ' const*',
                  registeredClass,
                  false,
                  true,
                  false);
  
              registeredPointers[rawType] = {
                  pointerType: pointerConverter,
                  constPointerType: constPointerConverter
              };
  
              replacePublicSymbol(legalFunctionName, constructor);
  
              return [referenceConverter, pointerConverter, constPointerConverter];
          }
      );
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
    }function __embind_register_class_constructor(
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      var args = [rawConstructor];
      var destructors = [];
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = 'constructor ' + classType.name;
  
          if (undefined === classType.registeredClass.constructor_body) {
              classType.registeredClass.constructor_body = [];
          }
          if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
              throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
          }
          classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
              throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
          };
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
              classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                  if (arguments.length !== argCount - 1) {
                      throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount-1));
                  }
                  destructors.length = 0;
                  args.length = argCount;
                  for (var i = 1; i < argCount; ++i) {
                      args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
                  }
  
                  var ptr = invoker.apply(null, args);
                  runDestructors(destructors);
  
                  return argTypes[0]['fromWireType'](ptr);
              };
              return [];
          });
          return [];
      });
    }

  
  
  function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
          throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
      }
  
      /*
       * Previously, the following line was just:
  
       function dummy() {};
  
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
       * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
       * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
       * to write a test for this behavior.  -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
      dummy.prototype = constructor.prototype;
      var obj = new dummy;
  
      var r = constructor.apply(obj, argumentList);
      return (r instanceof Object) ? r : obj;
    }function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
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
  
      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
  
      // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  
  
      // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
      // TODO: Remove this completely once all function invokers are being dynamically generated.
      var needsDestructorStack = false;
  
      for(var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
          if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
              needsDestructorStack = true;
              break;
          }
      }
  
      var returns = (argTypes[0].name !== "void");
  
      var argsList = "";
      var argsListWired = "";
      for(var i = 0; i < argCount - 2; ++i) {
          argsList += (i!==0?", ":"")+"arg"+i;
          argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
      }
  
      var invokerFnBody =
          "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
          "if (arguments.length !== "+(argCount - 2)+") {\n" +
              "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
          "}\n";
  
  
      if (needsDestructorStack) {
          invokerFnBody +=
              "var destructors = [];\n";
      }
  
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  
  
      if (isClassMethodFunc) {
          invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
      }
  
      for(var i = 0; i < argCount - 2; ++i) {
          invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
          args1.push("argType"+i);
          args2.push(argTypes[i+2]);
      }
  
      if (isClassMethodFunc) {
          argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
  
      invokerFnBody +=
          (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
  
      if (needsDestructorStack) {
          invokerFnBody += "runDestructors(destructors);\n";
      } else {
          for(var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
              var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
              if (argTypes[i].destructorFunction !== null) {
                  invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
                  args1.push(paramName+"_dtor");
                  args2.push(argTypes[i].destructorFunction);
              }
          }
      }
  
      if (returns) {
          invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
                           "return ret;\n";
      } else {
      }
      invokerFnBody += "}\n";
  
      args1.push(invokerFnBody);
  
      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    }function __embind_register_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr, // [ReturnType, ThisType, Args...]
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
          classType = classType[0];
          var humanName = classType.name + '.' + methodName;
  
          if (isPureVirtual) {
              classType.registeredClass.pureVirtualFunctions.push(methodName);
          }
  
          function unboundTypesHandler() {
              throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
          }
  
          var proto = classType.registeredClass.instancePrototype;
          var method = proto[methodName];
          if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
              // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
              unboundTypesHandler.argCount = argCount - 2;
              unboundTypesHandler.className = classType.name;
              proto[methodName] = unboundTypesHandler;
          } else {
              // There was an existing function with the same name registered. Set up a function overload routing table.
              ensureOverloadTable(proto, methodName, humanName);
              proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
          }
  
          whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
  
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

  
  
  var emval_free_list=[];
  
  var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle) {
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
    }function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }function __emval_register(value) {
  
      switch(value){
        case undefined :{ return 1; }
        case null :{ return 2; }
        case true :{ return 3; }
        case false :{ return 4; }
        default:{
          var handle = emval_free_list.length ?
              emval_free_list.pop() :
              emval_handle_array.length;
  
          emval_handle_array[handle] = {refcount: 1, value: value};
          return handle;
          }
        }
    }function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(handle) {
              var rv = emval_handle_array[handle].value;
              __emval_decref(handle);
              return rv;
          },
          'toWireType': function(destructors, value) {
              return __emval_register(value);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: null, // This type does not need a destructor
  
          // TODO: do we need a deleteObject here?  write a test where
          // emval is passed into JS via an interface
      });
    }

  
  function enumReadValueFromPointer(name, shift, signed) {
      switch (shift) {
          case 0: return function(pointer) {
              var heap = signed ? HEAP8 : HEAPU8;
              return this['fromWireType'](heap[pointer]);
          };
          case 1: return function(pointer) {
              var heap = signed ? HEAP16 : HEAPU16;
              return this['fromWireType'](heap[pointer >> 1]);
          };
          case 2: return function(pointer) {
              var heap = signed ? HEAP32 : HEAPU32;
              return this['fromWireType'](heap[pointer >> 2]);
          };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_enum(
      rawType,
      name,
      size,
      isSigned
    ) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
  
      function ctor() {
      }
      ctor.values = {};
  
      registerType(rawType, {
          name: name,
          constructor: ctor,
          'fromWireType': function(c) {
              return this.constructor.values[c];
          },
          'toWireType': function(destructors, c) {
              return c.value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': enumReadValueFromPointer(name, shift, isSigned),
          destructorFunction: null,
      });
      exposePublicSymbol(name, ctor);
    }

  
  function requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      if (undefined === impl) {
          throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
      }
      return impl;
    }function __embind_register_enum_value(
      rawEnumType,
      name,
      enumValue
    ) {
      var enumType = requireRegisteredType(rawEnumType, 'enum');
      name = readLatin1String(name);
  
      var Enum = enumType.constructor;
  
      var Value = Object.create(enumType.constructor.prototype, {
          value: {value: enumValue},
          constructor: {value: createNamedFunction(enumType.name + '_' + name, function() {})},
      });
      Enum.values[enumValue] = Value;
      Enum[name] = Value;
    }

  
  function _embind_repr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              return value;
          },
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following if() and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              return value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(name, shift),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  
  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
  
      var fromWireType = function(value) {
          return value;
      };
  
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = function(value) {
              return (value << bitshift) >>> bitshift;
          };
      }
  
      var isUnsignedType = (name.indexOf('unsigned') != -1);
  
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following two if()s and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              if (value < minRange || value > maxRange) {
                  throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
              }
              return isUnsignedType ? (value >>> 0) : (value | 0);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
      ];
  
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
          'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
      });
    }

  function __embind_register_smart_ptr(
      rawType,
      rawPointeeType,
      name,
      sharingPolicy,
      getPointeeSignature,
      rawGetPointee,
      constructorSignature,
      rawConstructor,
      shareSignature,
      rawShare,
      destructorSignature,
      rawDestructor
    ) {
      name = readLatin1String(name);
      rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
      rawConstructor = embind__requireFunction(constructorSignature, rawConstructor);
      rawShare = embind__requireFunction(shareSignature, rawShare);
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  
      whenDependentTypesAreResolved([rawType], [rawPointeeType], function(pointeeType) {
          pointeeType = pointeeType[0];
  
          var registeredPointer = new RegisteredPointer(
              name,
              pointeeType.registeredClass,
              false,
              false,
              // smart pointer properties
              true,
              pointeeType,
              sharingPolicy,
              rawGetPointee,
              rawConstructor,
              rawShare,
              rawDestructor);
          return [registeredPointer];
      });
    }

  function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var length = HEAPU32[value >> 2];
  
              var str;
              if (stdStringIsUTF8) {
                  //ensure null termination at one-past-end byte if not present yet
                  var endChar = HEAPU8[value + 4 + length];
                  var endCharSwap = 0;
                  if (endChar != 0) {
                      endCharSwap = endChar;
                      HEAPU8[value + 4 + length] = 0;
                  }
  
                  var decodeStartPtr = value + 4;
                  // Looping here to support possible embedded '0' bytes
                  for (var i = 0; i <= length; ++i) {
                      var currentBytePtr = value + 4 + i;
                      if (HEAPU8[currentBytePtr] == 0) {
                          var stringSegment = UTF8ToString(decodeStartPtr);
                          if (str === undefined) {
                              str = stringSegment;
                          } else {
                              str += String.fromCharCode(0);
                              str += stringSegment;
                          }
                          decodeStartPtr = currentBytePtr + 1;
                      }
                  }
  
                  if (endCharSwap != 0) {
                      HEAPU8[value + 4 + length] = endCharSwap;
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
          'toWireType': function(destructors, value) {
              if (value instanceof ArrayBuffer) {
                  value = new Uint8Array(value);
              }
  
              var getLength;
              var valueIsOfTypeString = (typeof value === 'string');
  
              if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                  throwBindingError('Cannot pass non-string to std::string');
              }
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  getLength = function() {return lengthBytesUTF8(value);};
              } else {
                  getLength = function() {return value.length;};
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
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
          decodeString = UTF16ToString;
          encodeString = stringToUTF16;
          lengthBytesUTF = lengthBytesUTF16;
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          decodeString = UTF32ToString;
          encodeString = stringToUTF32;
          lengthBytesUTF = lengthBytesUTF32;
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              // Code mostly taken from _embind_register_std_string fromWireType
              var length = HEAPU32[value >> 2];
              var HEAP = getHeap();
              var str;
              // Ensure null termination at one-past-end byte if not present yet
              var endChar = HEAP[(value + 4 + length * charSize) >> shift];
              var endCharSwap = 0;
              if (endChar != 0) {
                  endCharSwap = endChar;
                  HEAP[(value + 4 + length * charSize) >> shift] = 0;
              }
  
              var decodeStartPtr = value + 4;
              // Looping here to support possible embedded '0' bytes
              for (var i = 0; i <= length; ++i) {
                  var currentBytePtr = value + 4 + i * charSize;
                  if (HEAP[currentBytePtr >> shift] == 0) {
                      var stringSegment = decodeString(decodeStartPtr);
                      if (str === undefined) {
                          str = stringSegment;
                      } else {
                          str += String.fromCharCode(0);
                          str += stringSegment;
                      }
                      decodeStartPtr = currentBytePtr + charSize;
                  }
              }
  
              if (endCharSwap != 0) {
                  HEAP[(value + 4 + length * charSize) >> shift] = endCharSwap;
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
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
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }

  
  function __emval_lookupTypes(argCount, argTypes) {
      var a = new Array(argCount);
      for (var i = 0; i < argCount; ++i) {
          a[i] = requireRegisteredType(
              HEAP32[(argTypes >> 2) + i],
              "parameter " + i);
      }
      return a;
    }
  
  function requireHandle(handle) {
      if (!handle) {
          throwBindingError('Cannot use deleted val. handle = ' + handle);
      }
      return emval_handle_array[handle].value;
    }function __emval_call(handle, argCount, argTypes, argv) {
      handle = requireHandle(handle);
      var types = __emval_lookupTypes(argCount, argTypes);
  
      var args = new Array(argCount);
      for (var i = 0; i < argCount; ++i) {
          var type = types[i];
          args[i] = type['readValueFromPointer'](argv);
          argv += type['argPackAdvance'];
      }
  
      var rv = handle.apply(undefined, args);
      return __emval_register(rv);
    }


  function __emval_incref(handle) {
      if (handle > 4) {
          emval_handle_array[handle].refcount += 1;
      }
    }

  function __emval_take_value(type, argv) {
      type = requireRegisteredType(type, '_emval_take_value');
      var v = type['readValueFromPointer'](argv);
      return __emval_register(v);
    }

  function _abort() {
      abort();
    }

  function _emscripten_get_sbrk_ptr() {
      return 9936;
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  
  function _emscripten_get_heap_size() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('OOM');
    }function _emscripten_resize_heap(requestedSize) {
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }

  
  
  var PATH={splitPath:function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function(parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function(path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function(path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function(path) {
        return PATH.splitPath(path)[3];
      },join:function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function(l, r) {
        return PATH.normalize(l + '/' + r);
      }};var SYSCALLS={mappings:{},buffers:[null,[],[]],printChar:function(stream, curr) {
        var buffer = SYSCALLS.buffers[stream];
        if (curr === 0 || curr === 10) {
          (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
          buffer.length = 0;
        } else {
          buffer.push(curr);
        }
      },varargs:undefined,get:function() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },get64:function(low, high) {
        return low;
      }};function _fd_close(fd) {
      return 0;
    }

  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  }

  
  function flush_NO_FILESYSTEM() {
      // flush anything remaining in the buffers during shutdown
      if (typeof _fflush !== 'undefined') _fflush(0);
      var buffers = SYSCALLS.buffers;
      if (buffers[1].length) SYSCALLS.printChar(1, 10);
      if (buffers[2].length) SYSCALLS.printChar(2, 10);
    }function _fd_write(fd, iov, iovcnt, pnum) {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAP32[(((iov)+(i*8))>>2)];
        var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
        for (var j = 0; j < len; j++) {
          SYSCALLS.printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAP32[((pnum)>>2)]=num
      return 0;
    }

  function _setTempRet0($i) {
      setTempRet0(($i) | 0);
    }
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_ClassHandle();
init_RegisteredPointer();
init_embind();;
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_emval();;
var ASSERTIONS = false;

/**
 * @license
 * Copyright 2017 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
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

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

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
    var buf;
    try {
      // TODO: Update Node.js externs, Closure does not recognize the following Buffer.from()
      /**@suppress{checkTypes}*/
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
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


var asmGlobalArg = {};
var asmLibraryArg = { "__cxa_allocate_exception": ___cxa_allocate_exception, "__cxa_throw": ___cxa_throw, "_embind_register_bool": __embind_register_bool, "_embind_register_class": __embind_register_class, "_embind_register_class_constructor": __embind_register_class_constructor, "_embind_register_class_function": __embind_register_class_function, "_embind_register_emval": __embind_register_emval, "_embind_register_enum": __embind_register_enum, "_embind_register_enum_value": __embind_register_enum_value, "_embind_register_float": __embind_register_float, "_embind_register_integer": __embind_register_integer, "_embind_register_memory_view": __embind_register_memory_view, "_embind_register_smart_ptr": __embind_register_smart_ptr, "_embind_register_std_string": __embind_register_std_string, "_embind_register_std_wstring": __embind_register_std_wstring, "_embind_register_void": __embind_register_void, "_emval_call": __emval_call, "_emval_decref": __emval_decref, "_emval_incref": __emval_incref, "_emval_take_value": __emval_take_value, "abort": _abort, "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "fd_close": _fd_close, "fd_seek": _fd_seek, "fd_write": _fd_write, "memory": wasmMemory, "setTempRet0": _setTempRet0, "table": wasmTable };
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["__wasm_call_ctors"];
var ___errno_location = Module["___errno_location"] = asm["__errno_location"];
var _setThrew = Module["_setThrew"] = asm["setThrew"];
var _malloc = Module["_malloc"] = asm["malloc"];
var _free = Module["_free"] = asm["free"];
var ___getTypeName = Module["___getTypeName"] = asm["__getTypeName"];
var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = asm["__embind_register_native_and_builtin_types"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var __growWasmMemory = Module["__growWasmMemory"] = asm["__growWasmMemory"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_vif = Module["dynCall_vif"] = asm["dynCall_vif"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_viif = Module["dynCall_viif"] = asm["dynCall_viif"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_jiji = Module["dynCall_jiji"] = asm["dynCall_jiji"];
var dynCall_iidiiii = Module["dynCall_iidiiii"] = asm["dynCall_iidiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];


/**
 * @license
 * Copyright 2010 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */

// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;






































































































































































































































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

var calledMain = false;


dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};





/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();


    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
}
Module['run'] = run;


/** @param {boolean|number=} implicit */
function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}


  noExitRuntime = true;

run();





// {{MODULE_ADDITIONS}}



export default Module;
