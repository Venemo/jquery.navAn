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
Pattern that tells how to perform the navigation animation when going backwards. See below for more details about patterns.

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
* `load`
Can override the `load` parameter of the initialization.
* `pattern`
Can override the `pattern` parameter of the initialization. See below for more details about patterns.
* `backPattern`
Can override the `backPattern` parameter of the initialization. See below for more details about patterns.

### Examples of customization

Coming soon. Stay tuned!

#### Integration with existing infrastructure

If you want to integrate this plugin with you existing infrastructure (for example, your own server or your javascript templating),
you can do it by specifying the `load` parameter. In that parameter, you can pass in a function which downloads content from your service
and performs the templating.
