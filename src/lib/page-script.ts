import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Runs in <head> before the first paint, as plain text in the page rather than a
 * bundle, because both jobs must happen before React loads.
 *
 * Theme: applied here so a dark-mode reader never sees a white flash.
 *
 * Morph: tapping a story names only that story's photo and headline, so the
 * browser moves those two instead of capturing the whole page. The article has
 * the same names in public.css. This code only sets styles. It never touches the
 * click itself, so it can't get in the way of navigation, and if it throws the
 * reader gets a normal page load.
 */
export const PAGE_SCRIPT = `(function () {
  try {
    if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}

  var names = { ".story-photo": "story-photo", ".story-title": "story-title" };

  document.addEventListener("click", function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest("a.story-link");
    if (!link) return;
    Object.keys(names).forEach(function (selector) {
      var element = link.querySelector(selector);
      if (element) element.style.viewTransitionName = names[selector];
    });
  });

  // A page restored by the back button must not keep the names it left with.
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    document.querySelectorAll(".story-photo, .story-title").forEach(function (element) {
      element.style.viewTransitionName = "";
    });
  });

  // Back and forward restore instantly, with no second animation on top of the
  // swipe-back gesture phones already show.
  window.addEventListener("pagereveal", function (event) {
    var activation = window.navigation && window.navigation.activation;
    if (event.viewTransition && activation && activation.navigationType === "traverse") {
      event.viewTransition.skipTransition();
    }
  });
})();`;
