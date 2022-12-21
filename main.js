/*!
 * swiped-events.js - v@version@
 * Pure JavaScript swipe events
 * https://github.com/john-doherty/swiped-events
 * @inspiration https://stackoverflow.com/questions/16348031/disable-scrolling-when-touch-moving-certain-element
 * @author John Doherty <www.johndoherty.info>
 * @license MIT
 */
(function (window, document) {
  "use strict";

  // patch CustomEvent to allow constructor creation (IE/Chrome)
  if (typeof window.CustomEvent !== "function") {
    window.CustomEvent = function (event, params) {
      params = params || {
        bubbles: false,
        cancelable: false,
        detail: undefined,
      };

      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(
        event,
        params.bubbles,
        params.cancelable,
        params.detail
      );
      return evt;
    };

    window.CustomEvent.prototype = window.Event.prototype;
  }

  document.addEventListener("touchstart", handleTouchStart, false);
  document.addEventListener("touchmove", handleTouchMove, false);
  document.addEventListener("touchend", handleTouchEnd, false);

  var xDown = null;
  var yDown = null;
  var xDiff = null;
  var yDiff = null;
  var timeDown = null;
  var startEl = null;

  /**
   * Fires swiped event if swipe detected on touchend
   * @param {object} e - browser event object
   * @returns {void}
   */
  function handleTouchEnd(e) {
    // if the user released on a different target, cancel!
    if (startEl !== e.target) return;

    var swipeThreshold = parseInt(
      getNearestAttribute(startEl, "data-swipe-threshold", "20"),
      10
    ); // default 20 units
    var swipeUnit = getNearestAttribute(startEl, "data-swipe-unit", "px"); // default px
    var swipeTimeout = parseInt(
      getNearestAttribute(startEl, "data-swipe-timeout", "500"),
      10
    ); // default 500ms
    var timeDiff = Date.now() - timeDown;
    var eventType = "";
    var changedTouches = e.changedTouches || e.touches || [];

    if (swipeUnit === "vh") {
      swipeThreshold = Math.round(
        (swipeThreshold / 100) * document.documentElement.clientHeight
      ); // get percentage of viewport height in pixels
    }
    if (swipeUnit === "vw") {
      swipeThreshold = Math.round(
        (swipeThreshold / 100) * document.documentElement.clientWidth
      ); // get percentage of viewport height in pixels
    }

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      // most significant
      if (Math.abs(xDiff) > swipeThreshold && timeDiff < swipeTimeout) {
        if (xDiff > 0) {
          eventType = "swiped-left";
        } else {
          eventType = "swiped-right";
        }
      }
    } else if (Math.abs(yDiff) > swipeThreshold && timeDiff < swipeTimeout) {
      if (yDiff > 0) {
        eventType = "swiped-up";
      } else {
        eventType = "swiped-down";
      }
    }

    if (eventType !== "") {
      var eventData = {
        dir: eventType.replace(/swiped-/, ""),
        touchType: (changedTouches[0] || {}).touchType || "direct",
        xStart: parseInt(xDown, 10),
        xEnd: parseInt((changedTouches[0] || {}).clientX || -1, 10),
        yStart: parseInt(yDown, 10),
        yEnd: parseInt((changedTouches[0] || {}).clientY || -1, 10),
      };

      // fire `swiped` event event on the element that started the swipe
      startEl.dispatchEvent(
        new CustomEvent("swiped", {
          bubbles: true,
          cancelable: true,
          detail: eventData,
        })
      );

      // fire `swiped-dir` event on the element that started the swipe
      startEl.dispatchEvent(
        new CustomEvent(eventType, {
          bubbles: true,
          cancelable: true,
          detail: eventData,
        })
      );
    }

    // reset values
    xDown = null;
    yDown = null;
    timeDown = null;
  }

  /**
   * Records current location on touchstart event
   * @param {object} e - browser event object
   * @returns {void}
   */
  function handleTouchStart(e) {
    // if the element has data-swipe-ignore="true" we stop listening for swipe events
    if (e.target.getAttribute("data-swipe-ignore") === "true") return;

    startEl = e.target;

    timeDown = Date.now();
    xDown = e.touches[0].clientX;
    yDown = e.touches[0].clientY;
    xDiff = 0;
    yDiff = 0;
  }

  /**
   * Records location diff in px on touchmove event
   * @param {object} e - browser event object
   * @returns {void}
   */
  function handleTouchMove(e) {
    if (!xDown || !yDown) return;

    var xUp = e.touches[0].clientX;
    var yUp = e.touches[0].clientY;

    xDiff = xDown - xUp;
    yDiff = yDown - yUp;
  }

  /**
   * Gets attribute off HTML element or nearest parent
   * @param {object} el - HTML element to retrieve attribute from
   * @param {string} attributeName - name of the attribute
   * @param {any} defaultValue - default value to return if no match found
   * @returns {any} attribute value or defaultValue
   */
  function getNearestAttribute(el, attributeName, defaultValue) {
    // walk up the dom tree looking for attributeName
    while (el && el !== document.documentElement) {
      var attributeValue = el.getAttribute(attributeName);

      if (attributeValue) {
        return attributeValue;
      }

      el = el.parentNode;
    }

    return defaultValue;
  }
})(window, document);

window.onload = () => {
  setBoxes(8);
};
const sketch = document.querySelector("#sketch-box");
const defaults = document.querySelector(".defaults");
const custom = document.querySelector("form");
const colors = document.querySelectorAll(".color");
const reset = document.querySelector(".reset");
let randomColor,
  newBox,
  redValue,
  blueValue,
  greenValue,
  hoverColor,
  filterBrightness,
  colorChange;
let brushColor = "black";

defaults.addEventListener("change", getMultiplier);
custom.addEventListener("submit", getMultiplier);

colors.forEach((color) => {
  color.addEventListener("click", (e) => {
    brushColor = e.target.dataset.color;
    animateIt(e.target, "bounce");
  });
  color.addEventListener("swipe", (e) => {
    brushColor = e.target.dataset.color;
    animateIt(e.target, "bounce");
  });
});
reset.addEventListener("click", resetSketch);

function setBoxes(multiplier) {
  let boxWidth = sketch.clientWidth / 16;
  console.log(boxWidth);
  document.documentElement.style.setProperty("--sketch-size", `${boxWidth}rem`);
  sketch.innerHTML = "";
  let size = boxWidth / multiplier;
  document.documentElement.style.setProperty("--box-size", `${size}rem`);
  for (let j = 0; j < multiplier; j++) {
    for (let i = 0; i < multiplier; i++) {
      newBox = document.createElement("div");
      newBox.classList.add("box");
      sketch.append(newBox);
    }
  }
  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box) => {
    box.style.backgroundColor = "white";
    box.dataset.filter = 1;
    box.addEventListener("mouseover", setColor);
  });
}

function getMultiplier(e) {
  multiplierValue = e.target.value;
  if (e.target.name == "form") {
    e.preventDefault();
    multiplierValue = Number(e.srcElement[0].value);
  }
  if (multiplierValue == 0) multiplierValue = 1;
  setBoxes(multiplierValue);
}

function setColor() {
  switch (brushColor) {
    case "black":
      hoverColor = "black";
      this.style.filter = "none";
      this.dataset.filter = 1;
      delete this.dataset.checked;
      colorChange = true;
      break;
    case "rainbow":
      this.style.filter = "none";
      this.dataset.filter = 1;
      this;
      this.dataset.checked = "true";
      redValue = getRandColor(361);
      blueValue = getRandColor(101);
      greenValue = getRandColor(101);
      hoverColor = `hsl(${redValue}, ${blueValue}%, ${greenValue}%)`;
      colorChange = true;
      break;
    case "white":
      hoverColor = "white";
      this.dataset.filter = 1;
      this.style.filter = "none";
      delete this.dataset.checked;
      colorChange = true;
      break;
    case "lighten":
      filterBrightness = Number(this.dataset.filter);
      filterBrightness += 0.2;
      this.dataset.filter = filterBrightness;
      this.style.filter = `brightness(${filterBrightness})`;
      if (this.dataset.filter > 2) {
        this.dataset.filter = 2;
        this.style.filter = `brightness(2)`;
      }
      colorChange = false;
      break;
    case "darken":
      filterBrightness = Number(this.dataset.filter);
      filterBrightness -= 0.2;
      this.dataset.filter = filterBrightness;
      this.style.filter = `brightness(${filterBrightness})`;
      if (this.dataset.filter < 0) {
        this.dataset.filter = 0;
        this.style.filter = `brightness(0)`;
      }
      colorChange = false;
      break;
  }

  if (colorChange) this.style.backgroundColor = hoverColor;
}

function getRandColor(value) {
  return Math.floor(Math.random() * value);
}

function resetSketch() {
  const boxes = document.querySelectorAll(".box");
  boxes.forEach((box) => {
    box.style.backgroundColor = "white";
    box.style.filter = "none";
    delete box.dataset.checked;
  });
  animateIt(this, "flash");
}

function animateIt(element, value) {
  if (element.dataset.inner == "true") {
    element = element.parentElement;
  }
  element.classList.add(`animate__${value}`);
  setTimeout(() => element.classList.remove(`animate__${value}`), 1000);
}
