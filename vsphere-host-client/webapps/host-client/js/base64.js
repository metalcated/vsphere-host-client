/*
 * Modified from:
 * http://lxr.mozilla.org/mozilla/source/extensions/xml-rpc/src/nsXmlRpcClient.js#956
 */

/* ***** BEGIN LICENSE BLOCK *****
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
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
        i;
    // Convert every three bytes to 4 ascii characters.
    for (i = 0; i < (length - 2); i += 3) {
        result += chrTable[data[i] >> 2];
        result += chrTable[((data[i] & 0x03) << 4) + (data[i+1] >> 4)];
        result += chrTable[((data[i+1] & 0x0f) << 2) + (data[i+2] >> 6)];
        result += chrTable[data[i+2] & 0x3f];
    }

    // Convert the remaining 1 or 2 bytes, pad out to 4 characters.
    if (length%3) {
        i = length - (length%3);
        result += chrTable[data[i] >> 2];
        if ((length%3) === 2) {
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
      var string = window.atob(data),
      len = string.length,
      result = new Array(length),
      i;

      for (i = 0; i < len; i++) {
         result[i] = string.charCodeAt(i);
      }

      return result;
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

if (false && window.atob) {
   Base64 = Base64New;
} else {
   Base64 = Base64Old;
}
