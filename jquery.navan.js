
// Copyright (C) 2013, Timur Kristóf <venemo@fedoraproject.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
// Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

(function($) {

    $.fn.navAn = function(options) {
        // Get options
        options = $.extend({
            load: function(url) {
                var suffix = "!content";
                var getUrl = (url[url.length - 1] === '/') ? (url + suffix) : (url + "/" + suffix);
                return $.get(getUrl);
            },
            animationCompleted: null,
            pushedBy: "navAn",
            defaultTitle: $("title").text(),
            handleNullState: true,
            animationDuration: 400,
            pattern: defaultPattern1,
            backPattern: defaultPattern2
        }, options);

        // Get jQuery DOM element
        var $this = this;
        var isPushStateAvailable = typeof(window.history.pushState) === "function";
        var initialState = null;
        var currentState = null;
        var popstateReady = false;
        var transitionDurationStr = String((options.animationDuration / 1000).toFixed(3)) + "s";

        // Initializes the plugin for the given element
        var init = function() {
            if (!isPushStateAvailable) {
                console.log("jQuery.navAn: window.history.pushState is unavailable.");
                return;
            }

            // Create initial state
            initialState = createState($this.html(), options);
            currentState = initialState;

            // Event listener for popstate so that we can animate when the user presses back
            window.addEventListener('popstate', function(event) {
                if (!popstateReady) {
                    return;
                }

                // Find out the new state
                var state = null;
                if (event.state && event.state.pushedBy === options.pushedBy) {
                    state = event.state;
                }
                if (!event.state && options.handleNullState) {
                    state = initialState;
                }

                // If the state is found, do the animations
                if (state) {
                    var pattern = (state.time > currentState.time) ? (state.pattern) : (state.backPattern);
                    animate(state.data, pattern);
                    currentState = state;
                }
            });
        };

        // Creates the state object to save with pushState
        var createState = function(data, navOptions) {
            return {
                pushedBy: options.pushedBy,
                data: data,
                pattern: navOptions.pattern,
                backPattern: navOptions.backPattern,
                time: +(new Date())
            };
        };

        // Removes a bunch of classes from an element
        var removeClasses = function($e, classes) {
            for (var i = 0; i < classes.length; i++) {
                $e.removeClass(classes[i]);
            }
        };

        // Adds a bunch of classes to an element
        var addClasses = function($e, classes) {
            for (var i = 0; i < classes.length; i++) {
                $e.addClass(classes[i]);
            }
        };

        // Animates in the given HTML fragment
        var animate = function(data, pattern) {
            if (!data.trim()) {
                console.log("data is empty");
                $this.empty();
                return;
            }

            var $new = $(data);
            var $old = $this.children();
            while ($old.length > 1) {
                $($old[0]).remove();
                $old = $this.find("> " + $new[0].nodeName);
            }

            if ($old.length === 0) {
                $this.html(data);
                return;
            }

            // TODO: detect CSS transition support

            // Add new element to DOM
            $new.appendTo($this);

            // Scroll to top
            $(window).scrollTop(0);
            // Adjust height of container
            $this.css("overflow", "hidden");
            $this.height(Math.max($old.outerHeight(), $new.outerHeight()));

            // Apply initial changes to DOM
            $old.css({
                "transition-duration": "0s",
                "opacity": 1,
                "transform:": "none"
            });
            $new.css({
                "transition-duration": "0s",
                "opacity": 0
            });
            var translateY = String(-$old.outerHeight());
            var transform = "translateY(" + translateY + "px) scale(0.7) translateX(1000px)";
            $new.css("transform", transform);
            $new.css("-webkit-transform", transform);

            setTimeout(function() {
            window.requestAnimationFrame(function() {
                $old.css("transition-duration", transitionDurationStr);
                $new.css("transition-duration", transitionDurationStr);

                setTimeout(function() {
                window.requestAnimationFrame(function() {
                    $old.css({
                        "opacity": 0,
                        "transform": "scale(0.7) translateX(-1000px)",
                        "-webkit-transform": "scale(0.7) translateX(-1000px)"
                    });
                    $new.css({
                        "opacity": 1,
                        "transform": "translateY(" + translateY + "px) scale(1) translateX(0px)",
                        "-webkit-transform": "translateY(" + translateY + "px) scale(1) translateX(0px)"
                    });

                    setTimeout(function() {
                        window.requestAnimationFrame(function() {

                            setTimeout(function() {
                                window.requestAnimationFrame(function() {
                                $new.css("transition-duration", "0s");

                                setTimeout(function() {
                                window.requestAnimationFrame(function() {
                                    $old.remove();
                                    $new.css({
                                        "transform": "none",
                                        "-webkit-transform": "none"
                                    });

                                    // Adjust height of container
                                    $this.css("overflow", "hidden");
                                    $this.height($new.outerHeight());

                                    options.animationCompleted && options.animationCompleted();
                                });
                                }, 50);
                            });
                            }, 50);
                        });
                    }, options.animationDuration + 100);
                });
                }, 50);
            });
            }, 50);
        };

        // Navigates to a given URL
        var navigate = function(url, navOptions) {
            // Don't do anything if we're already there
            if (url == window.location.pathname) {
                return;
            }

            // If pushState is not available, fallback to fullpage reload
            if (!isPushStateAvailable) {
                window.location = url;
                return;
            }

            // Get options
            navOptions = $.extend({
                title: options.defaultTitle,
                pattern: options.pattern,
                backPattern: options.backPattern,
                load: options.load
            }, navOptions);

            // Load URL
            navOptions.load(url).done(function(data) {
                // Call pushState
                currentState = createState(data, navOptions);
                window.history.pushState(currentState, navOptions.title, url);
                popstateReady = true;

                // Animation
                animate(data, currentState.pattern);
            });
        };

        // Call init on document ready
        $(init);

        // Public API
        $this.data("navAn", {
            navigate: navigate
        });

        // Return this to maintain chainability
        return this;

    };

    var defaultCss = ".navan-disappear-1 {\
        -webkit-transform: scale(0.7) translate(-1000px, 0);\
        transform: scale(0.7) translate(-1000px, 0);\
        opacity: 0;\
        transition-duration: 0.5s;\
    }\
    .navan-appear-init-1 {\
        -webkit-transform: scale(0.7) translate(1000px, 0);\
        transform: scale(0.7) translate(1000px, 0);\
        opacity: 0.4;\
    }\
    .navan-appear-1 {\
        -webkit-transform: scale(1) translate(0, 0);\
        transform: scale(1) translate(0, 0);\
        opacity: 1;\
        transition-duration: 0.5s;\
    }\
    \
    .navan-disappear-2 {\
        -webkit-transform: scale(0.7) translate(1000px, 0);\
        transform: scale(0.7) translate(1000px, 0);\
        opacity: 0;\
        transition-duration: 0.5s;\
    }\
    .navan-appear-init-2 {\
        -webkit-transform: scale(0.7) translate(-1000px, 0);\
        transform: scale(0.7) translate(-1000px, 0);\
        opacity: 0.4;\
    }\
    .navan-appear-2 {\
        -webkit-transform: scale(1) translate(0, 0);\
        transform: scale(1) translate(0, 0);\
        opacity: 1;\
        transition-duration: 0.5s;\
    }";

    $(function() {
        // Insert default CSS
        $("head").append("<style type='text/css'>" + defaultCss + "</style>");
    });

    // Old element jumps out to the left and fades out, new element fades in and jumps in from the right
    var defaultPattern1 = {
        init: {
            classFromOld: ["navan-appear-1", "navan-appear-init-1", "navan-appear-2", "navan-appear-init-2"],
            classForNew: ["navan-appear-init-1"]
        },
        anim: {
            classForOld: ["navan-disappear-1"],
            classForNew: ["navan-appear-1"]
        }
    };

    // Old element jumps out to the right and fades out, new element fades in and jumps in from the left
    var defaultPattern2 = {
        init: {
            classFromOld: ["navan-appear-1", "navan-appear-init-1", "navan-appear-2", "navan-appear-init-2"],
            classForNew: ["navan-appear-init-2"]
        },
        anim: {
            classForOld: ["navan-disappear-2"],
            classForNew: ["navan-appear-2"]
        }
    };
})(jQuery);
