// Copyright 2010 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

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
var ENVIRONMENT_HAS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// A web environment like Electron.js can have Node enabled, so we must
// distinguish between Node-enabled environments and Node environments per se.
// This will allow the former to do things like mount NODEFS.
// Extended check using process.versions fixes issue #8816.
// (Also makes redundant the original check that 'require' is a function.)
ENVIRONMENT_HAS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
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
  scriptDirectory = __dirname + '/';


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
    if (typeof console === 'undefined') console = {};
    console.log = print;
    console.warn = console.error = typeof printErr !== 'undefined' ? printErr : print;
  }
} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_HAS_NODE.
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
        return new Uint8Array(xhr.response);
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

// TODO remove when SDL2 is fixed (also see above)



// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;


function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  if (end > _emscripten_get_heap_size()) {
    abort();
  }
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
        var bits = parseInt(type.substr(1));
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

var asm2wasmImports = { // special asm2wasm imports
    "f64-rem": function(x, y) {
        return x % y;
    },
    "debugger": function() {
    }
};




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

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;
  var ret = table.length;

  // Grow the table
  try {
    table.grow(1);
  } catch (err) {
    if (!err instanceof RangeError) {
      throw err;
    }
    throw 'Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.';
  }

  // Insert new element
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!err instanceof TypeError) {
      throw err;
    }
    assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction');
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  return ret;
}

function removeFunctionWasm(index) {
  // TODO(sbc): Look into implementing this to allow re-using of table slots
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


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

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


var Runtime = {
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;




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


// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @type {function(number, number, string, boolean=)} */
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

/** @type {function(number, string, boolean=)} */
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
  'initial': 389,
  'maximum': 389 + 0,
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




/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  abort("this function has been removed - you should use UTF8ToString(ptr, maxBytesToRead) instead!");
}

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


// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = u8Array[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
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
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
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
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
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
    if (utf32 == 0)
      return str;
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
/** @deprecated */
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
    STACK_BASE = 5270064,
    STACKTOP = STACK_BASE,
    STACK_MAX = 27184,
    DYNAMIC_BASE = 5270064,
    DYNAMICTOP_PTR = 27024;




var TOTAL_STACK = 5242880;

var INITIAL_TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864;







// In standalone mode, the wasm creates the memory, and the user can't provide it.
// In non-standalone/normal mode, we create the memory here.

// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)

  if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
  } else
  {
    wasmMemory = new WebAssembly.Memory({
      'initial': INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
      ,
      'maximum': INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
    });
  }


if (wasmMemory) {
  buffer = wasmMemory.buffer;
}

// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['TOTAL_MEMORY'].
INITIAL_TOTAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;










function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
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
  if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  FS.ignorePermissions = false;
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

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
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







// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB2gRKYAF/AX9gAn9/AX9gAn9/AGABfwBgAAF/YAN/f38Bf2AGf39/f39/AX9gAABgA39/fwBgBn9/f39/fwBgBH9/f38Bf2AFf39/f38Bf2AEf39/fwBgCH9/f39/f39/AX9gBX9/f39/AGAHf39/f39/fwF/YAd/f39/f39/AGAFf35+fn4AYAABfmAFf39/f34Bf2AFf39/f3wBf2ACf30BfWAKf39/f39/f39/fwBgB39/f39/fn4Bf2AEf39/fwF+YAN/fn8BfmAIf39/f39/f38AYAR/fn5/AGAKf39/f39/f39/fwF/YAZ/f39/fn4Bf2AGf3x/f39/AX9gD39/f39/f39/f39/f39/fwBgBX9/fn9/AGAJf39/f39/f39/AX9gC39/f39/f39/f39/AX9gDH9/f39/f39/f39/fwF/YAJ+fwF/YAR+fn5+AX9gA39/fwF+YAR/f39+AX5gAn9/AX1gA39/fwF9YAR/fX1/AX1gAX0BfWABfAF9YAJ/fwF8YAN/f38BfGABfAF8YAJ8fwF8YAx/f39/f39/f39/f38AYA1/f39/f39/f39/f39/AGAGf39/fn9/AGADf39+AGACf34AYAJ/fQBgAn98AGAIf39/f39/fn4Bf2AGf39/f39+AX9gBn9/f39/fAF/YAd/f3x/f39/AX9gAn9+AX9gBH9+f38Bf2ACf30Bf2ADfn9/AX9gAn5+AX9gAn1/AX9gAn9/AX5gBH9/fn8BfmABfAF+YAV/f399fwF9YAN/fX0BfWACfn4BfWACfn4BfGACfHwBfAKvByUDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MAMgNlbnYaX2VtYmluZF9yZWdpc3Rlcl9zbWFydF9wdHIAMQNlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgAJA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2VudW0ADANlbnYbX2VtYmluZF9yZWdpc3Rlcl9lbnVtX3ZhbHVlAAgDZW52DV9lbXZhbF9kZWNyZWYAAwNlbnYRX2VtdmFsX3Rha2VfdmFsdWUAAQNlbnYNX2VtdmFsX2luY3JlZgADA2VudgtfZW12YWxfY2FsbAAKA2VudhhfX2N4YV9hbGxvY2F0ZV9leGNlcHRpb24AAANlbnYLX19jeGFfdGhyb3cACANlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19mdW5jdGlvbgAaDXdhc2lfdW5zdGFibGUIZmRfY2xvc2UAAA13YXNpX3Vuc3RhYmxlB2ZkX3JlYWQACg13YXNpX3Vuc3RhYmxlCGZkX3dyaXRlAAoDZW52Bl9fbG9jawADA2VudghfX3VubG9jawADDXdhc2lfdW5zdGFibGURZW52aXJvbl9zaXplc19nZXQAAQ13YXNpX3Vuc3RhYmxlC2Vudmlyb25fZ2V0AAEDZW52Cl9fbWFwX2ZpbGUAAQNlbnYLX19zeXNjYWxsOTEAAQNlbnYKc3RyZnRpbWVfbAALA2VudgVhYm9ydAAHA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQAAgNlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAA4DZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwACA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAgDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwAAgNlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAA4DZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQACANlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAIA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52FWVtc2NyaXB0ZW5fbWVtY3B5X2JpZwAFA2VudgtzZXRUZW1wUmV0MAADDXdhc2lfdW5zdGFibGUHZmRfc2VlawALA2VudgZtZW1vcnkCAYAIgAgDZW52BXRhYmxlAXAAhQMDngucCwQHBwAHBAQEBAQABAQDBAQABAQEAQMAAAADDAICAgACAwIDAwABFRUDAwMHAAEFBAcAAQUERQEVFRUDKgEqAAErRgAABAQEAAAEAAACAQoAAAQBAQEABQIBBAAAAgMEAQEFBQACAgMBAQEBAQEAAAADAwABAQMBCAEBAQEICAIDCAAAAAQDAAABAwUFBQAAAAAAAAMBBQECAQEAAwMDCAACCAAABA4ABAAABAgEAAABBAAEAgQEBAcsLC8LQSsFBAQAAAACAwADAAUgPAwFAQUCAAEABAAAAQUAAwAFBQIABQAAAwMAAAAAAgEA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ByAAKAIACxkAIAAoAgAgATYCACAAIAAoAgBBCGo2AgALAwABCwUAQYgKCxQAIAAgASgCACIBNgIAIAEQByAACxwAIAAgARCLARogACABNgIIIABBnIsBNgIAIAALGwAgACABEHgQjAEaIABBBGogAhB4EI0BGiAACxgAIAAgARB4EI4BGiAAIAIQeBCPARogAAsNACAAQQRqEJABGiAACzYAIwBBEGsiASQAIAFBCGogABCIASABQQhqEHMaIAEQiQEgACABEIoBGiABEHMaIAFBEGokAAsLACAAIAFBExCjAQsJACAAQQEQdRoLHAAgACgCABAFIAAgASgCADYCACABQQA2AgAgAAsUACAAIAE2AgQgAEHkigE2AgAgAAsQACAAIAEQeCgCADYCACAACw4AIAAgARB4EJsBGiAACw4AIAAgARB4EJ0BGiAACwkAIAEQeBogAAsJACAAEHIaIAALGgAgAEGYCjYCACAAQQxqEJIBGiAAEHgaIAALCgAgABCGARogAAsKACAAEJEBEOIJCyQAIABBDGoiABB9EJUBIAAQfRB9KAIAEIcBIAAQfRCVARByGgsJACAAQQRqEHgLIgEBf0EAIQIgAUGcDBCXAQR/IABBDGoQfRCVARB4BSACCwsNACAAKAIEIAEoAgRGCzcBA38jAEEQayIBJAAgAUEIaiAAQQxqIgIQfRCZASEDIAIQfRogAyAAEH1BARCaASABQRBqJAALBAAgAAsOACABIAJBFGxBBBCfAQsMACAAIAEQnAEaIAALFQAgACABKAIANgIAIAFBADYCACAACxwAIAAgASgCADYCACAAQQRqIAFBBGoQngEaIAALDAAgACABEJsBGiAACwsAIAAgASACEKABCwkAIAAgARChAQsHACAAEKIBCwcAIAAQ4gkLPgECfyMAQRBrIgMkACADEKQBIQQgACABKAIAIANBCGoQpQEgA0EIahCmASAEEH0gAhEKABB1GiADQRBqJAALJwEBfyMAQRBrIgEkACABIAAQeDYCDCABQQxqEIABIAFBEGokACAACwQAQQALBQAQpwELBQBBpAwLDwAgABCpAQRAIAAQ2AkLCygBAX9BACEBIABBBGoQqgFBf0YEfyAAIAAoAgAoAggRAwBBAQUgAQsLEwAgACAAKAIAQX9qIgA2AgAgAAsfACAAIAEoAgA2AgAgACABKAIENgIEIAFCADcCACAAC4oBAQR/IwBBMGsiASQAIAFBGGogAUEoahB4IgJBAUEAEK0BIAFBEGogAkEBEK4BEK8BIgMQsAEhBCABQQhqIAIQmQEaIAQQsQEaIAAQbiICIAMQsAEQsgE2AgAgAiADELMBNgIEIAEgAigCACIANgIEIAEgADYCACACIAEQeiADELQBGiABQTBqJAALHgAgABC1ASABSQRAQeQMELYBAAsgAUE8bEEEELcBCxIAIAAgAjYCBCAAIAE2AgAgAAssAQF/IwBBEGsiAyQAIAMgATYCDCAAIANBDGogAhB4ELgBGiADQRBqJAAgAAsJACAAEH0oAgALNgEBfyMAQRBrIgEkACAAQQAQgwEaIABBsA02AgAgAEEMaiABQQhqEHgQuQEaIAFBEGokACAACwsAIABBDGoQfRB4CxgBAX8gABB9KAIAIQEgABB9QQA2AgAgAQsLACAAQQAQugEgAAsHAEHEiJEiCxsBAX9BCBAJIgEgABC7ARogAUGwjQFBFBAKAAsHACAAEOEJCxsAIAAgARB4EIwBGiAAQQRqIAIQeBC8ARogAAsUACAAIAEQeBCPARogABC9ARogAAslAQF/IAAQfSgCACECIAAQfSABNgIAIAIEQCAAEJUBIAIQwwELCxUAIAAgARDmCRogAEGQjQE2AgAgAAsQACAAIAEQeCkCADcCACAACzQAIABCADcCACAAQgA3AiggAEIANwIgIABCADcCGCAAQgA3AhAgAEIANwIIIAAQwgEaIAALDAAgABB4GiAAEOIJCwoAIABBDGoQfRoLNwEDfyMAQRBrIgEkACABQQhqIABBDGoiAhB9EJkBIQMgAhB9GiADIAAQfUEBEMEBIAFBEGokAAsOACABIAJBPGxBBBCfAQtBACAAQgA3AiAgAEKAgID405mz5j03AhggAELkgICAwAw3AhAgAEKAgID4wwI3AgggAEIANwIAIABBKGoQbhogAAsRACAAKAIAIAEgACgCBBDEAQsLACAAIAEgAhDBAQsEAEEFCwUAEMoBCwUAQbQOC0QBAX8gARB4IAAoAgQiBUEBdWohASAAKAIAIQAgBUEBcQRAIAEoAgAgAGooAgAhAAsgASACEHggAxB4IAQQeCAAEQwACxUBAX9BCBDhCSIBIAApAgA3AwAgAQsFAEGgDgsEAEED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A0HAAHEEQCABIANBQGqthiECQgAhAQwBCyADRQ0AIAIgA60iBIYgAUHAACADa62IhCECIAEgBIYhAQsgACABNwMAIAAgAjcDCAvXAQIEfwJ+IwBBEGsiAyQAIAG8IgRBgICAgHhxIQUCfiAEQf////8HcSICQYCAgHxqQf////cHTQRAQgAhBiACrUIZhkKAgICAgICAwD98DAELIAJBgICA/AdPBEBCACEGIAStQhmGQoCAgICAgMD//wCEDAELIAJFBEBCACEGQgAMAQsgAyACrUIAIAJnIgJB0QBqEKgDIAMpAwAhBiADKQMIQoCAgICAgMAAhUGJ/wAgAmutQjCGhAshByAAIAY3AwAgACAHIAWtQiCGhDcDCCADQRBqJAALYAEBfgJAAn4gA0HAAHEEQCACIANBQGqtiCEBQgAhAkIADAELIANFDQEgAkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECQgALIQQgASAEhCEBCyAAIAE3AwAgACACNwMIC6ILAgV/D34jAEHgAGsiBSQAIARCL4YgA0IRiIQhDiACQiCGIAFCIIiEIQsgBEL///////8/gyIMQg+GIANCMYiEIRAgAiAEhUKAgICAgICAgIB/gyEKIAxCEYghESACQv///////z+DIg1CIIghEiAEQjCIp0H//wFxIQYCQAJ/IAJCMIinQf//AXEiCEF/akH9/wFNBEBBACAGQX9qQf7/AUkNARoLIAFQIAJC////////////AIMiD0KAgICAgIDA//8AVCAPQoCAgICAgMD//wBRG0UEQCACQoCAgICAgCCEIQoMAgsgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbRQRAIARCgICAgICAIIQhCiADIQEMAgsgASAPQoCAgICAgMD//wCFhFAEQCACIAOEUARAQoCAgICAgOD//wAhCkIAIQEMAwsgCkKAgICAgIDA//8AhCEKQgAhAQwCCyADIAJCgICAgICAwP//AIWEUARAIAEgD4QhAkIAIQEgAlAEQEKAgICAgIDg//8AIQoMAwsgCkKAgICAgIDA//8AhCEKDAILIAEgD4RQBEBCACEBDAILIAIgA4RQBEBCACEBDAILQQAhByAPQv///////z9YBEAgBUHQAGogASANIAEgDSANUCIHG3kgB0EGdK18pyIHQXFqEKgDIAUpA1giDUIghiAFKQNQIgFCIIiEIQsgDUIgiCESQRAgB2shBwsgByACQv///////z9WDQAaIAVBQGsgAyAMIAMgDCAMUCIJG3kgCUEGdK18pyIJQXFqEKgDIAUpA0giAkIPhiAFKQNAIgNCMYiEIRAgAkIvhiADQhGIhCEOIAJCEYghESAHIAlrQRBqCyEHIA5C/////w+DIgIgAUL/////D4MiBH4iEyADQg+GQoCA/v8PgyIBIAtC/////w+DIgN+fCIOQiCGIgwgASAEfnwiCyAMVK0gAiADfiIVIAEgDUL/////D4MiDH58Ig8gEEL/////D4MiDSAEfnwiECAOIBNUrUIghiAOQiCIhHwiEyACIAx+IhYgASASQoCABIQiDn58IhIgAyANfnwiFCARQv////8Hg0KAgICACIQiASAEfnwiEUIghnwiF3whBCAGIAhqIAdqQYGAf2ohBgJAIAwgDX4iGCACIA5+fCICIBhUrSACIAEgA358IgMgAlStfCADIA8gFVStIBAgD1StfHwiAiADVK18IAEgDn58IAEgDH4iAyANIA5+fCIBIANUrUIghiABQiCIhHwgAiABQiCGfCIBIAJUrXwgASARIBRUrSASIBZUrSAUIBJUrXx8QiCGIBFCIIiEfCIDIAFUrXwgAyATIBBUrSAXIBNUrXx8IgIgA1StfCIBQoCAgICAgMAAg1BFBEAgBkEBaiEGDAELIAtCP4ghAyABQgGGIAJCP4iEIQEgAkIBhiAEQj+IhCECIAtCAYYhCyADIARCAYaEIQQLIAZB//8BTgRAIApCgICAgICAwP//AIQhCkIAIQEMAQsCfiAGQQBMBEBBASAGayIIQf8ATQRAIAVBEGogCyAEIAgQqgMgBUEgaiACIAEgBkH/AGoiBhCoAyAFQTBqIAsgBCAGEKgDIAUgAiABIAgQqgMgBSkDMCAFKQM4hEIAUq0gBSkDICAFKQMQhIQhCyAFKQMoIAUpAxiEIQQgBSkDACECIAUpAwgMAgtCACEBDAILIAFC////////P4MgBq1CMIaECyAKhCEKIAtQIARCf1UgBEKAgICAgICAgIB/URtFBEAgCiACQgF8IgEgAlStfCEKDAELIAsgBEKAgICAgICAgIB/hYRQRQRAIAIhAQwBCyAKIAIgAkIBg3wiASACVK18IQoLIAAgATcDACAAIAo3AwggBUHgAGokAAuDAQICfwF+IwBBEGsiAyQAIAACfiABRQRAQgAhBEIADAELIAMgASABQR91IgJqIAJzIgKtQgAgAmciAkHRAGoQqAMgAykDCEKAgICAgIDAAIVBnoABIAJrrUIwhnwgAUGAgICAeHGtQiCGhCEEIAMpAwALNwMAIAAgBDcDCCADQRBqJAALyAkCBH8EfiMAQfAAayIFJAAgBEL///////////8AgyEKAkACQCABQn98IglCf1EgAkL///////////8AgyILIAkgAVStfEJ/fCIJQv///////7///wBWIAlC////////v///AFEbRQRAIANCf3wiCUJ/UiAKIAkgA1StfEJ/fCIJQv///////7///wBUIAlC////////v///AFEbDQELIAFQIAtCgICAgICAwP//AFQgC0KAgICAgIDA//8AURtFBEAgAkKAgICAgIAghCEEIAEhAwwCCyADUCAKQoCAgICAgMD//wBUIApCgICAgICAwP//AFEbRQRAIARCgICAgICAIIQhBAwCCyABIAtCgICAgICAwP//AIWEUARAQoCAgICAgOD//wAgAiABIAOFIAIgBIVCgICAgICAgICAf4WEUCIGGyEEQgAgASAGGyEDDAILIAMgCkKAgICAgIDA//8AhYRQDQEgASALhFAEQCADIAqEQgBSDQIgASADgyEDIAIgBIMhBAwCCyADIAqEUEUNACABIQMgAiEEDAELIAMgASADIAFWIAogC1YgCiALURsiBxshCiAEIAIgBxsiC0L///////8/gyEJIAIgBCAHGyICQjCIp0H//wFxIQggC0IwiKdB//8BcSIGRQRAIAVB4ABqIAogCSAKIAkgCVAiBht5IAZBBnStfKciBkFxahCoAyAFKQNoIQkgBSkDYCEKQRAgBmshBgsgASADIAcbIQMgAkL///////8/gyEBIAgEfiABBSAFQdAAaiADIAEgAyABIAFQIgcbeSAHQQZ0rXynIgdBcWoQqANBECAHayEIIAUpA1AhAyAFKQNYC0IDhiADQj2IhEKAgICAgICABIQhBCAJQgOGIApCPYiEIQEgAiALhSEJAn4gA0IDhiIDIAYgCGsiB0UNABogB0H/AEsEQEIAIQRCAQwBCyAFQUBrIAMgBEGAASAHaxCoAyAFQTBqIAMgBCAHEKoDIAUpAzghBCAFKQMwIAUpA0AgBSkDSIRCAFKthAshAyABQoCAgICAgIAEhCEMIApCA4YhAgJAIAlCf1cEQCACIAN9IgEgDCAEfSACIANUrX0iA4RQBEBCACEDQgAhBAwDCyADQv////////8DVg0BIAVBIGogASADIAEgAyADUCIHG3kgB0EGdK18p0F0aiIHEKgDIAYgB2shBiAFKQMoIQMgBSkDICEBDAELIAIgA3wiASADVK0gBCAMfHwiA0KAgICAgICACINQDQAgAUIBgyADQj+GIAFCAYiEhCEBIAZBAWohBiADQgGIIQMLIAtCgICAgICAgICAf4MhBCAGQf//AU4EQCAEQoCAgICAgMD//wCEIQRCACEDDAELQQAhBwJAIAZBAEoEQCAGIQcMAQsgBUEQaiABIAMgBkH/AGoQqAMgBSABIANBASAGaxCqAyAFKQMAIAUpAxAgBSkDGIRCAFKthCEBIAUpAwghAwsgA0IDiEL///////8/gyAEhCAHrUIwhoQgA0I9hiABQgOIhCIEIAGnQQdxIgZBBEutfCIDIARUrXwgA0IBg0IAIAZBBEYbIgEgA3wiAyABVK18IQQLIAAgAzcDACAAIAQ3AwggBUHwAGokAAuFAgICfwR+IwBBEGsiAiQAIAG9IgVCgICAgICAgICAf4MhBwJ+IAVC////////////AIMiBEKAgICAgICAeHxC/////////+//AFgEQCAEQjyGIQYgBEIEiEKAgICAgICAgDx8DAELIARCgICAgICAgPj/AFoEQCAFQjyGIQYgBUIEiEKAgICAgIDA//8AhAwBCyAEUARAQgAhBkIADAELIAIgBEIAIARCgICAgBBaBH8gBEIgiKdnBSAFp2dBIGoLIgNBMWoQqAMgAikDACEGIAIpAwhCgICAgICAwACFQYz4ACADa61CMIaECyEEIAAgBjcDACAAIAQgB4Q3AwggAkEQaiQAC9sBAgF/An5BASEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AIAAgAoQgBSAGhIRQBEBBAA8LIAEgA4NCAFkEQEF/IQQgACACVCABIANTIAEgA1EbDQEgACAChSABIAOFhEIAUg8LQX8hBCAAIAJWIAEgA1UgASADURsNACAAIAKFIAEgA4WEQgBSIQQLIAQL0wECAX8CfkF/IQQCQCAAQgBSIAFC////////////AIMiBUKAgICAgIDA//8AViAFQoCAgICAgMD//wBRGw0AIAJCAFIgA0L///////////8AgyIGQoCAgICAgMD//wBWIAZCgICAgICAwP//AFEbDQAgACAChCAFIAaEhFAEQEEADwsgASADg0IAWQRAIAAgAlQgASADUyABIANRGw0BIAAgAoUgASADhYRCAFIPCyAAIAJWIAEgA1UgASADURsNACAAIAKFIAEgA4WEQgBSIQQLIAQLNQAgACABNwMAIAAgAkL///////8/gyAEQjCIp0GAgAJxIAJCMIinQf//AXFyrUIwhoQ3AwgLaAIBfwF+IwBBEGsiAiQAIAACfiABRQRAQgAhA0IADAELIAIgAa1CACABZyIBQdEAahCoAyACKQMIQoCAgICAgMAAhUGegAEgAWutQjCGfCEDIAIpAwALNwMAIAAgAzcDCCACQRBqJAALRQEBfyMAQRBrIgUkACAFIAEgAiADIARCgICAgICAgICAf4UQrQMgBSkDACEBIAAgBSkDCDcDCCAAIAE3AwAgBUEQaiQAC8QCAQF/IwBB0ABrIgQkAAJAIANBgIABTgRAIARBIGogASACQgBCgICAgICAgP//ABCrAyAEKQMoIQIgBCkDICEBIANB//8BSARAIANBgYB/aiEDDAILIARBEGogASACQgBCgICAgICAgP//ABCrAyADQf3/AiADQf3/AkgbQYKAfmohAyAEKQMYIQIgBCkDECEBDAELIANBgYB/Sg0AIARBQGsgASACQgBCgICAgICAwAAQqwMgBCkDSCECIAQpA0AhASADQYOAfkoEQCADQf7/AGohAwwBCyAEQTBqIAEgAkIAQoCAgICAgMAAEKsDIANBhoB9IANBhoB9ShtB/P8BaiEDIAQpAzghAiAEKQMwIQELIAQgASACQgAgA0H//wBqrUIwhhCrAyAAIAQpAwg3AwggACAEKQMANwMAIARB0ABqJAAL5xACBX8MfiMAQcABayIFJAAgBEL///////8/gyESIAJC////////P4MhDiACIASFQoCAgICAgICAgH+DIREgBEIwiKdB//8BcSEHAkACQAJAIAJCMIinQf//AXEiCUF/akH9/wFNBEBBACEGIAdBf2pB/v8BSQ0BCyABUCACQv///////////wCDIgtCgICAgICAwP//AFQgC0KAgICAgIDA//8AURtFBEAgAkKAgICAgIAghCERDAILIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIREgAyEBDAILIAEgC0KAgICAgIDA//8AhYRQBEAgAyACQoCAgICAgMD//wCFhFAEQEIAIQFCgICAgICA4P//ACERDAMLIBFCgICAgICAwP//AIQhEUIAIQEMAgsgAyACQoCAgICAgMD//wCFhFAEQEIAIQEMAgsgASALhFANAiACIAOEUARAIBFCgICAgICAwP//AIQhEUIAIQEMAgtBACEGIAtC////////P1gEQCAFQbABaiABIA4gASAOIA5QIgYbeSAGQQZ0rXynIgZBcWoQqANBECAGayEGIAUpA7gBIQ4gBSkDsAEhAQsgAkL///////8/Vg0AIAVBoAFqIAMgEiADIBIgElAiCBt5IAhBBnStfKciCEFxahCoAyAGIAhqQXBqIQYgBSkDqAEhEiAFKQOgASEDCyAFQZABaiASQoCAgICAgMAAhCIUQg+GIANCMYiEIgJCAEKEyfnOv+a8gvUAIAJ9IgRCABCiAyAFQYABakIAIAUpA5gBfUIAIARCABCiAyAFQfAAaiAFKQOIAUIBhiAFKQOAAUI/iIQiBEIAIAJCABCiAyAFQeAAaiAEQgBCACAFKQN4fUIAEKIDIAVB0ABqIAUpA2hCAYYgBSkDYEI/iIQiBEIAIAJCABCiAyAFQUBrIARCAEIAIAUpA1h9QgAQogMgBUEwaiAFKQNIQgGGIAUpA0BCP4iEIgRCACACQgAQogMgBUEgaiAEQgBCACAFKQM4fUIAEKIDIAVBEGogBSkDKEIBhiAFKQMgQj+IhCIEQgAgAkIAEKIDIAUgBEIAQgAgBSkDGH1CABCiAyAGIAkgB2tqIQcCfkIAIAUpAwhCAYYgBSkDAEI/iIRCf3wiC0L/////D4MiBCACQiCIIgx+IhAgC0IgiCILIAJC/////w+DIgp+fCICQiCGIg0gBCAKfnwiCiANVK0gCyAMfiACIBBUrUIghiACQiCIhHx8IAogBCADQhGIQv////8PgyIMfiIQIAsgA0IPhkKAgP7/D4MiDX58IgJCIIYiDyAEIA1+fCAPVK0gCyAMfiACIBBUrUIghiACQiCIhHx8fCICIApUrXwgAkIAUq18fSIKQv////8PgyIMIAR+IhAgCyAMfiINIAQgCkIgiCIPfnwiCkIghnwiDCAQVK0gCyAPfiAKIA1UrUIghiAKQiCIhHx8IAxCACACfSICQiCIIgogBH4iECACQv////8PgyINIAt+fCICQiCGIg8gBCANfnwgD1StIAogC34gAiAQVK1CIIYgAkIgiIR8fHwiAiAMVK18IAJCfnwiECACVK18Qn98IgpC/////w+DIgIgDkIChiABQj6IhEL/////D4MiBH4iDCABQh6IQv////8PgyILIApCIIgiCn58Ig0gDFStIA0gEEIgiCIMIA5CHohC///v/w+DQoCAEIQiDn58Ig8gDVStfCAKIA5+fCACIA5+IhMgBCAKfnwiDSATVK1CIIYgDUIgiIR8IA8gDUIghnwiDSAPVK18IA0gCyAMfiITIBBC/////w+DIhAgBH58Ig8gE1StIA8gAiABQgKGQvz///8PgyITfnwiFSAPVK18fCIPIA1UrXwgDyAKIBN+Ig0gDiAQfnwiCiAEIAx+fCIEIAIgC358IgJCIIggAiAEVK0gCiANVK0gBCAKVK18fEIghoR8IgogD1StfCAKIBUgDCATfiIEIAsgEH58IgtCIIggCyAEVK1CIIaEfCIEIBVUrSAEIAJCIIZ8IARUrXx8IgQgClStfCICQv////////8AWARAIAFCMYYgBEL/////D4MiASADQv////8PgyILfiIKQgBSrX1CACAKfSIQIARCIIgiCiALfiINIAEgA0IgiCIMfnwiDkIghiIPVK19IAJC/////w+DIAt+IAEgEkL/////D4N+fCAKIAx+fCAOIA1UrUIghiAOQiCIhHwgBCAUQiCIfiADIAJCIIh+fCACIAx+fCAKIBJ+fEIghnx9IQsgB0F/aiEHIBAgD30MAQsgBEIhiCEMIAFCMIYgAkI/hiAEQgGIhCIEQv////8PgyIBIANC/////w+DIgt+IgpCAFKtfUIAIAp9IhAgASADQiCIIgp+Ig0gDCACQh+GhCIPQv////8PgyIOIAt+fCIMQiCGIhNUrX0gCiAOfiACQgGIIg5C/////w+DIAt+fCABIBJC/////w+DfnwgDCANVK1CIIYgDEIgiIR8IAQgFEIgiH4gAyACQiGIfnwgCiAOfnwgDyASfnxCIIZ8fSELIA4hAiAQIBN9CyEBIAdBgIABTgRAIBFCgICAgICAwP//AIQhEUIAIQEMAQsgB0GBgH9MBEBCACEBDAELIAQgAUIBhiADWiALQgGGIAFCP4iEIgEgFFogASAUURutfCIBIARUrSACQv///////z+DIAdB//8Aaq1CMIaEfCARhCERCyAAIAE3AwAgACARNwMIIAVBwAFqJAAPCyAAQgA3AwAgACARQoCAgICAgOD//wAgAiADhEIAUhs3AwggBUHAAWokAAvZAwICfwJ+IwBBIGsiAiQAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFQEQCABQgSGIABCPIiEIQQgAEL//////////w+DIgBCgYCAgICAgIAIWgRAIARCgYCAgICAgIDAAHwhBQwCCyAEQoCAgICAgICAQH0hBSAAQoCAgICAgICACIVCAFINASAFQgGDIAV8IQUMAQsgAFAgBEKAgICAgIDA//8AVCAEQoCAgICAgMD//wBRG0UEQCABQgSGIABCPIiEQv////////8Dg0KAgICAgICA/P8AhCEFDAELQoCAgICAgID4/wAhBSAEQv///////7//wwBWDQBCACEFIARCMIinIgNBkfcASQ0AIAIgACABQv///////z+DQoCAgICAgMAAhCIEQYH4ACADaxCqAyACQRBqIAAgBCADQf+If2oQqAMgAikDCEIEhiACKQMAIgRCPIiEIQUgAikDECACKQMYhEIAUq0gBEL//////////w+DhCIEQoGAgICAgICACFoEQCAFQgF8IQUMAQsgBEKAgICAgICAgAiFQgBSDQAgBUIBgyAFfCEFCyACQSBqJAAgBSABQoCAgICAgICAgH+DhL8LBQAgAJkLsAgCBn8CfiMAQTBrIgYkAEIAIQoCQCACQQJNBEAgAUEEaiEFIAJBAnQiAkHMNGooAgAhCCACQcA0aigCACEJA0ACfyABKAIEIgIgASgCaEkEQCAFIAJBAWo2AgAgAi0AAAwBCyABEJ8DCyICEJ0DDQALAkAgAkFVaiIE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ahCPBBogBxCSBRogAEGgAWokACAEC2QBAn8jAEEQayIBJAAgABCAAQJAIAAQyQQEQCAAEJEGIQIgAUEAOgAPIAIgAUEPahCSBiAAQQAQkwYMAQsgABCUBiECIAFBADoADiACIAFBDmoQkgYgAEEAEJUGCyABQRBqJAALCwAgACABIAIQlgYLCQAgABB9KAIACwwAIAAgAS0AADoAAAsLACAAEH0gATYCBAsIACAAEH0QfQsLACAAEH0gAToACwvgAQEEfyMAQSBrIgUkACAAEJkEIQQgABCjBCEDAkAgASACEKcJIgZFDQAgARB4IAAQhgUgABCGBSAAEJkEahDLCQRAIAAgBUEQaiABIAIgABDlCBDMCSIBENEEIAEQmQQQ+AkaIAEQ7wkaDAELIAMgBGsgBkkEQCAAIAMgBCAGaiADayAEIARBAEEAEPYJCyAAEMsEIARqIQMDQCABIAJGRQRAIAMgARCSBiABQQFqIQEgA0EBaiEDDAELCyAFQQA6AA8gAyAFQQ9qEJIGIAAgBCAGahDNCQsgBUEgaiQAIAALGwAgACABEHgQjAEaIABBBGogAhB4EIwBGiAACwsAIABB2L8BEJQECxEAIAAgASABKAIAKAIsEQIACxEAIAAgASABKAIAKAIgEQIACwsAIAAgARDFBiAACw8AIAAgACgCACgCJBEAAAsLACAAQdC/ARCUBAsSACAAIAI2AgQgACABOgAAIAALdwEBfyMAQSBrIgMkACADIAE2AhAgAyAANgIYIAMgAjYCCANAAkACf0EBIANBGGogA0EQahD6BEUNABogAyADQRhqEG0gA0EIahBtENAJDQFBAAshAiADQSBqJAAgAg8LIANBGGoQ+wQaIANBCGoQ+wQaDAAACwALMgEBfyMAQRBrIgIkACACIAAoAgA2AgggAkEIaiABENsGGiACKAIIIQEgAkEQaiQAIAELBwAgABCVAQsFABD3AQsYAQF/IAAQfSgCACEBIAAQfUEANgIAIAELJAAgACABEKMGEJAFIAEQoQYQeCgCACEBIAAQlQEgATYCACAACxgBAX8gABB9KAIAIQEgABB9QQA2AgAgAQskACAAIAEQpQYQqAYgARChBhB4KAIAIQEgABCVASABNgIAIAALCQAgACABELYICygBAX8gABB9KAIAIQIgABB9IAE2AgAgAgRAIAIgABCVASgCABEDAAsLgwQBAX8jAEHwBGsiACQAIAAgATYC6AQgACACNgLgBCAAQfEANgIQIABByAFqIABB0AFqIABBEGoQpgUhASAAQcABaiAEEIwCIABBwAFqEKsCIQcgAEEAOgC/AQJAIABB6ARqIAIgAyAAQcABaiAEEIsCIAUgAEG/AWogByABIABBxAFqIABB4ARqEKoGRQ0AIABBm9wAKAAANgC3ASAAQZTcACkAADcDsAEgByAAQbABaiAAQboBaiAAQYABahDwBBogAEHwADYCECAAQQhqQQAgAEEQahCOBSEHIABBEGohAgJAIAAoAsQBIAEQqwZrQYkDTgRAIAcgACgCxAEgARCrBmtBAnVBAmoQkAsQkAUgBxD/BUUNASAHEP8FIQILIAAtAL8BBEAgAkEtOgAAIAJBAWohAgsgARCrBiEEA0AgBCAAKALEAU8EQAJAIAJBADoAACAAIAY2AgAgAEEQakGQ3AAgABDkA0EBRw0AIAcQkgUaDAQLBSACIABBsAFqIABBgAFqIABBgAFqEKwGIAQQ8QQgAEGAAWprQQJ1ai0AADoAACACQQFqIQIgBEEEaiEEDAELCyAAEPAFAAsQ4AkACyAAQegEaiAAQeAEahCwAgRAIAUgBSgCAEECcjYCAAsgACgC6AQhBCAAQcABahCPBBogARCpBRogAEHwBGokACAEC6kOAQh/IwBBsARrIgskACALIAo2AqQEIAsgATYCqAQgC0HxADYCYCALIAtBiAFqIAtBkAFqIAtB4ABqEIEGIg8QggYiATYChAEgCyABQZADajYCgAEgC0HgAGoQogQhESALQdAAahD6BSEOIAtBQGsQ+gUhDCALQTBqEPoFIQ0gC0EgahD6BSEQIAIgAyALQfgAaiALQfQAaiALQfAAaiARIA4gDCANIAtBHGoQrQYgCSAIEKsGNgIAIARBgARxIRJBACEBQQAhBANAIAQhCgJAAkACQCABQQRGDQAgACALQagEahCsAkUNAAJAAkACQCALQfgAaiABaiwAACICQQRLDQBBACEEAkACQAJAAkACQCACQQFrDgQABAMHAQsgAUEDRg0EIAdBgMAAIAAQrQIQrgIEQCALQRBqIABBABCuBiAQIAtBEGoQbRCECgwCCyAFIAUoAgBBBHI2AgBBACEADAgLIAFBA0YNAwsDQCAAIAtB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QQJ0aiEDA0AgASACRkUEQCADIAEQuQYgAUEEaiEBIANBBGohAwwBCwsgBUEANgIAIAMgBRC5BiAAIAQgBmoQ3AgLIAVBEGokACAACwsAIABB6L8BEJQECwsAIAAgARDGBiAACwsAIABB4L8BEJQEC3cBAX8jAEEgayIDJAAgAyABNgIQIAMgADYCGCADIAI2AggDQAJAAn9BASADQRhqIANBEGoQmQVFDQAaIAMgA0EYahBtIANBCGoQbRDUCQ0BQQALIQIgA0EgaiQAIAIPCyADQRhqEJoFGiADQQhqEJoFGgwAAAsACzIBAX8jAEEQayICJAAgAiAAKAIANgIIIAJBCGogARDdBhogAigCCCEBIAJBEGokACABCxgBAX8gABB9KAIAIQEgABB9QQA2AgAgAQskACAAIAEQwwYQpwUgARChBhB4KAIAIQEgABCVASABNgIAIAALMwECfyAAELUJIAEQfSECIAAQfSIDIAIoAgg2AgggAyACKQIANwIAIAAgARC2CSABEMgECzMBAn8gABC4CSABEH0hAiAAEH0iAyACKAIINgIIIAMgAikCADcCACAAIAEQuQkgARD7BQvwBAELfyMAQdADayIAJAAgACAFNwMQIAAgBjcDGCAAIABB4AJqNgLcAiAAQeACakHkAEGf3AAgAEEQahDlAyEHIABB8AA2AvABQQAhDCAAQegBakEAIABB8AFqEI4FIQ8gAEHwADYC8AEgAEHgAWpBACAAQfABahCOBSEKIABB8AFqIQgCQCAHQeQATwRAEMYEIQcgACAFNwMAIAAgBjcDCCAAQdwCaiAHQZ/cACAAEI8FIQcgACgC3AIiCEUNASAPIAgQkAUgCiAHEJALEJAFIApBABDIBg0BIAoQ/wUhCAsgAEHYAWogAxCMAiAAQdgBahBhIhEgACgC3AIiCSAHIAlqIAgQxAQaIAICfyAHBEAgACgC3AItAABBLUYhDAsgDAsgAEHYAWogAEHQAWogAEHPAWogAEHOAWogAEHAAWoQogQiECAAQbABahCiBCIJIABBoAFqEKIEIgsgAEGcAWoQyQYgAEHwADYCMCAAQShqQQAgAEEwahCOBSENAn8gByAAKAKcASICSgRAIAsQmQQgByACa0EBdEEBcmoMAQsgCxCZBEECagshDiAAQTBqIQIgCRCZBCAOaiAAKAKcAWoi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ABDnBxDoByAAKAIEIQAgAUEgaiQAIABBf2oLcwECfyMAQRBrIgMkACABENAHIANBCGogARDUByEEIABBEGoiARCuByACTQRAIAEgAkEBahDXBwsgASACEM8HKAIABEAgASACEM8HKAIAEKkBGgsgBBDYByEAIAEgAhDPByAANgIAIAQQ1QcaIANBEGokAAsVACAAIAEQ8AYaIABB6OgANgIAIAALFQAgACABEPAGGiAAQYjpADYCACAACzYAIAAgAxDwBhogABB4GiAAIAI6AAwgACABNgIIIABBxNwANgIAIAFFBEAgABDwBzYCCAsgAAsaACAAIAEQ8AYaIAAQeBogAEH04AA2AgAgAAsaACAAIAEQ8AYaIAAQeBogAEGI4gA2AgAgAAsiACAAIAEQ8AYaIAAQeBogAEH43AA2AgAgABDGBDYCCCAACxoAIAAgARDwBhogABB4GiAAQZzjADYCACAACycAIAAgARDwBhogAEGu2AA7AQggAEGo3QA2AgAgAEEMahCiBBogAAsqACAAIAEQ8AYaIABCroCAgMAFNwIIIABB0N0ANgIAIABBEGoQogQaIAALFQAgACABEPAGGiAAQajpADYCACAACxUAIAAgARDwBhogAEGc6wA2AgAgAAsVACAAIAEQ8AYaIABB8OwANgIAIAALFQAgACABEPAGGiAAQdjuADYCACAACxoAIAAgARDwBhogABB4GiAAQbD2ADYCACAACxoAIAAgARDwBhogABB4GiAAQcT3ADYCACAACxoAIAAgARDwBhogABB4GiAAQbj4ADYCACAACxoAIAAgARDwBhogABB4GiAAQaz5ADYCACAACxoAIAAgARDwBhogABB4GiAAQaD6ADYCACAACxoAIAAgARDwBhogABB4GiAAQcT7ADYCACAACxoAIAAgARDwBhogABB4GiAAQej8ADYCACAACxoAIAAgARDwBhogABB4GiAAQYz+ADYCACAACygAIAAgARDwBhogAEEIahCPCSEBIABBoPAANgIAIAFB0PAANgIAIAALKAAgACABEPAGGiAAQQhqEJAJIQEgAEGo8gA2AgAgAUHY8gA2AgAgAAseACAAIAEQ8AYaIABBCGoQkQkaIABBlPQANgIAIAALHgAgACABEPAGGiAAQQhqEJEJGiAAQbD1ADYCACAACxoAIAAgARDwBhog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GiAAEOUIGgsyACAAELYGIAAQzgUEQCAAEOgIIAAQuAYgABDbCEEBahDmCCAAQQAQrAkgAEEAELwGCwsJACAAIAEQugkLEAAgARDoCBB4GiAAEOgIGgsKACABIABrQQxtCwUAEL4JCwUAEL8JCw0AQoCAgICAgICAgH8LDQBC////////////AAsFABDBCQsGAEH//wMLBQAQwwkLBABCfwsMACAAIAEQxgQQ/gMLDAAgACABEMYEEP8DCzoCAX8BfiMAQRBrIgMkACADIAEgAhDGBBCABCADKQMAIQQgACADKQMINwMIIAAgBDcDACADQRBqJAALCQAgACABEOgFCwkAIAAgARDPAgsJACAAEH0oAgALCAAgABB9EH0LDQAgACACSSABIABNcQsVACAAIAMQzgkaIAAgASACEM8JIAALGQAgABDJBARAIAAgARCTBg8LIAAgARCVBgsUACAAENcCGiAAIAEQeBCPARogAAunAQEEfyMAQRBrIgUkACABIAIQpwkiBCAAEIAJTQRAAkAgBEEKTQRAIAAgBBCVBiAAEJQGIQMMAQsgBBCDCSEDIAAgABDlCCADQQFqIgYQhQkiAxCHCSAAIAYQiAkgACAEEJMGCwNAIAEgAkZFBEAgAyABEJIGIANBAWohAyABQQFqIQEMAQsLIAVBADoADyADIAVBD2oQkgYgBUEQaiQADwsgABDqCQALDQAgAS0AACACLQAARgsVACAAIAMQ0gkaIAAgASACENMJIAALFAAgABDXAhogACABEHgQjwEaIAALpwEBBH8jAEEQayIFJAAgASACENoIIgQgABCoCU0EQAJAIARBAU0EQCAAIAQQvAYgABC7BiEDDAELIAQQqQkhAyAAIAAQ6AggA0EBaiIGEKoJIgMQqwkgACAGEKwJIAAgBBC6BgsDQCABIAJGRQRAIAMgARC5BiADQQRqIQMgAUEEaiEBDAELCyAFQQA2AgwgAyAFQQxqELkGIAVBEGokAA8LIAAQ6gkACw0AIAEoAgAgAigCAEYLDAAgACABEPwEQQFzCwwAIAAgARD8BEEBcwsDAAALOgEBfyAAQQhqIgFBAhDZCUUEQCAAIAAoAgAoAhARAwAPCyABEKoBQX9GBEAgACAAKAIAKAIQEQMACwsUAAJAIAFBf2pBBEsNAAsgACgCAAsEAEEACwcAIAAQpQEL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BSkDACEEDAELIAEgAkL///////8/gyAGrUIwhoQiCiADIARC////////P4MgBEIwiKdB//8BcSIIrUIwhoQiCxCvA0EATARAIAEgCiADIAsQrwMEQCABIQQMAgsgBUHwAGogASACQgBCABCrAyAFKQN4IQIgBSkDcCEEDAELIAYEfiABBSAFQeAAaiABIApCAEKAgICAgIDAu8AAEKsDIAUpA2giCkIwiKdBiH9qIQYgBSkDYAshBCAIRQRAIAVB0ABqIAMgC0IAQoCAgICAgMC7wAAQqwMgBSkDWCILQjCIp0GIf2ohCCAFKQNQIQMLIApC////////P4NCgICAgICAwACEIgogC0L///////8/g0KAgICAgIDAAIQiDX0gBCADVK19IgxCf1UhByAEIAN9IQsgBiAISgRAA0ACfiAHQQFxBEAgCyAMhFAEQCAFQSBqIAEgAkIAQgAQqwMgBSkDKCECIAUpAyAhBAwFCyAMQgGGIQwgC0I/iAwBCyAEQj+IIQwgBCELIApCAYYLIAyEIgogDX0gC0IBhiIEIANUrX0iDEJ/VSEHIAQgA30hCyAGQX9qIgYgCEoNAAsgCCEGCwJAIAdFDQAgCyIEIAwiCoRCAFINACAFQTBqIAEgAkIAQgAQqwMgBSkDOCECIAUpAzAhBAwBCyAKQv///////z9YBEADQCAEQj+IIQMgBkF/aiEGIARCAYYhBCADIApCAYaEIgpCgICAgICAwABUDQALCyAJQYCAAnEhByAGQQBMBEAgBUFAayAEIApC////////P4MgBkH4AGogB3KtQjCGhEIAQoCAgICAgMDDPxCrAyAFKQNIIQIgBSkDQCEEDAELIApC////////P4MgBiAHcq1CMIaEIQILIAAgBDcDACAAIAI3AwggBUGAAWokAAuoAQACQCABQYAITgRAIABEAAAAAAAA4H+iIQAgAUH/D0gEQCABQYF4aiEBDAILIABEAAAAAAAA4H+iIQAgAUH9FyABQf0XSBtBgnBqIQEMAQsgAUGBeEoNACAARAAAAAAAABAAoiEAIAFBg3BKBEAgAUH+B2ohAQwBCyAARAAAAAAAABAAoiEAIAFBhmggAUGGaEobQfwPaiEBCyAAIAFB/wdqrUI0hr+iC0QCAX8BfiABQv///////z+DIQMCfyABQjCIp0H//wFxIgJB//8BRwRAQQQgAg0BGkECQQMgACADhFAbDwsgACADhFALC4MEAQN/IAJBgMAATwRAIAAgASACECAaIAAPCyAAIAJqIQMCQCAAIAFzQQNxRQRAAkAgAkEBSARAIAAhAgwBCyAAQQNxRQRAIAAhAgwBCyAAIQIDQCACIAEtAAA6AAAgAUEBaiEBIAJBAWoiAiADTw0BIAJBA3ENAAsLAkAgA0F8cSIEQcAASQ0AIAIgBEFAaiIFSw0AA0AgAiABKAIANgIAIAIgASgCBDYCBCACIAEoAgg2AgggAiABKAIMNgIMIAIgASgCEDYCECACIAEoAhQ2AhQgAiABKAIYNgIYIAIgASgCHDYCHCACIAEoAiA2AiAgAiABKAIkNgIkIAIgASgCKDYCKCACIAEoAiw2AiwgAiABKAIwNgIwIAIgASgCNDYCNCACIAEoAjg2AjggAiABKAI8NgI8IAFBQGshASACQUBrIgIgBU0NAAsLIAIgBE8NAQNAIAIgASgCADYCACABQQRqIQEgAkEEaiICIARJDQALDAELIANBBEkEQCAAIQIMAQsgA0F8aiIEIABJBEAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCyACIANJBEADQCACIAEtAAA6AAAgAUEBaiEBIAJBAWoiAiADRw0ACwsgAAvzAgICfwF+AkAgAkUNACAAIAJqIgNBf2ogAToAACAAIAE6AAAgAkEDSQ0AIANBfmogAToAACAAIAE6AAEgA0F9aiABOgAAIAAgAToAAiACQQdJDQAgA0F8aiABOgAAIAAgAToAAyACQQlJDQAgAEEAIABrQQNxIgRqIgMgAUH/AXFBgYKECGwiATYCACADIAIgBGtBfHEiBGoiAkF8aiABNgIAIARBCUkNACADIAE2AgggAyABNgIEIAJBeGogATYCACACQXRqIAE2AgAgBEEZSQ0AIAMgATYCGCADIAE2AhQgAyABNgIQIAMgATYCDCACQXBqIAE2AgAgAkFsaiABNgIAIAJBaGogATYCACACQWRqIAE2AgAgBCADQQRxQRhyIgRrIgJBIEkNACABrSIFQiCGIAWEIQUgAyAEaiEBA0AgASAFNwMYIAEgBTcDECABIAU3AwggASAFNwMAIAFBIGohASACQWBqIgJBH0sNAAsLIAAL+AIBAn8CQCAAIAFGDQACQCABIAJqIABLBEAgACACaiIEIAFLDQELIAAgASACEJoLDwsgACABc0EDcSEDAkACQCAAIAFJBEAgAwRAIAAhAwwDCyAAQQNxRQRAIAAhAwwCCyAAIQMDQCACRQ0EIAMgAS0AADoAACABQQFqIQEgAkF/aiECIANBAWoiA0EDcQ0ACwwBCwJAIAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAALHwBBhNMBKAIARQRAQYjTASABNgIAQYTTASAANgIACwsEACMACxAAIwAgAGtBcHEiACQAIAALBgAgACQACwYAIABAAAsJACABIAARAAALCQAgASAAEQMACwcAIAARBAALCwAgASACIAARAQALDwAgASACIAMgBCAAEQwACwsAIAEgAiAAEQIACxEAIAEgAiADIAQgBSAAEQ4ACw0AIAEgAiADIAARCAALDwAgASACIAMgBCAAEQoACw0AIAEgAiADIAARBQALEQAgASACIAMgBCAFIAARIAALDQAgASACIAMgABEZAAsTACABIAIgAyAEIAUgBiAAER4ACxEAIAEgAiADIAQgBSAAEQsACxcAIAEgAiADIAQgBSAGIAcgCCAAEQ0ACxMAIAEgAiADIAQgBSAGIAARBgALEQAgASACIAMgBCAFIAAREwALEQAgASACIAMgBCAFIAARFAALEwAgASACIAMgBCAFIAYgABEdAAsVACABIAIgAyAEIAUgBiAHIAARDwALFQAgASACIAMgBCAFIAYgByAAERcACxMAIAEgAiADIAQgBSAGIAARCQALBwAgABEHAAsZACAAIAEgAiADrSAErUIghoQgBSAGEKwLCyIBAX4gACABIAKtIAOtQiCGhCAEEK0LIgVCIIinECEgBacLGQAgACABIAIgAyAEIAWtIAatQiCGhBCyCwsjACAAIAEgAiADIAQgBa0gBq1CIIaEIAetIAitQiCGhBC0CwslACAAIAEgAiADIAQgBSAGrSAHrUIghoQgCK0gCa1CIIaEELYLCxMAIAAgAacgAUIgiKcgAiADECILC+eCAToAQYAIC5YGT3NjaWxsYXRvcktlcm5lbABwcm9jZXNzAHNldE1vZGUAaXNTdG9wcGVkAHJlc2V0AGVudGVyUmVsZWFzZVN0YWdlAFdhdmVGb3JtAFNJTkUAU0FXAFNRVUFSRQBTdGF0ZQBTVEFSVElORwBTVEFSVEVEAFNUT1BQSU5HAFNUT1BQRUQAMTZPc2NpbGxhdG9yS2VybmVsAABQSQAAhAQAAFAxNk9zY2lsbGF0b3JLZXJuZWwAMEoAAKAEAAAAAAAAmAQAAFBLMTZPc2NpbGxhdG9yS2VybmVsAAAAADBKAADEBAAAAQAAAJgEAABpaQB2AHZpAE4xMGVtc2NyaXB0ZW4zdmFsRQAAUEkAAPQEAAAAAAAAuAUAABUAAAAWAAAAFwAAABgAAAAZAAAATlN0M19fMjIwX19zaGFyZWRfcHRyX3BvaW50ZXJJUDE2T3NjaWxsYXRvcktlcm5lbE4xMGVtc2NyaXB0ZW4xNXNtYXJ0X3B0cl90cmFpdElOU18xMHNoYXJlZF9wdHJJUzFfRUVFMTF2YWxfZGVsZXRlckVOU185YWxsb2NhdG9ySVMxX0VFRUUAAAB4SQAALAUAANBFAABOMTBlbXNjcmlwdGVuMTVzbWFydF9wdHJfdHJhaXRJTlN0M19fMjEwc2hhcmVkX3B0ckkxNk9zY2lsbGF0b3JLZXJuZWxFRUUxMXZhbF9kZWxldGVyRQAAUEkAAMQFAABOU3QzX18yMTBzaGFyZWRfcHRySTE2T3NjaWxsYXRvcktlcm5lbEVFAAAAAFBJAAAkBgAAaQBpaWkAAABQBgAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQAAAAAADAcAABoAAAAbAAAAHAAAAB0AAAAeAAAATlN0M19fMjIwX19zaGFyZWRfcHRyX2VtcGxhY2VJMTZPc2NpbGxhdG9yS2VybmVsTlNfOWFsbG9jYXRv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aGFyX3RyYWl0c0l3RUVFRQAAAABQSQAA+BQAAE5TdDNfXzIxM2Jhc2ljX2lzdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFRUUAANRJAAA0FQAAAAAAAAEAAABoFAAAA/T//05TdDNfXzIxM2Jhc2ljX2lzdHJlYW1Jd05TXzExY2hhcl90cmFpdHNJd0VFRUUAANRJAAB8FQAAAAAAAAEAAACwFAAAA/T//05TdDNfXzIxM2Jhc2ljX29zdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFRUUAANRJAADEFQAAAAAAAAEAAABoFAAAA/T//05TdDNfXzIxM2Jhc2ljX29zdHJlYW1Jd05TXzExY2hhcl90cmFpdHNJd0VFRUUAANRJAAAMFgAAAAAAAAEAAACwFAAAA/T//zBQAADAUAAAWFEAAAAAAAC4FgAAHwAAAFgAAABZAAAAIgAAACMAAAAkAAAAJQAAACYAAAAnAAAAWgAAAFsAAABcAAAAKwAAACwAAABOU3QzX18yMTBfX3N0ZGluYnVmSWNFRQB4SQAAoBYAAPAUAAB1bnN1cHBvcnRlZCBsb2NhbGUgZm9yIHN0YW5kYXJkIGlucHV0AAAAAAAAAEQXAAAtAAAAXQAAAF4AAAAwAAAAMQAAADIAAAAzAAAANAAAADUAAABfAAAAYAAAAGEAAAA5AAAAOgAAAE5TdDNfXzIxMF9fc3RkaW5idWZJd0VFAHhJAAAsFwAALBUAAAAAAACsFwAAHwAAAGIAAABjAAAAIgAAACMAAAAkAAAAZAAAACYAAAAnAAAAKAAAACkAAAAqAAAAZQAAAGYAAABOU3QzX18yMTFfX3N0ZG91dGJ1ZkljRUUAAAAAeEkAAJAXAADwFAAAAAAAABQYAAAtAAAAZwAAAGgAAAAwAAAAMQAAADIAAABpAAAANAAAADUAAAA2AAAANwAAADgAAABqAAAAawAAAE5TdDNfXzIxMV9fc3Rkb3V0YnVmSXdFRQAAAAB4SQAA+BcAACwVAAD/////////////////////////////////////////////////////////////////AAECAwQFBgcICf////////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wABAgQHAwYFAAAAAAAAAAIAAMADAADABAAAwAUAAMAGAADABwAAwAgAAMAJAADACgAAwAsAAMAMAADADQAAwA4AAMAPAADAEAAAwBEAAMASAADAEwAAwBQAAMAVAADAFgAAwBcAAMAYAADAGQAAwBoAAMAbAADAHAAAwB0AAMAeAADAHwAAwAAAALMBAADDAgAAwwMAAMMEAADDBQAAwwYAAMMHAADDCAAAwwkAAMMKAADDCwAAwwwAAMMNAADTDgAAww8AAMMAAAy7AQAMwwIADMMDAAzDBAAM02luZmluaXR5AG5hbgBBkDQLSNF0ngBXnb0qgHBSD///PicKAAAAZAAAAOgDAAAQJwAAoIYBAEBCDwCAlpgAAOH1BRgAAAA1AAAAcQAAAGv////O+///kr///wBB4DQLI94SBJUAAAAA////////////////YBoAABQAAABDLlVURi04AEGoNQsCdBoAQcA1CwZMQ19BTEwAQdA1C5gBTENfQ1RZUEUAAAAATENfTlVNRVJJQwAATENfVElNRQAAAAAATENfQ09MTEFURQAATENfTU9ORVRBUlkATENfTUVTU0FHRVMATEFORwBDLlVURi04AFBPU0lYAE1VU0xfTE9DUEFUSAAALSsgICAwWDB4AChudWxsKQAAAAAAAAARAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAQfA2CyERAA8KERERAwoHAAETCQsLAAAJBgsAAAsABhEAAAAREREAQaE3CwELAEGqNwsYEQAKChEREQAKAAACAAkLAAAACQALAAALAEHbNwsBDABB5zcLFQwAAAAADAAAAAAJDAAAAAAADAAADABBlTgLAQ4AQaE4CxUNAAAABA0AAAAACQ4AAAAAAA4AAA4AQc84CwEQAEHbOAseDwAAAAAPAAAAAAkQAAAAAAAQAAAQAAASAAAAEhISAEGSOQsOEgAAABISEgAAAAAAAAkAQcM5CwELAEHPOQsVCgAAAAAKAAAAAAkLAAAAAAAL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AHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AHN0ZDo6d3N0cmluZwBlbXNjcmlwdGVuOjp2YWwAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgBOU3QzX18yMTJiYXNpY19zdHJpbmdJY05TXzExY2hhcl90cmFpdHNJY0VFTlNfOWFsbG9jYXRvckljRUVFRQBOU3QzX18yMjFfX2Jhc2ljX3N0cmluZ19jb21tb25JTGIxRUVFAAAAAFBJAAB7TQAA1EkAADxNAAAAAAAAAQAAAKRNAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAANRJAADETQAAAAAAAAEAAACkTQAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAADUSQAAHE4AAAAAAAABAAAApE0AAAAAAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ljRUUAAFBJAAB0TgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJYUVFAABQSQAAnE4AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWhFRQAAUEkAAMROAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lzRUUAAFBJAADsTgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJdEVFAABQSQAAFE8AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWlFRQAAUEkAADxPAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lqRUUAAFBJAABkTwAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbEVFAABQSQAAjE8AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SW1FRQAAUEkAALRPAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lmRUUAAFBJAADcTwAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZEVFAABQSQAABFAAQbCgAQsBCQBBvKABCwFRAEHQoAELElIAAAAAAAAAUwAAAPhSAAAABABB/KABCwT/////AEHAoQELAQUAQcyhAQsBVABB5KEBCw5VAAAAVgAAAAhXAAAABABB/KEBCwEBAEGLogELBQr/////AEHQogELCcBQAAAAAAAABQBB5KIBCwFRAEH8ogELClUAAABTAAAAEFsAQZSjAQsBAgBBo6MBCwX//////wBBpKUBCwJQXw==';
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
  // if we don't have the binary yet, and have the Fetch api, use that
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
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
    'wasi_unstable': asmLibraryArg
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
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
        err('Memory size incompatibility issues may be due to changing TOTAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set TOTAL_MEMORY at runtime to something smaller than it was at compile time).');
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




// STATICTOP = STATIC_BASE + 26160;
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
          throw new Error(0);
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

  
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }function ___cxa_atexit(
  ) {
  return _atexit.apply(null, arguments)
  }

  
  var ___exception_infos={};
  
  var ___exception_last=0;function ___cxa_throw(ptr, type, destructor) {
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

  function ___lock() {}

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      return value;
    }function ___map_file(pathname, size) {
      ___setErrNo(63);
      return -1;
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
      }};
  
  
  var PATH_FS={resolve:function() {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function(stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function(stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function(tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              try {
                bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }
  
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
            } else
            if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function(mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function(node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function(node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
        return;
      },resizeFileStorage:function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function(parent, name) {
          throw FS.genericErrors[44];
        },mknod:function(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function(old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function(parent, name) {
          delete parent.contents[name];
        },rmdir:function(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
        },readdir:function(node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        }},stream_ops:{read:function(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function(stream, buffer, offset, length, position, canOwn) {
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },allocate:function(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function(stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                contents.buffer === buffer.buffer ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            // malloc() can lead to growing the heap. If targeting the heap, we need to
            // re-acquire the heap buffer object in case growth had occurred.
            var fromHeap = (buffer.buffer == HEAP8.buffer);
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            (fromHeap ? HEAP8 : buffer).set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function(stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(32);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function(parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function(parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function(parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function(node) {
        FS.hashRemoveNode(node);
      },isRoot:function(node) {
        return node === node.parent;
      },isMountpoint:function(node) {
        return !!node.mounted;
      },isFile:function(mode) {
        return (mode & 61440) === 32768;
      },isDir:function(mode) {
        return (mode & 61440) === 16384;
      },isLink:function(mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function(mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function(mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function(mode) {
        return (mode & 61440) === 4096;
      },isSocket:function(mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return 2;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return 2;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },mayLookup:function(dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },mayCreate:function(dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },mayOpen:function(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },getStream:function(fd) {
        return FS.streams[fd];
      },createStream:function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function(fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function() {
          throw new FS.ErrnoError(70);
        }},major:function(dev) {
        return ((dev) >> 8);
      },minor:function(dev) {
        return ((dev) & 0xff);
      },makedev:function(ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function(dev) {
        return FS.devices[dev];
      },getMounts:function(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function(populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(err) {
          FS.syncFSRequests--;
          return callback(err);
        }
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function(type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      },lookup:function(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(28);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function(path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function(path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:function(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },mkdev:function(path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(10);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },unlink:function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },lstat:function(path) {
        return FS.stat(path, true);
      },chmod:function(path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function(path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
      },chown:function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },utime:function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            console.log("FS.trackingDelegate error on read file: " + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },isClosed:function(stream) {
        return stream.fd === null;
      },llseek:function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function(stream, buffer, offset, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function(stream) {
        return 0;
      },ioctl:function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:function() {
        return FS.currentPath;
      },chdir:function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else
        if (ENVIRONMENT_IS_NODE) {
          // for nodejs with or without crypto support included
          try {
            var crypto_module = require('crypto');
            // nodejs has crypto support
            random_device = function() { return crypto_module['randomBytes'](1)[0]; };
          } catch (e) {
            // nodejs doesn't have crypto support
          }
        } else
        {}
        if (!random_device) {
          // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
          random_device = function() { abort("random_device"); };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(8);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function() {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        var stdout = FS.open('/dev/stdout', 'w');
        var stderr = FS.open('/dev/stderr', 'w');
      },ensureErrnoError:function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
          };
          this.setErrno(errno);
          this.message = 'FS error';
  
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [44].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function() {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },init:function(input, output, error) {
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function() {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function(relative, base) {
        return PATH_FS.resolve(base, relative);
      },standardizePath:function(path) {
        return PATH.normalize(path);
      },findObject:function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function(parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(29);
        return success;
      },createLazyFile:function(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(29);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(29);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function() {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function(paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function(dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(8);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function(func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -54;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)]=tempI64[0],HEAP32[(((buf)+(44))>>2)]=tempI64[1]);
        HEAP32[(((buf)+(48))>>2)]=4096;
        HEAP32[(((buf)+(52))>>2)]=stat.blocks;
        HEAP32[(((buf)+(56))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(76))>>2)]=0;
        (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(80))>>2)]=tempI64[0],HEAP32[(((buf)+(84))>>2)]=tempI64[1]);
        return 0;
      },doMsync:function(addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
      },doMkdir:function(path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function(path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        stringToUTF8(ret, buf, bufsize+1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf+len] = endChar;
  
        return len;
      },doAccess:function(path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -28;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        if (!node) {
          return -44;
        }
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -2;
        }
        return 0;
      },doDup:function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:0,get:function(varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function() {
        var ret = UTF8ToString(SYSCALLS.get());
        return ret;
      },getStreamFromFD:function(fd) {
        // TODO: when all syscalls use wasi, can remove the next line
        if (fd === undefined) fd = SYSCALLS.get();
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
      },get64:function() {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        return low;
      },getZero:function() {
        SYSCALLS.get();
      }};function __emscripten_syscall_munmap(addr, len) {
      if (addr === -1 || len === 0) {
        return -28;
      }
      // TODO: support unmmap'ing parts of allocations
      var info = SYSCALLS.mappings[addr];
      if (!info) return 0;
      if (len === info.len) {
        var stream = FS.getStream(info.fd);
        SYSCALLS.doMsync(addr, stream, len, info.flags);
        FS.munmap(stream);
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
          _free(info.malloc);
        }
      }
      return 0;
    }function ___syscall91(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // munmap
      var addr = SYSCALLS.get(), len = SYSCALLS.get();
      return __emscripten_syscall_munmap(addr, len);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___unlock() {}

  
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
    }function registerType(rawType, registeredInstance, options) {
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
    }function exposePublicSymbol(name, value, numArguments) {
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
    }function RegisteredPointer(
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
  
      var fp;
      if (Module['FUNCTION_TABLE_' + signature] !== undefined) {
          fp = Module['FUNCTION_TABLE_' + signature][rawFunction];
      } else if (typeof FUNCTION_TABLE !== "undefined") {
          fp = FUNCTION_TABLE[rawFunction];
      } else {
          // asm.js does not give direct access to the function tables,
          // and thus we must go through the dynCall interface which allows
          // calling into a signature's function table by pointer value.
          //
          // https://github.com/dherman/asm.js/issues/83
          //
          // This has three main penalties:
          // - dynCall is another function call in the path from JavaScript to C++.
          // - JITs may not predict through the function table indirection at runtime.
          var dc = Module['dynCall_' + signature];
          if (dc === undefined) {
              // We will always enter this branch if the signature
              // contains 'f' and PRECISE_F32 is not enabled.
              //
              // Try again, replacing 'f' with 'd'.
              dc = Module['dynCall_' + signature.replace(/f/g, 'd')];
              if (dc === undefined) {
                  throwBindingError("No dynCall invoker for signature: " + signature);
              }
          }
          fp = makeDynCaller(dc);
      }
  
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
          return new TA(heap['buffer'], data, size);
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
              if(stdStringIsUTF8) {
                  //ensure null termination at one-past-end byte if not present yet
                  var endChar = HEAPU8[value + 4 + length];
                  var endCharSwap = 0;
                  if(endChar != 0)
                  {
                    endCharSwap = endChar;
                    HEAPU8[value + 4 + length] = 0;
                  }
  
                  var decodeStartPtr = value + 4;
                  //looping here to support possible embedded '0' bytes
                  for (var i = 0; i <= length; ++i) {
                    var currentBytePtr = value + 4 + i;
                    if(HEAPU8[currentBytePtr] == 0)
                    {
                      var stringSegment = UTF8ToString(decodeStartPtr);
                      if(str === undefined)
                        str = stringSegment;
                      else
                      {
                        str += String.fromCharCode(0);
                        str += stringSegment;
                      }
                      decodeStartPtr = currentBytePtr + 1;
                    }
                  }
  
                  if(endCharSwap != 0)
                    HEAPU8[value + 4 + length] = endCharSwap;
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
                  if(valueIsOfTypeString) {
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
      // nb. do not cache HEAPU16 and HEAPU32, they may be destroyed by emscripten_resize_heap().
      name = readLatin1String(name);
      var getHeap, shift;
      if (charSize === 2) {
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var HEAP = getHeap();
              var length = HEAPU32[value >> 2];
              var a = new Array(length);
              var start = (value + 4) >> shift;
              for (var i = 0; i < length; ++i) {
                  a[i] = String.fromCharCode(HEAP[start + i]);
              }
              _free(value);
              return a.join('');
          },
          'toWireType': function(destructors, value) {
              // assumes 4-byte alignment
              var length = value.length;
              var ptr = _malloc(4 + length * charSize);
              var HEAP = getHeap();
              HEAPU32[ptr >> 2] = length;
              var start = (ptr + 4) >> shift;
              for (var i = 0; i < length; ++i) {
                  HEAP[start + i] = value.charCodeAt(i);
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

  
  function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
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

  function _emscripten_get_heap_size() {
      return HEAP8.length;
    }

  function _emscripten_get_sbrk_ptr() {
      return 27024;
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
    }

  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('OOM');
    }function _emscripten_resize_heap(requestedSize) {
      abortOnCannotGrowMemory(requestedSize);
    }

  
  
  var ENV={};function _emscripten_get_environ() {
      if (!_emscripten_get_environ.strings) {
        // Default values.
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          // Browser language detection #8751
          'LANG': ((typeof navigator === 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8',
          '_': thisProgram
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(x + '=' + env[x]);
        }
        _emscripten_get_environ.strings = strings;
      }
      return _emscripten_get_environ.strings;
    }function _environ_get(__environ, environ_buf) {
      var strings = _emscripten_get_environ();
      var bufSize = 0;
      strings.forEach(function(string, i) {
        var ptr = environ_buf + bufSize;
        HEAP32[(((__environ)+(i * 4))>>2)]=ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    }

  function _environ_sizes_get(penviron_count, penviron_buf_size) {
      var strings = _emscripten_get_environ();
      HEAP32[((penviron_count)>>2)]=strings.length;
      var bufSize = 0;
      strings.forEach(function(string) {
        bufSize += string.length + 1;
      });
      HEAP32[((penviron_buf_size)>>2)]=bufSize;
      return 0;
    }

  function _fd_close(fd) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_read(fd, iov, iovcnt, pnum) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doReadv(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)]=num
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var HIGH_OFFSET = 0x100000000; // 2^32
      // use an unsigned operator on low and shift high by 32-bits
      var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
  
      var DOUBLE_LIMIT = 0x20000000000000; // 2^53
      // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
      if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
        return -61;
      }
  
      FS.llseek(stream, offset, whence);
      (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((newOffset)>>2)]=tempI64[0],HEAP32[(((newOffset)+(4))>>2)]=tempI64[1]);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_write(fd, iov, iovcnt, pnum) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doWritev(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)]=num
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      var aligned_dest_end = 0;
      var block_aligned_dest_end = 0;
      var dest_end = 0;
      // Test against a benchmarked cutoff limit for when HEAPU8.set() becomes faster to use.
      if ((num|0) >= 8192) {
        _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
        return dest|0;
      }
  
      ret = dest|0;
      dest_end = (dest + num)|0;
      if ((dest&3) == (src&3)) {
        // The initial unaligned < 4-byte front.
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        aligned_dest_end = (dest_end & -4)|0;
        block_aligned_dest_end = (aligned_dest_end - 64)|0;
        while ((dest|0) <= (block_aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          HEAP32[(((dest)+(4))>>2)]=((HEAP32[(((src)+(4))>>2)])|0);
          HEAP32[(((dest)+(8))>>2)]=((HEAP32[(((src)+(8))>>2)])|0);
          HEAP32[(((dest)+(12))>>2)]=((HEAP32[(((src)+(12))>>2)])|0);
          HEAP32[(((dest)+(16))>>2)]=((HEAP32[(((src)+(16))>>2)])|0);
          HEAP32[(((dest)+(20))>>2)]=((HEAP32[(((src)+(20))>>2)])|0);
          HEAP32[(((dest)+(24))>>2)]=((HEAP32[(((src)+(24))>>2)])|0);
          HEAP32[(((dest)+(28))>>2)]=((HEAP32[(((src)+(28))>>2)])|0);
          HEAP32[(((dest)+(32))>>2)]=((HEAP32[(((src)+(32))>>2)])|0);
          HEAP32[(((dest)+(36))>>2)]=((HEAP32[(((src)+(36))>>2)])|0);
          HEAP32[(((dest)+(40))>>2)]=((HEAP32[(((src)+(40))>>2)])|0);
          HEAP32[(((dest)+(44))>>2)]=((HEAP32[(((src)+(44))>>2)])|0);
          HEAP32[(((dest)+(48))>>2)]=((HEAP32[(((src)+(48))>>2)])|0);
          HEAP32[(((dest)+(52))>>2)]=((HEAP32[(((src)+(52))>>2)])|0);
          HEAP32[(((dest)+(56))>>2)]=((HEAP32[(((src)+(56))>>2)])|0);
          HEAP32[(((dest)+(60))>>2)]=((HEAP32[(((src)+(60))>>2)])|0);
          dest = (dest+64)|0;
          src = (src+64)|0;
        }
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      } else {
        // In the unaligned copy case, unroll a bit as well.
        aligned_dest_end = (dest_end - 4)|0;
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          HEAP8[(((dest)+(1))>>0)]=((HEAP8[(((src)+(1))>>0)])|0);
          HEAP8[(((dest)+(2))>>0)]=((HEAP8[(((src)+(2))>>0)])|0);
          HEAP8[(((dest)+(3))>>0)]=((HEAP8[(((src)+(3))>>0)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      }
      // The remaining unaligned < 4 byte tail.
      while ((dest|0) < (dest_end|0)) {
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
      }
      return ret|0;
    }

  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var end = 0, aligned_end = 0, block_aligned_end = 0, value4 = 0;
      end = (ptr + num)|0;
  
      value = value & 0xff;
      if ((num|0) >= 67 /* 64 bytes for an unrolled loop + 3 bytes for unaligned head*/) {
        while ((ptr&3) != 0) {
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
  
        aligned_end = (end & -4)|0;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
  
        block_aligned_end = (aligned_end - 64)|0;
  
        while((ptr|0) <= (block_aligned_end|0)) {
          HEAP32[((ptr)>>2)]=value4;
          HEAP32[(((ptr)+(4))>>2)]=value4;
          HEAP32[(((ptr)+(8))>>2)]=value4;
          HEAP32[(((ptr)+(12))>>2)]=value4;
          HEAP32[(((ptr)+(16))>>2)]=value4;
          HEAP32[(((ptr)+(20))>>2)]=value4;
          HEAP32[(((ptr)+(24))>>2)]=value4;
          HEAP32[(((ptr)+(28))>>2)]=value4;
          HEAP32[(((ptr)+(32))>>2)]=value4;
          HEAP32[(((ptr)+(36))>>2)]=value4;
          HEAP32[(((ptr)+(40))>>2)]=value4;
          HEAP32[(((ptr)+(44))>>2)]=value4;
          HEAP32[(((ptr)+(48))>>2)]=value4;
          HEAP32[(((ptr)+(52))>>2)]=value4;
          HEAP32[(((ptr)+(56))>>2)]=value4;
          HEAP32[(((ptr)+(60))>>2)]=value4;
          ptr = (ptr + 64)|0;
        }
  
        while ((ptr|0) < (aligned_end|0) ) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      // The remaining bytes.
      while ((ptr|0) < (end|0)) {
        HEAP8[((ptr)>>0)]=value;
        ptr = (ptr+1)|0;
      }
      return (end-num)|0;
    }

  function _setTempRet0($i) {
      setTempRet0(($i) | 0);
    }

  
  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
  
      var tm_zone = HEAP32[(((tm)+(40))>>2)];
  
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)],
        tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
      };
  
      var pattern = UTF8ToString(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
        // Modified Conversion Specifiers
        '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
        '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
        '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
        '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
        '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
        '%EY': '%Y',                      // Replaced by the full alternative year representation.
        '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
        '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
        '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
        '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
        '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
        '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
        '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
        '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
        '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
        '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
        '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
        '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
        '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      }
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      }
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        }
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      }
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      }
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else {
            return thisDate.getFullYear()-1;
          }
      }
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls((year/100)|0,2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
          // January 4th, which is also the week that includes the first Thursday of the year, and
          // is also the first week that contains at least four days in the year.
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
          // the last week of the preceding year; thus, for Saturday 2nd January 1999,
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
          // or 31st is a Monday, it and any following days are part of week 1 of the following year.
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
  
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          return date.tm_wday || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Sunday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week)
          // as a decimal number [01,53]. If the week containing 1 January has four
          // or more days in the new year, then it is considered week 1.
          // Otherwise, it is the last week of the previous year, and the next week is week 1.
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          }
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          return date.tm_wday;
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Monday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          // convert from minutes into hhmm format (which means 60 minutes = 100 units)
          off = (off / 60)*100 + (off % 60);
          return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': function(date) {
          return date.tm_zone;
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    }
FS.staticInit();;
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_ClassHandle();
init_RegisteredPointer();
init_embind();;
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_emval();;
var ASSERTIONS = false;

// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

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
 * @param {String} input The string to decode.
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
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
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


// ASM_LIBRARY EXTERN PRIMITIVES: Int8Array,Int32Array

var asmGlobalArg = {};
var asmLibraryArg = { "__cxa_allocate_exception": ___cxa_allocate_exception, "__cxa_atexit": ___cxa_atexit, "__cxa_throw": ___cxa_throw, "__lock": ___lock, "__map_file": ___map_file, "__syscall91": ___syscall91, "__unlock": ___unlock, "_embind_register_bool": __embind_register_bool, "_embind_register_class": __embind_register_class, "_embind_register_class_constructor": __embind_register_class_constructor, "_embind_register_class_function": __embind_register_class_function, "_embind_register_emval": __embind_register_emval, "_embind_register_enum": __embind_register_enum, "_embind_register_enum_value": __embind_register_enum_value, "_embind_register_float": __embind_register_float, "_embind_register_integer": __embind_register_integer, "_embind_register_memory_view": __embind_register_memory_view, "_embind_register_smart_ptr": __embind_register_smart_ptr, "_embind_register_std_string": __embind_register_std_string, "_embind_register_std_wstring": __embind_register_std_wstring, "_embind_register_void": __embind_register_void, "_emval_call": __emval_call, "_emval_decref": __emval_decref, "_emval_incref": __emval_incref, "_emval_take_value": __emval_take_value, "abort": _abort, "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "environ_get": _environ_get, "environ_sizes_get": _environ_sizes_get, "fd_close": _fd_close, "fd_read": _fd_read, "fd_seek": _fd_seek, "fd_write": _fd_write, "memory": wasmMemory, "setTempRet0": _setTempRet0, "strftime_l": _strftime_l, "table": wasmTable };
var asm = createWasm();
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["__wasm_call_ctors"];
var ___errno_location = Module["___errno_location"] = asm["__errno_location"];
var _setThrew = Module["_setThrew"] = asm["setThrew"];
var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = asm["_ZSt18uncaught_exceptionv"];
var _free = Module["_free"] = asm["free"];
var _malloc = Module["_malloc"] = asm["malloc"];
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
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viijii = Module["dynCall_viijii"] = asm["dynCall_viijii"];
var dynCall_jiji = Module["dynCall_jiji"] = asm["dynCall_jiji"];
var dynCall_iidiiii = Module["dynCall_iidiiii"] = asm["dynCall_iidiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = asm["dynCall_iiiiiii"];
var dynCall_iiiiij = Module["dynCall_iiiiij"] = asm["dynCall_iiiiij"];
var dynCall_iiiiid = Module["dynCall_iiiiid"] = asm["dynCall_iiiiid"];
var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = asm["dynCall_iiiiijj"];
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = asm["dynCall_iiiiiiii"];
var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = asm["dynCall_iiiiiijj"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];



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
