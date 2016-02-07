(function() {
/*
 * Modified from:
 * http://lxr.mozilla.org/mozilla/source/extensions/xml-rpc/src/nsXmlRpcClient.js#956
 */

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla XML-RPC Client component.
 *
 * The Initial Developer of the Original Code is
 * Digital Creations 2, Inc.
 * Portions created by the Initial Developer are Copyright (C) 2000
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Martijn Pieters <mj@digicool.com> (original author)
 *   Samuel Sieb <samuel@sieb.net>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/*jslint white: false, bitwise: false, plusplus: false */
/*global console */


function stringFromArray (data) {
   var length = data.length,
      tmp = new Array(Math.ceil(length / 8)),
      i, j;

   for (i = 0, j = 0; i < length; i += 8, j++) {
      tmp[j] = String.fromCharCode(data[i],
                                     data[i + 1],
                                     data[i + 2],
                                     data[i + 3],
                                     data[i + 4],
                                     data[i + 5],
                                     data[i + 6],
                                     data[i + 7]);
   }

   return tmp.join('').substr(0, length);
};


function arrayFromString (str) {
   var length = str.length,
      array = new Array(length),
      i;

   for (i = 0; i+7 < length; i += 8) {
      array[i] = str.charCodeAt(i);
      array[i + 1] = str.charCodeAt(i + 1);
      array[i + 2] = str.charCodeAt(i + 2);
      array[i + 3] = str.charCodeAt(i + 3);
      array[i + 4] = str.charCodeAt(i + 4);
      array[i + 5] = str.charCodeAt(i + 5);
      array[i + 6] = str.charCodeAt(i + 6);
      array[i + 7] = str.charCodeAt(i + 7);
   }

   for (; i < length; i++) {
      array[i] = str.charCodeAt(i);
   }

   return array;
};


var Base64Old = {

/* Convert data (an array of integers) to a Base64 string. */
toBase64Table : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
base64Pad     : '=',

encodeFromArray: function (data) {
    "use strict";
    var result = '',
        chrTable = Base64Old.toBase64Table.split(''),
        pad = Base64Old.base64Pad,
        length = data.length,
        iterLength = length - 2,
        lengthMod3 = length % 3,
        i;
    // Convert every three bytes to 4 ascii characters.
    for (i = 0; i < iterLength; i += 3) {
        result += chrTable[data[i] >> 2];
        result += chrTable[((data[i] & 0x03) << 4) + (data[i+1] >> 4)];
        result += chrTable[((data[i+1] & 0x0f) << 2) + (data[i+2] >> 6)];
        result += chrTable[data[i+2] & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (lengthMod3) {
        i = length - lengthMod3;
        result += chrTable[data[i] >> 2];
        if (lengthMod3 === 2) {
            result += chrTable[((data[i] & 0x03) << 4) + (data[i+1] >> 4)];
            result += chrTable[(data[i+1] & 0x0f) << 2];
            result += pad;
        } else {
            result += chrTable[(data[i] & 0x03) << 4];
            result += pad + pad;
        }
    }

    return result;
},

encodeFromString: function (data) {
    "use strict";
    var result = '',
        chrTable = Base64Old.toBase64Table.split(''),
        pad = Base64Old.base64Pad,
        length = data.length,
        i;
    // Convert every three bytes to 4 ascii characters.
    for (i = 0; i < (length - 2); i += 3) {
       var c0, c1, c2;
       c0 = data.charCodeAt(i);
       c1 = data.charCodeAt(i+1);
       c2 = data.charCodeAt(i+2);
        result += chrTable[c0 >> 2];
        result += chrTable[((c0 & 0x03) << 4) + (c1 >> 4)];
        result += chrTable[((c1 & 0x0f) << 2) + (c2 >> 6)];
        result += chrTable[c2 & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length%3) {
        var c0, c1, c2;
        c0 = data.charCodeAt(i);
        i = length - (length%3);
        result += chrTable[c0 >> 2];
        if ((length%3) === 2) {
            c1 = data.charCodeAt(i+1);
            result += chrTable[((c0 & 0x03) << 4) + (c1 >> 4)];
            result += chrTable[(c1 & 0x0f) << 2];
            result += pad;
        } else {
            result += chrTable[(c0 & 0x03) << 4];
            result += pad + pad;
        }
    }

    return result;
   },

/* Convert Base64 data to a string */
toBinaryTable : [
    -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1,
    -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,-1,
    -1,-1,-1,-1, -1,-1,-1,-1, -1,-1,-1,62, -1,-1,-1,63,
    52,53,54,55, 56,57,58,59, 60,61,-1,-1, -1, 0,-1,-1,
    -1, 0, 1, 2,  3, 4, 5, 6,  7, 8, 9,10, 11,12,13,14,
    15,16,17,18, 19,20,21,22, 23,24,25,-1, -1,-1,-1,-1,
    -1,26,27,28, 29,30,31,32, 33,34,35,36, 37,38,39,40,
    41,42,43,44, 45,46,47,48, 49,50,51,-1, -1,-1,-1,-1
],

decodeToArray: function (data) {
    "use strict";
    var binTable = Base64Old.toBinaryTable,
        pad = Base64Old.base64Pad,
        result, result_length, idx, i, c, padding,
        leftbits = 0, // number of bits decoded, but yet to be appended
        leftdata = 0, // bits decoded, but yet to be appended
    data_length, firstPad = data.indexOf('=');

    if (firstPad < 0) {
       data_length = data.length;
    } else {
       data_length = firstPad;
    }


    /* Every four characters is 3 resulting numbers */
    result_length = (data_length >> 2) * 3 + Math.floor((data_length%4)/1.5);
    result = new Array(result_length);

    idx = 0;
    i = 0;

    for (; i+4 < data_length; i += 4, idx += 3) {
       var c0 = binTable[data.charCodeAt(i+0)];
       var c1 = binTable[data.charCodeAt(i+1)];
       var c2 = binTable[data.charCodeAt(i+2)];
       var c3 = binTable[data.charCodeAt(i+3)];

       result[idx+0] = ((c0 << 2) | (c1 >> 4)) & 0xff;
       result[idx+1] = ((c1 << 4) | (c2 >> 2)) & 0xff;
       result[idx+2] = ((c2 << 6) | (c3)) & 0xff;
    }

    // Convert one by one.
    for (; i < data.length; i++) {
        c = binTable[data.charCodeAt(i)];
        padding = (data.charAt(i) === pad);

        // Collect data into leftdata, update bitcount
        leftdata = (leftdata << 6) | c;
        leftbits += 6;

        // If we have 8 or more bits, append 8 bits to the result
        if (leftbits >= 8) {
            leftbits -= 8;
            // Append if not padding.
            if (!padding) {
                result[idx++] = (leftdata >> leftbits) & 0xff;
            }
            leftdata &= (1 << leftbits) - 1;
        }
    }

    // If there are any bits left, the base64 string was corrupted
    if (leftbits) {
        throw {name: 'Base64-Error',
               message: 'Corrupted base64 string'};
    }

    return result;
   },

decodeToString: function (data) {
      return stringFromArray(this.decodeToArray(data));
   },


}; /* End of Base64 namespace */

var Base64New = {
decodeToArray: function (data) {
      return arrayFromString(window.atob(data));
   },

decodeToString: function (data) {
      return window.atob(data);
   },

encodeFromArray: function (data) {
      return window.btoa(stringFromArray(data));
   },

encodeFromString: function (data) {
      return window.btoa(data);
   }
};

if (window.atob) {
   Base64 = Base64New;
} else {
   Base64 = Base64Old;
}
/*
 *------------------------------------------------------------------------------
 *
 * wmks\core.js
 *
 *    This file initializes the WMKS root namespace and some of the generic
 *    functionality is defined accordingly.
 *
 *    This contains the following:
 *    1. Global constants (WMKS.CONST)
 *       Specific constants go a level deeper. (Ex: WMKS.CONST.TOUCH, etc.)
 *    2. Generic utility / helper functions.
 *       a. WMKS.LOGGER:   Logging with different log levels.
 *       b. AB.BROWSER:    Detects various browser types and features.
 *       c. WMKS.UTIL:     Utility helper functions.
 *
 *    NOTE: Namespace should be upper case.
 *
 *------------------------------------------------------------------------------
 */

WMKS = {};

/**
 *------------------------------------------------------------------------------
 *
 * WMKS.LOGGER
 *
 *    The logging namespace that defines a log utility. It has:
 *    1. Five logging levels
 *    2. Generic log function that accepts a log level (defaults to LOG_LEVEL).
 *    3. Log level specific logging.
 *    4. Log only when requested log level is above or equal to LOG_LEVEL value.
 *    5. Dynamically set logging levels.
 *
 *------------------------------------------------------------------------------
 */

WMKS.LOGGER = new function() {
   'use strict';

   this.LEVEL = {
      TRACE: 0,
      DEBUG: 1,
      INFO:  2,
      WARN:  3,
      ERROR: 4
   };

   // The default log level is set to INFO.
   var _logLevel = this.LEVEL.INFO,
       _logLevelDesc = [' [Trace] ', ' [Debug] ', ' [Info ] ', ' [Warn ] ', ' [Error] '];

   // Logging functions for different log levels.
   this.trace = function(args) { this.log(args, this.LEVEL.TRACE); };
   this.debug = function(args) { this.log(args, this.LEVEL.DEBUG); };
   this.info =  function(args) { this.log(args, this.LEVEL.INFO);  };
   this.warn =  function(args) { this.log(args, this.LEVEL.WARN);  };
   this.error = function(args) { this.log(args, this.LEVEL.ERROR); };

   /*
    *---------------------------------------------------------------------------
    *
    * log
    *
    *    The common log function that uses the default logging level.
    *    Use this when you want to see this log at all logging levels.
    *
    *    IE does not like if (!console), so check for undefined explicitly.
    *    Bug: 917027
    *
    *---------------------------------------------------------------------------
    */

   this.log =
      (typeof console === 'undefined' || typeof console.log === 'undefined')?
         $.noop :
         function(logData, level) {
            level = (level === undefined)? this.LEVEL.INFO : level;
            if (level >= _logLevel && logData) {
               // ISO format has ms precission, but lacks IE9 support.
               // Hence use UTC format for IE9.
               console.log((WMKS.BROWSER.isIE()?
                              new Date().toUTCString() : new Date().toISOString())
                           + _logLevelDesc[level] + logData);
            }
         };

   /*
    *---------------------------------------------------------------------------
    *
    * setLogLevel
    *
    *    This public function is used to set the logging level. If the input is
    *    invalid, then the default logging level is used.
    *
    *---------------------------------------------------------------------------
    */

   this.setLogLevel = function(newLevel) {
      if (typeof newLevel === 'number' && newLevel >= 0 && newLevel < _logLevelDesc.length) {
         _logLevelDesc = newLevel;
      } else {
         this.log('Invalid input logLevel: ' + newLevel);
      }
   };
};


/**
 *------------------------------------------------------------------------------
 *
 * WMKS.BROWSER
 *
 *    This namespace object contains helper function to identify browser
 *    specific details such as isTouchDevice, isIOS, isAndroid, and extends
 *    $.browser values.
 *
 *    NOTE: We deliberately skipped detecting the version value, as the version
 *    checks are expected to be performed before using webmks. We can add it
 *    if it adds value going forward.
 *
 *------------------------------------------------------------------------------
 */

WMKS.BROWSER = new function() {
   var ua = navigator.userAgent.toLowerCase(),
       vs = navigator.appVersion.toString(),
       trueFunc = function() { return true; },
       falseFunc = function() { return false; };

   // In the wake of $.browser being depricated, use the following:
   this.isIE = (ua.indexOf('msie') !== -1 || ua.indexOf('trident') !== -1)?
                  trueFunc : falseFunc;
   this.isOpera = (ua.indexOf('opera/') !== -1)? trueFunc : falseFunc;
   this.isWebkit = this.isChrome = this.isSafari = this.isBB = falseFunc;

   // Check for webkit engine.
   if (ua.indexOf('applewebkit') !== -1) {
      this.isWebkit = trueFunc;
      // Webkit engine is used by chrome, safari and blackberry browsers.
      if (ua.indexOf('chrome') !== -1) {
         this.isChrome = trueFunc;
      } else if (ua.indexOf('bb') !== -1) {
         // Detect if its a BlackBerry browser or higher on OS BB10+
         this.isBB = trueFunc;
      } else if (ua.indexOf('safari') !== -1) {
         this.isSafari = trueFunc;
      }
   }

   // See: https://developer.mozilla.org/en/Gecko_user_agent_string_reference
   // Also, Webkit/IE11 say they're 'like Gecko', so we get a false positive here.
   this.isGecko = (!this.isWebkit() && !this.isIE() && ua.indexOf('gecko') !== -1)
      ? trueFunc : falseFunc;

   // Flag indicating low bandwidth, not screen size.
   this.isLowBandwidth = (ua.indexOf('mobile') !== -1)? trueFunc : falseFunc;

   // Detect specific mobile devices. These are *not* guaranteed to also set
   // isLowBandwidth. Some however do when presenting over WiFi, etc.
   this.isIOS = ((ua.indexOf('iphone') !== -1) || (ua.indexOf('ipod') !== -1) ||
                 (ua.indexOf('ipad') !== -1))? trueFunc : falseFunc;

   /* typically also sets isLinux */
   this.isAndroid = (ua.indexOf('android') !== -1)? trueFunc : falseFunc;

   // Detect IE mobile versions.
   this.isIEMobile = (ua.indexOf('IEMobile') !== -1)? trueFunc : falseFunc;

   // Flag indicating that touch feature exists. (Ex: includes Win8 touch laptops)
   this.hasTouchInput = ('ontouchstart' in window
                        || navigator.msMaxTouchPoints)? trueFunc : falseFunc;

   // TODO: Include windows/BB phone as touchDevice.
   this.isTouchDevice = (this.isIOS() || this.isAndroid() || this.isBB())?
                        trueFunc : falseFunc;

   // PC OS detection.
   this.isChromeOS = (ua.indexOf('cros') !== -1)? trueFunc : falseFunc;
   this.isWindows = (ua.indexOf('windows') !== -1)? trueFunc : falseFunc;
   this.isLinux = (ua.indexOf('linux') !== -1)? trueFunc : falseFunc;
   this.isMacOS = (ua.indexOf('macos') !== -1 || ua.indexOf('macintosh') > -1)?
                  trueFunc : falseFunc;

   /*
    *---------------------------------------------------------------------------
    *
    * isCanvasSupported
    *
    *    Tests if the browser supports the use of <canvas> elements properly
    *    with the ability to retrieve its draw context.
    *
    *---------------------------------------------------------------------------
    */

   this.isCanvasSupported = function() {
      try {
         var canvas = document.createElement('canvas');
         var result = !!canvas.getContext; // convert to Boolean, invert again.
         canvas = null; // was never added to DOM, don't need to remove
         return result;
      } catch(e) {
         return false;
      }
   };

};


/**
 *------------------------------------------------------------------------------
 *
 * WMKS.CONST
 *
 *    Constant values under CONST namespace thats used across WMKS.
 *
 *------------------------------------------------------------------------------
 */

WMKS.CONST = {
   // Touch events can use the following keycodes to mimic mouse events.
   CLICK: {
      left:       0x1,
      middle:     0x2,
      right:      0x4
   },

   FORCE_RAW_KEY_CODE: {
      8:          true,    // backspace
      9:          true,    // tab
      13:         true     // newline
   }
};


/**
 *------------------------------------------------------------------------------
 *
 * WMKS.UTIL
 *
 *    This namespace object contains common helper function.
 *
 *------------------------------------------------------------------------------
 */

WMKS.UTIL = {
   /*
    *---------------------------------------------------------------------------
    *
    * createCanvas
    *
    *    This function creates a canvas element and adds the absolute
    *    position css to it if the input flag is set.
    *
    *---------------------------------------------------------------------------
    */

   createCanvas: function(addAbsolutePosition) {
      var css = {};
      if (addAbsolutePosition) {
         css.position = 'absolute';
      }
      return $('<canvas/>').css(css);
   },

   /*
    *---------------------------------------------------------------------------
    *
    * getLineLength
    *
    *    Gets the length of the line that starts at (0, 0) and ends at
    *    (dx, dy) and returns the floating point number.
    *
    *---------------------------------------------------------------------------
    */

   getLineLength: function(dx, dy) {
      return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
   },

   /*
    *---------------------------------------------------------------------------
    *
    * isHighResolutionSupported
    *
    *    Indicates if high-resolution mode is available for this browser. Checks
    *    for a higher devicePixelRatio on the browser.
    *
    *---------------------------------------------------------------------------
    */

   isHighResolutionSupported: function() {
      return window.devicePixelRatio && window.devicePixelRatio > 1;
   },

   /*
    *---------------------------------------------------------------------------
    *
    * isFullscreenNow
    *
    *    Utility function to inform if the browser is in full-screen mode.
    *
    *---------------------------------------------------------------------------
    */

   isFullscreenNow: function() {
      return document.fullscreenElement ||
             document.mozFullScreenElement ||
             document.webkitFullscreenElement
             ? true : false;
   },

   /*
    *---------------------------------------------------------------------------
    *
    * isFullscreenEnabled
    *
    *    Utility function that indicates if fullscreen feature is enabled on
    *    this browser.
    *
    *---------------------------------------------------------------------------
    */

   isFullscreenEnabled: function() {
      return document.fullscreenEnabled ||
             document.mozFullScreenEnabled ||
             document.webkitFullscreenEnabled
             ? true : false;
   },

   /*
    *---------------------------------------------------------------------------
    *
    * toggleFullScreen
    *
    *    This function toggles the fullscreen mode for this browser if it is
    *    supported. If not, it just ignores the request.
    *
    *---------------------------------------------------------------------------
    */

   toggleFullScreen: function(showFullscreen, element) {
      var currentState = WMKS.UTIL.isFullscreenNow(),
          ele = element || document.documentElement;

      if (!WMKS.UTIL.isFullscreenEnabled()) {
         WMKS.LOGGER.warn('This browser does not support fullScreen mode.');
         return;
      }
      if (currentState === showFullscreen) {
         // already in the desired state.
         return;
      }

      // If currently in Fullscreen mode, turn it off.
      if (currentState) {
         if (document.exitFullscreen) {
            document.exitFullscreen();
         }
         else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
         }
         else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
         }
      } else {
         // Flip to full-screen now.
         if (ele.requestFullscreen) {
            ele.requestFullscreen();
         } else if (ele.mozRequestFullScreen) {
            ele.mozRequestFullScreen();
         } else if (ele.webkitRequestFullscreen) {
            ele.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
         }
      }
   }

};

/*
 * wmks/websocketInit.js
 *
 *   WebMKS WebSocket initialisation module for
 *   compatibility with older browsers.
 *
 *   Contains a helper function to inistanciate WebSocket object.
 *
 */


if (window.WebSocket) {
   /*
    * Nothing to do as the browser is WebSockets compliant.
    */
} else if (window.MozWebSocket) {
   window.WebSocket = window.MozWebSocket;
} else {
   (function () {
      window.WEB_SOCKET_SWF_LOCATION = "web-socket-js/WebSocketMain.swf";
      document.write("<script src='web-socket-js/swfobject.js'><\/script>" +
                     "<script src='web-socket-js/web_socket.js'><\/script>");
   }());
}


/*
 *------------------------------------------------------------------------------
 *
 * WMKSWebSocket
 *
 *    Create an alternate class that consumes WebSocket and provides a non-native
 *    code constructor we can use to stub out in Jasmine (a testing framework).
 *
 * Results:
 *    Newly constructed WebSocket.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.WebSocket = function(url, protocol) {
   return new WebSocket(url);
};

/*
 * wmks/arrayPush.js
 *
 *   Convenience functions for building an array of bytes
 *   (for sending messages to servers or handling image formats).
 *
 */


Array.prototype.push8 = function (aByte) {
   this.push(aByte & 0xFF);
};


Array.prototype.push16 = function (aWord) {
   this.push((aWord >> 8) & 0xFF,
             (aWord     ) & 0xFF);
};


Array.prototype.push32 = function (aLongWord) {
   this.push((aLongWord >> 24) & 0xFF,
             (aLongWord >> 16) & 0xFF,
             (aLongWord >>  8) & 0xFF,
             (aLongWord      ) & 0xFF);
};


Array.prototype.push16le = function(aWord) {
   this.push((aWord     ) & 0xff,
             (aWord >> 8) & 0xff);
};


Array.prototype.push32le = function(aLongWord) {
   this.push((aLongWord     ) & 0xff,
             (aLongWord >> 8) & 0xff,
             (aLongWord >> 16) & 0xff,
             (aLongWord >> 24) & 0xff);
};

/*
 *------------------------------------------------------------------------------
 * wmks/ImageManagerWMKS.js
 *
 *    This class abstracts Image caching solution in an optimal way. It takes
 *    care of returning the image in a clean, and memory leak proof manner.
 *    It exposes 2 functions  to get and release images. The get function
 *    returns an Image object either from an unused cache or by creating a new one.
 *    The return function, depending on the max allowed cache size decides to
 *    either add the image to the cache or get rid of it completely.
 *
 *------------------------------------------------------------------------------
 */

function ImageManagerWMKS(imageCacheSize) {
  'use strict';
   var _cacheSize = 256;    // Max number of images that will be cached.
   var _cacheArray = [];    // Cache to hold images.

   // Validate if input is a non-zero number.
   if (typeof imageCacheSize === 'number' && imageCacheSize) {
      _cacheSize = imageCacheSize;
   }

   /*
    *---------------------------------------------------------------------------
    *
    * _getImage
    *
    *    Pushes the current image to the cache if it is not full,
    *    and then deletes the image.
    *
    *---------------------------------------------------------------------------
    */

   var _getImageFromCache = function() {
      if (_cacheArray.length > 0) {
         return _cacheArray.shift();
      } else {
         return new Image();
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _deleteImage
    *
    *    This private function takes an array containing a single image and
    *    deletes the image. The reason for using an array containg the image
    *    instead of 'delete image' call is to comply with javascript strict mode.
    *
    *---------------------------------------------------------------------------
    */

   var _deleteImage = function(imgArray) {
      delete imgArray[0];
      imgArray[0] = null;
      imgArray = null;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _cacheImageOrDelete
    *
    *    Private function that resets event handlers if any. Sets src to an
    *    empty image. Pushes the current image to the cache if it is not full,
    *    else deletes the image.
    *
    *---------------------------------------------------------------------------
    */

   var _cacheImageOrDelete = function(image) {
      // Reset onload and onerror event handlers if any.
      image.onload = image.onerror = null;

      /*
       * Issues with webkit image caching:
       * 1. Setting image.src to null is insufficient to turn off image caching
       *    in chrome (webkit).
       * 2. An empty string alone is not sufficient since browsers may treat
       *    that as meaning the src is the current page (HTML!) which whill
       *    will lead to a warning on the browsers javascript console.
       * 3. If we set it to an actual string with an empty data URL, this helps
       *    the first time, however when we try to decode the same image again
       *    and again later on, the onload will not be called and we have a
       *    problem.
       * 4. So finally, we use an empty data URL, and append a timestamp to the
       *    data URL so that the browser treats it as a new image every time.
       *    This keeps image cache consistent. PR: 1090976       *
       */
      image.src = "data:image/jpeg;base64,?" + $.now();

      if (_cacheArray.length <= _cacheSize) {
         _cacheArray.push(image);
      } else {
         // Image deleting in strict mode causes error. Hence the roundabout way.
         _deleteImage([image]);
      }
   };

   /*
    *---------------------------------------------------------------------------
    *
    * getImage
    *
    *    Public function that invokes a private function _getImageFromCache()
    *    to get an image.
    *
    *---------------------------------------------------------------------------
    */
   this.getImage = function() {
      return _getImageFromCache();
   };

   /*
    *---------------------------------------------------------------------------
    *
    * releaseImage
    *
    *    Public function that invokes a private function _cacheImageOrDelete()
    *    to add the image to a cache when the cache is not full or delete the
    *    image.
    *
    *---------------------------------------------------------------------------
    */
   this.releaseImage = function(image) {
      if (!image) {
         return;
      }
      _cacheImageOrDelete(image);
   };
};
/*
 * wmks/mousewheel.js
 *
 *    Event registration for mouse wheel support.
 *
 * jQuery doesn't provide events for mouse wheel movement. This script
 * registers some events we can hook into to detect mouse wheel events
 * in a somewhat cross-browser way.
 *
 * The only information we really need in WebMKS is the direction it scrolled,
 * and not the deltas. This is good, because there is no standard at all
 * for mouse wheel events across browsers when it comes to variables and
 * values, and it's nearly impossible to normalize.
 */

(function() {


var WHEEL_EVENTS = ['mousewheel', 'DOMMouseScroll'];


/*
 *------------------------------------------------------------------------------
 *
 * onMouseWheelEvent
 *
 *    Handles a mouse wheel event. The resulting event will have wheelDeltaX
 *    and wheelDeltaY values.
 *
 * Results:
 *    The returned value from the handler(s).
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

function onMouseWheelEvent(event) {
   var delta = 0,
       deltaX,
       deltaY,
       dispatch = $.event.dispatch || $.event.handle;

   event = event || window.event;

   deltaX = -(event.wheelDeltaX || 0);
   deltaY = -(event.wheelDeltaY || event.wheelDelta || 0);
   if (event.detail !== null) {
      /*
       * event.detail will only ever be -1,0,1 --
       * AppBlast uses the standard 120 click step in this case
       * so we'll do the same.
       */
      if (event.axis === event.HORIZONTAL_AXIS) {
         deltaX = event.detail * 120;
      } else if (event.axis === event.VERTICAL_AXIS) {
         deltaY = event.detail * 120;
      }
   }

   event = $.event.fix(event);
   event.type = 'mousewheel';
   delete event.wheelDelta;
   event.wheelDeltaX = deltaX;
   event.wheelDeltaY = deltaY;

   return dispatch.call(this, event);
}


/*
 *------------------------------------------------------------------------------
 *
 * $.event.special.mousewheel
 *
 *    Provides a "mousewheel" event in jQuery that can be binded to a callback.
 *    This handles the different browser events for wheel movements.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

$.event.special.mousewheel = {
   setup: function() {
      if (this.addEventListener) {
         var i;

         for (i = 0; i < WHEEL_EVENTS.length; i++) {
            this.addEventListener(WHEEL_EVENTS[i], onMouseWheelEvent, false);
         }
      } else {
         this.onmousewheel = onMouseWheelEvent;
      }
   },

   tearDown: function() {
      if (this.removeEventListener) {
         var i;

         for (i = 0; i < WHEEL_EVENTS.length; i++) {
            this.removeEventListener(WHEEL_EVENTS[i], onMouseWheelEvent, false);
         }
      } else {
         this.onmousewheel = onMouseWheelEvent;
      }
   }
};


})();

/*
 * wmks/vncProtocol.js
 *
 *   WebMKS VNC decoder prototype.
 *
 */

WMKS.VNCDecoder = function(opts) {
   var i;
   this.options = $.extend({}, this.options, opts);

   $.extend(this, {
      useVMWRequestResolution: false,
      useVMWKeyEvent: false,                 // VMware VScanCode key inputs are handled.
      allowVMWKeyEvent2UnicodeAndRaw: false, // unicode + JS keyCodes are handled by server.
      useVMWAck: false,
      useVMWAudioAck: false,
      _websocket: null,
      _encrypted: false,
      _receivedFirstUpdate: false,
      _serverInitialized: false,
      _canvas: [],
      _currentCursorURI: 'default',
      _imageCache: [],

      _copyRectBlit: null,
      _copyRectOffscreenBlit: null,

      _state: this.DISCONNECTED,

      _FBWidth: 0,
      _FBHeight: 0,
      _FBName: '',
      _FBBytesPerPixel: 0,
      _FBDepth: 3,

      /*
       * Subvert any static analysis of what we're doing in flush() by
       * creating a side-effect here.
       */
      _flushSink: 0,

      /*
       * Mouse state.
       * The current button state(s) are sent with each pointer event.
       */
      _mouseButtonMask: 0,
      _mouseX: 0,
      _mouseY: 0,
      onDecodeComplete: {},

      /*
       * Frame buffer update state.
       */
      rects: 0,
      rectsRead: 0,
      rectsDecoded: 0,

      /*
       * Width/height requested through self.onRequestResolution()
       */
      requestedWidth: 0,
      requestedHeight: 0,

      /*
       * Rate-limit resolution requests to the server.  These are slow
       * & we get a better experience if we don't send too many of
       * them.
       */
      resolutionTimeout: {},
      resolutionTimer: null,
      resolutionRequestActive: false,

      /*
       * We maintain an incrementing ID for each update request.
       * This assists in tracking updates/acks with the host.
       */
      updateReqId: 0,

      /*
       * Typematic details for faking keyboard auto-repeat in
       * the client.
       */
      typematicState: 1,             // on
      typematicPeriod: 33333,        // microseconds
      typematicDelay: 500000,        // microseconds

      /*
       * Bitmask of Remote keyboard LED state
       *
       * Bit 0 - Scroll Lock
       * Bit 1 - Num Lock
       * Bit 2 - Caps Lock
       */
      _keyboardLEDs: 0,

      /*
       * Timestamp frame's timestamp value --
       * This is stored as the low and high 32 bits as
       * Javascript integers can only give 53 bits of precision.
       */
      _frameTimestampLo: 0,
      _frameTimestampHi: 0,

      rect: [],
      _msgTimer: null,
      _mouseTimer: null,
      _mouseActive: false,
      msgTimeout: {},
      mouseTimeout: {},

      _url: "",
      _receiveQueue: "",
      _receiveQueueIndex: 0
   });

   this.setRenderCanvas(this.options.canvas);

   /*
    * Did we get a backbuffer canvas?
    */
   if (this.options.backCanvas) {
      this._canvas = this._canvas.concat([this.options.backCanvas]);
      this._canvas[1].ctx = this.options.backCanvas.getContext('2d');
   }

   if (this.options.blitTempCanvas) {
      this._canvas = this._canvas.concat([this.options.blitTempCanvas]);
      this._canvas[2].ctx = this.options.blitTempCanvas.getContext('2d');
   }

   // TODO: Make it a private var as the consumers if this object should have
   // been private too. Leave it as public until then.
   this._imageManager = new ImageManagerWMKS();

   /*
    *---------------------------------------------------------------------------
    *
    * _releaseImage
    *
    *    Pushes the current image to the cache if it is not full,
    *    and then deletes the image. Reset destX, destY before image recycle.
    *
    *---------------------------------------------------------------------------
    */

   this._releaseImage = function (image) {
      image.destX = image.destY = null;
      this._imageManager.releaseImage(image);
   };

   return this;
};


$.extend(WMKS.VNCDecoder.prototype, {
   options: {
      canvas: null,
      backCanvas: null,
      blitTempCanvas: null,
      useVNCHandshake: true,
      useUnicodeKeyboardInput: false,
      enableVorbisAudioClips: false,
      enableOpusAudioClips: false,
      enableAacAudioClips: false,
      onConnecting: function() {},
      onConnected: function() {},
      onDisconnected: function() {},
      onAuthenticationFailed: function() {},
      onError: function(err) {},
      onProtocolError: function() {},
      onNewDesktopSize: function(width, height) {},
      onKeyboardLEDsChanged: function(leds) {},
      onHeartbeat: function(interval) {},
      onCopy: function(txt) {},
      onAudio: function(audioInfo) {}
   },

   DISCONNECTED: 0,
   VNC_ACTIVE_STATE: 1,
   FBU_DECODING_STATE: 2,
   FBU_RESTING_STATE: 3,

   /*
    * Server->Client message IDs.
    */
   msgFramebufferUpdate: 0,
   msgSetColorMapEntries: 1,
   msgRingBell: 2,
   msgServerCutText: 3,
   msgVMWSrvMessage: 127,

   /*
    * VMWSrvMessage sub-IDs we handle.
    */
   msgVMWSrvMessage_ServerCaps: 0,
   msgVMWSrvMessage_Audio: 3,
   msgVMWSrvMessage_Heartbeat: 4,

   /*
    * Client->Server message IDs: VNCClientMessageID
    */
   msgClientEncodings: 2,
   msgFBUpdateRequest: 3,
   msgKeyEvent: 4,
   msgPointerEvent: 5,
   msgVMWClientMessage: 127,

   /*
    * VMware Client extension sub-IDs: VNCVMWClientMessageID
    */
   msgVMWKeyEvent: 0,
   msgVMWPointerEvent2: 2,
   msgVMWKeyEvent2: 6,
   msgVMWAudioAck: 7,

   /*
    * Encodings for rectangles within FBUpdates.
    */
   encRaw:               0x00,
   encCopyRect:          0x01,
   encTightPNG:          -260,
   encDesktopSize:       -223,
   encTightPNGBase64:     21 + 0x574d5600,
   encTightDiffComp:      22 + 0x574d5600,
   encVMWDefineCursor:   100 + 0x574d5600,
   encVMWCursorState:    101 + 0x574d5600,
   encVMWCursorPosition: 102 + 0x574d5600,
   encVMWTypematicInfo:  103 + 0x574d5600,
   encVMWLEDState:       104 + 0x574d5600,
   encVMWServerPush2:    123 + 0x574d5600,
   encVMWServerCaps:     122 + 0x574d5600,
   encVMWFrameStamp:     124 + 0x574d5600,
   encOffscreenCopyRect: 126 + 0x574d5600,
   encTightJpegQuality10: -23,

   diffCompCopyFromPrev: 0x1,
   diffCompAppend: 0x2,
   diffCompAppendRemaining:  0x3,

   /*
    * Capability bits from VMWServerCaps which we can make use of.
    */
   serverCapKeyEvent:           0x002,
   serverCapClientCaps:         0x008,
   serverCapUpdateAck:          0x020,
   serverCapRequestResolution:  0x080,
   serverCapKeyEvent2Unicode:   0x100,
   serverCapKeyEvent2JSKeyCode: 0x200,
   serverCapAudioAck:           0x400,

   /*
    * Capability bits from VMClientCaps which we make use of.
    */
   clientCapHeartbeat:        0x100,
   clientCapVorbisAudioClips: 0x200,
   clientCapOpusAudioClips:   0x400,
   clientCapAacAudioClips:    0x800,
   clientCapAudioAck:         0x1000,

   /*
    * Flags in the VNCAudioData packet
    */
   audioflagRequestAck:       0x1,

   /*
    * Sub-encodings for the tightPNG/tightPNGBase64 encoding.
    */
   subEncFill: 0x80,
   subEncJPEG: 0x90,
   subEncPNG:  0xA0,
   subEncDiffJpeg:  0xB0,
   subEncMask: 0xF0,

   mouseTimeResolution: 16,  // milliseconds
   resolutionDelay: 300,     // milliseconds

   _receiveQueueSliceTrigger: 4096
});





/** @private */

/*
 *------------------------------------------------------------------------------
 *
 * fail
 *
 *    Prints an error message and disconnects from the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Prints an error message and disconnects from the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.fail = function (msg) {
   WMKS.LOGGER.log(msg);
   this.disconnect();
};



/*
 *------------------------------------------------------------------------------
 *
 * _assumeServerIsVMware
 *
 *    Enables features available only on VMware servers.
 *
 *    This is called when we have reason to believe that we are connecting
 *    to a VMware server. Old servers do not advertise their extensions,
 *    so we have to rely on fingerprinting for those.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Enables VMware-only features, which may crash connections
 *    to non-VMware servers.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._assumeServerIsVMware = function () {
   /*
    * Only when we skip VNC authentication we also assume that the server
    * is a VMware one. This is an additional protection in case someone
    * implements a server that emits CursorState updates.
    */
   if (this.options.useVNCHandshake) {
      return;
   }

   /*
    * The server seems to be a VMware server. Enable proprietary extensions.
    */
   this.useVMWKeyEvent = true;
};






/*
 *
 * RX/TX queue management
 *
 */


/*
 *------------------------------------------------------------------------------
 *
 * _receiveQueueBytesUnread
 *
 *    Calculates the number of bytes received but not yet parsed.
 *
 * Results:
 *    The number of bytes locally available to parse.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._receiveQueueBytesUnread = function () {
   "use strict";

   return this._receiveQueue.length - this._receiveQueueIndex;
};


/*
 *------------------------------------------------------------------------------
 *
 * _skipBytes
 *
 *    Drops 'nr' bytes from the front of the receive buffer.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Advances receive buffer.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._skipBytes = function (nr) {
   "use strict";
   this._receiveQueueIndex += nr;
};


/*
 *------------------------------------------------------------------------------
 *
 * _readString
 *
 *    Pops the first 'stringLength' bytes from the front of the read buffer.
 *
 * Results:
 *    An array of 'stringLength' bytes.
 *
 * Side Effects:
 *    Advances receive buffer.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readString = function (stringLength) {
   "use strict";

   var string = this._receiveQueue.slice(this._receiveQueueIndex,
                                         this._receiveQueueIndex + stringLength);
   this._receiveQueueIndex += stringLength;
   return string;
};




/*
 *------------------------------------------------------------------------------
 *
 * _readStringUTF8
 *
 *    Pops the first 'stringLength' bytes from the front of the read buffer
 *    and parses the string for unicode. If it finds unicode, it converts them
 *    to unicode and returns the unicode string.
 *
 * Results:
 *    A unicode string thats as long as 'stringLength' in case of non-unicodes
 *    or shorter.
 *
 * Side Effects:
 *    Advances receive buffer.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readStringUTF8 = function (stringLength) {
   "use strict";

   var c, c1, c2, c3, valArray = [],
       i = this._receiveQueueIndex;
   while (i < this._receiveQueueIndex + stringLength) {
      c = this._receiveQueue.charCodeAt(i);
      if (c < 128) {
          // Handle non-unicode string here.
          valArray.push(c);
          i++;
      } else if (c < 224) {
         c1 = this._receiveQueue.charCodeAt(i+1) & 63;
         valArray.push(((c & 31) << 6) | c1);
         i += 2;
      } else if (c < 240) {
         c1 = this._receiveQueue.charCodeAt(i+1) & 63;
         c2 = this._receiveQueue.charCodeAt(i+2) & 63;
         valArray.push(((c & 15) << 12) | (c1 << 6) | c2);
         i += 3;
      } else {
         c1 = this._receiveQueue.charCodeAt(i+1) & 63;
         c2 = this._receiveQueue.charCodeAt(i+2) & 63;
         c3 = this._receiveQueue.charCodeAt(i+3) & 63;
         valArray.push(((c & 7) << 18) | (c1 << 12) | (c2 << 6) | c3);
         i += 4;
      }
   }

   this._receiveQueueIndex += stringLength;
   // WMKS.LOGGER.warn(valArray + ' :arr, str: ' + String.fromCharCode.apply(String, valArray));
   // Apply all at once is faster: http://jsperf.com/string-fromcharcode-apply-vs-for-loop
   return String.fromCharCode.apply(String, valArray);
};


/*
 *------------------------------------------------------------------------------
 *
 * _readByte
 *
 *    Pops the first byte from the front of the receive buffer.
 *
 * Results:
 *    First byte of the receive buffer.
 *
 * Side Effects:
 *    Advances receive buffer.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readByte = function () {
   "use strict";

   var aByte = this._receiveQueue.charCodeAt(this._receiveQueueIndex);
   this._receiveQueueIndex += 1;
   return aByte;
};


/*
 *------------------------------------------------------------------------------
 *
 * _readInt16
 *
 *    Pops the first two bytes from the front of the receive buffer.
 *
 * Results:
 *    First two bytes of the receive buffer.
 *
 * Side Effects:
 *    Advances receive buffer.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readInt16 = function () {
   "use strict";

   return ((this._readByte() << 8) +
           (this._readByte()));
};


/*
 *------------------------------------------------------------------------------
 *
 * _readInt32
 *
 *    Pops the first four bytes from the front of the receive buffer.
 *
 * Results:
 *    First four bytes of the receive buffer.
 *
 * Side Effects:
 *    Advances receive buffer.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readInt32 = function () {
   "use strict";

   return ((this._readByte() << 24) +
           (this._readByte() << 16) +
           (this._readByte() <<  8) +
           (this._readByte()));
};


/*
 *------------------------------------------------------------------------------
 *
 * _readBytes
 *
 *    Pops the first 'length' bytes from the front of the receive buffer.
 *
 * Results:
 *    Array of 'length' bytes.
 *
 * Side Effects:
 *    Advances receive buffer.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readBytes = function (length) {
   "use strict";
   var result, i;

   result = new Array(length);

   for (i = 0; i < length; i++) {
      result[i] = this._receiveQueue.charCodeAt(i + this._receiveQueueIndex);
   }

   this._receiveQueueIndex += length;
   return result;
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendString
 *
 *    Sends a string to the server, using the appropriate encoding.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendString = function (stringValue) {
   "use strict";
   this._sendBytes(arrayFromString(stringValue));
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendBytes
 *
 *    Sends the array 'bytes' of data bytes to the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendBytes = function (bytes) {
   "use strict";
   var msg = new ArrayBuffer(bytes.length);
   var uint8View = new Uint8Array(msg);
   var i;
   for (i = 0; i < bytes.length; i++) {
         uint8View[i] = bytes[i];
   }
   this._websocket.send(msg);
   
};





/*
 *
 * Parser / queue bridge helpers
 *
 */

WMKS.VNCDecoder.prototype._setReadCB = function(bytes, nextFn, nextArg) {
   this.nextBytes = bytes;
   this.nextFn = nextFn;
   this.nextArg = nextArg;
};


/*
 *
 * Client message sending
 *
 */


/*
 *------------------------------------------------------------------------------
 *
 * _sendMouseEvent
 *
 *    Sends the current absolute mouse state to the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendMouseEvent = function () {
   var arr = [];
   arr.push8(this.msgPointerEvent);
   arr.push8(this._mouseButtonMask);
   arr.push16(this._mouseX);
   arr.push16(this._mouseY);
   this._sendBytes(arr);
   this._mouseActive = false;
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendResolutionRequest
 *
 *    Sends the most recently requested resolution to the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendResolutionRequest = function () {
   var arr = [];
   arr.push8(this.msgVMWClientMessage);
   arr.push8(5);       // Resolution request 2 message sub-type
   arr.push16(8);      // Length
   arr.push16(this.requestedWidth);
   arr.push16(this.requestedHeight);
   this._sendBytes(arr);
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendClientEncodingsMsg
 *
 *    Sends the server a list of supported image encodings.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendClientEncodingsMsg = function () {
   var i;
   var encodings = [/* this.encTightDiffComp, */
                    this.encTightPNG,
                    this.encDesktopSize,
                    this.encVMWDefineCursor,
                    this.encVMWCursorState,
                    this.encVMWCursorPosition,
                    this.encVMWTypematicInfo,
                    this.encVMWLEDState,
                    this.encVMWServerPush2,
                    this.encVMWServerCaps,
                    this.encTightJpegQuality10,
                    this.encVMWFrameStamp];

   /*
    * Hopefully the server isn't silly enough to accept uint8utf8 if
    * it's unable to emit TightPNGBase64.  The two really need to be
    * used together.  Client-side we can avoid advertising
    * TightPNGBase64 when we know it will lead to
    * double-base64-encoding.
    */
   if (this._websocket.protocol === "uint8utf8") {
      encodings = [this.encTightPNGBase64].concat(encodings);
   }

   if (this._canvas[1]) {
      encodings = [this.encOffscreenCopyRect].concat(encodings);
   }

   /*
    * Blits seem to work well on most browsers now.
    */
   encodings = [this.encCopyRect].concat(encodings);

   var message = [];
   message.push8(this.msgClientEncodings);
   message.push8(0);
   message.push16(encodings.length);
   for (i = 0; i < encodings.length; i += 1) {
      message.push32(encodings[i]);
   }
   this._sendBytes(message);
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendFBUpdateRequestMsg
 *
 *    Sends the server a request for a new image, and whether
 *    the update is to be incremental.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendFBUpdateRequestMsg = function (incremental) {
   var message = [];
   message.push8(this.msgFBUpdateRequest);
   message.push8(incremental);
   message.push16(0);
   message.push16(0);
   message.push16(this._FBWidth);
   message.push16(this._FBHeight);
   this._sendBytes(message);
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendAck
 *
 *    Sends the server an acknowledgement of rendering the frame.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendAck = function(renderMilliseconds) {
   var updateReqId = this.updateReqId || 1;
   var msg;
   if (this.useVMWAck) {
      /*
       * Add one millisecond to account for the enforced sleep
       * between frames, and another as a bit of a swag.
       */
      var time = (renderMilliseconds + 2) * 10;
      var arr = [];
      arr.push8(this.msgVMWClientMessage);
      arr.push8(4);           // ACK message sub-type
      arr.push16(8);          // Length
      arr.push8(updateReqId); // update id
      arr.push8(0);           // padding
      arr.push16(time);       // render time in tenths of millis
      this._sendBytes(arr);
   } else {
      this._sendFBUpdateRequestMsg(updateReqId);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendAudioAck
 *
 *    Sends the server an acknowledgement of an audio packet.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendAudioAck = function(timestampLo, timestampHi) {
   if (this.useVMWAudioAck) {
      var arr = [];
      arr.push8(this.msgVMWClientMessage);
      arr.push8(this.msgVMWAudioAck);
      arr.push16(12); // length
      arr.push32(timestampLo);
      arr.push32(timestampHi);
      this._sendBytes(arr);
   }
};


/*
 *
 * Cursor updates
 *
 */


/*
 *------------------------------------------------------------------------------
 *
 * _changeCursor
 *
 *    Generates an array containing a Windows .cur file and loads it
 *    as the browser cursor to be used when hovering above the canvas.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Changes the cursor in the browser.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._changeCursor = function(pixels, mask, hotx, hoty, w, h) {
   var cursorData = [];

   var RGBImageDataSize = w * h * 4;   // 32 bits per pixel image data
   var maskSize = Math.ceil((w * h) / 8.0);  // 1 bit per pixel of mask data.

   var cursorDataSize = (RGBImageDataSize + 40 + /* Bitmap Info Header Size */
                         maskSize * 2);          /* 2 masks XOR & AND */

   /*
    * We need to build an array of bytes that looks like a Windows .cur:
    *   -> http://en.wikipedia.org/wiki/ICO_(file_format)
    *   -> http://en.wikipedia.org/wiki/BMP_file_format
    */
   cursorData.push16le(0);
   cursorData.push16le(2);     // .cur type
   cursorData.push16le(1);     // One image

   cursorData.push8(w);
   cursorData.push8(h);
   cursorData.push8(0);        // True Color cursor
   cursorData.push8(0);
   cursorData.push16le(hotx);  // Hotspot X location
   cursorData.push16le(hoty);  // Hostpot Y location

   // Total size of all image data including their headers (but
   // excluding this header).
   cursorData.push32le(cursorDataSize);

   // Offset (immediately past this header) to the BMP data
   cursorData.push32le(cursorData.length+4);

   // Bitmap Info Header
   cursorData.push32le(40);    // Bitmap Info Header size
   cursorData.push32le(w);
   cursorData.push32le(h*2);
   cursorData.push16le(1);
   cursorData.push16le(32);
   cursorData.push32le(0);     // Uncompressed Pixel Data
   cursorData.push32le(RGBImageDataSize  + (2 * maskSize));
   cursorData.push32le(0);
   cursorData.push32le(0);
   cursorData.push32le(0);
   cursorData.push32le(0);

   /*
    * Store the image data.
    * Note that the data is specified UPSIDE DOWN, like in a .bmp file.
    */
   for (y = h-1; y >= 0; y -= 1) {
      for (x = 0; x < w; x += 1) {
         /*
          * The mask is an array where each bit position indicates whether or
          * not the pixel is transparent. We need to convert that to an alpha
          * value for the pixel (clear or solid).
          */
         var arrayPos = y * Math.ceil(w/8) + Math.floor(x/8);
         var alpha = 0;
         if (mask.length > 0) {
            alpha = (mask[arrayPos] << (x % 8)) & 0x80 ? 0xff : 0;
         }

         arrayPos = ((w * y) + x) * 4;
         cursorData.push8(pixels[arrayPos]);
         cursorData.push8(pixels[arrayPos+1]);
         cursorData.push8(pixels[arrayPos+2]);
         if (mask.length > 0) {
            cursorData.push8(alpha);
         } else {
            cursorData.push8(pixels[arrayPos+3]);
         }
      }
   }

   /*
    * The XOR and AND masks need to be specified - but the data is unused
    * since the alpha channel of the cursor image is sufficient. So just
    * fill in a blank area for each.
    */
   for (y = 0; y < h; y += 1) {
      // The masks are single bit per pixel too
      for (x = 0; x < Math.ceil(w/8); x +=1) {
         cursorData.push8(0);
      }
   }

   for (y = 0; y < h; y += 1) {
      // The masks are single bit per pixel too
      for (x = 0; x < Math.ceil(w/8); x +=1) {
         cursorData.push8(0);
      }
   }

   var url = 'data:image/x-icon;base64,' + Base64.encodeFromArray(cursorData);
   this._currentCursorURI = 'url(' + url + ') ' + hotx + ' ' + hoty + ', default';
   this._setCanvasCursor(this._currentCursorURI);
};


/*
 *------------------------------------------------------------------------------
 *
 * _readOffscreenCopyRect
 *
 *    Parses payload of an offscreen copy rectangle packet.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readOffscreenCopyRect = function (rect) {
   rect.srcBuffer = this._readByte();
   rect.dstBuffer = this._readByte();
   rect.srcX = this._readInt16();
   rect.srcY = this._readInt16();
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readCursorData
 *
 *    Parses payload of a mouse cursor update.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Changes cursor.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readCursorData = function (rect) {
   var pixelslength = rect.w * rect.h * this._FBBytesPerPixel;
   var masklength = Math.floor((rect.w + 7) / 8) * rect.h;
   this._changeCursor(this._readBytes(pixelslength),
                      this._readBytes(masklength),
                      x, y, w, h);
};


/*
 *------------------------------------------------------------------------------
 *
 * _readCursor
 *
 *    Parses a mouse cursor update.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Changes the cursor in the browser.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readCursor = function (rect) {
   var w = rect.width;
   var h = rect.height;
   var pixelslength = rect.w * rect.h * this._FBBytesPerPixel;
   var masklength = Math.floor((rect.w + 7) / 8) * rect.h;
   read(pixelslength + masklength, _readCursorData, rect);
};


/*
 *------------------------------------------------------------------------------
 *
 * _readVMWDefineCursorData
 *
 *    Parses a VMware cursor definition payload.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Changes the cursor in the browser.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readVMWDefineCursorData = function (rect) {
   var y, x,
       andData = [], pixels = [], mask = [],
       hexMask, pixelIdx, maskIdx, channels;

   // If this is a color cursor
   if (rect.cursorType === 0) {
       if (rect.masklength > 0) {
          andData = this._readBytes(rect.masklength);
       }

       if (rect.pixelslength > 0) {
          pixels = this._readBytes(rect.pixelslength);
       }

      for (y = 0; y < rect.height; y++) {
         for (x = 0; x < rect.width; x++) {
            pixelIdx = x + y * rect.width;
            maskIdx = y * Math.ceil(rect.width / 8) + Math.floor(x / 8);
            // The mask is actually ordered 'backwards'
            hexMask = 1 << (7 - x % 8);

            // If the and mask is fully transparent
            if ((andData[pixelIdx * 4] === 255) &&
                (andData[pixelIdx * 4 + 1] === 255) &&
                (andData[pixelIdx * 4 + 2] === 255) &&
                (andData[pixelIdx * 4 + 3] === 255)) {
                // If the pixels at this point should be inverted then
                // make the image actually a simple black color.
                for (channel = 0; channel < 4; channel++) {
                   if (pixels[pixelIdx * 4 + channel] !== 0) {
                     pixels[pixelIdx * 4 + channel] = 0;
                     mask[maskIdx] |= hexMask;
                   }
                }
                // Otherwise leave the mask alone
            } else {
                mask[maskIdx] |= hexMask;
            }
         }
      }
   } else if (rect.cursorType === 1) {      // An Alpha Cursor
       if (rect.pixelslength > 0) {
          pixels = this._readBytes(rect.pixelslength);
       }
   }

   this._changeCursor(pixels, mask,
                      rect.x,
                      rect.y,
                      rect.width,
                      rect.height);
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readVMWDefineCursor
 *
 *    Parses a VMware cursor definition header.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readVMWDefineCursor = function (rect) {
   /*
    * Start with 2 bytes of type (and padding).
    */
   rect.cursorType = this._readByte();
   this._skipBytes(1);

   rect.pixelslength = 4 * rect.width * rect.height;

   if (rect.cursorType === 0) {
      rect.masklength = rect.pixelslength;
   } else {
      rect.masklength = 0;
   }

   this._setReadCB(rect.pixelslength + rect.masklength,
                   this._readVMWDefineCursorData, rect);
};


/*
 *------------------------------------------------------------------------------
 *
 * _setCanvasCursor
 *
 *    Set the cursor to a custom value, except on MSIE where it
 *    appears to be busted.  On MSIE, just retain the default cursor
 *    always - which is better than nothing. Apply only if cursor is different.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Changes the cursor in the browser.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._setCanvasCursor = function(str) {
   // At times, we get the same cursor image thats already used, ignore it.
   if (!WMKS.BROWSER.isIE() && this._canvas[0].style.cursor !== str) {
      this._canvas[0].style.cursor = str;
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _readVMWCursorState
 *
 *    Parses a VMware cursor state update (cursor visibility, etc.).
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Changes the cursor in the browser.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readVMWCursorState = function(rect) {
   var cursorState = this._readInt16();
   var visible = (cursorState & 0x01);
   this._setCanvasCursor(visible ? this._currentCursorURI : "none, !important");
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readVMWCursorPosition
 *
 *    Parses a VMware cursor position update.
 *    Ignores the payload as the client cursor cannot be moved in a browser.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readVMWCursorPosition = function (rect) {
   /*
    * We cannot warp or move the host/browser cursor
    */
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readTypematicInfo
 *
 *    Parses a typematic info update.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readTypematicInfo = function(rect) {
   this.typematicState = this._readInt16(),
   this.typematicPeriod = this._readInt32(),
   this.typematicDelay = this._readInt32();
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readLEDState
 *
 *    Parses an LED State update.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readLEDState = function(rect) {
   this._keyboardLEDs = this._readInt32();

   this.options.onKeyboardLEDsChanged(this._keyboardLEDs);

   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readFrameStamp
 *
 *    Parses a timestamp frame update.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readFrameStamp = function(rect) {
   this._frameTimestampLo = this._readInt32();
   this._frameTimestampHi = this._readInt32();
   this._nextRect();
};


/*
 *
 * Framebuffer updates
 *
 */


/*
 *------------------------------------------------------------------------------
 *
 * _fillRectWithColor
 *
 *    Fills a rectangular area in the canvas with a solid colour.
  *
 * Results:
 *    None.
 *
 * Side Effects:
 *    A coloured canvas.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._fillRectWithColor = function(canvas2dCtx, x, y,
                                                        width, height, color) {
   var newStyle;
   newStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
   canvas2dCtx.fillStyle = newStyle;
   canvas2dCtx.fillRect(x, y, width, height);
};


/*
 *------------------------------------------------------------------------------
 *
 * _blitImageString
 *
 *    Blits a serialised image (as a string) onto the canvas.
 *    Ignores the Alpha channel information and blits it opaquely.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    A coloured canvas.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._blitImageString = function(canvas2dCtx, x, y,
                                                      width, height, str) {
   var img, i, data;
   img = canvas2dCtx.createImageData(width, height);
   data = img.data;
   for (i=0; i < (width * height * 4); i=i+4) {
      data[i    ] = str.charCodeAt(i + 2);
      data[i + 1] = str.charCodeAt(i + 1);
      data[i + 2] = str.charCodeAt(i + 0);
      data[i + 3] = 255; // Set Alpha
   }
   canvas2dCtx.putImageData(img, x, y);
};


/*
 *------------------------------------------------------------------------------
 *
 * _copyRectGetPut
 * _copyRectDrawImage
 * _copyRectDrawImageTemp
 *
 *    Copy a rectangle from one canvas/context to another.  The
 *    canvas/contexts are indicated by an index into this._canvas[]
 *    array.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._copyRectGetPut = function (srcIndex,
                                                      srcX, srcY,
                                                      width, height,
                                                      dstIndex,
                                                      dstX, dstY) {
   var img;
   img = this._canvas[srcIndex].ctx.getImageData(srcX, srcY,
                                                 width, height);

   this._canvas[dstIndex].ctx.putImageData(img, dstX, dstY);
   delete img;
};


WMKS.VNCDecoder.prototype._copyRectDrawImage = function (srcIndex,
                                                         srcX, srcY,
                                                         width, height,
                                                         dstIndex,
                                                         dstX, dstY) {
   this._canvas[dstIndex].ctx.drawImage(this._canvas[srcIndex],
                                        srcX, srcY,
                                        width, height,
                                        dstX, dstY,
                                        width, height);
};


WMKS.VNCDecoder.prototype._copyRectDrawImageTemp = function (srcIndex,
                                                             srcX, srcY,
                                                             width, height,
                                                             dstIndex,
                                                             dstX, dstY) {
   this._copyRectDrawImage(srcIndex,
                           srcX, srcY,
                           width, height,
                           2,
                           srcX, srcY);

   this._copyRectDrawImage(2,
                           srcX, srcY,
                           width, height,
                           dstIndex,
                           dstX, dstY);
};


/*
 *------------------------------------------------------------------------------
 *
 * _flush
 *
 *    Make sure all rendering is complete on the given canvas
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._flush = function (dstIndex) {
   var img;
   img = this._canvas[dstIndex].ctx.getImageData(0, 0, 1,1);
   this._flushSink += img.data[0];
   delete img;
};


/*
 *------------------------------------------------------------------------------
 *
 * _decodeDiffComp
 *
 *    Decodes a diff-compressed jpeg string from the encoder.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._decodeDiffComp = function (data, oldData) {
   var l = data.length;
   var i = 0;
   var out = "";
   while (i < l) {
      switch(data.charCodeAt(i++)) {
      case this.diffCompCopyFromPrev:
         var nr = data.charCodeAt(i++);
         var pos = out.length;
         out = out.concat(oldData.slice(pos, pos+nr));
         break;
      case this.diffCompAppend:
         var nr = data.charCodeAt(i++);
         out = out.concat(data.slice(i, i+nr));
         i += nr;
         break;
      case this.diffCompAppendRemaining:
         out = out.concat(data.slice(i));
         i = l;
         break;
      }
   }
   return out;
};


/*
 *------------------------------------------------------------------------------
 *
 * _readTightData
 *
 *    Parses a compressed FB update payload.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readTightData = function (rect) {
   /*
    * Skip the preamble and read the actual JPEG data.
    */
   var data = this._readString(this.nextBytes);

   /*
    * Construct an Image and keep a reference to it in the
    * rectangle object. Since Images are loaded asynchronously
    * we can't draw it until the image has finished loading so
    * we don't call onDecodeComplete() until this has happened.
    */
   rect.image = this._imageManager.getImage();
   rect.image.onload = this.onDecodeComplete;
   rect.image.width = rect.width;
   rect.image.height = rect.height;
   rect.image.destX = rect.x;
   rect.image.destY = rect.y;

   if (rect.subEncoding === this.subEncDiffJpeg) {
      data = this._decodeDiffComp(data, this._lastJpegData);
   }

   if (rect.subEncoding !== this.subEncPNG) {
      this._lastJpegData = data;
   }

   if (rect.encoding !== this.encTightPNGBase64) {
      data = Base64.encodeFromString(data);
   }

   if (rect.subEncoding === this.subEncPNG) {
      rect.image.src = 'data:image/png;base64,' + data;
   } else {
      rect.image.src = 'data:image/jpeg;base64,' + data;
   }
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readTightPNG
 *
 *    Parses the head of a compressed FB update payload.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readTightPNG = function (rect) {

   rect.subEncoding = this._readByte();
   rect.subEncoding &= this.subEncMask;

   if (rect.subEncoding === this.subEncFill) {
      rect.color = [];
      rect.color[0] = this._readByte();
      rect.color[1] = this._readByte();
      rect.color[2] = this._readByte();
      rect.color[3] = 0xff;
      this.rectsDecoded++;
      this._nextRect();
   } else {
      var lengthSize = 1;
      var dataSize = this._readByte();
      if (dataSize & 0x80) {
         lengthSize = 2;
         dataSize &= ~0x80;
         dataSize += this._readByte() << 7;
         if (dataSize & 0x4000) {
            lengthSize = 3;
            dataSize &= ~0x4000;
            dataSize += this._readByte() << 14;
         }
      }

      this._setReadCB(dataSize, this._readTightData, rect);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _readCopyRect
 *
 *    Parses a CopyRect (blit) FB update.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readCopyRect = function (rect) {
   rect.srcX = this._readInt16();
   rect.srcY = this._readInt16();
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readRaw
 *
 *    Reads a raw rectangle payload.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readRaw = function (rect) {
   rect.imageString = this._readString(this.nextBytes);
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readDesktopSize
 *
 *    Parses a screen size update.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Calls the outer widget's onNewDesktopSize callback.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readDesktopSize = function (rect) {
   this._FBWidth = rect.width;
   this._FBHeight = rect.height;

   /*
    * Resize the canvas to the new framebuffer dimensions.
    */
   this.options.onNewDesktopSize(this._FBWidth, this._FBHeight);
   this._nextRect();
};


/*
 *------------------------------------------------------------------------------
 *
 * _readRect
 *
 *    Parses an FB update rectangle.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readRect = function() {
   var i = this.rectsRead;

   this.rect[i] = {};
   this.rect[i].x        = this._readInt16();
   this.rect[i].y        = this._readInt16();
   this.rect[i].width    = this._readInt16();
   this.rect[i].height   = this._readInt16();
   this.rect[i].encoding = this._readInt32();

   if (this.rect[i].encoding !== this.encTightPNGBase64 &&
       this.rect[i].encoding !== this.encTightPNG) {
      this.rectsDecoded++;
   }

   switch (this.rect[i].encoding) {
   case this.encRaw:
      this._setReadCB(this.rect[i].width *
                      this.rect[i].height *
                      this._FBBytesPerPixel,
                      this._readRaw, this.rect[i]);
      break;
   case this.encCopyRect:
      this._setReadCB(4, this._readCopyRect, this.rect[i]);
      break;
   case this.encOffscreenCopyRect:
      this._setReadCB(6, this._readOffscreenCopyRect, this.rect[i]);
      break;
   case this.encTightPNGBase64:
   case this.encTightPNG:
      this._setReadCB(4, this._readTightPNG, this.rect[i]);
      break;
   case this.encDesktopSize:
      this._readDesktopSize(this.rect[i]);
      break;
   case this.encVMWDefineCursor:
      this._setReadCB(2, this._readVMWDefineCursor, this.rect[i]);
      break;
   case this.encVMWCursorState:
      this._assumeServerIsVMware();
      this._setReadCB(2, this._readVMWCursorState, this.rect[i]);
      break;
   case this.encVMWCursorPosition:
      this._readVMWCursorPosition(this.rect[i]);
      break;
   case this.encVMWTypematicInfo:
      this._setReadCB(10, this._readTypematicInfo, this.rect[i]);
      break;
   case this.encVMWLEDState:
      this._setReadCB(4, this._readLEDState, this.rect[i]);
      break;
   case this.encVMWFrameStamp:
      this._setReadCB(8, this._readFrameStamp, this.rect[i]);
      break;
   default:
      return this.fail("Disconnected: unsupported encoding " +
                       this.rect[i].encoding);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _executeRectSingle
 *
 *    Execute the update command specified in a single rect.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Updates the canvas contents.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._executeRectSingle = function (rect) {
   var ctx = this._canvas[0].ctx;

   switch (rect.encoding) {
      case this.encRaw:
         this._blitImageString(ctx,
                               rect.x,
                               rect.y,
                               rect.width,
                               rect.height,
                               rect.imageString);
         rect.imageString = "";
         break;
      case this.encCopyRect:
         this._copyRectBlit(0,      // source index
                            rect.srcX,
                            rect.srcY,
                            rect.width,
                            rect.height,
                            0,      // dest index
                            rect.x,
                            rect.y);
         break;
      case this.encOffscreenCopyRect:
         this._copyRectOffscreenBlit(rect.srcBuffer,
                                     rect.srcX,
                                     rect.srcY,
                                     rect.width,
                                     rect.height,
                                     rect.dstBuffer,
                                     rect.x,
                                     rect.y);
         break;
      case this.encTightPNG:
      case this.encTightPNGBase64:
         if (rect.subEncoding === this.subEncFill) {
            this._fillRectWithColor(ctx,
                                    rect.x,
                                    rect.y,
                                    rect.width,
                                    rect.height,
                                    rect.color);
         } else {
            ctx.drawImage(rect.image,
                          rect.image.destX,
                          rect.image.destY);
            this._releaseImage(rect.image);
            rect.image = null;
         }
         break;
      case this.encDesktopSize:
      case this.encVMWDefineCursor:
      case this.encVMWCursorState:
      case this.encVMWCursorPosition:
         break;
      default:
         break;
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _executeRects
 *
 *    When this is called, all data for all rectangles is available
 *    and all JPEG images have been loaded. We can noe perform all
 *    drawing in a single step, in the correct order.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Updates the canvas contents.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._executeRects = function () {
   /*
    * When this is called, all data for all rectangles is
    * available and all JPEG images have been loaded.  We can
    * now perform all drawing in a single step, in the correct order.
    */
   var i;

   if (this._state !== this.FBU_DECODING_STATE) {
      return this.fail("wrong state: " + this._state);
   }

   if (this.rectsDecoded !== this.rects ||
      this.rectsRead !== this.rects) {
      return this.fail("messed up state");
   }

   var start = (new Date()).getTime();

   for (i = 0; i < this.rects; i++) {
      this._executeRectSingle(this.rect[i]);

      delete this.rect[i];
   }

   this._flush(0);

   var now = (new Date()).getTime();
   this._sendAck(now - start);

   this.rects = 0;
   this.rectsRead = 0;
   this.rectsDecoded = 0;
   this.updateReqId = 0;

   if (this._receivedFirstUpdate === false) {
    this.options.onConnected();
    this._receivedFirstUpdate = true;
   }


   var self = this;
   this._state = this.FBU_RESTING_STATE;
   this._getNextServerMessage();


   /*
    * Resting like this is a slight drain on performance,
    * especially at higher framerates.
    *
    * If the client could just hit 50fps without resting (20
    * ms/frame), it will now manage only 47.6fps (21 ms/frame).
    *
    * At lower framerates the difference is proportionately
    * less, eg 20fps->19.6fps.
    *
    * It is however necessary to do something like this to
    * trigger the screen update, as the canvas double buffering
    * seems to use idleness as a trigger for swapbuffers.
    */

   this._msgTimer = setTimeout(this.msgTimeout, 1 /* milliseconds */);
};


/*
 *------------------------------------------------------------------------------
 *
 * _nextRect
 *
 *    Configures parser to process next FB update rectangle,
 *    or progresses to rendering.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._nextRect = function() {
   this.rectsRead++;
   if (this.rectsRead < this.rects) {
      this._setReadCB(12, this._readRect);
   } else {
      this._state = this.FBU_DECODING_STATE;
      if (this.rectsDecoded === this.rects) {
         this._executeRects();
      }
   }
};





/*
 *
 * Server message handling
 *
 */


/*
 *------------------------------------------------------------------------------
 *
 * _gobble
 *
 *    Throws away a sequence of bytes and calls next().
 *    Like _skipBytes(), but usable with _setReadCB().
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Skips a message chunk.
 *    Calls a dynamic callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._gobble = function (next) {
   this._skipBytes(this.nextBytes);
   next();
};


/*
 *------------------------------------------------------------------------------
 *
 * _getNextServerMessage
 *
 *    Sets up parser to expect the head of a new message from the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._getNextServerMessage = function () {
   this._setReadCB(1, this._handleServerMsg);
};



/*
 *------------------------------------------------------------------------------
 *
 * _framebufferUpdate
 *
 *    Parses header of new image being received.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Resets FB update parser.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._framebufferUpdate = function () {
   this.updateReqId = this._readByte();
   this.rects = this._readInt16();
   this.rectsRead = 0;
   this.rectsDecoded = 0;
   this._setReadCB(12, this._readRect);
};



/*
 *------------------------------------------------------------------------------
 *
 * _handleServerInitializedMsg
 *
 *    Callback to handle VNC server init'd message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets various instance-wide config vars that describe the connection.
 *    Processes the message.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleServerInitializedMsg = function () {
   var self = this;

   /*
    * Screen size
    */
   this._FBWidth  = this._readInt16();
   this._FBHeight = this._readInt16();

   /*
    * PIXEL_FORMAT
    * We really only need the depth/bpp and endian flag.
    */
   var bpp           = this._readByte();
   var depth         = this._readByte();
   var bigEndian     = this._readByte();
   var trueColor     = this._readByte();

   WMKS.LOGGER.log('Screen: ' + this._FBWidth + ' x ' + this._FBHeight +
                   ', bits-per-pixel: ' + bpp + ', depth: ' + depth +
                   ', big-endian-flag: ' + bigEndian +
                   ', true-color-flag: ' + trueColor);

   /*
    * Skip the 'color'-max values.
    */
   this._skipBytes(6);

   var redShift = this._readByte();
   var greenShift = this._readByte();
   var blueShift = this._readByte();

   WMKS.LOGGER.debug('red shift: ' + redShift +
                     ', green shift: ' + greenShift +
                     ', blue shift: ' + blueShift);

   /*
    * Skip the 3 bytes of padding
    */
   this._skipBytes(3);

   /*
    * Read the connection name.
    */
   var nameLength   = this._readInt32();

   this.options.onNewDesktopSize(this._FBWidth, this._FBHeight);

   /*
    * After measuring on many browsers, these appear to be universal
    * best choices for blits and offscreen blits respectively.
    */
   this._copyRectBlit = this._copyRectDrawImageTemp;
   this._copyRectOffscreenBlit = this._copyRectDrawImage;

   // keyboard.grab();

   if (trueColor) {
      this._FBBytesPerPixel = 4;
      this._FBDepth        = 3;
   } else {
      return this.fail('no colormap support');
   }

   var getFBName = function () {
      self._FBName = self._readString(nameLength);

      self._sendClientEncodingsMsg();
      self._sendFBUpdateRequestMsg(0);

      WMKS.LOGGER.log('Connected ' +
                      (self._encrypted? '(encrypted)' : '(unencrypted)') +
                      ' to: ' + self._FBName);

      self._serverInitialized = true;
      self._getNextServerMessage();
   };

   this._setReadCB(nameLength, getFBName);
};


/*
 *------------------------------------------------------------------------------
 *
 * _readServerInitializedMsg
 *
 *    Abstraction to set the parser to read a ServerInitializedMsg.
 *    This is used in both _handleSecurityResultMsg() and connect().
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._readServerInitializedMsg = function() {
   this._setReadCB(24, this._handleServerInitializedMsg);
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleSecurityResultMsg
 *
 *    Callback to handle VNC security result message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Processes the message.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleSecurityResultMsg = function () {
   var self = this;
   var reasonLength;
   var handleReason = function() {
      var reason = self._readString(reasonLength);
      self.options.onAuthenticationFailed();
      return self.fail(reason);
   };

   var handleReasonLength = function() {
      reasonLength = self._readInt32();
      self._setReadCB(reasonLength, handleReason);
   };


   switch (this._readInt32()) {
      case 0:  // OK
         /*
          * Send '1' to indicate the the host should try to
          * share the desktop with others.  This is currently
          * ignored by our server.
          */
         this._sendBytes([1]);
         this._readServerInitializedMsg();
         return;
      case 1:  // failed
         this._setReadCB(4, handleReasonLength);
         return;
      case 2:  // too-many
         this.options.onAuthenticationFailed();
         return this.fail("Too many auth attempts");
      default:
         return this.fail("Bogus security result");
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleSecurityMsg
 *
 *    Callback to handle VNC security message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Processes the message.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleSecurityMsg = function () {
   var authenticationScheme = 0;
   var numTypes;
   var reasonLength;
   var self = this;

   var handleReason = function() {
      var reason = this._readString(reasonLength);
      self.options.onAuthenticationFailed();
      return self.fail(reason);
   };

   var handleReasonLength = function() {
      reasonLength = self._readInt32();
      self._setReadCB(reasonLength, handleReason);
   };

   var handleSecurityTypes = function() {
      var securityTypes = self._readBytes(numTypes);
      WMKS.LOGGER.log("Server security types: " + securityTypes);
      for (i=0; i < securityTypes.length; i+=1) {
         if (securityTypes && (securityTypes[i] < 3)) {
            authenticationScheme = securityTypes[i];
         }
      }
      if (authenticationScheme === 0) {
         return self.fail("Unsupported security types: " + securityTypes);
      }
      self._sendBytes([authenticationScheme]);
      WMKS.LOGGER.log('Using authentication scheme: ' + authenticationScheme);
      if (authenticationScheme === 1) {
         // No authentication required - just handle the result state.
         self._setReadCB(4, self._handleSecurityResultMsg);
      } else {
         return self.fail("vnc authentication not implemented");
      }
   };

   numTypes = this._readByte();
   if (numTypes === 0) {
      this._setReadCB(4, handleReasonLength);
   } else {
      this._setReadCB(numTypes, handleSecurityTypes);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleProtocolVersionMsg
 *
 *    Callback to handle VNC handshake message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends own ID string back.
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleProtocolVersionMsg = function () {
   var serverVersionPacket = this._readString(12);
   if (serverVersionPacket !== "RFB 003.008\n") {
      return this.fail("Invalid Version packet: " + serverVersionPacket);
   }
   this._sendString("RFB 003.008\n");
   this._setReadCB(1, this._handleSecurityMsg);
};


/*
 *------------------------------------------------------------------------------
 *
 * _sendClientCaps
 *
 *    Send our VNCVMW client caps to the server.
 *    Right now the only one we send is VNCVMW_CLIENTCAP_HEARTBEAT (0x100).
 *
 * Results:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._sendClientCaps = function() {
   if (this._serverInitialized) {
      var arr = [];
      var caps = (this.clientCapHeartbeat |
                  this.clientCapAudioAck);
      if (this.options.enableVorbisAudioClips) {
        caps |= this.clientCapVorbisAudioClips;
      } else if (this.options.enableOpusAudioClips) {
        caps |= this.clientCapOpusAudioClips;
      } else if (this.options.enableAacAudioClips) {
        caps |= this.clientCapAacAudioClips;
      }
      arr.push8(this.msgVMWClientMessage);
      arr.push8(3);                        // Client caps message sub-type
      arr.push16(8);                       // Length
      arr.push32(caps);                    // Capability mask
      this._sendBytes(arr);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleServerCapsMsg
 *
 *    Parses a VNC VMW server caps message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Might request a change to the client resolution.
 *    Will trigger the sending of our client capabilities.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleServerCapsMsg = function () {
   var caps = this._readInt32();
   this.useVMWKeyEvent = !!(caps & this.serverCapKeyEvent);
   /*
    * serverCapKeyEvent2Unicode, serverCapKeyEvent2JSKeyCode indicates that
    * unicode and raw JS keyCode inputs are handled by the server and
    * options.useUnicodeKeyboardInput indicates that the client
    * should use unicode if possible. The flag allowVMWKeyEventUnicode is set
    * when the above 3 value are true.
    */
   this.allowVMWKeyEvent2UnicodeAndRaw =
      this.options.useUnicodeKeyboardInput &&
      !!(caps & this.serverCapKeyEvent2Unicode) &&
      !!(caps & this.serverCapKeyEvent2JSKeyCode);

   this.useVMWAck      = !!(caps & this.serverCapUpdateAck);
   this.useVMWRequestResolution = !!(caps & this.serverCapRequestResolution);
   this.useVMWAudioAck = !!(caps & this.serverCapAudioAck);

   /*
    * If we have already been asked to send a resolution request
    * to the server, this is the point at which it becomes legal
    * to do so.
    */
   if (this.useVMWRequestResolution &&
      this.requestedWidth > 0 &&
      this.requestedHeight > 0) {
      this.onRequestResolution(this.requestedWidth,
                               this.requestedHeight);
   }

   if (caps & this.serverCapClientCaps) {
      this._sendClientCaps();
   }

   this._getNextServerMessage();
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleServerHeartbeatMsg
 *
 *    Parses a VNC VMW server heartbeat message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Calls the user-provided callback for heartbeat events.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleServerHeartbeatMsg = function () {
   var interval = this._readInt16();
   this.options.onHeartbeat(interval);
   this._getNextServerMessage();
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleServerAudioMsg
 *
 *    Parses a VNC VMW server audio message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Reads the audio data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleServerAudioMsg = function () {
   var length = this._readInt32();
   var sampleRate = this._readInt32();
   var numChannels = this._readInt32();
   var sampleSize = this._readInt32();
   var containerSize = this._readInt32();
   var timestampL = this._readInt32();
   var timestampH = this._readInt32();
   var flags = this._readInt32();

   var audioInfo = {sampleRate: sampleRate,
                    numChannels: numChannels,
                    containerSize: containerSize,
                    sampleSize: sampleSize,
                    length: length,
                    audioTimestampLo: timestampL,
                    audioTimestampHi: timestampH,
                    frameTimestampLo: this._frameTimestampLo,
                    frameTimestampHi: this._frameTimestampHi,
                    flags: flags,
                    data: null};

   this._setReadCB(length, this._handleServerAudioMsgData, audioInfo);
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleServerAudioMsgData
 *
 *    Reads VNC VMW audio data.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Calls the user-provided callback for audio events.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleServerAudioMsgData = function (audioInfo) {
   audioInfo.data = this._readBytes(audioInfo.length);
   if (audioInfo.flags & this.audioflagRequestAck) {
      this._sendAudioAck(audioInfo.audioTimestampLo,
                         audioInfo.audioTimestampHi);
   }
   this.options.onAudio(audioInfo);
   this._getNextServerMessage();
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleServerCutText
 *
 *    Parses a server cut text message.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Calls the user-provided callback for cut text (copy) events.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleServerCutText = function (length) {
   var txt = this._readStringUTF8(length);
   this.options.onCopy(txt);
   this._getNextServerMessage();
};


/*
 *------------------------------------------------------------------------------
 *
 * _handleServerMsg
 *
 *    Parses a VNC message header and dispatches it to the correct callback.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Parses first byte of a message (type ID).
 *    Sets next parser callback.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._handleServerMsg = function () {
   var length, c, red, green, blue;
   var self = this;
   var msgType = this._readByte();

   switch (msgType) {
   case this.msgFramebufferUpdate:
      this._setReadCB(3, this._framebufferUpdate);
      break;
   case this.msgSetColorMapEntries:
      var getNumColors = function () {
         self._skipBytes(3);
         var numColours = self._readInt16();
         // XXX: just ignoring incoming colors
         self._setReadCB(6 * numColors, self._gobble, self._getNextServerMessage);
      };
      this._setReadCB(5, getNumColors);
      break;
   case this.msgRingBell:
      this._getNextServerMessage();
      break;
   case this.msgServerCutText:
      var getServerCutTextHead = function () {
         self._readBytes(3);  // Padding
         length = self._readInt32();
         if (length > 0) {
            self._setReadCB(length, self._handleServerCutText, length);
         } else {
            self._getNextServerMessage();
         }
      };

      this._setReadCB(8, getServerCutTextHead);
      break;
   case this.msgVMWSrvMessage:
      var getVMWSrvMsgHead = function () {
         var id = self._readByte();
         var len = self._readInt16();

         // VMWServerCaps
         if (id === this.msgVMWSrvMessage_ServerCaps) {
            if (len !== 8) {
               self.options.onProtocolError();
               return self.fail('invalid length message for id: ' + id + ', len: ' + len);
            }
            self._setReadCB(len - 4, self._handleServerCapsMsg);

         // VMWHeartbeat
         } else if (id === this.msgVMWSrvMessage_Heartbeat) {
            if (len !== 6) {
               self.options.onProtocolError();
               return self.fail('invalid length message for id: ' + id + ', len: ' + len);
            }
            self._setReadCB(len - 4, self._handleServerHeartbeatMsg);

        // VMWAudio
        } else if (id === this.msgVMWSrvMessage_Audio) {
            if (len !== 36) {
               self.options.onProtocolError();
               return self.fail('invalid length message for id: ' + id + ', len: ' + len);
            }
            self._setReadCB(len - 4, self._handleServerAudioMsg);

         // Unhandled message type -- just gobble it and move on.
         } else {
            var bytesLeft = len - 4;
            if (bytesLeft === 0) {
               self._getNextServerMessage();
            } else {
               self._setReadCB(bytesLeft, self._gobble, self._getNextServerMessage);
            }
         }
      };

      this._setReadCB(3, getVMWSrvMsgHead);
      break;

   default:
      this.options.onProtocolError();
      return this.fail('Disconnected: illegal server message type ' + msgType);
   }

};



/*
 *------------------------------------------------------------------------------
 *
 * _processMessages
 *
 *    VNC message loop.
 *    Dispatches data to the specified callback(s) until nothing is left.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Calls dynamically specified callbacks.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype._processMessages = function () {
   while (this._state === this.VNC_ACTIVE_STATE &&
         this._receiveQueueBytesUnread() >= this.nextBytes) {
      var nrBytes = this.nextBytes;
      var before = this._receiveQueueBytesUnread();
      this.nextFn(this.nextArg);
      var after = this._receiveQueueBytesUnread();
      if (nrBytes < before - after) {
         return this.fail("decode overrun " + nrBytes + " vs " +
                          (before - after));
      }
   }
};





/** @public */

/*
 *
 * Event handlers called from the UI
 *
 */


/*
 *------------------------------------------------------------------------------
 *
 * onMouseMove
 *
 *    Updates absolute mouse state internally and on the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.onMouseMove = function (x, y) {
   this._mouseX = x;
   this._mouseY = y;

   if (this._serverInitialized) {
      this._mouseActive = true;
      if (this._mouseTimer === null) {
         this._sendMouseEvent();
         this._mouseTimer = setTimeout(this.mouseTimeout,
                                       this.mouseTimeResolution);
      }
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * onMouseButton
 *
 *    Updates absolute mouse state internally and on the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.onMouseButton = function (x, y, down, bmask) {
   this._mouseX = x;
   this._mouseY = y;
   if (down) {
      this._mouseButtonMask |= bmask;
   } else {
      this._mouseButtonMask &= ~bmask;
   }
   if (this._serverInitialized) {
      this._mouseActive = true;
      this._sendMouseEvent();
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * onKeyVScan
 *
 *    Sends a VMware VScancode key event to the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.onKeyVScan = function (keysym, down) {
   if (this._serverInitialized) {
      var arr = [];
      arr.push8(this.msgVMWClientMessage);
      arr.push8(this.msgVMWKeyEvent);   // Key message sub-type
      arr.push16(8);  // Length
      arr.push16(keysym);
      arr.push8(down);
      arr.push8(0);   /// padding
      this._sendBytes(arr);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * onVMWKeyUnicode
 *
 *    Sends the keycode to the server as is from the browser.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.onVMWKeyUnicode = function (key, down, raw) {
   if (this._serverInitialized) {
      var arr = [];
      arr.push8(this.msgVMWClientMessage);
      arr.push8(this.msgVMWKeyEvent2);    // VMW unicode key message sub-type
      arr.push16(10);   // length
      arr.push32(key);
      arr.push8(down);
      arr.push8(raw);
      this._sendBytes(arr);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * onMouseWheel
 *
 *    Sends a VMware mouse wheel event to the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.onMouseWheel = function(x, y, dx, dy) {
   if (this._serverInitialized) {
      var arr = [];
      arr.push8(this.msgVMWClientMessage);
      arr.push8(this.msgVMWPointerEvent2);    // Pointer event 2 message sub-type
      arr.push16(19);  // Length
      arr.push8(1);    // isAbsolute
      arr.push32(x);
      arr.push32(y);
      arr.push32(0);
      arr.push8(dy);
      arr.push8(dx);
      this._sendBytes(arr);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * onRequestResolution
 *
 *    Schedules a rate-limited VMware resolution request from client
 *    to server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.onRequestResolution = function(width, height) {
   this.requestedWidth = width;
   this.requestedHeight = height;

   if (this._serverInitialized &&
       this.useVMWRequestResolution &&
       (width !== this._FBWidth || height !== this._FBHeight)) {

      this.resolutionRequestActive = true;

      /*
       * Cancel any previous timeout and start the clock ticking
       * again.  This means that opaque window resizes will not
       * generate intermediate client->server messages, rather we will
       * wait until the user has stopped twiddling for half a second
       * or so & send a message then.
       */
      clearTimeout(this.resolutionTimer);
      this.resolutionTimer = setTimeout(this.resolutionTimeout,
                                        this.resolutionDelay);
   }
};


/*
 *
 * Connection handling
 *
 */


/*
 *------------------------------------------------------------------------------
 *
 * disconnect
 *
 *    Tears down the WebSocket and discards internal state.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    See above.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.disconnect = function () {
   "use strict";

   if (this._state !== this.DISCONNECTED) {
      this._state = this.DISCONNECTED;
      this._websocket.close();
      delete this._websocket;
      this._receiveQueue = "";
      this._receiveQueueIndex = 0;
      this.rects = 0;
      this._receivedFirstUpdate = false;
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * connect
 *
 *    Initialises the client and connects to the server.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Resets state and connects to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.connect = function (destinationUrl) {
   var self = this;

   this._state = this.VNC_ACTIVE_STATE;

   this.setRenderCanvas(this.options.canvas);

   /*
    * This closure is run whenever the handler indicates it's
    * completed its decoding pass. We use it to indicate to the
    * server that we've decoded this request if this is the last
    * rect in the update.
    */
   this.onDecodeComplete = function () {
      self.rectsDecoded++;
      if (self.rectsDecoded === self.rects && self.rectsRead === self.rects) {
         self._state = self.FBU_DECODING_STATE;
         self._executeRects();
      }
   };

   this.msgTimeout = function() {
      self._state = self.VNC_ACTIVE_STATE;
      self._processMessages();
   };

   this.mouseTimeout = function() {
      self._mouseTimer = null;
      if (self._mouseActive) {
         self._sendMouseEvent();
         self._mouseTimer = setTimeout(self.mouseTimeout, self.mouseTimeResolution);
      }
   };

   /*
    * Timer callback to limit the rate we send resolution-request
    * packets to the server.  No more than once a second is plenty.
    */
   this.resolutionTimeout = function() {
      if (self.resolutionRequestActive) {
         self._sendResolutionRequest();
         self.resolutionRequestActive = false;
      }
   };

   if (this.options.useVNCHandshake) {
      this._setReadCB(12, self._handleProtocolVersionMsg);
   } else {
      /*
       * On a standard MKS connection, we don't deal with the VNC handshake,
       * so skip it.
       */
      this._readServerInitializedMsg();
   }

   this._url = destinationUrl;
   this._receiveQueue = "";
   this._receiveQueueIndex = 0;

   this.wsOpen = function (evt) {
      self.options.onConnecting();
      this.binaryType = "arraybuffer";
      WMKS.LOGGER.log('WebSocket HAS binary support');
      WMKS.LOGGER.log('WebSocket created newAPI: ' + self.newAPI +
                      ' protocol: ', this.protocol);
   };

   this.wsClose = function (evt) {
      self.options.onDisconnected(evt.reason, evt.code);
   };

   this.wsMessage = function (evt) {
      if (self._receiveQueueIndex > self._receiveQueue.length) {
         return this.fail("overflow receiveQueue");
      } else if (self._receiveQueueIndex === self._receiveQueue.length) {
         self._receiveQueue = "";
         self._receiveQueueIndex = 0;
      } else if (self._recieveQueueIndex > self._receiveQueueSliceTrigger) {
         self._receiveQueue = self._receiveQueue.slice(self._receiveQueueIndex);
         self._receiveQueueIndex = 0;
      }

      if (typeof evt.data !== "string") {
         var data = new Uint8Array(evt.data);
         self._receiveQueue = self._receiveQueue.concat(stringFromArray(data));
      } else if (this.protocol === "base64") {
         var data = Base64.decodeToString(evt.data);
         self._receiveQueue = self._receiveQueue.concat(data);
      } else {
         self._receiveQueue = self._receiveQueue.concat(evt.data);
      }
      self._processMessages();
   };

   this.wsError = function (evt) {
      self.options.onError(evt);
   };

   this.wsHixieOpen = function (evt) {
      this.protocol = self.protocolGuess;
      this.onclose = self.wsClose;
      this.onopen = self.wsOpen;
      this.onopen(evt);
   };

   this.wsHixieNextProtocol = function (evt) {
      if (self.protocolList.length > 0) {
         self.protocolGuess = self.protocolList[0];
         self.protocolList = self.protocolList.slice(1);
         self._websocket = WMKS.WebSocket(self._url, self.protocolGuess);
         self._websocket.onopen = self.wsHixieOpen;
         self._websocket.onclose = self.wsHixieNextProtocol;
         self._websocket.onmessage = self.wsMessage;
         self._websocket.onerror = self.wsError;
      } else {
         self.wsClose(evt);
      }
   };

   /*
    * Note that the Hixie WebSockets (used in current Safari) do not
    * support passing multiple protocols to the server - at most a
    * single string is passed, and the server must accept that
    * protocol or fail the connection.  We would like to try uint8utf8
    * first but fall back to base64 if that is all that the server
    * supports.  This is easy with Hybi and newer APIs, but needs
    * extra code to work on Safari.
    */
   if (window.WebSocket.CLOSING) {
      this.newAPI = true;
   } else {
      this.newAPI = false;
   }

   if ($.browser.msie) {
      /*
       * IE9 doesn't like uint8utf8, haven't established why not.
       */
      this.protocolList = ["base64"];
   } else if (!(window.WebSocket.__flash) &&
              this.newAPI &&
              typeof(ArrayBuffer) !== undefined) {
      this.protocolList = ["binary", "uint8utf8", "base64"];
   } else {
      this.protocolList = ["uint8utf8", "base64"];
   }

   if (this.newAPI) {
      this._websocket = WMKS.WebSocket(this._url, this.protocolList);
      this._websocket.onopen = this.wsOpen;
      this._websocket.onclose = this.wsClose;
      this._websocket.onmessage = this.wsMessage;
      this._websocket.onerror = this.wsError;
   } else {
      this.wsHixieNextProtocol();
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * setRenderCanvas
 *
 *    Set the canvas that is used to render the image data. Used by the
 *    analyzer to redirect pixel data to a backbuffer.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    This canvas is also used as the source for blits, so it should be set
 *    early on and not modified externally afterwards.
 *
 *------------------------------------------------------------------------------
 */

WMKS.VNCDecoder.prototype.setRenderCanvas = function (rc) {
   this._canvas[0] = rc;
   this._canvas[0].ctx = rc.getContext('2d');

   if (!this._canvas[0].ctx.createImageData) {
      throw("no canvas imagedata support");
   }
};
// Use the following for js-lint.
/*global WMKS:false, $:false */

/*
 *------------------------------------------------------------------------------
 *
 * wmks/keyboardManager.js
 *
 *   WebMKS related keyboard management is handled here.
 *   There are 2 types of inputs that can be sent.
 *
 *   1. VMware VScanCodes that are handled by the hypervisor.
 *   2. KeyCodes + unicode based messages for Blast+NGP.
 *
 *   The message type to be sent is determined by flags in vncDecoder:
 *      useVMWKeyEvent            // VMware VScanCode key inputs are handled.
 *      useVMWKeyEventUnicode     // unicode key inputs are handled.
 *
 *   Input handling is quite different for desktop browsers with physical
 *   keyboard vs soft keyboards on touch devices. To deal with these we use
 *   separate event handlers for keyboard inputs.
 *
 *------------------------------------------------------------------------------
 */


/*
 * List of keyboard constants.
 */
WMKS.CONST.KB = {

   ControlKeys: [
   /*
    * backspace, tab, enter, shift, ctrl, alt, pause, caps lock, escape,
    * pgup, pgdown, end, home, left, up, right, down, insert, delete,
    * win-left(or meta on mac), win-right, menu-select(or meta-right), f1 - f12,
    * num-lock, scroll-lock
    */
      8, 9, 13, 16, 17, 18, 19, 20, 27,
      33, 34, 35, 36, 37, 38, 39, 40, 45, 46,
      91, 92, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
      144, 145
   ],

   // If you change this, change 'vals' in syncModifiers.
   Modifiers:        [16, 17, 18, 91],

   /*
    * List of characters to discard on an onKeyDown on Windows with Firefox
    * 192 = VK_OEM_3
    */
   Diacritics:       [192],

   KEY_CODE: {
      Shift:         16,
      Ctrl:          17,
      Alt:           18,
      Meta:          91,               // Mac left CMD key.
      Enter:         13,
      CapsLock:      20
   },

   BannedRawCodes:         [],         // Any raw key that needs to be ignored.

   SoftKBRawKeyCodes:      [8, 9, 13], // backspace, tab, newline
   keyInputDefaultValue:   ' '         // Default value for the input textbox.

};


WMKS.KeyboardManager = function(options) {
   'use strict';
   if (!options || !options.vncDecoder) {
      return null;
   }

   this._vncDecoder = options.vncDecoder;
   this.keyDownKeyTimer = null;
   this.pendingKey = null;
   this.activeModifiers = [];
   this.keyToUnicodeMap = {};
   this.keyToRawMap = {};

   /*
    *---------------------------------------------------------------------------
    *
    * _extractKeyCodeFromEvent
    *
    *    Attempts to extract the keycode from a given key{down,up} event.  The
    *    value extracted may be a unicode value instead of a normal vk keycode.
    *    If this is the case then the 'isUnicode' property will be set to true.
    *    Additionally, in the unicode case, the caller should not expect a
    *    corresponding keyPress event.
    *
    * Results:
    *    If extraction succeeds, returns an object with 'keyCode' and
    *    'isUnicode' properties, null otherwise.
    *
    *---------------------------------------------------------------------------
    */

   this._extractKeyCodeFromEvent = function(e) {
      var keyCode = 0, isUnicode = false;

      if (e.keyCode) {
         keyCode = e.keyCode;
      } else if (e.which) {
         keyCode = e.which;
      } else if (e.keyIdentifier && e.keyIdentifier.substring(0, 2) === 'U+') {
         /*
          * Safari doesn't give us a keycode nor a which value for some
          * keypresses. The only useful piece of a data is a Unicode codepoint
          * string (something of the form U+0000) found in the keyIdentifier
          * property. So fall back to parsing this string and sending the
          * converted integer to the agent as a unicode value.
          * See bugs 959274 and 959279.
          */
         keyCode = parseInt('0x' + e.keyIdentifier.slice(2), 16);
         if (keyCode) {
            isUnicode = true;
         } else {
            WMKS.LOGGER.log('assert: Unicode identifier=' + e.keyIdentifier
                          + ' int conversion failed, keyCode=' + keyCode);
            return null;
         }
      } else {
         WMKS.LOGGER.trace('assert: could not read keycode from event, '
                       + 'keyIdentifier=' + e.keyIdentifier);
         return null;
      }

      return {
         keyCode: keyCode,
         isUnicode: isUnicode
      };
   };


   /*
    *---------------------------------------------------------------------------
    *
    * onKeyDown
    *
    *    The first step in our input strategy. Capture a raw key. If it is a
    *    control key, send a keydown command immediately. If it is not, memorize
    *    it and return without doing anything. We pick it up in onKeyPress
    *    instead and bind the raw keycode to the Unicode result. Then, in
    *    onKeyUp, resolvethe binding and send the keyup for the Unicode key
    *    when the scancode is received.
    *
    * Results:
    *    true if the key is non-raw (let the event through, to allow keypress
    *    to be dispatched.) false otherwise.
    *
    *---------------------------------------------------------------------------
    */

   this.onKeyDown = function(e) {
      var keyCodeRes,
          keyCode = 0,
          isUnicode = false,
          self = this;

      keyCodeRes = this._extractKeyCodeFromEvent(e);
      if (!keyCodeRes) {
         WMKS.LOGGER.log('Extraction of keyCode from keyUp event failed.');
         return false; // don't send a malformed command.
      }
      keyCode = keyCodeRes.keyCode;
      isUnicode = keyCodeRes.isUnicode;

      // Sync modifiers because we don't always get correct events.
      this._syncModifiers(e);

      /*
       * Most control characters are 'dangerous' if forwarded to the underlying
       * input mechanism, so send the keys immediately without waiting for
       * keypress.
       */
      if ($.inArray(keyCode, WMKS.CONST.KB.Modifiers) !== -1) {
         // Handled above via syncModifiers
         e.returnValue = false;
         return false;
      }

      if (WMKS.CONST.KB.ControlKeys.indexOf(keyCode) !== -1) {
         e.returnValue = false;
         return this._handleControlKeys(keyCode);
      }

      // Workaround for Windows + Firefox + diacritics
      if (WMKS.BROWSER.isWindows() && WMKS.BROWSER.isGecko() &&
         WMKS.CONST.KB.Diacritics.indexOf(keyCode) !== -1) {
         WMKS.LOGGER.log('Dropping diacritic junk char: ' + keyCode);
         e.returnValue = false;
         return false;
      }

      /*
       * Send the keydown event right now if we were given a unicode codepoint
       * in the keyIdentifier field of the event.  There won't be a
       * corresponding key press event so we can confidently send it right now.
       */
      if (isUnicode) {
         WMKS.LOGGER.log('Send unicode down from keyIdentifier: ' + keyCode);
         self.sendKey(keyCode, false, true);
         e.returnValue = false;
         return false;
      }

      /*
       * Expect a keypress before control is returned to the main JavaScript.
       * The setTimeout(..., 0) is a failsafe that will activate only if the
       * main JavaScript loop is reached. When the failsafe activates, send
       * the raw key and hope it works.
       */
      if (this.keyDownKeyTimer !== null) {
         WMKS.LOGGER.log('assert: nuking an existing keyDownKeyTimer');
         clearTimeout(this.keyDownKeyTimer);
      }

      this.keyDownKeyTimer = setTimeout(function() {
         // WMKS.LOGGER.log('timeout, sending raw keyCode=' + keyCode);
         self.sendKey(keyCode, false, false);
         self.keyDownKeyTimer = null;
         self.pendingKey = null;
      }, 0);
      this.pendingKey = keyCode;

      /*
       * If Alt or Ctrl (by themselves) are held, inhibit the keypress by
       * returning false.
       * This prevents the browser from handling the keyboard shortcut
       */
      e.returnValue = !(this.activeModifiers.length === 1 &&
         (this.activeModifiers[0] === WMKS.CONST.KB.KEY_CODE.Alt ||
         this.activeModifiers[0] === WMKS.CONST.KB.KEY_CODE.Ctrl));
      return e.returnValue;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _handleControlKeys
    *
    *    This function takes care of the control keys and handling these.
    *
    *---------------------------------------------------------------------------
    */

   this._handleControlKeys = function(keyCode) {
      // var isCapsOn = this._vncDecoder._keyboardLEDs & 4;
      // WMKS.LOGGER.log('Led: ' + led + ', Caps: ' + isCapsOn);

      /*
       * Caps lock is an unusual key and generates a 'down' when the
       * caps lock light is going from off -> on, and then an 'up'
       * when the caps lock light is going from on -> off. The problem
       * is compounded by a lack of information between the guest & VMX
       * as to the state of caps lock light. So the best we can do right
       * now is to always send a 'down' for the Caps Lock key to try and
       * toggle the caps lock state in the guest.
       */
      if (keyCode === WMKS.CONST.KB.KEY_CODE.CapsLock && WMKS.BROWSER.isMacOS()) {
         // TODO: Confirm if this works.
         this.sendKey(keyCode, false, false);
         this.sendKey(keyCode, true, false);
         return;
      }
      this.sendKey(keyCode, false, false);
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _syncModifiers
    *
    *    Parse the altKey, shiftKey, metaKey and ctrlKey attributes of an event
    *     to synthesize event keystrokes. The keydown and keyup events are not
    *    reliably sent by all browsers but these attributes are always set,
    *    so key off of these to send keydown and keyup events for those keys.
    *
    *---------------------------------------------------------------------------
    */

   this._syncModifiers = function(e) {
      var thisMod, thisVal, i, idx;
      // This must be in the order of WMKS.CONST.KB.Modifiers
      var vals = [e.shiftKey, e.ctrlKey, e.altKey, e.metaKey];
      // var names = ['shift', 'ctrl', 'alt', 'meta']; // used with logging.

      // Do check for AltGr and set ctrl and alt if set
      if (e.altGraphKey === true) {
         vals[1] = vals[2] = true;
      }

      for (i = 0; i < WMKS.CONST.KB.Modifiers.length; i++) {
         thisMod = WMKS.CONST.KB.Modifiers[i];
         thisVal = vals[i];

         idx = this.activeModifiers.indexOf(thisMod);
         if (thisVal && idx === -1) {
            //WMKS.LOGGER.log(names[i] + ' down');
            this.activeModifiers.push(thisMod);
            this.sendKey(thisMod, false, false);
         } else if (!thisVal && idx !== -1) {
            //WMKS.LOGGER.log(names[i] + ' up');
            this.activeModifiers.splice(idx, 1);
            this.sendKey(thisMod, true, false);
         }
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * cancelModifiers
    *
    *    Clear all modifiers currently in a 'keydown' state. Used as a cleanup
    *    for onBlur or to clear the modifier state upon close of the
    *    extendedKeypad widget.
    *
    *    applyToSoftKB - When set and is a touch device, perform this action.
    *
    *---------------------------------------------------------------------------
    */

   this.cancelModifiers = function(applyToSoftKB) {
      var i;
      /*
       * On blur events invoke cancelModifiers for desktop browsers. This is not
       * desired in case of softKB (touch devices, as we constantly change focus
       * from canvas to the hidden textbox (inputProxy) - PR 1084858.
       */
      if (WMKS.BROWSER.isTouchDevice() && !applyToSoftKB) {
         return;
      }
      for (i = 0; i < this.activeModifiers.length; i++) {
         this.sendKey(this.activeModifiers[i], true, false);
      }
      this.activeModifiers.length = 0;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * updateModifiers
    *
    *    This function update the state of the modifiers based on the input.
    *    If the modifier key is down, we add it to the modifier list else remove
    *    it from the list and send the appropriate key info to the protocol.
    *
    *    NOTE: Currently used by extendedKeypad widget.
    *
    *---------------------------------------------------------------------------
    */

   this.updateModifiers = function(modKey, isUp) {
      this.sendKey(modKey, isUp, false);
      if (isUp) {
         this.activeModifiers.splice(this.activeModifiers.indexOf(modKey), 1);
      } else {
         this.activeModifiers.push(modKey);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * onKeyPress
    *
    *    Desktop style onKeyPress handler. See onKeyDown for how our keyboard
    *    input mechanism works.
    *
    *---------------------------------------------------------------------------
    */

   this.onKeyPress = function(e) {
      var keyCode,
          isRaw = false;

      /*
       * If on a Mac, and ONLY Alt is held, prefer the raw key code.
       * This is because Alt-* on a US Mac keyboard produces many international
       * characters, which I would prefer to ignore for the sake of letting
       * keyboard shortcuts work naturally.
       */
      if (WMKS.BROWSER.isMacOS() && this.activeModifiers.length === 1 &&
          this.activeModifiers[0] === WMKS.CONST.KB.KEY_CODE.Alt) {
         WMKS.LOGGER.log('Preferring raw keycode with Alt held (Mac)');
         return false;
      } else if (e.charCode && e.charCode >= 0x20) {
         /*
          * Low order characters are control codes, which we need to send raw.
          * 0x20 is SPACE, which is the first printable character in Unicode.
          */
         keyCode = e.charCode;
         isRaw = false;
      } else if (e.keyCode) {
         keyCode = e.keyCode;
         isRaw = true;
      } else {
         WMKS.LOGGER.log('assert: could not read keypress event');
         return false;
      }

      if (this.keyDownKeyTimer !== null) {
         clearTimeout(this.keyDownKeyTimer);
         this.keyDownKeyTimer = null;
      }

      //WMKS.LOGGER.log("onKeyPress: keyCode=" + keyCode);

      if (isRaw && WMKS.CONST.KB.ControlKeys.indexOf(keyCode) !== -1) {
         // keypress for a keydown that was sent as a control key. Ignore.
         return false;
      }

      /*
       * Update the modifier state before we send a character which may conflict
       * with a stale modifier state
       */
      this._syncModifiers(e);

      if (this.pendingKey !== null) {
         if (isRaw) {
            this.keyToRawMap[this.pendingKey] = keyCode;
         } else {
            this.keyToUnicodeMap[this.pendingKey] = keyCode;
         }
      }

      this.sendKey(keyCode, false, !isRaw);

      /*
       * Keycodes 50 and 55 are deadkeys when AltGr is pressed. Pressing them a
       * second time produces two keys (either ~ or `). Send an additional up
       * keystroke so that the second keypress has both a down and up event.
       * PR 969092
       */
      if (((this.pendingKey === 50 && keyCode === 126) ||
           (this.pendingKey === 55 && keyCode === 96)) &&
          !isRaw) {
         WMKS.LOGGER.debug("Sending extra up for Unicode " + keyCode
            + " so one isn't missed.");
         this.sendKey(keyCode, true, !isRaw);
      }

      this.pendingKey = null;
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * onKeyUp
    *
    *    Called to handle the keyboard "key up" event and send the appropriate
    *    key stroke to the server.
    *
    *---------------------------------------------------------------------------
    */

   this.onKeyUp = function(e) {
      var keyCode, keyCodeRes, unicode, raw, isUnicode = false;

      if (e.preventDefault) {
         e.preventDefault();
      } else {
         e.returnValue = false;
      }

      keyCodeRes = this._extractKeyCodeFromEvent(e);
      if (!keyCodeRes) {
         WMKS.LOGGER.debug('Extraction of keyCode from keyUp event failed.');
         return false; // don't send a malformed command.
      }
      keyCode = keyCodeRes.keyCode;
      isUnicode = keyCodeRes.isUnicode;

      //WMKS.LOGGER.log("onKeyUp: keyCode=" + keyCode);

      // Sync modifiers because we don't always get correct events.
      this._syncModifiers(e);

      if ($.inArray(keyCode, WMKS.CONST.KB.Modifiers) !== -1) {
         // Handled above via syncModifiers
         return false;
      }

      /*
       * Only process keyup operations at once for certain keys.
       * Inhibit default because these will never result in a keypress event.
       */
      if (isUnicode) {
         WMKS.LOGGER.log('Sending unicode key up from keyIdentifier: ' + keyCode);
         this.sendKey(keyCode, true, true);
      } else if (this.keyToUnicodeMap.hasOwnProperty(keyCode)) {
         unicode = this.keyToUnicodeMap[keyCode];
         this.sendKey(unicode, true, true);

         // the user may change keymaps next time, don't persist this mapping
         delete this.keyToUnicodeMap[keyCode];
      } else if (this.keyToRawMap.hasOwnProperty(keyCode)) {
         raw = this.keyToRawMap[keyCode];
         this.sendKey(raw, true, false);
         delete this.keyToRawMap[keyCode];
      } else {
         this.sendKey(keyCode, true, false);
      }

      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * onKeyUpSoftKb
    *
    *    Event handler for soft keyboards. We do not have much going on here.
    *
    *---------------------------------------------------------------------------
    */

   this.onKeyUpSoftKb = function(e) {
      // for all browsers on soft keyboard.
      e.stopPropagation();
      e.preventDefault();
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * onKeyDownSoftKb
    *
    *    Special IOS onkeydown handler which only pays attention to certain keys
    *    and sends them directly. Returns false to prevent the default action,
    *    true otherwise.
    *
    *---------------------------------------------------------------------------
    */
   this.onKeyDownSoftKb = function(e) {
      var keyCode = e.keyCode || e.which;

      if (keyCode && WMKS.CONST.KB.SoftKBRawKeyCodes.indexOf(keyCode) !== -1) {
         // Non-Unicode but apply modifiers.
         this.handleSoftKb(keyCode, false);
         return false;
      }

      /*
       * Return value is true due to the following:
       * 1. For single-use-caps / Caps-Lock to work, we need to return true
       *    for all keys.
       * 2. Certain unicode characters are visible with keypress event
       *    alone. (keyCode value is 0)
       */
      return true;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * onKeyPressSoftKb
    *
    *    Returns latin1 & Unicode keycodes.
    *    Works for all basic input that you can do with a soft keyboard.
    *
    *    NOTE: Chrome on Android behaves differently. Hence we rely on
    *    onInputTextSoftKb() to handle the input event.
    *
    *---------------------------------------------------------------------------
    */

   this.onKeyPressSoftKb = function(e) {
      var keyCode = e.keyCode || e.which;
      if (WMKS.BROWSER.isAndroid() && WMKS.BROWSER.isChrome()) {
         // Android on Chrome, special case, ignore it.
         return true;
      }
      // Reset the text field first.
      $(e.target).val(WMKS.CONST.KB.keyInputDefaultValue);

      // Send both keydown and key up events.
      this.handleSoftKb(keyCode, true);

      /* If we use preventDefault() or return false, the single-use-caps does
       * not toggle back to its origial state. Hence rely on the fact that
       * text-2-speech contains more than 1 character input */
      return true;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * onInputTextSoftKb
    *
    *    Event handler for input event on the input-proxy. This intercepts
    *    microphone text input as well as keyPress events. We have to make sure
    *    only the microphone inputs are processed.
    *
    *    The following logic is used to differentiate.
    *    1. If input value is the same as defaultValue, no input, ignore it.
    *    2. If input value has only a single char, then its mostly preceeded by
    *       onKeyPressSoftKb(), so ignore it.
    *    3. There is more than 1 character, must be from speech-2-text. Process
    *       this one further.
    *
    * NOTE: Android chrome does not emit useful keyCodes, hence we use the value
    *       thats entered into the textbox and decode it to send as a message.
    *       http://code.google.com/p/chromium/issues/detail?id=118639
    *
    *---------------------------------------------------------------------------
    */

   this.onInputTextSoftKb = function(e) {
      // We have received speech-to-text input or something.
      var input = $(e.target),
          val = input.val(),
          defaultInputSize = WMKS.CONST.KB.keyInputDefaultValue.length;

      /*
       * TODO: It causes speech-to-text doesn't work on iOS.
       * Ignore input event due to bug 1080567. Keypress triggers
       * both keypress event as well as input event. It sends
       * duplicate texts to the remote desktop.
       */
      if (WMKS.BROWSER.isIOS()) {
         // In anycase, clean-up this data, so we do not repeat it.
         input.val(WMKS.CONST.KB.keyInputDefaultValue);
         return false;
      }

      // Remove the default value from the input string.
      if (defaultInputSize > 0) {
         val = val.substring(defaultInputSize);
      }
      // WMKS.LOGGER.debug('input val: ' + val);

      /*
       * 1. We have to verify if speech-to-text exists, we allow that.
       * 2. In case of Android, keyPress does not provide valid data, hence
       *    all input is handled here.
       * 3. For all other cases, do not process, its handled in onKeyPress.
       */
      if (val.length > 1) {
         /*
          * There are 2+ chars, hence speect-to-text or special symbols on
          * android keyboard, let it in as is. If its speech-to-text, first
          * char is generally uppercase, hence flip that.
          */
         val = val.charAt(0).toLowerCase() + val.slice(1);
         this.processInputString(val);
      } else if (WMKS.BROWSER.isAndroid() && WMKS.BROWSER.isChrome()) {
         // We could get uppercase and lower-case values, use them as is.
         this.processInputString(val);
      }

      // In anycase, clean-up this data, so we do not repeat it.
      input.val(WMKS.CONST.KB.keyInputDefaultValue);
      return true;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * processInputString
    *
    *    This function accepts a string of input characters and processes them.
    *    It decodes each character to its keyCode, and then sends each one of
    *    that in the order it was passed.
    *
    *    Returns the last key that was decoded from the input value.
    *
    *---------------------------------------------------------------------------
    */

   this.processInputString = function(str, processNewline) {
      var i, key = false;
      for (i = 0; i < str.length; i++) {
         if (processNewline && str.charAt(i) === '\n') {
            // Found a newline, handle this differently by sending the enter key.
            this.sendKey(WMKS.CONST.KB.KEY_CODE.Enter, false, false);
            this.sendKey(WMKS.CONST.KB.KEY_CODE.Enter, true, false);
            continue;
         }
         key = str.charCodeAt(i);
         if (!isNaN(key)) {
            // Send each key in if its a valid keycode.
            this.handleSoftKb(key, true);
         }
      }
      // Return the last keyCode from this input. When a single character is
      // passed, the last is essentially the keycode for that input character.
      return key;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * handleSoftKb
    *
    *    Process keyCode inputs from Soft keyboards. In case of unicode input
    *    we need to to check if the key provided needs to send an additional
    *    shift as well. VScanCodes assume Shift is sent.
    *
    *    Ex: keyCode 65, 97 are both mapped to 0x1e and hence for soft
    *        keyboards, we need to compute the extra shift key.
    *
    *    activeModifiers are used differently by Soft Keyboard compared to the
    *    desktop browser keyboards. The state of the activeModifiers are not
    *    managed by sending the keystrokes, but are explicitly turned on / off
    *    from the touch inputs.
    *
    *    The needsShift is specifically used for sending VScanCodes. This one
    *    sends an extra Shift key. However, if the activeModifier is already
    *    has the shiftKey down, we need to flip it, to revert this. Hence the
    *    needShift and activeModifers shift work hand in hand.
    *
    *---------------------------------------------------------------------------
    */

   this.handleSoftKb = function(key, isUnicode) {
      var implicitShift, shiftSentAlready;

      /*
       * In case of unicode, determine if the shift key is implicit.
       * Ex: keyCode 97(char 'A') = 65(char 'a') + Shift (implicit)
       * We need this for sending VScanCode, as VScanCodes do not handle unicode
       * and we have to wrap the input key with a shift.
       */
      implicitShift = (isUnicode && WMKS.CONST.KB.UnicodeWithShift[key]);

      if (implicitShift) {
         // Determine if shift was already sent via extendedKeypad.
         shiftSentAlready =
            ($.inArray(WMKS.CONST.KB.KEY_CODE.Shift, this.activeModifiers) !== -1);

         if (!shiftSentAlready && !this._isUnicodeInputSupported()) {
            // Send shift down before sending the keys.
            this.sendKey(WMKS.CONST.KB.KEY_CODE.Shift, false, false);
         }
         // Send the key-down and up.
         this.sendKey(key, false, isUnicode);
         this.sendKey(key, true, isUnicode);

         // Determine if we need to send a shift down / up.
         if (!shiftSentAlready && !this._isUnicodeInputSupported()) {
            this.sendKey(WMKS.CONST.KB.KEY_CODE.Shift, true, false);
         } else if (shiftSentAlready && this._isUnicodeInputSupported()) {
            // WMKS.LOGGER.debug('Send extra shift down to keep the modifier state');
            this.sendKey(WMKS.CONST.KB.KEY_CODE.Shift, false, false);
         }
      } else {
         // Send the key-down and up.
         this.sendKey(key, false, isUnicode);
         this.sendKey(key, true, isUnicode);
      }
   };


   /**
    *---------------------------------------------------------------------------
    *
    * isBrowserCapsLockOn
    *
    * Utility function used to detect if CAPs lock is on. Based on the
    * Javascript inputs we attempt to detect if the browser CapsLock is on.
    * We can only detect this on desktop browsers that sends shift key
    * separately. We can for sure say if its CapsLock enabled. But we cannot
    * say if the capsLock is not enabled, as non-unicode does not pass that
    * info.
    *
    *---------------------------------------------------------------------------
    */

   this.isBrowserCapsLockOn = function(keyCode, isUnicode, shiftKeyDown) {
      return !WMKS.BROWSER.isTouchDevice()
         && isUnicode
         && ((WMKS.CONST.KB.UnicodeOnly[keyCode] && shiftKeyDown)
         || (WMKS.CONST.KB.UnicodeWithShift[keyCode] && !shiftKeyDown));
   };


   /*
    *---------------------------------------------------------------------------
    *
    * sendKey
    *
    *    Single point of action for sending keystrokes to the protocol.
    *    Needs to know whether it's a down or up operation, and whether
    *    keyCode is a Unicode character index (keypress) or a raw one (keydown).
    *
    *    Depending on what type key message is sent, the appropriate lookups are
    *    made and sent.
    *
    *    This function is also the final frontier for limiting processing of
    *    key inputs.
    *
    *---------------------------------------------------------------------------
    */

   this.sendKey = function(key, isUp, isUnicode) {
      // Check if VMW key event can be used to send key inputs.
      if (!this._vncDecoder.useVMWKeyEvent) {
         return;
      }

      // Final frontier for banning keystrokes.
      // comment out while BannedRawCodes is empty.
//      if (!isUnicode && WMKS.CONST.KB.BannedRawCodes.indexOf(key) !== -1) {
//         return;
//      }

      // WMKS.LOGGER.log((isUnicode? '+U' : '') + key + (isUp? '-up' : '-d'));
      if (this._vncDecoder.allowVMWKeyEvent2UnicodeAndRaw) {
         // Blast uses the unicode mode where we send unicode / raw keyCode.
         this._vncDecoder.onVMWKeyUnicode(key, !isUp, !isUnicode);
      } else {
         // Send VMware VScanCodes.
         this._sendVScanCode(key, isUp, isUnicode);
      }
   };

   /**
    *---------------------------------------------------------------------------
    *
    * _sendVScanCode
    *
    *    This function handles the complexity of sending VScanCodes to the
    *    server. This function looks up 2 different tables to convert unicode
    *    to VScanCodes.
    *       1. Unicode to VScanCode
    *       2. Raw JS KeyCodes to VScanCodes.
    *
    *    TODO: Cleanup keyboardMapper and keyboardUtils once key repeats
    *          and CAPs lock are handled as expected.
    *
    *---------------------------------------------------------------------------
    */

   this._sendVScanCode = function(key, isUp, isUnicode) {
      var vScanCode = null;
      if (isUnicode || key === 13) {
         vScanCode = WMKS.CONST.KB.UnicodeToVScanMap[key];
      }
      if (!vScanCode) {
         // Since vScanCode is not valid, reset the flag.
         vScanCode = WMKS.keyboardUtils._jsToVScanTable[key];
         /**
          * Support Ctrl+C/V in WSX and vSphere NGC.
          * Both in WSX and vSphere NGC, send vScanCode to the server.
          * However, _jsToVScanTable lacks mapping for the characters
          * a-z, hence, when pressing Ctrl+C, c is not mapped and sent.
          * In this scenario, map c using the UnicodeToVScanMap and
          * send the code to the server.
          */
         if (!vScanCode) {
            // Mapping to VScanCode using the unicode mapping table.
            vScanCode = WMKS.CONST.KB.UnicodeToVScanMap[key];
         }
      }
      if (!!vScanCode) {
         // WMKS.LOGGER.debug('key: ' + key + ' onKeyVScan: ' + vScanCode
         //   + (isUp? '-up' : '-d'));
         // performMapping keyCode to VMware VScanCode and send it.
         this._vncDecoder.onKeyVScan(vScanCode, !isUp);
      } else {
         WMKS.LOGGER.debug('unknown key: ' + key + (isUp? '-up' : '-d'));
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * clearState
    *
    *    Single point of action for sending keystrokes to the protocol. Nice for
    *    debugging. Needs to know whether it's a down or up operation, and
    *    whether the keyCode is a unicode character index (keypress) or a
    *    raw one (keydown).
    *
    *---------------------------------------------------------------------------
    */

   this.clearState = function() {
      // Clear any keyboard specific state thats held.

      // Clear modifiers.
      this.activeModifiers.length = 0;

      // clear all modifier keys on start
      this.sendKey(WMKS.CONST.KB.KEY_CODE.Alt, true, false);
      this.sendKey(WMKS.CONST.KB.KEY_CODE.Ctrl, true, false);
      this.sendKey(WMKS.CONST.KB.KEY_CODE.Shift, true, false);
      // Send meta only if its Mac OS.
      if (WMKS.BROWSER.isMacOS()) {
         this.sendKey(WMKS.CONST.KB.KEY_CODE.Meta, true, false);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _isUnicodeInputSupported
    *
    *    This is a wrapper function that determines if the unicode input is
    *    handled by the server.
    *
    *    NOTE: true for Blast, false for WSX, NGC, etc.
    *
    *---------------------------------------------------------------------------
    */

   this._isUnicodeInputSupported = function() {
      return this._vncDecoder.allowVMWKeyEvent2UnicodeAndRaw;
   };
};


/**
 * WMKS.CONST.KB.UnicodeOnly
 * WMKS.CONST.KB.UnicodeWithShift
 * WMKS.CONST.KB.UnicodeToVScanMap
 *
 * The following are 2 sets of mapping that contain a key-value pair of unicode
 * to VScanCode map. Its split the mapping into two maps to enable detection
 * of whether the unicode is just a VScanCode or a combo of VScanCode with the
 * shift key down. This distinction is necessary in case of soft keyboards.
 *
 * These 2 maps are then merged into 1 final map UnicodeToVScanMap, that will
 * be used in the lookup code to send vScanCodes.
 */
WMKS.CONST.KB.UnicodeOnly = {

   // Space, enter, backspace
   32 : 0x39,
   13 : 0x1c,
   //8 : 0x0e,

   // Keys a-z
   97  : 0x1e,
   98  : 0x30,
   99  : 0x2e,
   100 : 0x20,
   101 : 0x12,
   102 : 0x21,
   103 : 0x22,
   104 : 0x23,
   105 : 0x17,
   106 : 0x24,
   107 : 0x25,
   108 : 0x26,
   109 : 0x32,
   110 : 0x31,
   111 : 0x18,
   112 : 0x19,
   113 : 0x10,
   114 : 0x13,
   115 : 0x1f,
   116 : 0x14,
   117 : 0x16,
   118 : 0x2f,
   119 : 0x11,
   120 : 0x2d,
   121 : 0x15,
   122 : 0x2c,

   // keyboard number keys (across the top) 1,2,3... -> 0
   49 : 0x02,
   50 : 0x03,
   51 : 0x04,
   52 : 0x05,
   53 : 0x06,
   54 : 0x07,
   55 : 0x08,
   56 : 0x09,
   57 : 0x0a,
   48 : 0x0b,

   // Symbol keys ; = , - . / ` [ \ ] '
   59 : 0x27, // ;
   61 : 0x0d, // =
   44 : 0x33, // ,
   45 : 0x0c, // -
   46 : 0x34, // .
   47 : 0x35, // /
   96 : 0x29, // `
   91 : 0x1a, // [
   92 : 0x2b, // \
   93 : 0x1b, // ]
   39 : 0x28  // '

};

WMKS.CONST.KB.UnicodeWithShift = {
   // Keys A-Z
   65 : 0x001e,
   66 : 0x0030,
   67 : 0x002e,
   68 : 0x0020,
   69 : 0x0012,
   70 : 0x0021,
   71 : 0x0022,
   72 : 0x0023,
   73 : 0x0017,
   74 : 0x0024,
   75 : 0x0025,
   76 : 0x0026,
   77 : 0x0032,
   78 : 0x0031,
   79 : 0x0018,
   80 : 0x0019,
   81 : 0x0010,
   82 : 0x0013,
   83 : 0x001f,
   84 : 0x0014,
   85 : 0x0016,
   86 : 0x002f,
   87 : 0x0011,
   88 : 0x002d,
   89 : 0x0015,
   90 : 0x002c,

   // Represents number 1, 2, ... 0 with Shift.
   33 : 0x0002, // !
   64 : 0x0003, // @
   35 : 0x0004, // #
   36 : 0x0005, // $
   37 : 0x0006, // %
   94 : 0x0007, // ^
   38 : 0x0008, // &
   42 : 0x0009, // *
   40 : 0x000a, // (
   41 : 0x000b, // )

   // Symbol keys with shift ----->  ; = , - . / ` [ \ ] '
   58  : 0x0027, // :
   43  : 0x000d, // +
   60  : 0x0033, // <
   95  : 0x000c, // _
   62  : 0x0034, // >
   63  : 0x0035, // ?
   126 : 0x0029, // ~
   123 : 0x001a, // {
   124 : 0x002b, // |
   125 : 0x001b, // }
   34  : 0x0028  // "
};

// Now create a common map with mappings for all unicode --> vScanCode.
WMKS.CONST.KB.UnicodeToVScanMap = $.extend({},
                                           WMKS.CONST.KB.UnicodeOnly,
                                           WMKS.CONST.KB.UnicodeWithShift);

/*
 * wmks/keyboardUtils.js
 *
 *   WebMKS keyboard event decoder and key remapper.
 *
 */

WMKS.keyboardUtils = {};



WMKS.keyboardUtils._keyInfoTemplate = {
   jsScanCode: 0,
   vScanCode: 0,
};



/*
 *------------------------------------------------------------------------------
 *
 * keyDownUpInfo
 *
 *    Parses a keydown/keyup event.
 *
 * Results:
 *    { jsScanCode,  The JavaScript-reposted scancode, if any. Arbitrary.
 *      vScanCode }  The VMX VScancode for the key on a US keyboard, if any.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.keyboardUtils.keyDownUpInfo = function(event) {
   var evt = event || window.event;
   var ki = this._keyInfoTemplate;

   if (evt.type === 'keydown' || evt.type === 'keyup') {
      /*
       * Convert JS scancode to VMware VScancode
       */
      ki.jsScanCode = evt.keyCode;
      ki.vScanCode = this._jsToVScanTable[ki.jsScanCode];

      /*
       * Workaround ie9/ie10 enter key behaviour.  We receive
       * keydown/keyup events but no keypress events for the enter
       * key.  On the other hand Firefox and Chrome give us
       * keydown/keyup *plus* keypress events for this key.  Short of
       * using a timer, don't see a way to catch both cases without
       * introducing a browser dependency here.
       */
      if ($.browser.msie && ki.jsScanCode == 13) {
         ki.vScanCode = 28;
      }
   }

   return ki;
};


/*
 *------------------------------------------------------------------------------
 *
 * keyPressInfo
 *
 *    Parses a keypress event.
 *
 * Results:
 *    The Unicode character generated during the event, or 0 if none.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.keyboardUtils.keyPressInfo = function(event) {
   var evt = event || window.event;
   var uChar = 0;

   if (evt.type === 'keypress') {
      uChar = evt.which;

      /*
       * Handle Backspace, Tab, ESC via keyDown instead.
       */
      if (uChar == 8 || uChar == 9 || uChar == 27) {
         uChar = 0;
      }
   }

   return uChar;
};





/*
 * JS scancode to VMware VScancode conversion table
 */
WMKS.keyboardUtils._jsToVScanTable = {
   // Space, enter, tab, escape, backspace
   //32 : 0x039,
   //13 : 0x01c,
   9 : 0x00f,
   27 : 0x001,
   8 : 0x00e,

   // shift, control, alt, Caps Lock, Num Lock
   16 : 0x02a,     // left shift
   17 : 0x01d,     // left control
   18 : 0x038,     // left alt
   20 : 0x03a,
   144 : 0x045,

   // Arrow keys (left, up, right, down)
   37 : 0x14b,
   38 : 0x148,
   39 : 0x14d,
   40 : 0x150,

   // Special keys (Insert, delete, home, end, page up, page down, F1 - F12)
   45 : 0x152,
   46 : 0x153,
   36 : 0x147,
   35 : 0x14f,
   33 : 0x149,
   34 : 0x151,
   112 : 0x03b,
   113 : 0x03c,
   114 : 0x03d,
   115 : 0x03e,
   116 : 0x03f,
   117 : 0x040,
   118 : 0x041,
   119 : 0x042,
   120 : 0x043,
   121 : 0x044,
   122 : 0x057,
   123 : 0x058,

   // Special Keys (Left Apple/Command, Right Apple/Command, Left Windows, Right Windows, Menu)
   224 : 0x038,
   // ? : 0x138,
   91 : 0x15b,
   92 : 0x15c,
   93 : 0, //?

   42 : 0x054,  // PrintScreen / SysRq
   19 : 0x100,  // Pause / Break

   /*
    * Commented out since these are locking modifiers that easily get
    * out of sync between server and client and thus cause unexpected
    * behaviour.
    */
   //144 : 0x045,  // NumLock
   //20 : 0x03a,  // CapsLock
   //145 : 0x046,  // Scroll Lock
};
/*globals WMKS */

WMKS.keyboardMapper = function(options) {
   if (!options.vncDecoder) {
      return null;
   }

   this._vncDecoder = options.vncDecoder;

   this._keysDownVScan = [];
   this._keysDownUnicode = [];

   this.VSCAN_CAPS_LOCK_KEY = 58;
   this.VSCAN_CMD_KEY = 347;

   // The current repeating typematic key
   this._typematicKeyVScan = 0;
   this._typematicDelayTimer = null;

   return this;
};


WMKS.keyboardMapper.prototype.doKeyVScan = function(vscan, down) {
   if (!this._vncDecoder.useVMWKeyEvent) {
      return;
   }

   /*
    * Caps lock is an unusual key and generates a 'down' when the
    * caps lock light is going from off -> on, and then an 'up'
    * when the caps lock light is going from on -> off. The problem
    * is compounded by a lack of information between the guest & VMX
    * as to the state of caps lock light. So the best we can do right
    * now is to always send a 'down' for the Caps Lock key to try and
    * toggle the caps lock state in the guest.
    */
   if (vscan === this.VSCAN_CAPS_LOCK_KEY && (navigator.platform.indexOf('Mac') !== -1)) {
       this._vncDecoder.onKeyVScan(vscan, 1);
       this._vncDecoder.onKeyVScan(vscan, 0);
       return;
   }

   /*
    * Manage an array of VScancodes currently held down.
    */
   if (down) {
      if (this._keysDownVScan.indexOf(vscan) <= -1) {
         this._keysDownVScan.push(vscan);
      }
      this.beginTypematic(vscan);
   } else {
      this.cancelTypematic(vscan);
      /*
       * If the key is in the array of keys currently down, remove it.
       */
      var index = this._keysDownVScan.indexOf(vscan);
      if (index >= 0) {
         this._keysDownVScan.splice(index, 1);
      }
   }

   /*
    * Send the event.
    */
   this._vncDecoder.onKeyVScan(vscan, down);
};


WMKS.keyboardMapper.prototype.doKeyUnicode = function(uChar, down) {
   if (!this._vncDecoder.useVMWKeyEvent) {
      return;
   }

   /*
    * Manage an array of Unicode chars currently "held down".
    */
   if (down) {
      this._keysDownUnicode.push(uChar);
   } else {
      /*
       * If the key is in the array of keys currently down, remove it.
       */
      var index = this._keysDownUnicode.indexOf(uChar);
      if (index >= 0) {
         this._keysDownUnicode.splice(index, 1);
      }
   }


   var modvscan = this._tableUnicodeToVScan[uChar];

   /*
    * Press the final key itself.
    */
   if (modvscan) {
      if (down) {
         this.beginTypematic(modvscan & 0x1ff);
      } else {
         this.cancelTypematic(modvscan & 0x1ff);
      }
      this._vncDecoder.onKeyVScan(modvscan & 0x1ff, down);
   }
};


WMKS.keyboardMapper.prototype.doReleaseAll = function() {
   var i;

   for (i = 0; i < this._keysDownUnicode.length; i++) {
      this.doKeyUnicode(this._keysDownUnicode[i], 0);
   }
   if (this._keysDownUnicode.length > 0) {
      console.log("Warning: Could not release all Unicode keys.");
   }

   for (i = 0; i < this._keysDownVScan.length; i++) {
      this.cancelTypematic(this._keysDownVScan[i]);
      this._vncDecoder.onKeyVScan(this._keysDownVScan[i], 0);
   }
   this._keysDownVScan = [];
};


/*
 *------------------------------------------------------------------------------
 *
 * beginTypematic
 *
 *    Begin the typematic process for a new key going down. Cancel any pending
 *    timers, record the new key going down and start a delay timer.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.keyboardMapper.prototype.beginTypematic = function (vscan) {
   /*
    * Don't begin typematic if the cmd key is down, we don't get
    * a key up for the alpha key if it was down whilst the cmd key
    * was also down. So there's no cancel of typematic.
    */
   if (this._keysDownVScan.indexOf(this.VSCAN_CMD_KEY) >= 0) {
      return;
   }

   // Cancel any typematic delay timer that may have been previously started
   this.cancelTypematicDelay();
   // And cancel any typematic periodic timer that may have been started
   this.cancelTypematicPeriod();
   if (this._vncDecoder.typematicState === 1) {
      // Begin the delay timer, when this fires we'll
      // start auto-generating down events for this key.
      this.startTypematicDelay(vscan);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * cancelTypematic
 *
 *    Cancel the typematic process for a key going up. If the key going up is our
 *    current typematic key then cancel both delay and periodic timers (if they exist).
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.keyboardMapper.prototype.cancelTypematic = function (vscan) {
    if (this._typematicKeyVScan === vscan) {
       this.cancelTypematicDelay();
       this.cancelTypematicPeriod();
    }
};


/*
 *------------------------------------------------------------------------------
 *
 * cancelTypematicDelay
 *
 *    Cancel a typematic delay (before auto-repeat) .
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.keyboardMapper.prototype.cancelTypematicDelay = function() {
   if (this._typematicDelayTimer !== null) {
      clearTimeout(this._typematicDelayTimer);
   }
   this._typematicDelayTimer = null;
};


/*
 *------------------------------------------------------------------------------
 *
 * cancelTypematicPeriod
 *
 *    Cancel a typematic periodic timer (the auto-repeat timer) .
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.keyboardMapper.prototype.cancelTypematicPeriod = function() {
    if (this.__typematicPeriodTimer !== null) {
        clearInterval(this._typematicPeriodTimer);
    }
    this._typematicPeriodTimer = null;
};


/*
 *------------------------------------------------------------------------------
 *
 * startTypematicDelay
 *
 *    Start the typematic delay timer, when this timer fires, the specified
 *    auto-repeat will begin and send the recorded typematic key vscan code.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.keyboardMapper.prototype.startTypematicDelay = function(vscan) {
   var self = this;
   this._typematicKeyVScan = vscan;
   this._typematicDelayTimer = setTimeout(function () {
     self._typematicPeriodTimer = setInterval(function() {
        self._vncDecoder.onKeyVScan(self._typematicKeyVScan, 1);
     }, self._vncDecoder.typematicPeriod / 1000);
   }, this._vncDecoder.typematicDelay / 1000);
};


/*
 * Unicode to VMware VScancode conversion tables
 */

//WMKS.keyboardMapper.prototype._modShift = 0x1000;
//WMKS.keyboardMapper.prototype._modCtrl  = 0x2000;
//WMKS.keyboardMapper.prototype._modAlt   = 0x4000;
//WMKS.keyboardMapper.prototype._modWin   = 0x8000;

WMKS.keyboardMapper.prototype._tableUnicodeToVScan = {
   // Space, enter, backspace
   32 : 0x39,
   13 : 0x1c,
   //8 : 0x0e,

   // Keys a-z
   97  : 0x1e,
   98  : 0x30,
   99  : 0x2e,
   100 : 0x20,
   101 : 0x12,
   102 : 0x21,
   103 : 0x22,
   104 : 0x23,
   105 : 0x17,
   106 : 0x24,
   107 : 0x25,
   108 : 0x26,
   109 : 0x32,
   110 : 0x31,
   111 : 0x18,
   112 : 0x19,
   113 : 0x10,
   114 : 0x13,
   115 : 0x1f,
   116 : 0x14,
   117 : 0x16,
   118 : 0x2f,
   119 : 0x11,
   120 : 0x2d,
   121 : 0x15,
   122 : 0x2c,

   // keyboard number keys (across the top) 1,2,3... -> 0
   49 : 0x02,
   50 : 0x03,
   51 : 0x04,
   52 : 0x05,
   53 : 0x06,
   54 : 0x07,
   55 : 0x08,
   56 : 0x09,
   57 : 0x0a,
   48 : 0x0b,

   // Symbol keys ; = , - . / ` [ \ ] '
   59 : 0x27, // ;
   61 : 0x0d, // =
   44 : 0x33, // ,
   45 : 0x0c, // -
   46 : 0x34, // .
   47 : 0x35, // /
   96 : 0x29, // `
   91 : 0x1a, // [
   92 : 0x2b, // \
   93 : 0x1b, // ]
   39 : 0x28,  // '


   // Keys A-Z
   65 : 0x001e,
   66 : 0x0030,
   67 : 0x002e,
   68 : 0x0020,
   69 : 0x0012,
   70 : 0x0021,
   71 : 0x0022,
   72 : 0x0023,
   73 : 0x0017,
   74 : 0x0024,
   75 : 0x0025,
   76 : 0x0026,
   77 : 0x0032,
   78 : 0x0031,
   79 : 0x0018,
   80 : 0x0019,
   81 : 0x0010,
   82 : 0x0013,
   83 : 0x001f,
   84 : 0x0014,
   85 : 0x0016,
   86 : 0x002f,
   87 : 0x0011,
   88 : 0x002d,
   89 : 0x0015,
   90 : 0x002c,

   33 : 0x0002, // !
   64 : 0x0003, // @
   35 : 0x0004, // #
   36 : 0x0005, // $
   37 : 0x0006, // %
   94 : 0x0007, // ^
   38 : 0x0008, // &
   42 : 0x0009, // *
   40 : 0x000a, // (
   41 : 0x000b, // )

   58  : 0x0027, // :
   43  : 0x000d, // +
   60  : 0x0033, // <
   95  : 0x000c, // _
   62  : 0x0034, // >
   63  : 0x0035, // ?
   126 : 0x0029, // ~
   123 : 0x001a, // {
   124 : 0x002b, // |
   125 : 0x001b, // }
   34  : 0x0028, // "
};
/* global $:false, WMKS:false */

/*
 *------------------------------------------------------------------------------
 * wmks/touchHandler.js
 *
 *    This class abstracts touch input management and decouples this
 *    functionality from the widgetProto.
 *
 *    All variables are defined as private variables. Functions that do not
 *    need to be exposed should be private too.
 *
 *------------------------------------------------------------------------------
 */

/*
 *------------------------------------------------------------------------------
 *
 * WMKS.CONST.TOUCH
 *
 *    Enums and constants for touchHandlers. These comprise of constants for
 *    various gestures and types of gestures, etc.
 *
 *------------------------------------------------------------------------------
 */

WMKS.CONST.TOUCH = {
   FEATURE: {                             // List of optional touch features.
      SoftKeyboard:     0,
      ExtendedKeypad:   1,
      Trackpad:         2
   },
   // Tolerances for touch control
   tapMoveCorrectionDistancePx: 10,
   additionalTouchIgnoreGapMs: 1200,
   touchMoveSampleMinCount:   2,
   minKeyboardToggleTime:     50,         // Minumum time between keyboard toggles.
   leftDragDelayMs:           300,
   OP: {                                  // Touch event/guesture types.
      none:                   'none',
      scroll:                 'scroll',
      drag:                   'drag',
      move:                   'move',
      tap_twice:              'double-click',
      tap_1finger:            'click',
      tap_3finger:            'tap-3f'
   },
   SCROLL: {
      touchScrollDeltaSend:   60,         // Scroll distance sent to server side.
      minDeltaDistancePx:     20          // Min distance to scroll before sending a scroll message.
   },
   DOUBLE_TAP: {                          // Constants for tolerance between double taps.
      tapGapInTime:           250,        // Allowed ms delay b/w the 2 taps.
      tapGapBonusTime:        200,        // Allowed extra ms delay based on tapGapBonus4TimeRatio value wrt tap proximity.
      tapGapBonus4TimeRatio:  0.4,        // Allowed ratio of tap proximity b/w taps vs tapGapInTime to activate tapGapBonusTime.
      tapGapInDistance:       40          // Allowed px distance b/w the 2 taps.
   }
};


WMKS.TouchHandler = function(options) {
   'use strict';
   if (!options || !options.canvas ||
       !options.widgetProto || !options.keyboardManager) {
      WMKS.LOGGER.warn('Invalid params set for TouchHandler.');
      return null;
   }

   var _widget = options.widgetProto,
       _keyboardManager = options.keyboardManager,
       _KEYBOARD = {
         visible: false,             // Internal flag to identify keyboard state.
         lastToggleTime: 0           // Last keyboard toggle timestamp used to detect spurious requests.
       },
       _repositionElements = [],     // Elements needing reposition upon rotation.
       _canvas = options.canvas,     // Canvas where all the action happens.
       _onToggle = options.onToggle; // Toggle callback function.

   // Timers
   var _dragTimer = null,
       _TAP_STATE = {               // Touch state machine.
         currentTouchFingers: -1,   // Indicates number of touch fingers
         firstTouch: null,
         currentTouch: null,
         touchArray: [],
         tapStartTime: null,        // Used to detect double tap
         touchMoveCount: 0,
         skipScrollCount: 0,
         scrollCount: 0,
         zoomCount: 0,
         opType: WMKS.CONST.TOUCH.OP.none
       };

      // List of jQuery objects that are used frequently.
   var _ELEMENTS = {
         inputProxy        : null,
         cursorIcon        : null,
         clickFeedback     : null,
         dragFeedback      : null,
         pulseFeedback     : null,
         scrollFeedback    : null,
         keypad            : null,
         trackpad          : null
       };


   /*
    *---------------------------------------------------------------------------
    *
    * _verifyQuickTouches
    *
    *    We noticed that the touch events get fired extremely quickly when there
    *    is touchstart, touchstart, touchmove, and the browser itself does not
    *    detect the second touchstart before the touchmove, instead it shows 1
    *    touchstartand the first touchmove indicates 1 finger with a move of
    *    over 50px. We decode the touchmoved location to the second touchstart
    *    location.
    *
    *    Ex: Following log indicates this scenario:
    *    3:41:54.566Z [Debug] touchstart#: 1 (e.targetTouches.length)
    *    3:41:54.568Z [Debug] touchstart#: 1 (e.targetTouches.length)
    *    3:41:54.584Z [Debug] single tap drag dist: 147.8715658942, scale: 0.90927...
    *    3:41:54.586Z [Info ] touchmove count: 1 touch#: 1 (e.targetTouches.length)
    *    3:41:54.600Z [Debug] onGestureEnd: 0.9092.. <-- gestureEnd happens only
    *                         if there were 2 touchstarts in the first place.
    *
    *---------------------------------------------------------------------------
    */

   this._verifyQuickTouches = function(e, dist, touchMoveCount) {
      // Only make use of this state if the opType is not defined, there
      // is a change in scale, this is the first touchmove and the distance b/w
      // firsttouch and the touchmove's event location is really huge.
      if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.none
            && dist > 50 && touchMoveCount === 1) {
         WMKS.LOGGER.debug('Special case - touchmove#: ' + touchMoveCount
            + ', targetTouches#: ' + e.targetTouches.length
            + ', dist: ' + dist + ', scale: ' + e.scale);
         return true;
      }
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _initDragEventAndSendFeedback
    *
    *    This is the initialization event that happens when we detect a gesture
    *    as a drag. It does the following:
    *    1. Sends a mouse down where the touch initially happened.
    *    2. Shows drag ready feedback.
    *
    *---------------------------------------------------------------------------
    */

   this._initDragEventAndSendFeedback = function(firstTouch) {
      if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.drag) {
         // Send the left mousedown at the touch location & send drag feedback
         var pos = this._applyZoomCorrectionToTouchXY(firstTouch);
         _widget.sendMouseButtonMessage(pos, true, WMKS.CONST.CLICK.left);
         // Show drag icon above implying the drag is ready to use.
         this._showFeedback(_ELEMENTS.dragFeedback, firstTouch);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _initTwoFingerTouch
    *
    *    This is the initialization event that happens when we detect a gesture
    *    as a drag. It does the following:
    *    1. Sends a mouse down where the touch initially happened.
    *    2. Shows drag ready feedback.
    *
    *---------------------------------------------------------------------------
    */

   this._initTwoFingerTouch = function(firstTouch, secondTouch) {
      /* WMKS.LOGGER.debug('Touch1: ' + firstTouch.screenX + ','
         + firstTouch.screenY + ' touch 2: ' + secondTouch.screenX + ','
         + secondTouch.screenY + ' opType: ' + _TAP_STATE.opType); */
      if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.none) {
         _TAP_STATE.currentTouchFingers = 2;
         /*
          * Now, 2 finger tap just happened. This could be one of the following:
          *    1. Scroll - (To detect use angle b/w lines upon touchmove).
          *    2. Zoom/pinch - Handled by the default handler (detect as above).
          *    3. right-click (When its neither of the above).
          *
          * Store the original 2 finger location and the leftmost location.
          * NB: Use location of the leftmost finger to position right click.
          * TODO: lefty mode
          */
         _TAP_STATE.touchArray.push(firstTouch);
         _TAP_STATE.touchArray.push(secondTouch);
         _TAP_STATE.firstTouch = WMKS.UTIL.TOUCH.copyTouch(
            WMKS.UTIL.TOUCH.leftmostOf(firstTouch, secondTouch));
         _TAP_STATE.currentTouch = WMKS.UTIL.TOUCH.copyTouch(_TAP_STATE.firstTouch);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _sendScrollEventMessage
    *
    *    This function handles the computation of the vertical scroll distance.
    *    If the distance is more than the threshold, then sends the appropriate
    *    message to the server.
    *
    *---------------------------------------------------------------------------
    */

   this._sendScrollEventMessage = function(touch) {
      var dx = 0, dy = 0, deltaX, deltaY, wheelDeltas, firstPos;
      if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.scroll) {
         deltaX = touch.clientX - _TAP_STATE.currentTouch.clientX;
         deltaY = touch.clientY - _TAP_STATE.currentTouch.clientY;

         wheelDeltas = this._calculateMouseWheelDeltas(deltaX, deltaY);
         dx = wheelDeltas.wheelDeltaX;
         dy = wheelDeltas.wheelDeltaY;

         // Only send if atleast one of the deltas has a value.
         if (dx !== 0 || dy !== 0) {
            firstPos = this._applyZoomCorrectionToTouchXY(_TAP_STATE.touchArray[0]);
            _widget.sendScrollMessage(firstPos, dx, dy);

            // Update clientX, clientY values as we only need them.
            if (dx !== 0) {
               _TAP_STATE.currentTouch.clientX = touch.clientX;
            }

            if (dy !== 0) {
               _TAP_STATE.currentTouch.clientY = touch.clientY;
            }
         }
      }
      // TODO: Improve scroll by using residual scroll data when delta < minDeltaDistancePx.
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _calculateMouseWheelDeltas
    *
    *    This function calculates the wheelDeltaX and wheelDeltaY values
    *    according to the scroll delta distance.
    *
    *---------------------------------------------------------------------------
    */

   this._calculateMouseWheelDeltas = function(deltaX, deltaY) {
      var dx = 0,
          dy = 0,
          absDeltaX = Math.abs(deltaX),
          absDeltaY = Math.abs(deltaY),
          scrollX = absDeltaX > WMKS.CONST.TOUCH.SCROLL.minDeltaDistancePx,
          scrollY = absDeltaY > WMKS.CONST.TOUCH.SCROLL.minDeltaDistancePx,
          angle;

      /*
       * We don't want to send movements for every pixel we move.
       * So instead, we pick a threshold, and only scroll that amount.
       * This won't be perfect for all applications.
       */
      if (scrollX && scrollY) {
         /*
          * If the scroll angle is smaller than 45 degree,
          * do horizontal scroll; otherwise, do vertical scroll.
          */
         if (absDeltaY < absDeltaX) {
            // Horizontal scroll only.
            scrollY = false;
         } else {
            // Vertical scroll only.
            scrollX = false;
         }
      }

      if (scrollX) {
         dx = _widget.options.sendProperMouseWheelDeltas ?
            (deltaX > 0 ? 127 : -128) : (deltaX > 0 ? 1 : -1);
      }

      if (scrollY) {
         dy = _widget.options.sendProperMouseWheelDeltas ?
            (deltaY > 0 ? -128 : 127) : (deltaY > 0 ? -1 : 1);
      }

      return {wheelDeltaX : dx, wheelDeltaY : dy};
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _updatePreScrollState
    *
    *    This function verifies if there was a residual scroll event, and if so.
    *    sends that after computing the directing of the scroll.
    *
    *---------------------------------------------------------------------------
    */

   this._updatePreScrollState = function(touch) {
      var deltaY = touch.clientY - _TAP_STATE.currentTouch.clientY;
      _TAP_STATE.scrollCount++;
      if (deltaY < 0) {
         _TAP_STATE.skipScrollCount--;
      } else {
         _TAP_STATE.skipScrollCount++;
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _sendResidualScrollEventMessage
    *
    *    This function verifies if there was a residual scroll event, and if so.
    *    sends that after computing the directing of the scroll.
    *
    *---------------------------------------------------------------------------
    */

   this._sendResidualScrollEventMessage = function() {
      var pos, sendScroll = WMKS.CONST.TOUCH.SCROLL.touchScrollDeltaSend;
      // Detech if there is a leftover scroll event to be sent.
      if (_TAP_STATE.skipScrollCount !== 0 && _TAP_STATE.currentTouch) {
         // Correct scroll direction if necessary.
         if (_TAP_STATE.skipScrollCount < 0) {
            sendScroll = -sendScroll;
         }
         WMKS.LOGGER.debug('Sending a residual scroll message.');
         WMKS.LOGGER.debug('Cur touch: ' + _TAP_STATE.currentTouch.pageX
            + ' , ' + _TAP_STATE.currentTouch.pageY);

         _TAP_STATE.skipScrollCount = 0;
         pos = this._applyZoomCorrectionToTouchXY(_TAP_STATE.currentTouch);
         // TODO KEERTHI: Fix this for horizontal scrolling as well.
         // dx for horizontal, dy for vertical.
         _widget.sendScrollMessage(pos, sendScroll, 0);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _isDoubleTap
    *
    *    Function to check if the tap is part of a double tap. The logic to
    *    determine is:
    *    1. There is always another tap earlier to this one.
    *    2. The time and proximity b/w 2 taps happen within the threshold values
    *    set in the constants: C.DOUBLE_TAP
    *    3. Based on heuristics we found that some double taps took longer than
    *    thethreshold value but more accurate. Hence extend the time b/w double
    *    taps if the proximity of these 2 taps are under the
    *    tapGapBonus4TimeRatio(0.4) of the acceptable limit (tapGapInDistance).
    *    4. Make sure the double tap is always different from the two finger
    *    tap and the thresholds are within acceptable limits.
    *---------------------------------------------------------------------------
    */

   this._isDoubleTap = function(event, now) {
      var dist, duration;
      // Check if this is the second tap and there is a time delay from the first.
      if (_TAP_STATE.currentTouch === null || _TAP_STATE.tapStartTime === null
         || _TAP_STATE.opType !== WMKS.CONST.TOUCH.OP.none) {
         return false;
      }
      // Compute time difference and click position distance b/w taps.
      dist = WMKS.UTIL.TOUCH.touchDistance(_TAP_STATE.currentTouch, event.targetTouches[0]);
      duration = (now - _TAP_STATE.tapStartTime);
      // WMKS.LOGGER.debug('is tap_two (ms): ' + duration + ' & offset (px): ' + dist);

      // Check if the second tap occured within the same vicinity as the first.
      if (dist < WMKS.CONST.TOUCH.DOUBLE_TAP.tapGapInDistance) {
         // If duration b/w taps is within accceptable limit
         if (duration < WMKS.CONST.TOUCH.DOUBLE_TAP.tapGapInTime) {
            // WMKS.LOGGER.debug('double tap correction activated.');
            return true;
         }
         // If the taps were extremely accurate < 40% tap gap, add the extra bonus tap gap time
         if ((dist / WMKS.CONST.TOUCH.DOUBLE_TAP.tapGapInDistance) < WMKS.CONST.TOUCH.DOUBLE_TAP.tapGapBonus4TimeRatio
                 && duration < (WMKS.CONST.TOUCH.DOUBLE_TAP.tapGapInTime + WMKS.CONST.TOUCH.DOUBLE_TAP.tapGapBonusTime)) {
            // WMKS.LOGGER.trace('Duration eligible for bonus with tapGapBonus4TimeRatio: '
            //      + (dist / WMKS.CONST.TOUCH.DOUBLE_TAP.tapGapInDistance));
            // WMKS.LOGGER.debug('double tap bonus correction activated.');
            return true;
         }
      }
      return false;
   };

   /*
    *---------------------------------------------------------------------------
    *
    * _onTouchStart
    *
    *    Called when a touch operation begins.
    *    A state machine is initiated which knows the number of fingers used for
    *    this touch operation in the case where it uses one finger.
    *
    *    For every touchstart, we perform the following logic:
    *    1. If the touch fingers = 1:
    *       a) Check if this touchstart is part of a double-click. If so, set
    *       the state machine info accordingly.
    *       b) If not, then update the state machine accordingly.
    *       c) for both case above, initialize a drag timer function with a
    *           delay threshold and upon triggering, initialize and set
    *           operation as a drag.
    *    2. If touch fingers = 2:
    *       a) Detect if we had earlier detected a 1 finger touchstart. In this
    *          case if the second touch happens quite late (After a set
    *          threshold) then we just ignore it. If not, then transform into
    *          a 2 finger touchstart.
    *          NOTE: This clears out the old 1 finger touchstart state.
    *       b) Initialize the 2 finger touch start as this could be a zoom /
    *          scroll/ right-click.
    *    3. The 3 finger touch start is detected, and if no operation is
    *       previously detected, then flag that state and toggle the keyboard.
    *
    *---------------------------------------------------------------------------
    */

   this._onTouchStart = function(e) {
      var pos, timeGap, self = this, now = $.now();

      // WMKS.LOGGER.debug('Start#: ' + e.targetTouches.length);
      // Unless two fingers are involved (native scrolling) prevent default
      if (e.targetTouches.length === 1) {
         /*
          * If it involves one finger, it may be:
          * - left click (touchstart and touchend without changing position)
          * - left drag (touchstart, activation timeout, touchmove, touchend)
          * - right click with staggered fingers (touchstart, touchstart, touchend)
          * - pan and scan (default behavior)
          * Allow the default behavior, but record the touch just in case it
          * becomes a click or drag.
          *
          * Also, check for a double click. See isDoubleTap() for details.
          */

         if (this._isDoubleTap(e, now)) {
            _TAP_STATE.firstTouch =
               WMKS.UTIL.TOUCH.copyTouch(_TAP_STATE.currentTouch);
            _TAP_STATE.opType = WMKS.CONST.TOUCH.OP.tap_twice;
         } else {
            _TAP_STATE.firstTouch =
               WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[0]);
            _TAP_STATE.currentTouch =
               WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[0]);
         }

         _TAP_STATE.currentTouchFingers = 1;
         _TAP_STATE.tapStartTime = now;

         // ontouchmove destroys this timer. The finger must stay put.
         if (_dragTimer !== null) {
            clearTimeout(_dragTimer);
         }

         _dragTimer = setTimeout(function() {
            _dragTimer = null;

            // Update opType and init the drag event.
            _TAP_STATE.opType = WMKS.CONST.TOUCH.OP.drag;
            self._initDragEventAndSendFeedback(_TAP_STATE.firstTouch);
         }, WMKS.CONST.TOUCH.leftDragDelayMs);

         // Must return true, else pinch to zoom and pan and scan will not work
         return true;
      } else if (e.targetTouches.length === 2) {
         // If touchstart happen a while after one another, wrap up the original op.
         if (_TAP_STATE.currentTouchFingers === 1) {
            // Now the second tap happens after a while. Check if its valid
            timeGap = now - _TAP_STATE.tapStartTime;
            if (timeGap > WMKS.CONST.TOUCH.additionalTouchIgnoreGapMs) {
               if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.drag) {
                  // Drag was in progress and we see a new touch.
                  // Hence end this and start a new one.
                  pos = this._applyZoomCorrectionToTouchXY(e.targetTouches[0]);
                  _widget.sendMouseButtonMessage(pos, true, WMKS.CONST.CLICK.left);
                  this._resetTouchState();
               }
            }
         }

         // Setup for 2 finger gestures.
         this._initTwoFingerTouch(WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[0]),
            WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[1]));
         // Always allow default behavior, this allows the user to pinch to zoom
         return true;
      } else if (e.targetTouches.length === 3) {
         // Three fingers, toggle keyboard only if no gesture is detected.
         if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.none) {
            _TAP_STATE.opType = WMKS.CONST.TOUCH.OP.tap_3finger;
            this.toggleKeyboard();
            // Set touch fingers value, so touchend knows to clear state.
            _TAP_STATE.currentTouchFingers = 3;
         }
         return false;
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _onTouchMove
    *
    *    This function handler is invoked when touchmove is detected. Here we do
    *    the following:
    *    1. Keep a track of how many touchmove events happen.
    *    2. Clear out if any dragTimer as we see a touchmove.
    *    3. If we have already detected an opType, then we just apply the
    *       touchmove to that operation. Even if touch fingers changes midflight,
    *       ignore them, as the use has already started using the operation
    *       and hence should continue with that.
    *    4. If no operation is detected and the touch fingers changes midflight,
    *       then it could be the following:
    *       a) Downgrade (2 --> 1 finger): If there is no scale value(distance
    *          b/w touches didnt change), then its a right-click.
    *       b) Upgrade (1 --> 2 finger): This is technically the same as a
    *          2-finger touchstart at this point. NOTE: If there is a downgrade,
    *          there wont be an upgrade.( It never goes from 2 --> 1 and then
    *          1 --> 2 later).
    *       c) If neither of the above, then its something we dont handle, must
    *          be a zoom/pinch. Hence let the default behavior kick in.
    *    5. When the touch fingers is 1, then it could be one of the following:
    *       a) Wobbly fingers that we need to ignore move distance < threashold (10px).
    *       b) Quick fingers, thats described in the function that detects it.
    *          This can happen with a very specific set of data, and if so, detect
    *          this as an initialization to 2 finger touchstart event.
    *       c) If neither of the above, then panning is assumed, and leave this
    *          to the browser to handle.
    *    6. If the touch fingers = 2, then attempt to detect a scroll / zoom.
    *       This is done based on computing the angle b/w the lines created from
    *       the touch fingers starting point to their touchmoved destination.
    *       Based on the angle, we determine if its a scroll or not. Sample
    *       multiple times before making the decission.
    *
    *    During the computation, we use various touch state entities to manage
    *    the overall state and assists in detecting the opType.
    *
    *---------------------------------------------------------------------------
    */

   this._onTouchMove = function(e) {
      var dist, pos;

      // Reset the drag timer if there is one.
      if (_dragTimer !== null) {
         clearTimeout(_dragTimer);
         _dragTimer = null;
      }

      // Increment touchMove counter to keep track of move event count.
      _TAP_STATE.touchMoveCount++;

      /* if (_TAP_STATE.touchMoveCount < 10) {
         WMKS.LOGGER.debug('move#: ' + _TAP_STATE.touchMoveCount
            + ' touch#: ' + e.targetTouches.length);
      } */

      /*
       * 1. Current touchFingers can be -1, allow default browser behavior.
       * 2. If the opType is defined, allow those gestures to complete.
       * 3. Now see if we can determine any gestures.
       */
      if (_TAP_STATE.currentTouchFingers === -1) {
         return true;
      } else if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.scroll) {
         // Scroll is detected, stick to it irrespective of the change in touch
         // fingers, etc.
         // WMKS.LOGGER.trace('continue scroll.. fingers change midflight.');
         this._sendScrollEventMessage(e.targetTouches[0]);
         return false;
      } else if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.drag) {
         // Drag is now moved. Send mousemove.
         _TAP_STATE.currentTouch = WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[0]);
         pos = this._applyZoomCorrectionToTouchXY(e.targetTouches[0]);

         _widget.sendMouseMoveMessage(pos);
         // Inhibit the default so pan does not occur
         return false;
      } else if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.tap_3finger) {
         /*
          * keyboard is already toggled but we retain the state as is here
          * to avoid touch fingers changing midflight causing a state change
          * to something else.
          */
         return false;
      } else if (_TAP_STATE.currentTouchFingers !== e.targetTouches.length) {
         // WMKS.LOGGER.debug('# of fingers changed midflight ('
         //   + _TAP_STATE.currentTouchFingers + '->' + e.targetTouches.length
         //   + '), scale: ' + e.scale + ', type: ' + _TAP_STATE.opType);
         if (_TAP_STATE.currentTouchFingers === 2 && e.targetTouches.length === 1) {
            if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.none && e.scale === 1) {
               // Touch ended early, is not a pinch/zoom(scale = 1).
               // Flag as a right click & clear state.
               WMKS.LOGGER.debug('touch: 2 -> 1 & !scroll, hence right-click.');
               this._sendTwoTouchEvent(_TAP_STATE.firstTouch,
                                       _TAP_STATE.firstTouch,
                                       WMKS.CONST.CLICK.right, e);
               this._resetTouchState();
               return false;
            }
         } else if (_TAP_STATE.currentTouchFingers === 1 && e.targetTouches.length === 2) {
            // No touchstart before this, so handle it as a 2 finger init here.
            WMKS.LOGGER.debug('touch: 1 -> 2, init 2fingertap if no opType: ' + _TAP_STATE.opType);
            this._initTwoFingerTouch(WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[0]),
               WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[1]));
            // Since we do not know if this is a zoom/scroll/right-click, return true for now.
            return true;
         } else {
            WMKS.LOGGER.debug('touch: 2 -> 1: infer as PINCH/ZOOM.');
            this._resetTouchState();
            return true;
         }
      } else if (_TAP_STATE.currentTouchFingers === 1) {
         // e.targetTouches.length = 1 based on above condition check.
         dist = WMKS.UTIL.TOUCH.touchDistance(e.targetTouches[0], _TAP_STATE.currentTouch);
         // If we have quick fingers convert into 2 finger touch gesture.
         if(this._verifyQuickTouches(e, dist, _TAP_STATE.touchMoveCount)) {
            // Initialize setup for 2 finger gestures.
            this._initTwoFingerTouch(WMKS.UTIL.TOUCH.copyTouch(_TAP_STATE.firstTouch),
               WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[0]));

            // This occured in touchmove, so not a right click, hence a scroll.
            _TAP_STATE.opType = WMKS.CONST.TOUCH.OP.scroll;
            return false;
         }
         else if (dist < WMKS.CONST.TOUCH.tapMoveCorrectionDistancePx){
            // If move is within a threshold, its may be a click by wobbly fingers.
            // Left click should not becomes a pan if within the threshold.
            return true;
         } else {
            /**
             * TODO: It would be nice to avoid the trackpad completely by
             * replacing trackpad functionality with a trackpad/relative mode.
             * This differs from the original/absolute touch mode by is relative
             * nature of the cursor location and the touch location. The
             * relative mode acts as a huge trackpad.
             */
           this._resetTouchState();
           return true;
         }
      } else if (_TAP_STATE.currentTouchFingers === 2) {
         // Determine type of operation if its not set, or the state is not cleaned up.
         if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.none) {
            if (_TAP_STATE.touchArray.length === 0 || _TAP_STATE.touchArray.length !== 2) {
               // If the the original touches were not captured, classify this as zoom/pinch.
               this._resetTouchState();
               return true;
            }

            // Initially scale = 1 is common, ignore event as this does not add any value.
            if (e.scale === 1 && _TAP_STATE.touchMoveCount < 5) {
               // No move detected so far, hence skip this touchmove, return true.
               return true;
            }

            /*
             * Compute the angle b/w the 2 lines. Each line is computed off of 2
             * touch points (_TAP_STATE.touchArray & e.TargetTouches). The angle
             * for each line (in radians) ranges from -Phi to +Phi (3.1416).
             * The difference in angle can tell us if the 2 finger swipes
             * are closer (scroll) to each otheror farther away(zoom/pinch).
             */
            var angle = WMKS.UTIL.TOUCH.touchAngleBwLines(
                  _TAP_STATE.touchArray[0], e.targetTouches[0],
                  _TAP_STATE.touchArray[1], e.targetTouches[1]);
            angle = Math.abs(angle);
            // WMKS.LOGGER.debug(_TAP_STATE.touchMoveCount + ', scale:'
            //    + e.scale + ', angle: ' + angle);
            if (angle === 0) {
               // One of the touch fingers did not move, missing angle, do nothing.
               return true;
            } else if (angle < 1 || angle > 5.2) {
               // This is a scroll. Coz the smaller angle is under 1 radian.

               // Update scrollCount & scrollSkipCount before we finalize as a scroll.
               this._updatePreScrollState(e.targetTouches[0]);

               // If the minimum sampling count isn't met, sample again to be accurate.
               if (_TAP_STATE.scrollCount >= WMKS.CONST.TOUCH.touchMoveSampleMinCount) {
                  // Now we are sure this is a scroll with 2 data samples.
                  this._showFeedback(_ELEMENTS.scrollFeedback, _TAP_STATE.firstTouch,
                     { 'position': 'left', 'offsetLeft': -50, 'offsetTop': -25 });
                  _TAP_STATE.opType = WMKS.CONST.TOUCH.OP.scroll;
                  _TAP_STATE.currentTouch = WMKS.UTIL.TOUCH.copyTouch(e.targetTouches[0]);
                  // WMKS.LOGGER.debug('This is a scroll.');
                  return false;
               }
            } else {
               // The smaller angle b/w the 2 lines are > about 1 radian, hence a pinch/zoom.
               _TAP_STATE.zoomCount++;

               // If the minimum sampling count isn't met, sample again to be accurate.
               if (_TAP_STATE.zoomCount >= WMKS.CONST.TOUCH.touchMoveSampleMinCount) {
                  // Now we are sure this is a zoom/pinch.
                  // WMKS.LOGGER.debug('This is a zoom / pinch');
                  this._resetTouchState();
                  return true;
               }
            }
            return true;
         }
      }
      // For cases we dont deal with let default handle kick in.
      return true;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _onTouchEnd
    *
    *    Called when a touch operation ends. The following happens here:
    *    1. If the touch state does not exist we do nothing & allow the default
    *       handling to kick in.
    *    2. If an opType has been detected, we terminate its state and
    *       send appropriate termination signals if any.
    *    3. If no opType is detected, then it could be a a single finger
    *       left click or a 2 finger right click. In each case, send the
    *       appropriate signal and in case of left click, store the time when
    *       the click was initated, so that double click could be detected.
    *
    *---------------------------------------------------------------------------
    */

   this._onTouchEnd = function(e) {
      var pos, touches;

      // Reset the drag timer if there is one.
      if (_dragTimer !== null) {
         clearTimeout(_dragTimer);
         _dragTimer = null;
      }
      if (_TAP_STATE.currentTouchFingers === -1) {
         return true;
      } else if (e.targetTouches.length === 0) {

         // Check if it is almost a scroll but user stopped scrolling after we detected.
         if (_TAP_STATE.skipScrollCount !== 0) {
            // WMKS.LOGGER.debug('Flag as scroll as there is a residual scroll data.');
            // Sometimes its already a scroll, won't hurt.
            _TAP_STATE.opType = WMKS.CONST.TOUCH.OP.scroll;
         }

         // Check against the known opTypes and at the last the unknown ones.
         switch(_TAP_STATE.opType) {
            case WMKS.CONST.TOUCH.OP.scroll:
               // WMKS.LOGGER.debug('scroll complete, send residual scroll & clear state.');
               this._sendResidualScrollEventMessage(e);
               this._resetTouchState();
               return false;
            case WMKS.CONST.TOUCH.OP.tap_twice:
               // WMKS.LOGGER.debug('Send tap twice with feedback: ' + _TAP_STATE.opType);
               this._sendTwoTouchEvent(_TAP_STATE.firstTouch, _TAP_STATE.currentTouch,
                                      WMKS.CONST.CLICK.left, e);
               this._resetTouchState();
               return false;
            case WMKS.CONST.TOUCH.OP.tap_3finger:
               // WMKS.LOGGER.debug('kb already handled, clear state.');
               this._resetTouchState();
               return false;
            case WMKS.CONST.TOUCH.OP.drag:
               // NOTE: Caret position is getting updated via the wts event.
               // for drag, send the mouse up at the end position
               touches = e.changedTouches;

               // There should only be one touch for dragging
               if (touches.length === 1) {
                  pos = this._applyZoomCorrectionToTouchXY(touches[0]);
                  _widget.sendMouseButtonMessage(pos, false, WMKS.CONST.CLICK.left);
               } else {
                  WMKS.LOGGER.warn('Unepxected touch# ' + touches.length
                     + ' changed in a drag operation!');
               }
               this._resetTouchState();
               return false;
            default:
               if (_TAP_STATE.currentTouchFingers === 1) {
                  // End a single tap - left click, send mousedown, mouseup together.
                  this._sendTwoTouchEvent(_TAP_STATE.firstTouch,
                                          _TAP_STATE.currentTouch,
                                          WMKS.CONST.CLICK.left, e);
                  this._resetTouchState(true);
                  return false;
               } else if (_TAP_STATE.currentTouchFingers === 2) {
                  // End a 2-finger tap, and if no opType is set this is a right-click.
                  // Send mousedown, mouseup together.
                  this._sendTwoTouchEvent(_TAP_STATE.firstTouch,
                                          _TAP_STATE.firstTouch,
                                          WMKS.CONST.CLICK.right, e);
                  this._resetTouchState();
                  return false;
               }
         }

         // Reset touch state as we are done with the gesture/tap, return false.
         this._resetTouchState();
         return false;
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _resetTouchState
    *
    *    Resets the touch state machine.
    *
    *---------------------------------------------------------------------------
    */

   this._resetTouchState = function(keepLastTouchState) {
      if (!keepLastTouchState) {
         _TAP_STATE.tapStartTime = null;
         _TAP_STATE.currentTouch = null;
      }
      _TAP_STATE.currentTouchFingers = -1;
      _TAP_STATE.opType = WMKS.CONST.TOUCH.OP.none;
      _TAP_STATE.firstTouch = null;
      _TAP_STATE.touchArray.length = 0;

      // Also reset the tap state clearing prev data.
      _TAP_STATE.touchMoveCount = 0;
      _TAP_STATE.skipScrollCount = 0;
      _TAP_STATE.scrollCount = 0;
      _TAP_STATE.zoomCount = 0;
   };


   /*
    *---------------------------------------------------------------------------
    * _sendTwoTouchEvent
    *
    *    This function sends the mousedown on first event and a mouseup on the
    *    second. This could be a brand new click or part of a two finger tap
    *---------------------------------------------------------------------------
    */

   this._sendTwoTouchEvent = function(firstTouch, secondTouch, button) {
      // Send modifier keys as well if any to support inputs like 'ctrl click'
      var pos = this._applyZoomCorrectionToTouchXY(firstTouch);
      _widget.sendMouseButtonMessage(pos, true, button);

      /*
      WMKS.LOGGER.warn('Zoom: ' +
         ' screenXY: ' + firstTouch.screenX + ',' + firstTouch.screenY +
         ' clientXY: ' + firstTouch.clientX + ',' + firstTouch.clientY +
         ' pageXY: '   + firstTouch.pageX   + ',' + firstTouch.pageY);
      */
      if (_TAP_STATE.opType === WMKS.CONST.TOUCH.OP.tap_twice) {
         _widget.sendMouseButtonMessage(pos, false, button);

         // Send the double click feedback with a throbing effect (use showTwice).
         this._showFeedback(_ELEMENTS.clickFeedback, firstTouch, {showTwice: true});
      } else {
         pos = this._applyZoomCorrectionToTouchXY(secondTouch);
         _widget.sendMouseButtonMessage(pos, false, button);
         this._showFeedback(_ELEMENTS.clickFeedback, firstTouch);
      }
      return true;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * addToRepositionQueue
    *
    *    This function adds the element to the reposition queue and upon
    *    rotation, the private function _repositionFloatingElementsOnRotation()
    *    ensures these elements are positioned within the canvas region.
    *
    *---------------------------------------------------------------------------
    */

   this.addToRepositionQueue = function(element) {
      if (element) {
         _repositionElements.push(element);
      }
   };

   /*
    *---------------------------------------------------------------------------
    * widgetRepositionOnRotation
    *
    *    Widgets need to be repositioned on orientation change. This change is one
    *    of two forms and needs correction only when they are shown.
    *    1. Landscape -> portrait: Widget may be to the right of the visible area.
    *    2. Portrait -> Landscape: Widget may be to the bottom of the visible area.
    *
    *    The logic used to reposition the widget, is if the widget is beyond the
    *    visible area, ensure that the widget is pulled back within the screen.
    *    The wdget is pulled back enough so the right/bottom is aleast 5px away.
    *
    *    TODO:
    *    1. Yet to handle when keyboard is popped out (use window.pageYOffset)
    *    2. Also watchout for a case when the screen is zoomed in. This is tricky
    *       as the zoom out kicks in during landscape to portrait mode.
    *    3. window.pageXOffset is not reliable due coz upon rotation the white patch
    *       on the right appears and causes some additional window.pageXOffset
    *       value. Best bet is to store this value before rotation and apply after
    *       orientation change kicks in.
    *
    *    Returns true if the widget was repositioned, false if nothing changed.
    *---------------------------------------------------------------------------
    */

   this.widgetRepositionOnRotation = function(widget) {
      var w, h, size, screenW, screenH, hasPositionChanged = false;

      if (!WMKS.BROWSER.isTouchDevice()) {
         WMKS.LOGGER.warn('Widget reposition ignored, this is not a touch device.');
         return false;
      }

      if (!widget || widget.is(':hidden')) {
         return false;
      }

      w = widget.width();
      h = widget.height();
      // Get the current screen size.
      screenW = window.innerWidth;
      screenH = window.innerHeight;

      if (WMKS.UTIL.TOUCH.isPortraitOrientation()) {
         if ((widget.offset().left + w) > screenW) {
            widget.offset({ left: String(screenW - w - 5) });
            hasPositionChanged = true;
         }
      } else {
         if ((widget.offset().top + h) > screenH) {
            widget.offset({ top: String(screenH - h - 5) });
            hasPositionChanged = true;
         }
      }

      return hasPositionChanged;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _repositionFloatingElementsOnRotation
    *
    *    Called after the default orientation changes are applied. These are
    *    specific for the feedback icons, input textbox, the cursor icon and
    *    any element that was requested by addToRepositionQueue().
    *
    *    Cursor icon is visible and so is the input textbox and they need to be
    *    moved inside the canvas to avoid the viewport from growing larger than
    *    the canvas size.
    *
    *    TODO: If cursor position changed due to orientation changes, send the
    *    newlocation. This is only a few pixels away, so not worrying about it
    *    for now.
    *
    *---------------------------------------------------------------------------
    */

   this._repositionFloatingElementsOnRotation = function(e) {
      var self = this,
          canvasOffset = _canvas.offset();
      // Move them inside the canvas region if they are outside.
      this.widgetRepositionOnRotation(_ELEMENTS.inputProxy);
      this.widgetRepositionOnRotation(_ELEMENTS.cursorIcon);

      // Position these hidden elements within the canvas.
      // NOTE: Problem is on iOS-6.1.2, but not on iOS-6.0.2, see bug: 996595#15
      // WMKS.LOGGER.trace(JSON.stringify(canvasOffset));
      _ELEMENTS.clickFeedback.offset(canvasOffset);
      _ELEMENTS.dragFeedback.offset(canvasOffset);
      _ELEMENTS.pulseFeedback.offset(canvasOffset);
      _ELEMENTS.scrollFeedback.offset(canvasOffset);

      // Now handle the list of elements added via addToRepositionQueue()
      $.each(_repositionElements, function(i, element) {
         // Just to be safe, we try this out here.
         try {
            // WMKS.LOGGER.info('reposition req: ' + element.attr('id')
            //    + element.attr('class'));
            self.widgetRepositionOnRotation(element);
         } catch (err) {
            WMKS.LOGGER.warn('Custom element reposition failed: ' + err);
         }
      });
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _onOrientationChange
    *
    *    Called when the device's orientation changes.
    *
    *
    *---------------------------------------------------------------------------
    */

   this._onOrientationChange = function(e) {
      var self = this;

      if (this._isInputInFocus()) {
         // Listen to resize event.
         $(window).one('resize', function(e) {
            /*
             * Trigger orientationchange event to adjust the screen size.
             * When the keyboard is opened, resize happens after orientationchange.
             */
            setTimeout(function() {
               $(window).trigger('orientationchange');
               // Reposition widgets and icons.
               self._repositionFloatingElementsOnRotation();
            }, 500);
         });
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _applyZoomCorrectionToTouchXY
    *
    *    Compute the position of a touch event relative to the canvas and apply
    *    the zoom value correction to get the right location on the canvas.
    *
    *    TODO: Apply native zoom correction for touch location.
    *
    *---------------------------------------------------------------------------
    */

   this._applyZoomCorrectionToTouchXY = function(touch) {
      if (touch === null) {
         WMKS.LOGGER.warn('Unexpected: touch is null.');
         return null;
      }
      // Compute the x,y based on scroll / browser zoom values as well.
      return _widget.getEventPosition(touch);
   };

   /*
    *---------------------------------------------------------------------------
    *
    * _showFeedback
    *
    *    This function displays the feedback object passed to it for a brief
    *    moment. The feedback indicator is not positioned directly over the
    *    click location, but centered around it. The feedback jQuery object
    *    is cached to avoid repeated lookups.
    *
    *    The animation mimics the View Client: show indicator at the location
    *    and hide after some time. jQuery animations suffered from 2 animation
    *    queue overload and gets corrupted easily. Hence we rely on CSS3
    *    animations which are also crisp as its executed in the browser space.
    *
    *    No matter what you do, the caret container is also made visible and is
    *    moved to the location of the click, where it stays.
    *
    *    feedback  - the jQuery object to animate
    *    touch     - touch object from which to derive coords
    *    inputArgs - input args that change position, offsetLeft, offsetTop.
    *---------------------------------------------------------------------------
    */

   this._showFeedback = function(feedback,touch, inputArgs) {
      var multiplier, padLeft, padTop, args = inputArgs || {};
      if (!touch || !feedback) {
         WMKS.LOGGER.trace('No touch value / feedback object, skip feedback.');
         return;
      }
      // Calculate if there is any input padding offsets to be applied.
      padLeft = args.offsetLeft || 0;
      padTop = args.offsetTop || 0;
      // Get multiplier width & height to position feedback element accordingly.
      multiplier = WMKS.UTIL.TOUCH.getRelativePositionMultiplier(args.position);
      feedback.css({
         'left': touch.pageX + padLeft + feedback.outerWidth() * multiplier.width,
         'top': touch.pageY + padTop + feedback.outerHeight() * multiplier.height
      });

      //  Just move the icon to the right place.
      this._moveCursor(touch.pageX, touch.pageY);
      /*
       * Since the same feedback indicator is used for both double tap and single tap,
       * we have to remove all animation classes there were applied.
       * This may change once we have unique elements for each of the feedback indicators.
       */
      feedback.removeClass('animate-feedback-indicator animate-double-feedback-indicator');
      if (args.showTwice) {
         setTimeout(function() {
            feedback.addClass('animate-double-feedback-indicator');
         }, 0);
      } else {
         setTimeout(function() {
            feedback.addClass('animate-feedback-indicator');
         }, 0);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _moveCursor
    *
    *    Repositions the fake caret to match the given touch's location. Since
    *    the 'tip' of the caret represents the click location, no centering is
    *    desired. Also makes the caret visible, as it is initially hidden.
    *
    *---------------------------------------------------------------------------
    */

   this._moveCursor = function(pageX, pageY) {
      if (_ELEMENTS.cursorIcon) {
         _ELEMENTS.cursorIcon.css({'left': pageX, 'top': pageY}).show();
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _sendKeyInput
    *
    *    Sends a key plus the manual modifiers entered on the extended keyboard.
    *    Simulates the keydowns and keyups which would happen if this were entered
    *    on a physical keyboard.
    *
    *---------------------------------------------------------------------------
    */

   this._sendKeyInput = function(key) {
      _widget.sendKeyInput(key);
   };

   /*
    *---------------------------------------------------------------------------
    *
    * onCaretPositionChanged
    *
    *    Handler for when the caret position changes.
    *
    *    We use this to dynamically position our invisible input proxy
    *    such that focus events for it don't cause us to move away from
    *    the screen offset from where we are typing.
    *
    *---------------------------------------------------------------------------
    */

   this.onCaretPositionChanged = function(pos) {
      var offsetX, offsetY;

      if (_ELEMENTS.inputProxy) {
         offsetX = pos.x;
         offsetY = pos.y;

         // Ensure the position is bound in the visible area.
         if (offsetX < window.pageXOffset) {
            offsetX = window.pageXOffset;
         }
         if (offsetY < window.pageYOffset) {
            offsetY = window.pageYOffset;
         }

         _ELEMENTS.inputProxy.offset({left: offsetX, top: offsetY});
         // WMKS.LOGGER.warn('left: ' + _ELEMENTS.inputProxy.offset().left
         //   + ', top: ' + _ELEMENTS.inputProxy.offset().left);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _keyboardDisplay
    *
    *    The event triggered when user wants to explicitly show or hide the
    *    keyboard.
    *    show - true shows keyboard, false flips it.
    *
    *---------------------------------------------------------------------------
    */

   this._keyboardDisplay = function(show) {
      // WMKS.LOGGER.debug('kb show: ' + (show? 'true' : 'false'));

      if (show) {
         _canvas.focus();
         _ELEMENTS.inputProxy.focus().select();
      } else {
         if (WMKS.BROWSER.isAndroid()) {
            // If its set to readonly & disabled keyboard focus goes away.
            _ELEMENTS.inputProxy.attr('readonly', true)
                                .attr('disabled', true);
            // Reset the readonly and disabled property values after some time.
            setTimeout(function() {
               _ELEMENTS.inputProxy.attr('readonly', false)
                                   .attr('disabled', false);
               _canvas.focus();
            }, 100);
         }
         /*
          * The only method that seems to work on iOS to close the keyboard.
          *
          * http://uihacker.blogspot.com/2011/10/javascript-hide-ios-soft-keyboard.html
          */
         document.activeElement.blur();
         _KEYBOARD.visible = false;
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _isInputInFocus
    *
    *    Returns the state if the input-proxy is in focus. When it does, the
    *    keyboard should be showing as well.
    *
    *    TODO: Verify if this function is needed?
    *
    *---------------------------------------------------------------------------
    */

   this._isInputInFocus = function() {
      return (document.activeElement.id === 'input-proxy');
   };

   /*
    *---------------------------------------------------------------------------
    *
    * _onInputFocus
    *
    *    Event handler for focus event on the input-proxy. Sync the keyboard
    *    highlight state here.
    *
    *---------------------------------------------------------------------------
    */

   this._onInputFocus = function(e) {
      this._sendUpdatedKeyboardState(true);
      // Hide this while we're typing otherwise we'll see a blinking caret.
      e.stopPropagation();
      return true;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _onInputBlur
    *
    *    Event handler for blur event on the input-proxy. Sync the keyboard
    *    highlight state here. Also save the timestamp for the blur event.
    *
    *---------------------------------------------------------------------------
    */

   this._onInputBlur = function(e) {
      this._sendUpdatedKeyboardState(false);
      e.stopPropagation();
      return true;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * _sendUpdatedKeyboardState
    *
    *    Helper function to set the keyboard launcher button highlight state
    *    based on the keyboard visibility.
    *
    *---------------------------------------------------------------------------
    */

   this._sendUpdatedKeyboardState = function(kbState) {
      _KEYBOARD.visible = kbState;
      _KEYBOARD.lastToggleTime = $.now();
      // Trigger keyboard toggle callback function.
      if ($.isFunction(_onToggle)) {
         _onToggle.call(this, ['KEYBOARD', _KEYBOARD.visible]);
      }
   };


   /****************************************************************************
    * Public Functions
    ***************************************************************************/


   /*
    *---------------------------------------------------------------------------
    *
    * toggleKeyboard
    *
    *    Called when the user wants to toggle on-screen keyboard visibility.
    *    show - flag to explicitly request keyboard show or hide.
    *    (When not toggling)
    *
    *---------------------------------------------------------------------------
    */

   this.toggleKeyboard = function(options) {
      if (!WMKS.BROWSER.isTouchDevice()) {
         WMKS.LOGGER.warn('Mobile keyboard not supported, this is not a touch device.');
         return;
      }

      if (!_ELEMENTS.inputProxy) {
         // Mobile keyboard toggler is not initialized. Ignore this reqest.
         return;
      }
      if (!!options && options.show === _KEYBOARD.visible) {
         // WMKS.LOGGER.debug('Keyboard is in the desired state.');
         return;
      }

      // Check in case the keyboard toggler request is not handled properly.
      if ($.now() - _KEYBOARD.lastToggleTime < WMKS.CONST.TOUCH.minKeyboardToggleTime) {
         /*
          * Seems like a spurious keyboard event as its occuring soon after the
          * previous toggle request. This can happen when the keyboard launcher
          * event handler is not implemented properly.
          *
          * Expected: The callback handler should prevent the default handler
          *           and return false.
          */
         WMKS.LOGGER.warn('Ignore kb toggle - Got request soon after focus/blur.');
         return;
      }

      // Show / hide keyboard based on new kBVisible value.
      this._keyboardDisplay(!_KEYBOARD.visible);
   };


   /*
    *---------------------------------------------------------------------------
    *
    * toggleTrackpad
    *
    *    Called when the user wants to toggle trackpad visibility.
    *
    *---------------------------------------------------------------------------
    */

   this.toggleTrackpad = function(options) {
      if (!WMKS.BROWSER.isTouchDevice()) {
         WMKS.LOGGER.warn('Trackpad not supported. Not a touch device.');
         return;
      }

      if (_ELEMENTS.trackpad) {
         // Set toggle callback function.
         options = $.extend({}, options, {
            toggleCallback: _onToggle
         });
         // Show / hide trackpad.
         _ELEMENTS.trackpad.toggle(options);
      }
   };



   /*
    *---------------------------------------------------------------------------
    *
    * toggleExtendedKeypad
    *
    *    Called when the user wants to toggle ExtendedKeypad visibility.
    *
    *---------------------------------------------------------------------------
    */

   this.toggleExtendedKeypad = function(options) {
      if (!WMKS.BROWSER.isTouchDevice()) {
         WMKS.LOGGER.warn('Extended keypad not supported. Not a touch device.');
         return;
      }

      if (_ELEMENTS.keypad) {
         // Set toggle callback function.
         options = $.extend({}, options, {
            toggleCallback: _onToggle
         });
         // Show / hide keypad.
         _ELEMENTS.keypad.toggle(options);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * installTouchHandlers
    *
    *    Install event handlers for touch devices.
    *
    *---------------------------------------------------------------------------
    */

   this.installTouchHandlers = function() {
      var self = this,
          container = _canvas.parent();

      if (!WMKS.BROWSER.isTouchDevice()) {
         WMKS.LOGGER.log('Not a touch device, and hence skip touch handler');
         return;
      }

      // Set css values to disable unwanted default browser behavior.
      _canvas.css({
         '-webkit-user-select':     'none',  /* disable cut-copy-paste */
         '-webkit-touch-callout':   'none'   /* disable callout, image save panel */
      });

      _canvas
         .bind('touchmove.wmks', function(e) {
            return self._onTouchMove(e.originalEvent);
         })
         .bind('touchstart.wmks', function(e) {
            return self._onTouchStart(e.originalEvent);
         })
         .bind('touchend.wmks', function(e) {
            return self._onTouchEnd(e.originalEvent);
         })
         .bind('orientationchange.wmks', function(event) {
            return self._onOrientationChange(event);
         })
         .bind('orientationchange.wmks.elements', function(e) {
            // Handler for repositioning cursor, feedback icons, input textbox
            // and elements added externally.
            self._repositionFloatingElementsOnRotation(e);
         });

      // Create touch feedbacks.
      _ELEMENTS.cursorIcon = $('<div/>')
         .addClass('feedback-container cursor-icon')
         .appendTo(container);
      _ELEMENTS.clickFeedback = $('<div/>')
         .addClass('feedback-container tap-icon')
         .appendTo(container);
      _ELEMENTS.dragFeedback = $('<div/>')
         .addClass('feedback-container drag-icon')
         .appendTo(container);
      _ELEMENTS.pulseFeedback = $('<div/>')
         .addClass('feedback-container pulse-icon')
         .appendTo(container);
      _ELEMENTS.scrollFeedback = $('<div/>')
         .addClass('feedback-container scroll-icon')
         .appendTo(container);

      /*
       * Double tapping or tapping on the feedback icons will inevitably involve
       * the user tapping the feedback container while it's showing. In such
       * cases capture and process touch events from these as well.
       */
      container
         .find('.feedback-container')
            .bind('touchmove.wmks', function(e) {
               return self._onTouchMove(e.originalEvent);
            })
            .bind('touchstart.wmks', function(e) {
               return self._onTouchStart(e.originalEvent);
            })
            .bind('touchend.wmks', function(e) {
               return self._onTouchEnd(e.originalEvent);
            });
   };


   /*
    *---------------------------------------------------------------------------
    *
    * disconnectEvents
    *
    *    Remove touch event handlers.
    *
    *---------------------------------------------------------------------------
    */

   this.disconnectEvents = function() {
      if (!_canvas) {
         return;
      }
      _canvas
         .unbind('orientationchange.wmks.icons')
         .unbind('orientationchange.wmks')
         .unbind('touchmove.wmks')
         .unbind('touchstart.wmks')
         .unbind('touchend.wmks');

      _canvas.find('.feedback-container')
         .unbind('touchmove.wmks')
         .unbind('touchstart.wmks')
         .unbind('touchend.wmks');
   };


   /*
    *---------------------------------------------------------------------------
    *
    * initializeMobileFeature
    *
    *    This function initializes the touch feature thats requested.
    *
    *---------------------------------------------------------------------------
    */

   this.initializeMobileFeature = function(type) {
      if (!WMKS.BROWSER.isTouchDevice()) {
         // Not a touch device, and hence will not initialize keyboard.
         return;
      }

      switch (type) {
         case WMKS.CONST.TOUCH.FEATURE.Trackpad:
            _ELEMENTS.trackpad = new WMKS.trackpadManager(_widget, _canvas);
            _ELEMENTS.trackpad.initialize();
            break;

         case WMKS.CONST.TOUCH.FEATURE.ExtendedKeypad:
            _ELEMENTS.keypad = new WMKS.extendedKeypad({
                                  widget : _widget,
                                  parentElement: _canvas.parent(),
                                  keyboardManager: _keyboardManager
                               });
            _ELEMENTS.keypad.initialize();
            break;

         case WMKS.CONST.TOUCH.FEATURE.SoftKeyboard:
            _ELEMENTS.inputProxy = this.initSoftKeyboard();
            break;
         default:
            WMKS.LOGGER.error('Invalid mobile feature type: ' + type);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * initSoftKeyboard
    *
    *    This function installs an input element and installs event handlers
    *    that will be used for reading device keyboard inputs and translating
    *    into the corresponding server messages.
    *
    *    NOTE: Chrome on android returns in-valid keyCodes for keyDown/keyPress.
    *
    *---------------------------------------------------------------------------
    */

   this.initSoftKeyboard = function() {
      var self = this,
          kbHandler = _keyboardManager;

      /*
       * Add a textbox that which on gaining focus launches the keyboard.
       * Listen for key events on the textbox. Append the textbox to the canvas
       * parent so that to make listening for input events easier.
       *
       * Adding this to the canvas parent is better than to the document.body
       * as we can eliminate the need to detect the parent's offset from
       * the screen while positioning the inputbox.
       *
       * To make the textbox functional and still hidden from the user by using
       * transparent background, really small size (1x1 px) textbox without
       * borders. To hide the caret, we use 0px font-size and disable any of
       * the default selectable behavior for copy-paste, etc.
       */
       var inputDiv = $('<input type="text"/>')
         .val(WMKS.CONST.KB.keyInputDefaultValue)
         .attr({
            'id':                   'input-proxy',
            'autocorrect':          'off',    /* disable auto correct */
            'autocapitalize':       'off' })  /* disable capitalizing 1st char in a word */
         .css({
            'font-size':            '1px',    /* make the caret really small */
            'width':                '1px',    /* Non-zero facilitates keyboard launch */
            'height':               '1px',
            'background-color':     'transparent',    /* removes textbox background */
            'color':                'transparent',    /* removes caret color */
            'box-shadow':           0,        /* remove box shadow */
            'outline':              'none',   /* remove orange outline - android chrome */
            'border':               0,        /* remove border */
            'padding':              0,        /* remove padding */
            'left':                 -1,       /* start outside the visible region */
            'top':                  -1,
            'overflow':             'hidden',
            'position':             'absolute' })
         .bind('blur',     function(e) { return self._onInputBlur(e); })
         .bind('focus',    function(e) { return self._onInputFocus(e); })
         .bind('input',    function(e) { return kbHandler.onInputTextSoftKb(e); })
         .bind('keydown',  function(e) { return kbHandler.onKeyDownSoftKb(e); })
         .bind('keyup',    function(e) { return kbHandler.onKeyUpSoftKb(e); })
         .bind('keypress', function(e) { return kbHandler.onKeyPressSoftKb(e); })
         .appendTo('body');

      if (WMKS.BROWSER.isIOS()) {
         // css to disable user select feature on iOS. Breaks android kb launch.
         inputDiv.css({
            '-webkit-touch-callout': 'none'    /* disable callout, image save panel */
         });
      }
      return inputDiv;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * removeMobileFeature
    *
    *    Based on the feature type, see if its initialized, if so, destroy and
    *    remove its references.
    *
    *---------------------------------------------------------------------------
    */

   this.removeMobileFeature = function(type) {
      switch (type) {
         case WMKS.CONST.TOUCH.FEATURE.Trackpad:
            if (_ELEMENTS.trackpad) {
               _ELEMENTS.trackpad.destroy();
               _ELEMENTS.trackpad = null;
            }
            break;

         case WMKS.CONST.TOUCH.FEATURE.ExtendedKeypad:
            if (_ELEMENTS.keypad) {
               _ELEMENTS.keypad.destroy();
               _ELEMENTS.keypad = null;
            }
            break;

         case WMKS.CONST.TOUCH.FEATURE.SoftKeyboard:
            if (_ELEMENTS.inputProxy) {
               if (_KEYBOARD.visible) {
                  // Input is in focus, and keyboard is up.
                  this.toggleKeyboard(false);
               }
               _ELEMENTS.inputProxy.remove();
               _ELEMENTS.inputProxy = null;
            }
            break;
         default:
            WMKS.LOGGER.error('Invalid mobile feature type: ' + type);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * destroy
    *
    *    Destroys the TouchHandler.
    *
    *    This will disconnect all (if active) and remove
    *    the widget from the associated element.
    *
    *    Consumers should call this before removing the element from the DOM.
    *
    *---------------------------------------------------------------------------
    */

   this.destroy = function() {
      this.disconnectEvents();
      this.removeMobileFeature(WMKS.CONST.TOUCH.FEATURE.SoftKeyboard);
      this.removeMobileFeature(WMKS.CONST.TOUCH.FEATURE.ExtendedKeypad);
      this.removeMobileFeature(WMKS.CONST.TOUCH.FEATURE.Trackpad);

      // Cleanup private variables.
      _widget = null;
      _canvas = null;
      _keyboardManager = null;
      _TAP_STATE = null;
      _ELEMENTS = null;
      _repositionElements.length = 0;
      _repositionElements = null;
   };

};


/*
 *------------------------------------------------------------------------------
 *
 * WMKS.UTIL.TOUCH
 *
 *    These util functions are very specific to this touch library and hence are
 *    created separately under this file. Anything thats more generic goes
 *    into WMKS.UTIL itself.
 *
 *    NOTE: Some of these functions use touch specific target data.
 *------------------------------------------------------------------------------
 */

WMKS.UTIL.TOUCH = {
   /*
    *---------------------------------------------------------------------------
    *
    * isLandscapeOrientation
    *
    *    Returns true if the device is in landscape orientation.
    *
    *---------------------------------------------------------------------------
    */

   isLandscapeOrientation: function() {
      return (window.orientation === 90 || window.orientation === -90);
   },

   /*
    *---------------------------------------------------------------------------
    *
    * isPortraitOrientation
    *
    *    Returns true if the device is in landscape orientation.
    *
    *---------------------------------------------------------------------------
    */

   isPortraitOrientation: function() {
      return (window.orientation === 0 || window.orientation === 180);
   },


   /*
    *---------------------------------------------------------------------------
    *
    * getRelativePositionMultiplier
    *
    *    This helper function provides the width and height multiplers for an
    *    element which multiplied to its width and height and added to the
    *    current location offset, will give the desired location as defined by
    *    the position string.
    *
    *    position - Possible values are: top/bottom + left/right or null.
    *               (Default center)
    *    Ex: position = 'top' --> returns {width: 0.5, height: -1}
    *
    *---------------------------------------------------------------------------
    */
   getRelativePositionMultiplier: function(position) {
      var wMultiply = -0.5, hMultiply = -0.5;
      if (!!position) {
         // Check for left or right positioning.
         if (position.indexOf('left') !== -1) {
            wMultiply = -1;
         } else if (position.indexOf('right') !== -1) {
            wMultiply = 1;
         }
         // Check for top or bottom positioning.
         if (position.indexOf('top') !== -1) {
            hMultiply = -1;
         } else if (position.indexOf('bottom') !== -1) {
            hMultiply = 1;
         }
      }
      // Return json response containing width and height multipliers.
      return {'width': wMultiply, 'height': hMultiply};
   },


   /*
    *---------------------------------------------------------------------------
    *
    * touchEqual
    *
    *    Convenience function to compare two touches and see if they correspond
    *    to precisely the same point.
    *
    *---------------------------------------------------------------------------
    */

   touchEqual: function(thisTouch, thatTouch) {
      return (thisTouch.screenX === thatTouch.screenX &&
              thisTouch.screenY === thatTouch.screenY);
   },


   /*
    *---------------------------------------------------------------------------
    *
    * touchDistance
    *
    *    Convenience function to get the pixel distance between two touches,
    *    in screen pixels.
    *
    *---------------------------------------------------------------------------
    */

   touchDistance: function(thisTouch, thatTouch) {
      return WMKS.UTIL.getLineLength((thatTouch.screenX - thisTouch.screenX),
                                     (thatTouch.screenY - thisTouch.screenY));
   },


   /*
    *---------------------------------------------------------------------------
    *
    * touchAngleBwLines
    *
    *    Convenience function to compute the angle created b/w 2 lines. Each of
    *    the two lines are defined by two touch points.
    *
    *---------------------------------------------------------------------------
    */

   touchAngleBwLines: function(l1p1, l1p2, l2p1, l2p2) {
      var a1 = Math.atan2(l1p1.screenY - l1p2.screenY,
                          l1p1.screenX - l1p2.screenX);
      var a2 = Math.atan2(l2p1.screenY - l2p2.screenY,
                          l2p1.screenX - l2p2.screenX);
      return a1 - a2;
   },


   /*
    *---------------------------------------------------------------------------
    *
    * copyTouch
    *
    *    Since touches are Objects, they need to be deep-copied. Note that we
    *    only copy the elements that we use for our own purposes, there are
    *    probably more.
    *
    *---------------------------------------------------------------------------
    */

   copyTouch: function(aTouch) {
      var newTouch = {
         'screenX': aTouch.screenX,
         'screenY': aTouch.screenY,
         'clientX': aTouch.clientX,
         'clientY': aTouch.clientY,
         'pageX'  : aTouch.pageX,
         'pageY'  : aTouch.pageY
      };
      return newTouch;
   },


   /*
    *---------------------------------------------------------------------------
    *
    * leftmostOf
    *
    *    Returns the touch event that contains the leftmost screen coords.
    *
    *---------------------------------------------------------------------------
    */

   leftmostOf: function(thisTouch, thatTouch) {
      return (thisTouch.screenX < thatTouch.screenX)? thisTouch : thatTouch;
   }
};

/*
 * wmks/widgetProto.js
 *
 *   WebMKS widget prototype for use with jQuery-UI.
 *
 *
 * A widget for displaying a remote MKS or VNC stream over a WebSocket.
 *
 * This widget can be dropped into any page that needs to display the screen
 * of a VM. It communicates over a WebSocket connection using VMware's
 * enhanced VNC protocol, which is compatible either with a VM's configured
 * VNC WebSocket port or with a proxied Remote MKS connection.
 *
 * A few options are provided to customize the behavior of the WebMKS:
 *
 *    * fitToParent (default: true)
 *      - Scales the guest screen size to fit within the WebMKS's
 *        allocated size. It's important to note that this does
 *        not resize the guest resolution.
 *
 *    * fitGuest (default: false)
 *      - Requests that the guest change its resolution to fit within
 *        the WebMKS's allocated size.  Compared with fitToParent, this
 *        does resize the guest resolution.
 *
 *    * useNativePixels (default: false)
 *      - Enables the use of native pixel sizes on the device. On iPhone 4+ or
 *        iPad 3+, turning this on will enable "Retina mode," which provides
 *        more screen space for the guest, making everything much smaller.
 *
 *    * allowMobileKeyboardInput (default: true)
 *      - Enables the use of a native on-screen keyboard for mobile devices.
 *        When enabled, the showKeyboard() and hideKeyboard() functions
 *        will pop up a keyboard that can be used to interact with the VM.
 *
 *    * allowMobileTrackpad (default: true)
 *      - Enables the use of trackpad on mobile devices for better accuracy
 *        compared to touch inputs. The trackpad dialog will not show-up when
 *        enabled, but will allow it to toggle (hide/show) by invoking the
 *        toggleTrackpad() function.
 *
 *    * allowMobileExtendedKeypad (default: true)
 *      - Enables the use of extended keypad on mobile devices to provision
 *        special keys: function keys, arrow keys, modifier keys, page
 *        navigation keys, etc. The keypad dialog will not show-up when
 *        enabled, but will allow it to toggle (hide/show) by invoking the
 *        toggleExtendedKeypad() function.
 *
 *    * useVNCHandshake (default: true)
 *      - Enables a standard VNC handshake. This should be used when the
 *        endpoint is using standard VNC authentication. Set to false if
 *        connecting to a proxy that authenticates through authd and does
 *        not perform a VNC handshake.
 *
 *    * sendProperMouseWheelDeltas (default: false)
 *      - Previous versions of the library would normalize mouse wheel event
 *        deltas into one of three values: [-1, 0, 1]. With this set to true
 *        the actual deltas from the browser are sent to the server.
 *
 *    * enableVorbisAudioClips (default: false)
 *      - Enables the use of the OGG-encapsulated Vorbis audio codec for providing
 *        audio data in the form of short clips suitable for browser consumption.
 *
 *    * enableOpusAudioClips (default: false)
 *      - Enables the use of the OGG-encapsulated Opus audio codec for providing
 *        audio data in the form of short clips suitable for browser consumption.
 *
 *    * enableAacAudioClips (default: false)
 *      - Enables the use of the AAC/MP4 audio codec for providing audio data in
 *        the form of short clips suitable for browser consumption.
 *
 * Handlers can also be registered to be triggered under certain circumstances:
 *
 *    * connecting
 *      - called when the websocket to the server is opened.
 *
 *    * connected
 *      - called when the websocket connection to the server has completed, the protocol
 *        has been negotiated and the first update from the server has been received, but
 *        not yet parsed, decoded or displayed.
 *
 *    * disconnected
 *      - called when the websocket connection to the server has been lost, either
 *        due to a normal shutdown, a dropped connection, or a failure to negotiate
 *        a websocket upgrade with a server. This handler is passed a map of information
 *        including a text reason string (if available) and a disconnection code from
 *        RFC6455.
 *
 *    * authenticationfailed
 *      - called when the VNC authentication procedure has failed. NOTE: this is only
 *        applicable if VNC style auth is used, other authentication mechanisms outside
 *        of VNC (such as authd tickets) will NOT trigger this handler if a failure
 *        occurs.
 *
 *    * error
 *      - called when an error occurs on the websocket. It is passed the DOM Event
 *        associated with the error.
 *
 *    * protocolerror
 *      - called when an error occurs during the parsing or a received VNC message, for
 *        example if the server sends an unsupported message type or an incorrectly
 *        formatted message.
 *
 *    * resolutionchanged
 *      - called when the resolution of the server's desktop has changed. It's passed
 *        the width and height of the new resolution.
 *
 *  Handlers should be registered using jQuery bind and the 'wmks' prefix:
 *
 *     .bind("wmksdisconnected", function(evt, info) {
 *           // Your handler code
 *      });
 */

WMKS.widgetProto = {};

WMKS.widgetProto.options = {
   fitToParent: false,
   fitGuest: false,
   useNativePixels: false,
   allowMobileKeyboardInput: true,
   useUnicodeKeyboardInput: false,
   useVNCHandshake: true,
   sendProperMouseWheelDeltas: false,
   allowMobileExtendedKeypad: true,
   allowMobileTrackpad: true,
   enableVorbisAudioClips: false,
   enableOpusAudioClips: false,
   enableAacAudioClips: false
};


/************************************************************************
 * Private Functions
 ************************************************************************/

/*
 *------------------------------------------------------------------------------
 *
 * _updatePixelRatio
 *
 *    Recalculates the pixel ratio used for displaying the canvas.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Stores new pixel ratio in this._pixelRatio.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._updatePixelRatio = function() {
   if (this.options.useNativePixels) {
      this._pixelRatio = window.devicePixelRatio || 1.0;
   } else {
      this._pixelRatio = 1.0;
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _updateMobileFeature
 *
 *    This function is a wrapper function that requests touch features to be
 *    enabled / disabled depending on the allow flag thats sent.
 *
 *    If allow flag is true, enable feature defined in type, else disable it.
 *
 *    List of supported features are:
 *
 *    MobileKeyboardInput:
 *       This function initializes the touch keyboard inputs based on the option
 *       setting. Shows/hides an offscreen <input> field to force the virtual
 *       keyboard to show up on tablet devices.
 *
 *    MobileExtendedKeypad
 *       This function initializes the Extended keypad which provides the user
 *       with special keys that are not supported on the MobileKeyboardInput.
 *
 *    MobileTrackpad:
 *       This function initializes the trackpad. The trackpad allows users to
 *       perform more precise mouse operations that are not possible with touch
 *       inputs.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Modifies DOM.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._updateMobileFeature = function(allow, type) {
   if (allow) {
      this._touchHandler.initializeMobileFeature(type);
   } else {
      this._touchHandler.removeMobileFeature(type);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _setOption
 *
 *    Changes a WMKS option.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Updates the given option in this.options.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._setOption = function(key, value) {
   $.Widget.prototype._setOption.apply(this, arguments);

   switch (key) {
      case 'fitToParent':
         this.rescaleOrResize(false);
         break;

      case 'fitGuest':
         this.rescaleOrResize(true);
         break;

      case 'useNativePixels':
         // Return if useNativePixels is true and browser indicates no-support.
         if (value && !WMKS.UTIL.isHighResolutionSupported()) {
            WMKS.LOGGER.warn('Browser/device does not support this feature.');
            return;
         }
         this._updatePixelRatio();
         if (this.options.fitGuest) {
            // Apply the resize for fitGuest mode.
            this.updateFitGuestSize(true);
         } else {
            this.rescaleOrResize(false);
         }
         break;

      case 'allowMobileKeyboardInput':
         this._updateMobileFeature(value, WMKS.CONST.TOUCH.FEATURE.SoftKeyboard);
         break;

      case 'allowMobileTrackpad':
         this._updateMobileFeature(value, WMKS.CONST.TOUCH.FEATURE.Trackpad);
         break;

      case 'allowMobileExtendedKeypad':
         this._updateMobileFeature(value, WMKS.CONST.TOUCH.FEATURE.ExtendedKeypad);
         break;
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * getCanvasPosition
 *
 *    Tracks the cursor throughout the document.
 *
 * Results:
 *    The current mouse position in the form { x, y }.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.getCanvasPosition = function (docX, docY) {
   var offset, scalePxRatio;

   if (isNaN(docX) || isNaN(docY)) {
      return { x: 0, y: 0 };
   }

   offset = this._canvas.offset();
   scalePxRatio = this._pixelRatio / this._scale;

   var x = Math.ceil((docX - offset.left) * scalePxRatio);
   var y = Math.ceil((docY - offset.top) * scalePxRatio);

   /*
    * Clamp bottom and right border.
    */
   var maxX = Math.ceil(this._canvas.width() * scalePxRatio) - 1;
   var maxY = Math.ceil(this._canvas.height() * scalePxRatio) - 1;
   x = Math.min(x, maxX);
   y = Math.min(y, maxY);

   /*
    * Clamp left and top border.
    */
   x = Math.max(x, 0);
   y = Math.max(y, 0);

   return { x: x, y: y };
};


/*
 *------------------------------------------------------------------------------
 *
 * getEventPosition
 *
 *    Gets the mouse event position within the canvas.
 *    Tracks the cursor throughout the document.
 *
 * Results:
 *    The current mouse position in the form { x, y }.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.getEventPosition = function (evt) {

   var docX, docY;

   if (evt.pageX || evt.pageY) {
      docX = evt.pageX;
      docY = evt.pageY;
   } else if (evt.clientX || evt.clientY) {
      docX = (evt.clientX +
              document.body.scrollLeft +
              document.documentElement.scrollLeft);
      docY = (evt.clientY +
              document.body.scrollTop +
              document.documentElement.scrollTop);
   } else {
      // ??
   }

   return this.getCanvasPosition(docX, docY);
};


/*
 *------------------------------------------------------------------------------
 *
 * _onMouseButton
 *
 *    Mouse event handler for 'mousedown' and 'mouseup' events.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends a VMWPointerEvent message to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._onMouseButton = function(event, down) {
   if (this._vncDecoder) {
      var evt = event || window.event;
      var pos = this.getEventPosition(evt);
      var bmask;

      /* evt.which is valid for all browsers except IE */
      if (evt.which) {
         /*
          * Firefox on Mac causes Ctrl + click to be a right click.  This kills
          * this ability to multi-select while clicking. Remap to left click in
          * this case. PR 878794 / 1085523.
          */
         if (WMKS.BROWSER.isMacOS() && WMKS.BROWSER.isGecko()
               && evt.ctrlKey && evt.button === 2) {
            WMKS.LOGGER.trace ('FF on OSX: Rewrite Ctrl+Right-click as Ctrl+Left-click.');
            bmask = 1 << 0;   // Left click.
         } else {
            bmask = 1 << evt.button;
         }
      } else {
         /* IE including 9 */
         bmask = (((evt.button & 0x1) << 0) |
                  ((evt.button & 0x2) << 1) |
                  ((evt.button & 0x4) >> 1));
      }
      return this.sendMouseButtonMessage(pos, down, bmask);
   }
};

/*
 *------------------------------------------------------------------------------
 *
 * sendMouseButtonMessage
 *
 *    Sends the mouse message for 'mousedown' / 'mouseup' at a given position.
 *
 *    Sends a VMWPointerEvent message to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.sendMouseButtonMessage = function(pos, down, bmask) {
   if (this._vncDecoder) {
      if (down) {
         this._mouseDownBMask |= bmask;
      } else {
         this._mouseDownBMask &= ~bmask;
      }
      /*
       * Send MouseMove event first, to ensure the pointer is at the
       * coordinates where the click should happen. This fixes the
       * erratic mouse behaviour when using touch devices to control
       * a Windows machine.
       */
      if (this._mousePosGuest.x !== pos.x || this._mousePosGuest.y !== pos.y) {
         // Send the mousemove message and update state.
         this.sendMouseMoveMessage(pos);
      }

      // WMKS.LOGGER.warn(pos.x + ',' + pos.y + ', down: ' + down + ', mask: ' + bmask);
      this._vncDecoder.onMouseButton(pos.x, pos.y, down, bmask);
   }
   return true;
};


/*
 *------------------------------------------------------------------------------
 *
 * _onMouseWheel
 *
 *    Mouse wheel handler. Normalizes the deltas from the event and
 *    sends it to the guest.
 *
 * Results:
 *    true, always.
 *
 * Side Effects:
 *    Sends data.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._onMouseWheel = function(event) {
   if (this._vncDecoder) {
      var evt = event || window.event;
      var pos = this.getEventPosition(evt),
          dx = this.options.sendProperMouseWheelDeltas ?
               Math.max(Math.min(event.wheelDeltaX, 127), -128) :
               Math.max(Math.min(event.wheelDeltaX, 1), -1),
          dy = this.options.sendProperMouseWheelDeltas ?
               Math.max(Math.min(event.wheelDeltaY, 127), -128) :
               Math.max(Math.min(event.wheelDeltaY, 1), -1);

      // Abstract the sending message part and updating state for reuse by
      // touchHandler.
      this.sendScrollMessage(pos, dx, dy);
   }

   // Suppress default actions
   event.stopPropagation();
   event.preventDefault();
   return false;
};


/*
 *------------------------------------------------------------------------------
 *
 * sendScrollMessage
 *
 *    Mouse wheel handler. Normalizes the deltas from the event and
 *    sends it to the guest.
 *
 *    Sends a VMWPointerEvent message to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.sendScrollMessage = function(pos, dx, dy) {
   if (this._vncDecoder) {
      /*
       * Send MouseMove event first, to ensure the pointer is at the
       * coordinates where the click should happen. This fixes the
       * erratic mouse behaviour when using touch devices to control
       * a Windows machine.
       */
      //
      // TODO: This is commented out for now as it seems to break browser scrolling.
      //       We may need to revisit this for iPad scrolling.
      //
      // if (this._mousePosGuest.x !== pos.x || this._mousePosGuest.y !== pos.y) {
      //   // Send the mousemove message and update state.
      //   this.sendMouseMoveMessage(pos);
      // }
      // WMKS.LOGGER.debug('scroll: ' + pos.x + ',' + pos.y + ', dx, dy: ' + dx + ',' + dy);
      this._vncDecoder.onMouseWheel(pos.x, pos.y, dx, dy);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _onMouseMove
 *
 *    Mouse event handler for 'mousemove' event.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends a VMWPointerEvent message to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._onMouseMove = function(event) {
   if (this._vncDecoder) {
      var evt = event || window.event;
      var pos = this.getEventPosition(evt);

      this.sendMouseMoveMessage(pos);
   }
   return true;
};


/*
 *------------------------------------------------------------------------------
 *
 * sendMouseMoveMessage
 *
 *    The mouse move message is sent to server and the state change is noted.
 *
 *    Sends a VMWPointerEvent message to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.sendMouseMoveMessage = function(pos) {
   if (this._vncDecoder) {
      this._vncDecoder.onMouseMove(pos.x, pos.y);
      this._mousePosGuest = pos;

      // Inform the input text field regarding the caret position change.
      this._touchHandler.onCaretPositionChanged(pos);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * _onBlur
 *
 *    Event handler for 'blur' event.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Releases all keys (calling cancelModifiers) and mouse buttons by checking
 *    and clearing their tracking variables (this._mouseDownBMask) and
 *    sending the appropriate VMWKeyEvent and VMWPointerEvent messages.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._onBlur = function(event) {
   if (this.connected) {
      /*
       * The user switched to a different element or window,
       * so release all keys.
       */

      // Cancel all modifiers that are held.
      this._keyboardManager.cancelModifiers();

      this._vncDecoder.onMouseButton(this._mousePosGuest.x,
                                     this._mousePosGuest.y,
                                     0,
                                     this._mouseDownBMask);
      this._mouseDownBMask = 0;
   }

   return true;
};


/*
 *------------------------------------------------------------------------------
 *
 * _onPaste
 *
 *    Clipboard paste handler.
 *
 * Results:
 *    true, always.
 *
 * Side Effects:
 *    Calls any user-defined callback with pasted text.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._onPaste = function(event) {
   var e = event.originalEvent;
   var self = this;
   if (e && e.clipboardData) {
      var items = e.clipboardData.items;
      if (items) {
         for (var i = 0; i < items.length; i++) {
            if (items[i].kind === 'string' && items[i].type === 'text/plain') {
               items[i].getAsString(function(txt) {
                  self._keyboardManager.processInputString(txt);
               });
            }
         }
      }
   }
   return true;
};


/************************************************************************
 * Public API
 ************************************************************************/

/*
 *------------------------------------------------------------------------------
 *
 * disconnectEvents
 *
 *    Disconnects the events from the owner document.
 *
 *    This can be called by consumers of WebMKS to disconnect all the events
 *    used to interact with the guest.
 *
 *    The consumer may need to carefully manage the events (for example, if
 *    there are multiple WebMKS's in play, some hidden and some not), and can
 *    do this with connectEvents and disconnectEvents.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Disconnects the event handlers from the events in the WMKS container.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.disconnectEvents = function() {
   /*
    * Remove our own handler for the 'keypress' event and the context menu.
    */
   this._canvas
      .unbind('contextmenu.wmks')
      .unbind('keydown.wmks')
      .unbind('keypress.wmks')
      .unbind('keyup.wmks')
      .unbind('mousedown.wmks')
      .unbind('mousewheel.wmks');

   this._canvas
      .unbind('mousemove.wmks')
      .unbind('mouseup.wmks')
      .unbind('blur.wmks');

   $(window)
      .unbind('blur.wmks');

   // Disconnect event handlers from the touch handler.
   if (this._touchHandler) {
      this._touchHandler.disconnectEvents();
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * connectEvents
 *
 *    Connects the events to the owner document.
 *
 *    This can be called by consumers of WebMKS to connect all the
 *    events used to interact with the guest.
 *
 *    The consumer may need to carefully manage the events (for example,
 *    if there are multiple WebMKS's in play, some hidden and some not),
 *    and can do this with connectEvents and disconnectEvents.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Connects the event handlers to the events in the WMKS container.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.connectEvents = function() {
   var self = this;

   /*
    * Paste event only works on the document (When using Browser's Edit->Paste)
    * This feature also has drawbacks.
    * 1. It only works on Chrome browser.
    * 2. Performing paste on any other element on this document causes the
    *    event to get triggered by bubbling up. Technically the bubbling up
    *    should be enabled only if the element can handle paste in the first
    *    place (i.e., only if its textbox / textarea or an element with
    *    contenteditable set to true.)
    *
    * Due to above limitations, this is disabled. PR: 1091032
    */
   //$(this.element[0].ownerDocument)
   //   .bind('paste.wmks', function(e) { return self._onPaste(e); });

   this._canvas
      .bind('mousemove.wmks', function(e) { return self._onMouseMove(e); })
      .bind('mouseup.wmks', function(e) { return self._onMouseButton(e, 0); })
      .bind('blur.wmks', function(e) { return self._onBlur(e); });

   /*
    * We have to register a handler for the 'keypress' event as it is the
    * only one reliably reporting the key pressed. It gives character
    * codes and not scancodes however.
    */
   this._canvas
      .bind('contextmenu.wmks', function(e) { return false; })
      .bind('mousedown.wmks', function(e) { return self._onMouseButton(e, 1); })
      .bind('mousewheel.wmks', function(e) { return self._onMouseWheel(e); })
      .bind('keydown.wmks', function(e) {
         return self._keyboardManager.onKeyDown(e);
      })
      .bind('keypress.wmks', function(e) {
         return self._keyboardManager.onKeyPress(e);
      })
      .bind('keyup.wmks', function(e) {
         return self._keyboardManager.onKeyUp(e);
      });

   $(window)
      .bind('blur.wmks', function(e) { return self._onBlur(e); });

   // Initialize touch input handlers if applicable.
   this._touchHandler.installTouchHandlers();

};


/*
 *------------------------------------------------------------------------------
 *
 * maxFitWidth
 *
 *    This calculates the maximum screen size that could fit, given the
 *    currently allocated scroll width. Consumers can use this with
 *    maxFitHeight() to request a resolution change in the guest.
 *
 *    This value takes into account the pixel ratio on the device, if
 *    useNativePixels is on.
 *
 * Results:
 *    The maximum screen width given the current width of the WebMKS.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.maxFitWidth = function() {
   return this.element[0].scrollWidth * this._pixelRatio;
};


/*
 *------------------------------------------------------------------------------
 *
 * maxFitHeight
 *
 *    This calculates the maximum screen size that could fit, given the
 *    currently allocated scroll height. Consumers can use this with
 *    maxFitWidth() to request a resolution change in the guest.
 *
 *    This value takes into account the pixel ratio on the device, if
 *    useNativePixels is on.
 *
 * Results:
 *    The maximum screen height given the current height of the WebMKS.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.maxFitHeight = function() {
   return this.element[0].scrollHeight * this._pixelRatio;
};


/*
 *------------------------------------------------------------------------------
 *
 * hideKeyboard
 *
 *    Hides the keyboard on a mobile device.
 *
 *    If allowMobileKeyboardInput is on, this command will hide the
 *    mobile keyboard if it's currently shown.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Moves browser focus away from input widget and updates state.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.hideKeyboard = function(args) {
   args = args || {};
   args.show = false;

   this.toggleKeyboard(args);
};


/*
 *------------------------------------------------------------------------------
 *
 * showKeyboard
 *
 *    Shows the keyboard on a mobile device.
 *
 *    If allowMobileKeyboardInput is on, this command will display the
 *    mobile keyboard.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Moves browser focus to input widget and updates state.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.showKeyboard = function(args) {
   args = args || {};
   args.show = true;

   this.toggleKeyboard(args);
};



/*
 *------------------------------------------------------------------------------
 *
 * toggleKeyboard
 *
 *    toggles the keyboard visible state on a mobile device.
 *
 *    If allowMobileKeyboardInput is on, this command will toggle the
 *    mobile keyboard from show to hide or vice versa.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Moves browser focus to input widget and updates state.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.toggleKeyboard = function(args) {
   if (this.options.allowMobileKeyboardInput) {
      this._touchHandler.toggleKeyboard(args);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * toggleTrackpad
 *
 *    Show/Hide the trackpad dialog on a mobile device.
 *
 *    If allowMobileTrackpad is on, this command will toggle the
 *    trackpad dialog.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.toggleTrackpad = function(options) {
   if (this.options.allowMobileTrackpad) {
      this._touchHandler.toggleTrackpad(options);
   }
};



/*
 *------------------------------------------------------------------------------
 *
 * toggleExtendedKeypad
 *
 *    Show/Hide the extended keypad dialog on a mobile device when the flag:
 *    allowMobileExtendedKeypad is set, this command will toggle the dialog.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.toggleExtendedKeypad = function(options) {
   if (this.options.allowMobileExtendedKeypad) {
      this._touchHandler.toggleExtendedKeypad(options);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * sendInputString
 *
 *    Sends a unicode string as keyboard input to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.sendInputString = function(str) {
   /*
    * Explicitly process newline as we are sending it as a string.
    * onPaste on the other hand only does not need to set this flag.
    */
   this._keyboardManager.processInputString(str, true);
};


/*
 *------------------------------------------------------------------------------
 *
 * sendKeyCodes
 *
 *    Sends a series of special key codes to the VM.
 *
 *    This takes an array of special key codes and sends keydowns for
 *    each in the order listed. It then sends keyups for each in
 *    reverse order.
 *
 *    Keys usually handled via keyPress are also supported: If a keycode
 *    is negative, it is interpreted as a Unicode value and sent to
 *    keyPress. However, these need to be the final key in a combination,
 *    as they will be released immediately after being pressed. Only
 *    letters not requiring modifiers of any sorts should be used for
 *    the latter case, as the keyboardMapper may break the sequence
 *    otherwise. Mixing keyDown and keyPress handlers is semantically
 *    incorrect in JavaScript, so this separation is unavoidable.
 *
 *    This can be used to send key combinations such as
 *    Control-Alt-Delete, as well as Ctrl-V to the guest, e.g.:
 *    [17, 18, 46]      Control-Alt-Del
 *    [17, 18, 45]      Control-Alt-Ins
 *    [17, -118]        Control-v (note the lowercase 'v')
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Sends keyboard data to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.sendKeyCodes = function(keyCodes) {
   var i, keyups = [];

   for (i = 0; i < keyCodes.length; i++) {
      var keyCode = keyCodes[i];

      if (keyCode > 0) {
         this._keyboardManager.sendKey(keyCode, false, false);
         /*
          * Keycode 20 is 'special' - it's the Javascript keycode for the Caps Lock
          * key. In regular usage on Mac OS the browser sends a down when the caps
          * lock light goes on and an up when it goes off. The key handling code
          * special cases this, so if we fake both a down and up here we'll just
          * flip the caps lock state right back to where we started (if this is
          * a Mac OS browser platform).
          */
         if (!(keyCode === 20) || WMKS.BROWSER.isMacOS()) {
            keyups.push(keyCode);
         }
      } else if (keyCode < 0) {
         this._keyboardManager.sendKey(0 - keyCode, true, true);
      }
   }

   for (i = keyups.length - 1; i >= 0; i--) {
      this._keyboardManager.sendKey(keyups[i], true, false);
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * rescale
 *
 *    Rescales the WebMKS to match the currently allocated size.
 *
 *    This will update the placement and size of the canvas to match
 *    the current options and allocated size (such as the pixel
 *    ratio).  This is an external interface called by consumers to
 *    force an update on size changes, internal users call
 *    rescaleOrResize(), below.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Updates this._scale and modifies the canvas size and position.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.rescale = function() {
   this.rescaleOrResize(true);
};


/*
 *------------------------------------------------------------------------------
 *
 * updateFitGuestSize
 *
 *    This is a special function that should be used only with fitGuest mode.
 *    This function is used the first time a user initiates a connection.
 *    The fitGuest will not work until the server sends back a CAPS message
 *    indicating that it can handle resolution change requests.
 *
 *    This is also used with toggling useNativePixels options in fitGuest mode.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    None.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.updateFitGuestSize = function(compareAgainstGuestSize) {
   var newParentW = this.element.width() * this._pixelRatio,
       newParentH = this.element.height() * this._pixelRatio;

   // Return if its not fitGuest or when the old & new width/height are same
   // when the input param compareAgainstGuestSize is set.
   if (!this.options.fitGuest
         || (compareAgainstGuestSize
            && this._guestWidth === newParentW
            && this._guestWidth === newParentH)) {
      return;
   }
   // New resolution based on pixelRatio in case of fitGuest.
   this._vncDecoder.onRequestResolution(newParentW, newParentH);
};


/*
 *------------------------------------------------------------------------------
 *
 * rescaleOrResize
 *
 *    Rescales the WebMKS to match the currently allocated size, or
 *    alternately fits the guest to match the current canvas size.
 *
 *    This will either:
 *         update the placement and size of the canvas to match the
 *         current options and allocated size (such as the pixel
 *         ratio).  This is normally called internally as the result
 *         of option changes, but can be called by consumers to force
 *         an update on size changes
 *    Or:
 *         issue a resolutionRequest command to the server to resize
 *         the guest to match the current WebMKS canvas size.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Updates this._scale and modifies the canvas size and position.
 *    Possibly triggers a resolutionRequest message to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.rescaleOrResize = function(tryFitGuest) {
   var newScale = 1.0, x = 0, y = 0;
   var parentWidth = this.element.width(),
       parentHeight = this.element.height();

   this._canvas.css({
      width: this._guestWidth / this._pixelRatio,
      height: this._guestHeight / this._pixelRatio
   });

   var width = this._canvas.width();
   var height = this._canvas.height();

   if (this.transform !== null &&
       !this.options.fitToParent &&
       !this.options.fitGuest) {

      // scale = 1.0, x = 0, y = 0;

   } else if (this.transform !== null &&
              this.options.fitToParent) {
      var horizScale = parentWidth / width,
      vertScale = parentHeight / height;

      x = (parentWidth - width) / 2;
      y = (parentHeight - height) / 2;
      newScale = Math.max(0.1, Math.min(horizScale, vertScale));

   } else if (this.options.fitGuest && tryFitGuest) {
      // fitGuest does not rely on this.transform. It relies on the size
      // provided by the wmks consumer. However, it does have to update the
      // screen size when using high resolution mode.
      this.updateFitGuestSize(true);
   } else if (this.transform === null) {
      WMKS.LOGGER.warn("No scaling support");
   }

   if (this.transform !== null) {
      if (newScale !== this._scale) {
         this._scale = newScale;
         this._canvas.css(this.transform, "scale(" + this._scale + ")");
      }

      if (x !== this._x || y !== this._y) {
         this._x = x;
         this._y = y;
         this._canvas.css({top: y, left: x});
      }
   }
};


/*
 *------------------------------------------------------------------------------
 *
 * disconnect
 *
 *    Disconnects the WebMKS.
 *
 *    Consumers should call this when they are done with the WebMKS
 *    component. Destroying the WebMKS will also result in a disconnect.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Disconnects from the server and tears down the WMKS UI.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.disconnect = function() {
   this._vncDecoder.disconnect();
   this.disconnectEvents();

   // Cancel any modifiers that were inflight.
   this._keyboardManager.cancelModifiers();
};


/*
 *------------------------------------------------------------------------------
 *
 * connect
 *
 *    Connects the WebMKS to a WebSocket URL.
 *
 *    Consumers should call this when they've placed the WebMKS and
 *    are ready to start displaying a stream from the guest.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Connects to the server and sets up the WMKS UI.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.connect = function(url) {
   this.disconnect();
   this._vncDecoder.connect(url);
   this.connectEvents();
};


/*
 *------------------------------------------------------------------------------
 *
 * destroy
 *
 *    Destroys the WebMKS.
 *
 *    This will disconnect the WebMKS connection (if active) and remove
 *    the widget from the associated element.
 *
 *    Consumers should call this before removing the element from the DOM.
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Disconnects from the server and removes the WMKS class and canvas
 *    from the HTML code.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.destroy = function() {
   this.disconnect();
   this.element.removeClass("wmks");

   // Remove all event handlers and destroy the touchHandler.
   this._touchHandler.destroy();
   this._touchHandler = null;

   this._canvas.remove();
   if (this._backCanvas) {
      this._backCanvas.remove();
   }
   if (this._blitTempCanvas) {
      this._blitTempCanvas.remove();
   }

   $.Widget.prototype.destroy.call(this);
};


/*
 *------------------------------------------------------------------------------
 *
 * requestElementReposition
 *
 *    Reposition html element so that it fits within the canvas region. This
 *    is used to reposition upon orientation change for touch devices. This
 *    function can be used once to perform the reposition immediately or can
 *    push the element to a queue that takes care of automatically performing
 *    the necessary repositioning upon orientation.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto.requestElementReposition = function(element, addToQueue) {
   if (addToQueue) {
      // Add the element to a queue. Queue elements will be repositioned upon
      // orientation change.
      this._touchHandler.addToRepositionQueue(element);
      return;
   }
   // Just perform repositioning once.
   this._touchHandler.widgetRepositionOnRotation(element);
};


/************************************************************************
 * jQuery instantiation
 ************************************************************************/

/*
 *------------------------------------------------------------------------------
 *
 * _create
 *
 *    jQuery-UI initialisation function, called by $.widget()
 *
 * Results:
 *    None.
 *
 * Side Effects:
 *    Injects the WMKS canvas into the WMKS container HTML, sets it up
 *    and connects to the server.
 *
 *------------------------------------------------------------------------------
 */

WMKS.widgetProto._create = function() {
   var self = this;

   // Initialize our state.
   this._mouseDownBMask = 0;
   this._mousePosGuest = { x: 0, y: 0 };
   this._scale = 1.0;
   this._pixelRatio = 1.0;
   this.connected = false;

   this._canvas = WMKS.UTIL.createCanvas(true)
      .prop({
         id:         'mainCanvas',
         tabindex:   1
      });
   this._backCanvas = WMKS.UTIL.createCanvas(true);
   this._blitTempCanvas = WMKS.UTIL.createCanvas(true);

   this.element
      .addClass("wmks")
      .append(this._canvas);

   var checkProperty = function (prop) {
      return typeof self._canvas[0].style[prop] !== 'undefined' ? prop : null;
   };

   this.transform = (checkProperty('transform') ||
                     checkProperty('WebkitTransform') ||
                     checkProperty('MozTransform') ||
                     checkProperty('msTransform') ||
                     checkProperty('OTransform'));

   this._vncDecoder = new WMKS.VNCDecoder({
      useVNCHandshake: this.options.useVNCHandshake,
      useUnicodeKeyboardInput: this.options.useUnicodeKeyboardInput,
      enableVorbisAudioClips: this.options.enableVorbisAudioClips,
      enableOpusAudioClips: this.options.enableOpusAudioClips,
      enableAacAudioClips: this.options.enableAacAudioClips,
      canvas: this._canvas[0],
      backCanvas: this._backCanvas[0],
      blitTempCanvas: this._blitTempCanvas[0],
      onConnecting: function() {
         self._trigger("connecting");
      },
      onConnected: function() {
         self.connected = true;
         self._trigger("connected");

         // Clear any keyboard specific state that was held earlier.
         self._keyboardManager.clearState();
         self.rescaleOrResize(true);
      },
      onDisconnected: function(reason, code) {
         self.connected = false;
         self._trigger("disconnected", 0, {'reason': reason, 'code': code});
      },
      onAuthenticationFailed: function() {
         self._trigger("authenticationFailed");
      },
      onError: function(err) {
         self._trigger("error", 0, err);
      },
      onProtocolError: function() {
         self._trigger("protocolError");
      },
      onNewDesktopSize: function(width, height) {
         self._guestWidth = width;
         self._guestHeight = height;
         var attrJson = {
            width: width,
            height: height
         };
         var cssJson = {
            width: width / self._pixelRatio,
            height: height / self._pixelRatio
         };
         self._canvas
            .attr(attrJson)
            .css(cssJson);

         attrJson.y = height;
         self._backCanvas
            .attr(attrJson)
            .css(cssJson);

         self._blitTempCanvas
            .attr(attrJson)
            .css(cssJson);

         self._trigger("resolutionchanged", null, attrJson);
         self.rescaleOrResize(false);
      },
      onKeyboardLEDsChanged: function(leds) {
         self._trigger("keyboardLEDsChanged", 0, leds);
      },
      onHeartbeat: function(interval) {
         self._trigger("heartbeat", 0, interval);
      },
      onCopy: function(data) {
         if (typeof data !== 'string') {
            WMKS.LOGGER.debug('data format is not string, ignore.');
            return false;
         }
         self._trigger("copy", 0, data);
         return true;
      },
      onAudio: function(audioInfo) {
         self._trigger("audio", 0, [audioInfo]);
      }
   });

   // Initialize the keyboard input handler.
   this._keyboardManager = new WMKS.KeyboardManager({
      vncDecoder: this._vncDecoder
   });

   // Initialize the touch handler
   this._touchHandler = new WMKS.TouchHandler({
      widgetProto: this,
      canvas: this._canvas,
      keyboardManager: this._keyboardManager,
      onToggle: function(data) {
         self._trigger("toggle", 0, data);
      }
   });

   this._updatePixelRatio();
   /*
    * Send in a request to set the new resolution size in case of fitGuest mode.
    * This avoids the need to invoke the resize after successful connection.
    */
   this.updateFitGuestSize();

   // Initialize touch features if they are enabled.
   this._updateMobileFeature(this.options.allowMobileKeyboardInput,
                             WMKS.CONST.TOUCH.FEATURE.SoftKeyboard);
   this._updateMobileFeature(this.options.allowMobileTrackpad,
                             WMKS.CONST.TOUCH.FEATURE.Trackpad);
   this._updateMobileFeature(this.options.allowMobileExtendedKeypad,
                             WMKS.CONST.TOUCH.FEATURE.ExtendedKeypad);
};
/*
 *------------------------------------------------------------------------------
 *
 * wmks/dialogManager.js
 *
 *   The base controller of popup dialog.
 *
 *------------------------------------------------------------------------------
 */

(function() {
   'use strict';

   WMKS.dialogManager = function() {
      this.dialog = null;
      this.visible = false;
      this.lastToggleTime = 0;
      this.options = {
         name: 'DIALOG_MGR',     // Should be inherited.
         toggleCallback: function(name, toggleState) {},
        /*
         * The minimum wait time before toggle can repeat. This is useful to
         * ensure we do not toggle twice due to our usage of the close event.
         */
        minToggleTime: 50
      };
   };


   /*
    *---------------------------------------------------------------------------
    *
    * setOption
    *
    *    Set value of the specified option.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.setOption = function(key, value) {
      this.options[key] = value;

      return this;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * setOptions
    *
    *    Set values of a set of options.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.setOptions = function(options) {
      var key;

      for (key in options) {
         this.setOption(key, options[key]);
      }

      return this;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * initialize
    *
    *    Create the dialog and initialize it.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.initialize = function(options) {
      this.options = $.extend({},
         this.options,
         options);

      this.dialog = this.create();
      this.init();
   };


   /*
    *---------------------------------------------------------------------------
    *
    * destroy
    *
    *    Remove the dialog functionality completely.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.destroy = function() {
      if (!!this.dialog) {
         this.disconnect();
         this.remove();
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * create
    *
    *    Construct the dialog.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.create = function() {
      // For subclass to override.
      return null;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * init
    *
    *    Initialize the dialog, e.g. register event handlers.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.init = function() {
      // For subclass to override.
   };


   /*
    *---------------------------------------------------------------------------
    *
    * disconnect
    *
    *    Cleanup data and events.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.disconnect = function() {
      // For subclass to override.
   };


   /*
    *---------------------------------------------------------------------------
    *
    * remove
    *
    *    Destroy the dialog.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.remove = function() {
      var dialog = this.dialog;

      if (!!dialog) {
         // Destroy the dialog and remove it from DOM.
         dialog
            .dialog('destroy')
            .remove();
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * toggle
    *
    *    Show / hide the dialog. If the options comes with a launcher element
    *    then upon open / close, send an event to the launcher element.
    *
    *    Ex: For Blast trackpad:
    *          options = {toggleCallback: function(name, toggleState) {}}
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.toggle = function(options) {
      var dialog = this.dialog,
          show = !this.visible,
          isOpen;

      if (!dialog) {
         return;
      }

      if (!!options) {
         this.setOptions(options);
      }

      isOpen = dialog.dialog('isOpen');
      if (show === isOpen) {
         return;
      }

      if ($.now() - this.lastToggleTime < this.options.minToggleTime) {
         // WMKS.LOGGER.debug('Ignore toggle time.');
         return;
      }

      if (isOpen) {
         // Hide dialog.
         this.close();
      } else {
         // Show dialog.
         this.open();
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * sendUpdatedState
    *
    *    Helper function to maintain the state of the widget and last toggle
    *    time. If the toggleCallback option is set, we invoke a callback for the
    *    state change (dialog state: open / close)
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.sendUpdatedState = function(state) {
      this.visible = state;
      this.lastToggleTime = $.now();

      // Triggers the callback event to toggle the selection.
      if ($.isFunction(this.options.toggleCallback)) {
         this.options.toggleCallback.call(this, [this.options.name, state]);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * open
    *
    *    Show the dialog. Send update state.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.open = function() {
      if (!!this.dialog) {
         this.visible = !this.visible;
         this.dialog.dialog('open');
         this.sendUpdatedState(true);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * close
    *
    *    Hide the dialog. Send update state.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.close = function() {
      if (!!this.dialog) {
         this.visible = !this.visible;
         this.dialog.dialog('close');
         this.sendUpdatedState(false);
      }
   };

}());
/*
 *------------------------------------------------------------------------------
 *
 * wmks/extendedKeypad.js
 *
 *    The controller of extended keypad widget. This widget provides special
 *    keys that are generally not found on soft keyboards on touch devices.
 *
 *    Some of these keys include: Ctrl, Shift, Alt, Arrow keys, Page navigation
 *    Win, function keys, etc.
 *
 *    TODO:
 *    This version of the extended keypad will have fixed number of keys that it
 *    supports, and it will be nice to extend the functionality to make these
 *    keys configurable.
 *
 *------------------------------------------------------------------------------
 */

(function() {
   'use strict';

   // Constructor of this class.
   WMKS.extendedKeypad = function(params) {
      if (!params || !params.widget || !params.keyboardManager) {
         return null;
      }

      // Call constructor so dialogManager's params are included here.
      WMKS.dialogManager.call(this);

      this._widget = params.widget;
      this._kbManager = params.keyboardManager;
      this._parentElement = params.parentElement;

      // Store down modifier keys.
      this.manualModifiers = [];

      $.extend(this.options,
               {
                  name: 'EXTENDED_KEYPAD'
               });
      WMKS.LOGGER.warn('Key pad : ' + this.options.name);
   };

   // Inherit from dialogManager.
   WMKS.extendedKeypad.prototype = new WMKS.dialogManager();

   /*
    *---------------------------------------------------------------------------
    *
    * create
    *
    *    This function creates the control pane dialog with the modifier
    *    and extended keys.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.extendedKeypad.prototype.create = function() {
      var self = this,
          ctrlPaneHolder = $('<div id="ctrlPanePopup"></div>');
      // Load the control pane popup with control icons and their key events.
      ctrlPaneHolder.append(this.getControlPaneHtml());

      // Initialize the popup for opening later.
      /*
       * Adding the show or hide effect makes the dialog not draggable on iOS 5.1
       * device. This could be a bug in Mobile Safari itself? For now we get rid
       * of the effects. TODO: Do a check of the iOS type and add the effects
       * back based on the version.
       */
      ctrlPaneHolder.dialog({
         autoOpen: false,
         closeOnEscape: true,
         resizable: false,
         position: {my: 'center', at: 'center', of: this._parentElement},
         zIndex: 1000,
         dialogClass: 'ctrl-pane-wrapper',
         close: function(e) {
            /*
             * Clear all modifiers and the UI state so keys don't
             * stay 'down' when the ctrl pane is dismissed. PR: 983693
             * NOTE: Need to pass param as true to apply for softKB case.
             */
            self._kbManager.cancelModifiers(true);
            ctrlPaneHolder.find('.ab-modifier-key.ab-modifier-key-down')
               .removeClass('ab-modifier-key-down');

            // Hide the keypad.
            self.toggleFunctionKeys(false);
            self.sendUpdatedState(false);
            return true;
         },
         dragStop: function(e) {
            self.positionFunctionKeys();
         }
      });

      return ctrlPaneHolder;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * init
    *
    *    This function initializes the control pane dialog with the necessary
    *    event listeners.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.extendedKeypad.prototype.init = function() {
      var self = this,
          ctrlPaneHolder = this.dialog,
          keyInputHandler = function(e) {
            var key = parseInt($(this).attr('abkeycode'), 10);
            self._kbManager.handleSoftKb(key, false);
            return false;
         };


      // Initialize modifier key functionality.
      ctrlPaneHolder.find('.ab-modifier-key').on('touchstart', function(e) {
         // compute if key is pressed now.
         var isDown = $(this).hasClass('ab-modifier-key-down');
         var key = parseInt($(this).attr('abkeycode'), 10);
         if (isNaN(key)) {
            WMKS.LOGGER.debug('Got NaN as modifier key. Skipping it.');
            return false;
         }

         // Toggle highlight class for modifiers keys.
         $(this).toggleClass('ab-modifier-key-down');

         // Currently in down state, send isUp = true.
         self._kbManager.updateModifiers(key, isDown);
         return false;
      });

      // Toggle function keys also toggles the key highlighting.
      ctrlPaneHolder.find('#fnMasterKey').off('touchstart').on('touchstart', function(e) {
         self.toggleFunctionKeys();
         return false;
      });

      // Initialize extended key functionality.
      ctrlPaneHolder.find('.ab-extended-key').off('touchstart')
         .on('touchstart', keyInputHandler);

      // Provide a flip effect to the ctrl pane to show more keys.
      ctrlPaneHolder.find('.ab-flip').off('touchstart').on('touchstart', function() {
         $(this).parents('.flip-container').toggleClass('perform-flip');
         // Hide the keypad if its open.
         self.toggleFunctionKeys(false);
         return false;
      });

      // Add an id to the holder widget
      ctrlPaneHolder.parent().prop('id', 'ctrlPaneWidget');

      // Attach the function key pad to the canvas parent.
      ctrlPaneHolder.parent().parent().append(this.getFunctionKeyHtml());

      // Set up the function key events
      $('#fnKeyPad').find('.ab-extended-key').off('touchstart')
         .on('touchstart', keyInputHandler);

      // Handle orientation changes for ctrl pane & fnKeys.
      ctrlPaneHolder.parent().off('orientationchange.ctrlpane')
         .on('orientationchange.ctrlpane', function() {
            self._widget.requestElementReposition($(this));
            self.positionFunctionKeys();
         });
   };


   /*
    *---------------------------------------------------------------------------
    *
    * disconnect
    *
    *    Cleanup data and events for control pane dialog.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.dialogManager.prototype.disconnect = function() {
      var ctrlPaneHolder = this.dialog;

      // Turn off all events.
      ctrlPaneHolder.find('#fnMasterKey').off('touchstart');
      ctrlPaneHolder.find('.ab-extended-key').off('touchstart');
      ctrlPaneHolder.find('.ab-flip').off('touchstart');

      ctrlPaneHolder.parent().off('orientationchange.ctrlpane');

      $('#fnKeyPad').find('.ab-extended-key').off('touchstart');

   };


   /*
    *---------------------------------------------------------------------------
    * getControlPaneHtml
    *
    *    Function to get the extended control keys layout.
    *---------------------------------------------------------------------------
    */

   WMKS.extendedKeypad.prototype.getControlPaneHtml = function() {
      var str =
         '<div class="ctrl-pane flip-container">\
            <div class="flipper">\
               <div class="back">\
                  <div class="ctrl-key-top-row ab-extended-key baseKey" abkeycode="36"><div>'
                     + 'Home' + '</div></div>\
                  <div class="ctrl-key-top-row ab-extended-key baseKey" abkeycode="38">\
                     <img class="touch-sprite up-arrow"/></div>\
                  <div class="ctrl-key-top-row ab-extended-key baseKey" abkeycode="35"><div>'
                     + 'End' + '</div></div>\
                  <div class="ctrl-key-top-row ab-extended-key baseKey" abkeycode="27"><div>'
                     + 'Esc' + '</div></div>\
                  <div class="ctrl-key-bottom-row ab-extended-key baseKey" abkeycode="37">\
                     <img class="touch-sprite left-arrow"/></div>\
                  <div class="ctrl-key-bottom-row ab-extended-key baseKey" abkeycode="40">\
                     <img class="touch-sprite down-arrow"/></div>\
                  <div class="ctrl-key-bottom-row ab-extended-key baseKey" abkeycode="39">\
                     <img class="touch-sprite right-arrow"/></div>\
                  <div class="ctrl-key-bottom-row ab-flip baseKey">\
                     <img class="touch-sprite more-keys"/></div>\
               </div>\
               <div class="front">\
                  <div class="ctrl-key-top-row ab-modifier-key baseKey" abkeycode="16"><div>'
                     + 'Shift' + '</div></div>\
                  <div class="ctrl-key-top-row ab-extended-key baseKey" abkeycode="46"><div>'
                     + 'Del' + '</div></div>\
                  <div class="ctrl-key-top-row ab-extended-key baseKey" abkeycode="33"><div>'
                     + 'PgUp' + '</div></div>\
                  <div id="fnMasterKey" class="ctrl-key-top-row baseKey">\
                     <div style="letter-spacing: -1px">'
                     + 'F1-12' + '</div></div>\
                  <div class="ctrl-key-bottom-row ab-modifier-key baseKey" abkeycode="17"><div>'
                     + 'Ctrl' + '</div></div>\
                  <div class="ctrl-key-bottom-row ab-modifier-key baseKey" abkeycode="18"><div>'
                     + 'Alt' + '</div></div>\
                  <div class="ctrl-key-bottom-row ab-extended-key baseKey" abkeycode="34"><div>'
                     + 'PgDn' + '</div></div>\
                  <div class="ctrl-key-bottom-row ab-flip baseKey">\
                     <img class="touch-sprite more-keys"/></div>\
               </div>\
            </div>\
         </div>';
      return str;
   };

   /*
    *---------------------------------------------------------------------------
    * getFunctionKeyHtml
    *
    *    Function to get the extended functional keys layout.
    *---------------------------------------------------------------------------
    */

   WMKS.extendedKeypad.prototype.getFunctionKeyHtml = function() {
      var str =
         '<div class="fnKey-pane-wrapper hide" id="fnKeyPad">\
             <div class="ctrl-pane">\
                <div class="key-group up-position">\
                  <div class="border-key-top-left">\
                     <div class="fn-key-top-row ab-extended-key baseKey" abkeycode="112"><div>F1</div></div>\
                  </div>\
                  <div class="fn-key-top-row ab-extended-key baseKey" abkeycode="113"><div>F2</div></div>\
                  <div class="fn-key-top-row ab-extended-key baseKey" abkeycode="114"><div>F3</div></div>\
                  <div class="fn-key-top-row ab-extended-key baseKey" abkeycode="115"><div>F4</div></div>\
                  <div class="fn-key-top-row ab-extended-key baseKey" abkeycode="116"><div>F5</div></div>\
                  <div class="border-key-top-right">\
                     <div class="fn-key-top-row ab-extended-key baseKey" abkeycode="117"><div>F6</div></div>\
                  </div>\
                  <div class="border-key-bottom-left">\
                     <div class="fn-key-bottom-row ab-extended-key baseKey" abkeycode="118"><div>F7</div></div>\
                  </div>\
                  <div class="fn-key-bottom-row ab-extended-key baseKey" abkeycode="119"><div>F8</div></div>\
                  <div class="fn-key-bottom-row ab-extended-key baseKey" abkeycode="120"><div>F9</div></div>\
                  <div class="fn-key-bottom-row ab-extended-key baseKey" abkeycode="121"><div>F10</div></div>\
                  <div class="fn-key-bottom-row ab-extended-key baseKey" abkeycode="122"><div>F11</div></div>\
                  <div class="border-key-bottom-right">\
                     <div class="fn-key-bottom-row ab-extended-key baseKey" abkeycode="123"><div>F12</div></div>\
                  </div>\
               </div>\
            </div>\
            <div class="fnKey-inner-border-helper" id="fnKeyInnerBorder"></div>\
         </div>';
      return str;
   };

   /*
    *---------------------------------------------------------------------------
    *
    * toggleCtrlPane
    *
    *    Must be called after onDocumentReady. We go through all the objects in
    *    the DOM with the keyboard icon classes, and bind them to listeners which
    *    process them.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.extendedKeypad.prototype.toggleCtrlPane = function() {
      var ctrlPane = this.dialog;
      // Toggle ctrlPage widget.
      if (ctrlPane.dialog('isOpen')) {
         ctrlPane.dialog('close');
      } else {
         ctrlPane.dialog('open');
      }
   };

   /*
    *---------------------------------------------------------------------------
    *
    * toggleFunctionKeys
    *
    *    Toggle the function key pad between show / hide. Upon show, position the
    *    function keys to align with the ctrlPane. It also manages the
    *    highlighting state for the function key master.
    *    show - true indicates display function keys, false indicates otherwise.
    *
    *---------------------------------------------------------------------------
    */
   WMKS.extendedKeypad.prototype.toggleFunctionKeys = function(show) {
      var fnKeyPad = $('#fnKeyPad');
      var showFunctionKeys = (show || (typeof show === 'undefined' && !fnKeyPad.is(':visible')));

      // Toggle the function key pad.
      fnKeyPad.toggle(showFunctionKeys);

      // Show / Hide the masterKey highlighting
      $('#fnMasterKey').toggleClass('ab-modifier-key-down', showFunctionKeys);

      // Position only if it should be shown.
      this.positionFunctionKeys();
   };


   /*
    *---------------------------------------------------------------------------
    *
    * positionFunctionKeys
    *
    *    Position the function keys div relative to the ctrl pane. This function
    *    is invoked upon orientation change or when the widget is shows.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.extendedKeypad.prototype.positionFunctionKeys = function() {
      var fnKeys = $('#fnKeyPad'), crtlPaneWidget = $('#ctrlPaneWidget');
      // Place the function key if it's now visible
      if (fnKeys.is(':visible')) {
         /*
          * Algin the bottom left corner of the function key pad
          * with the top left corner of the control pane widget.
          * If not enough room, flip to the other side.
          */
         fnKeys.position({
            my:        'right bottom',
            at:        'right top',
            of:        crtlPaneWidget,
            collision: 'flip'
         });

         // Adjust the inner border div size so it won't overlap with the outer border
         $('#fnKeyInnerBorder').height(fnKeys.height()-2).width(fnKeys.width()-2);

         // Check if the function key has been flipped. If so, use the down-style
         var fnKeyBottom = fnKeys.offset().top + fnKeys.height();
         var isAbove = (fnKeyBottom <= crtlPaneWidget.offset().top + crtlPaneWidget.height());
         this.adjustFunctionKeyStyle(isAbove);

         // Move the function key above the ctrl key pane when shown below, and under if shown above
         var targetZOrder;
         if (isAbove) {
            targetZOrder =  parseInt(crtlPaneWidget.css('z-index'), 10) - 1;
            // Use different color for the inner border depending on the position
            $('#fnKeyInnerBorder').css('border-color', '#d5d5d5');
         } else {
            targetZOrder =  parseInt($('#ctrlPaneWidget').css('z-index'), 10) + 1;
            $('#fnKeyInnerBorder').css('border-color', '#aaa');
         }

         fnKeys.css('z-index', targetZOrder.toString());
      }
      return true;
   };

   /*
    *---------------------------------------------------------------------------
    *
    * adjustFunctionKeyStyle
    *
    *    Helper function to adjust the functional key pad CSS based on the position
    *
    *---------------------------------------------------------------------------
    */

   WMKS.extendedKeypad.prototype.adjustFunctionKeyStyle = function (isAbove) {
      var fnKeys = $('#fnKeyPad');
      var keyGroup = fnKeys.find('.key-group');
      if (isAbove) {
         // Check if the "down" classes are being used. If so switch to "up" classes.
         if (keyGroup.hasClass('down-position')) {
            keyGroup.removeClass('down-position');
            keyGroup.addClass('up-position');

            fnKeys.removeClass('fnKey-pane-wrapper-down');
            fnKeys.addClass('fnKey-pane-wrapper');
         }
      } else {
         // Check if the "up" classes are being used. If so switch to "down" classes.
         if (keyGroup.hasClass('up-position')) {
            keyGroup.removeClass('up-position');
            keyGroup.addClass('down-position');

            fnKeys.removeClass('fnKey-pane-wrapper');
            fnKeys.addClass('fnKey-pane-wrapper-down');
         }
      }
   };

}());/*
 *------------------------------------------------------------------------------
 *
 * wmks/trackpadManager.js
 *
 *   The controller of trackpad widget.
 *
 *------------------------------------------------------------------------------
 */

(function() {
   'use strict';

   // Trackpad related constants.
   WMKS.CONST.TRACKPAD = {
      STATE: {
         idle:         0,
         tap:          1,
         tap_2finger:  2,
         drag:         3,
         scroll:       4
      }
   };

   WMKS.trackpadManager = function(widget, canvas) {

      // Call constructor so dialogManager's params are included here.
      WMKS.dialogManager.call(this);

      this._widget = widget;
      this._canvas = canvas;

      // Initialize cursor state.
      this._cursorPosGuest = {x : 0, y : 0};
      // Timer
      this._dragTimer = null;
      // Dragging is started by long tap or not.
      this._dragStartedByLongTap = false;
      // Trackpad state machine.
      this.state = WMKS.CONST.TRACKPAD.STATE.idle,
      this.history = [];
      // Overwride default options with options here.
      $.extend(this.options,
               {
                  name: 'TRACKPAD',
                  speedControlMinMovePx: 5,
                  // Speed control for trackpad and two finger scroll
                  accelerator:           10,
                  minSpeed:              1,
                  maxSpeed:              10
               });
      WMKS.LOGGER.warn('trackpad : ' + this.options.name);
   };

   WMKS.trackpadManager.prototype =  new WMKS.dialogManager();

   /*
    *---------------------------------------------------------------------------
    *
    * getTrackpadHtml
    *
    *    Function to get the trackpad html layout.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.getTrackpadHtml = function() {
      var str = '<div id="trackpad" class="trackpad-container">\
                   <div class="left-border"></div>\
                   <div id="trackpadSurface" class="touch-area"></div>\
                   <div class="right-border"></div>\
                   <div class="bottom-border">\
                      <div class="button-container">\
                         <div id="trackpadLeft" class="button-left"></div>\
                         <div id="trackpadRight" class="button-right"></div>\
                      </div>\
                   </div>\
               </div>';

      return str;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * create
    *
    *    This function initializes the trackpad dialog, toggle highlighting on close
    *    handler.
    *
    * HACK
    *    There is no easy way to determine close by menu click vs clicking close
    *    icon. Hence using the event.target to determine it was from clicking
    *    close icon. It will not work well when closeOnEscape is true. We don't
    *    need this on ipad, so its good.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.create = function() {
      var dialog,
          self = this;

      if (!this._widget ||
          !this._canvas) {
         WMKS.LOGGER.debug('Trackpad dialog creation has been aborted. Widget or Canvas is not ready.');
         return null;
      }

      dialog = $(this.getTrackpadHtml());
      dialog.dialog({
         autoOpen: false,
         closeOnEscape: true,
         resizable: false,
         position: {my: 'center', at: 'center', of: this._canvas},
         zIndex: 1000,
         draggable: true,
         dialogClass: 'trackpad-wrapper',
         close: function(e) {
            self.sendUpdatedState(false);
         },
         create: function(e) {
            self.layout($(this).parent());
         }
      });

      return dialog;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * init
    *
    *    This function initializes the event handlers for the trackpad.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.init = function() {
      var dialog = this.dialog,
          self = this,
          trackpad,
          left,
          right;

      if (!dialog) {
         WMKS.LOGGER.debug('Trackpad init aborted. Dialog is not created successfully.');
         return;
      }

      // Request reposition of trackpad dialog upon orientation changes.
      this._widget.requestElementReposition(dialog.parent(), true);

      // Initialize event handlers for the trackpad.
      trackpad = dialog
         .find('#trackpadSurface')
         .on('touchstart', function(e) {
            return self.trackpadTouchStart(e.originalEvent);
         })
         .on('touchmove', function(e) {
            return self.trackpadTouchMove(e.originalEvent);
         })
         .on('touchend', function(e) {
            return self.trackpadTouchEnd(e.originalEvent);
         });

      left = dialog
         .find('#trackpadLeft')
         .on('touchstart', function(e) {
            return self.trackpadClickStart(e, WMKS.CONST.CLICK.left);
         })
         .on('touchend', function(e) {
            return self.trackpadClickEnd(e, WMKS.CONST.CLICK.left);
         });

      right = dialog
         .find('#trackpadRight')
         .on('touchstart', function(e) {
            return self.trackpadClickStart(e, WMKS.CONST.CLICK.right);
         })
         .on('touchend', function(e) {
            return self.trackpadClickEnd(e, WMKS.CONST.CLICK.right);
         });
   };


   /*
    *---------------------------------------------------------------------------
    *
    * disconnect
    *
    *    This function unbinds the event handlers for the trackpad.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.disconnect = function() {
      var dialog = this.dialog,
          trackpad,
          left,
          right;

      if (!dialog) {
         return;
      }

      // Unregister event handlers for the trackpad.
      trackpad = dialog
         .find('#trackpadSurface')
         .off('touchmove')
         .off('touchstart')
         .off('touchend');

      left = dialog
         .find('#trackpadLeft')
         .off('touchstart')
         .off('touchend');

      right = dialog
         .find('#trackpadRight')
         .off('touchstart')
         .off('touchend');
   };


   /*
    *---------------------------------------------------------------------------
    *
    * layout
    *
    *    Reposition the dialog inorder to center it to the canvas.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.layout = function(dialog) {
      var canvas = this._canvas,
          dialogParent,
          canvasParent;

      if (!dialog ||
          !canvas) {
         return;
      }

      dialogParent = dialog.parent();
      canvasParent = canvas.parent();

      if (dialogParent !== canvasParent) {
         // Append the dialog to the parent of the canvas,
         // so that it's able to center the dialog to the canvas.
         canvasParent.append(dialog);
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * trackpadClickStart
    *
    *    Fires when either one of the virtual trackpad's buttons are clicked. Sends
    *    a mousedown operation and adds the button highlight.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.trackpadClickStart = function(e, buttonClick) {
      if (buttonClick !== WMKS.CONST.CLICK.left &&
          buttonClick !== WMKS.CONST.CLICK.right) {
         WMKS.LOGGER.debug('assert: unknown button ' + buttonClick);
         return false;
      }

      // Highlight click button.
      $(e.target).addClass('button-highlight');

      // Sends a mousedown message.
      this._widget.sendMouseButtonMessage(this.getMousePosition(), true, buttonClick);
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * trackpadClickEnd
    *
    *    Fires when either one of the virtual trackpad's buttons are released.
    *    Sends a mouseup operation and removes the highlight on the button.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.trackpadClickEnd = function(e, buttonClick) {
      if (buttonClick !== WMKS.CONST.CLICK.left &&
          buttonClick !== WMKS.CONST.CLICK.right) {
         WMKS.LOGGER.debug('assert: unknown button ' + buttonClick);
         return false;
      }

      // Remove highlight.
      $(e.target).removeClass('button-highlight');

      // Sends a mouseup message.
      this._widget.sendMouseButtonMessage(this.getMousePosition(), false, buttonClick);
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * computeMovingDistance
    *
    *    Based on a current point and point history, gets the amount of distance
    *    the mouse should move based on this data.
    *
    * Results:
    *    A 2-tuple of (dx, dy)
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.computeMovingDistance = function(x, y) {
      var dx, dy, dist, speed;

      dx = this.getTrackpadSpeed(x,
         this.history[0].x,
         this.history[1].x,
         this.history[2].x);
      dy = this.getTrackpadSpeed(y,
         this.history[0].y,
         this.history[1].y,
         this.history[2].y);

      dist = WMKS.UTIL.getLineLength(dx, dy);

      speed = dist * this.options.accelerator;
      if (speed > this.options.maxSpeed) {
         speed = this.options.maxSpeed;
      } else if (speed < this.options.minSpeed) {
         speed = this.options.minSpeed;
      }

      return [dx * speed, dy * speed];
   };


   /*
    *---------------------------------------------------------------------------
    *
    * getTrackpadSpeed
    *
    *    Performs a linear least squares operation to get the slope of the line
    *    that best fits all four points. This slope is the current speed of the
    *    trackpad, assuming equal time between samples.
    *
    *    Returns the speed as a floating point number.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.getTrackpadSpeed = function(x0, x1, x2, x3) {
      return x0 * 0.3 + x1 * 0.1 - x2 * 0.1 - x3 * 0.3;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * trackpadTouchStart
    *
    *    Fires when a finger lands on the trackpad's touch area. Depending on the
    *    number of touch fingers, assign the initial tap state. Subsequently
    *    ontouchmove event we promote tap --> drag, tap_2finger --> scroll.
    *    If the state was tap / tap_2finger, then its the default click event.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.trackpadTouchStart = function(e) {
      var self = this;

      if (e.targetTouches.length > 2) {
         // Dis-allow a third finger touchstart to reset scroll state.
         if (this.state === WMKS.CONST.TRACKPAD.STATE.scroll) {
            WMKS.LOGGER.debug('Ignore new touchstart, currently scrolling, touch#: '
               + e.targetTouches.length);
         } else {
            WMKS.LOGGER.debug('Aborting touch, too many fingers #: ' + e.targetTouches.length);
            this.resetTrackpadState();
         }
      } else if (e.targetTouches.length === 2) {
         // Could be a scroll. Store first finger location.
         this.state = WMKS.CONST.TRACKPAD.STATE.tap_2finger;
      } else {
         this.state = WMKS.CONST.TRACKPAD.STATE.tap;

         // ontouchmove destroys this timer. The finger must stay put.
         if (this._dragTimer !== null) {
            clearTimeout(this._dragTimer);
            this._dragTimer = null;
         }

         this._dragTimer = setTimeout(function() {
            self._dragTimer = null;

            // Send the left mousedown at the location.
            self._widget.sendMouseButtonMessage(self.getMousePosition(), true, WMKS.CONST.CLICK.left);
            self._dragStartedByLongTap = true;
         }, WMKS.CONST.TOUCH.leftDragDelayMs);
      }
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * trackpadTouchMove
    *
    *    Fires when a finger moves within the trackpad's touch area. If the touch
    *    action is currently marked as a tap, promotes it into a drag or
    *    if it was a tap_2finger, promote to a scroll. If it is already one or
    *    the other, stick to that type.
    *
    *    However, if the touch moves outside the area while dragging, then set the
    *    state back to the tap and clear up history in case user comes back into
    *    the hot region.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.trackpadTouchMove = function(e) {
      var pX, pY, newLocation,
          self = $(e.target),
          widget = this._widget;

      // Reset the drag timer if there is one.
      if (this._dragTimer !== null) {
         clearTimeout(this._dragTimer);
         this._dragTimer = null;
      }

      if (this.state === WMKS.CONST.TRACKPAD.STATE.idle) {
         return false;
      }

      pX = e.targetTouches[0].pageX;
      pY = e.targetTouches[0].pageY;
      // Verify if the touchmove is outside business (hot) region of trackpad.
      if (pY < self.offset().top || pY > (self.offset().top + self.height()) ||
            pX < self.offset().left || pX > (self.offset().left + self.width())) {
         // Reset to tap start state, as the user went outside the business region.
         if (this.state === WMKS.CONST.TRACKPAD.STATE.drag) {
            // Send mouse up event if drag is started by long tap.
            if (this._dragStartedByLongTap) {
               widget.sendMouseButtonMessage(this.getMousePosition(), false, WMKS.CONST.CLICK.left);
            }
            this.state = WMKS.CONST.TRACKPAD.STATE.tap;
            this.history.length = 0;
         }
         return false;
      }

      if (this.state === WMKS.CONST.TRACKPAD.STATE.drag) {
         newLocation = this.computeNewCursorLocation(pX, pY);

         // Perform the actual move update by sending the corresponding message.
         if (!!widget._touchHandler) {
            widget._touchHandler._moveCursor(newLocation.x, newLocation.y);
         }
         widget.sendMouseMoveMessage(newLocation);
         // WMKS.LOGGER.debug('new loc: ' + newLocation.x + ',' + newLocation.y);

         // Make room for a new history entry
         this.history.shift();

         // Push a new history entry
         this.history.push({x: pX, y: pY });
      } else if (this.state === WMKS.CONST.TRACKPAD.STATE.scroll) {
         // Sends the mouse scroll message.
         this.sendScrollMessageFromTrackpad(e.targetTouches[0]);
      }

      // Detect if this is a drag or a scroll. If so, add a history entry.
      if (this.state === WMKS.CONST.TRACKPAD.STATE.tap) {
         this.state = WMKS.CONST.TRACKPAD.STATE.drag;
         // Make up history based on the current point if there isn't any yet.
         this.history.push({x: pX, y: pY}, {x: pX, y: pY}, {x: pX, y: pY});
      } else if (this.state === WMKS.CONST.TRACKPAD.STATE.tap_2finger
            && e.targetTouches.length === 2) {
         this.state = WMKS.CONST.TRACKPAD.STATE.scroll;
         // Create a history entry based on the current point if there isn't any yet.
         this.history[0] = {x: pX, y: pY};
      }
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * computeNewCursorLocation
    *
    *    This function takes the new location and computes the destination mouse
    *    cursor location. The computation is based on the acceleration to be used,
    *    making sure the new location is within the screen area.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.computeNewCursorLocation = function(pX, pY) {
      var dist,
          point = this.getMousePosition();

      // First compute the distance from the last location.
      dist = WMKS.UTIL.getLineLength(
         (pX - this.history[2].x), (pY - this.history[2].y));
      if (isNaN(dist) || dist === 0) {
         // There is no change, return the old location.
         return point;
      } else if (dist < this.options.speedControlMinMovePx) {
         // The cursor has only moved a few pixels, apply the delta directly.
         point.x += (pX - this.history[2].x);
         point.y += (pY - this.history[2].y);
      } else {
         // From now on, though, use device pixels (later, compensate for hi-DPI)
         dist = this.computeMovingDistance(pX, pY);
         point.x += Math.floor(dist[0]);
         point.y += Math.floor(dist[1]);
      }

      return this._widget.getCanvasPosition(point.x, point.y);
   };


   /*
    *---------------------------------------------------------------------------
    *
    * trackpadTouchEnd
    *
    *    Fires when a finger lifts off the trackpad's touch area. If the touch
    *    action is currently marked as a tap, sends off the mousedown and mouseup
    *    operations. Otherwise, simply resets the touch state machine.
    *
    * Results:
    *    Always false (preventing default behavior.)
    *
    * Side Effects:
    *    None.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.trackpadTouchEnd = function(e) {
      var pos;

      // Reset the drag timer if there is one.
      if (this._dragTimer !== null) {
         clearTimeout(this._dragTimer);
         this._dragTimer = null;
      }

      if (e.targetTouches.length !== 0 ||
            this.state === WMKS.CONST.TRACKPAD.STATE.idle) {
         return false;
      }

      pos = this.getMousePosition();
      if (this.state === WMKS.CONST.TRACKPAD.STATE.tap) {
         // Send mousedown & mouseup together
         this._widget.sendMouseButtonMessage(pos, true, WMKS.CONST.CLICK.left);
         this._widget.sendMouseButtonMessage(pos, false, WMKS.CONST.CLICK.left);
      } else if (this.state === WMKS.CONST.TRACKPAD.STATE.tap_2finger) {
         // Send right-click's mousedown & mouseup together.
         this._widget.sendMouseButtonMessage(pos, true, WMKS.CONST.CLICK.right);
         this._widget.sendMouseButtonMessage(pos, false, WMKS.CONST.CLICK.right);
      } else if (this.state === WMKS.CONST.TRACKPAD.STATE.drag && this._dragStartedByLongTap) {
         this._widget.sendMouseButtonMessage(pos, false, WMKS.CONST.CLICK.left);
      }

      this.resetTrackpadState();
      return false;
   };


   /*
    *---------------------------------------------------------------------------
    *
    * resetTrackpadState
    *
    *    Resets the virtual trackpad's state machine.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.resetTrackpadState = function() {
      this.state = WMKS.CONST.TRACKPAD.STATE.idle;
      this.history.length = 0;
      this._dragStartedByLongTap = false
   };


   /*
    *---------------------------------------------------------------------------
    *
    * sendScrollMessageFromTrackpad
    *
    *    This function is similar to the sendScrollEventMessage() used for scrolling
    *    outside the trackpad. The state machine is managed differently and hence
    *    the seperate function.
    *
    *    Check if the scroll distance is above the minimum threshold, if so, send
    *    the scroll. And upon sending it, update the history with the last scroll
    *    sent location.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.sendScrollMessageFromTrackpad = function(curLocation) {
      // This is a two finger scroll, are we going up or down?
      var dx = 0,
          dy = 0,
          deltaX,
          deltaY,
          wheelDeltas,
          firstPos;

      deltaX = curLocation.pageX - this.history[0].x;
      deltaY = curLocation.pageY - this.history[0].y;

      if (!!this._widget._touchHandler) {
         wheelDeltas = this._widget._touchHandler._calculateMouseWheelDeltas(deltaX, deltaY);
         dx = wheelDeltas.wheelDeltaX;
         dy = wheelDeltas.wheelDeltaY;
      }

      // Only send if at least one of the deltas has a value.
      if (dx !== 0 || dy !== 0) {
         this._widget.sendScrollMessage(this.getMousePosition(), dx, dy);

         if (dx !== 0) {
            this.history[0].x = curLocation.pageX;
         }

         if (dy !== 0) {
            this.history[0].y = curLocation.pageY;
         }
      }
   };


   /*
    *---------------------------------------------------------------------------
    *
    * getMousePosition
    *
    *    Get the current position of the mouse cursor.
    *
    *---------------------------------------------------------------------------
    */

   WMKS.trackpadManager.prototype.getMousePosition = function() {
      var pos = this._widget._mousePosGuest;

      if (pos.x === 0 && pos.y === 0) {
         // If mouse position is not specified, the current cursor position is used.
         if (this._cursorPosGuest.x !== pos.x || this._cursorPosGuest.y !== pos.y) {
            // Send mousemove message and update state.
            pos = this._cursorPosGuest;
            this._widget.sendMouseMoveMessage(pos);
         }
      } else {
         // Mark current cursor position.
         this._cursorPosGuest = pos;
      }

      return pos;
   };

}());

$.widget("wmks.wmks", WMKS.widgetProto);
})();
