// Cloudinary delivery URLs look like
//   https://res.cloudinary.com/<cloud>/image/upload/v123/<public_id>.jpg
// A transformation segment right after /upload/ makes Cloudinary resize and
// recompress on the fly (f_auto = best format for the browser, q_auto = smart
// quality, c_limit = never enlarge). Any other URL (local file, placeholder)
// is returned untouched, so the same code works before and after the upload.
const MARKER = "/image/upload/";

export function imageUrl(url: string, width: number) {
  if (!url.includes("res.cloudinary.com") || !url.includes(MARKER)) return url;
  return url.replace(MARKER, `${MARKER}f_auto,q_auto,c_limit,w_${width}/`);
}
