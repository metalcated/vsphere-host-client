/* Copyright 2012 VMware, Inc. All rights reserved. */

// This provides fullscreen functionality to the HTML console.
(function () {

    var console = document.getElementById("console")
        consoleFullScreen = document.getElementById("console-fullscreen");

    // Fullscreen API names are different for each browser
    var prefix = "";

    // Setting the prefix for fullscreen based on browser (Mozilla and Chrome)
    if (console) {
        if (console.mozRequestFullScreen) {
            prefix = "moz";
        } else if (console.webkitRequestFullScreen) {
            prefix = "webkit";
        }
    }

    // Will perform fullscreen request when requested by the user
    if (console && consoleFullScreen) {
        consoleFullScreen.addEventListener("click", function (evt) {
            if (console.requestFullscreen) {
                console.requestFullscreen();
            } else if (console.mozRequestFullScreen) {
                console.mozRequestFullScreen();
            } else if (console.webkitRequestFullScreen) {
                console.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        }, false);
    }

    // Returns true if the view is in fullscreen and flase otherwise.
    isFullScreen = function() {
        switch (prefix) {
            case '':
                return document.fullScreen;
            case 'webkit':
                return document.webkitIsFullScreen;
            default:
                return document[this.prefix + 'FullScreen'];
        }
    }

    // Original height and width of the canvas.
    var originalHeight = $("#console .wmks canvas").height();
    var originalWidth = $("#console .wmks canvas").width();

    // Changes the positioning of the console to make sure it is
    // centered in fullscreen mode.
    console.addEventListener(prefix + "fullscreenchange", function () {
        if (isFullScreen()) {
            document.getElementById("console").style.position = '';
            // Resizing to fit the screen.
            if ($("#console .wmks canvas").height() > window.innerHeight) {
                $("#console .wmks canvas").height(window.innerHeight);
                $("#console .wmks canvas").width(originalWidth/originalHeight * window.innerHeight);
            } 

            if ($("#console .wmks canvas").width() > window.innerWidth) {
                $("#console .wmks canvas").width(window.innerWidth);
                $("#console .wmks canvas").height(originalHeight/originalWidth * window.innerWidth);
            }
        } else {
            document.getElementById("console").style.position = 'fixed';
            // Resizing to fit back
            $("#console .wmks canvas").height(originalHeight);
            $("#console .wmks canvas").width(originalWidth);
        }
    }, true)
})();