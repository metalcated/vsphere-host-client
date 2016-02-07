var IpUtil = (function(){

  /**
    * The max value of each quad of the subnet mask
    */
   var SUBNET_MASK_MAX_QUAD_VALUE = 255;

   /**
    * The valid quad values of the subnet mask
    */
   var SUBNET_MASK_VALID_QUAD_VALUES =
         [0, 128, 192, 224, 240, 248, 252, 254];

   /**
    * The max prefix length for IPv4 addresses
    */
   var IPV4_ADDRESS_MAX_PREFIX = 32;

   /**
    * The max prefix length for IPv6 addresses
    */
   var IPV6_ADDRESS_MAX_PREFIX = 128;

   /**
    * The default prefix length for IPv6 addresses
    */
   var IPV6_ADDRESS_DEFAULT_PREFIX = 64;

   /**
    * An IPv4 octet. Used for validating IPv4 addresses.
    */
   var IPV4_OCTET =
         "(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])";

   /**
    * Regular expression for an IPv4 address as four octets separated by a dot.
    */
   var IPV4_REGEXP = new RegExp(
      "^(" + IPV4_OCTET + "\\.){3}" + IPV4_OCTET + "$");

   /**
    * An IPv6 group of 1-4 hexadecimal numbers. Used for validating IPv6 addresses.
    */
   var IPV6_GROUP = "[0-9a-fA-F]{1,4}";

   /**
    * Regular expression for IPv6 address as eight hexadecimal groups
    * separated by a colon (preferred form).
    */
   var IPV6_REGEXP = new RegExp(
      "^(" + IPV6_GROUP + ":){7}" + IPV6_GROUP + "$");

   /**
    * Assumes the input is an IPv4 address string.
    * Returns a byte array with 4 elements.
    *
    * @param value
    *       An IPv4 string, e.g. "10.20.62.0"
    */
    function getBytesIpv4(value) {
      var parts = value.split(".");
      if (parts.length != 4) {
         return null;
      }
      var bytes = [];
      for (var i = 0; i < 4; ++i) {
         var byte = parts[i];
         bytes.push(byte);
      }
      return bytes;
   }

   /**
    * Assumes the input is an IPv6 address string in preferred form,
    * i.e. 8 parts of 1-4 hexadecimal digits separated by colon.
    * Returns a byte array with 16 elements.
    *
    * @param value
    *       An IPv6 string in preferred form,
    *       e.g. "1080:0:0:0:8:800:200C:417A"
    */
    function getBytesIpv6(value) {
      var parts = value.split(":");
      if (parts.length != 8) {
         return null;
      }
      var bytes = [];
      for (var i = 0; i < 8; ++i) {
         var field = parts[i];
         var byte1 = ((field & 0xFF00) >> 8);
         var byte2 =  (field & 0x00FF);
         bytes.push(byte1);
         bytes.push(byte2);
      }
      return bytes;
   }

   /**
    * Function that will convert a segment in an IPv6 address given as an integer to a
    * string representing the hex value of the integer.
    *
    * @param value
    *       The numeric value of a segment in an IPv6 address.
    */
   function parseIpv6IntToHex(value) {
      return value.toString(16);
   }

   /**
    * Given a string that represents a compressed IPv6 address,
    * returns the address in preferred form.
    * All compressed groups are replaced with "0000".
    * Assumes that the input is not in mixed form (i.e. that
    * <code>normalizeMixedIpv6</code> has been called previously).
    * Compressed form is indicated by "::".
    *
    * @example
    *
    * ::1 becomes
    * 0000:0000:0000:0000:0000:0000:0000:1
    *
    * ff:ee:dd:cc::1:2 becomes
    * ff:ee:dd:cc:0000:0000:1:2
    */
    function normalizeCompressedIpv6(value) {
      var doubleColonPos = value.indexOf("::");
      if (doubleColonPos == -1) {
         return value; // Already normalized
      }

      var prefix = value.substr(0, doubleColonPos);
      var suffix = value.substr(doubleColonPos + 2);

      // Count groups in prefix and suffix
      var groupCount = 0;
      if (prefix.length > 0) {
         groupCount += prefix.split(":").length;
      }
      if (suffix.length > 0) {
         groupCount += suffix.split(":").length;
      }
      var compressedGroups = 8 - groupCount;
      if (compressedGroups < 1) {
         return ""; // Not a valid IPv6 address
      }

      var result;
      if (prefix.length == 0) {
         result = "";
      } else {
         result = prefix + ":";
      }
      for (var i = 0; i < compressedGroups; ++i) {
         result += "0000:";
      }
      if (suffix.length == 0) {
         // Remove the trailing colon
         result = result.substr(0, result.length - 1);
      } else {
         result += suffix;
      }
      return result;
   }

   /**
    * Given a string that represents a mixed IPv6 address,
    * returns the address with only hexadecimal fields.
    * Mixed form ends with d.d.d.d and the decimal values
    * d.d.d.d are replaced by two hexadecimal groups x:x
    *
    * @example
    *
    * f:e:d:c:b:a:255.0.0.15 becomes
    * f:e:d:c:b:a:ff00:000f
    *
    * ::255.255.255.255 becomes
    * ::ffff:ffff
    */
    function normalizeMixedIpv6(value) {
      var firstDotPos = value.indexOf(".");
      if (firstDotPos == -1) {
         return value; // Already normalized
      }

      var lastColonPos = value.lastIndexOf(":");
      if (lastColonPos == -1 || firstDotPos < lastColonPos) {
         return ""; // Not an IPv6 address
      }

      // Test that the last part is an IPv4 address
      var ipv4Part = value.substr(lastColonPos + 1);
      var regExp = IPV4_REGEXP;
      if (!regExp.test(ipv4Part)) {
         return "";
      }

      var result = value.substring(0, lastColonPos + 1);
      // Add the four decimal numbers as two hexadecimal fields separated by a colon
      // E.g. 255.0.0.15 -> ff00:000f
      var ipv4Octets = ipv4Part.split(".");
      for (var i = 0; i < 4; ++i) {
         if (i == 2) {
            result += ":";
         }
         var octet = Number(ipv4Octets[i]);
         var hex = parseIpv6IntToHex(octet);
         if (hex.length == 1) {
            hex = "0" + hex;
         }
         result += hex;
      }
      return result;
   }

   return {
      /**
       * Checks if a string is a valid IPv4 address.
       *
       * @example
       *
       * <listing version="3.0">
       * var result;
       * result = IpUtil.isIpv4("255.255.254.0");   // true
       * result = IpUtil.isIpv4("0.00.000.001");    // true
       * result = IpUtil.isIpv4("255.255.255.256"); // false
       * result = IpUtil.isIpv4("1.2.3.4.5");       // false
       * result = IpUtil.isIpv4("1.2 . 3 .4");      // false
       * result = IpUtil.isIpv4(null);              // false
       * </listing>
       */
      isIpv4 : function(value) {
         var ip = IpUtil.parseIpv4(value);
         return ip != null;
      },

      /**
       * Tries to parse a string as an IPv4 address.
       *
       * @return
       *       Returns an <code>IpAddress</code> if the string is
       *       an IPv4 address, otherwise returns null.
       *
       * @example
       *
       * "10.20.254.0"     -> [10, 20, 254, 0]
       * "0.00.000.001"    -> [0, 0, 0, 1]
       * "255.255.255.256" -> null
       */
      parseIpv4 :  function(value) {
         if (value == null) {
            return null;
         }
         value = value.trim();
         var regExp = IPV4_REGEXP;
         if (!regExp.test(value)) {
            return null;
         }
         return getBytesIpv4(value);
      },

      /**
       * Checks if a string is a valid IPv6 address.
       * Conforms to IPv6 addressing RFC 2373:
       * http://www.faqs.org/rfcs/rfc2373.html
       *
       * @example
       *
       * <listing version="3.0">
       * var result;
       * result = IpUtil.isIpv6("1080:0:0:0:8:800:200C:417A");   // true
       * result = IpUtil.isIpv6("1080::8:800:200C:417A");        // true
       * result = IpUtil.isIpv6("::");                           // true
       * result = IpUtil.isIpv6("0:0:0:0:0:FFFF:129.144.52.38"); // true
       * result = IpUtil.isIpv6("::FFFF:129.144.52.38");         // true
       * result = IpUtil.isIpv6("1:2:3:4::5:6:7:8");             // false
       * result = IpUtil.isIpv6(null);                           // false
       * </listing>
       */
      isIpv6 : function(value) {
         var ip = IpUtil.parseIpv6(value);
         return ip != null;
      },

      /**
       * Tries to parse a string as an IPv6 address.
       *
       * @return
       *       Returns an <code>IpAddress</code> if the string is
       *       an IPv6 address, otherwise returns null.
       *
       * @example
       *
       * "1080:0:0:0:8:800:200C:417A" ->
       * [16, 128, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 32, 12, 65, 122]
       *
       * "::1" -> [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
       *
       * "1:2:3:4::5:6:7:8" -> null
       */
      parseIpv6 : function(value) {
         if (value == null) {
            return null;
         }
         value = value.trim();

         // Try to match preferred form.
         var regExp = IPV6_REGEXP;
         if (regExp.test(value)) {
            return getBytesIpv6(value);
         }

         // Check for spaces within the string
         if (value.indexOf(" ") != -1) {
            return null;
         }

         // Process mixed form x:x:x:x:x:x:d.d.d.d
         value = normalizeMixedIpv6(value);

         // Process compressed form x:x::x:x:x
         value = normalizeCompressedIpv6(value);

         // Again try to match preferred form x:x:x:x:x:x:x:x
         if (regExp.test(value)) {
            return getBytesIpv6(value);
         }

         return null;
      }

   }
})();