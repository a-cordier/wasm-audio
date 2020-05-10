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
  'initial': 398,
  'maximum': 398 + 0,
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
    STACK_BASE = 5270288,
    STACKTOP = STACK_BASE,
    STACK_MAX = 27408,
    DYNAMIC_BASE = 5270288,
    DYNAMICTOP_PTR = 27248;




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




var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABkAVRYAF/AX9gAn9/AX9gAn9/AGAAAX9gAX8AYAN/f38Bf2AGf39/f39/AX9gAABgA39/fwBgBn9/f39/fwBgBH9/f38Bf2AFf39/f38Bf2AEf39/fwBgCH9/f39/f39/AX9gBX9/f39/AGACf30AYAd/f39/f39/AX9gB39/f39/f38AYAJ/fQF9YAV/fn5+fgBgAAF+YAF9AX1gBX9/f39+AX9gCn9/f39/f39/f38AYAd/f39/f35+AX9gBH9/f38BfmADf35/AX5gCH9/f39/f39/AGADf399AGAEf35+fwBgCn9/f39/f39/f38Bf2AGf39/f35+AX9gBX9/f398AX9gBn98f39/fwF/YA9/f39/f39/f39/f39/f38AYAV/f35/fwBgCX9/f39/f39/fwF/YAt/f39/f39/f39/fwF/YAx/f39/f39/f39/f38Bf2ACfn8Bf2AEfn5+fgF/YAN/f38BfmAEf39/fgF+YAF/AX1gAn9/AX1gA39/fwF9YAN/fX0BfWABfAF9YAJ/fwF8YAN/f38BfGABfAF8YAJ8fwF8YAx/f39/f39/f39/f38AYA1/f39/f39/f39/f39/AGAGf39/fn9/AGAEf39/fQBgA39/fgBgAn9+AGACf3wAYAh/f39/f39+fgF/YAZ/f39/f34Bf2AGf39/f398AX9gB39/f319f38Bf2AHf398f39/fwF/YAJ/fgF/YAR/fn9/AX9gA399fQF/YAZ/fX19fX0Bf2ADfn9/AX9gAn5+AX9gAn1/AX9gAn9/AX5gBH9/fn8BfmABfAF+YAN/fX8BfWAFf319fX0BfWACfn4BfWADfX1/AX1gBH19f38BfWACfn4BfGACfHwBfAKvByUDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfY2xhc3MANQNlbnYaX2VtYmluZF9yZWdpc3Rlcl9zbWFydF9wdHIANANlbnYiX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19jb25zdHJ1Y3RvcgAJA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2VudW0ADANlbnYbX2VtYmluZF9yZWdpc3Rlcl9lbnVtX3ZhbHVlAAgDZW52GF9fY3hhX2FsbG9jYXRlX2V4Y2VwdGlvbgAAA2VudgtfX2N4YV90aHJvdwAIA2Vudg1fZW12YWxfZGVjcmVmAAQDZW52EV9lbXZhbF90YWtlX3ZhbHVlAAEDZW52DV9lbXZhbF9pbmNyZWYABANlbnYLX2VtdmFsX2NhbGwACgNlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19mdW5jdGlvbgAbDXdhc2lfdW5zdGFibGUIZmRfY2xvc2UAAA13YXNpX3Vuc3RhYmxlB2ZkX3JlYWQACg13YXNpX3Vuc3RhYmxlCGZkX3dyaXRlAAoDZW52Bl9fbG9jawAEA2VudghfX3VubG9jawAEDXdhc2lfdW5zdGFibGURZW52aXJvbl9zaXplc19nZXQAAQ13YXNpX3Vuc3RhYmxlC2Vudmlyb25fZ2V0AAEDZW52Cl9fbWFwX2ZpbGUAAQNlbnYLX19zeXNjYWxsOTEAAQNlbnYKc3RyZnRpbWVfbAALA2VudgVhYm9ydAAHA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQAAgNlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAA4DZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwACA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAgDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwAAgNlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAA4DZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQACANlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAIA2VudhZlbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwAAADZW52FWVtc2NyaXB0ZW5fbWVtY3B5X2JpZwAFA2VudgtzZXRUZW1wUmV0MAAEDXdhc2lfdW5zdGFibGUHZmRfc2VlawALA2VudgZtZW1vcnkCAYAIgAgDZW52BXRhYmxlAXAAjgMDzAvKCwMHFU0VTgdCBwcHBwcHBwcABwMDAwMDAAMDBAMDAAMDAwEEAAAABAwCAgIPAg8PDw8PDw8PAAIEAgQrEksEAkoPDw8PBAcAAQUDBwABBQMEAQABKwASEhIPLgAABQEAAQAABgACAAUFAAEAAwECAAAAAAAAAAACAAAAAAEFAAICAgUAAgAABAEBAAAACAgAAAgIAgQAAAESEhISFS4CDw8AAwMDAAADAAACAQoAAAMBAQEFAgED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IAAgAEEgEIABNgJMCyAALABMC8QBAQR/IwBBEGsiCCQAAkAgAEUEQEEAIQYMAQsgBBCIASEHQQAhBiACIAFrIglBAU4EQCAAIAEgCRCJASAJRw0BCyAHIAMgAWsiBmtBACAHIAZKGyIBQQFOBEAgACAIIAEgBRCKASIGEIsBIAEQiQEhByAGEJwKGkEAIQYgASAHRw0BIABBACABIAdGGyEACyADIAJrIgFBAU4EQEEAIQYgACACIAEQiQEgAUcNAQsgBEEAEIwBGiAAIQYLIAhBEGokACAGCwgAIAAoAgBFCwkAIAAgARCQAQsHACAAKAIMCxMAIAAgASACIAAoAgAoAjARBQALEwAgABCRARogACABIAIQpwogAAsKACAAEJIBEJMBCxQBAX8gACgCDCECIAAgATYCDCACCwcAIAAQtwELBABBfwsHACAAIAFGCw8AIAAgACgCECABchD6AgsQACAAEJQBGiAAEJUBGiAACxUAIAAQrAEEQCAAEK0BDwsgABCuAQsEACAACxIAIABCADcCACAAQQA2AgggAAsKACAAEJMBGiAACw0AIAAQlwEQmAFBcGoLBwAgABCaAQsHACAAEKcBCwwAIAAQmgEgAToACwsHACAAEJMBCwoAIAAQmgEQmgELKgEBf0EKIQEgAEELTwR/IABBAWoQnQEiACAAQX9qIgAgAEELRhsFIAELCwoAIABBD2pBcHELCwAgACABQQAQnwELGwAgABCoASABSQRAQboKEKkBAAsgAUEBEKoBCwcAIAAQmgELDAAgABCaASABNgIACxMAIAAQmgEgAUGAgICAeHI2AggLDAAgABCaASABNgIECxYAIAEEQCAAIAIQpQEgARDHCxoLIAALCAAgAEH/AXELDAAgACABLQAAOgAACwcAIAAQqAELBABBfwsbAQF/QQgQBSIBIAAQqwEaIAFB0I4BQRwQBgALBwAgABCOCgsVACAAIAEQkwoaIABBsI4BNgIAIAALDQAgABCaASwAC0EASAsKACAAEJoBKAIACwoAIAAQmgEQmgELCwAgACABIAIQsAELCwAgASACQQEQswELCgAgABCaASgCAAsRACAAEJoBKAIIQf////8HcQsLACAAIAEgAhC0AQsJACAAIAEQtQELBwAgABC2AQsHACAAEI8KCwcAIAAoAhgLCwAgAEGswgEQ3gQLEQAgACABIAAoAgAoAhwRAQALCgAgACoCBBC+AQs/AQF8IAAqAgQiAbsiAiACoEQAAABg+yEZwKNEAAAAAAAA8D+gtiAAIAFD2w/JQJUgACoCCEPbD8lAlRC/AZMLpgEBAn0gACAAKgIEIgFD2w/JQJUgACoCCEPbD8lAlRC/ASEDIAAqAgghAiAAIAAqAgRD2w/JQJW7RAAAAAAAAOA/oEQAAAAAAADwPxDCC7YgAkPbD8lAlRC/ASECAn8gA0MAAIA/QwAAgL8gAUPbD0lAXxuSIgGLQwAAAE9dBEAgAagMAQtBgICAgHgLsiACkyIBi0MAAABPXQRAIAGosg8LQwAAAM8LKQAgACAAIAEQvAEgACoCCCIBlEMAAIA/IAGTIAAqAgyUkiIBOAIMIAELBwAgABC+AgteAQF9IAEgAl1BAXNFBEAgASAClSIBIAGSIAEgAZSTQwAAgL+SDwtDAAAAACEDQwAAgD8gApMgAV1BAXMEfSADBSABQwAAgL+SIAKVIgEgASABIAGUkpJDAACAP5ILCxwAIAAgATYCCCAAIAAqAgAgACoCBCABECY4AhQLIAAgACABECUiATgCBCAAIAAqAgAgASAAKAIIECY4AhQLIAAgACABECUiATgCACAAIAEgACoCBCAAKAIIECY4AhQLBQBBjAsLBQBBjAsLBQBBpAsLBQBBxAsLDwBBCBCOCiAAEJMBEIICCxUBAX8gACgCBCIBBEAgARD/AQsgAAsFAEG4DgsHACAAKAIACwsAIABCADcCACAACwoAIAAgARDSARoLDAAgACABENMBGiAAC2UBAX8jAEEgayIDJAAgACABNgIAQRQQjgohBCADQRhqIAIQ1AEhAiADQRBqEJMBGiAEIAEgAhDVARogACAENgIEIAIQzwEaIAMgATYCBCADIAE2AgAgACADENYBIANBIGokACAACwoAIAAQ0AEaIAALCwAgACgCABAHIAALBQBBqA4LCwAgACABNgIAIAALNAEBfyMAQRBrIgIkACACQQhqIAEQkwEQ1wEhASAAENgBIAEQmgEQCDYCACACQRBqJAAgAAsMACAAIAEQ3QEaIAALWAEBfyMAQSBrIgMkACADIAE2AhQgAEEAEN4BGiAAQYAMNgIAIABBDGogA0EIaiADQRRqIAIQkwEQ3wEiAiADQRhqEJMBEOABGiACEOEBGiADQSBqJAAgAAsDAAELOwEBfyMAQRBrIgIkACACIAAQkwE2AgwgAkEMaiABEJMBEJMBENkBENoBIAJBDGoQ2wEgAkEQaiQAIAALBQAQ3AELDgAgACgCABAJIAAoAgALGQAgACgCACABNgIAIAAgACgCAEEIajYCAAsDAAELBQBB8AsLFAAgACABKAIAIgE2AgAgARAJIAALHAAgACABEOYBGiAAIAE2AgggAEG8jAE2AgAgAAsdACAAIAEQkwEQ5wEaIABBBGogAhCTARDoARogAAsaACAAIAEQkwEQ6QEaIAAgAhCTARDqARogAAsNACAAQQRqEOsBGiAACzgAIwBBEGsiASQAIAFBCGogABDjASABQQhqENABGiABEOQBIAAgARDlARogARDQARogAUEQaiQACwsAIAAgAUEdEPoBCwoAIABBARDSARoLHAAgACgCABAHIAAgASgCADYCACABQQA2AgAgAAsUACAAIAE2AgQgAEGEjAE2AgAgAAsRACAAIAEQkwEoAgA2AgAgAAsPACAAIAEQkwEQ9gEaIAALDwAgACABEJMBEPgBGiAACwoAIAEQkwEaIAALCgAgABDPARogAAsbACAAQYAMNgIAIABBDGoQ7QEaIAAQkwEaIAALCgAgABDhARogAAsKACAAEOwBEI8KCykAIABBDGoiABCaARDwASAAEJoBEJoBKAIAEOIBIAAQmgEQ8AEQzwEaCwoAIABBBGoQkwELJAEBf0EAIQIgAUH8DRDyAQR/IABBDGoQmgEQ8AEQkwEFIAILCw0AIAAoAgQgASgCBEYLOgEDfyMAQRBrIgEkACABQQhqIABBDGoiAhCaARD0ASEDIAIQmgEaIAMgABCaAUEBEPUBIAFBEGokAAsEACAACw4AIAEgAkEUbEEEELMBCwwAIAAgARD3ARogAAsVACAAIAEoAgA2AgAgAUEANgIAIAALHAAgACABKAIANgIAIABBBGogAUEEahD5ARogAAsMACAAIAEQ9gEaIAALQAECfyMAQRBrIgMkACADEPsBIQQgACABKAIAIANBCGoQ/AEgA0EIahD9ASAEEJoBIAIRCgAQ0gEaIANBEGokAAsoAQF/IwBBEGsiASQAIAEgABCTATYCDCABQQxqENsBIAFBEGokACAACwQAQQALBQAQ/gELBQBBhA4LDwAgABCAAgRAIAAQhQoLCygBAX9BACEBIABBBGoQgQJBf0YEfyAAIAAoAgAoAggRBABBAQUgAQsLEwAgACAAKAIAQX9qIgA2AgAgAAsfACAAIAEoAgA2AgAgACABKAIENgIEIAFCADcCACAAC40BAQR/IwBBMGsiASQAIAFBGGogAUEoahCTASICQQFBABCEAiABQRBqIAJBARCFAhCGAiIDEIcCIQQgAUEIaiACEPQBGiAEEIgCGiAAEMsBIgIgAxCHAhCJAjYCACACIAMQigI2AgQgASACKAIAIgA2AgQgASAANgIAIAIgARDWASADEIsCGiABQTBqJAALHwAgABCMAiABSQRAQboKEKkBAAsgAUHgAmxBBBCqAQsSACAAIAI2AgQgACABNgIAIAALLQEBfyMAQRBrIgMkACADIAE2AgwgACADQQxqIAIQkwEQjQIaIANBEGokACAACwoAIAAQmgEoAgALNwEBfyMAQRBrIgEkACAAQQAQ3gEaIABBxA42AgAgAEEMaiABQQhqEJMBEI4CGiABQRBqJAAgAAsNACAAQQxqEJoBEJMBCxoBAX8gABCaASgCACEBIAAQmgFBADYCACABCwsAIABBABCPAiAACwcAQYvd6AULHQAgACABEJMBEOcBGiAAQQRqIAIQkwEQkAIaIAALFQAgACABEJMBEOoBGiAAEJECGiAACycBAX8gABCaASgCACECIAAQmgEgATYCACACBEAgABDwASACEJsCCwsRACAAIAEQkwEpAgA3AgAgAAsKACAAEJYCGiAACw0AIAAQkwEaIAAQjwoLCwAgAEEMahCaARoLOgEDfyMAQRBrIgEkACABQQhqIABBDGoiAhCaARD0ASEDIAIQmgEaIAMgABCaAUEBEJUCIAFBEGokAAsPACABIAJB4AJsQQQQswELkgEAIAAQlwIaIABBIGoQlwIaIABBQGtDAACAP0MAAAA/QwAAAD9DAAAAP0NmZmY/EJgCGiAAQc2Zs+4DNgK0ASAAQbgBahCZAhogAEKAgID6AzcCzAEgAEHUAWpDAACAP0MAAAC/QwrXIzxDAAAAQEMAAAAAEJgCGiAAQYCIsbkENgLQAiAAQc2Zs/oDNgLIAiAACykAIABCADcCBCAAQoCAgPiDgJGWxwA3AhggAEEANgIUIABCADcCDCAAC7cBACAAQQA2AgQgAEEIakEBAn8gAxAl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QQhqIAMgAkEBQQAQvAIhAiADKwMAIQUgBEF/TARAIAEgBZo5AwBBACACayECDAELIAEgBTkDAAsgA0EQaiQAIAILkgMCA38BfCMAQRBrIgIkAAJAIAC8IgNB/////wdxIgFB2p+k+gNNBEAgAUGAgIDMA0kNASAAuxC5AiEADAELIAFB0aftgwRNBEAgALshBCABQeOX24AETQRAIANBf0wEQCAERBgtRFT7Ifk/oBC6AowhAAwDCyAERBgtRFT7Ifm/oBC6AiEADAILRBgtRFT7IQlARBgtRFT7IQnAIANBAEgbIASgmhC5AiEADAELIAFB1eOIhwRNBEAgALshBCABQd/bv4UETQRAIANBf0wEQCAERNIhM3982RJAoBC6AiEADAMLIARE0iEzf3zZEsCgELoCjCEADAILRBgtRFT7IRlARBgtRFT7IRnAIANBAEgbIASgELkCIQAMAQsgAUGAgID8B08EQCAAIACTIQAMAQsgACACQQhqEL0CQQNxIgFBAk0EQAJAAkACQCABQQFrDgIBAgALIAIrAwgQuQIhAAwDCyACKwMIELoCIQAMAgsgAisDCJoQuQIhAAwBCyACKwMIELoCjCEACyACQRBqJAAgAAuQAgICfwJ9AkACQCAAvCIBQYCAgARPQQAgAUF/ShtFBEAgAUH/////B3FFBEBDAACAvyAAIACUlQ8LIAFBf0wEQCAAIACTQwAAAACVDwsgAEMAAABMlLwhAUHofiECDAELIAFB////+wdLDQFBgX8hAkMAAAAAIQAgAUGAgID8A0YNAQsgAiABQY32qwJqIgFBF3ZqsiIDQ4BxMT+UIAFB////A3FB84nU+QNqvkMAAIC/kiIAIAND0fcXN5QgACAAQwAAAECSlSIDIAAgAEMAAAA/lJQiBCADIAOUIgAgACAAlCIAQ+7pkT6UQ6qqKj+SlCAAIABDJp54PpRDE87MPpKUkpKUkiAEk5KSIQALIAALMwEBfyACBEAgACEDA0AgAyABKAIANgIAIANBBGohAyABQQRqIQEgAkF/aiICDQALCyAACwgAEMICQQBKCwQAEDULCgAgABDEAhogAAs8ACAAQagpNgIAIABBABDFAiAAQRxqENkEGiAAKAIgEL0LIAAoAiQQvQsgACgCMBC9CyAAKAI8EL0LIAALPAECfyAAKAIoIQIDQCACBEAg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AUUEQCADDQFBACEEDAMLQX4hBCACRQ0CIAAgB0EMaiAAGyEGAkAgAwRAIAIhAAwBCyABLQAAIgNBGHRBGHUiAEEATgRAIAYgAzYCACAAQQBHIQQMBAsQ8AMoArwBKAIAIQMgASwAACEAIANFBEAgBiAAQf+/A3E2AgBBASEEDAQLIABB/wFxQb5+aiIDQTJLDQEgA0ECdEHQM2ooAgAhAyACQX9qIgBFDQIgAUEBaiEBCyABLQAAIghBA3YiCUFwaiADQRp1IAlqckEHSw0AA0AgAEF/aiEAIAhBgH9qIANBBnRyIgNBAE4EQCAFQQA2AgAgBiADNgIAIAIgAGshBAwECyAARQ0CIAFBAWoiAS0AACIIQcABcUGAAUYNAAsLIAVBADYCABClA0EZNgIAQX8hBAwBCyAFIAM2AgALIAdBEGokACAECwUAEO4DCxEAIABFBEBBAQ8LIAAoAgBFC1ABAX4CQCADQcAAcQRAIAEgA0FAaq2GIQJCACEBDAELIANFDQAgAiADrSIEhiABQcAAIANrrYiEIQIgASAEhiEBCyAAIAE3AwAgACACNwMIC9cBAgR/An4jAEEQayIDJAAgAbwiBEGAgICAeHEhBQJ+IARB/////wdxIgJBgICAfGpB////9wdNBEBCACEGIAKtQhmGQoCAgICAgIDAP3wMAQsgAkGAgID8B08EQEIAIQYgBK1CGYZCgICAgICAwP//AIQMAQsgAkUEQEIAIQZCAAwBCyADIAKtQgAgAmciAkHRAGoQ8gMgAykDACEGIAMpAwhCgICAgICAwACFQYn/ACACa61CMIaECyEHIAAgBjcDACAAIAcgBa1CIIaENwMIIANBEGokAAtgAQF+AkACfiADQcAAcQRAIAIgA0FAaq2IIQFCACECQgAMAQsgA0UNASACQcAAIANrrYYgASADrSIEiIQhASACIASIIQJCAAshBCABIASEIQELIAAgATcDACAAIAI3AwgLogsCBX8PfiMAQeAAayIFJAAgBEIvhiADQhGIhCEOIAJCIIYgAUIgiIQhCyAEQv///////z+DIgxCD4YgA0IxiIQhECACIASFQoCAgICAgICAgH+DIQogDEIRiCERIAJC////////P4MiDUIgiCESIARCMIinQf//AXEhBgJAAn8gAkIwiKdB//8BcSIIQX9qQf3/AU0EQEEAIAZBf2pB/v8BSQ0BGgsgAVAgAkL///////////8AgyIPQoCAgICAgMD//wBUIA9CgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhCgwCCyADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURtFBEAgBEKAgICAgIAghCEKIAMhAQwCCyABIA9CgICAgICAwP//AIWEUARAIAIgA4RQBEBCgICAgICA4P//ACEKQgAhAQwDCyAKQoCAgICAgMD//wCEIQpCACEBDAILIAMgAkKAgICAgIDA//8AhYRQBEAgASAPhCECQgAhASACUARAQoCAgICAgOD//wAhCgwDCyAKQoCAgICAgMD//wCEIQoMAgsgASAPhFAEQEIAIQEMAgsgAiADhFAEQEIAIQEMAgtBACEHIA9C////////P1gEQCAFQdAAaiABIA0gASANIA1QIgcbeSAHQQZ0rXynIgdBcWoQ8gMgBSkDWCINQiCGIAUpA1AiAUIgiIQhCyANQiCIIRJBECAHayEHCyAHIAJC////////P1YNABogBUFAayADIAwgAyAMIAxQIgkbeSAJQQZ0rXynIglBcWoQ8gMgBSkDSCICQg+GIAUpA0AiA0IxiIQhECACQi+GIANCEYiEIQ4gAkIRiCERIAcgCWtBEGoLIQcgDkL/////D4MiAiABQv////8PgyIEfiITIANCD4ZCgID+/w+DIgEgC0L/////D4MiA358Ig5CIIYiDCABIAR+fCILIAxUrSACIAN+IhUgASANQv////8PgyIMfnwiDyAQQv////8PgyINIAR+fCIQIA4gE1StQiCGIA5CIIiEfCITIAIgDH4iFiABIBJCgIAEhCIOfnwiEiADIA1+fCIUIBFC/////weDQoCAgIAIhCIBIAR+fCIRQiCGfCIXfCEEIAYgCGogB2pBgYB/aiEGAkAgDCANfiIYIAIgDn58IgIgGFStIAIgASADfnwiAyACVK18IAMgDyAVVK0gECAPVK18fCICIANUrXwgASAOfnwgASAMfiIDIA0gDn58IgEgA1StQiCGIAFCIIiEfCACIAFCIIZ8IgEgAlStfCABIBEgFFStIBIgFlStIBQgElStfHxCIIYgEUIgiIR8IgMgAVStfCADIBMgEFStIBcgE1StfHwiAiADVK18IgFCgICAgICAwACDUEUEQCAGQQFqIQYMAQsgC0I/iCEDIAFCAYYgAkI/iIQhASACQgGGIARCP4iEIQIgC0IBhiELIAMgBEIBhoQhBAsgBkH//wFOBEAgCkKAgICAgIDA//8AhCEKQgAhAQwBCwJ+IAZBAEwEQEEBIAZrIghB/wBNBEAgBUEQaiALIAQgCBD0AyAFQSBqIAIgASAGQf8AaiIGEPIDIAVBMGogCyAEIAYQ8gMgBSACIAEgCBD0AyAFKQMwIAUpAziEQgBSrSAFKQMgIAUpAxCEhCELIAUpAyggBSkDGIQhBCAFKQMAIQIgBSkDCAwCC0IAIQEMAgsgAUL///////8/gyAGrUIwhoQLIAqEIQogC1AgBEJ/VSAEQoCAgICAgICAgH9RG0UEQCAKIAJCAXwiASACVK18IQoMAQsgCyAEQoCAgICAgICAgH+FhFBFBEAgAiEBDAELIAogAiACQgGDfCIBIAJUrXwhCgsgACABNwMAIAAgCjcDCCAFQeAAaiQAC4MBAgJ/AX4jAEEQayIDJAAgAAJ+IAFFBEBCACEEQgAMAQsgAyABIAFBH3UiAmogAnMiAq1CACACZyICQdEAahDyAyADKQMIQoCAgICAgMAAhUGegAEgAmutQjCGfCABQYCAgIB4ca1CIIaEIQQgAykDAAs3AwAgACAENwMIIANBEGokAAvICQIEfwR+IwBB8ABrIgUkACAEQv///////////wCDIQoCQAJAIAFCf3wiCUJ/USACQv///////////wCDIgsgCSABVK18Qn98IglC////////v///AFYgCUL///////+///8AURtFBEAgA0J/fCIJQn9SIAogCSADVK18Qn98IglC////////v///AFQgCUL///////+///8AURsNAQsgAVAgC0KAgICAgIDA//8AVCALQoCAgICAgMD//wBRG0UEQCACQoCAgICAgCCEIQQgASEDDAILIANQIApCgICAgICAwP//AFQgCkKAgICAgIDA//8AURtFBEAgBEKAgICAgIAghCEEDAILIAEgC0KAgICAgIDA//8AhYRQBEBCgICAgICA4P//ACACIAEgA4UgAiAEhUKAgICAgICAgIB/hYRQIgYbIQRCACABIAYbIQMMAgsgAyAKQoCAgICAgMD//wCFhFANASABIAuEUARAIAMgCoRCAFINAiABIAODIQMgAiAEgyEEDAILIAMgCoRQRQ0AIAEhAyACIQQMAQsgAyABIAMgAVYgCiALViAKIAtRGyIHGyEKIAQgAiAHGyILQv///////z+DIQkgAiAEIAcbIgJCMIinQf//AXEhCCALQjCIp0H//wFxIgZFBEAgBUHgAGogCiAJIAogCSAJUCIGG3kgBkEGdK18pyIGQXFqEPIDIAUpA2ghCSAFKQNgIQpBECAGayEGCyABIAMgBxshAyACQv///////z+DIQEgCAR+IAEFIAVB0ABqIAMgASADIAEgAVAiBxt5IAdBBnStfKciB0FxahDyA0EQIAdrIQggBSkDUCEDIAUpA1gLQgOGIANCPYiEQoCAgICAgIAEhCEEIAlCA4YgCkI9iIQhASACIAuFIQkCfiADQgOGIgMgBiAIayIHRQ0AGiAHQf8ASwRAQgAhBEIBDAELIAVBQGsgAyAEQYABIAdrEPIDIAVBMGogAyAEIAcQ9AMgBSkDOCEEIAUpAzAgBSkDQCAFKQNIhEIAUq2ECyEDIAFCgICAgICAgASEIQwgCkIDhiECAkAgCUJ/VwRAIAIgA30iASAMIAR9IAIgA1StfSIDhFAEQEIAIQNCACEEDAMLIANC/////////wNWDQEgBUEgaiABIAMgASADIANQIgcbeSAHQQZ0rXynQXRqIgcQ8gMgBiAHayEGIAUpAyghAyAFKQMgIQEMAQsgAiADfCIBIANUrSAEIAx8fCIDQoCAgICAgIAIg1ANACABQgGDIANCP4YgAUIBiISEIQEgBkEBaiEGIANCAYghAwsgC0KAgICAgICAgIB/gyEEIAZB//8BTgRAIARCgICAgICAwP//AIQhBEIAIQMMAQtBACEHAkAgBkEASgRAIAYhBwwBCyAFQRBqIAEgAyAGQf8AahDyAyAFIAEgA0EBIAZrEPQDIAUpAwAgBSkDECAFKQMYhEIAUq2EIQEgBSkDCCEDCyADQgOIQv///////z+DIASEIAetQjCGhCADQj2GIAFCA4iEIgQgAadBB3EiBkEES618IgMgBFStfCADQgGDQgAgBkEERhsiASADfCIDIAFUrXwhBAsgACADNwMAIAAgBDcDCCAFQfAAaiQAC4UCAgJ/BH4jAEEQayICJAAgAb0iBUKAgICAgICAgIB/gyEHAn4gBUL///////////8AgyIEQoCAgICAgIB4fEL/////////7/8AWARAIARCPIYhBiAEQgSIQoCAgICAgICAPHwMAQsgBEKAgICAgICA+P8AWgRAIAVCPIYhBiAFQgSIQoCAgICAgMD//wCEDAELIARQBEBCACEGQgAMAQsgAiAEQgAgBEKAgICAEFoEfyAEQiCIp2cFIAWnZ0EgagsiA0ExahDyAyACKQMAIQYgAikDCEKAgICAgIDAAIVBjPgAIANrrUIwhoQLIQQgACAGNwMAIAAgBCAHhDcDCCACQRBqJAAL2wECAX8CfkEBIQQCQCAAQgBSIAFC////////////AIMiBUKAgICAgIDA//8AViAFQoCAgICAgMD//wBRGw0AIAJCAFIgA0L///////////8AgyIGQoCAgICAgMD//wBWIAZCgICAgICAwP//AFEbDQAgACAChCAFIAaEhFAEQEEADwsgASADg0IAWQRAQX8hBCAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwtBfyEEIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAvTAQIBfwJ+QX8hBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNACAAIAKEIAUgBoSEUARAQQAPCyABIAODQgBZBEAgACACVCABIANTIAEgA1EbDQEgACAChSABIAOFhEIAUg8LIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAs1ACAAIAE3AwAgACACQv///////z+DIARCMIinQYCAAnEgAkIwiKdB//8BcXKtQjCGhDcDCAtoAgF/AX4jAEEQayICJAAgAAJ+IAFFBEBCACEDQgAMAQsgAiABrUIAIAFnIgFB0QBqEPIDIAIpAwhCgICAgICAwACFQZ6AASABa61CMIZ8IQMgAikDAAs3AwAgACADNwMIIAJBEGokAAtFAQF/IwBBEGsiBSQAIAUgASACIAMgBEKAgICAgICAgIB/hRD3AyAFKQMAIQEgACAFKQMINwMIIAAgATcDACAFQRBqJAALxAIBAX8jAEHQAGsiBCQAAkAgA0GAgAFOBEAgBEEgaiABIAJCAEKAgICAgICA//8AEPUDIAQpAyghAiAEKQMgIQEgA0H//wFIBEAgA0GBgH9qIQMMAgsgBEEQaiABIAJCAEKAgICAgICA//8AEPUDIANB/f8CIANB/f8CSBtBgoB+aiEDIAQpAxghAiAEKQMQIQEMAQsgA0GBgH9KDQAgBEFAayABIAJCAEKAgICAgIDAABD1AyAEKQNIIQIgBCkDQCEBIANBg4B+SgRAIANB/v8AaiEDDAELIARBMGogASACQgBCgICAgICAwAAQ9QMgA0GGgH0gA0GGgH1KG0H8/wFqIQMgBCkDOCECIAQpAzAhAQsgBCABIAJCACADQf//AGqtQjCGEPUDIAAgBCkDCDcDCCAAIAQpAwA3AwAgBEHQAGokAAvnEAIFfwx+IwBBwAFrIgUkACAEQv///////z+DIRIgAkL///////8/gyEOIAIgBIVCgICAgICAgICAf4MhESAEQjCIp0H//wFxIQcCQAJAAkAgAkIwiKdB//8BcSIJQX9qQf3/AU0EQEEAIQYgB0F/akH+/wFJDQELIAFQIAJC////////////AIMiC0KAgICAgIDA//8AVCALQoCAgICAgMD//wBRG0UEQCACQoCAgICAgCCEIREMAgsgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbRQRAIARCgICAgICAIIQhESADIQEMAgsgASALQoCAgICAgMD//wCFhFAEQCADIAJCgICAgICAwP//AIWEUARAQgAhAUKAgICAgIDg//8AIREMAwsgEUKAgICAgIDA//8AhCERQgAhAQwCCyADIAJCgICAgICAwP//AIWEUARAQgAhAQwCCyABIAuEUA0CIAIgA4RQBEAgEUKAgICAgIDA//8AhCERQgAhAQwCC0EAIQYgC0L///////8/WARAIAVBsAFqIAEgDiABIA4gDlAiBht5IAZBBnStfKciBkFxahDyA0EQIAZrIQYgBSkDuAEhDiAFKQOwASEBCyACQv///////z9WDQAgBUGgAWogAyASIAMgEiASUCIIG3kgCEEGdK18pyIIQXFqEPIDIAYgCGpBcGohBiAFKQOoASESIAUpA6ABIQMLIAVBkAFqIBJCgICAgICAwACEIhRCD4YgA0IxiIQiAkIAQoTJ+c6/5ryC9QAgAn0iBEIAEOwDIAVBgAFqQgAgBSkDmAF9QgAgBEIAEOwDIAVB8ABqIAUpA4gBQgGGIAUpA4ABQj+IhCIEQgAgAkIAEOwDIAVB4ABqIARCAEIAIAUpA3h9QgAQ7AMgBUHQAGogBSkDaEIBhiAFKQNgQj+IhCIEQgAgAkIAEOwDIAVBQGsgBEIAQgAgBSkDWH1CABDsAyAFQTBqIAUpA0hCAYYgBSkDQEI/iIQiBEIAIAJCABDsAyAFQSBqIARCAEIAIAUpAzh9QgAQ7AMgBUEQaiAFKQMoQgGGIAUpAyBCP4iEIgRCACACQgAQ7AMgBSAEQgBCACAFKQMYfUIAEOwDIAYgCSAHa2ohBwJ+QgAgBSkDCEIBhiAFKQMAQj+IhEJ/fCILQv////8PgyIEIAJCIIgiDH4iECALQiCIIgsgAkL/////D4MiCn58IgJCIIYiDSAEIAp+fCIKIA1UrSALIAx+IAIgEFStQiCGIAJCIIiEfHwgCiAEIANCEYhC/////w+DIgx+IhAgCyADQg+GQoCA/v8PgyINfnwiAkIghiIPIAQgDX58IA9UrSALIAx+IAIgEFStQiCGIAJCIIiEfHx8IgIgClStfCACQgBSrXx9IgpC/////w+DIgwgBH4iECALIAx+Ig0gBCAKQiCIIg9+fCIKQiCGfCIMIBBUrSALIA9+IAogDVStQiCGIApCIIiEfHwgDEIAIAJ9IgJCIIgiCiAEfiIQIAJC/////w+DIg0gC358IgJCIIYiDyAEIA1+fCAPVK0gCiALfiACIBBUrUIghiACQiCIhHx8fCICIAxUrXwgAkJ+fCIQIAJUrXxCf3wiCkL/////D4MiAiAOQgKGIAFCPoiEQv////8PgyIEfiIMIAFCHohC/////w+DIgsgCkIgiCIKfnwiDSAMVK0gDSAQQiCIIgwgDkIeiEL//+//D4NCgIAQhCIOfnwiDyANVK18IAogDn58IAIgDn4iEyAEIAp+fCINIBNUrUIghiANQiCIhHwgDyANQiCGfCINIA9UrXwgDSALIAx+IhMgEEL/////D4MiECAEfnwiDyATVK0gDyACIAFCAoZC/P///w+DIhN+fCIVIA9UrXx8Ig8gDVStfCAPIAogE34iDSAOIBB+fCIKIAQgDH58IgQgAiALfnwiAkIgiCACIARUrSAKIA1UrSAEIApUrXx8QiCGhHwiCiAPVK18IAogFSAMIBN+IgQgCyAQfnwiC0IgiCALIARUrUIghoR8IgQgFVStIAQgAkIghnwgBFStfHwiBCAKVK18IgJC/////////wBYBEAgAUIxhiAEQv////8PgyIBIANC/////w+DIgt+IgpCAFKtfUIAIAp9IhAgBEIgiCIKIAt+Ig0gASADQiCIIgx+fCIOQiCGIg9UrX0gAkL/////D4MgC34gASASQv////8Pg358IAogDH58IA4gDVStQiCGIA5CIIiEfCAEIBRCIIh+IAMgAkIgiH58IAIgDH58IAogEn58QiCGfH0hCyAHQX9qIQcgECAPfQwBCyAEQiGIIQwgAUIwhiACQj+GIARCAYiEIgRC/////w+DIgEgA0L/////D4MiC34iCkIAUq19QgAgCn0iECABIANCIIgiCn4iDSAMIAJCH4aEIg9C/////w+DIg4gC358IgxCIIYiE1StfSAKIA5+IAJCAYgiDkL/////D4MgC358IAEgEkL/////D4N+fCAMIA1UrUIghiAMQiCIhHwgBCAUQiCIfiADIAJCIYh+fCAKIA5+fCAPIBJ+fEIghnx9IQsgDiECIBAgE30LIQEgB0GAgAFOBEAgEUKAgICAgIDA//8AhCERQgAhAQwBCyAHQYGAf0wEQEIAIQEMAQsgBCABQgGGIANaIAtCAYYgAUI/iIQiASAUWiABIBRRG618IgEgBFStIAJC////////P4MgB0H//wBqrUIwhoR8IBGEIRELIAAgATcDACAAIBE3AwggBUHAAWokAA8LIABCADcDACAAIBFCgICAgICA4P//ACACIAOEQgBSGzcDCCAFQcABaiQAC9kDAgJ/An4jAEEgayICJAACQCABQv///////////wCDIgRCgICAgICAwP9DfCAEQoCAgICAgMCAvH98VARAIAFCBIYgAEI8iIQhBCAAQv//////////D4MiAEKBgICAgICAgAhaBEAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIBAfSEFIABCgICAgICAgIAIhUIAUg0BIAVCAYMgBXwhBQwBCyAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbRQRAIAFCBIYgAEI8iIRC/////////wODQoCAgICAgID8/wCEIQUMAQtCgICAgICAgPj/ACEFIARC////////v//DAFYNAEIAIQUgBEIwiKciA0GR9wBJDQAgAiAAIAFC////////P4NCgICAgICAwACEIgRBgfgAIANrEPQDIAJBEGogACAEIANB/4h/ahDyAyACKQMIQgSGIAIpAwAiBEI8iIQhBSACKQMQIAIpAxiEQgBSrSAEQv//////////D4OEIgRCgYCAgICAgIAIWgRAIAVCAXwhBQwBCyAEQoCAgICAgICACIVCAFINACAFQgGDIAV8IQULIAJBIGokACAFIAFCgICAgICAgICAf4OEvwsFACAAmQuwCAIGfwJ+IwBBMGsiBiQAQgAhCgJAIAJBAk0EQCABQQRqIQUgAkECdCICQew1aigCACEIIAJB4DVqKAIAIQkDQAJ/IAEoAgQiAiABKAJoSQRAIAUgAkEBajYCACACLQAADAELIAEQ6QMLIgIQ5wMNAAsCQCACQVVqIgRBAksEQEEBIQcMAQtBASEHIARBAWtFDQBBf0EBIAJBLUYbIQcgASgCBCICIAEoAmhJBEAgBSACQQFqNgIAIAItAAAhAgwBCyABEOkDIQILQQAhBAJAAkADQCAEQZw1aiwAACACQSByRgRAAkAgBEEGSw0AIAEoAgQiAiABKAJoSQRAIAUgAkEBajYCACACLQAAIQIMAQsgARDpAyECCyAEQQFqIgRBCEcNAQwCCwsgBEEDRwRAIARBCEYNASADRQ0CIARBBEkNAiAEQQhGDQELIAEoAmgiAQRAIAUgBSgCAEF/ajYCAAsgA0UNACAEQQRJDQADQCABBEAgBSAFKAIAQX9qNgIACyAEQX9qIgRBA0sNAAsLIAYgB7JDAACAf5QQ8wMgBikDCCELIAYpAwAhCgwCCwJAAkACQCAEDQBBACEEA0AgBEGlNWosAAAgAkEgckcNAQJAIARBAUsNACABKAIEIgIgASgCaEkEQCAFIAJBAWo2AgAgAi0AACECDAELIAEQ6QMhAgsgBEEBaiIEQQNHDQALDAELAkACQCAEQQNLDQAgBEEBaw4DAAACAQsgASgCaARAIAUgBSgCAEF/ajYCAAsQpQNBHDYCAAwCCwJAIAJBMEcNAAJ/IAEoAgQiBCABKAJoSQRAIAUgBEEBajYCACAELQAADAELIAEQ6QMLQSByQfgARgRAIAZBEGogASAJIAggByADEIMEIAYpAxghCyAGKQMQIQoMBQsgASgCaEUNACAFIAUoAgBBf2o2AgALIAZBIGogASACIAkgCCAHIAMQhAQgBikDKCELIAYpAyAhCgwDCwJAAn8gASgCBCICIAEoAmhJBEAgBSACQQFqNgIAIAItAAAMAQsgARDpAwtBKEYEQEEBIQQMAQtCgICAgICA4P//ACELIAEoAmhFDQMgBSAFKAIAQX9qNgIADAMLA0ACfyABKAIEIgIgASgCaEkEQCAFIAJBAWo2AgAgAi0AAAwBCyABEOkDCyICQb9/aiEHAkACQCACQVBqQQpJDQAgB0EaSQ0AIAJBn39qIQcgAkHfAEYNACAHQRpPDQELIARBAWohBAwBCwtCgICAgICA4P//ACELIAJBKUYNAiABKAJoIgIEQCAFIAUoAgBBf2o2AgALIAMEQCAERQ0DA0AgBEF/aiEEIAIEQCAFIAUoAgBBf2o2AgALIAQNAAsMAwsQpQNBHDYCAAsgAUIAEOgDQgAhCgtCACELCyAAIAo3AwAgACALNwMIIAZBMGokAAuDDgIIfwd+IwBBsANrIgYkAAJ/IAEoAgQiByABKAJoSQRAIAEgB0EBajYCBCAHLQAADAELIAEQ6QMLIQdBACEJQgAhEkEAIQoCQAJ/A0ACQCAHQTBHBEAgB0EuRw0EIAEoAgQiByABKAJoTw0BIAEgB0EBajYCBCAHLQAADAMLIAEoAgQiByABKAJoSQRAQQEhCiABIAdBAWo2AgQgBy0AACEHDAIFIAEQ6QMhB0EBIQoMAgsACwsgARDpAwshB0EBIQlCACESIAdBMEcNAANAIBJCf3whEgJ/IAEoAgQiByABKAJoSQRAIAEgB0EBajYCBCAHLQAADAELIAEQ6QMLIgdBMEYNAAtBASEJQQEhCgtCgICAgICAwP8/IQ9BACEIQgAhDkIAIRFCACETQQAhDEIAIRADQAJAIAdBIHIhCwJAAkAgB0FQaiINQQpJDQAgB0EuR0EAIAtBn39qQQVLGw0CIAdBLkcNACAJDQJBASEJIBAhEgwBCyALQal/aiANIAdBOUobIQcCQCAQQgdXBEAgByAIQQR0aiEIDAELIBBCHFcEQCAGQSBqIBMgD0IAQoCAgICAgMD9PxD1AyAGQTBqIAcQ9gMgBkEQaiAGKQMgIhMgBikDKCIPIAYpAzAgBikDOBD1AyAGIA4gESAGKQMQIAYpAxgQ9wMgBikDCCERIAYpAwAhDgwBCyAMDQAgB0UNACAGQdAAaiATIA9CAEKAgICAgICA/z8Q9QMgBkFAayAOIBEgBikDUCAGKQNYEPcDIAYpA0ghEUEBIQwgBikDQCEOCyAQQgF8IRBBASEKCyABKAIEIgcgASgCaEkEQCABIAdBAWo2AgQgBy0AACEHDAIFIAEQ6QMhBwwCCwALCwJ+IApFBEAgASgCaCIHBEAgASABKAIEQX9qNgIECwJAIAUEQCAHRQ0BIAEgASgCBEF/ajYCBCAJRQ0BIAdFDQEgASABKAIEQX9qNgIEDAELIAFCABDoAwsgBkHgAGogBLdEAAAAAAAAAACiEPgDIAYpA2AhDiAGKQNoDAELIBBCB1cEQCAQIQ8DQCAIQQR0IQggD0IHUyELIA9CAXwhDyALDQALCwJAIAdBIHJB8ABGBEAgASAFEIUEIg9CgICAgICAgICAf1INASAFBEBCACEPIAEoAmhFDQIgASABKAIEQX9qNgIEDAILQgAhDiABQgAQ6ANCAAwCC0IAIQ8gASgCaEUNACABIAEoAgRBf2o2AgQLIAhFBEAgBkHwAGogBLdEAAAAAAAAAACiEPgDIAYpA3AhDiAGKQN4DAELIBIgECAJG0IChiAPfEJgfCIQQQAgA2usVQRAIAZBoAFqIAQQ9gMgBkGQAWogBikDoAEgBikDqAFCf0L///////+///8AEPUDIAZBgAFqIAYpA5ABIAYpA5gBQn9C////////v///ABD1AxClA0HEADYCACAGKQOAASEOIAYpA4gBDAELIBAgA0GefmqsWQRAIAhBf0oEQANAIAZBoANqIA4gEUIAQoCAgICAgMD/v38Q9wMgDiARQgBCgICAgICAgP8/EPoDIQcgBkGQA2ogDiARIA4gBikDoAMgB0EASCIBGyARIAYpA6gDIAEbEPcDIBBCf3whECAGKQOYAyERIAYpA5ADIQ4gCEEBdCAHQX9KciIIQX9KDQALCwJ+IBAgA6x9QiB8Ig+nIgdBACAHQQBKGyACIA8gAqxTGyIHQfEATgRAIAZBgANqIAQQ9gMgBikDiAMhDyAGKQOAAyETQgAhFEIADAELIAZB0AJqIAQQ9gMgBkHgAmpEAAAAAAAA8D9BkAEgB2sQxAsQ+AMgBkHwAmogBikD4AIgBikD6AIgBikD0AIiEyAGKQPYAiIPEPsDIAYpA/gCIRQgBikD8AILIRIgBkHAAmogCCAIQQFxRSAOIBFCAEIAEPkDQQBHIAdBIEhxcSIHahD8AyAGQbACaiATIA8gBikDwAIgBikDyAIQ9QMgBkGgAmpCACAOIAcbQgAgESAHGyATIA8Q9QMgBkGQAmogBikDsAIgBikDuAIgEiAUEPcDIAZBgAJqIAYpA6ACIAYpA6gCIAYpA5ACIAYpA5gCEPcDIAZB8AFqIAYpA4ACIAYpA4gCIBIgFBD9AyAGKQPwASIOIAYpA/gBIhFCAEIAEPkDRQRAEKUDQcQANgIACyAGQeABaiAOIBEgEKcQ/gMgBikD4AEhDiAGKQPoAQwBCyAGQdABaiAEEPYDIAZBwAFqIAYpA9ABIAYpA9gBQgBCgICAgICAwAAQ9QMgBkGwAWogBikDwAEgBikDyAFCAEKAgICAgIDAABD1AxClA0HEADYCACAGKQOwASEOIAYpA7gBCyEQIAAgDjcDACAAIBA3AwggBkGwA2okAAuwHAMMfwZ+AXwjAEGAxgBrIgckAEEAIQpBACADIARqIhFrIRJCACETQQAhCQJAAn8DQAJAIAJBMEcEQCACQS5HDQQgASgCBCIIIAEoAmhPDQEgASAIQQFqNgIEIAgtAAAMAwsgASgCBCIIIAEoAmhJBEBBASEJIAEgCEEBajYCBCAILQAAIQIMAgUgARDpAyECQQEhCQwCCwALCyABEOkDCyECQQEhCkIAIRMgAkEwRw0AA0AgE0J/fCETAn8gASgCBCIIIAEoAmhJBEAgASAIQQFqNgIEIAgtAAAMAQsgARDpAwsiAkEwRg0AC0EBIQlBASEKC0EAIQ4gB0EANgKABiACQVBqIQwgAAJ+AkACQAJAAkACQAJAIAJBLkYiCw0AQgAhFCAMQQlNDQBBACEIQQAhDQwBC0IAIRRBACENQQAhCEEAIQ4DQAJAIAtBAXEEQCAKRQRAIBQhE0EBIQoMAgsgCUEARyEJDAQLIBRCAXwhFCAIQfwPTARAIBSnIA4gAkEwRxshDiAHQYAGaiAIQQJ0aiIJIA0EfyACIAkoAgBBCmxqQVBqBSAMCzYCAEEBIQlBACANQQFqIgIgAkEJRiICGyENIAIgCGohCAwBCyACQTBGDQAgByAHKALwRUEBcjYC8EULAn8gASgCBCICIAEoAmhJBEAgASACQQFqNgIEIAItAAAMAQsgARDpAwsiAkFQaiEMIAJBLkYiCw0AIAxBCkkNAAsLIBMgFCAKGyETAkAgCUUNACACQSByQeUARw0AAkAgASAGEIUEIhVCgICAgICAgICAf1INACAGRQ0EQgAhFSABKAJoRQ0AIAEgASgCBEF/ajYCBAsgEyAVfCETDAQLIAlBAEchCSACQQBIDQELIAEoAmhFDQAgASABKAIEQX9qNgIECyAJDQEQpQNBHDYCAAsgAUIAEOgDQgAhE0IADAELIAcoAoAGIgFFBEAgByAFt0QAAAAAAAAAAKIQ+AMgBykDCCETIAcpAwAMAQsCQCAUQglVDQAgEyAUUg0AIANBHkxBACABIAN2Gw0AIAdBIGogARD8AyAHQTBqIAUQ9gMgB0EQaiAHKQMwIAcpAzggBykDICAHKQMoEPUDIAcpAxghEyAHKQMQDAELIBMgBEF+baxVBEAgB0HgAGogBRD2AyAHQdAAaiAHKQNgIAcpA2hCf0L///////+///8AEPUDIAdBQGsgBykDUCAHKQNYQn9C////////v///ABD1AxClA0HEADYCACAHKQNIIRMgBykDQAwBCyATIARBnn5qrFMEQCAHQZABaiAFEPYDIAdBgAFqIAcpA5ABIAcpA5gBQgBCgICAgICAwAAQ9QMgB0HwAGogBykDgAEgBykDiAFCAEKAgICAgIDAABD1AxClA0HEADYCACAHKQN4IRMgBykDcAwBCyANBEAgDUEITARAIAdBgAZqIAhBAnRqIgkoAgAhAQNAIAFBCmwhASANQQhIIQIgDUEBaiENIAINAAsgCSABNgIACyAIQQFqIQgLIBOnIQoCQCAOQQhKDQAgDiAKSg0AIApBEUoNACAKQQlGBEAgB0GwAWogBygCgAYQ/AMgB0HAAWogBRD2AyAHQaABaiAHKQPAASAHKQPIASAHKQOwASAHKQO4ARD1AyAHKQOoASETIAcpA6ABDAILIApBCEwEQCAHQYACaiAHKAKABhD8AyAHQZACaiAFEPYDIAdB8AFqIAcpA5ACIAcpA5gCIAcpA4ACIAcpA4gCEPUDIAdB4AFqQQAgCmtBAnRB4DVqKAIAEPYDIAdB0AFqIAcpA/ABIAcpA/gBIAcpA+ABIAcpA+gBEP8DIAcpA9gBIRMgBykD0AEMAgsgAyAKQX1sakEbaiICQR5MQQAgBygCgAYiASACdhsNACAHQdACaiABEPwDIAdB4AJqIAUQ9gMgB0HAAmogBykD4AIgBykD6AIgBykD0AIgBykD2AIQ9QMgB0GwAmogCkECdEGYNWooAgAQ9gMgB0GgAmogBykDwAIgBykDyAIgBykDsAIgBykDuAIQ9QMgBykDqAIhEyAHKQOgAgwBC0EAIQ0CQCAKQQlvIgFFBEBBACECDAELIAEgAUEJaiAKQX9KGyEGAkAgCEUEQEEAIQJBACEIDAELQYCU69wDQQAgBmtBAnRB4DVqKAIAIgttIQ9BACEJQQAhAUEAIQIDQCAHQYAGaiABQQJ0aiIMIAwoAgAiDCALbiIOIAlqIgk2AgAgAkEBakH/D3EgAiAJRSABIAJGcSIJGyECIApBd2ogCiAJGyEKIA8gDCALIA5sa2whCSABQQFqIgEgCEcNAAsgCUUNACAHQYAGaiAIQQJ0aiAJNgIAIAhBAWohCAsgCiAGa0EJaiEKCwNAIAdBgAZqIAJBAnRqIQ4CQANAIApBJE4EQCAKQSRHDQIgDigCAEHR6fkETw0CCyAIQf8PaiEMQQAhCSAIIQsDQCALIQgCf0EAIAmtIAdBgAZqIAxB/w9xIgFBAnRqIgs1AgBCHYZ8IhNCgZTr3ANUDQAaIBMgE0KAlOvcA4AiFEKAlOvcA359IRMgFKcLIQkgCyATpyIMNgIAIAggCCAIIAEgDBsgASACRhsgASAIQX9qQf8PcUcbIQsgAUF/aiEMIAEgAkcNAAsgDUFjaiENIAlFDQALIAsgAkF/akH/D3EiAkYEQCAHQYAGaiALQf4PakH/D3FBAnRqIgEgASgCACAHQYAGaiALQX9qQf8PcSIIQQJ0aigCAHI2AgALIApBCWohCiAHQYAGaiACQQJ0aiAJNgIADAELCwJAA0AgCEEBakH/D3EhBiAHQYAGaiAIQX9qQf8PcUECdGohEANAQQlBASAKQS1KGyEMAkADQCACIQtBACEBAkADQAJAIAEgC2pB/w9xIgIgCEYNACAHQYAGaiACQQJ0aigCACICIAFBAnRBsDVqKAIAIglJDQAgAiAJSw0CIAFBAWoiAUEERw0BCwsgCkEkRw0AQgAhE0EAIQFCACEUA0AgCCABIAtqQf8PcSICRgRAIAhBAWpB/w9xIghBAnQgB2pBADYC/AULIAdB8AVqIBMgFEIAQoCAgIDlmreOwAAQ9QMgB0HgBWogB0GABmogAkECdGooAgAQ/AMgB0HQBWogBykD8AUgBykD+AUgBykD4AUgBykD6AUQ9wMgBykD2AUhFCAHKQPQBSETIAFBAWoiAUEERw0ACyAHQcAFaiAFEPYDIAdBsAVqIBMgFCAHKQPABSAHKQPIBRD1AyAHKQO4BSEUQgAhEyAHKQOwBSEVIA1B8QBqIgkgBGsiAUEAIAFBAEobIAMgASADSCIMGyICQfAATA0CQgAhFkIAIRdCACEYDAULIAwgDWohDSALIAgiAkYNAAtBgJTr3AMgDHYhDkF/IAx0QX9zIQ9BACEBIAshAgNAIAdBgAZqIAtBAnRqIgkgCSgCACIJIAx2IAFqIgE2AgAgAkEBakH/D3EgAiABRSACIAtGcSIBGyECIApBd2ogCiABGyEKIAkgD3EgDmwhASALQQFqQf8PcSILIAhHDQALIAFFDQEgAiAGRwRAIAdBgAZqIAhBAnRqIAE2AgAgBiEIDAMLIBAgECgCAEEBcjYCACAGIQIMAQsLCyAHQYAFakQAAAAAAADwP0HhASACaxDECxD4AyAHQaAFaiAHKQOABSAHKQOIBSAVIBQQ+wMgBykDqAUhGCAHKQOgBSEXIAdB8ARqRAAAAAAAAPA/QfEAIAJrEMQLEPgDIAdBkAVqIBUgFCAHKQPwBCAHKQP4BBDDCyAHQeAEaiAVIBQgBykDkAUiEyAHKQOYBSIWEP0DIAdB0ARqIBcgGCAHKQPgBCAHKQPoBBD3AyAHKQPYBCEUIAcpA9AEIRULAkAgC0EEakH/D3EiCiAIRg0AAkAgB0GABmogCkECdGooAgAiCkH/ybXuAU0EQCAKRUEAIAtBBWpB/w9xIAhGGw0BIAdB4ANqIAW3RAAAAAAAANA/ohD4AyAHQdADaiATIBYgBykD4AMgBykD6AMQ9wMgBykD2AMhFiAHKQPQAyETDAELIApBgMq17gFHBEAgB0HABGogBbdEAAAAAAAA6D+iEPgDIAdBsARqIBMgFiAHKQPABCAHKQPIBBD3AyAHKQO4BCEWIAcpA7AEIRMMAQsgBbchGSAIIAtBBWpB/w9xRgRAIAdBgARqIBlEAAAAAAAA4D+iEPgDIAdB8ANqIBMgFiAHKQOABCAHKQOIBBD3AyAHKQP4AyEWIAcpA/ADIRMMAQsgB0GgBGogGUQAAAAAAADoP6IQ+AMgB0GQBGogEyAWIAcpA6AEIAcpA6gEEPcDIAcpA5gEIRYgBykDkAQhEwsgAkHvAEoNACAHQcADaiATIBZCAEKAgICAgIDA/z8QwwsgBykDwAMgBykDyANCAEIAEPkDDQAgB0GwA2ogEyAWQgBCgICAgICAwP8/EPcDIAcpA7gDIRYgBykDsAMhEwsgB0GgA2ogFSAUIBMgFhD3AyAHQZADaiAHKQOgAyAHKQOoAyAXIBgQ/QMgBykDmAMhFCAHKQOQAyEVAkAgCUH/////B3FBfiARa0wNACAHQYADaiAVIBRCAEKAgICAgICA/z8Q9QMgEyAWQgBCABD5AyEJIBUgFBCABBCBBCEZIAcpA4gDIBQgGUQAAAAAAAAAR2YiCBshFCAHKQOAAyAVIAgbIRUgDCAIQQFzIAEgAkdycSAJQQBHcUVBACAIIA1qIg1B7gBqIBJMGw0AEKUDQcQANgIACyAHQfACaiAVIBQgDRD+AyAHKQP4AiETIAcpA/ACCzcDACAAIBM3AwggB0GAxgBqJAALiQQCBH8BfgJAAn8gACgCBCICIAAoAmhJBEAgACACQQFqNgIEIAItAAAMAQsgABDpAwsiAkFVaiIDQQJNQQAgA0EBaxtFBEAgAkFQaiEDQQAhBQwBCyACQS1GIQUCfyAAKAIEIgMgACgCaEkEQCAAIANBAWo2AgQgAy0AAAwBCyAAEOkDCyIEQVBqIQMCQCABRQ0AIANBCkkNACAAKAJoRQ0AIAAgACgCBEF/ajYCBAsgBCECCwJAIANBCkkEQEEAIQMDQCACIANBCmxqIQMCfyAAKAIEIgIgACgCaEkEQCAAIAJBAWo2AgQgAi0AAAwBCyAAEOkDCyICQVBqIgRBCU1BACADQVBqIgNBzJmz5gBIGw0ACyADrCEGAkAgBEEKTw0AA0AgAq0gBkIKfnxCUHwhBgJ/IAAoAgQiAiAAKAJoSQRAIAAgAkEBajYCBCACLQAADAELIAAQ6QMLIgJBUGoiBEEJSw0BIAZCro+F18fC66MBUw0ACwsgBEEKSQRAA0ACfyAAKAIEIgIgACgCaEkEQCAAIAJBAWo2AgQgAi0AAAwBCyAAEOkDC0FQakEKSQ0ACwsgACgCaARAIAAgACgCBEF/ajYCBAtCACAGfSAGIAUbIQYMAQtCgICAgICAgICAfyEGIAAoAmhFDQAgACAAKAIEQX9qNgIEQoCAgICAgICAgH8PCyAGC7YDAgN/AX4jAEEgayIDJAACQCABQv///////////wCDIgVCgICAgICAwL9AfCAFQoCAgICAgMDAv398VARAIAFCGYinIQIgAFAgAUL///8PgyIFQoCAgAhUIAVCgICACFEbRQRAIAJBgYCAgARqIQIMAgsgAkGAgICABGohAiAAIAVCgICACIWEQgBSDQEgAkEBcSACaiECDAELIABQIAVCgICAgICAwP//AFQgBUKAgICAgIDA//8AURtFBEAgAUIZiKdB////AXFBgICA/gdyIQIMAQtBgICA/AchAiAFQv///////7+/wABWDQBBACECIAVCMIinIgRBkf4ASQ0AIAMgACABQv///////z+DQoCAgICAgMAAhCIFQYH/ACAEaxD0AyADQRBqIAAgBSAEQf+Bf2oQ8gMgAykDCCIFQhmIpyECIAMpAwAgAykDECADKQMYhEIAUq2EIgBQIAVC////D4MiBUKAgIAIVCAFQoCAgAhRG0UEQCACQQFqIQIMAQsgACAFQoCAgAiFhEIAUg0AIAJBAXEgAmohAgsgA0EgaiQAIAIgAUIgiKdBgICAgHhxcr4LuxMCD38DfiMAQbACayIGJABBACENQQAhECAAKAJMQQBOBEAgABBGIRALAkAgAS0AACIERQ0AIABBBGohB0IAIRJBACENAkADQAJAAkAgBEH/AXEQ5wMEQANAIAEiBEEBaiEBIAQtAAEQ5wMNAAsgAEIAEOgDA0ACfyAAKAIEIgEgACgCaEkEQCAHIAFBAWo2AgAgAS0AAAwBCyAAEOkDCxDnAw0ACwJAIAAoAmhFBEAgBygCACEBDAELIAcgBygCAEF/aiIBNgIACyABIAAoAghrrCAAKQN4IBJ8fCESDAELAn8CQAJAIAEtAAAiBEElRgRAIAEtAAEiA0EqRg0BIANBJUcNAgsgAEIAEOgDIAEgBEElRmohBAJ/IAAoAgQiASAAKAJoSQRAIAcgAUEBajYCACABLQAADAELIAAQ6QMLIgEgBC0AAEcEQCAAKAJoBEAgByAHKAIAQX9qNgIAC0EAIQ4gAUEATg0IDAULIBJCAXwhEgwDC0EAIQggAUECagwBCwJAIAMQ6gNF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BhDRBiAALQAPBEAgBiABQS0QuQEQpQoLIAFBMBC5ASEBIAcQwQYhBCAAKAIUIgNBf2ohAiABQf8BcSEBA0ACQCAEIAJPDQAgBC0AACABRw0AIARBAWohBAwBCwsgBiAEIAMQ0gYaCyAAQZgBaiAAQZABahDsAgRAIAUgBSgCAEECcjYCAAsgACgCmAEhBCAAQRBqENkEGiAHENUFGiAAQaABaiQAIAQLZAECfyMAQRBrIgEkACAAENsBAkAgABCsAQRAIAAQsQEhAiABQQA6AA8gAiABQQ9qEKYBIABBABCjAQwBCyAAEJsBIQIgAUEAOgAOIAIgAUEOahCmASAAQQAQmQELIAFBEGokAAsLACAAIAEgAhDTBgvhAQEEfyMAQSBrIgUkACAAEOMEIQQgABDtBCEDAkAgASACENYJIgZFDQAgARCTASAAEMoFIAAQygUgABDjBGoQ+AkEQCAAIAVBEGogASACIAAQoAEQ+QkiARCLASABEOMEEKQKGiABEJwKGgwBCyADIARrIAZJBEAgACADIAQgBmogA2sgBCAEQQBBABCjCgsgABCTBSAEaiEDA0AgASACRkUEQCADIAEQpgEgAUEBaiEBIANBAWohAwwBCwsgBUEAOgAPIAMgBUEPahCmASAAIAQgBmoQ+gkLIAVBIGokACAACx0AIAAgARCTARDnARogAEEEaiACEJMBEOcBGiAACwsAIABBuMEBEN4ECxEAIAAgASABKAIAKAIsEQIACxEAIAAgASABKAIAKAIgEQIACwsAIAAgARCCByAACw8AIAAgACgCACgCJBEAAAsLACAAQbDBARDeBAsSACAAIAI2AgQgACABOgAAIAALeQEBfyMAQSBrIgMkACADIAE2AhAgAyAANgIYIAMgAjYCCANAAkACf0EBIANBGGogA0EQahDBBUUNABogAyADQRhqEMoBIANBCGoQygEQ/QkNAUEACyECIANBIGokACACDwsgA0EYahDCBRogA0EIahDCBRoMAAALAAsyAQF/IwBBEGsiAiQAIAIgACgCADYCCCACQQhqIAEQmAcaIAIoAgghASACQRBqJAAgAQsHACAAEPABCwUAEI4BCxoBAX8gABCaASgCACEBIAAQmgFBADYCACABCyUAIAAgARDgBhDTBSABEN4GEJMBKAIAIQEgABDwASABNgIAIAALGgEB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ECAAQbABahDsBCIJIABBoAFqEOwEIgsgAEGcAWoQhgcgAEH5ADYCMCAAQShqQQAgAEEwahDRBSENAn8gByAAKAKcASICSgRAIAsQ4wQgByACa0EBdEEBcmoMAQsgCxDjBEECagshDiAAQTBqIQIgCRDjBCAOaiAAKAKcAWoiDkHlAE8EQCANIA4QvAsQ0wUgDRDBBiICRQ0BCyACIABBJGogAEEgaiADEIMBIAggByAIaiARIAwgAEHQAWogACwAzwEgACwAzgEgECAJIAsgACgCnAEQhwcgASACIAAoAiQgACgCICADIAQQhQEhByANENUFGiALEJwKGiAJEJwKGiAQEJwKGiAAQdgBahDZBBogChDVBRogDxDVBRogAEHQA2okACAHDwsQjQoACwoAIAAQiAdBAXML4wIBAX8jAEEQayIKJAAgCQJ/IAAEQCACENUGIQACQCABBEAgCiAAENYGIAMgCigCADYAACAKIAAQ1wYgCCAKENgGGiAKEJwKGgwBCyAKIAAQiQcgAyAKKAIANgAAIAogABDcBCAIIAoQ2AYaIAoQnAoaCyAEIAAQuQU6AAAgBSAAELoFOgAAIAogABC7BSAGIAoQ2AYaIAoQnAoaIAogABDbBCAHIAoQ2AYaIAoQnAoaIAAQ2QYMAQsgAhDaBiEAAkAgAQRAIAogABDWBiADIAooAgA2AAAgCiAAENcGIAggChDYBhogChCcChoMAQsgCiAAEIkHIAMgCigCADYAACAKIAAQ3AQgCCAKENgGGiAKEJwKGgsgBCAAELkFOgAAIAUgABC6BToAACAKIAAQuwUgBiAKENgGGiAKEJwKGiAKIAAQ2wQgByAKENgGGiAKEJwKGiAAENkGCzYCACAKQRBqJAALlwYBCn8jAEEQayIWJAAgAiAANgIAIANBgARxIRdBACETA0ACQAJAAkACQCATQQRGBEAgDRDjBEEBSwRAIBYgDRCKBzYCCCACIBZBCGpBARDdBiANEIsHIAIoAgAQjAc2AgALIANBsAFxIg9BEEYNAiAPQSBHDQEgASACKAIANgIADAILIAggE2osAAAiD0EESw0DAkACQAJAAkACQCAPQQFrDgQBAwIEAAsgASACKAIANgIADAcLIAEgAigCADYCACAGQSAQuQEhDyACIAIoAgAiEEEBajYCACAQIA86AAAMBgsgDRDm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QCAFQQJGDQAgAiADTw0AIAQgAjYCCCAAIARBkAFqIAIgAkEgaiADIAMgAmtBIEobIARBCGogBEEQaiAGIARBDGogACgCACgCEBENACIFQQJGDQIgBEEQaiEBIAQoAgggAkYNAgNAIAEgBCgCDE8EQCAEKAIIIQIMAwUgBCABKAIANgIEIARBmAFqEJMBIARBBGoQqgcaIAFBBGohASAEQZgBahCTARoMAQsAAAsACwsgBCgCmAEhASAEQaABaiQAIAEPCyAEELIGAAsbACAAIAEQrQcaIAAQkwEaIABBsOUANgIAIAALFAAgACgCACABEJMBKAIAELAKIAALJwAgAEGY3gA2AgAgACgCCBCQBUcEQCAAKAIIELIECyAAEJUBGiAAC4QDACAAIAEQrQcaIABB0N0ANgIAIABBEGpBHBCuByEBIABBsAFqQcXdABCWAxogARCvBxCwByAAQaDMARCxBxCyByAAQajMARCzBxC0ByAAQbDMARC1BxC2ByAAQcDMARC3BxC4ByAAQcjMARC5BxC6ByAAQdDMARC7BxC8ByAAQeDMARC9BxC+ByAAQejMARC/BxDAByAAQfDMARDBBxDCByAAQZDNARDDBxDEByAAQbDNARDFBxDGByAAQbjNARDHBxDIByAAQcDNARDJBxDKByAAQcjNARDLBxDMByAAQdDNARDNBxDOByAAQdjNARDPBxDQByAAQeDNARDRBxDSByAAQejNARDTBxDUByAAQfDNARDVBxDWByAAQfjNARDXBxDYByAAQYDOARDZBxDaByAAQYjOARDbBxDcByAAQZDOARDdBxDeByAAQaDOARDfBxDgByAAQbDOARDhBxDiByAAQcDOARDjBxDkByAAQdDOARDlBxDmByAAQdjOARDnByAACxgAIAAgAUF/ahDmARogAEHc4QA2AgAgAAsdACAAEOgHGiABBEAgACABEOkHIAAgARDqBwsgAAscAQF/IAAQ6wchASAAEOwHIAAgARDtByAAENsBCwwAQaDMAUEBEPAHGgsQACAAIAFB4MABEO4HEO8HCwwAQajMAUEBEPEHGgsQACAAIAFB6MABEO4HEO8HCxAAQbDMAUEAQQBBARDyBxoLEAAgACABQazCARDuBxDvBwsMAEHAzAFBARDzBxoLEAAgACABQaTCARDuBxDvBwsMAEHIzAFBARD0BxoLEAAgACABQbTCARDuBxDvBwsMAEHQzAFBARD1BxoLEAAgACABQbzCARDuBxDvBwsMAEHgzAFBARD2BxoLEAAgACABQcTCARDuBxDvBwsMAEHozAFBARCpBxoLEAAgACABQczCARDuBxDvBwsMAEHwzAFBARD3BxoLEAAgACABQdTCARDuBxDvBwsMAEGQzQFBARD4BxoLEAAgACABQdzCARDuBxDvBwsMAEGwzQFBARD5BxoLEAAgACABQfDAARDuBxDvBwsMAEG4zQFBARD6BxoLEAAgACABQfjAARDuBxDvBwsMAEHAzQFBARD7BxoLEAAgACABQYDBARDuBxDvBwsMAEHIzQFBARD8BxoLEAAgACABQYjBARDuBxDvBwsMAEHQzQFBARD9BxoLEAAgACABQbDBARDuBxDvBwsMAEHYzQFBARD+BxoLEAAgACABQbjBARDuBxDvBwsMAEHgzQFBARD/BxoLEAAgACABQcDBARDuBxDvBwsMAEHozQFBARCACBoLEAAgACABQcjBARDuBxDvBwsMAEHwzQFBARCBCBoLEAAgACABQdDBARDuBxDvBwsMAEH4zQFBARCCCBoLEAAgACABQdjBARDuBxDvBwsMAEGAzgFBARCDCBoLEAAgACABQeDBARDuBxDvBwsMAEGIzgFBARCECBoLEAAgACABQejBARDuBxDvBwsMAEGQzgFBARCFCBoLEAAgACABQZDBARDuBxDvBwsMAEGgzgFBARCGCBoLEAAgACABQZjBARDuBxDvBwsMAEGwzgFBARCHCBoLEAAgACABQaDBARDuBxDvBwsMAEHAzgFBARCICBoLEAAgACABQajBARDuBxDvBwsMAEHQzgFBARCJCBoLEAAgACABQfDBARDuBxDvBwsMAEHYzgFBARCKCBoLEAAgACABQfjBARDuBxDvBws4AQF/IwBBEGsiASQAIAAQkwEaIABCADcDACABQQA2AgwgAEEQaiABQQxqEKQJGiABQRBqJAAgAAtEAQF/IAAQpQkgAUkEQCAAELMKAAsgACAAEKYJIAEQpwkiAjYCACAAIAI2AgQgABCoCSACIAFBAnRqNgIAIABBABCpCQtZAQR/IwBBEGsiAiQAIAAQpgkhBANAIAJBCGogAEEBEMoCIQUgBCAAQQRqIgMoAgAQkwEQqgkgAyADKAIAQQRqNgIAIAUQ2wEgAUF/aiIBDQALIAJBEGokAAsQACAAKAIEIAAoAgBrQQJ1CwwAIAAgACgCABC7CQszACAAIAAQsgkgABCyCSAAELMJQQJ0aiAAELIJIAFBAnRqIAAQsgkgABDrB0ECdGoQtAkLSgEBfyMAQSBrIgEkACABQQA2AgwgAUH7ADYCCCABIAEpAwg3AwAgACABQRBqIAEgABCkCBClCCAAKAIEIQAgAUEgaiQAIABBf2oLcwECfyMAQRBrIgMkACABEI0IIANBCGogARCRCCEEIABBEGoiARDrByACTQRAIAEgAkEBahCUCAsgASACEIwIKAIABEAgASACEIwIKAIAEIACGgsgBBCVCCEAIAEgAhCMCCAANgIAIAQQkggaIANBEGokAAsVACAAIAEQrQcaIABBiOoANgIAIAALFQAgACABEK0HGiAAQajqADYCACAACzcAIAAgAxCtBxogABCTARogACACOgAMIAAgATYCCCAAQeTdADYCACABRQRAIAAQrQg2AggLIAALGwAgACABEK0HGiAAEJMBGiAAQZTiADYCACAACxsAIAAgARCtBxogABCTARogAEGo4wA2AgAgAAsjACAAIAEQrQcaIAAQkwEaIABBmN4ANgIAIAAQkAU2AgggAAsbACAAIAEQrQcaIAAQkwEaIABBvOQANgIAIAALJwAgACABEK0HGiAAQa7YADsBCCAAQcjeADYCACAAQQxqEOwEGiAACyoAIAAgARCtBxogAEKugICAwAU3AgggAEHw3gA2AgAgAEEQahDsBBogAAsVACAAIAEQrQcaIABByOoANgIAIAALFQAgACABEK0HGiAAQbzsADYCACAACxUAIAAgARCtBxogAEGQ7gA2AgAgAAsVACAAIAEQrQcaIABB+O8ANgIAIAALGwAgACABEK0HGiAAEJMBGiAAQdD3ADYCACAACxsAIAAgARCtBxogABCTARogAEHk+AA2AgAgAAsbACAAIAEQrQcaIAAQkwEaIABB2PkANgIAIAALGwAgACABEK0HGiAAEJMBGiAAQcz6ADYCACAACxsAIAAgARCtBxogABCTARogAEHA+wA2AgAgAAsbACAAIAEQrQcaIAAQkwEaIABB5PwANgIAIAALGwAgACABEK0HGiAAEJMBGiAAQYj+ADYCACAACxsAIAAgARCtBxogABCTARogAEGs/wA2AgAgAAsoACAAIAEQrQcaIABBCGoQvgkhASAAQcDxADYCACABQfDxADYCACAACygAIAAgARCtBxogAEEIahC/CSEBIABByPMANgIAIAFB+PMANgIAIAALHgAgACABEK0HGiAAQQhqEMAJGiAAQbT1ADYCACAACx4AIAAgARCtBxogAEEIahDACRogAEHQ9gA2AgAgAAsbACAAIAEQrQcaIAAQkwEaIABB0IABNgIAIAALGwAgACABEK0HGiAAEJMBGiAAQciBATYCACAACzgAAkBBkMIBLQAAQQFxDQBBkMIBELQKRQ0AEI4IGkGMwgFBiMIBNgIAQZDCARC2CgtBjMIBKAIACw0AIAAoAgAgAUECdGoLCwAgAEEEahCPCBoLFAAQnghBiMIBQeDOATYCAEGIwgELEwAgACAAKAIAQQFqIgA2AgAgAAsPACAAQRBqIAEQjAgoAgALKAEBfyMAQRBrIgIkACACIAE2AgwgACACQQxqEJMIGiACQRBqJAAgAAsJACAAEJYIIAALDwAgACABEJMBEOcBGiAACzQBAX8gABDrByICIAFJBEAgACABIAJrEJwIDwsgAiABSwRAIAAgACgCACABQQJ0ahCdCAsLGgEBfyAAEJoBKAIAIQEgABCaAUEANgIAIAELIgEBfyAAEJoBKAIAIQEgABCaAUEANgIAIAEEQCABEMIJCwtiAQJ/IABB0N0ANgIAIABBEGohAkEAIQEDQCABIAIQ6wdJBEAgAiABEIwIKAIABEAgAiABEIwIKAIAEIACGgsgAUEBaiEBDAELCyAAQbABahCcChogAhCYCBogABCVARogAAsPACAAEJkIIAAQmggaIAALNgAgACAAELIJIAAQsgkgABCzCUECdGogABCyCSAAEOsHQQJ0aiAAELIJIAAQswlBAnRqELQJCyMAIAAoAgAEQCAAEOwHIAAQpgkgACgCACAAELcJELoJCyAACwoAIAAQlwgQjwoLbgECfyMAQSBrIgMkAAJAIAAQqAkoAgAgACgCBGtBAnUgAU8EQCAAIAEQ6gcMAQsgABCmCSECIANBCGogACAAEOsHIAFqEMEJIAAQ6wcgAhDDCSICIAEQxAkgACACEMUJIAIQxgkaCyADQSBqJAALIAEBfyAAIAEQ1gEgABDrByECIAAgARC7CSAAIAIQ7QcLDABB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0AEQiAoaA0AgACgCAEEBR0UEQEG80AFBoNABEIoKGgwBCwsgACgCAEUEQCAAEIsKQaDQARCIChogASACEQQAQaDQARCIChogABCMCkGg0AEQiAoaQbzQARCIChoPC0Gg0AEQiAoaCwkAIAAgARCHCgsJACAAQQE2AgALCQAgAEF/NgIACwUAEBYACy0BAn8gAEEBIAAbIQEDQAJAIAEQvAsiAg0AELoKIgBFDQAgABEHAAwBCwsgAgsHACAAEL0LCw0AIABB1I0BNgIAIAALPAECfyABELgCIgJBDWoQjgoiA0EANgIIIAMgAjYCBCADIAI2AgAgACADEJIKIAEgAkEBahDGCzYCACAACwcAIABBDGoLHgAgABCQChogAEGAjgE2AgAgAEEEaiABEJEKGiAACykBAX8gAgRAIAAhAwNAIAMgATYCACADQQRqIQMgAkF/aiICDQALCyAAC2kBAX8CQCAAIAFrQQJ1IAJJBEADQCAAIAJBf2oiAkECdCIDaiABIANqKAIANgIAIAINAAwCAAsACyACRQ0AIAAhAwNAIAMgASgCADYCACADQQRqIQMgAUEEaiEBIAJBf2oiAg0ACwsgAAuQAQEDfyMAQRBrIgMkACADIAE6AA8CQCAAKAIQIgJFBEBBfyECIAAQsQMNASAAKAIQIQILAkAgACgCFCIEIAJPDQAgAUH/AXEiAiAALABLRg0AIAAgBEEBajYCFCAEIAE6AAAMAQtBfyECIAAgA0EPakEBIAAoAiQRBQBBAUcNACADLQAPIQILIANBEGokACACCwoAQYiNARCpAQALagECfyMAQRBrIgMkACABEJcBEJkKIAAgA0EIahCaCiECAkAgARCsAUUEQCABEJoBIQEgAhCaASICIAEoAgg2AgggAiABKQIANwIADAELIAAgARCtARCTASABEJQFEJsKCyADQRBqJAAgAAsHACAAENsBCxUAIAAQlAEaIAAgARCTARDqARogAAuNAQEDfyMAQRBrIgQkACAAEJYBIAJPBEACQCACQQpNBEAgACACEJkBIAAQmwEhAwwBCyACEJwBIQMgACAAEKABIANBAWoiBRCeASIDEKEBIAAgBRCiASAAIAIQowELIAMQkwEgASACENACGiAEQQA6AA8gAiADaiAEQQ9qEKYBIARBEGokAA8LIAAQlwoACx4AIAAQrAEE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IAUpAwghAiAFKQMAIQQMAQsgASACQv///////z+DIAatQjCGhCIKIAMgBEL///////8/gyAEQjCIp0H//wFxIgitQjCGhCILEPkDQQBMBEAgASAKIAMgCxD5AwRAIAEhBAwCCyAFQfAAaiABIAJCAEIAEPUDIAUpA3ghAiAFKQNwIQQMAQsgBgR+IAEFIAVB4ABqIAEgCkIAQoCAgICAgMC7wAAQ9QMgBSkDaCIKQjCIp0GIf2ohBiAFKQNgCyEEIAhFBEAgBUHQAGogAyALQgBCgICAgICAwLvAABD1AyAFKQNYIgtCMIinQYh/aiEIIAUpA1AhAwsgCkL///////8/g0KAgICAgIDAAIQiCiALQv///////z+DQoCAgICAgMAAhCINfSAEIANUrX0iDEJ/VSEHIAQgA30hCyAGIAhKBEADQAJ+IAdBAXEEQCALIAyEUARAIAVBIGogASACQgBCABD1AyAFKQMoIQIgBSkDICEEDAULIAxCAYYhDCALQj+IDAELIARCP4ghDCAEIQsgCkIBhgsgDIQiCiANfSALQgGGIgQgA1StfSIMQn9VIQcgBCADfSELIAZBf2oiBiAISg0ACyAIIQYLAkAgB0UNACALIgQgDCIKhEIAUg0AIAVBMGogASACQgBCABD1AyAFKQM4IQIgBSkDMCEEDAELIApC////////P1gEQANAIARCP4ghAyAGQX9qIQYgBEIBhiEEIAMgCkIBhoQiCkKAgICAgIDAAFQNAAsLIAlBgIACcSEHIAZBAEwEQCAFQUBrIAQgCkL///////8/gyAGQfgAaiAHcq1CMIaEQgBCgICAgICAwMM/EPUDIAUpA0ghAiAFKQNAIQQMAQsgCkL///////8/gyAGIAdyrUIwhoQhAgsgACAENwMAIAAgAjcDCCAFQYABaiQAC6gBAAJAIAFBgAhOBEAgAEQAAAAAAADgf6IhACABQf8PSARAIAFBgXhqIQEMAgsgAEQAAAAAAADgf6IhACABQf0XIAFB/RdIG0GCcGohAQwBCyABQYF4Sg0AIABEAAAAAAAAEACiIQAgAUGDcEoEQCABQf4HaiEBDAELIABEAAAAAAAAEACiIQAgAUGGaCABQYZoShtB/A9qIQELIAAgAUH/B2qtQjSGv6ILRAIBfwF+IAFC////////P4MhAwJ/IAFCMIinQf//AXEiAkH//wFHBEBBBCACDQEaQQJBAyAAIAOEUBsPCyAAIAOEUAsLgwQBA38gAkGAwABPBEAgACABIAIQIBogAA8LIAAgAmohAwJAIAAgAXNBA3FFBEACQCACQQFIBEAgACECDAELIABBA3FFBEAgACECDAELIAAhAgNAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANPDQEgAkEDcQ0ACwsCQCADQXxxIgRBwABJDQAgAiAEQUBqIgVLDQADQCACIAEoAgA2AgAgAiABKAIENgIEIAIgASgCCDYCCCACIAEoAgw2AgwgAiABKAIQNgIQIAIgASgCFDYCFCACIAEoAhg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUFAayEBIAJBQGsiAiAFTQ0ACwsgAiAETw0BA0AgAiABKAIANgIAIAFBBGohASACQQRqIgIgBEkNAAsMAQsgA0EESQRAIAAhAgwBCyADQXxqIgQgAEkEQCAAIQIMAQsgACECA0AgAiABLQAAOgAAIAIgAS0AAToAASACIAEtAAI6AAIgAiABLQADOgADIAFBBGohASACQQRqIgIgBE0NAAsLIAIgA0kEQANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC/MCAgJ/AX4CQCACRQ0AIAAgAmoiA0F/aiABOgAAIAAgAToAACACQQNJDQAgA0F+aiABOgAAIAAgAToAASADQX1qIAE6AAAgACABOgACIAJBB0kNACADQXxqIAE6AAAgACABOgADIAJBCUkNACAAQQAgAGtBA3EiBGoiAyABQf8BcUGBgoQIbCIBNgIAIAMgAiAEa0F8cSIEaiICQXxqIAE2AgAgBEEJSQ0AIAMgATYCCCADIAE2AgQgAkF4aiABNgIAIAJBdGogATYCACAEQRlJDQAgAyABNgIYIAMgATYCFCADIAE2AhAgAyABNgIMIAJBcGogATYCACACQWxqIAE2AgAgAkFoaiABNgIAIAJBZGogATYCACAEIANBBHFBGHIiBGsiAkEgSQ0AIAGtIgVCIIYgBYQhBSADIARqIQEDQCABIAU3AxggASAFNwMQIAEgBTcDCCABIAU3AwAgAUEgaiEBIAJBYGoiAkEfSw0ACwsgAAv4AgECfwJAIAAgAUYNAAJAIAEgAmogAEsEQCAAIAJqIgQgAUsNAQsgACABIAIQxgsPCyAAIAFzQQNxIQMCQAJAIAAgAUkEQCADBEAgACEDDAMLIABBA3FFBEAgACEDDAILIAAhAwNAIAJFDQQgAyABLQAAOgAAIAFBAWohASACQX9qIQIgA0EBaiIDQQNxDQALDAELAkAgAw0AIARBA3EEQANAIAJFDQUgACACQX9qIgJqIgMgASACai0AADoAACADQQNxDQALCyACQQNNDQADQCAAIAJBfGoiAmogASACaigCADYCACACQQNLDQALCyACRQ0CA0AgACACQX9qIgJqIAEgAmotAAA6AAAgAg0ACwwCCyACQQNNDQAgAiEEA0AgAyABKAIANgIAIAFBBGohASADQQRqIQMgBEF8aiIEQQNLDQALIAJBA3EhAgsgAkUNAANAIAMgAS0AADoAACADQQFqIQMgAUEBaiEBIAJBf2oiAg0ACwsgAAsfAEHk1AEoAgBFBEBB6NQBIAE2AgBB5NQBIAA2AgALCwQAIwALEAAjACAAa0FwcSIAJAAgAAsGACAAJAALBgAgAEAACwkAIAEgABEAAAsJACABIAARBAALBwAgABEDAAsLACABIAIgABEBAAsPACABIAIgAyAEIAARDAALCwAgASACIAARAgALCwAgASACIAARDwALEQAgASACIAMgBCAFIAARDgALDQAgASACIAMgABEIAAsNACABIAIgAyAAERwACw8AIAEgAiADIAQgABEKAAsNACABIAIgAyAAEQUACxEAIAEgAiADIAQgBSAAESMACw0AIAEgAiADIAARGgALEwAgASACIAMgBCAFIAYgABEhAAsRACABIAIgAyAEIAUgABELAAsXACABIAIgAyAEIAUgBiAHIAggABENAAsTACABIAIgAyAEIAUgBiAAEQYACxEAIAEgAiADIAQgBSAAERYACxEAIAEgAiADIAQgBSAAESAACxMAIAEgAiADIAQgBSAGIAARHwALFQAgASACIAMgBCAFIAYgByAAERAACxUAIAEgAiADIAQgBSAGIAcgABEYAAsTACABIAIgAyAEIAUgBiAAEQkACwcAIAARBwALGQAgACABIAIgA60gBK1CIIaEIAUgBhDaCwsiAQF+IAAgASACrSADrUIghoQgBBDbCyIFQiCIpxAhIAWnCxkAIAAgASACIAMgBCAFrSAGrUIghoQQ4AsLIwAgACABIAIgAyAEIAWtIAatQiCGhCAHrSAIrUIghoQQ4gsLJQAgACABIAIgAyAEIAUgBq0gB61CIIaEIAitIAmtQiCGhBDkCwsTACAAIAGnIAFCIIinIAIgAxAiCwuHhAE7AEGACAumB1ZvaWNlS2VybmVsAHByb2Nlc3MAc2V0TW9kZQBzZXRBbXBsaXR1ZGVBdHRhY2sAc2V0QW1wbGl0dWRlRGVjYXkAc2V0QW1wbGl0dWRlU3VzdGFpbgBzZXRBbXBsaXR1ZGVSZWxlYXNlAHNldEN1dG9mZgBzZXRSZXNvbmFuY2UAc2V0Q3V0b2ZmRW52ZWxvcGVBbW91bnQAc2V0Q3V0b2ZmRW52ZWxvcGVBdHRhY2sAc2V0Q3V0b2ZmRW52ZWxvcGVEZWNheQBpc1N0b3BwZWQAZW50ZXJSZWxlYXNlU3RhZ2UAV2F2ZUZvcm0AU0lORQBTQVcAU1FVQVJFAFRSSUFOR0xFAFZvaWNlU3RhdGUARElTUE9TRUQAU1RBUlRFRABTVE9QUElORwBTVE9QUEVEAHN0YXJ0ZWQAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQAxMVZvaWNlS2VybmVsAPBJAAB+BQAAUDExVm9pY2VLZXJuZWwAANBKAACUBQAAAAAAAIwFAABQSzExVm9pY2VLZXJuZWwA0EoAALQFAAABAAAAjAUAAGlpAHYAdmkATjEwZW1zY3JpcHRlbjN2YWxFAADwSQAA3AUAAAAAAACcBgAAHgAAAB8AAAAgAAAAIQAAACIAAABOU3QzX18yMjBfX3NoYXJlZF9wdHJfcG9pbnRlcklQMTFWb2ljZUtlcm5lbE4xMGVtc2NyaXB0ZW4xNXNtYXJ0X3B0cl90cmFpdElOU18xMHNoYXJlZF9wdHJJUzFfRUVFMTF2YWxfZGVsZXRlckVOU185YWxsb2NhdG9ySVMxX0VFRUUAAAAAGEoAABQGAABwRgAATjEwZW1zY3JpcHRlbjE1c21hcnRfcHRyX3RyYWl0SU5TdDNfXzIxMHNoYXJlZF9wdHJJMTFW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AAA9AAAAPgAAAD8AAABAAAAAQQAAAHMAAAB0AAAATlN0M19fMjExX19zdGRvdXRidWZJd0VFAAAAABhKAACYGAAAzBUAAP////////////////////////////////////////////////////////////////8AAQIDBAUGBwgJ/////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAECBAcDBgUAAAAAAAAAAgAAwAMAAMAEAADABQAAwAYAAMAHAADACAAAwAkAAMAKAADACwAAwAwAAMANAADADgAAwA8AAMAQAADAEQAAwBIAAMATAADAFAAAwBUAAMAWAADAFwAAwBgAAMAZAADAGgAAwBsAAMAcAADAHQAAwB4AAMAfAADAAAAAswEAAMMCAADDAwAAwwQAAMMFAADDBgAAwwcAAMMIAADDCQAAwwoAAMMLAADDDAAAww0AANMOAADDDwAAwwAADLsBAAzDAgAMwwMADMMEAAzTaW5maW5pdHkAbmFuAEGwNQtI0XSeAFedvSqAcFIP//8+JwoAAABkAAAA6AMAABAnAACghgEAQEIPAICWmAAA4fUFGAAAADUAAABxAAAAa////877//+Sv///AEGANgsj3hIElQAAAAD///////////////8AGwAAFAAAAEMuVVRGLTgAQcg2CwIUGwBB4DYLBkxDX0FMTABB8DYLmAFMQ19DVFlQRQAAAABMQ19OVU1FUklDAABMQ19USU1FAAAAAABMQ19DT0xMQVRFAABMQ19NT05FVEFSWQBMQ19NRVNTQUdFUwBMQU5HAEMuVVRGLTgAUE9TSVgATVVTTF9MT0NQQVRIAAAtKyAgIDBYMHgAKG51bGwpAAAAAAAAABEACgAREREAAAAABQAAAAAAAAkAAAAACwBBkDgLIREADwoREREDCgcAARMJCwsAAAkGCwAACwAGEQAAABEREQBBwTgL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YWJpdjEyMV9fdm1pX2NsYXNzX3R5cGVfaW5mb0UAAAAYSgAAlEoAAMhHAAAAAAAAKEgAAHcBAACLAQAAeQEAAHoBAACMAQAAdm9pZABib29sAGNoYXIAc2lnbmVkIGNoYXIAdW5zaWduZWQgY2hhcgBzaG9ydAB1bnNpZ25lZCBzaG9ydABpbnQAdW5zaWduZWQgaW50AGxvbmcAdW5zaWduZWQgbG9uZwBmbG9hdABkb3VibGUAc3RkOjpzdHJpbmcAc3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4Ac3RkOjp3c3RyaW5nAGVtc2NyaXB0ZW46OnZhbABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAE5TdDNfXzIyMV9fYmFzaWNfc3RyaW5nX2NvbW1vbklMYjFFRUUAAAAA8EkAABtOAAB0SgAA3E0AAAAAAAABAAAARE4AAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAdEoAAGROAAAAAAAAAQAAAEROAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAHRKAAC8TgAAAAAAAAEAAABETgAAAAAAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAA8EkAABRPAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAAPBJAAA8TwAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAADwSQAAZE8AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAA8EkAAIxPAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAAPBJAAC0TwAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAADwSQAA3E8AAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQAA8EkAAARQAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUAAPBJAAAsUAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbUVFAADwSQAAVFAAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWZFRQAA8EkAAHxQAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lkRUUAAPBJAACkUABB0KEBCwEJAEHcoQELAVoAQfChAQsSWwAAAAAAAABcAAAA2FMAAAAEAEGcogELBP////8AQeCiAQsBBQBB7KIBCwFdAEGEowELDl4AAABfAAAA6FcAAAAEAEGcowELAQEAQaujAQsFCv////8AQfCjAQsJYFEAAAAAAAAFAEGEpAELAVoAQZykAQsKXgAAAFwAAADwWwBBtKQBCwECAEHDpAELBf//////AEHEpgELAjBg';
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




// STATICTOP = STATIC_BASE + 26384;
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
      return 27248;
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
var dynCall_vif = Module["dynCall_vif"] = asm["dynCall_vif"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_viif = Module["dynCall_viif"] = asm["dynCall_viif"];
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
