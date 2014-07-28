
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

(function ($) {

    // Hack around inconsistent window.requestAnimationFrame support
    // NOTE: in some browsers, even requestAnimationFrame doesn't do the trick, some setTimeout is always necessary
    var animationNextState;
    if (typeof (window.requestAnimationFrame) === "function") {
        animationNextState = function (callback) {
            setTimeout(function () {
                window.requestAnimationFrame(function () {
                    callback();
                });
            }, 50);
        };
    }
    else {
        animationNextState = function (callback) {
            setTimeout(callback, 200);
        };
    }

    // Builds a CSS transform string from an object
    var buildCssTransform = function (obj) {
        var result = "";

        for (var i in obj) {
            if (!obj.hasOwnProperty(i))
                continue;

            var v = obj[i];
            result += " " + String(i) + "(";
            if (typeof (v) === "number" && (i !== "scale"))
                result += String(v) + "px";
            else
                result += String(v);

            result += ")";
        }

        return result.trim();
    };

    $.fn.navAn = function (options) {
        // Get options
        options = $.extend({
            load: function (url) {
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
            backPattern: defaultPattern2,
            usePushState: true,
            disallowSameUrl: true
        }, options);

        // Get jQuery DOM element
        var $this = this;
        var isPushStateAvailable = window.history && typeof (window.history.pushState) === "function";
        var initialState = null;
        var currentState = null;
        var popstateReady = false;
        var transitionDurationStr = String((options.animationDuration / 1000).toFixed(3)) + "s";

        // Initializes the plugin for the given element
        var init = function () {
            if (options.usePushState && !isPushStateAvailable) {
                console.log("jQuery.navAn: window.history.pushState is unavailable.");
                return;
            }

            // Create initial state
            initialState = createState($this.html(), options);
            currentState = initialState;

            if (options.usePushState) {
                // Event listener for popstate so that we can animate when the user presses back
                window.addEventListener('popstate', function (event) {
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
            }
        };

        // Creates the state object to save with pushState
        var createState = function (data, navOptions) {
            return {
                pushedBy: options.pushedBy,
                data: data,
                pattern: navOptions.pattern,
                backPattern: navOptions.backPattern,
                time: +(new Date())
            };
        };

        // Animates in the given HTML fragment
        var animate = function (data, pattern) {
            if (!data || (typeof (data) === "string" && !data.trim())) {
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

            // This function will set the start state of each DOM element
            var setStartState = function () {
                // Apply pattern start for old item
                var transformStartForOldStr = buildCssTransform(pattern.oldItem.start);
                $old.css({
                    "transition-duration": "0s",
                    "opacity": 1,
                    "transform": transformStartForOldStr,
                    "-webkit-transform": transformStartForOldStr
                });

                // Apply pattern start for new item
                pattern.newItem.start.translateY = -$old.outerHeight();
                var transformStartForNewStr = buildCssTransform(pattern.newItem.start);
                $new.css({
                    "transition-duration": "0s",
                    "opacity": 0,
                    "transform": transformStartForNewStr,
                    "-webkit-transform": transformStartForNewStr
                });
            };

            // This function will set the CSS transition duration on each element
            var setTransitionDuration = function () {
                $old.css("transition-duration", transitionDurationStr);
                $new.css("transition-duration", transitionDurationStr);
            };

            // This function will set the end state of each DOM element
            var setEndState = function () {
                // Apply pattern end state for old item
                var transformEndForOldStr = buildCssTransform(pattern.oldItem.end);
                $old.css({
                    "opacity": 0,
                    "transform": transformEndForOldStr,
                    "-webkit-transform": transformEndForOldStr
                });

                // Apply pattern end state for new item
                pattern.newItem.end.translateY = pattern.newItem.start.translateY;
                var transformEndForNewStr = buildCssTransform(pattern.newItem.end);
                $new.css({
                    "opacity": 1,
                    "transform": transformEndForNewStr,
                    "-webkit-transform": transformEndForNewStr
                });
            };

            // Set start state
            setStartState();
            // Wait for CSS to get applied
            animationNextState(function () {
                // Set transition duration
                setTransitionDuration();
                // Wait for CSS to get applied
                animationNextState(function () {
                    // Set end state transition
                    setEndState();

                    animationNextState(function () {
                        // Callback for when the animation has started
                        options.animationStarted && options.animationStarted($old, $new);
                    });

                    // Wait for transition to finish
                    setTimeout(function () {
                        // Remove old element entirely
                        $old.remove();
                        // Clean up transform CSS
                        $new.css({
                            "transition-duration": "0s",
                            "transform": "none",
                            "-webkit-transform": "none"
                        });

                        // Adjust height of container
                        $this.css("overflow", "hidden");
                        $this.height($new.outerHeight());

                        // Callback for when the animation has ended
                        options.animationCompleted && options.animationCompleted($old, $new);
                    }, options.animationDuration + 100);
                });
            });
        };

        // Navigates to a given URL
        var navigate = function (url, navOptions) {
            // Default URL
            url = url || window.location.pathname;

            // Don't do anything if we're already there
            if (options.disallowSameUrl && url === window.location.pathname) {
                return;
            }

            // If pushState is not available, fallback to fullpage reload
            if (options.usePushState && !isPushStateAvailable) {
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
            navOptions.load(url).done(function (data) {
                currentState = createState(data, navOptions);

                // Call pushState
                if (options.usePushState) {
                    window.history.pushState(currentState, navOptions.title, url);
                    popstateReady = true;
                }

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

    // Old element jumps out to the left and fades out, new element fades in and jumps in from the right
    var defaultPattern1 = {
        oldItem: {
            start: {
                translateX: 0,
                scale: 1
            },
            end: {
                translateX: -1000,
                scale: 0.7
            }
        },
        newItem: {
            start: {
                translateX: 1000,
                scale: 0.7
            },
            end: {
                translateX: 0,
                scale: 1
            }
        }
    };

    // Old element jumps out to the right and fades out, new element fades in and jumps in from the left
    var defaultPattern2 = {
        oldItem: {
            start: {
                translateX: 0,
                scale: 1
            },
            end: {
                translateX: 1000,
                scale: 0.7
            }
        },
        newItem: {
            start: {
                translateX: -1000,
                scale: 0.7
            },
            end: {
                translateX: 0,
                scale: 1
            }
        }
    };

    // Allow users to use the default patterns from outside
    $.fn.navAn.defaultPattern1 = defaultPattern1;
    $.fn.navAn.defaultPattern2 = defaultPattern2;

})(jQuery);
