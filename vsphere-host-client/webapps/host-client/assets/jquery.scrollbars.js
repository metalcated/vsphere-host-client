/* Copyright 2011 VMware, Inc. All rights reserved. -- VMware Confidential
 *
 * This requires jQuery 1.4.2 or greater to be loaded first!
 */

(function($){

   // Global vars
   var MIN_WINDOW_WIDTH;
   var MIN_WINDOW_HEIGHT;
   var _scrollbarSize;
   var _appId;
   var _timer = null;

   var methods = {
      init: function(options) {
         if (!options) {
            return;
         }
         _appId = options.swfId;

         setMinWidthAndHeight(options.minWidth, options.minHeight);

         $(window).resize(onWindowSizeChanged);

      },

      // Sets the min width and height. Will be called from within the AS application
      setMinWidthAndHeight: function(w, h) {
         setMinWidthAndHeight(w, h);
      }
   };

   // register this plugin with jQuery
   $.scrollbars = function( method ) {

       // Method calling logic
       if ( methods[method] ) {
         return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
       } else if ( typeof method === 'object' || ! method ) {
         return methods.init.apply( this, arguments );
       } else {
         $.error( 'Method ' +  method + ' does not exist on jQuery.scrollbars' );
       }

   };

   // Calculate the thickness of the scroll bar. If no value can be determined, a default
   // value is used.
   function scrollbarSize() {
      var size = 0;
      if (!_scrollbarSize) {
         var div = $('<div style="width:50px;height:50px;overflow:hidden;position:abso' +
                     'lute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
         // Append div, do calculation and then remove it
         $(document.body).append(div);
         var w1 = $("div", div).innerWidth();
         div.css('overflow-y', 'scroll');
         var w2 = $("div", div).innerWidth();
         $(div).remove();
         size = (w1 - w2);

         // fall back, if this approach failed
         if (size == 0) {
            // Check if Windows..
            if (navigator.platform.search(/win/i) != -1) {
               return 20;
            } else {
               // Other wise
               return 15;
            }
         } else {
            _scrollbarSize = size;
         }
      }
      return _scrollbarSize;
   };

   // Set the minimum width and height
   function setMinWidthAndHeight(w, h) {
      if (w && w > 0) {
         MIN_WINDOW_WIDTH  = w;
      }
      if (h && h > 0) {
         MIN_WINDOW_HEIGHT = h;
      }
      adjustSwf();
   }

   // Window size change handler. Defers the adjusting of the SWF such that a multitude of
   // resize events don't triger massive relayouting
   function onWindowSizeChanged(event) {
      if (_timer != null) {
         clearTimeout(_timer);
      }
      _timer = setTimeout(adjustSwf, 30);
   };

   // Enforces minimum width and height on the SWF, triggering scrollbars to (dis)appear
   function adjustSwf() {
      if (!MIN_WINDOW_WIDTH || !MIN_WINDOW_HEIGHT) {
         return;
      }
      var app = $(_appId);
      var win = $(window);

      if (win.width() < MIN_WINDOW_WIDTH) {
         app.width(MIN_WINDOW_WIDTH);
      } else {
         app.width(win.width());

         // This is necessary to force IE to relayout and effectively
         // change the geometry of the swf
         setTimeout(function() {
               $(_appId).offset({left:-1, top:-1}).css("width", "100%").offset({left:0, top:0});
            }, 60);
      }

      if (win.height() < MIN_WINDOW_HEIGHT) {
         app.height(MIN_WINDOW_HEIGHT);
      } else {
         app.height(win.height());

         // This is necessary to force IE to relayout and effectively
         // change the geometry of the swf
         setTimeout(function() {
               $(_appId).offset({left:-1, top:-1}).css("height", "100%").offset({left:0, top:0});
            }, 60);
      }
   };

})(jQuery);