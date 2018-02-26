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

To make the script a little more efficient, we store the current state of every CO in an array and only touch the DOM CSS properties when there is a change. This avoids the DOM CSS being manipulated more often than necessary and possibly causing unnecessary re-renders.

## How to use

To use Scrolling Animation, first you'll have to assign an ID to the elements that are being manipulated (COs) and optionally an ID to the elements that will function as BTP and ETP (if you want to use elements instead of absolute pixel positions):

```
<div id="BTP"></div>
<div id="ETP"></div>
<div id="object"></div>
```

Then, create a new Scrolling Animation using the following syntax:

```
new ScrollingAnimation(CO, ABS, AES, BTP, ETP);
```

CO should be either a string containing a single ID or an array containing the strings of all the Controlled Objects.

ABS and AES should be Javascript objects containing the CSS properties that will be controlled during the animation. Both of them should only have matching keys, or the script will log an error to the console and cancel the animation. In the case of the backgroundColor and color properties, their values should also be objects containing the red, green, blue and alpha values of the color. All the color fields must be specified, as in { red: 0, green: 23, blue: 255, alpha: 1 }.

The CSS properties supported right now are:

- top
- bottom
- left
- right
- opacity
- backgroundColor
- color

Or any other CSS property whose value is only a number (as the opacity for example).

BTP and ETP should both be Javascript objects with either an id field (with the ID of the BTP/ETP element) or a posY field (with the BTP/ETP Y position in pixels). If invalid fields are used, the default values of id and posY will be null and 0 respectivelly. If id has any value other than null it will be used instead of the absolute position.

### Examples:

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
