// Slow zoom of an image when its `group` ancestor is hovered; skipped for
// people who ask for reduced motion. The ancestor needs `group` and
// `overflow-hidden` so the zoom stays inside the rounded corners.
//
// `will-change-transform` keeps the image on its own layer, rasterised once.
// Without it Chrome redraws the layer at the final scale when the transition
// ends, and the image visibly "snaps" by a fraction of a pixel (measured:
// more or less, depending on the image). With it, the zoom ends smoothly at
// the cost of a very slightly softer image while zoomed.
export const IMG_ZOOM =
  "object-cover will-change-transform motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-105";
