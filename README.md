jQuery navigation animation plugin
==================================

jQuery.navAn is a plugin that allows you to do partial page loads via AJAX while modifying the displayed URL and animating the result.
To this end, the HTML 5 history API is used. If it's not available, it will fallback to full-page reloads.
Animations are implemented with CSS transitions and are fully customizable. When they're not available, no animation will happen.

Basic usage
-----------

### Simple example

```javascript
// Initialize plugin
var nav = $("...").navAn().data("navAn");
// Navigate
nav.navigate("/your/path");
```

### Hooking up to all links on a site

```javascript

// Find container element
var $main = $(".your-main");
// Initialize navigation animation plugin
var mainNav = $main.navAn({
    // options (see below for customization)
}).data("navAn");

// Create an event handler for all links on the site whose href is a site-relative URL
$("body").on('click.ts', 'a[href^="/"]', function (event) {
    var $this = $(this);
    var href = $this.attr("href");

    // Call navigate of the navAn object
    mainNav.navigate(href);

    // Prevent the link from doing what it would normally do
    event.preventDefault();
    return false;
});

```

Advanced usage and customization
------------------------------

### Plugin initialization options

```javascript
// Initialize plugin
var nav = $("...").navAn({
    load: function
    pushedBy: string
    defaultTitle: string
    handleNullState: bool,
    animationDuration: number,
    pattern: object,
    backPattern: object
}).data("navAn");
```

* `load`
Function that tells the plugin how to load a URL via AJAX.
This function MUST return a jQuery Deferred object that should be resolved with the HTML fragment to be inserted into the DOM.
* `defaultTitle`
Specifies the default title to give to pushState as parameter.
Default value is the text of the current `title` element.
* `animationDuration`
Number of milliseconds after which the plugin can safely remove an element, ie. when its animation is completed.
* `pattern`
Pattern that tells how to perform the navigation animation. See below for more details about patterns.
* `backPattern`
Pattern that tells how to perform the navigation animation when going backwards (ie. when the user presses the back button in the browser). See below for more details about patterns. This is not applicable if `usePushState` is `false`.
* `usePushState` (default true)
Tells whether or not to use the HTML5 history API. When false, there will not be an option to go back to a previous state.
* `disallowSameUrl` (default true)
Tells whether to allow loading the same URL as the browser window is on.

### Options for navigation

```javascript
// Navigate
nav.navigate(url, {
    title: string,
    load: function,
    pattern: object,
    backPattern: object
});
```

* `title`
The title to pass to pushState. If not specified, the defaultTitle above is used.
* `load`, `pattern`, `backPattern`
These can override the parameters specified in the initialization call to `navAn()`, just for this particular operation.

### Examples of customization

#### Patterns

An example pattern looks like this:

```javascript
var myPattern = {
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
```

It contains possible CSS transforms that will be applied.

* `oldItem.start` is applied to the old item (the one that is animated out) before the transition starts
* `newItem.start` is applied to the new item (the one that is animated in) before the transition starts
* `oldItem.end` is applied to the old item for the transition
* `newItem.end` is applied to the old item for the transition

#### Integration with existing infrastructure

If you want to integrate this plugin with you existing infrastructure (for example, your own server or your javascript templating),
you can do it by specifying the `load` parameter. In that parameter, you can pass in a function which downloads content from your service
and performs the templating.
