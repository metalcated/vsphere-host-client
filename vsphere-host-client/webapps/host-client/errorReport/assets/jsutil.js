/**
 * Copyright 2011 VMware, Inc.  All rights reserved. -- VMware Confidential
 */

/**
 * Get html element by id.
 */
function getObject(id) {
   return document.getElementById(id);
}

/**
 * Get window size.
 * @returns {width:#, height:#}
 */
function getWindowSize() {
   // Based on: http://www.javascripter.net/faq/browserw.htm
   var winW = 630, winH = 460;
   if (document.body && document.body.offsetWidth) {
      winW = document.body.offsetWidth;
      winH = document.body.offsetHeight;
   }
   if (document.compatMode == 'CSS1Compat' && document.documentElement &&
         document.documentElement.offsetWidth) {
      winW = document.documentElement.offsetWidth;
      winH = document.documentElement.offsetHeight;
   }
   if (window.innerWidth && window.innerHeight) {
      winW = window.innerWidth;
      winH = window.innerHeight;
   }
   result = {width:winW, height:winH};
   return result;
}