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
  'initial': 92,
  'maximum': 92 + 0,
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
    STACK_BASE = 5253152,
    STACKTOP = STACK_BASE,
    STACK_MAX = 10272,
    DYNAMIC_BASE = 5253152,
    DYNAMICTOP_PTR = 10112;




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



var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB9wIzYAABf2ABfwF/YAF/AGACf38Bf2ACf38AYAN/f38Bf2AAAGACf30AYAN/f38AYAR/f39/AGAFf39/f38AYAZ/f39/f38AYAJ/fQF9YAR/f39/AX9gAn99AX9gAX0BfWAFf39/f38Bf2ADf399AGAGf3x/f39/AX9gAX8BfWAEf35+fwBgAn5/AX9gA39+fwF+YAJ/fwF9YAF8AX1gAnx/AXxgB39/f39/f38AYAh/f39/f39/fwBgDH9/f39/f39/f39/fwBgDX9/f39/f39/f39/f38AYAR/f399AGAHf39/f39/fwF/YAd/f399fX9/AX9gB39/fH9/f38Bf2AEf35/fwF/YAN/fX0Bf2AGf319fX19AX9gA35/fwF/YAJ9fwF/YAR/f35/AX5gAXwBfmADf39/AX1gBX9/f39/AX1gA399fwF9YAN/fX0BfWAEf319fQF9YAN9fX8BfWAEfX1/fwF9YAJ+fgF8YAF8AXxgAnx8AXwCowYdA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzAB0DZW52Gl9lbWJpbmRfcmVnaXN0ZXJfc21hcnRfcHRyABwDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IACwNlbnYVX2VtYmluZF9yZWdpc3Rlcl9lbnVtAAkDZW52G19lbWJpbmRfcmVnaXN0ZXJfZW51bV92YWx1ZQAIA2VudhhfX2N4YV9hbGxvY2F0ZV9leGNlcHRpb24AAQNlbnYLX19jeGFfdGhyb3cACANlbnYNX2VtdmFsX2RlY3JlZgACA2VudhFfZW12YWxfdGFrZV92YWx1ZQADA2Vudg1fZW12YWxfaW5jcmVmAAIDZW52C19lbXZhbF9jYWxsAA0DZW52H19lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfZnVuY3Rpb24AGwNlbnYFYWJvcnQABhZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX2Nsb3NlAAEWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF93cml0ZQANA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQABANlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAAoDZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwAEA2Vudhxf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QwAAyEEQIhoLCQBBqMoAEC8aC6cIAQN/IwBB0AFrIgEkABAwEDEhAhAxIQMQMhAzEDQQMRA1QQEQNyACEDcgA0GACBA4QQIQABA6EDJBgAgQOxA1QQMQPUEEED9BBRA4QQYQARAyIAFByAFqEEIgAUHIAWoQQxA1QQdBCBACIAFBADYCzAEgAUEJNgLIASABIAEpA8gBNwPAAUGMCCABQcABahBHIAFBADYCzAEgAUEKNgLIASABIAEpA8gBNwO4AUGUCCABQbgBahBJIAFBADYCzAEgAUELNgLIASABIAEpA8gBNwOwAUGgCCABQbABahBLIAFBADYCzAEgAUEMNgLIASABIAEpA8gBNwOoAUGxCCABQagBahBLIAFBADYCzAEgAUENNgLIASABIAEpA8gBNwOgAUHCCCABQaABahBJIAFBADYCzAEgAUEONgLIASABIAEpA8gBNwOYAUHOCCABQZgBahBLIAFBADYCzAEgAUEPNgLIASABIAEpA8gBNwOQAUHfCCABQZABahBLIAFBADYCzAEgAUEQNgLIASABIAEpA8gBNwOIAUHwCCABQYgBahBRIAFBADYCzAEgAUERNgLIASABIAEpA8gBNwOAAUGBCSABQYABahBLIAFBADYCzAEgAUESNgLIASABIAEpA8gBNwN4QZQJIAFB+ABqEEsgAUEANgLMASABQRM2AsgBIAEgASkDyAE3A3BBpgkgAUHwAGoQSyABQQA2AswBIAFBFDYCyAEgASABKQPIATcDaEG6CSABQegAahBLIAFBADYCzAEgAUEVNgLIASABIAEpA8gBNwNgQc4JIAFB4ABqEFcgAUEANgLMASABQRY2AsgBIAEgASkDyAE3A1hB3AkgAUHYAGoQUSABQQA2AswBIAFBFzYCyAEgASABKQPIATcDUEHmCSABQdAAahBRIAFBADYCzAEgAUEYNgLIASABIAEpA8gBNwNIQfMJIAFByABqEEsgAUEANgLMASABQRk2AsgBIAEgASkDyAE3A0BBiwogAUFAaxBLIAFBADYCzAEgAUEaNgLIASABIAEpA8gBNwM4QaMKIAFBOGoQSyABQQA2AswBIAFBGzYCyAEgASABKQPIATcDMEG6CiABQTBqEFEgAUEANgLMASABQRw2AsgBIAEgASkDyAE3AyhBygogAUEoahBRIAFBADYCzAEg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aiABEIEBGgsLACAAKAK8A0EDRgs8AQF/IwBBEGsiAiQAIAIgASkCADcDCBAyIAAgAhC3AiACELgCED9BKCACQQhqEKUCQQAQCyACQRBqJAALEwAgAEECNgK8AyAAQbQBahCCAQs9AQF/IwBBEGsiAiQAIAIgASkCADcDCBAyIAAgAhC3AiACELsCELwCQSkgAkEIahClAkEAEAsgAkEQaiQACxcAIAEgASACQQJ0aiAAIAEQlwEbKgIACwsAIAAgATgCACAACx0AIAQgASABIAJBAnRqIAAgARCXARsqAgAgAxB7CwsAIAAgATgCBCAACwsAIAAgATgCCCAACwsAIAAgATgCDCAACwsAIAAgATgCECAACwsAIAAgATgCFCAACyYAIAAoArwDRQRAIABBtAFqEJgBIABBxAJqEJgBIABBATYCvAMLCyMAIAAgARCZASAAQagCaiAAIAEQmgEgASoCCCABKgIMEJsBCyQAAkAgACgCvANBAkcNACAAQbQBahCcAUUNACAAQQM2ArwDCwsJACAAIAE2AgALCAAgACABEHILCQAgACABOAIQCwgAIAAgARB0CwkAIAAgATgCFAsIACAAIAEQdgsLACAAQSBqIAEQcgsLACAAQSBqIAEQdAsLACAAQSBqIAEQdgsoAQF9IAAqAgAiAyABIAIqAgAiAZMgACoCBCADk5QgAioCBCABk5WSCzMAIABBCGohACABEB1DAEQsR5QiAYtDAAAAT10EQCAAIAGoELcBDwsgAEGAgICAeBC3AQszACAAQSxqIQAgARAdQwBELEeUIgGLQwAAAE9dBEAgACABqBC3AQ8LIABBgICAgHgQtwELFwAgAEEsaiABELgBIABB0ABqIAEQuQELNAAgAEHQAGohACABEB1DAEQsR5QiAYtDAAAAT10EQCAAIAGoELcBDwsgAEGAgICAeBC3AQs8AQF/IwBBEGsiAyQAIAFBBU8EQEGWDRCxAQALIANBCGogACABELoBIANBCGogAhC7ARogA0EQaiQAIAALPAEBfyMAQRBrIgIkACABQQVPBEBBtw0QsQEACyACQQhqIAAgARC6ASACQQhqQQAQuwEaIAJBEGokACAACyIAIAAoAgRBA0cEQCAAQdAAaiAAKgIAELkBCyAAQQQ2AgQLCgBBqcoAEIQBGgtCAQF/IwBBEGsiASQAIAFB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IAAgAxDQASADQSBqJAAgAAsKACAAEMkBGiAACwsAIAAoAgAQByAACwUAQYQRCwsAIAAgATYCACAACzQBAX8jAEEQayICJAAgAkEIaiABEM4BENEBIQEgABDSASABENMBEAg2AgAgAkEQaiQAIAALDAAgACABENgBGiAACwQAIAALWAEBfyMAQSBrIgMkACADIAE2AhQgAEEAENkBGiAAQdwONgIAIABBDGogA0EIaiADQRRqIAIQzgEQ2gEiAiADQRhqEM4BENsBGiACENwBGiADQSBqJAAgAAsDAAELOwEBfyMAQRBrIgIkACACIAAQzgE2AgwgAkEMaiABEM4BEM4BENQBENUBIAJBDGoQ1gEgAkEQaiQAIAALBQAQ1wELBwAgABDOAQsOACAAKAIAEAkgACgCAAsZACAAKAIAIAE2AgAgACAAKAIAQQhqNgIACwMAAQsFAEHMDgsUACAAIAEoAgAiATYCACABEAkgAAsbACAAIAEQ3QEaIAAgATYCCCAAQaArNgIAIAALHQAgACABEM4BEN4BGiAAQQRqIAIQzgEQ3wEaIAALGgAgACABEM4BEOABGiAAIAIQzgEQ4QEaIAALDQAgAEEEahDiARogAAsTACAAIAE2AgQgAEHoKjYCACAACxEAIAAgARDOASgCADYCACAACw8AIAAgARDOARDuARogAAsPACAAIAEQzgEQ8AEaIAALCgAgARDOARogAAsKACAAEMgBGiAACxsAIABB3A42AgAgAEEMahDkARogABDOARogAAsKACAAENwBGiAACwoAIAAQ4wEQ0AILKQAgAEEMaiIAENMBEOcBIAAQ0wEQ0wEoAgAQ6AEgABDTARDnARDIARoLCgAgAEEEahDOAQs4ACMAQRBrIgEkACABQQhqIAAQ8gEgAUEIahDJARogARDzASAAIAEQ9AEaIAEQyQEaIAFBEGokAAskAQF/QQAhAiABQdgQEOoBBH8gAEEMahDTARDnARDOAQUgAgsLDQAgACgCBCABKAIERgs6AQN/IwBBEGsiASQAIAFBCGogAEEMaiICENMBEOwBIQMgAhDTARogAyAAENMBQQEQ7QEgAUEQaiQACwQAIAALDgAgASACQRRsQQQQ+gELDAAgACABEO8BGiAACxUAIAAgASgCADYCACABQQA2AgAgAAscACAAIAEoAgA2AgAgAEEEaiABQQRqEPEBGiAACwwAIAAgARDuARogAAsLACAAIAFBKxD1AQsKACAAQQEQywEaCxwAIAAoAgAQByAAIAEoAgA2AgAgAUEANgIAIAALQAECfyMAQRBrIgMkACADEPYBIQQgACABKAIAIANBCGoQ9wEgA0EIahD4ASAEENMBIAIRDQAQywEaIANBEGokAAsoAQF/IwBBEGsiASQAIAEgABDOATYCDCABQQxqENYBIAFBEGokACAACwQAQQALBQAQ+QELBQBBhBALCwAgACABIAIQ+wELCQAgACABEPwBCwcAIAAQ/QELBwAgABDQAgsPACAAEP8BBEAgABDMAgsLKAEBf0EAIQEgAEEEahCAAkF/RgR/IAAgACgCACgCCBECAEEBBSABCwsTACAAIAAoAgBBf2oiADYCACAACx8AIAAgASgCADYCACAAIAEoAgQ2AgQgAUIANwIAIAALHwAgABCKAiABSQRAQZgREIsCAAsgAUHoA2xBBBCMAgstAQF/IwBBEGsiAyQAIAMgATYCDCAAIANBDGogAhDOARCNAhogA0EQaiQAIAALCgAgABDTASgCAAs5AQF/IwBBEGsiASQAIABBABDZARogAEHkETYCACAAQQxqIAFBCGoQzgEgARCOAhogAUEQaiQAIAALDQAgAEEMahDTARDOAQsaAQF/IAAQ0wEoAgAhASAAENMBQQA2AgAgAQs8AQF/IwBBEGsiAyQAIAAQxAEiACACNgIEIAAgATYCACADIAE2AgQgAyABNgIAIAAgAxDQASADQRBqJAALCwAgAEEAEI8CIAALBwBBipeZBAsaAQF/QQgQBSIBIAAQkAIaIAFByDFBKhAGAAsHACAAEM8CCx0AIAAgARDOARDeARogAEEEaiACEM4BEJECGiAACxsAIAAgARDOARDhARogAhDOARogABCSAhogAAsnAQF/IAAQ0wEoAgAhAiAAENMBIAE2AgAgAgRAIAAQ5wEgAhCfAgsLFAAgACABENQCGiAAQagxNgIAIAALEQAgACABEM4BKQIANwIAIAALCgAgABCXAhogAAsNACAAEM4BGiAAENACCwsAIABBDGoQ0wEaCzoBA38jAEEQayIBJAAgAUEIaiAAQQxqIgIQ0wEQ7AEhAyACENMBGiADIAAQ0wFBARCWAiABQRBqJAALDwAgASACQegDbEEEEPoB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BEAgACABQT9xQYABcjoAAyAAIAFBEnZB8AFyOgAAIAAgAUEGdkE/cUGAAXI6AAIgACABQQx2QT9xQYABcjoAAUEEDwsQ1gJBGTYCAAtBfwUgAgsPCyAAIAE6AABBAQsFABDbAgsUACAARQRAQQAPCyAAIAFBABDcAgvoAQECfyACQQBHIQMCQAJAAkACQCACRQ0AIABBA3FFDQAgAUH/AXEhBANAIAAtAAAgBEYNAiAAQQFqIQAgAkF/aiICQQBHIQMgAkUNASAAQQNxDQALCyADRQ0BCyAALQAAIAFB/wFxRg0BAkAgAkEETwRAIAFB/wFxQYGChAhsIQQDQCAAKAIAIARzIgNBf3MgA0H//ft3anFBgIGChHhxDQIgAEEEaiEAIAJBfGoiAkEDSw0ACwsgAkUNAQsgAUH/AXEhAwNAIAAtAAAgA0YNAiAAQQFqIQAgAkF/aiICDQALC0EADwsgAAt/AgF/AX4gAL0iA0I0iKdB/w9xIgJB/w9HBHwgAkUEQCABIABEAAAAAAAAAABhBH9BAAUgAEQAAAAAAADwQ6IgARDgAiEAIAEoAgBBQGoLNgIAIAAPCyABIAJBgnhqNgIAIANC/////////4eAf4NCgICAgICAgPA/hL8FIAALC1ABAX4CQCADQcAAcQRAIAEgA0FAaq2GIQJCACEBDAELIANFDQAgAiADrSIEhiABQcAAIANrrYiEIQIgASAEhiEBCyAAIAE3AwAgACACNwMIC1ABAX4CQCADQcAAcQRAIAIgA0FAaq2IIQFCACECDAELIANFDQAgAkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECCyAAIAE3AwAgACACNwMIC9kDAgJ/An4jAEEgayICJAACQCABQv///////////wCDIgRCgICAgICAwP9DfCAEQoCAgICAgMCAvH98VARAIAFCBIYgAEI8iIQhBCAAQv//////////D4MiAEKBgICAgICAgAhaBEAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIBAfSEFIABCgICAgICAgIAIhUIAUg0BIAVCAYMgBXwhBQwBCyAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbRQRAIAFCBIYgAEI8iIRC/////////wODQoCAgICAgID8/wCEIQUMAQtCgICAgICAgPj/ACEF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AFkEQANAIANBf2ohAyAGQgGGIgZCf1UNAAsLIAdBASADa62GDAELIAdC/////////weDQoCAgICAgIAIhAsiB30iBkJ/VSEEIAIgA0oEQANAAkAgBEUNACAGIgVCAFINACAARAAAAAAAAAAAog8LIAVCAYYiBSAHfSIGQn9VIQQgAkF/aiICIANKDQALIAMhAgsCQCAERQ0AIAYiBUIAUg0AIABEAAAAAAAAAACiDwsCQCAFQv////////8HVgRAIAUhBgwBCwNAIAJBf2ohAiAFQoCAgICAgIAEVCEDIAVCAYYiBiEFIAMNAAsLIAJBAU4EfiAGQoCAgICAgIB4fCACrUI0hoQFIAZBASACa62ICyAIQoCAgICAgICAgH+DhL8PCyAARAAAAAAAAAAAoiAAIAUgBlEbC6gBAAJAIAFBgAhOBEAgAEQAAAAAAADgf6IhACABQf8PSARAIAFBgXhqIQEMAgsgAEQAAAAAAADgf6IhACABQf0XIAFB/RdIG0GCcGohAQwBCyABQYF4Sg0AIABEAAAAAAAAEACiIQAgAUGDcEoEQCABQf4HaiEBDAELIABEAAAAAAAAEACiIQAgAUGGaCABQYZoShtB/A9qIQELIAAgAUH/B2qtQjSGv6ILggQBA38gAkGABE8EQCAAIAEgAhAYGiAADwsgACACaiEDAkAgACABc0EDcUUEQAJAIAJBAUgEQCAAIQIMAQsgAEEDcUUEQCAAIQIMAQsgACECA0AgAiABLQAAOgAAIAFBAWohASACQQFqIgIgA08NASACQQNxDQALCwJAIANBfHEiBEHAAEkNACACIARBQGoiBUsNAANAIAIgASgCADYCACACIAEoAgQ2AgQgAiABKAIINgIIIAIgASgCDDYCDCACIAEoAhA2AhAgAiABKAIUNgIUIAIgASgCGDYCGCACIAEoAhw2AhwgAiABKAIgNgIgIAIgASgCJDYCJCACIAEoAig2AiggAiABKAIsNgIsIAIgASgCMDYCMCACIAEoAjQ2AjQgAiABKAI4NgI4IAIgASgCPDYCPCABQUBrIQEgAkFAayICIAVNDQALCyACIARPDQEDQCACIAEoAgA2AgAgAUEEaiEBIAJBBGoiAiAESQ0ACwwBCyADQQRJBEAgACECDAELIANBfGoiBCAASQRAIAAhAgwBCyAAIQIDQCACIAEtAAA6AAAgAiABLQABOgABIAIgAS0AAjoAAiACIAEtAAM6AAMgAUEEaiEBIAJBBGoiAiAETQ0ACwsgAiADSQRAA0AgAiABLQAAOgAAIAFBAWohASACQQFqIgIgA0cNAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAAC1kBAX8gACAALQBKIgFBf2ogAXI6AEogACgCACIBQQhxBEAgACABQSByNgIAQX8PCyAAQgA3AgQgACAAKAIsIgE2AhwgACABNgIUIAAgASAAKAIwajYCEEEAC5ABAQN/IwBBEGsiAyQAIAMgAToADwJAIAAoAhAiAkUEQEF/IQIgABCQBA0BIAAoAhAhAgsCQCAAKAIUIgQgAk8NACABQf8BcSICIAAsAEtGDQAgACAEQQFqNgIUIAQgAToAAAwBC0F/IQIgACADQQ9qQQEgACgCJBEFAEEBRw0AIAMtAA8hAgsgA0EQaiQAIAILwAEBBH8CQCACKAIQIgMEfyADBUEAIQQgAhCQBA0BIAIoAhALIAIoAhQiBWsgAUkEQCACIAAgASACKAIkEQUADwtBACEGAkAgAiwAS0EASA0AIAEhBANAIAQiA0UNASAAIANBf2oiBGotAABBCkcNAAsgAiAAIAMgAigCJBEFACIEIANJDQEgASADayEBIAAgA2ohACACKAIUIQUgAyEGCyAFIAAgARCOBBogAiACKAIUIAFqNgIUIAEgBmohBAsgBAuUAQEDfyAAIQECQAJAIABBA3FFDQAgAC0AAEUEQEEADwsgACEBA0AgAUEBaiIBQQNxRQ0BIAEtAAANAAsMAQsDQCABIgJBBGohASACKAIAIgNBf3MgA0H//ft3anFBgIGChHhxRQ0ACyADQf8BcUUEQCACIABrDwsDQCACLQABIQMgAkEBaiIBIQIgAw0ACwsgASAAawsfAEH0zgAoAgBFBEBB+M4AIAE2AgBB9M4AIAA2AgALCwQAIwALEAAjACAAa0FwcSIAJAAgAAsGACAAJAALBgAgAEAACwkAIAEgABEBAAsJACABIAARAgALBwAgABEAAAsLACABIAIgABEDAAsPACABIAIgAyAEIAARCQALCwAgASACIAARBAALCwAgASACIAARBwALEQAgASACIAMgBCAFIAARCgALDQAgASACIAMgABEIAAsNACABIAIgAyAAEREACw8AIAEgAiADIAQgABENAAsHACAAEQYACw0AIAEgAiADIAARBQALDQAgASACIAMgABEWAAsTACABIAIgAyAEIAUgBiAAERIACxMAIAEgAiADIAQgBSAGIAARCwALIgEBfiAAIAEgAq0gA61CIIaEIAQQpgQiBUIgiKcQGSAFpwsTACAAIAGnIAFCIIinIAIgAxAaCwvZPRcAQYAIC8YKVm9pY2VLZXJuZWwAcHJvY2VzcwBzZXRPc2MxTW9kZQBzZXRPc2MxU2VtaVNoaWZ0AHNldE9zYzFDZW50U2hpZnQAc2V0T3NjMk1vZGUAc2V0T3NjMlNlbWlTaGlmdABzZXRPc2MyQ2VudFNoaWZ0AHNldE9zYzJBbXBsaXR1ZGUAc2V0QW1wbGl0dWRlQXR0YWNrAHNldEFtcGxpdHVkZURlY2F5AHNldEFtcGxpdHVkZVN1c3RhaW4Ac2V0QW1wbGl0dWRlUmVsZWFzZQBzZXRGaWx0ZXJNb2RlAHNldEN1dG9mZgBzZXRSZXNvbmFuY2UAc2V0Q3V0b2ZmRW52ZWxvcGVBbW91bnQAc2V0Q3V0b2ZmRW52ZWxvcGVBdHRhY2sAc2V0Q3V0b2ZmRW52ZWxvcGVEZWNheQBzZXRMZm9GcmVxdWVuY3kAc2V0TGZvTW9kQW1vdW50AHNldExmb01vZGUAc2V0TGZvRGVzdGluYXRpb24AdW5zZXRMZm9EZXN0aW5hdGlvbgBpc1N0b3BwZWQAZW50ZXJSZWxlYXNlU3RhZ2UAV2F2ZUZvcm0AU0lORQBTQVcAU1FVQVJFAFRSSUFOR0xFAEZpbHRlck1vZGUATE9XUEFTUwBMT1dQQVNTX1BMVVMAQkFORFBBU1MASElHSFBBU1MAVm9pY2VTdGF0ZQBESVNQT1NFRABTVEFSVEVEAFNUT1BQSU5HAFNUT1BQRUQATGZvRGVzdGluYXRpb24ARlJFUVVFTkNZAE9TQ0lMTEFUT1JfTUlYAENVVE9GRgBJTlZFUlNFRF9SRVNPTkFOQ0UAUkVTT05BTkNFAGJpdHNldCB0ZXN0IGFyZ3VtZW50IG91dCBvZiByYW5nZQBiaXRzZXQgc2V0IGFyZ3VtZW50IG91dCBvZiByYW5nZQBiaXRzZXQgcmVzZXQgYXJndW1lbnQgb3V0IG9mIHJhbmdlADExVm9pY2VLZXJuZWwAnBsAANoGAABQMTFWb2ljZUtlcm5lbAAAfBwAAPAGAAAAAAAA6AYAAFBLMTFWb2ljZUtlcm5lbAB8HAAAEAcAAAEAAADoBgAAaWkAdgB2aQBOMTBlbXNjcmlwdGVuM3ZhbEUAAJwbAAA4BwAAAAAAAPgHAAAsAAAALQAAAC4AAAAvAAAAMAAAAE5TdDNfXzIyMF9fc2hhcmVkX3B0cl9wb2ludGVySVAxMVZvaWNlS2VybmVsTjEwZW1zY3JpcHRlbjE1c21hcnRfcHRyX3RyYWl0SU5TXzEwc2hhcmVkX3B0cklTMV9FRUUxMXZhbF9kZWxldGVyRU5TXzlhbGxvY2F0b3JJUzFfRUVFRQAAAADEGwAAcAcAANQVAABOMTBlbXNjcmlwdGVuMTVzbWFydF9wdHJfdHJhaXRJTlN0M19fMjEwc2hhcmVkX3B0ckkxMVZvaWNlS2VybmVsRUVFMTF2YWxfZGVsZXRlckUAAACcGwAABAgAAE5TdDNfXzIxMHNoYXJlZF9wdHJJMTFWb2ljZUtlcm5lbEVFAJwbAABgCAAAaQBpaWkAAACECAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQAAAAAAPAkAADEAAAAyAAAAMwAAADQAAAA1AAAATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMTFWb2ljZUtlcm5lbE5TXzlhbGxvY2F0b3JJUzFfRUVFRQAAAADEGwAA+AgAANQVAEHQEgviAaQaAAAABwAAKBsAABAbAAAoGwAAdmlpaWlpAACkGgAAAAcAAIwJAABOMTBPc2NpbGxhdG9yNE1vZGVFAFAbAAB4CQAAdmlpaQAAAACkGgAAAAcAADQbAAB2aWlmAAAAAKQaAAAABwAAKBsAAKQaAAAABwAA2AkAAE42RmlsdGVyNE1vZGVFAABQGwAAyAkAAKQaAAAABwAAAAoAADE0TGZvRGVzdGluYXRpb24AAAAAUBsAAOwJAAC8GgAAAAcAAKQaAAAABwAAdmlpADEwVm9pY2VTdGF0ZQAAAABQGwAAHAoAQcAUC9cVAwAAAAQAAAAEAAAABgAAAIP5ogBETm4A/CkVANFXJwDdNPUAYtvAADyZlQBBkEMAY1H+ALveqwC3YcUAOm4kANJNQgBJBuAACeouAByS0QDrHf4AKbEcAOg+pwD1NYIARLsuAJzphAC0JnAAQX5fANaROQBTgzkAnPQ5AItfhAAo+b0A+B87AN7/lwAPmAUAES/vAApaiwBtH20Az342AAnLJwBGT7cAnmY/AC3qXwC6J3UA5evHAD178QD3OQcAklKKAPtr6gAfsV8ACF2NADADVgB7/EYA8KtrACC8zwA29JoA46kdAF5hkQAIG+YAhZllAKAUXwCNQGgAgNj/ACdzTQAGBjEAylYVAMmocwB74mAAa4zAABnERwDNZ8MACejcAFmDKgCLdsQAphyWAESv3QAZV9EApT4FAAUH/wAzfj8AwjLoAJhP3gC7fTIAJj3DAB5r7wCf+F4ANR86AH/yygDxhx0AfJAhAGokfADVbvoAMC13ABU7QwC1FMYAwxmdAK3EwgAsTUEADABdAIZ9RgDjcS0Am8aaADNiAAC00nwAtKeXADdV1QDXPvYAoxAYAE12/ABknSoAcNerAGN8+AB6sFcAFxXnAMBJVgA71tkAp4Q4ACQjywDWincAWlQjAAAfuQDxChsAGc7fAJ8x/wBmHmoAmVdhAKz7RwB+f9gAImW3ADLoiQDmv2AA78TNAGw2CQBdP9QAFt7XAFg73gDem5IA0iIoACiG6ADiWE0AxsoyAAjjFgDgfcsAF8BQAPMdpwAY4FsALhM0AIMSYgCDSAEA9Y5bAK2wfwAe6fIASEpDABBn0wCq3dgArl9CAGphzgAKKKQA05m0AAam8gBcd38Ao8KDAGE8iACKc3gAr4xaAG/XvQAtpmMA9L/LAI2B7wAmwWcAVcpFAMrZNgAoqNIAwmGNABLJdwAEJhQAEkabAMRZxADIxUQATbKRAAAX8wDUQ60AKUnlAP3VEAAAvvwAHpTMAHDO7gATPvUA7PGAALPnwwDH+CgAkwWUAMFxPgAuCbMAC0XzAIgSnACrIHsALrWfAEeSwgB7Mi8ADFVtAHKnkABr5x8AMcuWAHkWSgBBeeIA9N+JAOiUlwDi5oQAmTGXAIjtawBfXzYAu/0OAEiatABnpGwAcXJCAI1dMgCfFbgAvOUJAI0xJQD3dDkAMAUcAA0MAQBLCGgALO5YAEeqkAB05wIAvdYkAPd9pgBuSHIAnxbvAI6UpgC0kfYA0VNRAM8K8gAgmDMA9Ut+ALJjaADdPl8AQF0DAIWJfwBVUikAN2TAAG3YEAAySDIAW0x1AE5x1ABFVG4ACwnBACr1aQAUZtUAJwedAF0EUAC0O9sA6nbFAIf5FwBJa30AHSe6AJZpKQDGzKwArRRUAJDiagCI2YkALHJQAASkvgB3B5QA8zBwAAD8JwDqcagAZsJJAGTgPQCX3YMAoz+XAEOU/QANhowAMUHeAJI5nQDdcIwAF7fnAAjfOwAVNysAXICgAFqAkwAQEZIAD+jYAGyArwDb/0sAOJAPAFkYdgBipRUAYcu7AMeJuQAQQL0A0vIEAEl1JwDrtvYA2yK7AAoUqgCJJi8AZIN2AAk7MwAOlBoAUTqqAB2jwgCv7a4AXCYSAG3CTQAtepwAwFaXAAM/gwAJ8PYAK0CMAG0xmQA5tAcADCAVANjDWwD1ksQAxq1LAE7KpQCnN80A5qk2AKuSlADdQmgAGWPeAHaM7wBoi1IA/Ns3AK6hqwDfFTEAAK6hAAz72gBkTWYA7QW3ACllMABXVr8AR/86AGr5uQB1vvMAKJPfAKuAMABmjPYABMsVAPoiBgDZ5B0APbOkAFcbjwA2zQkATkLpABO+pAAzI7UA8KoaAE9lqADSwaUACz8PAFt4zQAj+XYAe4sEAIkXcgDGplMAb27iAO/rAACbSlgAxNq3AKpmugB2z88A0QIdALHxLQCMmcEAw613AIZI2gD3XaAAxoD0AKzwLwDd7JoAP1y8ANDebQCQxx8AKtu2AKMlOgAAr5oArVOTALZXBAApLbQAS4B+ANoHpwB2qg4Ae1mhABYSKgDcty0A+uX9AInb/gCJvv0A5HZsAAap/AA+gHAAhW4VAP2H/wAoPgcAYWczACoYhgBNveoAs+evAI9tbgCVZzkAMb9bAITXSAAw3xYAxy1DACVhNQDJcM4AMMu4AL9s/QCkAKIABWzkAFrdoAAhb0cAYhLSALlchABwYUkAa1bgAJlSAQBQVTcAHtW3ADPxxAATbl8AXTDkAIUuqQAdssMAoTI2AAi3pADqsdQAFvchAI9p5AAn/3cADAOAAI1ALQBPzaAAIKWZALOi0wAvXQoAtPlCABHaywB9vtAAm9vBAKsXvQDKooEACGpcAC5VFwAnAFUAfxTwAOEHhgAUC2QAlkGNAIe+3gDa/SoAayW2AHuJNAAF8/4Aub+eAGhqTwBKKqgAT8RaAC34vADXWpgA9MeVAA1NjQAgOqYApFdfABQ/sQCAOJUAzCABAHHdhgDJ3rYAv2D1AE1lEQABB2sAjLCsALLA0ABRVUgAHvsOAJVywwCjBjsAwEA1AAbcewDgRcwATin6ANbKyADo80EAfGTeAJtk2ADZvjEApJfDAHdY1ABp48UA8NoTALo6PABGGEYAVXVfANK99QBuksYArC5dAA5E7QAcPkIAYcSHACn96QDn1vMAInzKAG+RNQAI4MUA/9eNAG5q4gCw/cYAkwjBAHxddABrrbIAzW6dAD5yewDGEWoA98+pAClz3wC1yboAtwBRAOKyDQB0uiQA5X1gAHTYigANFSwAgRgMAH5mlAABKRYAn3p2AP39vgBWRe8A2X42AOzZEwCLurkAxJf8ADGoJwDxbsMAlMU2ANioVgC0qLUAz8wOABKJLQBvVzQALFaJAJnO4wDWILkAa16qAD4qnAARX8wA/QtKAOH0+wCOO20A4oYsAOnUhAD8tKkA7+7RAC41yQAvOWEAOCFEABvZyACB/AoA+0pqAC8c2ABTtIQATpmMAFQizAAqVdwAwMbWAAsZlgAacLgAaZVkACZaYAA/Uu4AfxEPAPS1EQD8y/UANLwtADS87gDoXcwA3V5gAGeOmwCSM+8AyRe4AGFYmwDhV7wAUYPGANg+EADdcUgALRzdAK8YoQAhLEYAWfPXANl6mACeVMAAT4b6AFYG/ADlea4AiSI2ADitIgBnk9wAVeiqAIImOADK55sAUQ2kAJkzsQCp1w4AaQVIAGWy8AB/iKcAiEyXAPnRNgAhkrMAe4JKAJjPIQBAn9wA3EdVAOF0OgBn60IA/p3fAF7UXwB7Z6QAuqx6AFX2ogAriCMAQbpVAFluCAAhKoYAOUeDAInj5gDlntQASftAAP9W6QAcD8oAxVmKAJT6KwDTwcUAD8XPANtargBHxYYAhUNiACGGOwAseZQAEGGHACpMewCALBoAQ78SAIgmkAB4PIkAqMTkAOXbewDEOsIAJvTqAPdnigANkr8AZaMrAD2TsQC9fAsApFHcACfdYwBp4d0AmpQZAKgplQBozigACe20AESfIABOmMoAcIJjAH58IwAPuTIAp/WOABRW5wAh8QgAtZ0qAG9+TQClGVEAtfmrAILf1gCW3WEAFjYCAMQ6nwCDoqEAcu1tADmNegCCuKkAazJcAEYnWwAANO0A0gB3APz0VQABWU0A4HGAAEGjKgvdAUD7Ifk/AAAAAC1EdD4AAACAmEb4PAAAAGBRzHg7AAAAgIMb8DkAAABAICV6OAAAAIAiguM2AAAAAB3zaTUAAAAAkBUAADEAAAA2AAAANwAAAE5TdDNfXzIxNF9fc2hhcmVkX2NvdW50RQAAAACcGwAAdBUAAAAAAADUFQAAMQAAADgAAAA3AAAANAAAADcAAABOU3QzX18yMTlfX3NoYXJlZF93ZWFrX2NvdW50RQAAACAcAAC0FQAAAAAAAAEAAACQFQAAAAAAAFAjAAAtKyAgIDBYMHgAKG51bGwpAEGQLAtBEQAKABEREQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAARAA8KERERAwoHAAETCQsLAAAJBgsAAAsABhEAAAAREREAQeEsCyELAAAAAAAAAAARAAoKERERAAoAAAIACQsAAAAJAAsAAAsAQZstCwEMAEGnLQsVDAAAAAAMAAAAAAkMAAAAAAAMAAAMAEHVLQsBDgBB4S0LFQ0AAAAEDQAAAAAJDgAAAAAADgAADgBBjy4LARAAQZsuCx4PAAAAAA8AAAAACRAAAAAAABAAABAAABIAAAASEhIAQdIuCw4SAAAAEhISAAAAAAAACQBBgy8LAQsAQY8vCxUKAAAAAAoAAAAACQsAAAAAAAsAAAsAQb0vCwEMAEHJLwuBFwwAAAAADAAAAAAJDAAAAAAADAAADAAAMDEyMzQ1Njc4OUFCQ0RFRi0wWCswWCAwWC0weCsweCAweABpbmYASU5GAG5hbgBOQU4ALgBQdXJlIHZpcnR1YWwgZnVuY3Rpb24gY2FsbGVkIQBzdGQ6OmV4Y2VwdGlvbgAAAAAAAABoGAAAPgAAAD8AAABAAAAAU3Q5ZXhjZXB0aW9uAAAAAJwbAABYGAAAAAAAAJQYAAAqAAAAQQAAAEIAAABTdDExbG9naWNfZXJyb3IAxBsAAIQYAABoGAAAAAAAAMgYAAAqAAAAQwAAAEIAAABTdDEybGVuZ3RoX2Vycm9yAAAAAMQbAAC0GAAAlBgAAAAAAAD8GAAAKgAAAEQAAABCAAAAU3QxMm91dF9vZl9yYW5nZQAAAADEGwAA6BgAAJQYAABTdDl0eXBlX2luZm8AAAAAnBsAAAgZAABOMTBfX2N4eGFiaXYxMTZfX3NoaW1fdHlwZV9pbmZvRQAAAADEGwAAIBkAABgZAABOMTBfX2N4eGFiaXYxMTdfX2NsYXNzX3R5cGVfaW5mb0UAAADEGwAAUBkAAEQZAABOMTBfX2N4eGFiaXYxMTdfX3BiYXNlX3R5cGVfaW5mb0UAAADEGwAAgBkAAEQZAABOMTBfX2N4eGFiaXYxMTlfX3BvaW50ZXJfdHlwZV9pbmZvRQDEGwAAsBkAAKQZAABOMTBfX2N4eGFiaXYxMjBfX2Z1bmN0aW9uX3R5cGVfaW5mb0UAAAAAxBsAAOAZAABEGQAATjEwX19jeHhhYml2MTI5X19wb2ludGVyX3RvX21lbWJlcl90eXBlX2luZm9FAAAAxBsAABQaAACkGQAAAAAAAJQaAABFAAAARgAAAEcAAABIAAAASQAAAE4xMF9fY3h4YWJpdjEyM19fZnVuZGFtZW50YWxfdHlwZV9pbmZvRQDEGwAAbBoAAEQZAAB2AAAAWBoAAKAaAABEbgAAWBoAAKwaAABiAAAAWBoAALgaAABjAAAAWBoAAMQaAABoAAAAWBoAANAaAABhAAAAWBoAANwaAABzAAAAWBoAAOgaAAB0AAAAWBoAAPQaAABpAAAAWBoAAAAbAABqAAAAWBoAAAwbAABsAAAAWBoAABgbAABtAAAAWBoAACQbAABmAAAAWBoAADAbAABkAAAAWBoAADwbAAAAAAAAiBsAAEUAAABKAAAARwAAAEgAAABLAAAATjEwX19jeHhhYml2MTE2X19lbnVtX3R5cGVfaW5mb0UAAAAAxBsAAGQbAABEGQAAAAAAAHQZAABFAAAATAAAAEcAAABIAAAATQAAAE4AAABPAAAAUAAAAAAAAAAMHAAARQAAAFEAAABHAAAASAAAAE0AAABSAAAAUwAAAFQAAABOMTBfX2N4eGFiaXYxMjBfX3NpX2NsYXNzX3R5cGVfaW5mb0UAAAAAxBsAAOQbAAB0GQAAAAAAAGgcAABFAAAAVQAAAEcAAABIAAAATQAAAFYAAABXAAAAWAAAAE4xMF9fY3h4YWJpdjEyMV9fdm1pX2NsYXNzX3R5cGVfaW5mb0UAAADEGwAAQBwAAHQZAAAAAAAA1BkAAEUAAABZAAAARwAAAEgAAABaAAAAdm9pZABib29sAGNoYXIAc2lnbmVkIGNoYXIAdW5zaWduZWQgY2hhcgBzaG9ydAB1bnNpZ25lZCBzaG9ydABpbnQAdW5zaWduZWQgaW50AGxvbmcAdW5zaWduZWQgbG9uZwBmbG9hdABkb3VibGUAc3RkOjpzdHJpbmcAc3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4Ac3RkOjp3c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGVtc2NyaXB0ZW46OnZhbABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAE5TdDNfXzIyMV9fYmFzaWNfc3RyaW5nX2NvbW1vbklMYjFFRUUAAJwbAADlHwAAIBwAAKYfAAAAAAAAAQAAAAwgAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAACAcAAAsIAAAAAAAAAEAAAAMIAAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAAAgHAAAhCAAAAAAAAABAAAADCAAAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQAAACAcAADcIAAAAAAAAAEAAAAMIAAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90cmFpdHNJRGlFRU5TXzlhbGxvY2F0b3JJRGlFRUVFAAAAIBwAADghAAAAAAAAAQAAAAwgAAAAAAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAACcGwAAlCEAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWFFRQAAnBsAALwhAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUAAJwbAADkIQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAACcGwAADCIAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXRFRQAAnBsAADQiAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUAAJwbAABcIgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJakVFAACcGwAAhCIAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWxFRQAAnBsAAKwiAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ltRUUAAJwbAADUIgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZkVFAACcGwAA/CIAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWRFRQAAnBsAACQjAEHQxgALAQUAQdzGAAsBOQBB9MYACwo6AAAAOwAAADwlAEGMxwALAQIAQZvHAAsF//////8AQZDJAAsCZCU=';
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




// STATICTOP = STATIC_BASE + 9248;
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
      return 10112;
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
