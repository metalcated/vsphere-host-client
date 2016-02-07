
if (window.WebSocket) {
   // nothing to do
} else if (window.MozWebSocket) {
   window.WebSocket = window.MozWebSocket;
} else {
    (function () {
        window.WEB_SOCKET_SWF_LOCATION = "web-socket-js/WebSocketMain.swf";
        document.write("<script src='web-socket-js/swfobject.js'><\/script>" +
                       "<script src='web-socket-js/web_socket.js'><\/script>");
    }());
}


// Convenience functions for building an array of bytes (for sending messages to
// servers or handling image formats)

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

WMKS.VNCDecoder = function(opts) {
  var i;

  $.extend(this.options, opts);

  return this;
};


$.extend(WMKS.VNCDecoder.prototype, {
  options: {
    canvas: null,
    onConnecting: function() {},
    onConnected: function() {},
    onDisconnected: function() {},
    onAuthenticationFailed: function() {},
    onError: function() {},
    onNewDesktopSize: function(width, height) {}
  },

  useVMWKeyEvent : false,
  useVMWAck : false,
  _websocket: null,
  _encrypted: false,
  _receivedFirstUpdate: false,
  _serverInitialized: false,
  _canvas2DContext: null,
  _currCanvasFillStyle: '',
  _currentCursorURI: 'default',
  _imageCache: [],

  fbReadStart: 0,

  DISCONNECTED: 0,
  VNC_ACTIVE_STATE: 1,
  FBU_DECODING_STATE: 2,
  FBU_RESTING_STATE: 3,

  _state: 0, // DISCONNECTED

  _FBWidth: 0,
  _FBHeight: 0,
  _FBName: '',
  _FBBytesPerPixel: 0,
  _FBDepth: 3,

  // Mouse State - the current button state(s) are sent with each pointer event
  _mouseButtonMask: 0,
  _mouseX: 0,
  _mouseY: 0,
  onDecodeComplete: {},

  // Frame buffer update state
  rects : 0,
  rectsRead : 0,
  rectsDecoded : 0,

   // We maintain an incrementing ID for each update request, this
   // assists in tracking updates/acks with the host.
   updateReqId: 0,

   // Server->Client message ids
   msgFramebufferUpdate: 0,
   msgSetColorMapEntries: 1,
   msgRingBell: 2,
   msgServerCutText: 3,
   msgVMWSrvMessage: 127,

   // Client->Server message ids
   msgClientEncodings: 2,
   msgFBUpdateRequest: 3,
   msgKeyEvent: 4,
   msgPointerEvent: 5,
   msgVMWClientMessage: 127,

   // encodings for rectangles within FBUpdates
   encRaw:               0x00,
   encCopyRect:          0x01,
   encTightPNG:          -260,
   encDesktopSize:       -223,
   encTightPNGBase64:     21 + 0x574d5600,
   encVMWDefineCursor:   100 + 0x574d5600,
   encVMWCursorState:    101 + 0x574d5600,
   encVMWCursorPosition: 102 + 0x574d5600,
   encVMWServerPush:     114 + 0x574d5600,
   encVMWServerCaps:     122 + 0x574d5600,
   encTightJpegQuality10: -23,

   // Capabilities from VMWServerCaps which we can make use of.
   //
   serverCapKeyEvent:   0x02,
   serverCapUpdateAck:  0x20,

   // Sub-encodings for the tightPNG/tightPNGBase64 encoding.
   //
   subEncFill: 0x80,
   subEncJPEG: 0x90,
   subEncPNG:  0xA0,
   subEncMask: 0xF0,

   rect: [],
   _msgTimer: null,
   _mouseTimer: null,
   _mouseActive: false,
   msgTimeout: {},
   mouseTimeout: {},
   mouseTimeResolution: 16,  // milliseconds

  _url: "",
  _receiveQueue: "",
  _receiveQueueIndex: 0,
  _receiveQueueSliceTrigger: 4096,

  fail: function (msg) {
     console.log(msg);
     this.disconnect();
  },

  connect: function (destinationUrl) {
    var self = this;

    this._state = this.VNC_ACTIVE_STATE;

    this._canvas2DContext = this.options.canvas.getContext('2d');

    if (!this._canvas2DContext.createImageData) {
      throw("no canvas imagedata support");
    }

    // This closure is run whenever the handler indicates it's
    // completed its decoding pass. We use it to indicate to the
    // server that we've decoded this request if this is the last
    // rect in the update.
    this.onDecodeComplete = function () {
       self.rectsDecoded++;
       if (self.rectsDecoded === self.rects) {
          self._executeRects();
       }
    };

    this.msgTimeout = function() {
       self._state = self.VNC_ACTIVE_STATE;
       self.processMessages();
    }

    this.mouseTimeout = function() {
       self._mouseTimer = null;
       if (self._mouseActive) {
          self.sendMouseEvent();
          self._mouseTimer = setTimeout(self.mouseTimeout, self.mouseTimeResolution);
       }
    }

	// Starting this at the handleServerInitializedMsg instead of
	// handleProtocolVersionMsg state as a result of the way the current
	// proxy works.
    this.setReadCB(24, this.handleServerInitializedMsg);

    this._url = destinationUrl;
    this._receiveQueue = "";
    this._receiveQueueIndex = 0;

    this.wsOpen = function (evt) {
       self.options.onConnecting();
       if (this.protocol != "base64" &&
           this.protocol != "uint8utf8") {
          return this.fail("no agreement on protocol");
       }
       console.log('WebSocket created newAPI: ' + self.newAPI +
                   ' protocol: ', this.protocol);
    };

    this.wsClose = function (evt) {
       self.options.onDisconnected();
    };

    this.wsMessage = function (evt) {
       if (self._receiveQueueIndex > self._receiveQueue.length) {
          return this.fail("overflow receiveQueue");
       } else if (self._receiveQueueIndex == self._receiveQueue.length) {
          self._receiveQueue = "";
          self._receiveQueueIndex = 0;
       } else if (self._recieveQueueIndex > self._receiveQueueSliceTrigger) {
          self._receiveQueue = self._receiveQueue.slice(self._receiveQueueIndex);
          self._receiveQueueIndex = 0;
       }

       if (this.protocol == "base64") {
          self._receiveQueue = self._receiveQueue.concat(Base64.decodeToString(evt.data));
       } else {
          self._receiveQueue = self._receiveQueue.concat(evt.data);
       }
       self.processMessages();
    };

    this.wsOnerror = function (evt) {
       return self.fail('VNCProtocol onError ' + evt);
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
          self._websocket = new WebSocket(self._url, self.protocolGuess);
          self._websocket.onopen = self.wsHixieOpen;
          self._websocket.onclose = self.wsHixieNextProtocol;
          self._websocket.onmessage = self.wsMessage;
          self._websocket.onerror = self.wsError;
       } else {
          self.wsClose(evt);
       }
    };

    // Note that the hixie websockets (used in current safari) dosn't
    // support passing multiple protocols to the server - at most a
    // single string is passed, and the server must accept that
    // protocol or fail the connection.  We'd like to try uint8utf8
    // first but fall back to base64 if that's all the server
    // supports.  This is easy with hybi and newer APIs, but needs
    // extra code to work on safari.
    //?
    if (window.WebSocket.CLOSING) {
       this.newAPI = true;
    } else {
       this.newAPI = false;
    }

    if ($.browser.msie) {
       // IE9 doesn't like uint8utf8, haven't established why not.
       //
       this.protocolList = ["base64"];
    } else {
	   // [affonehj] Reversed the order so it chooses base64 as a first guess
       this.protocolList = ["base64", "uint8utf8"];
    }

    if (this.newAPI) {
       this._websocket = new WebSocket(this._url, this.protocolList);
       this._websocket.onopen = this.wsOpen;
       this._websocket.onclose = this.wsClose;
       this._websocket.onmessage = this.wsMessage;
       this._websocket.onerror = this.wsError;
    } else {
       this.wsHixieNextProtocol();
    }
 },


  /** Queue Management */

  receiveQueueBytesUnread: function () {
    "use strict";

    return this._receiveQueue.length - this._receiveQueueIndex;
  },

  readString: function (stringLength) {
    "use strict";

    var string = this._receiveQueue.slice(this._receiveQueueIndex,
                                          this._receiveQueueIndex + stringLength);
    this._receiveQueueIndex += stringLength;
    return string;
  },

  skipBytes: function (nr) {
    "use strict";
    this._receiveQueueIndex += nr;
  },

  readByte: function () {
    "use strict";

    var aByte = this._receiveQueue.charCodeAt(this._receiveQueueIndex);
    this._receiveQueueIndex += 1;
    return aByte;
  },

  readInt16: function () {
    "use strict";

    return ((this.readByte() << 8) +
            (this.readByte()));
  },

  readInt32: function () {
    "use strict";

    return ((this.readByte() << 24) +
            (this.readByte() << 16) +
            (this.readByte() <<  8) +
            (this.readByte()));
  },

  readBytes: function (length) {
    "use strict";
    var result, i;

    result = new Array(length);

    for (i = 0; i < length; i++) {
       result[i] = this._receiveQueue.charCodeAt(i + this._receiveQueueIndex);
    }

    this._receiveQueueIndex += length;
    return result;
  },

  sendBytes: function (bytes) {
    "use strict";
    this.sendString(stringFromArray(bytes));
  },

  sendString: function (stringValue) {
    "use strict";

    if (this._websocket.protocol == "base64") {
       this._websocket.send(Base64.encodeFromString(stringValue));
    } else {
       this._websocket.send(stringValue);
    }
  },

  processMessages: function () {
     while (this._state === this.VNC_ACTIVE_STATE &&
            this.receiveQueueBytesUnread() >= this.nextBytes) {
        var nrBytes = this.nextBytes;
        var before = this.receiveQueueBytesUnread();
        this.nextFn(this.nextArg);
        var after = this.receiveQueueBytesUnread();
        if (nrBytes < before - after) {
           return this.fail("decode overrun " + nrBytes + " vs " +
                            (before - after));
        }
     }
  },

  setReadCB: function(bytes, nextFn, nextArg) {
     this.nextBytes = bytes;
     this.nextFn = nextFn;
     this.nextArg = nextArg;
  },

  getImage: function() {
     if (this._imageCache.length > 0) {
        return this._imageCache.pop();
     } else {
        return new Image();
     }
  },

  releaseImage: function (image) {
      image.onload = null;
      image.destX = null;
      image.destY = null;

      // Setting image.src to null is insufficient to turn off image
      // caching in chrome.  Unless we set it to an actual string
      // (even an empty one), if we try to decode the same image
      // twice, onload will not be called the second time.
      image.src = "";

      if (this._imageCache.length < 32) {
         this._imageCache.push(image);
      } else {
         delete image;
      }
  },

  handleProtocolVersionMsg: function () {
    var serverVersionPacket = this.readString(12);
    if (serverVersionPacket !== "RFB 003.008\n") {
       return this.fail("Invalid Version packet: " + serverVersionPacket);
    }
    this.sendString("RFB 003.008\n");
    this.setReadCB(1, this.handleSecurityMsg);
  },

  handleSecurityMsg: function () {
      var authenticationScheme = 0;
      var numTypes;
      var reasonLength;
      var self = this;

      var handleReason = function() {
         var reason = this.readString(reasonLength);
         self.options.onAuthenticationFailed();
         return self.fail(reason);
      }

      var handleReasonLength = function() {
         reasonLength = self.readInt32();
         self.setReadCB(reasonLength, handleReason);
      }

      var handleSecurityTypes = function() {
         var securityTypes = self.readBytes(numTypes);
         console.log("Server security types: " + securityTypes);
         for (i=0; i < securityTypes.length; i+=1) {
            if (securityTypes && (securityTypes[i] < 3)) {
               authenticationScheme = securityTypes[i];
            }
         }
         if (authenticationScheme === 0) {
            return self.fail("Unsupported security types: " + securityTypes);
         }
         self.sendBytes([authenticationScheme]);
         console.log('Using authentication scheme: ' + authenticationScheme);
         if (authenticationScheme === 1) {
            // No authentication required - just handle the result state.
            self.setReadCB(4, self.handleSecurityResultMsg);
         } else {
            return self.fail("vnc authentication not implemented");
         }
      };

      numTypes = this.readByte();
      if (numTypes === 0) {
         this.setReadCB(4, handleReasonLength);
      } else {
         this.setReadCB(numTypes, handleSecurityTypes);
      }
  },

  handleSecurityResultMsg: function () {
     var self = this;
     var reasonLength;
     var handleReason = function() {
        var reason = self.readString(reasonLength);
        self.options.onAuthenticationFailed();
        return self.fail(reason);
     };

     var handleReasonLength = function() {
        reasonLength = self.readInt32();
        self.setReadCB(reasonLength, handleReason);
     };


     switch (this.readInt32()) {
     case 0:  // OK
        // Send '1' to indicate the the host should try to
        // share the desktop with others.  This is currently
        // ignored by our server.
        this.sendBytes([1]);
        this.setReadCB(24, this.handleServerInitializedMsg);
        return;
     case 1:  // failed
        this.setReadCB(4, handleReasonLength);
        return;
     case 2:  // too-many
        this.options.onAuthenticationFailed();
        return this.fail("Too many auth attempts");
     default:
        return this.fail("Bogus security result");
     }
  },

  handleServerInitializedMsg: function () {
    var self = this;

    // Screen size
    this._FBWidth  = this.readInt16();
    this._FBHeight = this.readInt16();

    // PIXEL_FORMAT - we really only need the depth/bpp and endian flag
    var bpp           = this.readByte();
    var depth         = this.readByte();
    var bigEndian     = this.readByte();
    var trueColor     = this.readByte();

    console.log('Screen: ' + this._FBWidth + ' x ' + this._FBHeight +
                ', bits-per-pixel: ' + bpp + ', depth: ' + depth +
                ', big-endian-flag: ' + bigEndian +
                ', true-color-flag: ' + trueColor);

    // Skip the 'color'-max values
    this.skipBytes(6);

    var redShift = this.readByte();
    var greenShift = this.readByte();
    var blueShift = this.readByte();

    console.log('red shift: ' + redShift +
                ', green shift: ' + greenShift +
                ', blue shift: ' + blueShift);

    // Skip the 3 bytes of padding
    this.skipBytes(3);

    // Read the connection name
    var nameLength   = this.readInt32();

    this.options.onNewDesktopSize(this._FBWidth, this._FBHeight);

    // keyboard.grab();

    if (trueColor) {
       this._FBBytesPerPixel = 4;
       this._FBDepth        = 3;
    } else {
       return this.fail('no colormap support');
    }

    var getFBName = function () {
       self._FBName = self.readString(nameLength);

       self._sendClientEncodingsMsg();
       self._sendFBUpdateRequestMsg(0);

       if (self._encrypted) {
          console.log('Connected (encrypted) to: ' + self._FBName);
       } else {
          console.log('Connected (unencrypted) to: ' + self._FBName);
       }

       self._serverInitialized = true;
       self.getNextServerMessage();
    };

    this.setReadCB(nameLength, getFBName);
  },

  getNextServerMessage: function () {
     this.setReadCB(1, this.handleServerMsg);
  },

  gobble: function (next) {
     this.skipBytes(this.nextBytes);
     next();
  },

  handleServerMsg: function () {
    var length, c, red, green, blue;
    var self = this;
    var msgType = this.readByte();

    switch (msgType) {
    case this.msgFramebufferUpdate:
       this.setReadCB(3, this._framebufferUpdate);
       break;
    case this.msgSetColorMapEntries:
       var getNumColors = function () {
          self.skipBytes(3);
          var numColours = self.readInt16();
          // XXX: just ignoring incoming colors
          self.setReadCB(6 * numColors, self.gobble, self.getNextServerMessage);
       }
       this.setReadCB(5, getNumColors);
       break;
    case this.msgRingBell:
       this.getNextServerMessage();
       break;
    case this.msgServerCutText:
       var getServerCutTextHead = function () {
          self.readBytes(3);  // Padding
          length = self.readInt32();
          // XXX: just ignoring the incoming text
          self.setReadCB(length, self.gobble, self.getNextServerMessage);
       }

       this.setReadCB(8, getServerCutTextHead);
       break;
    case this.msgVMWSrvMessage:
       var getVMWSrvMsgHead = function () {
          var id = self.readByte();
          var len = self.readInt16();
          var caps = self.readInt32();
          if (id != 0 || len < 8) {
             self.options.onError();
             return self.fail('unknown VMW server submessage ' + id);
          }
          self.useVMWKeyEvent = !!(caps & self.serverCapKeyEvent);
          self.useVMWAck      = !!(caps & self.serverCapUpdateAck);
          if (len > 8) {
             self.setReadCB(len-8, self.gobble, self.getNextServerMessage);
          } else {
             self.getNextServerMessage();
          }
       };

       this.setReadCB(7, getVMWSrvMsgHead);
       break;

    default:
       this.options.onError();
       return this.fail('Disconnected: illegal server message type ' + msgType);
    }

  },

  sendMouseEvent: function () {
     var arr = [];
     arr.push8(this.msgPointerEvent);
     arr.push8(this._mouseButtonMask);
     arr.push16(this._mouseX);
     arr.push16(this._mouseY);
     this.sendBytes(arr);
     this._mouseActive = false;
  },

  onMouseMove: function (x, y) {
    this._mouseX = x;
    this._mouseY = y;

    if (this._serverInitialized) {
       this._mouseActive = true;
       if (this._mouseTimer == null) {
          this.sendMouseEvent();
          this._mouseTimer = setTimeout(this.mouseTimeout,
                                        this.mouseTimeResolution);
       }
    }
  },

  onMouseButton: function (x, y, down, bmask) {
    this._mouseX = x;
    this._mouseY = y;
    if (down) {
      this._mouseButtonMask |= bmask;
    } else {
      this._mouseButtonMask &= ~bmask;
    }
    if (this._serverInitialized) {
       this._mouseActive = true;
       this.sendMouseEvent();
    }
  },

  onVMWKeyPress: function (keysym, down) {
    if (this._serverInitialized) {
       var arr = [];
       arr.push8(this.msgVMWClientMessage);
       arr.push8(0);   // Key message sub-type
       arr.push16(8);  // Length
       arr.push16(keysym);
       arr.push8(down);
       arr.push8(0);   /// padding
       this.sendBytes(arr);
    }
  },

  disconnect: function () {
    "use strict";

    if (this._state != this.DISCONNECTED) {
       this._state = this.DISCONNECTED;
       this._websocket.close();
       delete this._websocket;
       this._receiveQueue = "";
       this._receiveQueueIndex = 0;
       this.rects = 0;
       this._receivedFirstUpdate = false;
    }
  },

  /** @private */

  _sendClientEncodingsMsg: function () {
    var i;
    var encodings = [this.encTightPNG,
                     this.encDesktopSize,
                     this.encVMWDefineCursor,
                     this.encVMWCursorState,
                     this.encVMWCursorPosition,
                     this.encVMWServerPush,
                     this.encVMWServerCaps,
                     this.encTightJpegQuality10];

    // Hopefully the server isn't silly enough to accept uint8utf8 if
    // it's unable to emit TightPNGBase64.  The two really need to be
    // used together.  Client-side we can avoid advertising
    // TightPNGBase64 when we know it will lead to
    // double-base64-encoding.
    //
    if (this._websocket.protocol == "uint8utf8") {
       encodings = [this.encTightPNGBase64].concat(encodings);
    }

    // Blits seem to work well on most browsers now.
    //
    encodings = [this.encCopyRect].concat(encodings);

    var message = [];
    message.push8(this.msgClientEncodings);
    message.push8(0);
    message.push16(encodings.length);
    for (i = 0; i < encodings.length; i += 1) {
      message.push32(encodings[i]);
    }
    this.sendBytes(message);
  },

  _sendFBUpdateRequestMsg: function (incremental) {
    var message = [];
    message.push8(this.msgFBUpdateRequest);
    message.push8(incremental);
    message.push16(0);
    message.push16(0);
    message.push16(this._FBWidth);
    message.push16(this._FBHeight);
    this.sendBytes(message);
  },

  _sendAck: function(renderMilliseconds) {
    var updateReqId = this.updateReqId || 1;
    var msg;
    if (this.useVMWAck) {
       // Add one millisecond to account for the enforced sleep
       // between frames, and another as a bit of a swag.
       //
       var time = (renderMilliseconds + 2) * 10;
       var arr = [];
       arr.push8(this.msgVMWClientMessage);
       arr.push8(4);           // ACK message sub-type
       arr.push16(8);          // Length
       arr.push8(updateReqId); // update id
       arr.push8(0);           // padding
       arr.push16(time);       // render time in tenths of millis
       this.sendBytes(arr);
    } else {
       this._sendFBUpdateRequestMsg(updateReqId);
    }
  },

  _framebufferUpdate: function () {
      this.updateReqId = this.readByte();
      this.rects = this.readInt16();
      this.rectsRead = 0;
      this.rectsDecoded = 0;
      this.setReadCB(12, this.readRect);
   },

   readRect: function() {
       var i = this.rectsRead;

       this.rect[i] = {};
       this.rect[i].x        = this.readInt16();
       this.rect[i].y        = this.readInt16();
       this.rect[i].width    = this.readInt16();
       this.rect[i].height   = this.readInt16();
       this.rect[i].encoding = this.readInt32();

       if (this.rect[i].encoding != this.encTightPNGBase64 &&
           this.rect[i].encoding !=  this.encTightPNG) {
          this.rectsDecoded++;
       }

       switch (this.rect[i].encoding) {
       case this.encRaw:
          this.setReadCB(this.rect[i].width *
                         this.rect[i].height *
                         this._FBBytesPerPixel,
                         this.readRaw, this.rect[i]);
          break;
       case this.encCopyRect:
          this.setReadCB(4, this.readCopyRect, this.rect[i]);
          break;
       case this.encTightPNGBase64:
       case this.encTightPNG:
          this.setReadCB(4, this.readTightPNG, this.rect[i]);
          break;
       case this.encDesktopSize:
          this.readDesktopSize(this.rect[i]);
          break;
       case this.encVMWDefineCursor:
          this.setReadCB(2, this.readVMWDefineCursor, this.rect[i]);
          break;
       case this.encVMWCursorState:
          this.setReadCB(2, this.readVMWCursorState, this.rect[i]);
          break;
       case this.encVMWCursorPosition:
          this.readVMWCursorPosition(this.rect[i]);
          break;
       default:
          return this.fail("Disconnected: unsupported encoding " +
                           this.rect[i].encoding);
       }
   },

   nextRect: function() {
      this.rectsRead++;
      if (this.rectsRead < this.rects) {
         this.setReadCB(12, this.readRect);
      } else {
          this.fbReadStart = (new Date()).getTime();

          this._state = this.FBU_DECODING_STATE;
          if (this.rectsDecoded === this.rects) {
             this._executeRects();
          }
       }
   },

   _executeRects: function () {
       // When this is called, all data for all rectangles is
       // available and all JPEG images have been loaded.  We can
       // now perform all drawing in a single step, in the correct order.

       var i;

       if (this._state !== this.FBU_DECODING_STATE) {
          return this.fail("wrong state");
       }

       if (this.rectsDecoded != this.rects ||
           this.rectsRead != this.rects) {
          return this.fail("messed up state");
       }

       for (i = 0; i < this.rects; i++) {

          switch (this.rect[i].encoding) {
          case this.encRaw:
             this._blitImageString(this.rect[i].x,
                                   this.rect[i].y,
                                   this.rect[i].width,
                                   this.rect[i].height,
                                   this.rect[i].imageString);
             this.rect[i].imageString = "";
             break;
          case this.encCopyRect:
             // Using drawImage seems to be a slow path on some
             // browsers, eg linux chrome.  Get/Put is faster but
             // create a transient copy of the image, which may be a
             // problem for constrained clients unless we start
             // splitting up large blits.
             //
             if (true) {
                var img;
                img = this._canvas2DContext.getImageData(this.rect[i].srcX,
                                                         this.rect[i].srcY,
                                                         this.rect[i].width,
                                                         this.rect[i].height);

                this._canvas2DContext.putImageData(img,
                                                   this.rect[i].x,
                                                   this.rect[i].y);
                delete img;
             } else {
                this._canvas2DContext.drawImage(this.options.canvas,
                                                this.rect[i].srcX,
                                                this.rect[i].srcY,
                                                this.rect[i].width,
                                                this.rect[i].height,
                                                this.rect[i].x,
                                                this.rect[i].y,
                                                this.rect[i].width,
                                                this.rect[i].height);
             }
             break;
          case this.encTightPNG:
          case this.encTightPNGBase64:
             if (this.rect[i].subEncoding == this.subEncFill) {
                this._fillRectWithColor(this.rect[i].x,
                                        this.rect[i].y,
                                        this.rect[i].width,
                                        this.rect[i].height,
                                        this.rect[i].color);
             } else {
                this._canvas2DContext.drawImage(this.rect[i].image,
                                                this.rect[i].image.destX,
                                                this.rect[i].image.destY);
                this.releaseImage(this.rect[i].image);
                this.rect[i].image = null;
             }
             break;
          case this.encDesktopSize:
          case this.encVMWDefineCursor:
          case this.encVMWCursorState:
          case this.encVMWCursorPosition:
          default:
             break;
          }
          delete this.rect[i];
       }

       var now = (new Date()).getTime();
       this._sendAck(now - this.fbReadStart);

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
       this.getNextServerMessage();


       // Resting like this is a slight drain on performance,
       // especially at higher framerates.
       //
       // If the client could just hit 50fps without resting (20
       // ms/frame), it will now manage only 47.6fps (21 ms/frame).
       //
       // At lower framerates the difference is proportionately
       // less, eg 20fps->19.6fps
       //
       // It is however necessary to do something like this to
       // trigger the screen update, as the canvas double buffering
       // seems to use idleness as a trigger for swapbuffers.

       this._msgTimer = setTimeout(this.msgTimeout, 1 /* milliseconds */);
      },

  readRaw: function (rect) {
      rect.imageString = this.readString(this.nextBytes);
      this.nextRect();
    },

  readCopyRect: function (rect) {
      rect.srcX = this.readInt16();
      rect.srcY = this.readInt16();
      this.nextRect();
    },

   readCursorData: function (rect) {
      var pixelslength = rect.w * rect.h * this._FBBytesPerPixel;
      var masklength = Math.floor((rect.w + 7) / 8) * rect.h;
      this._changeCursor(this.readBytes(pixelslength),
                         this.readBytes(masklength),
                         x, y, w, h);
    },

  readCursor: function (rect) {
      var w = rect.width;
      var h = rect.height;
      var pixelslength = rect.w * rect.h * this._FBBytesPerPixel;
      var masklength = Math.floor((rect.w + 7) / 8) * rect.h;
      read(pixelslength + masklength, readCursorData, rect);
    },

  readTightPNG: function (rect) {

      rect.subEncoding = this.readByte();
      rect.subEncoding &= this.subEncMask;

      if (rect.subEncoding == this.subEncFill) {
         rect.color = [];
         rect.color[0] = this.readByte();
         rect.color[1] = this.readByte();
         rect.color[2] = this.readByte();
         rect.color[3] = 0xff;
         this.rectsDecoded++;
         this.nextRect();
      } else {
         var lengthSize = 1;
         var dataSize = this.readByte();
         if (dataSize & 0x80) {
            lengthSize = 2;
            dataSize &= ~0x80;
            dataSize += this.readByte() << 7;
            if (dataSize & 0x4000) {
               lengthSize = 3;
               dataSize &= ~0x4000;
               dataSize += this.readByte() << 14;
            }
         }

         this.setReadCB(dataSize, this.readTightData, rect);
      }
   },

   readTightData: function (rect) {
      // Skip the preamble and read the actual JPEG data.
      var data = this.readString(this.nextBytes);

      // Construct an Image and keep a reference to it in the
      // rectangle object. Since Images are loaded asynchronously
      // we can't draw it until the image has finished loading so
      // we don't call onDecodeComplete() until this has happened.
      rect.image = this.getImage();
      rect.image.onload = this.onDecodeComplete;
      rect.image.width = rect.width;
      rect.image.height = rect.height;
      rect.image.destX = rect.x;
      rect.image.destY = rect.y;

      if (rect.encoding != this.encTightPNGBase64) {
         data = Base64.encodeFromString(data);
      }

      if (rect.subEncoding == this.subEncPNG) {
         rect.image.src = 'data:image/png;base64,' + data;
      } else {
         rect.image.src = 'data:image/jpeg;base64,' + data;
      }
      this.nextRect();
  },

  readDesktopSize: function (rect) {
      this._FBWidth = rect.width;
      this._FBHeight = rect.height;

      // Resize the canvas to the new framebuffer dimensions
      this.options.onNewDesktopSize(this._FBWidth, this._FBHeight);
      this.nextRect();
  },

  readVMWDefineCursor: function (rect) {
      // Start with 2 bytes of type (and padding)

      rect.cursorType = this.readByte();
      this.skipBytes(1);

      rect.pixelslength = 4 * rect.width * rect.height;

      if (rect.cursorType === 0) {
         rect.masklength = rect.pixelslength;
      } else {
         rect.masklength = 0;
      }

      this.setReadCB(rect.pixelslength + rect.masklength,
                this.readVMWDefineCursorData, rect);
   },

   readVMWDefineCursorData: function (rect) {
      var i, j, rowOffset;
      var mask = [], pixels = [];

      if (rect.pixelslength > 0) {
         pixels = this.readBytes(rect.pixelslength);
      }
      if (rect.masklength > 0) {
         mask = this.readBytes(rect.masklength);
      }

      if (rect.cursorType === 0) {
         for (i = 0; i < rect.height; i++) {
            rowOffset = i * rect.width * 4;
            for (j = 0; j < rect.width * 4; j += 4) {
               // XXX: this isn't fully correct - mask data needs to
               //      be pushed into the CursorURI somehow.
               pixels[j + rowOffset + 0] ^= mask[j + rowOffset + 0];
               pixels[j + rowOffset + 1] ^= mask[j + rowOffset + 1];
               pixels[j + rowOffset + 2] ^= mask[j + rowOffset + 2];
               pixels[j + rowOffset + 3] = mask[j + rowOffset + 3];  // Alpha
            }
         }

         // Now that we have a full pixmap with the alpha channel
         // included we don't need the XOR Mask.
         mask = [];
      }

      this._changeCursor(pixels, mask,
                         rect.x,
                         rect.y,
                         rect.width,
                         rect.height);
      this.nextRect();
   },

   readVMWCursorState: function(rect) {
      var cursorState = this.readInt16();
      var visible = (cursorState & 0x01);
      this.options.canvas.style.cursor = (visible ? this._currentCursorURI : "none");
      this.nextRect();
   },

   readVMWCursorPosition: function (rect) {
      // We cannot warp or move the host/browser cursor
      this.nextRect();
   },

  _fillRectWithColor: function(x, y, width, height, color) {
    var newStyle;
    newStyle = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
    if (newStyle !== this._currCanvasFillStyle) {
        this._canvas2DContext.fillStyle = newStyle;
        this._currCanvasFillStyle = newStyle;
    }
    this._canvas2DContext.fillRect(x, y, width, height);
  },

  _blitImageString: function(x, y, width, height, str) {
    var img, i, data;
    img = this._canvas2DContext.createImageData(width, height);
    data = img.data;
    for (i=0; i < (width * height * 4); i=i+4) {
       data[i    ] = str.charCodeAt(i + 2);
       data[i + 1] = str.charCodeAt(i + 1);
       data[i + 2] = str.charCodeAt(i + 0);
       data[i + 3] = 255; // Set Alpha
    }
    this._canvas2DContext.putImageData(img, x, y);
  },

  _changeCursor: function(pixels, mask, hotx, hoty, w, h) {
    var cursorData = [];

    var RGBImageDataSize = w * h * 4;   // 32 bits per pixel image data
    var maskSize = Math.ceil((w * h) / 8.0);  // 1 bit per pixel of mask data.

    var cursorDataSize = RGBImageDataSize + 40 /* Bitmap Info Header Size */ + (maskSize * 2) /* 2 masks XOR & AND */;

    // We need to build an array of bytes that looks like a windows .CUR -
    // see http://en.wikipedia.org/wiki/ICO_(file_format) &
    // http://en.wikipedia.org/wiki/BMP_file_format
    cursorData.push16le(0);
    cursorData.push16le(2);   // .CUR type
    cursorData.push16le(1);   // One image

    cursorData.push8(w);
    cursorData.push8(h);
    cursorData.push8(0);   // True Color cursor
    cursorData.push8(0);
    cursorData.push16le(hotx);  // Hotspot X location
    cursorData.push16le(hoty);  // Hostpot Y location
    cursorData.push32le(cursorDataSize);  // Total size of all image data including their headers (but excluding this header).
    cursorData.push32le(cursorData.length+4);    // Offset (immediately past this header) to the BMP data

    // Bitmap Info Header
    cursorData.push32le(40);  // Bitmap Info Header size
    cursorData.push32le(w);
    cursorData.push32le(h*2);
    cursorData.push16le(1);
    cursorData.push16le(32);
    cursorData.push32le(0);   // Uncompressed Pixel Data
    cursorData.push32le(RGBImageDataSize  + (2 * maskSize));
    cursorData.push32le(0);
    cursorData.push32le(0);
    cursorData.push32le(0);
    cursorData.push32le(0);

    // Store the image data - note that the data is specified UPSIDE DOWN !
    for (y = h-1; y >= 0; y -= 1) {
      for (x = 0; x < w; x += 1) {
        // The mask is an array where each bit position indicates whether or
        // not the pixel is transparent. We need to convert that to an alpha
        // value for the pixel (clear or solid).
        var arrayPos = y * Math.ceil(w/8) + Math.floor(x/8);
        var alpha = 0;
        if (mask.length > 0) {
          alpha = (mask[arrayPos] << (x % 8)) & 0x80 ? 0xff : 0;
        }

        arrayPos = ((w * y) + x) * 4;
        cursorData.push8(pixels[arrayPos+2]);
        cursorData.push8(pixels[arrayPos+1]);
        cursorData.push8(pixels[arrayPos]);
        if (mask.length > 0) {
          cursorData.push8(alpha);
        } else {
          cursorData.push8(pixels[arrayPos+3]);
        }
      }
    }

    // The XOR and AND masks need to be specified - but the data is unused since the alpha
    // channel of the cursor image is sufficient. So just fill in a blank area for each.
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
    this.options.canvas.style.cursor = this._currentCursorURI;
  }

});

