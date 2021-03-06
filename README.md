# Scrolling Animation

## Description

Scrolling Animation is a script written in pure Javascript with the purpose of implementing easy-to-use scrolling activated animations in websites. Those can be used to improve the User Experience, by making the website content display a little more dynamic.

Its implementation and usage is explained in details in this page. If you're not interested in how it works, and just want to quickly learn how to use it in your website just skip to the "How to use" section.

## Implementation

To avoid using repeated long words a lot of times in this documentation, I'll list some of the definitions relevant to the script implementation and their abbreviations. If you run into an abbreviation that you're not sure the meaning of, come back here to find it!

### Abbreviations:

- CO (Controlled Object) - Those are the elements being controlled by the animation. Their DOM CSS properties will be updated according to the animation state. 
- ABS (Animation Beginning State) - This is the state of the COs before and at the animation beginning. It's an object containing the list of properties that are controlled by the animation. 
- AES (Animation Ending State) - This is the state of the COs at the ending and after the animation is done. It's an object containing the list of properties that are controlled by the animation. 
- BTP (Beginning Triggering Point) - This is the point that will trigger the beginning of the animation. It can be either a screen Y position in pixels or an element's ID. 
- ETP (Ending Triggering Point) - This is the point that will trigger the end of the animation. It can be either a screen Y position in pixels or an element's ID. 

Before the viewport top border reaches the BTP element or position, the animation will be in the "Inactive" state. In that state, the COs properties will be equal to the ABS properties.

In the moment the viewport top border hits the BTP, the animation will shift to the "Active" state. The COs properties will be calculated according to the ratio of the current viewport position and the distance between the BTP and ETP. The closer the screen is to the ETP, the closer the properties will be to the AES, and the closer the screen is to the BTP, the closer the properties will be to the ABS.

Once the viewport passes the ETP, the animation will shift to the "Done" state, where all the COs properties will be equal to the AES.

To make the script a little more efficient, on every iteration we check if the animation state or ratio has changed before calling the function that will update the Controlled Objects and their CSS properties. This avoids useless function calls and, most importantly, the DOM CSS being manipulated more often than necessary, possibly causing redundant re-renders.

## How to use

To use Scrolling Animation, first you'll have to assign an ID to the elements that are being manipulated (COs) and optionally an ID to the elements that will function as BTP and ETP (if you want to use elements instead of absolute pixel positions):

```
<div id="BTP"></div>
<div id="ETP"></div>
<div id="object"></div>
```

Then, create a new Scrolling Animation using the following syntax:

```
new ScrollingAnimation(CO, ABS, AES, BTP, ETP, Config);
```

_CO_ should be either a string containing a single ID or an array containing the strings of all the Controlled Objects.

_ABS_ and _AES_ should be Javascript objects containing the CSS properties that will be controlled during the animation. Both of them should __only__ have matching keys, or the script will log an error to the console and cancel the animation. In the case of the backgroundColor and color properties, their values should also be objects containing the red, green, blue and alpha values of the color. __All__ the color fields must be specified, as in _{ red: 0, green: 23, blue: 255, alpha: 1 }_.

The CSS properties supported right now are:

- top
- bottom
- left
- right
- opacity
- backgroundColor
- color

Or any other CSS property whose value is only a __number__ (as the _opacity_ for example).

_BTP_ and _ETP_ should both be Javascript objects with either an _id_ field (with the ID of the _BTP_/_ETP_ element) or a _posY_ field (with the _BTP_/_ETP_ Y position in pixels). If they are not supplied, the default values of _id_ and _posY_ will be _null_ and 0 respectivelly. If id has any value other than null the element with its ID will be used, and _posY_ will represent an offset from that element. For example, `{ id:"box", posY: 100}` means we will use the element with the ID "box" as a BTP/ETP, but only start after an offset of 100px from it. Negative offsets are also valid.

Finally, _Config_ is a Javascript object with the configuration settings for this Scrolling Animation instance. This is optional and can be ommited if the default configuration settings are desired. The configuration options supported are listed below:

- killOnEnd - If this configuration is set to true, the animation will kill itself once it reaches the "Done" state. The default value is _false_.
- callback - An optional callback function in the format `function(state, ratio)` that will be called every time there is a state or ratio change. This function allows the user to customize responses to state changes and extend the script functionality. The default value is _null_.

### Using units on position properties:

When using the _top_, _bottom_, _left_ and _right_ CSS properties, there are two options: Define the CSS unit to be used or use the default "px" unit.

If both the ABS and AES have a unitless number, the default "px" unit is assumed.

```
new ScrollingAnimation("id", { left: 0 }, { left: 50 }, { id: "BTP" }, { id: "ETP" });
// Implicit pixels unit: ABS has left = 0px and AES has left = 50px.
```

If either ABS or AES have a unitless number, but the other one __specifies__ a unit, this unit will be used on __both__.

```
new ScrollingAnimation("id", { left: "0vw" }, { left: 50 }, { id: "BTP" }, { id: "ETP" });
// Explicit viewport-width unit: ABS has left = 0vw and AES has left = 50vw.
```

If both ABS and AES have a unit, their unit is going to be used. __But their units must match__, or you'll have the unwanted behavior of having the ABS unit being used in the "Inactive" and "Active" states, while the AES unit is used in the "Done" state. That's almost certainly not what you desire.

```
new ScrollingAnimation("id", { left: "-50vw" }, { left: "50vw" }, { id: "BTP" }, { id: "ETP" });
// Explicit viewport-width unit: ABS has left = -50vw and AES has left = 50vw. // The units match!
```

Remember to use quotes if you are using units, since `{ left: 50vw }` is invalid Javascript.

### Using callbacks to extend functionality

The callback configuration gives us the possibility of implementing functionality that is not natively supported by the script: changing non-supported CSS properties, or reacting to changes in more complex ways like iterating through different pictures for example.

To do that, we create a function that will receive the state and ratio as arguments, and use their values to react to the animation state change. State will be 0 for Inactive, 1 for Active and 2 for Done, while ratio will be a floating point number between 0 and 1, 0 being the closest to the BTP and 1 the closest to the ETP.

## Examples:

Single object being animated with DOM elements as triggering points

```
<script type="text/javascript">
new ScrollingAnimation("id", { left: 0 }, { left: 200 }, { id: "BTP" }, { id: "ETP" });
</script>
```

Multiple objects being animated with absolute positions as triggering points:

```
<script type="text/javascript">
new ScrollingAnimation(["id1", "id2"], { left: 0 }, { left: 200 }, { posY: 100 }, { posY: 500 });
</script>
```

backgroundColor being animated:

```
<script type="text/javascript">
new ScrollingAnimation("id", { backgroundColor: {red:0, green:255, blue:0, alpha:1 } }, { backgroundColor: {red:255, green:0, blue:0, alpha:1 } }, { posY: 100 }, { posY: 500 });
</script>
```

Multiple properties being animated:

```
<script type="text/javascript">
new ScrollingAnimation(["id1", "id2"], { left: 0, opacity: 0 }, { left: 200, opacity: 1 }, { posY: 100 }, { posY: 500 });
</script>
```

Enabling the killOnEnd configuration:

```
<script type="text/javascript">
new ScrollingAnimation("id", { left: 0 }, { left: 200 }, { id: "BTP" }, { id: "ETP" }, { killOnEnd: true });
</script>
```

Using a callback with the animation:

```
<script type="text/javascript">
var myFunc = function(state, ratio){
	// Does something with the animation state and ratio...
}
new ScrollingAnimation("id", { left: 0 }, { left: 200 }, { id: "BTP" }, { id: "ETP" }, { callback: myFunc });
</script>
```
