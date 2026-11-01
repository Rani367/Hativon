import { THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Runs in <head> before the first paint, as plain text in the page rather than a
 * bundle, because both jobs must happen before React loads.
 *
 * Theme: applied here so a dark-mode reader never sees a white flash.
 *
 * Photo morph: tapping a story names only that photo, so the browser morphs one
 * image instead of capturing every photo on the page. The article's hero has the
 * same name in public.css. This code only sets a style. It never touches the
 * click itself, so it can't get in the way of navigation, and if it throws the
 * reader gets a normal page load.
 */
export const PAGE_SCRIPT = `(function () {
  try {
    if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}

  document.addEventListener("click", function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest("a.story-link");
    var photo = link && link.querySelector(".story-photo");
    if (photo) photo.style.viewTransitionName = "story-photo";
  });

  // A page restored by the back button must not keep the name it left with.
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    document.querySelectorAll(".story-photo").forEach(function (photo) {
      photo.style.viewTransitionName = "";
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
