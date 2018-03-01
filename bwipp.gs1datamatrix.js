// bwip-js // Barcode Writer in Pure JavaScript
// https://github.com/metafloor/bwip-js
//
// This code was automatically generated from:
// Barcode Writer in Pure PostScript - Version 2018-02-04
//
// Copyright (c) 2011-2018 Mark Warren
// Copyright (c) 2004-2014 Terry Burton
//
// Licensed MIT. See the LICENSE file in the bwip-js root directory.
"use strict";




// FutureProof modifications:
// remove all symbologies but gs1datamatrix, datamatrix, renmatrix





function BWIPP() {
	// bwip-js/barcode-hdr.js
	//
	// This code is injected above the cross-compiled barcode.ps.

	// The BWIPJS object (graphics interface)
	var $$ = null;

	// The global dictionary.  Each renderer and encoder declare a
	// $1 local dict.
	var $0 = {
		$error: {} // the postscript error object
	};

	var $j = 0; // stack pointer
	var $k = []; // operand stack
	var $b = {}; // break symbol

	// Array ctor
	//	$a()	: Build a new array up to the Infinity-marker on the stack.
	//	$a(arr)	: Convert native array to a "view" of the array.
	//	$a(len)	: Create a new array of length `len`
	function $a(a) {
		if (!arguments.length) {
			for (var i = $j - 1; i >= 0 && $k[i] !== Infinity; i--);
			if (i < 0) {
				throw new Error('array-marker-not-found');
			}
			a = $k.splice(i + 1, $j - 1 - i);
			$j = i;
		} else if (!(a instanceof Array)) {
			a = new Array(+arguments[0]);
			for (var i = 0, l = a.length; i < l; i++) {
				a[i] = null;
			}
		}
		a.b = a; // base array
		a.o = 0; // offset into base
		return a;
	}

	// dict ctor
	//	$d() : look for the Infinity marker on the stack
	function $d() {
		var d = {};
		for (var i = $j - 1; i >= 0 && $k[i] !== Infinity; i -= 2) {
			if ($k[i - 1] === Infinity) {
				throw new Error('dict-malformed-stack');
			}
			// Unlike javascript, postscript dict keys differentiate between
			// numbers and the string representation of a number.
			var k = $k[i - 1]; // "key" into the dict entry
			var t = typeof k;
			if (t === 'number') {
				d['\uffff' + k] = $k[i];
			} else if (t === 'string') {
				d[k] = $k[i];
			} else if (k instanceof Uint8Array) {
				d[$z(k)] = $k[i];
			} else {
				throw 'dict-not-a-valid-key(' + k + ')';
			}
		}
		if (i < 0) {
			throw 'dict-marker-not-found';
		}
		$j = i;
		return d;
	}

	// string ctor
	//	s(number)	: create zero-filled string of number-length
	//	s(string)	: make a copy of the string
	//	s(uint8[])	: make a copy of the string
	//
	// Returns a Uint8Array-string.
	function $s(v) {
		var t = typeof v;
		if (t === 'number') {
			return new Uint8Array(v);
		}
		if (t !== 'string') {
			v = '' + v;
		}
		var s = new Uint8Array(v.length);
		for (var i = 0; i < v.length; i++) {
			s[i] = v.charCodeAt(i);
		}
		return s;
	}

	// Primarily designed to convert uint8-string to string, but will call the
	// the toString() method on any value.
	function $z(s) {
		if (s instanceof Uint8Array) {
			// Postscript treats nul-char as end of string, even if string is
			// longer.
			for (var i = 0, l = s.length; i < l && s[i]; i++);
			if (i < l) {
				return String.fromCharCode.apply(null, s.subarray(0, i));
			}
			return String.fromCharCode.apply(null, s)
		}
		return '' + s;
	}

	// Copies source to dest and returns a view of just the copied characters
	function $strcpy(dst, src) {
		if (typeof dst === 'string') {
			dst = $s(dst);
		}
		if (src instanceof Uint8Array) {
			for (var i = 0, l = src.length; i < l; i++) {
				dst[i] = src[i];
			}
		} else {
			for (var i = 0, l = src.length; i < l; i++) {
				dst[i] = src.charCodeAt(i);
			}
		}
		return src.length < dst.length ? dst.subarray(0, src.length) : dst;
	}

	// Copies source to dest and should (but doesn't) return a view of just the copied elements
	function $arrcpy(dst, src) {
		for (var i = 0, l = src.length; i < l; i++) {
			dst[i] = src[i];
		}
		dst.length = src.length;
		return dst;
	}

	// cvs operator - convert a value to its string representation
	//	s : string to store into
	//	v : any value
	function $cvs(s, v) {
		var t = typeof v;
		if (t == 'number' || t == 'boolean' || v === null) {
			v = '' + v;
		} else if (t !== 'string') {
			v = '--nostringval--';
		}
		for (var i = 0, l = v.length; i < l; i++) {
			s[i] = v.charCodeAt(i);
		}
		$k[$j++] = i < s.length ? s.subarray(0, i) : s;
	}
	// cvrs operator - convert a number to a radix string
	//	s : string to store into
	//	n : number
	//	r : radix
	function $cvrs(s, n, r) {
		return $strcpy(s, (~~n).toString(r).toUpperCase());
	}

	// get operator
	//	s : source
	//	k : key
	function $get(s, k) {
		if (s instanceof Uint8Array) {
			return s[k];
		}
		if (typeof s === 'string') {
			return s.charCodeAt(k);
		}
		if (s instanceof Array) {
			return s.b[s.o + k];
		}
		// Must be a dict object : with postscript dict objects, a number key
		// is differerent than its string representation.  postscript uses
		// 8-bit strings, so \uffff can never be in a key value.
		if (typeof k === 'number') {
			return s['\uffff' + k];
		}
		if (k instanceof Uint8Array) {
			return s[$z(k)];
		}
		return s[k];
	}

	// put operator
	//	d : dest
	//	k : key
	//	v : value
	function $put(d, k, v) {
		if (d instanceof Uint8Array) {
			d[k] = v;
		} else if (d instanceof Array) {
			d.b[d.o + k] = v;
		} else if (typeof d == 'object') {
			if (k instanceof Uint8Array) {
				d[$z(k)] = v;
			} else {
				d[typeof k == 'number' ? '\uffff' + k : k] = v;
			}
		} else {
			throw 'put-not-writable-' + (typeof d);
		}
	}

	// getinterval operator
	//	s : src
	//	o : offset
	//	l : length
	function $geti(s, o, l) {
		if (s instanceof Uint8Array) {
			return s.subarray(o, o + l);
		}
		if (s instanceof Array) {
			var a = new Array(l);
			a.b = s.b; // base array
			a.o = s.o + o; // offset into base
			return a;
		}
		// Must be a string
		return s.substr(o, l);
	}

	// putinterval operator
	//	d : dst
	//	o : offset
	//	s : src
	function $puti(d, o, s) {
		if (d instanceof Uint8Array) {
			if (typeof s == 'string') {
				for (var i = 0, l = s.length; i < l; i++) {
					d[o + i] = s.charCodeAt(i);
				}
			} else {
				// When both d and s are the same, we want to copy
				// backwards, which works for the general case as well.
				for (var i = s.length - 1; i >= 0; i--) {
					d[o + i] = s[i];
				}
			}
		} else if (d instanceof Array) {
			// Operate on the base arrays
			var darr = d.b;
			var doff = o + d.o;
			var sarr = s.b;
			var soff = s.o;

			for (var i = 0, l = s.length; i < l; i++) {
				darr[doff + i] = sarr[soff + i];
			}
		} else {
			throw 'putinterval-not-writable-' + (typeof d);
		}
	}

	// type operator
	function $type(v) {
		// null can be mis-typed - get it out of the way
		if (v === null || v === undefined) {
			return 'nulltype';
		}
		var t = typeof v;
		if (t == 'number') {
			return v % 1 ? 'realtype' : 'integertype';
		}
		if (t == 'boolean') {
			return 'booleantype';
		}
		if (t == 'string' || v instanceof Uint8Array) {
			return 'stringtype';
		}
		if (t == 'function') {
			return 'operatortype';
		}
		if (v instanceof Array) {
			return 'arraytype';
		}
		return 'dicttype';
		// filetype
		// fonttype
		// gstatetype
		// marktype	(v === Infinity)
		// nametype
		// savetype
	}

	// search operator
	//		string seek search suffix match prefix true %if-found
	//						   string false				%if-not-found
	function $search(str, seek) {
		if (!(str instanceof Uint8Array)) {
			str = $s(str);
		}
		var ls = str.length;

		// Virtually all uses of search in BWIPP are for single-characters.
		// Optimize for that case.
		if (seek.length == 1) {
			var lk = 1;
			var cd = seek instanceof Uint8Array ? seek[0] : seek.charCodeAt(0);
			for (var i = 0; i < ls && str[i] != cd; i++);
		} else {
			// Slow path,
			if (!(seek instanceof Uint8Array)) {
				seek = $(seek);
			}
			var lk = seek.length;
			var cd = seek[0];
			for (var i = 0; i < ls && str[i] != cd; i++);
			while (i < ls) {
				for (var j = 1; j < lk && str[i + j] === seek[j]; j++);
				if (j === lk) {
					break;
				}
				for (i++; i < ls && str[i] != cd; i++);
			}
		}
		if (i < ls) {
			$k[$j++] = str.subarray(i + lk);
			$k[$j++] = str.subarray(i, i + lk);
			$k[$j++] = str.subarray(0, i);
			$k[$j++] = true;
		} else {
			$k[$j++] = str;
			$k[$j++] = false;
		}
	}

	// The callback is omitted when forall is being used just to push onto the
	// stack.
	function $forall(o, cb) {
		if (o instanceof Uint8Array) {
			for (var i = 0, l = o.length; i < l; i++) {
				$k[$j++] = o[i];
				if (cb && cb() == $b) break;
			}
		} else if (o instanceof Array) {
			// The array may be a view.
			for (var a = o.b, i = o.o, l = o.o + o.length; i < l; i++) {
				$k[$j++] = a[i];
				if (cb && cb() == $b) break;
			}
		} else if (typeof o === 'string') {
			for (var i = 0, l = o.length; i < l; i++) {
				$k[$j++] = o.charCodeAt(i);
				if (cb && cb() == $b) break;
			}
		} else {
			for (var id in o) {
				$k[$j++] = id;
				$k[$j++] = o[id];
				if (cb && cb() == $b) break;
			}
		}
	}

	function $cleartomark() {
		while ($j > 0 && $k[--$j] !== Infinity);
	}

	function $counttomark() {
		for (var i = $j - 1; i >= 0 && $k[i] !== Infinity; i--);
		return $j - i - 1;
	}

	function $aload(a) {
		for (var i = 0, l = a.length, b = a.b, o = a.o; i < l; i++) {
			$k[$j++] = b[o + i];
		}
		// This push has been optimized out.  See $.aload() in psc.js.
		//$k[$j++] = a;
	}

	function $astore(a) {
		for (var i = 0, l = a.length, b = a.b, o = a.o + l - 1; i < l; i++) {
			b[o - i] = $k[--$j];
		}
		$k[$j++] = a;
	}

	function $eq(a, b) {
		if (typeof a === 'string' && typeof b === 'string') {
			return a == b;
		}
		if (a instanceof Uint8Array && b instanceof Uint8Array) {
			if (a.length != b.length) {
				return false;
			}
			for (var i = 0, l = a.length; i < l; i++) {
				if (a[i] != b[i]) {
					return false;
				}
			}
			return true;
		}
		if (a instanceof Uint8Array && typeof b === 'string' ||
			b instanceof Uint8Array && typeof a === 'string') {
			if (a instanceof Uint8Array) {
				a = $z(a);
			} else {
				b = $z(b);
			}
			return a == b;
		}
		return a == b;
	}

	function $ne(a, b) {
		return !$eq(a, b);
	}

	function $lt(a, b) {
		if (a instanceof Uint8Array) {
			a = $z(a);
		}
		if (b instanceof Uint8Array) {
			b = $z(b);
		}
		return a < b;
	}

	function $le(a, b) {
		if (a instanceof Uint8Array) {
			a = $z(a);
		}
		if (b instanceof Uint8Array) {
			b = $z(b);
		}
		return a <= b;
	}

	function $gt(a, b) {
		if (a instanceof Uint8Array) {
			a = $z(a);
		}
		if (b instanceof Uint8Array) {
			b = $z(b);
		}
		return a > b;
	}

	function $ge(a, b) {
		if (a instanceof Uint8Array) {
			a = $z(a);
		}
		if (b instanceof Uint8Array) {
			b = $z(b);
		}
		return a >= b;
	}

	function $an(a, b) { // and
		return (typeof a === 'boolean') ? a && b : a & b;
	}

	function $or(a, b) { // or
		return (typeof a === 'boolean') ? a || b : a | b;
	}

	function $xo(a, b) { // xor
		return (typeof a === 'boolean') ? !a && b || a && !b : a ^ b;
	}

	// DEBUG-BEGIN
	function $stack() {
		console.log('[[[');
		for (var i = $j - 1; i >= 0; i--) {
			console.log(tostring($k[i]));
		}
		console.log(']]]');

		function tostring(v) {
			// null can be mis-typed - get it out of the way
			if (v === null) {
				return 'null';
			} else if (v === undefined) {
				return '<undefined>';
			} else if (v instanceof Array) {
				var s = '<array,' + v.o + ',' + v.length + '>[';
				for (var j = v.o, a = v.b, l = v.length + v.o; j < l; j++) {
					s += (j == v.o ? '' : ',') + tostring(a[j]);
				}
				return s + ']';
			} else if (v instanceof Uint8Array) {
				return '(' + $z[v] + ')';
			} else if (typeof v === 'object') {
				var s = '<<';
				for (var id in v) {
					s += (s.length == 7 ? '' : ',') + id + ':' + tostring(v[id]);
				}
				return s + '>>';
			} else if (typeof v === 'string') {
				return '"' + v + '"';
			} else {
				return '' + v;
			}
		}
	}
	// DEBUG-END
	$0.raiseerror = function() {
		$0.$error.errorinfo = $k[--$j]; /*55*/
		$0.$error.errorname = $k[--$j]; /*56*/
		$0.$error.command = null; /*57*/
		$0.$error.newerror = true; /*58*/
		throw new Error($0.$error.errorname + ": " + $0.$error.errorinfo); /*59*/
	};

	$0.datamatrix = function() {
		var $1 = {}; /*15345*/
		$1.options = $k[--$j]; /*15347*/
		$1.barcode = $k[--$j]; /*15348*/
		$1.dontdraw = false; /*15350*/
		$1.columns = 0; /*15351*/
		$1.rows = 0; /*15352*/
		$1.format = "square"; /*15353*/
		$1.version = "unset"; /*15354*/
		$1.parse = false; /*15355*/
		$1.parsefnc = false; /*15356*/
		$1.dmre = false; /*15357*/
		$forall($1.options, function() { /*15368*/
			var _3 = $k[--$j]; /*15368*/
			$1[$k[--$j]] = _3; /*15368*/
		}); /*15368*/
		if ($ne($1.version, "unset")) { /*15374*/
			$search($1.version, "x"); /*15371*/
			$j--; /*15372*/
			$1.rows = $k[--$j]; /*15372*/
			$j--; /*15373*/
			$1.columns = $k[--$j]; /*15373*/
		} /*15373*/
		$1.columns = ~~$z($1.columns); /*15376*/
		$1.rows = ~~$z($1.rows); /*15377*/
		$1.mac05comp = false; /*15401*/
		$1.mac06comp = false; /*15402*/
		if ($1.barcode.length >= 9) { /*15411*/
			var _D = $geti($1.barcode, 0, 7); /*15404*/
			if ((($eq(_D, "[)>03605035")) || ($eq(_D, "[)>03606035"))) && $eq($geti($1.barcode, $1.barcode.length - 2, 2), "036004")) { /*15410*/
				if ($get($1.barcode, 5) == 53) { /*15408*/
					$k[$j++] = "mac05comp"; /*15408*/
				} else { /*15408*/
					$k[$j++] = "mac06comp"; /*15408*/
				} /*15408*/
				$1[$k[--$j]] = true; /*15408*/
				$1.barcode = $geti($1.barcode, 7, $1.barcode.length - 9); /*15409*/
			} /*15409*/
		} /*15409*/
		$1.barlen = $1.barcode.length; /*15413*/
		$1.fnc1 = -1; /*15416*/
		$1.prog = -2; /*15416*/
		$1.m05 = -3; /*15416*/
		$1.m06 = -4; /*15416*/
		var _S = {
			FNC1: $1.fnc1,
			PROG: $1.prog,
			MAC5: $1.m05,
			MAC6: $1.m06
		}; /*15421*/
		$1.fncvals = _S; /*15422*/
		$1.msg = $a($1.barlen); /*15423*/
		$1.i = 0; /*15424*/
		$1.j = 0; /*15424*/
		for (;;) { /*15438*/
			if ($1.i == $1.barlen) { /*15425*/
				break; /*15425*/
			} /*15425*/
			$1.char = $get($1.barcode, $1.i); /*15426*/
			if (($1.parsefnc && ($1.char == 94)) && ($1.i < ($1.barlen - 4))) { /*15434*/
				if ($get($1.barcode, $1.i + 1) != 94) { /*15432*/
					$1.char = $get($1.fncvals, $geti($1.barcode, $1.i + 1, 4)); /*15429*/
					$1.i = $1.i + 4; /*15430*/
				} else { /*15432*/
					$1.i = $1.i + 1; /*15432*/
				} /*15432*/
			} /*15432*/
			$put($1.msg, $1.j, $1.char); /*15435*/
			$1.i = $1.i + 1; /*15436*/
			$1.j = $1.j + 1; /*15437*/
		} /*15437*/
		$1.msg = $geti($1.msg, 0, $1.j); /*15439*/
		if ($1.mac05comp) { /*15442*/
			$k[$j++] = Infinity; /*15442*/
			$k[$j++] = $1.m05; /*15442*/
			$aload($1.msg); /*15442*/
			$1.msg = $a(); /*15442*/
		} /*15442*/
		if ($1.mac06comp) { /*15443*/
			$k[$j++] = Infinity; /*15443*/
			$k[$j++] = $1.m06; /*15443*/
			$aload($1.msg); /*15443*/
			$1.msg = $a(); /*15443*/
		} /*15443*/
		$1.msglen = $1.msg.length; /*15445*/
		$k[$j++] = Infinity; /*15494*/
		$k[$j++] = $a([10, 10, 1, 1, 5, 1]); /*15478*/
		$k[$j++] = $a([12, 12, 1, 1, 7, 1]); /*15478*/
		$k[$j++] = $a([14, 14, 1, 1, 10, 1]); /*15478*/
		$k[$j++] = $a([16, 16, 1, 1, 12, 1]); /*15478*/
		$k[$j++] = $a([18, 18, 1, 1, 14, 1]); /*15478*/
		$k[$j++] = $a([20, 20, 1, 1, 18, 1]); /*15478*/
		$k[$j++] = $a([22, 22, 1, 1, 20, 1]); /*15478*/
		$k[$j++] = $a([24, 24, 1, 1, 24, 1]); /*15478*/
		$k[$j++] = $a([26, 26, 1, 1, 28, 1]); /*15478*/
		$k[$j++] = $a([32, 32, 2, 2, 36, 1]); /*15478*/
		$k[$j++] = $a([36, 36, 2, 2, 42, 1]); /*15478*/
		$k[$j++] = $a([40, 40, 2, 2, 48, 1]); /*15478*/
		$k[$j++] = $a([44, 44, 2, 2, 56, 1]); /*15478*/
		$k[$j++] = $a([48, 48, 2, 2, 68, 1]); /*15478*/
		$k[$j++] = $a([52, 52, 2, 2, 84, 2]); /*15478*/
		$k[$j++] = $a([64, 64, 4, 4, 112, 2]); /*15478*/
		$k[$j++] = $a([72, 72, 4, 4, 144, 4]); /*15478*/
		$k[$j++] = $a([80, 80, 4, 4, 192, 4]); /*15478*/
		$k[$j++] = $a([88, 88, 4, 4, 224, 4]); /*15478*/
		$k[$j++] = $a([96, 96, 4, 4, 272, 4]); /*15478*/
		$k[$j++] = $a([104, 104, 4, 4, 336, 6]); /*15478*/
		$k[$j++] = $a([120, 120, 6, 6, 408, 6]); /*15478*/
		$k[$j++] = $a([132, 132, 6, 6, 496, 8]); /*15478*/
		$k[$j++] = $a([144, 144, 6, 6, 620, 10]); /*15478*/
		$k[$j++] = $a([8, 18, 1, 1, 7, 1]); /*15478*/
		$k[$j++] = $a([8, 32, 1, 2, 11, 1]); /*15478*/
		if ($1.dmre) { /*15478*/
			$k[$j++] = $a([8, 48, 1, 2, 15, 1]); /*15478*/
		} /*15478*/
		if ($1.dmre) { /*15479*/
			$k[$j++] = $a([8, 64, 1, 4, 18, 1]); /*15479*/
		} /*15479*/
		$k[$j++] = $a([12, 26, 1, 1, 14, 1]); /*15482*/
		$k[$j++] = $a([12, 36, 1, 2, 18, 1]); /*15482*/
		if ($1.dmre) { /*15482*/
			$k[$j++] = $a([12, 64, 1, 4, 27, 1]); /*15482*/
		} /*15482*/
		$k[$j++] = $a([16, 36, 1, 2, 24, 1]); /*15485*/
		$k[$j++] = $a([16, 48, 1, 2, 28, 1]); /*15485*/
		if ($1.dmre) { /*15485*/
			$k[$j++] = $a([16, 64, 1, 4, 36, 1]); /*15485*/
		} /*15485*/
		if ($1.dmre) { /*15486*/
			$k[$j++] = $a([24, 32, 1, 2, 28, 1]); /*15486*/
		} /*15486*/
		if ($1.dmre) { /*15487*/
			$k[$j++] = $a([24, 36, 1, 2, 33, 1]); /*15487*/
		} /*15487*/
		if ($1.dmre) { /*15488*/
			$k[$j++] = $a([24, 48, 1, 2, 41, 1]); /*15488*/
		} /*15488*/
		if ($1.dmre) { /*15489*/
			$k[$j++] = $a([24, 64, 1, 4, 46, 1]); /*15489*/
		} /*15489*/
		if ($1.dmre) { /*15490*/
			$k[$j++] = $a([26, 32, 1, 2, 32, 1]); /*15490*/
		} /*15490*/
		if ($1.dmre) { /*15491*/
			$k[$j++] = $a([26, 40, 1, 2, 38, 1]); /*15491*/
		} /*15491*/
		if ($1.dmre) { /*15492*/
			$k[$j++] = $a([26, 48, 1, 2, 42, 1]); /*15492*/
		} /*15492*/
		if ($1.dmre) { /*15493*/
			$k[$j++] = $a([26, 64, 1, 4, 50, 1]); /*15493*/
		} /*15493*/
		$1.metrics = $a(); /*15494*/
		$1.urows = $1.rows; /*15497*/
		$1.ucols = $1.columns; /*15498*/
		$1.fullcws = $a([]); /*15499*/
		var _21 = $1.metrics; /*15500*/
		for (var _22 = 0, _23 = _21.length; _22 < _23; _22++) { /*15517*/
			$1.m = $get(_21, _22); /*15501*/
			$1.rows = $get($1.m, 0); /*15502*/
			$1.cols = $get($1.m, 1); /*15503*/
			$1.regh = $get($1.m, 2); /*15504*/
			$1.regv = $get($1.m, 3); /*15505*/
			$1.rscw = $get($1.m, 4); /*15506*/
			$1.rsbl = $get($1.m, 5); /*15507*/
			$1.mrows = $1.rows - (2 * $1.regh); /*15508*/
			$1.mcols = $1.cols - (2 * $1.regv); /*15509*/
			$1.ncws = (~~(($1.mrows * $1.mcols) / 8)) - $1.rscw; /*15510*/
			$1.okay = true; /*15511*/
			if (($1.urows != 0) && ($1.urows != $1.rows)) { /*15512*/
				$1.okay = false; /*15512*/
			} /*15512*/
			if (($1.ucols != 0) && ($1.ucols != $1.cols)) { /*15513*/
				$1.okay = false; /*15513*/
			} /*15513*/
			if ($eq($1.format, "square") && $ne($1.rows, $1.cols)) { /*15514*/
				$1.okay = false; /*15514*/
			} /*15514*/
			if ($eq($1.format, "rectangle") && $eq($1.rows, $1.cols)) { /*15515*/
				$1.okay = false; /*15515*/
			} /*15515*/
			if ($1.okay) { /*15516*/
				$k[$j++] = Infinity; /*15516*/
				$aload($1.fullcws); /*15516*/
				$k[$j++] = $1.ncws; /*15516*/
				$1.fullcws = $a(); /*15516*/
			} /*15516*/
		} /*15516*/
		$k[$j++] = Infinity; /*15518*/
		for (var _2e = 0, _2f = 1558; _2e < _2f; _2e++) { /*15518*/
			$k[$j++] = 10000; /*15518*/
		} /*15518*/
		$1.numremcws = $a(); /*15518*/
		var _2h = $1.fullcws; /*15519*/
		for (var _2i = 0, _2j = _2h.length; _2i < _2j; _2i++) { /*15519*/
			$put($1.numremcws, $get(_2h, _2i) - 1, 1); /*15519*/
		} /*15519*/
		for (var _2m = 1556; _2m >= 0; _2m -= 1) { /*15525*/
			$1.i = _2m; /*15521*/
			if ($get($1.numremcws, $1.i) != 1) { /*15524*/
				$put($1.numremcws, $1.i, $get($1.numremcws, $1.i + 1) + 1); /*15523*/
			} /*15523*/
		} /*15523*/
		$1.lC = -5; /*15528*/
		$1.lB = -6; /*15528*/
		$1.lX = -7; /*15528*/
		$1.lT = -8; /*15528*/
		$1.lE = -9; /*15528*/
		$1.unl = -10; /*15528*/
		$1.sapp = -11; /*15529*/
		$1.usft = -12; /*15529*/
		$1.sft1 = -13; /*15529*/
		$1.sft2 = -14; /*15529*/
		$1.sft3 = -15; /*15529*/
		$1.eci = -16; /*15529*/
		$1.pad = -17; /*15529*/
		$1.unlcw = 254; /*15530*/
		$k[$j++] = "Avals"; /*15539*/
		$k[$j++] = Infinity; /*15539*/
		for (var _2v = 0; _2v <= 128; _2v += 1) { /*15533*/
			$k[$j++] = _2v; /*15533*/
			$k[$j++] = _2v + 1; /*15533*/
		} /*15533*/
		$k[$j++] = $1.pad; /*15538*/
		$k[$j++] = 129; /*15538*/
		for (var _2x = 0; _2x <= 99; _2x += 1) { /*15538*/
			var _2z = $cvrs($s(2), _2x, 10); /*15536*/
			var _31 = $strcpy($s(2), "00"); /*15536*/
			$puti(_31, 2 - _2z.length, _2z); /*15536*/
			$k[$j++] = _31; /*15537*/
			$k[$j++] = _2x + 130; /*15537*/
		} /*15537*/
		var _3E = $a([$1.lC, $1.lB, $1.fnc1, $1.sapp, $1.prog, $1.usft, $1.m05, $1.m06, $1.lX, $1.lT, $1.lE, $1.eci]); /*15539*/
		$k[$j++] = 229; /*15539*/
		for (var _3F = 0, _3G = _3E.length; _3F < _3G; _3F++) { /*15539*/
			var _3J = $k[--$j] + 1; /*15539*/
			$k[$j++] = $get(_3E, _3F); /*15539*/
			$k[$j++] = _3J; /*15539*/
			$k[$j++] = _3J; /*15539*/
		} /*15539*/
		$j--; /*15539*/
		var _3K = $d(); /*15539*/
		$1[$k[--$j]] = _3K; /*15540*/
		$k[$j++] = "Avals"; /*15542*/
		$k[$j++] = Infinity; /*15542*/
		$forall($1.Avals, function() { /*15542*/
			$k[$j++] = Infinity; /*15542*/
			var _3N = $k[--$j]; /*15542*/
			var _3O = $k[--$j]; /*15542*/
			$k[$j++] = _3N; /*15542*/
			$k[$j++] = _3O; /*15542*/
			var _3P = $a(); /*15542*/
			$k[$j++] = _3P; /*15542*/
		}); /*15542*/
		var _3Q = $d(); /*15542*/
		$1[$k[--$j]] = _3Q; /*15543*/
		$k[$j++] = "CNvals"; /*15551*/
		$k[$j++] = Infinity; /*15551*/
		$k[$j++] = $1.sft1; /*15550*/
		$k[$j++] = 0; /*15550*/
		$k[$j++] = $1.sft2; /*15550*/
		$k[$j++] = 1; /*15550*/
		$k[$j++] = $1.sft3; /*15550*/
		$k[$j++] = 2; /*15550*/
		$k[$j++] = 32; /*15550*/
		$k[$j++] = 3; /*15550*/
		for (var _3V = 48; _3V <= 57; _3V += 1) { /*15550*/
			$k[$j++] = _3V; /*15550*/
			$k[$j++] = _3V - 44; /*15550*/
		} /*15550*/
		for (var _3W = 65; _3W <= 90; _3W += 1) { /*15551*/
			$k[$j++] = _3W; /*15551*/
			$k[$j++] = _3W - 51; /*15551*/
		} /*15551*/
		var _3X = $d(); /*15551*/
		$1[$k[--$j]] = _3X; /*15552*/
		$k[$j++] = "C1vals"; /*15553*/
		$k[$j++] = Infinity; /*15553*/
		for (var _3Z = 0; _3Z <= 31; _3Z += 1) { /*15553*/
			$k[$j++] = _3Z; /*15553*/
			$k[$j++] = _3Z; /*15553*/
		} /*15553*/
		var _3a = $d(); /*15553*/
		$1[$k[--$j]] = _3a; /*15553*/
		$k[$j++] = "C2vals"; /*15559*/
		$k[$j++] = Infinity; /*15559*/
		for (var _3c = 33; _3c <= 47; _3c += 1) { /*15555*/
			$k[$j++] = _3c; /*15555*/
			$k[$j++] = _3c - 33; /*15555*/
		} /*15555*/
		for (var _3d = 58; _3d <= 64; _3d += 1) { /*15556*/
			$k[$j++] = _3d; /*15556*/
			$k[$j++] = _3d - 43; /*15556*/
		} /*15556*/
		for (var _3e = 91; _3e <= 95; _3e += 1) { /*15557*/
			$k[$j++] = _3e; /*15557*/
			$k[$j++] = _3e - 69; /*15557*/
		} /*15557*/
		$k[$j++] = $1.fnc1; /*15559*/
		$k[$j++] = 27; /*15559*/
		$k[$j++] = $1.usft; /*15559*/
		$k[$j++] = 30; /*15559*/
		var _3h = $d(); /*15559*/
		$1[$k[--$j]] = _3h; /*15560*/
		$k[$j++] = "C3vals"; /*15561*/
		$k[$j++] = Infinity; /*15561*/
		for (var _3j = 96; _3j <= 127; _3j += 1) { /*15561*/
			$k[$j++] = _3j; /*15561*/
			$k[$j++] = _3j - 96; /*15561*/
		} /*15561*/
		var _3k = $d(); /*15561*/
		$1[$k[--$j]] = _3k; /*15561*/
		$k[$j++] = "Cvals"; /*15566*/
		$k[$j++] = Infinity; /*15566*/
		$forall($1.CNvals, function() { /*15563*/
			$k[$j++] = Infinity; /*15563*/
			var _3n = $k[--$j]; /*15563*/
			var _3o = $k[--$j]; /*15563*/
			$k[$j++] = _3n; /*15563*/
			$k[$j++] = _3o; /*15563*/
			var _3p = $a(); /*15563*/
			$k[$j++] = _3p; /*15563*/
		}); /*15563*/
		$forall($1.C1vals, function() { /*15564*/
			$k[$j++] = Infinity; /*15564*/
			var _3r = $k[--$j]; /*15564*/
			var _3s = $k[--$j]; /*15564*/
			$k[$j++] = _3r; /*15564*/
			$k[$j++] = $get($1.CNvals, $1.sft1); /*15564*/
			$k[$j++] = _3s; /*15564*/
			var _3w = $a(); /*15564*/
			$k[$j++] = _3w; /*15564*/
		}); /*15564*/
		$forall($1.C2vals, function() { /*15565*/
			$k[$j++] = Infinity; /*15565*/
			var _3y = $k[--$j]; /*15565*/
			var _3z = $k[--$j]; /*15565*/
			$k[$j++] = _3y; /*15565*/
			$k[$j++] = $get($1.CNvals, $1.sft2); /*15565*/
			$k[$j++] = _3z; /*15565*/
			var _43 = $a(); /*15565*/
			$k[$j++] = _43; /*15565*/
		}); /*15565*/
		$forall($1.C3vals, function() { /*15566*/
			$k[$j++] = Infinity; /*15566*/
			var _45 = $k[--$j]; /*15566*/
			var _46 = $k[--$j]; /*15566*/
			$k[$j++] = _45; /*15566*/
			$k[$j++] = $get($1.CNvals, $1.sft3); /*15566*/
			$k[$j++] = _46; /*15566*/
			var _4A = $a(); /*15566*/
			$k[$j++] = _4A; /*15566*/
		}); /*15566*/
		var _4B = $d(); /*15566*/
		$1[$k[--$j]] = _4B; /*15567*/
		$k[$j++] = "TNvals"; /*15575*/
		$k[$j++] = Infinity; /*15575*/
		$k[$j++] = $1.sft1; /*15574*/
		$k[$j++] = 0; /*15574*/
		$k[$j++] = $1.sft2; /*15574*/
		$k[$j++] = 1; /*15574*/
		$k[$j++] = $1.sft3; /*15574*/
		$k[$j++] = 2; /*15574*/
		$k[$j++] = 32; /*15574*/
		$k[$j++] = 3; /*15574*/
		for (var _4G = 48; _4G <= 57; _4G += 1) { /*15574*/
			$k[$j++] = _4G; /*15574*/
			$k[$j++] = _4G - 44; /*15574*/
		} /*15574*/
		for (var _4H = 97; _4H <= 122; _4H += 1) { /*15575*/
			$k[$j++] = _4H; /*15575*/
			$k[$j++] = _4H - 83; /*15575*/
		} /*15575*/
		var _4I = $d(); /*15575*/
		$1[$k[--$j]] = _4I; /*15576*/
		$k[$j++] = "T1vals"; /*15577*/
		$k[$j++] = Infinity; /*15577*/
		for (var _4K = 0; _4K <= 31; _4K += 1) { /*15577*/
			$k[$j++] = _4K; /*15577*/
			$k[$j++] = _4K; /*15577*/
		} /*15577*/
		var _4L = $d(); /*15577*/
		$1[$k[--$j]] = _4L; /*15577*/
		$k[$j++] = "T2vals"; /*15583*/
		$k[$j++] = Infinity; /*15583*/
		for (var _4N = 33; _4N <= 47; _4N += 1) { /*15579*/
			$k[$j++] = _4N; /*15579*/
			$k[$j++] = _4N - 33; /*15579*/
		} /*15579*/
		for (var _4O = 58; _4O <= 64; _4O += 1) { /*15580*/
			$k[$j++] = _4O; /*15580*/
			$k[$j++] = _4O - 43; /*15580*/
		} /*15580*/
		for (var _4P = 91; _4P <= 95; _4P += 1) { /*15581*/
			$k[$j++] = _4P; /*15581*/
			$k[$j++] = _4P - 69; /*15581*/
		} /*15581*/
		$k[$j++] = $1.fnc1; /*15583*/
		$k[$j++] = 27; /*15583*/
		$k[$j++] = $1.usft; /*15583*/
		$k[$j++] = 30; /*15583*/
		var _4S = $d(); /*15583*/
		$1[$k[--$j]] = _4S; /*15584*/
		$k[$j++] = "T3vals"; /*15588*/
		$k[$j++] = Infinity; /*15588*/
		$k[$j++] = 96; /*15587*/
		$k[$j++] = 0; /*15587*/
		for (var _4U = 65; _4U <= 90; _4U += 1) { /*15587*/
			$k[$j++] = _4U; /*15587*/
			$k[$j++] = _4U - 64; /*15587*/
		} /*15587*/
		for (var _4V = 123; _4V <= 127; _4V += 1) { /*15588*/
			$k[$j++] = _4V; /*15588*/
			$k[$j++] = _4V - 96; /*15588*/
		} /*15588*/
		var _4W = $d(); /*15588*/
		$1[$k[--$j]] = _4W; /*15589*/
		$k[$j++] = "Tvals"; /*15594*/
		$k[$j++] = Infinity; /*15594*/
		$forall($1.TNvals, function() { /*15591*/
			$k[$j++] = Infinity; /*15591*/
			var _4Z = $k[--$j]; /*15591*/
			var _4a = $k[--$j]; /*15591*/
			$k[$j++] = _4Z; /*15591*/
			$k[$j++] = _4a; /*15591*/
			var _4b = $a(); /*15591*/
			$k[$j++] = _4b; /*15591*/
		}); /*15591*/
		$forall($1.T1vals, function() { /*15592*/
			$k[$j++] = Infinity; /*15592*/
			var _4d = $k[--$j]; /*15592*/
			var _4e = $k[--$j]; /*15592*/
			$k[$j++] = _4d; /*15592*/
			$k[$j++] = $get($1.TNvals, $1.sft1); /*15592*/
			$k[$j++] = _4e; /*15592*/
			var _4i = $a(); /*15592*/
			$k[$j++] = _4i; /*15592*/
		}); /*15592*/
		$forall($1.T2vals, function() { /*15593*/
			$k[$j++] = Infinity; /*15593*/
			var _4k = $k[--$j]; /*15593*/
			var _4l = $k[--$j]; /*15593*/
			$k[$j++] = _4k; /*15593*/
			$k[$j++] = $get($1.TNvals, $1.sft2); /*15593*/
			$k[$j++] = _4l; /*15593*/
			var _4p = $a(); /*15593*/
			$k[$j++] = _4p; /*15593*/
		}); /*15593*/
		$forall($1.T3vals, function() { /*15594*/
			$k[$j++] = Infinity; /*15594*/
			var _4r = $k[--$j]; /*15594*/
			var _4s = $k[--$j]; /*15594*/
			$k[$j++] = _4r; /*15594*/
			$k[$j++] = $get($1.TNvals, $1.sft3); /*15594*/
			$k[$j++] = _4s; /*15594*/
			var _4w = $a(); /*15594*/
			$k[$j++] = _4w; /*15594*/
		}); /*15594*/
		var _4x = $d(); /*15594*/
		$1[$k[--$j]] = _4x; /*15595*/
		for (var _4z = 128; _4z <= 255; _4z += 1) { /*15603*/
			$1.i = _4z; /*15599*/
			$k[$j++] = $1.Avals; /*15600*/
			$k[$j++] = $1.i; /*15600*/
			$k[$j++] = Infinity; /*15600*/
			$aload($get($1.Avals, $1.usft)); /*15600*/
			$aload($get($1.Avals, $1.i - 128)); /*15600*/
			var _58 = $a(); /*15600*/
			var _59 = $k[--$j]; /*15600*/
			$put($k[--$j], _59, _58); /*15600*/
			$k[$j++] = $1.Cvals; /*15601*/
			$k[$j++] = $1.i; /*15601*/
			$k[$j++] = Infinity; /*15601*/
			$aload($get($1.Cvals, $1.usft)); /*15601*/
			$aload($get($1.Cvals, $1.i - 128)); /*15601*/
			var _5J = $a(); /*15601*/
			var _5K = $k[--$j]; /*15601*/
			$put($k[--$j], _5K, _5J); /*15601*/
			$k[$j++] = $1.Tvals; /*15602*/
			$k[$j++] = $1.i; /*15602*/
			$k[$j++] = Infinity; /*15602*/
			$aload($get($1.Tvals, $1.usft)); /*15602*/
			$aload($get($1.Tvals, $1.i - 128)); /*15602*/
			var _5U = $a(); /*15602*/
			var _5V = $k[--$j]; /*15602*/
			$put($k[--$j], _5V, _5U); /*15602*/
		} /*15602*/
		$k[$j++] = "Xvals"; /*15611*/
		$k[$j++] = Infinity; /*15611*/
		$k[$j++] = 13; /*15610*/
		$k[$j++] = 0; /*15610*/
		$k[$j++] = 42; /*15610*/
		$k[$j++] = 1; /*15610*/
		$k[$j++] = 62; /*15610*/
		$k[$j++] = 2; /*15610*/
		$k[$j++] = 32; /*15610*/
		$k[$j++] = 3; /*15610*/
		for (var _5X = 48; _5X <= 57; _5X += 1) { /*15610*/
			$k[$j++] = _5X; /*15610*/
			$k[$j++] = _5X - 44; /*15610*/
		} /*15610*/
		for (var _5Y = 65; _5Y <= 90; _5Y += 1) { /*15611*/
			$k[$j++] = _5Y; /*15611*/
			$k[$j++] = _5Y - 51; /*15611*/
		} /*15611*/
		var _5Z = $d(); /*15611*/
		$1[$k[--$j]] = _5Z; /*15612*/
		$k[$j++] = "Xvals"; /*15614*/
		$k[$j++] = Infinity; /*15614*/
		$forall($1.Xvals, function() { /*15614*/
			$k[$j++] = Infinity; /*15614*/
			var _5c = $k[--$j]; /*15614*/
			var _5d = $k[--$j]; /*15614*/
			$k[$j++] = _5c; /*15614*/
			$k[$j++] = _5d; /*15614*/
			var _5e = $a(); /*15614*/
			$k[$j++] = _5e; /*15614*/
		}); /*15614*/
		var _5f = $d(); /*15614*/
		$1[$k[--$j]] = _5f; /*15615*/
		$k[$j++] = "Evals"; /*15620*/
		$k[$j++] = Infinity; /*15620*/
		for (var _5h = 64; _5h <= 94; _5h += 1) { /*15618*/
			$k[$j++] = _5h; /*15618*/
			$k[$j++] = _5h - 64; /*15618*/
		} /*15618*/
		$k[$j++] = $1.unl; /*15620*/
		$k[$j++] = 31; /*15620*/
		for (var _5j = 32; _5j <= 63; _5j += 1) { /*15620*/
			$k[$j++] = _5j; /*15620*/
			$k[$j++] = _5j; /*15620*/
		} /*15620*/
		var _5k = $d(); /*15620*/
		$1[$k[--$j]] = _5k; /*15621*/
		$k[$j++] = "Evals"; /*15623*/
		$k[$j++] = Infinity; /*15623*/
		$forall($1.Evals, function() { /*15623*/
			$k[$j++] = Infinity; /*15623*/
			var _5n = $k[--$j]; /*15623*/
			var _5o = $k[--$j]; /*15623*/
			$k[$j++] = _5n; /*15623*/
			$k[$j++] = _5o; /*15623*/
			var _5p = $a(); /*15623*/
			$k[$j++] = _5p; /*15623*/
		}); /*15623*/
		var _5q = $d(); /*15623*/
		$1[$k[--$j]] = _5q; /*15624*/
		$k[$j++] = "Bvals"; /*15627*/
		$k[$j++] = Infinity; /*15627*/
		for (var _5s = 0; _5s <= 255; _5s += 1) { /*15627*/
			$k[$j++] = _5s; /*15627*/
			$k[$j++] = _5s; /*15627*/
		} /*15627*/
		var _5t = $d(); /*15627*/
		$1[$k[--$j]] = _5t; /*15628*/
		$k[$j++] = "Bvals"; /*15630*/
		$k[$j++] = Infinity; /*15630*/
		$forall($1.Bvals, function() { /*15630*/
			$k[$j++] = Infinity; /*15630*/
			var _5w = $k[--$j]; /*15630*/
			var _5x = $k[--$j]; /*15630*/
			$k[$j++] = _5w; /*15630*/
			$k[$j++] = _5x; /*15630*/
			var _5y = $a(); /*15630*/
			$k[$j++] = _5y; /*15630*/
		}); /*15630*/
		var _5z = $d(); /*15630*/
		$1[$k[--$j]] = _5z; /*15631*/
		$1.encvals = $a([$1.Avals, $1.Cvals, $1.Tvals, $1.Xvals, $1.Evals, $1.Bvals]); /*15633*/
		$k[$j++] = Infinity; /*15635*/
		for (var _69 = 0, _6A = $1.msglen; _69 < _6A; _69++) { /*15635*/
			$k[$j++] = 0; /*15635*/
		} /*15635*/
		$k[$j++] = 0; /*15635*/
		$1.numD = $a(); /*15635*/
		$k[$j++] = Infinity; /*15636*/
		for (var _6D = 0, _6E = $1.msglen; _6D < _6E; _6D++) { /*15636*/
			$k[$j++] = 0; /*15636*/
		} /*15636*/
		$k[$j++] = 9999; /*15636*/
		$1.nextXterm = $a(); /*15636*/
		$k[$j++] = Infinity; /*15637*/
		for (var _6H = 0, _6I = $1.msglen; _6H < _6I; _6H++) { /*15637*/
			$k[$j++] = 0; /*15637*/
		} /*15637*/
		$k[$j++] = 9999; /*15637*/
		$1.nextNonX = $a(); /*15637*/
		for (var _6L = $1.msglen - 1; _6L >= 0; _6L -= 1) { /*15654*/
			$1.i = _6L; /*15639*/
			$1.barchar = $get($1.msg, $1.i); /*15640*/
			if (($1.barchar >= 48) && ($1.barchar <= 57)) { /*15643*/
				$put($1.numD, $1.i, $get($1.numD, $1.i + 1) + 1); /*15642*/
			} /*15642*/
			if ((($1.barchar == 13) || ($1.barchar == 42)) || ($1.barchar == 62)) { /*15647*/
				$put($1.nextXterm, $1.i, 0); /*15645*/
			} else { /*15647*/
				$put($1.nextXterm, $1.i, $get($1.nextXterm, $1.i + 1) + 1); /*15647*/
			} /*15647*/
			var _6i = $get($1.Xvals, $1.barchar) !== undefined; /*15649*/
			if (!_6i) { /*15652*/
				$put($1.nextNonX, $1.i, 0); /*15650*/
			} else { /*15652*/
				$put($1.nextNonX, $1.i, $get($1.nextNonX, $1.i + 1) + 1); /*15652*/
			} /*15652*/
		} /*15652*/
		$k[$j++] = Infinity; /*15655*/
		var _6q = $1.nextXterm; /*15655*/
		for (var _6r = 0, _6s = _6q.length; _6r < _6s; _6r++) { /*15655*/
			var _6t = $get(_6q, _6r); /*15655*/
			$k[$j++] = _6t; /*15655*/
			if (_6t > 10000) { /*15655*/
				$j--; /*15655*/
				$k[$j++] = 10000; /*15655*/
			} /*15655*/
		} /*15655*/
		$1.nextXterm = $a(); /*15655*/
		$k[$j++] = Infinity; /*15656*/
		var _6v = $1.nextNonX; /*15656*/
		for (var _6w = 0, _6x = _6v.length; _6w < _6x; _6w++) { /*15656*/
			var _6y = $get(_6v, _6w); /*15656*/
			$k[$j++] = _6y; /*15656*/
			if (_6y > 10000) { /*15656*/
				$j--; /*15656*/
				$k[$j++] = 10000; /*15656*/
			} /*15656*/
		} /*15656*/
		$1.nextNonX = $a(); /*15656*/
		$1.isD = function() {
			$k[$j++] = ($1.char >= 48) && ($1.char <= 57); /*15658*/
		}; /*15658*/
		$1.isC = function() {
			var _74 = $get($1.CNvals, $1.char) !== undefined; /*15659*/
			$k[$j++] = _74; /*15659*/
		}; /*15659*/
		$1.isT = function() {
			var _77 = $get($1.TNvals, $1.char) !== undefined; /*15660*/
			$k[$j++] = _77; /*15660*/
		}; /*15660*/
		$1.isX = function() {
			var _7A = $get($1.Xvals, $1.char) !== undefined; /*15661*/
			$k[$j++] = _7A; /*15661*/
		}; /*15661*/
		$1.isE = function() {
			var _7D = $get($1.Evals, $1.char) !== undefined; /*15662*/
			$k[$j++] = _7D; /*15662*/
		}; /*15662*/
		$1.isEA = function() {
			$k[$j++] = $1.char > 127; /*15663*/
		}; /*15663*/
		$1.isFN = function() {
			$k[$j++] = $1.char < 0; /*15664*/
		}; /*15664*/
		$1.XtermFirst = function() {
			var _7G = $k[--$j]; /*15665*/
			$k[$j++] = $lt($get($1.nextXterm, _7G), $get($1.nextNonX, _7G)); /*15665*/
		}; /*15665*/
		$1.A = 0; /*15667*/
		$1.C = 1; /*15667*/
		$1.T = 2; /*15667*/
		$1.X = 3; /*15667*/
		$1.E = 4; /*15667*/
		$1.B = 5; /*15667*/
		$1.lookup = function() {
			$1.ac = 1; /*15670*/
			$1.cc = 2; /*15670*/
			$1.tc = 2; /*15670*/
			$1.xc = 2; /*15670*/
			$1.ec = 2; /*15670*/
			$1.bc = 2.25; /*15670*/
			if ($1.mode == $1.A) { /*15671*/
				$1.ac = 0; /*15671*/
				$1.cc = 1; /*15671*/
				$1.tc = 1; /*15671*/
				$1.xc = 1; /*15671*/
				$1.ec = 1; /*15671*/
				$1.bc = 1.25; /*15671*/
			} /*15671*/
			if ($1.mode == $1.C) { /*15672*/
				$1.cc = 0; /*15672*/
			} /*15672*/
			if ($1.mode == $1.T) { /*15673*/
				$1.tc = 0; /*15673*/
			} /*15673*/
			if ($1.mode == $1.X) { /*15674*/
				$1.xc = 0; /*15674*/
			} /*15674*/
			if ($1.mode == $1.E) { /*15675*/
				$1.ec = 0; /*15675*/
			} /*15675*/
			if ($1.mode == $1.B) { /*15676*/
				$1.bc = 0; /*15676*/
			} /*15676*/
			for (var _7X = 0, _7Y = 1; _7X < _7Y; _7X++) { /*15709*/
				$1.k = 0; /*15678*/
				for (;;) { /*15708*/
					if (($1.i + $1.k) == $1.msglen) { /*15687*/
						var _7c = $a(["ac", "cc", "tc", "xc", "ec", "bc"]); /*15680*/
						for (var _7d = 0, _7e = _7c.length; _7d < _7e; _7d++) { /*15680*/
							var _7f = $get(_7c, _7d); /*15680*/
							$1[_7f] = Math.ceil($1[_7f]); /*15680*/
						} /*15680*/
						var _7m = $a([$1.cc, $1.tc, $1.xc, $1.ec, $1.bc]); /*15681*/
						$k[$j++] = true; /*15681*/
						for (var _7n = 0, _7o = _7m.length; _7n < _7o; _7n++) { /*15681*/
							var _7r = $k[--$j]; /*15681*/
							$k[$j++] = _7r && ($1.ac <= $get(_7m, _7n)); /*15681*/
						} /*15681*/
						if ($k[--$j]) { /*15681*/
							$k[$j++] = $1.A; /*15681*/
							break; /*15681*/
						} /*15681*/
						var _7z = $a([$1.ac, $1.cc, $1.tc, $1.xc, $1.ec]); /*15682*/
						$k[$j++] = true; /*15682*/
						for (var _80 = 0, _81 = _7z.length; _80 < _81; _80++) { /*15682*/
							var _84 = $k[--$j]; /*15682*/
							$k[$j++] = _84 && ($1.bc < $get(_7z, _80)); /*15682*/
						} /*15682*/
						if ($k[--$j]) { /*15682*/
							$k[$j++] = $1.B; /*15682*/
							break; /*15682*/
						} /*15682*/
						var _8C = $a([$1.ac, $1.cc, $1.tc, $1.xc, $1.bc]); /*15683*/
						$k[$j++] = true; /*15683*/
						for (var _8D = 0, _8E = _8C.length; _8D < _8E; _8D++) { /*15683*/
							var _8H = $k[--$j]; /*15683*/
							$k[$j++] = _8H && ($1.ec < $get(_8C, _8D)); /*15683*/
						} /*15683*/
						if ($k[--$j]) { /*15683*/
							$k[$j++] = $1.E; /*15683*/
							break; /*15683*/
						} /*15683*/
						var _8P = $a([$1.ac, $1.cc, $1.xc, $1.ec, $1.bc]); /*15684*/
						$k[$j++] = true; /*15684*/
						for (var _8Q = 0, _8R = _8P.length; _8Q < _8R; _8Q++) { /*15684*/
							var _8U = $k[--$j]; /*15684*/
							$k[$j++] = _8U && ($1.tc < $get(_8P, _8Q)); /*15684*/
						} /*15684*/
						if ($k[--$j]) { /*15684*/
							$k[$j++] = $1.T; /*15684*/
							break; /*15684*/
						} /*15684*/
						var _8c = $a([$1.ac, $1.cc, $1.tc, $1.ec, $1.bc]); /*15685*/
						$k[$j++] = true; /*15685*/
						for (var _8d = 0, _8e = _8c.length; _8d < _8e; _8d++) { /*15685*/
							var _8h = $k[--$j]; /*15685*/
							$k[$j++] = _8h && ($1.xc < $get(_8c, _8d)); /*15685*/
						} /*15685*/
						if ($k[--$j]) { /*15685*/
							$k[$j++] = $1.X; /*15685*/
							break; /*15685*/
						} /*15685*/
						$k[$j++] = $1.C; /*15686*/
						break; /*15686*/
					} /*15686*/
					$1.char = $get($1.msg, $1.i + $1.k); /*15688*/
					$k[$j++] = "ac"; /*15689*/
					$k[$j++] = $1.ac; /*15689*/
					if ($1.isD() == $b) break; /*15689*/
					if ($k[--$j]) { /*15689*/
						var _8r = $k[--$j]; /*15689*/
						$k[$j++] = _8r + (1 / 2); /*15689*/
					} else { /*15689*/
						if ($1.isEA() == $b) break; /*15689*/
						if ($k[--$j]) { /*15689*/
							var _8t = $k[--$j]; /*15689*/
							$k[$j++] = Math.ceil(_8t) + 2; /*15689*/
						} else { /*15689*/
							var _8u = $k[--$j]; /*15689*/
							$k[$j++] = Math.ceil(_8u) + 1; /*15689*/
						} /*15689*/
					} /*15689*/
					var _8v = $k[--$j]; /*15689*/
					$1[$k[--$j]] = _8v; /*15689*/
					$k[$j++] = "cc"; /*15690*/
					$k[$j++] = $1.cc; /*15690*/
					if ($1.isC() == $b) break; /*15690*/
					if ($k[--$j]) { /*15690*/
						var _8z = $k[--$j]; /*15690*/
						$k[$j++] = _8z + (2 / 3); /*15690*/
					} else { /*15690*/
						if ($1.isEA() == $b) break; /*15690*/
						if ($k[--$j]) { /*15690*/
							var _91 = $k[--$j]; /*15690*/
							$k[$j++] = _91 + (8 / 3); /*15690*/
						} else { /*15690*/
							var _92 = $k[--$j]; /*15690*/
							$k[$j++] = _92 + (4 / 3); /*15690*/
						} /*15690*/
					} /*15690*/
					var _93 = $k[--$j]; /*15690*/
					$1[$k[--$j]] = _93; /*15690*/
					$k[$j++] = "tc"; /*15691*/
					$k[$j++] = $1.tc; /*15691*/
					if ($1.isT() == $b) break; /*15691*/
					if ($k[--$j]) { /*15691*/
						var _97 = $k[--$j]; /*15691*/
						$k[$j++] = _97 + (2 / 3); /*15691*/
					} else { /*15691*/
						if ($1.isEA() == $b) break; /*15691*/
						if ($k[--$j]) { /*15691*/
							var _99 = $k[--$j]; /*15691*/
							$k[$j++] = _99 + (8 / 3); /*15691*/
						} else { /*15691*/
							var _9A = $k[--$j]; /*15691*/
							$k[$j++] = _9A + (4 / 3); /*15691*/
						} /*15691*/
					} /*15691*/
					var _9B = $k[--$j]; /*15691*/
					$1[$k[--$j]] = _9B; /*15691*/
					$k[$j++] = "xc"; /*15692*/
					$k[$j++] = $1.xc; /*15692*/
					if ($1.isX() == $b) break; /*15692*/
					if ($k[--$j]) { /*15692*/
						var _9F = $k[--$j]; /*15692*/
						$k[$j++] = _9F + (2 / 3); /*15692*/
					} else { /*15692*/
						if ($1.isEA() == $b) break; /*15692*/
						if ($k[--$j]) { /*15692*/
							var _9H = $k[--$j]; /*15692*/
							$k[$j++] = _9H + (13 / 3); /*15692*/
						} else { /*15692*/
							var _9I = $k[--$j]; /*15692*/
							$k[$j++] = _9I + (10 / 3); /*15692*/
						} /*15692*/
					} /*15692*/
					var _9J = $k[--$j]; /*15692*/
					$1[$k[--$j]] = _9J; /*15692*/
					$k[$j++] = "ec"; /*15693*/
					$k[$j++] = $1.ec; /*15693*/
					if ($1.isE() == $b) break; /*15693*/
					if ($k[--$j]) { /*15693*/
						var _9N = $k[--$j]; /*15693*/
						$k[$j++] = _9N + (3 / 4); /*15693*/
					} else { /*15693*/
						if ($1.isEA() == $b) break; /*15693*/
						if ($k[--$j]) { /*15693*/
							var _9P = $k[--$j]; /*15693*/
							$k[$j++] = _9P + (17 / 4); /*15693*/
						} else { /*15693*/
							var _9Q = $k[--$j]; /*15693*/
							$k[$j++] = _9Q + (13 / 4); /*15693*/
						} /*15693*/
					} /*15693*/
					var _9R = $k[--$j]; /*15693*/
					$1[$k[--$j]] = _9R; /*15693*/
					$k[$j++] = "bc"; /*15694*/
					$k[$j++] = $1.bc; /*15694*/
					if ($1.isFN() == $b) break; /*15694*/
					if ($k[--$j]) { /*15694*/
						var _9V = $k[--$j]; /*15694*/
						$k[$j++] = _9V + 4; /*15694*/
					} else { /*15694*/
						var _9W = $k[--$j]; /*15694*/
						$k[$j++] = _9W + 1; /*15694*/
					} /*15694*/
					var _9X = $k[--$j]; /*15694*/
					$1[$k[--$j]] = _9X; /*15694*/
					if ($1.k >= 4) { /*15706*/
						var _9f = $a([$1.cc, $1.tc, $1.xc, $1.ec, $1.bc]); /*15696*/
						$k[$j++] = true; /*15696*/
						for (var _9g = 0, _9h = _9f.length; _9g < _9h; _9g++) { /*15696*/
							var _9k = $k[--$j]; /*15696*/
							$k[$j++] = _9k && (($1.ac + 1) <= $get(_9f, _9g)); /*15696*/
						} /*15696*/
						if ($k[--$j]) { /*15696*/
							$k[$j++] = $1.A; /*15696*/
							break; /*15696*/
						} /*15696*/
						if (($1.bc + 1) <= $1.ac) { /*15697*/
							$k[$j++] = $1.B; /*15697*/
							break; /*15697*/
						} /*15697*/
						var _9u = $a([$1.cc, $1.tc, $1.xc, $1.ec]); /*15698*/
						$k[$j++] = true; /*15698*/
						for (var _9v = 0, _9w = _9u.length; _9v < _9w; _9v++) { /*15698*/
							var _9z = $k[--$j]; /*15698*/
							$k[$j++] = _9z && (($1.bc + 1) < $get(_9u, _9v)); /*15698*/
						} /*15698*/
						if ($k[--$j]) { /*15698*/
							$k[$j++] = $1.B; /*15698*/
							break; /*15698*/
						} /*15698*/
						var _A7 = $a([$1.ac, $1.cc, $1.tc, $1.xc, $1.bc]); /*15699*/
						$k[$j++] = true; /*15699*/
						for (var _A8 = 0, _A9 = _A7.length; _A8 < _A9; _A8++) { /*15699*/
							var _AC = $k[--$j]; /*15699*/
							$k[$j++] = _AC && (($1.ec + 1) < $get(_A7, _A8)); /*15699*/
						} /*15699*/
						if ($k[--$j]) { /*15699*/
							$k[$j++] = $1.E; /*15699*/
							break; /*15699*/
						} /*15699*/
						var _AK = $a([$1.ac, $1.cc, $1.xc, $1.ec, $1.bc]); /*15700*/
						$k[$j++] = true; /*15700*/
						for (var _AL = 0, _AM = _AK.length; _AL < _AM; _AL++) { /*15700*/
							var _AP = $k[--$j]; /*15700*/
							$k[$j++] = _AP && (($1.tc + 1) < $get(_AK, _AL)); /*15700*/
						} /*15700*/
						if ($k[--$j]) { /*15700*/
							$k[$j++] = $1.T; /*15700*/
							break; /*15700*/
						} /*15700*/
						var _AX = $a([$1.ac, $1.cc, $1.tc, $1.ec, $1.bc]); /*15701*/
						$k[$j++] = true; /*15701*/
						for (var _AY = 0, _AZ = _AX.length; _AY < _AZ; _AY++) { /*15701*/
							var _Ac = $k[--$j]; /*15701*/
							$k[$j++] = _Ac && (($1.xc + 1) < $get(_AX, _AY)); /*15701*/
						} /*15701*/
						if ($k[--$j]) { /*15701*/
							$k[$j++] = $1.X; /*15701*/
							break; /*15701*/
						} /*15701*/
						var _Aj = $a([$1.ac, $1.tc, $1.ec, $1.bc]); /*15702*/
						$k[$j++] = true; /*15702*/
						for (var _Ak = 0, _Al = _Aj.length; _Ak < _Al; _Ak++) { /*15702*/
							var _Ao = $k[--$j]; /*15702*/
							$k[$j++] = _Ao && (($1.cc + 1) < $get(_Aj, _Ak)); /*15702*/
						} /*15702*/
						if ($k[--$j]) { /*15705*/
							if ($1.cc < $1.xc) { /*15703*/
								$k[$j++] = $1.C; /*15703*/
								break; /*15703*/
							} /*15703*/
							if ($1.cc == $1.xc) { /*15704*/
								$k[$j++] = ($1.i + $1.k) + 1; /*15704*/
								if ($1.XtermFirst() == $b) break; /*15704*/
								if ($k[--$j]) { /*15704*/
									$k[$j++] = $1.X; /*15704*/
									break; /*15704*/
								} else { /*15704*/
									$k[$j++] = $1.C; /*15704*/
									break; /*15704*/
								} /*15704*/
							} /*15704*/
						} /*15704*/
					} /*15704*/
					$1.k = $1.k + 1; /*15707*/
				} /*15707*/
			} /*15707*/
		}; /*15710*/
		$1.addtocws = function() {
			var _B1 = $k[--$j]; /*15713*/
			$puti($1.cws, $1.j, _B1); /*15713*/
			$1.j = _B1.length + $1.j; /*15714*/
		}; /*15715*/
		$1.encA = function() {
			for (var _B5 = 0, _B6 = 1; _B5 < _B6; _B5++) { /*15733*/
				if ($get($1.numD, $1.i) >= 2) { /*15723*/
					var _BA = $s(2); /*15720*/
					$put(_BA, 0, $get($1.msg, $1.i)); /*15720*/
					$put(_BA, 1, $get($1.msg, $1.i + 1)); /*15720*/
					$k[$j++] = $get($1.Avals, _BA); /*15720*/
					if ($1.addtocws() == $b) break; /*15720*/
					$1.i = $1.i + 2; /*15721*/
					break; /*15722*/
				} /*15722*/
				$k[$j++] = "newmode"; /*15724*/
				if ($1.lookup() == $b) break; /*15724*/
				var _BK = $k[--$j]; /*15724*/
				$1[$k[--$j]] = _BK; /*15724*/
				if ($1.newmode != $1.mode) { /*15729*/
					$k[$j++] = $get($1.Avals, $get($a([-1, $1.lC, $1.lT, $1.lX, $1.lE, $1.lB]), $1.newmode)); /*15726*/
					if ($1.addtocws() == $b) break; /*15726*/
					$1.mode = $1.newmode; /*15727*/
					break; /*15728*/
				} /*15728*/
				$k[$j++] = $get($1.Avals, $get($1.msg, $1.i)); /*15730*/
				if ($1.addtocws() == $b) break; /*15730*/
				$1.i = $1.i + 1; /*15731*/
				break; /*15732*/
			} /*15732*/
		}; /*15734*/
		$1.CTXvalstocws = function() {
			$1.in = $k[--$j]; /*15737*/
			$k[$j++] = Infinity; /*15738*/
			for (var _Bi = 0, _Bh = $1.in.length - 1; _Bi <= _Bh; _Bi += 3) { /*15742*/
				$k[$j++] = 0; /*15740*/
				$forall($geti($1.in, _Bi, 3), function() { /*15740*/
					var _Bl = $k[--$j]; /*15740*/
					var _Bm = $k[--$j]; /*15740*/
					$k[$j++] = (_Bm + _Bl) * 40; /*15740*/
				}); /*15740*/
				var _Bo = (~~($k[--$j] / 40)) + 1; /*15741*/
				$k[$j++] = ~~(_Bo / 256); /*15741*/
				$k[$j++] = _Bo % 256; /*15741*/
			} /*15741*/
			$astore($a($counttomark())); /*15743*/
			var _Br = $k[--$j]; /*15743*/
			var _Bs = $k[--$j]; /*15743*/
			$k[$j++] = _Br; /*15743*/
		}; /*15744*/
		$1.encCTX = function() {
			$1.p = 0; /*15747*/
			$1.ctxvals = $a(2500); /*15748*/
			for (;;) { /*15816*/
				if ($1.i == $1.msglen) { /*15752*/
					break; /*15752*/
				} /*15752*/
				var _C2 = $get($get($1.encvals, $1.mode), $get($1.msg, $1.i)) !== undefined; /*15753*/
				if (!_C2) { /*15753*/
					break; /*15753*/
				} /*15753*/
				if (($1.p % 3) == 0) { /*15811*/
					if ($1.lookup() == $b) break; /*15755*/
					if ($ne($k[--$j], $1.mode)) { /*15760*/
						$k[$j++] = $geti($1.ctxvals, 0, $1.p); /*15756*/
						if ($1.CTXvalstocws() == $b) break; /*15756*/
						if ($1.addtocws() == $b) break; /*15756*/
						$k[$j++] = $a([$1.unlcw]); /*15757*/
						if ($1.addtocws() == $b) break; /*15757*/
						$1.mode = $1.A; /*15758*/
						break; /*15759*/
					} /*15759*/
					if (($1.msglen - $1.i) <= 3) { /*15810*/
						$1.remcws = $get($1.numremcws, $1.j + ((~~($1.p / 3)) * 2)); /*15762*/
						$k[$j++] = Infinity; /*15771*/
						$forall($geti($1.msg, $1.i, $1.msglen - $1.i), function() { /*15770*/
							var _CN = $k[--$j]; /*15765*/
							var _CR = $get($get($1.encvals, $1.mode), _CN) !== undefined; /*15765*/
							$k[$j++] = _CN; /*15769*/
							if (_CR) { /*15768*/
								$aload($get($get($1.encvals, $1.mode), $k[--$j])); /*15766*/
							} else { /*15768*/
								$j--; /*15768*/
								$k[$j++] = -1; /*15768*/
								$k[$j++] = -1; /*15768*/
								$k[$j++] = -1; /*15768*/
								$k[$j++] = -1; /*15768*/
							} /*15768*/
						}); /*15768*/
						$1.remvals = $a(); /*15771*/
						if (($1.remcws == 2) && ($1.remvals.length == 3)) { /*15781*/
							$k[$j++] = Infinity; /*15776*/
							$aload($geti($1.ctxvals, 0, $1.p)); /*15775*/
							$aload($1.remvals); /*15776*/
							var _Ce = $a(); /*15776*/
							$k[$j++] = _Ce; /*15777*/
							if ($1.CTXvalstocws() == $b) break; /*15777*/
							if ($1.addtocws() == $b) break; /*15777*/
							$1.mode = $1.A; /*15778*/
							$1.i = $1.msglen; /*15779*/
							break; /*15780*/
						} /*15780*/
						if ((($1.remcws == 2) && ($1.remvals.length == 2)) && ($1.mode != $1.X)) { /*15792*/
							$k[$j++] = Infinity; /*15787*/
							$aload($geti($1.ctxvals, 0, $1.p)); /*15785*/
							$aload($1.remvals); /*15786*/
							$aload($get($get($1.encvals, $1.mode), $1.sft1)); /*15787*/
							var _Cu = $a(); /*15787*/
							$k[$j++] = _Cu; /*15788*/
							if ($1.CTXvalstocws() == $b) break; /*15788*/
							if ($1.addtocws() == $b) break; /*15788*/
							$1.mode = $1.A; /*15789*/
							$1.i = $1.msglen; /*15790*/
							break; /*15791*/
						} /*15791*/
						if (($1.remcws == 2) && ($1.remvals.length == 1)) { /*15801*/
							$k[$j++] = $geti($1.ctxvals, 0, $1.p); /*15795*/
							if ($1.CTXvalstocws() == $b) break; /*15795*/
							if ($1.addtocws() == $b) break; /*15795*/
							$k[$j++] = $a([$1.unlcw]); /*15796*/
							if ($1.addtocws() == $b) break; /*15796*/
							$k[$j++] = $get($1.Avals, $get($1.msg, $1.i)); /*15797*/
							if ($1.addtocws() == $b) break; /*15797*/
							$1.mode = $1.A; /*15798*/
							$1.i = $1.msglen; /*15799*/
							break; /*15800*/
						} /*15800*/
						if (($1.remcws == 1) && ($1.remvals.length == 1)) { /*15809*/
							$k[$j++] = $geti($1.ctxvals, 0, $1.p); /*15804*/
							if ($1.CTXvalstocws() == $b) break; /*15804*/
							if ($1.addtocws() == $b) break; /*15804*/
							$k[$j++] = $get($1.Avals, $get($1.msg, $1.i)); /*15805*/
							if ($1.addtocws() == $b) break; /*15805*/
							$1.mode = $1.A; /*15806*/
							$1.i = $1.msglen; /*15807*/
							break; /*15808*/
						} /*15808*/
					} /*15808*/
				} /*15808*/
				var _DT = $get($get($1.encvals, $1.mode), $get($1.msg, $1.i)); /*15812*/
				$puti($1.ctxvals, $1.p, _DT); /*15813*/
				$1.p = _DT.length + $1.p; /*15814*/
				$1.i = $1.i + 1; /*15815*/
			} /*15815*/
			if ($1.mode != $1.A) { /*15840*/
				for (;;) { /*15824*/
					if (($1.p % 3) == 0) { /*15821*/
						break; /*15821*/
					} /*15821*/
					$1.i = $1.i - 1; /*15822*/
					$1.p = $1.p - $get($get($1.encvals, $1.mode), $get($1.msg, $1.i)).length; /*15823*/
				} /*15823*/
				$k[$j++] = Infinity; /*15826*/
				$aload($geti($1.ctxvals, 0, $1.p)); /*15826*/
				var _Dn = $a(); /*15826*/
				$k[$j++] = _Dn; /*15827*/
				if ($1.CTXvalstocws() == $b) return $b; /*15827*/
				if ($1.addtocws() == $b) return $b; /*15827*/
				$k[$j++] = $a([$1.unlcw]); /*15828*/
				if ($1.addtocws() == $b) return $b; /*15828*/
				$1.mode = $1.A; /*15829*/
				if ($1.i != $1.msglen) { /*15839*/
					if ($get($1.numD, $1.i) >= 2) { /*15837*/
						var _Dw = $s(2); /*15833*/
						$put(_Dw, 0, $get($1.msg, $1.i)); /*15833*/
						$put(_Dw, 1, $get($1.msg, $1.i + 1)); /*15833*/
						$k[$j++] = $get($1.Avals, _Dw); /*15833*/
						if ($1.addtocws() == $b) return $b; /*15833*/
						$1.i = $1.i + 2; /*15834*/
					} else { /*15837*/
						$k[$j++] = $get($1.Avals, $get($1.msg, $1.i)); /*15836*/
						if ($1.addtocws() == $b) return $b; /*15836*/
						$1.i = $1.i + 1; /*15837*/
					} /*15837*/
				} /*15837*/
			} /*15837*/
		}; /*15842*/
		$1.Evalstocws = function() {
			$1.in = $k[--$j]; /*15845*/
			$1.inlen = $1.in.length; /*15846*/
			$1.outlen = ~~(Math.ceil(($1.in.length / 4) * 3)); /*15847*/
			$k[$j++] = Infinity; /*15848*/
			$aload($1.in); /*15848*/
			$k[$j++] = 0; /*15848*/
			$k[$j++] = 0; /*15848*/
			$k[$j++] = 0; /*15848*/
			$1.in = $a(); /*15848*/
			$k[$j++] = Infinity; /*15849*/
			for (var _EJ = 0, _EI = $1.inlen - 1; _EJ <= _EI; _EJ += 4) { /*15855*/
				$k[$j++] = 0; /*15851*/
				$forall($geti($1.in, _EJ, 4), function() { /*15851*/
					var _EM = $k[--$j]; /*15851*/
					var _EN = $k[--$j]; /*15851*/
					$k[$j++] = $or(_EN, _EM) << 6; /*15851*/
				}); /*15851*/
				var _EP = $k[--$j] >>> 6; /*15852*/
				$k[$j++] = (_EP >>> 16) & 255; /*15854*/
				$k[$j++] = (_EP >>> 8) & 255; /*15854*/
				$k[$j++] = _EP & 255; /*15854*/
			} /*15854*/
			$astore($a($counttomark())); /*15856*/
			var _ES = $k[--$j]; /*15856*/
			var _ET = $k[--$j]; /*15856*/
			$k[$j++] = $geti(_ES, 0, $1.outlen); /*15857*/
		}; /*15858*/
		$1.encE = function() {
			$1.p = 0; /*15861*/
			$1.edifactvals = $a(2100); /*15862*/
			for (;;) { /*15891*/
				if ($1.i == $1.msglen) { /*15866*/
					break; /*15866*/
				} /*15866*/
				var _Ed = $get($1.Evals, $get($1.msg, $1.i)) !== undefined; /*15867*/
				if (!_Ed) { /*15867*/
					break; /*15867*/
				} /*15867*/
				if (($1.p % 4) == 0) { /*15886*/
					if (($1.msglen - $1.i) <= 2) { /*15884*/
						$1.remcws = $get($1.numremcws, $1.j + ((~~($1.p / 4)) * 3)); /*15870*/
						$k[$j++] = Infinity; /*15875*/
						$forall($geti($1.msg, $1.i, $1.msglen - $1.i), function() { /*15874*/
							$aload($get($1.Avals, $k[--$j])); /*15873*/
						}); /*15873*/
						$1.remvals = $a(); /*15875*/
						if ((($1.remcws == 1) || ($1.remcws == 2)) && ($1.remvals.length <= $1.remcws)) { /*15883*/
							$k[$j++] = $geti($1.edifactvals, 0, $1.p); /*15878*/
							if ($1.Evalstocws() == $b) break; /*15878*/
							if ($1.addtocws() == $b) break; /*15878*/
							$k[$j++] = $1.remvals; /*15879*/
							if ($1.addtocws() == $b) break; /*15879*/
							$1.mode = $1.A; /*15880*/
							$1.i = $1.msglen; /*15881*/
							break; /*15882*/
						} /*15882*/
					} /*15882*/
					if ($1.lookup() == $b) break; /*15885*/
					if ($k[--$j] != $1.mode) { /*15885*/
						break; /*15885*/
					} /*15885*/
				} /*15885*/
				var _FA = $get($1.Evals, $get($1.msg, $1.i)); /*15887*/
				$puti($1.edifactvals, $1.p, _FA); /*15888*/
				$1.p = _FA.length + $1.p; /*15889*/
				$1.i = $1.i + 1; /*15890*/
			} /*15890*/
			if ($1.mode != $1.A) { /*15913*/
				$1.remcws = $get($1.numremcws, ($1.j + ((~~($1.p / 4)) * 3)) - 1) - 1; /*15895*/
				if (((($1.p % 4) != 0) || ($1.i != $1.msglen)) || ($1.remcws >= 3)) { /*15900*/
					var _FR = $get($1.Evals, $1.unl); /*15897*/
					$puti($1.edifactvals, $1.p, _FR); /*15898*/
					$1.p = _FR.length + $1.p; /*15899*/
				} /*15899*/
				$k[$j++] = $geti($1.edifactvals, 0, $1.p); /*15901*/
				if ($1.Evalstocws() == $b) return $b; /*15901*/
				if ($1.addtocws() == $b) return $b; /*15901*/
				$1.mode = $1.A; /*15902*/
				if ($1.i != $1.msglen) { /*15912*/
					if ($get($1.numD, $1.i) >= 2) { /*15910*/
						var _Fe = $s(2); /*15906*/
						$put(_Fe, 0, $get($1.msg, $1.i)); /*15906*/
						$put(_Fe, 1, $get($1.msg, $1.i + 1)); /*15906*/
						$k[$j++] = $get($1.Avals, _Fe); /*15906*/
						if ($1.addtocws() == $b) return $b; /*15906*/
						$1.i = $1.i + 2; /*15907*/
					} else { /*15910*/
						$k[$j++] = $get($1.Avals, $get($1.msg, $1.i)); /*15909*/
						if ($1.addtocws() == $b) return $b; /*15909*/
						$1.i = $1.i + 1; /*15910*/
					} /*15910*/
				} /*15910*/
			} /*15910*/
		}; /*15915*/
		$1.encB = function() {
			$1.p = 0; /*15918*/
			$1.bvals = $a(1558); /*15918*/
			for (;;) { /*15924*/
				if ($1.i == $1.msglen) { /*15919*/
					break; /*15919*/
				} /*15919*/
				if ($1.lookup() == $b) break; /*15920*/
				if ($k[--$j] != $1.mode) { /*15920*/
					break; /*15920*/
				} /*15920*/
				$put($1.bvals, $1.p, $get($1.msg, $1.i)); /*15921*/
				$1.p = $1.p + 1; /*15922*/
				$1.i = $1.i + 1; /*15923*/
			} /*15923*/
			$1.remcws = $get($1.numremcws, $1.j + $1.p) - 1; /*15925*/
			$k[$j++] = Infinity; /*15933*/
			if (($1.remcws == 0) && ($1.i == $1.msglen)) { /*15930*/
				$k[$j++] = 0; /*15928*/
			} else { /*15930*/
				if ($1.p < 250) { /*15930*/
					$k[$j++] = $1.p; /*15930*/
				} else { /*15930*/
					$k[$j++] = (~~($1.p / 250)) + 249; /*15930*/
					$k[$j++] = $1.p % 250; /*15930*/
				} /*15930*/
			} /*15930*/
			$aload($geti($1.bvals, 0, $1.p)); /*15932*/
			$1.bvals = $a(); /*15933*/
			for (var _GN = 0, _GM = $1.bvals.length - 1; _GN <= _GM; _GN += 1) { /*15939*/
				$1.p = _GN; /*15935*/
				var _GT = ((((($1.j + $1.p) + 1) * 149) % 255) + 1) + $get($1.bvals, $1.p); /*15937*/
				$k[$j++] = _GT; /*15937*/
				if (_GT >= 256) { /*15937*/
					var _GU = $k[--$j]; /*15937*/
					$k[$j++] = _GU - 256; /*15937*/
				} /*15937*/
				$put($1.bvals, $1.p, $k[--$j]); /*15938*/
			} /*15938*/
			$k[$j++] = $1.bvals; /*15940*/
			if ($1.addtocws() == $b) return $b; /*15940*/
			$1.mode = $1.A; /*15941*/
		}; /*15942*/
		$1.cws = $a(1558); /*15945*/
		$1.mode = $1.A; /*15946*/
		$1.i = 0; /*15946*/
		$1.j = 0; /*15946*/
		for (;;) { /*15949*/
			if ($1.i >= $1.msglen) { /*15947*/
				break; /*15947*/
			} /*15947*/
			$1[$get($a(["encA", "encCTX", "encCTX", "encCTX", "encE", "encB"]), $1.mode)](); /*15948*/
		} /*15948*/
		$1.cws = $geti($1.cws, 0, $1.j); /*15950*/
		$1.datlen = $1.cws.length; /*15953*/
		$1.remcws = $get($1.numremcws, $1.j - 1) - 1; /*15954*/
		if ($1.remcws > 0) { /*15963*/
			$k[$j++] = Infinity; /*15956*/
			$aload($1.cws); /*15956*/
			for (var _Gs = 0, _Gt = $1.remcws; _Gs < _Gt; _Gs++) { /*15956*/
				$k[$j++] = 129; /*15956*/
			} /*15956*/
			$1.cws = $a(); /*15956*/
			for (var _Gz = $1.datlen + 1, _Gy = ($1.datlen + $1.remcws) - 1; _Gz <= _Gy; _Gz += 1) { /*15962*/
				$1.i = _Gz; /*15958*/
				var _H1 = (((($1.i + 1) * 149) % 253) + 1) + 129; /*15960*/
				$k[$j++] = _H1; /*15960*/
				if (_H1 > 254) { /*15960*/
					var _H2 = $k[--$j]; /*15960*/
					$k[$j++] = _H2 - 254; /*15960*/
				} /*15960*/
				$put($1.cws, $1.i, $k[--$j]); /*15961*/
			} /*15961*/
		} /*15961*/
		$1.i = 0; /*15966*/
		for (;;) { /*15987*/
			$1.m = $get($1.metrics, $1.i); /*15967*/
			$1.rows = $get($1.m, 0); /*15968*/
			$1.cols = $get($1.m, 1); /*15969*/
			$1.regh = $get($1.m, 2); /*15970*/
			$1.regv = $get($1.m, 3); /*15971*/
			$1.rscw = $get($1.m, 4); /*15972*/
			$1.rsbl = $get($1.m, 5); /*15973*/
			$1.mrows = $1.rows - (2 * $1.regh); /*15974*/
			$1.mcols = $1.cols - (2 * $1.regv); /*15975*/
			$1.rrows = ~~($1.mrows / $1.regh); /*15976*/
			$1.rcols = ~~($1.mcols / $1.regv); /*15977*/
			$1.ncws = (~~(($1.mrows * $1.mcols) / 8)) - $1.rscw; /*15978*/
			$1.okay = true; /*15979*/
			if ($1.cws.length != $1.ncws) { /*15980*/
				$1.okay = false; /*15980*/
			} /*15980*/
			if (($1.urows != 0) && ($1.urows != $1.rows)) { /*15981*/
				$1.okay = false; /*15981*/
			} /*15981*/
			if (($1.ucols != 0) && ($1.ucols != $1.cols)) { /*15982*/
				$1.okay = false; /*15982*/
			} /*15982*/
			if ($eq($1.format, "square") && $ne($1.rows, $1.cols)) { /*15983*/
				$1.okay = false; /*15983*/
			} /*15983*/
			if ($eq($1.format, "rectangle") && $eq($1.rows, $1.cols)) { /*15984*/
				$1.okay = false; /*15984*/
			} /*15984*/
			if ($1.okay) { /*15985*/
				break; /*15985*/
			} /*15985*/
			$1.i = $1.i + 1; /*15986*/
		} /*15986*/
		$1.cwbs = $a($1.rsbl); /*15990*/
		$1.ecbs = $a($1.rsbl); /*15991*/
		for (var _Hs = 0, _Hr = $1.rsbl - 1; _Hs <= _Hr; _Hs += 1) { /*16006*/
			$1.i = _Hs; /*15993*/
			if ($1.cws.length != 1558) { /*15997*/
				$1.cwbsize = ~~($1.cws.length / $1.rsbl); /*15995*/
			} else { /*15997*/
				if ($1.i <= 7) { /*15997*/
					$1.cwbsize = 156; /*15997*/
				} else { /*15997*/
					$1.cwbsize = 155; /*15997*/
				} /*15997*/
			} /*15997*/
			$1.cwb = $a($1.cwbsize); /*15999*/
			for (var _I1 = 0, _I0 = $1.cwbsize - 1; _I1 <= _I0; _I1 += 1) { /*16003*/
				$1.j = _I1; /*16001*/
				$put($1.cwb, $1.j, $get($1.cws, ($1.j * $1.rsbl) + $1.i)); /*16002*/
			} /*16002*/
			$put($1.cwbs, $1.i, $1.cwb); /*16004*/
			$k[$j++] = $1.ecbs; /*16005*/
			$k[$j++] = $1.i; /*16005*/
			$k[$j++] = Infinity; /*16005*/
			for (var _IG = 0, _IH = ~~($1.rscw / $1.rsbl); _IG < _IH; _IG++) { /*16005*/
				$k[$j++] = 0; /*16005*/
			} /*16005*/
			var _II = $a(); /*16005*/
			var _IJ = $k[--$j]; /*16005*/
			$put($k[--$j], _IJ, _II); /*16005*/
		} /*16005*/
		$k[$j++] = Infinity; /*16009*/
		$k[$j++] = 1; /*16009*/
		for (var _IL = 0, _IM = 255; _IL < _IM; _IL++) { /*16009*/
			var _IN = $k[--$j]; /*16009*/
			var _IO = _IN * 2; /*16009*/
			$k[$j++] = _IN; /*16009*/
			$k[$j++] = _IO; /*16009*/
			if (_IO >= 256) { /*16009*/
				var _IP = $k[--$j]; /*16009*/
				$k[$j++] = _IP ^ 301; /*16009*/
			} /*16009*/
		} /*16009*/
		$1.rsalog = $a(); /*16009*/
		$1.rslog = $a(256); /*16010*/
		for (var _IS = 1; _IS <= 255; _IS += 1) { /*16011*/
			$put($1.rslog, $get($1.rsalog, _IS), _IS); /*16011*/
		} /*16011*/
		$1.rsprod = function() {
			var _IW = $k[--$j]; /*16015*/
			var _IX = $k[--$j]; /*16015*/
			$k[$j++] = _IX; /*16019*/
			$k[$j++] = _IW; /*16019*/
			if ((_IW != 0) && (_IX != 0)) { /*16018*/
				var _Ia = $get($1.rslog, $k[--$j]); /*16016*/
				var _If = $get($1.rsalog, (_Ia + $get($1.rslog, $k[--$j])) % 255); /*16016*/
				$k[$j++] = _If; /*16016*/
			} else { /*16018*/
				$j -= 2; /*16018*/
				$k[$j++] = 0; /*16018*/
			} /*16018*/
		}; /*16020*/
		$k[$j++] = Infinity; /*16023*/
		$k[$j++] = 1; /*16023*/
		for (var _Ii = 0, _Ij = ~~($1.rscw / $1.rsbl); _Ii < _Ij; _Ii++) { /*16023*/
			$k[$j++] = 0; /*16023*/
		} /*16023*/
		$1.coeffs = $a(); /*16023*/
		for (var _Io = 1, _In = ~~($1.rscw / $1.rsbl); _Io <= _In; _Io += 1) { /*16032*/
			$1.i = _Io; /*16025*/
			$put($1.coeffs, $1.i, $get($1.coeffs, $1.i - 1)); /*16026*/
			for (var _Iv = $1.i - 1; _Iv >= 1; _Iv -= 1) { /*16030*/
				$1.j = _Iv; /*16028*/
				$k[$j++] = $1.coeffs; /*16029*/
				$k[$j++] = $1.j; /*16029*/
				$k[$j++] = $get($1.coeffs, $1.j - 1); /*16029*/
				$k[$j++] = $get($1.coeffs, $1.j); /*16029*/
				$k[$j++] = $get($1.rsalog, $1.i); /*16029*/
				if ($1.rsprod() == $b) break; /*16029*/
				var _J7 = $k[--$j]; /*16029*/
				var _J8 = $k[--$j]; /*16029*/
				var _J9 = $k[--$j]; /*16029*/
				$put($k[--$j], _J9, $xo(_J8, _J7)); /*16029*/
			} /*16029*/
			$k[$j++] = $1.coeffs; /*16031*/
			$k[$j++] = 0; /*16031*/
			$k[$j++] = $get($1.coeffs, 0); /*16031*/
			$k[$j++] = $get($1.rsalog, $1.i); /*16031*/
			if ($1.rsprod() == $b) break; /*16031*/
			var _JH = $k[--$j]; /*16031*/
			var _JI = $k[--$j]; /*16031*/
			$put($k[--$j], _JI, _JH); /*16031*/
		} /*16031*/
		$1.coeffs = $geti($1.coeffs, 0, $1.coeffs.length - 1); /*16033*/
		for (var _JP = 0, _JO = $1.cwbs.length - 1; _JP <= _JO; _JP += 1) { /*16049*/
			$1.i = _JP; /*16037*/
			$1.cwb = $get($1.cwbs, $1.i); /*16038*/
			$1.ecb = $get($1.ecbs, $1.i); /*16039*/
			for (var _JY = 0, _JX = $1.cwb.length - 1; _JY <= _JX; _JY += 1) { /*16048*/
				$1.t = $xo($get($1.cwb, _JY), $get($1.ecb, 0)); /*16041*/
				for (var _Je = $1.ecb.length - 1; _Je >= 0; _Je -= 1) { /*16047*/
					$1.j = _Je; /*16043*/
					$1.p = ($1.ecb.length - $1.j) - 1; /*16044*/
					$k[$j++] = $1.ecb; /*16045*/
					$k[$j++] = $1.p; /*16045*/
					$k[$j++] = $1.t; /*16045*/
					$k[$j++] = $get($1.coeffs, $1.j); /*16045*/
					if ($1.rsprod() == $b) break; /*16045*/
					var _Jn = $k[--$j]; /*16045*/
					var _Jo = $k[--$j]; /*16045*/
					$put($k[--$j], _Jo, _Jn); /*16045*/
					if ($1.j > 0) { /*16046*/
						$put($1.ecb, $1.p, $xo($get($1.ecb, $1.p + 1), $get($1.ecb, $1.p))); /*16046*/
					} /*16046*/
				} /*16046*/
			} /*16046*/
		} /*16046*/
		if ($1.ncws == 1558) { /*16054*/
			$k[$j++] = Infinity; /*16053*/
			$forall($geti($1.ecbs, 8, 2)); /*16053*/
			$forall($geti($1.ecbs, 0, 8)); /*16053*/
			$1.ecbs = $a(); /*16053*/
		} /*16053*/
		$k[$j++] = Infinity; /*16057*/
		var _K5 = $1.cws; /*16057*/
		for (var _K6 = 0, _K7 = _K5.length; _K6 < _K7; _K6++) { /*16057*/
			$k[$j++] = $get(_K5, _K6); /*16057*/
		} /*16057*/
		for (var _KA = 0, _KB = $1.rscw; _KA < _KB; _KA++) { /*16057*/
			$k[$j++] = 0; /*16057*/
		} /*16057*/
		$1.cws = $a(); /*16057*/
		for (var _KF = 0, _KE = $1.rscw - 1; _KF <= _KE; _KF += 1) { /*16061*/
			$1.i = _KF; /*16059*/
			$put($1.cws, $1.ncws + $1.i, $get($get($1.ecbs, $1.i % $1.rsbl), ~~($1.i / $1.rsbl))); /*16060*/
		} /*16060*/
		$1.module = function() {
			var _KQ = $k[--$j]; /*16066*/
			var _KR = $k[--$j]; /*16066*/
			var _KS = $k[--$j]; /*16066*/
			var _KV = $strcpy($s(8), "00000000"); /*16067*/
			var _KX = $cvrs($s(8), $k[--$j], 2); /*16067*/
			$puti(_KV, 8 - _KX.length, _KX); /*16068*/
			$k[$j++] = _KS; /*16069*/
			$k[$j++] = _KR; /*16069*/
			$k[$j++] = _KQ; /*16069*/
			$k[$j++] = _KV; /*16069*/
			for (var _KY = 7; _KY >= 0; _KY -= 1) { /*16069*/
				var _KZ = $k[--$j]; /*16069*/
				$k[$j++] = $get(_KZ, _KY) - 48; /*16069*/
				$k[$j++] = _KZ; /*16069*/
			} /*16069*/
			$j--; /*16069*/
			var _Kb = $k[--$j]; /*16070*/
			var _Kc = $k[--$j]; /*16070*/
			var _Kd = $k[--$j]; /*16070*/
			var _Ke = $k[--$j]; /*16070*/
			var _Kf = $k[--$j]; /*16070*/
			var _Kg = $k[--$j]; /*16070*/
			var _Kh = $k[--$j]; /*16070*/
			var _Ki = $k[--$j]; /*16070*/
			var _Kj = $k[--$j]; /*16070*/
			var _Kk = $k[--$j]; /*16070*/
			var _Kl = $k[--$j]; /*16070*/
			$k[$j++] = _Ki; /*16087*/
			$k[$j++] = _Kh; /*16087*/
			$k[$j++] = _Kg; /*16087*/
			$k[$j++] = _Kf; /*16087*/
			$k[$j++] = _Ke; /*16087*/
			$k[$j++] = _Kd; /*16087*/
			$k[$j++] = _Kc; /*16087*/
			$k[$j++] = _Kb; /*16087*/
			$k[$j++] = _Kl; /*16087*/
			$k[$j++] = _Kk; /*16087*/
			$forall(_Kj, function() { /*16087*/
				$k[--$j](); /*16073*/
				var _Kn = $k[--$j]; /*16074*/
				var _Ko = $k[--$j]; /*16074*/
				$k[$j++] = _Ko; /*16077*/
				$k[$j++] = _Kn; /*16077*/
				if (_Ko < 0) { /*16077*/
					var _Kp = $k[--$j]; /*16075*/
					var _Kq = $k[--$j]; /*16075*/
					$k[$j++] = _Kq + $1.mrows; /*16076*/
					$k[$j++] = _Kp + (4 - (($1.mrows + 4) % 8)); /*16076*/
				} /*16076*/
				var _Kt = $k[--$j]; /*16078*/
				$k[$j++] = _Kt; /*16081*/
				if (_Kt < 0) { /*16081*/
					var _Kv = $k[--$j]; /*16079*/
					var _Kw = $k[--$j]; /*16079*/
					$k[$j++] = _Kw + (4 - (($1.mcols + 4) % 8)); /*16080*/
					$k[$j++] = _Kv + $1.mcols; /*16080*/
				} /*16080*/
				var _Ky = $k[--$j]; /*16082*/
				var _Kz = $k[--$j]; /*16082*/
				$k[$j++] = _Kz; /*16084*/
				$k[$j++] = _Ky; /*16084*/
				if (_Kz >= $1.mrows) { /*16084*/
					var _L1 = $k[--$j]; /*16083*/
					var _L2 = $k[--$j]; /*16083*/
					$k[$j++] = _L2 - $1.mrows; /*16083*/
					$k[$j++] = _L1; /*16083*/
				} /*16083*/
				var _L4 = $k[--$j]; /*16085*/
				var _L5 = $k[--$j]; /*16085*/
				var _L8 = $k[--$j]; /*16086*/
				var _L9 = $k[--$j]; /*16086*/
				$put($1.mmat, _L4 + (_L5 * $1.mcols), $k[--$j]); /*16086*/
				$k[$j++] = _L9; /*16086*/
				$k[$j++] = _L8; /*16086*/
			}); /*16086*/
		}; /*16088*/
		var _LR = $a([function() {
			var _LB = $k[--$j]; /*16092*/
			var _LC = $k[--$j]; /*16092*/
			$k[$j++] = _LC; /*16092*/
			$k[$j++] = _LB; /*16092*/
			$k[$j++] = _LC - 2; /*16092*/
			$k[$j++] = _LB - 2; /*16092*/
		}, function() {
			var _LD = $k[--$j]; /*16092*/
			var _LE = $k[--$j]; /*16092*/
			$k[$j++] = _LE; /*16092*/
			$k[$j++] = _LD; /*16092*/
			$k[$j++] = _LE - 2; /*16092*/
			$k[$j++] = _LD - 1; /*16092*/
		}, function() {
			var _LF = $k[--$j]; /*16093*/
			var _LG = $k[--$j]; /*16093*/
			$k[$j++] = _LG; /*16093*/
			$k[$j++] = _LF; /*16093*/
			$k[$j++] = _LG - 1; /*16093*/
			$k[$j++] = _LF - 2; /*16093*/
		}, function() {
			var _LH = $k[--$j]; /*16093*/
			var _LI = $k[--$j]; /*16093*/
			$k[$j++] = _LI; /*16093*/
			$k[$j++] = _LH; /*16093*/
			$k[$j++] = _LI - 1; /*16093*/
			$k[$j++] = _LH - 1; /*16093*/
		}, function() {
			var _LJ = $k[--$j]; /*16094*/
			var _LK = $k[--$j]; /*16094*/
			$k[$j++] = _LK; /*16094*/
			$k[$j++] = _LJ; /*16094*/
			$k[$j++] = _LK - 1; /*16094*/
			$k[$j++] = _LJ; /*16094*/
		}, function() {
			var _LL = $k[--$j]; /*16094*/
			var _LM = $k[--$j]; /*16094*/
			$k[$j++] = _LM; /*16094*/
			$k[$j++] = _LL; /*16094*/
			$k[$j++] = _LM; /*16094*/
			$k[$j++] = _LL - 2; /*16094*/
		}, function() {
			var _LN = $k[--$j]; /*16095*/
			var _LO = $k[--$j]; /*16095*/
			$k[$j++] = _LO; /*16095*/
			$k[$j++] = _LN; /*16095*/
			$k[$j++] = _LO; /*16095*/
			$k[$j++] = _LN - 1; /*16095*/
		}, function() {
			var _LP = $k[--$j]; /*16095*/
			var _LQ = $k[--$j]; /*16095*/
			$k[$j++] = _LQ; /*16095*/
			$k[$j++] = _LP; /*16095*/
			$k[$j++] = _LQ; /*16095*/
			$k[$j++] = _LP; /*16095*/
		}]); /*16095*/
		$1.dmn = _LR; /*16096*/
		var _La = $a([function() {
			$k[$j++] = $1.mrows - 1; /*16099*/
			$k[$j++] = 0; /*16099*/
		}, function() {
			$k[$j++] = $1.mrows - 1; /*16099*/
			$k[$j++] = 1; /*16099*/
		}, function() {
			$k[$j++] = $1.mrows - 1; /*16100*/
			$k[$j++] = 2; /*16100*/
		}, function() {
			$k[$j++] = 0; /*16100*/
			$k[$j++] = $1.mcols - 2; /*16100*/
		}, function() {
			$k[$j++] = 0; /*16101*/
			$k[$j++] = $1.mcols - 1; /*16101*/
		}, function() {
			$k[$j++] = 1; /*16101*/
			$k[$j++] = $1.mcols - 1; /*16101*/
		}, function() {
			$k[$j++] = 2; /*16102*/
			$k[$j++] = $1.mcols - 1; /*16102*/
		}, function() {
			$k[$j++] = 3; /*16102*/
			$k[$j++] = $1.mcols - 1; /*16102*/
		}]); /*16102*/
		$1.dmc1 = _La; /*16103*/
		var _Lj = $a([function() {
			$k[$j++] = $1.mrows - 3; /*16106*/
			$k[$j++] = 0; /*16106*/
		}, function() {
			$k[$j++] = $1.mrows - 2; /*16106*/
			$k[$j++] = 0; /*16106*/
		}, function() {
			$k[$j++] = $1.mrows - 1; /*16107*/
			$k[$j++] = 0; /*16107*/
		}, function() {
			$k[$j++] = 0; /*16107*/
			$k[$j++] = $1.mcols - 4; /*16107*/
		}, function() {
			$k[$j++] = 0; /*16108*/
			$k[$j++] = $1.mcols - 3; /*16108*/
		}, function() {
			$k[$j++] = 0; /*16108*/
			$k[$j++] = $1.mcols - 2; /*16108*/
		}, function() {
			$k[$j++] = 0; /*16109*/
			$k[$j++] = $1.mcols - 1; /*16109*/
		}, function() {
			$k[$j++] = 1; /*16109*/
			$k[$j++] = $1.mcols - 1; /*16109*/
		}]); /*16109*/
		$1.dmc2 = _Lj; /*16110*/
		var _Ls = $a([function() {
			$k[$j++] = $1.mrows - 3; /*16113*/
			$k[$j++] = 0; /*16113*/
		}, function() {
			$k[$j++] = $1.mrows - 2; /*16113*/
			$k[$j++] = 0; /*16113*/
		}, function() {
			$k[$j++] = $1.mrows - 1; /*16114*/
			$k[$j++] = 0; /*16114*/
		}, function() {
			$k[$j++] = 0; /*16114*/
			$k[$j++] = $1.mcols - 2; /*16114*/
		}, function() {
			$k[$j++] = 0; /*16115*/
			$k[$j++] = $1.mcols - 1; /*16115*/
		}, function() {
			$k[$j++] = 1; /*16115*/
			$k[$j++] = $1.mcols - 1; /*16115*/
		}, function() {
			$k[$j++] = 2; /*16116*/
			$k[$j++] = $1.mcols - 1; /*16116*/
		}, function() {
			$k[$j++] = 3; /*16116*/
			$k[$j++] = $1.mcols - 1; /*16116*/
		}]); /*16116*/
		$1.dmc3 = _Ls; /*16117*/
		var _M2 = $a([function() {
			$k[$j++] = $1.mrows - 1; /*16120*/
			$k[$j++] = 0; /*16120*/
		}, function() {
			$k[$j++] = $1.mrows - 1; /*16120*/
			$k[$j++] = $1.mcols - 1; /*16120*/
		}, function() {
			$k[$j++] = 0; /*16121*/
			$k[$j++] = $1.mcols - 3; /*16121*/
		}, function() {
			$k[$j++] = 0; /*16121*/
			$k[$j++] = $1.mcols - 2; /*16121*/
		}, function() {
			$k[$j++] = 0; /*16122*/
			$k[$j++] = $1.mcols - 1; /*16122*/
		}, function() {
			$k[$j++] = 1; /*16122*/
			$k[$j++] = $1.mcols - 3; /*16122*/
		}, function() {
			$k[$j++] = 1; /*16123*/
			$k[$j++] = $1.mcols - 2; /*16123*/
		}, function() {
			$k[$j++] = 1; /*16123*/
			$k[$j++] = $1.mcols - 1; /*16123*/
		}]); /*16123*/
		$1.dmc4 = _M2; /*16124*/
		$k[$j++] = Infinity; /*16126*/
		for (var _M5 = 0, _M6 = $1.mrows * $1.mcols; _M5 < _M6; _M5++) { /*16126*/
			$k[$j++] = -1; /*16126*/
		} /*16126*/
		$1.mmat = $a(); /*16126*/
		for (var _M9 = $1.cws.length - 1; _M9 >= 0; _M9 -= 1) { /*16127*/
			$k[$j++] = $get($1.cws, _M9); /*16127*/
		} /*16127*/
		$k[$j++] = 4; /*16167*/
		$k[$j++] = 0; /*16167*/
		for (;;) { /*16167*/
			var _MC = $k[--$j]; /*16130*/
			var _MD = $k[--$j]; /*16130*/
			$k[$j++] = _MD; /*16132*/
			$k[$j++] = _MC; /*16132*/
			if ((_MC == 0) && (_MD == $1.mrows)) { /*16132*/
				$k[$j++] = $1.dmc1; /*16131*/
				if ($1.module() == $b) break; /*16131*/
			} /*16131*/
			var _MG = $k[--$j]; /*16133*/
			var _MH = $k[--$j]; /*16133*/
			$k[$j++] = _MH; /*16135*/
			$k[$j++] = _MG; /*16135*/
			if (((_MG == 0) && (_MH == ($1.mrows - 2))) && (($1.mcols % 4) != 0)) { /*16135*/
				$k[$j++] = $1.dmc2; /*16134*/
				if ($1.module() == $b) break; /*16134*/
			} /*16134*/
			var _ML = $k[--$j]; /*16136*/
			var _MM = $k[--$j]; /*16136*/
			$k[$j++] = _MM; /*16138*/
			$k[$j++] = _ML; /*16138*/
			if (((_ML == 0) && (_MM == ($1.mrows - 2))) && (($1.mcols % 8) == 4)) { /*16138*/
				$k[$j++] = $1.dmc3; /*16137*/
				if ($1.module() == $b) break; /*16137*/
			} /*16137*/
			var _MQ = $k[--$j]; /*16139*/
			var _MR = $k[--$j]; /*16139*/
			$k[$j++] = _MR; /*16141*/
			$k[$j++] = _MQ; /*16141*/
			if (((_MQ == 2) && (_MR == ($1.mrows + 4))) && (($1.mcols % 8) == 0)) { /*16141*/
				$k[$j++] = $1.dmc4; /*16140*/
				if ($1.module() == $b) break; /*16140*/
			} /*16140*/
			for (;;) { /*16151*/
				var _MV = $k[--$j]; /*16144*/
				var _MW = $k[--$j]; /*16144*/
				$k[$j++] = _MW; /*16148*/
				$k[$j++] = _MV; /*16148*/
				if ((_MV >= 0) && (_MW < $1.mrows)) { /*16148*/
					var _MY = $k[--$j]; /*16145*/
					var _MZ = $k[--$j]; /*16145*/
					$k[$j++] = _MZ; /*16147*/
					$k[$j++] = _MY; /*16147*/
					if ($get($1.mmat, _MY + (_MZ * $1.mcols)) == -1) { /*16147*/
						$k[$j++] = $1.dmn; /*16146*/
						if ($1.module() == $b) break; /*16146*/
					} /*16146*/
				} /*16146*/
				var _Me = $k[--$j]; /*16149*/
				var _Mf = $k[--$j]; /*16149*/
				$k[$j++] = _Mf - 2; /*16150*/
				$k[$j++] = _Me + 2; /*16150*/
				if (!(((_Me + 2) < $1.mcols) && ((_Mf - 2) >= 0))) { /*16150*/
					break; /*16150*/
				} /*16150*/
			} /*16150*/
			var _Mh = $k[--$j]; /*16152*/
			var _Mi = $k[--$j]; /*16152*/
			$k[$j++] = _Mi + 1; /*16162*/
			$k[$j++] = _Mh + 3; /*16162*/
			for (;;) { /*16162*/
				var _Mj = $k[--$j]; /*16155*/
				var _Mk = $k[--$j]; /*16155*/
				$k[$j++] = _Mk; /*16159*/
				$k[$j++] = _Mj; /*16159*/
				if ((_Mj < $1.mcols) && (_Mk >= 0)) { /*16159*/
					var _Mm = $k[--$j]; /*16156*/
					var _Mn = $k[--$j]; /*16156*/
					$k[$j++] = _Mn; /*16158*/
					$k[$j++] = _Mm; /*16158*/
					if ($get($1.mmat, _Mm + (_Mn * $1.mcols)) == -1) { /*16158*/
						$k[$j++] = $1.dmn; /*16157*/
						if ($1.module() == $b) break; /*16157*/
					} /*16157*/
				} /*16157*/
				var _Ms = $k[--$j]; /*16160*/
				var _Mt = $k[--$j]; /*16160*/
				$k[$j++] = _Mt + 2; /*16161*/
				$k[$j++] = _Ms - 2; /*16161*/
				if (!(((_Ms - 2) >= 0) && ((_Mt + 2) < $1.mrows))) { /*16161*/
					break; /*16161*/
				} /*16161*/
			} /*16161*/
			var _Mv = $k[--$j]; /*16163*/
			var _Mw = $k[--$j]; /*16163*/
			$k[$j++] = _Mw + 3; /*16165*/
			$k[$j++] = _Mv + 1; /*16165*/
			if (!(((_Mv + 1) < $1.mcols) || ((_Mw + 3) < $1.mrows))) { /*16165*/
				$j -= 2; /*16165*/
				break; /*16165*/
			} /*16165*/
		} /*16165*/
		if ($get($1.mmat, ($1.mrows * $1.mcols) - 1) == -1) { /*16173*/
			$puti($1.mmat, ($1.mrows * ($1.mcols - 1)) - 2, $a([1, 0])); /*16171*/
			$puti($1.mmat, ($1.mrows * $1.mcols) - 2, $a([0, 1])); /*16172*/
		} /*16172*/
		$1.pixs = $a($1.rows * $1.cols); /*16176*/
		$1.cwpos = 0; /*16177*/
		for (var _NG = 0, _NF = $1.rows - 1; _NG <= _NF; _NG += 1) { /*16193*/
			$1.i = _NG; /*16179*/
			if (($1.i % ($1.rrows + 2)) == 0) { /*16180*/
				$k[$j++] = $1.pixs; /*16180*/
				$k[$j++] = $1.i * $1.cols; /*16180*/
				$k[$j++] = Infinity; /*16180*/
				for (var _NN = 0, _NO = ~~($1.cols / 2); _NN < _NO; _NN++) { /*16180*/
					$k[$j++] = 1; /*16180*/
					$k[$j++] = 0; /*16180*/
				} /*16180*/
				var _NP = $a(); /*16180*/
				var _NQ = $k[--$j]; /*16180*/
				$puti($k[--$j], _NQ, _NP); /*16180*/
			} /*16180*/
			if (($1.i % ($1.rrows + 2)) == ($1.rrows + 1)) { /*16181*/
				$k[$j++] = $1.pixs; /*16181*/
				$k[$j++] = $1.i * $1.cols; /*16181*/
				$k[$j++] = Infinity; /*16181*/
				for (var _NZ = 0, _Na = $1.cols; _NZ < _Na; _NZ++) { /*16181*/
					$k[$j++] = 1; /*16181*/
				} /*16181*/
				var _Nb = $a(); /*16181*/
				var _Nc = $k[--$j]; /*16181*/
				$puti($k[--$j], _Nc, _Nb); /*16181*/
			} /*16181*/
			if ((($1.i % ($1.rrows + 2)) != 0) && (($1.i % ($1.rrows + 2)) != ($1.rrows + 1))) { /*16192*/
				for (var _Nl = 0, _Nk = $1.cols - 1; _Nl <= _Nk; _Nl += 1) { /*16191*/
					$1.j = _Nl; /*16184*/
					if (($1.j % ($1.rcols + 2)) == 0) { /*16185*/
						$put($1.pixs, ($1.i * $1.cols) + $1.j, 1); /*16185*/
					} /*16185*/
					if (($1.j % ($1.rcols + 2)) == ($1.rcols + 1)) { /*16186*/
						$put($1.pixs, ($1.i * $1.cols) + $1.j, $1.i % 2); /*16186*/
					} /*16186*/
					if ((($1.j % ($1.rcols + 2)) != 0) && (($1.j % ($1.rcols + 2)) != ($1.rcols + 1))) { /*16190*/
						$put($1.pixs, ($1.i * $1.cols) + $1.j, $get($1.mmat, $1.cwpos)); /*16188*/
						$1.cwpos = $1.cwpos + 1; /*16189*/
					} /*16189*/
				} /*16189*/
			} /*16189*/
		} /*16189*/
		var _OJ = {
			ren: $0.renmatrix,
			pixs: $1.pixs,
			pixx: $1.cols,
			pixy: $1.rows,
			height: ($1.rows * 2) / 72,
			width: ($1.cols * 2) / 72,
			opt: $1.options
		}; /*16203*/
		$k[$j++] = _OJ; /*16206*/
		if (!$1.dontdraw) { /*16206*/
			$0.renmatrix(); /*16206*/
		} /*16206*/
	};

	$0.gs1datamatrix = function() {
		var $1 = {}; /*23807*/
		$1.options = $k[--$j]; /*23809*/
		$1.barcode = $k[--$j]; /*23810*/
		$1.dontdraw = false; /*23812*/
		$forall($1.options, function() { /*23823*/
			var _3 = $k[--$j]; /*23823*/
			$1[$k[--$j]] = _3; /*23823*/
		}); /*23823*/
		$1.expand = function() {
			$1.in = $k[--$j]; /*23827*/
			$1.out = $s($1.in.length); /*23828*/
			$1.j = 0; /*23829*/
			$k[$j++] = $1.in; /*23843*/
			for (;;) { /*23843*/
				$search($k[--$j], "^"); /*23832*/
				if ($k[--$j]) { /*23841*/
					var _B = $k[--$j]; /*23833*/
					$puti($1.out, $1.j, _B); /*23833*/
					$1.j = (_B.length + $1.j) + 1; /*23834*/
					$j--; /*23835*/
					var _F = $k[--$j]; /*23836*/
					$put($1.out, $1.j - 1, ~~$z($geti(_F, 0, 3))); /*23836*/
					$k[$j++] = $geti(_F, 3, _F.length - 3); /*23837*/
				} else { /*23841*/
					var _K = $k[--$j]; /*23839*/
					$puti($1.out, $1.j, _K); /*23839*/
					$1.j = _K.length + $1.j; /*23840*/
					$k[$j++] = $geti($1.out, 0, $1.j); /*23841*/
					break; /*23841*/
				} /*23841*/
			} /*23841*/
		}; /*23844*/
		$1.ais = $a([]); /*23847*/
		$1.vals = $a([]); /*23848*/
		var _T = $1.barcode; /*23849*/
		$k[$j++] = $geti(_T, 1, _T.length - 1); /*23862*/
		for (;;) { /*23862*/
			var _V = $k[--$j]; /*23851*/
			$k[$j++] = _V; /*23851*/
			if ($eq(_V, "")) { /*23851*/
				break; /*23851*/
			} /*23851*/
			$search($k[--$j], ")"); /*23852*/
			$j--; /*23852*/
			var _X = $k[--$j]; /*23853*/
			var _Y = $k[--$j]; /*23853*/
			var _Z = $k[--$j]; /*23854*/
			$k[$j++] = _X; /*23854*/
			$search(_Z, "("); /*23854*/
			if ($k[--$j]) { /*23857*/
				var _b = $k[--$j]; /*23855*/
				var _c = $k[--$j]; /*23855*/
				var _d = $k[--$j]; /*23855*/
				var _e = $k[--$j]; /*23855*/
				$k[$j++] = _d; /*23855*/
				$k[$j++] = _e; /*23855*/
				$k[$j++] = _b; /*23855*/
			} else { /*23857*/
				var _f = $k[--$j]; /*23857*/
				var _g = $k[--$j]; /*23857*/
				$k[$j++] = ""; /*23857*/
				$k[$j++] = _g; /*23857*/
				$k[$j++] = _f; /*23857*/
			} /*23857*/
			$k[$j++] = Infinity; /*23859*/
			$aload($1.ais); /*23859*/
			var _j = $k[$j - 1 - ($counttomark() + 2)]; /*23859*/
			$k[$j++] = _j; /*23859*/
			$1.ais = $a(); /*23859*/
			$k[$j++] = Infinity; /*23860*/
			$aload($1.vals); /*23860*/
			var _n = $k[$j - 1 - ($counttomark() + 1)]; /*23860*/
			$k[$j++] = _n; /*23860*/
			if ($1.expand() == $b) break; /*23860*/
			$1.vals = $a(); /*23860*/
			$j -= 2; /*23861*/
		} /*23861*/
		$j--; /*23863*/
		$1.aifixed = {}; /*23868*/
		$k[$j++] = Infinity; /*23870*/
		for (var _p = 0; _p <= 4; _p += 1) { /*23870*/
			$k[$j++] = _p; /*23870*/
		} /*23870*/
		var _q = $a(); /*23870*/
		for (var _r = 0, _s = _q.length; _r < _s; _r++) { /*23873*/
			var _v = $strcpy($s(2), "00"); /*23872*/
			$put(_v, 1, $get(_q, _r) + 48); /*23872*/
			$put($1.aifixed, _v, _v); /*23872*/
		} /*23872*/
		$k[$j++] = Infinity; /*23878*/
		for (var _x = 11; _x <= 20; _x += 1) { /*23875*/
			$k[$j++] = _x; /*23875*/
		} /*23875*/
		$k[$j++] = 23; /*23877*/
		for (var _y = 31; _y <= 36; _y += 1) { /*23877*/
			$k[$j++] = _y; /*23877*/
		} /*23877*/
		$k[$j++] = 41; /*23878*/
		var _z = $a(); /*23878*/
		for (var _10 = 0, _11 = _z.length; _10 < _11; _10++) { /*23881*/
			var _14 = $cvrs($s(2), $get(_z, _10), 10); /*23880*/
			$put($1.aifixed, _14, _14); /*23880*/
		} /*23880*/
		$1.fnc1 = -1; /*23884*/
		$1.dmtx = $a([$1.fnc1]); /*23885*/
		for (var _1A = 0, _19 = $1.ais.length - 1; _1A <= _19; _1A += 1) { /*23901*/
			$1.i = _1A; /*23887*/
			$1.ai = $get($1.ais, $1.i); /*23888*/
			$1.val = $get($1.vals, $1.i); /*23889*/
			var _1K = $a(($1.dmtx.length + $1.ai.length) + $1.val.length); /*23890*/
			$puti(_1K, 0, $1.dmtx); /*23891*/
			$k[$j++] = _1K; /*23892*/
			$k[$j++] = _1K; /*23892*/
			$k[$j++] = $1.dmtx.length; /*23892*/
			$k[$j++] = $1.ai; /*23892*/
			$k[$j++] = Infinity; /*23892*/
			var _1O = $k[--$j]; /*23892*/
			var _1P = $k[--$j]; /*23892*/
			$k[$j++] = _1O; /*23892*/
			$forall(_1P); /*23892*/
			var _1Q = $a(); /*23892*/
			var _1R = $k[--$j]; /*23892*/
			$puti($k[--$j], _1R, _1Q); /*23892*/
			var _1T = $k[--$j]; /*23893*/
			$k[$j++] = _1T; /*23893*/
			$k[$j++] = _1T; /*23893*/
			$k[$j++] = $1.dmtx.length + $1.ai.length; /*23893*/
			$k[$j++] = $1.val; /*23893*/
			$k[$j++] = Infinity; /*23893*/
			var _1X = $k[--$j]; /*23893*/
			var _1Y = $k[--$j]; /*23893*/
			$k[$j++] = _1X; /*23893*/
			$forall(_1Y); /*23893*/
			var _1Z = $a(); /*23893*/
			var _1a = $k[--$j]; /*23893*/
			$puti($k[--$j], _1a, _1Z); /*23893*/
			$1.dmtx = $k[--$j]; /*23894*/
			var _1i = $get($1.aifixed, $geti($1.ai, 0, 2)) !== undefined; /*23895*/
			if (($1.i != ($1.ais.length - 1)) && (!_1i)) { /*23900*/
				var _1k = $a($1.dmtx.length + 1); /*23896*/
				$puti(_1k, 0, $1.dmtx); /*23897*/
				$put(_1k, $1.dmtx.length, $1.fnc1); /*23898*/
				$1.dmtx = _1k; /*23899*/
			} /*23899*/
		} /*23899*/
		$1.barcode = $s(($1.dmtx.length + 1) * 5); /*23904*/
		$1.i = 0; /*23905*/
		$1.j = 0; /*23905*/
		for (;;) { /*23915*/
			if ($1.i == $1.dmtx.length) { /*23906*/
				break; /*23906*/
			} /*23906*/
			var _1u = $get($1.dmtx, $1.i); /*23907*/
			$k[$j++] = _1u; /*23912*/
			if (_1u == $1.fnc1) { /*23911*/
				$j--; /*23908*/
				$puti($1.barcode, $1.j, "^FNC1"); /*23908*/
				$1.j = $1.j + 4; /*23909*/
			} else { /*23911*/
				$put($1.barcode, $1.j, $k[--$j]); /*23911*/
			} /*23911*/
			$1.i = $1.i + 1; /*23913*/
			$1.j = $1.j + 1; /*23914*/
		} /*23914*/
		$1.barcode = $geti($1.barcode, 0, $1.j); /*23916*/
		$1.options.dontdraw = true; /*23919*/
		$1.options.parsefnc = true; /*23920*/
		$k[$j++] = "args"; /*23921*/
		$k[$j++] = $1.barcode; /*23921*/
		$k[$j++] = $1.options; /*23921*/
		$0.datamatrix(); /*23921*/
		var _2B = $k[--$j]; /*23921*/
		$1[$k[--$j]] = _2B; /*23921*/
		$1.args.opt = $1.options; /*23923*/
		$k[$j++] = $1.args; /*23926*/
		if (!$1.dontdraw) { /*23926*/
			$0.renmatrix(); /*23926*/
		} /*23926*/
	};

	$0.renmatrix = function() {
		if ($0.bwipjs_dontdraw) { /*25452*/
			return; /*25452*/
		} /*25452*/
		var $1 = {}; /*25454*/
		$1.args = $k[--$j]; /*25456*/
		$1.width = 1; /*25459*/
		$1.height = 1; /*25460*/
		$1.barcolor = "unset"; /*25461*/
		$1.backgroundcolor = "unset"; /*25462*/
		$1.includetext = false; /*25463*/
		$1.txt = $a([]); /*25464*/
		$1.textcolor = "unset"; /*25465*/
		$1.textxalign = "unset"; /*25466*/
		$1.textyalign = "unset"; /*25467*/
		$1.textfont = "Courier"; /*25468*/
		$1.textsize = 10; /*25469*/
		$1.textxoffset = 0; /*25470*/
		$1.textyoffset = 0; /*25471*/
		$1.textgaps = 0; /*25472*/
		$1.alttext = ""; /*25473*/
		$forall($1.args, function() { /*25476*/
			var _4 = $k[--$j]; /*25476*/
			$1[$k[--$j]] = _4; /*25476*/
		}); /*25476*/
		var _6 = $1.opt; /*25477*/
		for (var _7 in _6) { /*25477*/
			$1[_7] = _6[_7]; /*25477*/
		} /*25477*/
		$1.width = +$1.width; /*25479*/
		$1.height = +$1.height; /*25480*/
		$1.barcolor = "" + $1.barcolor; /*25481*/
		$1.backgroundcolor = "" + $1.backgroundcolor; /*25482*/
		$1.inkspread = +$1.inkspread; /*25483*/
		$1.inkspreadh = +$1.inkspreadh; /*25484*/
		$1.inkspreadv = +$1.inkspreadv; /*25485*/
		$1.textcolor = "" + $1.textcolor; /*25486*/
		$1.textxalign = "" + $1.textxalign; /*25487*/
		$1.textyalign = "" + $1.textyalign; /*25488*/
		$1.textfont = "" + $1.textfont; /*25489*/
		$1.textsize = +$1.textsize; /*25490*/
		$1.textxoffset = +$1.textxoffset; /*25491*/
		$1.textyoffset = +$1.textyoffset; /*25492*/
		$1.textgaps = +$1.textgaps; /*25493*/
		$1.alttext = "" + $1.alttext; /*25494*/
		$1.pixx8 = (~~Math.ceil($1.pixx / 8)) * 8; /*25497*/
		$k[$j++] = Infinity; /*25498*/
		for (var _S = 0, _T = $1.pixx8 * $1.pixy; _S < _T; _S++) { /*25498*/
			$k[$j++] = 0; /*25498*/
		} /*25498*/
		$1.pixs8 = $a(); /*25498*/
		for (var _X = 0, _W = $1.pixy - 1; _X <= _W; _X += 1) { /*25502*/
			$1.i = _X; /*25500*/
			$puti($1.pixs8, $1.pixx8 * $1.i, $geti($1.pixs, $1.pixx * $1.i, $1.pixx)); /*25501*/
		} /*25501*/
		$1.pixs = $1.pixs8; /*25503*/
		$1.imgstr = $s(~~($1.pixs.length / 8)); /*25506*/
		for (var _l = 0, _k = $1.pixs.length - 1; _l <= _k; _l += 1) { /*25510*/
			$1.i = _l; /*25508*/
			var _m = $1.imgstr; /*25509*/
			var _n = $1.i; /*25509*/
			$put(_m, ~~(_n / 8), $get(_m, ~~(_n / 8)) + ((~~(Math.pow(2, 7 - ($1.i % 8)))) * $get($1.pixs, $1.i))); /*25509*/
		} /*25509*/
		$$.save(); /*25513*/
		var _t = $$.currpos(); /*25514*/
		$$.translate(_t.x, _t.y); /*25514*/
		$$.scale(72 * $1.width, 72 * $1.height); /*25515*/
		$$.moveto(0.0001, 0.0001); /*25516*/
		$$.lineto(0.9999, 0.0001); /*25516*/
		$$.lineto(0.9999, 0.9999); /*25516*/
		$$.lineto(0.0001, 0.9999); /*25516*/
		$$.closepath(); /*25516*/
		if ($ne($1.barcolor, "unset")) { /*25518*/
			$$.setcolor($1.barcolor); /*25518*/
		} /*25518*/
		$$.imagemask($1.pixx, $1.pixy, $1.imgstr); /*25523*/
		$$.restore(); /*25524*/
		if ($1.includetext) { /*25587*/
			$$.save(); /*25528*/
			if ($ne($1.textcolor, "unset")) { /*25529*/
				$$.setcolor($1.textcolor); /*25529*/
			} /*25529*/
			if (($eq($1.textxalign, "unset") && $eq($1.textyalign, "unset")) && $eq($1.alttext, "")) { /*25584*/
				$1.s = 0; /*25531*/
				$1.fn = ""; /*25531*/
				var _17 = $1.txt; /*25532*/
				for (var _18 = 0, _19 = _17.length; _18 < _19; _18++) { /*25542*/
					$forall($get(_17, _18)); /*25533*/
					var _1B = $k[--$j]; /*25534*/
					var _1C = $k[--$j]; /*25534*/
					$k[$j++] = _1C; /*25540*/
					$k[$j++] = _1B; /*25540*/
					if ((_1B != $1.s) || $ne(_1C, $1.fn)) { /*25539*/
						var _1F = $k[--$j]; /*25535*/
						var _1G = $k[--$j]; /*25535*/
						$1.s = _1F; /*25535*/
						$1.fn = _1G; /*25535*/
						var _1H = $$.findfont(_1G); /*25537*/
						_1H.FontSize = _1F; /*25537*/
						$$.setfont(_1H); /*25537*/
					} else { /*25539*/
						$j -= 2; /*25539*/
					} /*25539*/
					var _1I = $k[--$j]; /*25541*/
					$$.moveto($k[--$j], _1I); /*25541*/
					$$.show($k[--$j], 0, 0); /*25541*/
				} /*25541*/
			} else { /*25584*/
				var _1N = $$.findfont($1.textfont); /*25544*/
				_1N.FontSize = $1.textsize; /*25544*/
				$$.setfont(_1N); /*25544*/
				if ($eq($1.alttext, "")) { /*25550*/
					$k[$j++] = Infinity; /*25546*/
					var _1P = $1.txt; /*25546*/
					for (var _1Q = 0, _1R = _1P.length; _1Q < _1R; _1Q++) { /*25546*/
						$forall($get($get(_1P, _1Q), 0)); /*25546*/
					} /*25546*/
					$1.txt = $a(); /*25546*/
					$1.tstr = $s($1.txt.length); /*25547*/
					for (var _1Z = 0, _1Y = $1.txt.length - 1; _1Z <= _1Y; _1Z += 1) { /*25548*/
						$put($1.tstr, _1Z, $get($1.txt, _1Z)); /*25548*/
					} /*25548*/
				} else { /*25550*/
					$1.tstr = $1.alttext; /*25550*/
				} /*25550*/
				if ($1.tstr.length == 0) { /*25566*/
					$k[$j++] = 0; /*25555*/
				} else { /*25566*/
					$$.save(); /*25557*/
					$$.newpath(); /*25558*/
					$$.moveto(0, 0); /*25558*/
					$$.charpath("0", false); /*25558*/
					var _1f = $$.pathbbox(); /*25558*/
					$$.restore(); /*25560*/
					var _1g = $$.currfont(); /*25561*/
					var _1h = _1g.PaintType !== undefined; /*25561*/
					$k[$j++] = _1f.ury; /*25561*/
					if (_1h) { /*25561*/
						var _1i = $$.currfont(); /*25561*/
						$k[$j++] = _1i.PaintType == 2; /*25561*/
					} else { /*25561*/
						$k[$j++] = false; /*25561*/
					} /*25561*/
					var _1k = $$.currfont(); /*25562*/
					var _1l = _1k.StrokeWidth !== undefined; /*25562*/
					if ($k[--$j] && _1l) { /*25567*/
						var _1n = $$.currfont(); /*25563*/
						var _1p = $$.currfont(); /*25564*/
						var _1q = _1p.FontMatrix; /*25564*/
						var _1r = _1n.StrokeWidth / 2; /*25565*/
						var _1s = $k[--$j]; /*25566*/
						$k[$j++] = _1s + (Math.sqrt((_1r * _1r) + (0 * 0))); /*25566*/
					} /*25566*/
				} /*25566*/
				$1.textascent = $k[--$j]; /*25569*/
				var _1v = $$.stringwidth($1.tstr); /*25570*/
				$1.textwidth = _1v.w + (($1.tstr.length - 1) * $1.textgaps); /*25570*/
				$1.textxpos = $1.textxoffset + (($1.pixx - $1.textwidth) / 2); /*25572*/
				if ($eq($1.textxalign, "left")) { /*25573*/
					$1.textxpos = $1.textxoffset; /*25573*/
				} /*25573*/
				if ($eq($1.textxalign, "right")) { /*25574*/
					$1.textxpos = ($1.pixx - $1.textxoffset) - $1.textwidth; /*25574*/
				} /*25574*/
				if ($eq($1.textxalign, "offleft")) { /*25575*/
					$1.textxpos = -($1.textwidth + $1.textxoffset); /*25575*/
				} /*25575*/
				if ($eq($1.textxalign, "offright")) { /*25576*/
					$1.textxpos = $1.pixx + $1.textxoffset; /*25576*/
				} /*25576*/
				if ($eq($1.textxalign, "justify") && ($1.textwidth < $1.pixx)) { /*25580*/
					$1.textxpos = 0; /*25578*/
					$1.textgaps = ($1.pixx - $1.textwidth) / ($1.tstr.length - 1); /*25579*/
				} /*25579*/
				$1.textypos = -(($1.textyoffset + $1.textascent) + 1); /*25581*/
				if ($eq($1.textyalign, "above")) { /*25582*/
					$1.textypos = ($1.textyoffset + $1.pixy) + 1; /*25582*/
				} /*25582*/
				if ($eq($1.textyalign, "center")) { /*25583*/
					$1.textypos = $1.textyoffset + (($1.pixy - $1.textascent) / 2); /*25583*/
				} /*25583*/
				$$.moveto($1.textxpos, $1.textypos); /*25584*/
				$$.show($1.tstr, $1.textgaps, 0); /*25584*/
			} /*25584*/
			$$.restore(); /*25586*/
		} /*25586*/
	};


	// bwip-js/barcode-ftr.js
	//
	// This code is injected below the cross-compiled barcode.ps.

	// The BWIPP symbol is a factory object.  When called, it returns this
	// function, which is a re-usable postscript emulation for BWIPP.
	return function(bwipjs, encoder, text, opts, dontdraw) {
		if (!$0[encoder]) {
			throw new Error('bwipp.unknownEncoder: ' + encoder);
		}
		if (typeof text !== 'string') {
			throw new Error('bwipp.typeError: barcode text not a string (' +
				text + ')');
		}
		opts = opts || {};
		if (typeof opts === 'string') {
			var tmp = opts.split(' ');
			opts = {};
			for (var i = 0; i < tmp.length; i++) {
				if (!tmp[i]) {
					continue;
				}
				var eq = tmp[i].indexOf('=');
				if (eq == -1) {
					opts[tmp[i]] = true;
				} else {
					opts[tmp[i].substr(0, eq)] = tmp[i].substr(eq + 1);
				}
			}
		} else if (typeof opts !== 'object' || opts.constructor !== Object) {
			throw new Error('bwipp.typeError: options not an object');
		}

		// Convert utf-16 to utf-8 but leave binary (8-bit) strings untouched.
		if (/[\u0100-\uffff]/.test(text)) {
			text = unescape(encodeURIComponent(text));
		}

		// Handle the `parse` option here rather than in BWIPP - eliminates
		// conflict with the parsefnc option and allows removing the parsing
		// code from BWIPP.
		if (opts.parse) {
			text = text.replace(/\^(\d\d\d)/g, function($0, $1) {
				var v = +$1;
				if (v > 255) {
					throw new Error('bwipp.rangeError:' +
						' ^NNN out-of-range (' + $0 + ')');
				}
				return String.fromCharCode(v);
			});
			delete opts.parse;
		}

		// Don't draw? (See file runtest)
		$0.bwipjs_dontdraw = dontdraw || false;

		// Invoke the encoder
		$$ = bwipjs;
		$k = [text, opts];
		$j = 2;
		$0[encoder]();

		// Return what is left on the stack.  This branch should only be taken
		// when running tests with the dontdraw option.
		if ($j) {
			return $k.splice(0, $j);
		}

		return true;
	}
}
BWIPP.VERSION = '2018-02-04';
if (typeof module === 'object' && module.exports) {
	module.exports = BWIPP;
}
