# Matrix Client 2.0

Tampermonkey Matrix Client for MineFun.io.

Repository: https://github.com/francamatheus165-prog/matrix-client-2.0

## Install
Create a Tampermonkey script with the contents of `use.js` and save it.
The loader automatically pulls `matrix-mod-menu.js` through `@require`.

## Updates
Update `@version` in `use.js` for a new release. Tampermonkey uses
`@updateURL` and `@downloadURL` from the main branch.

## Files
- `use.js` — Tampermonkey loader
- `matrix-mod-menu.js` — Matrix implementation
- `.github/workflows/validate.yml` — basic validation
- `LICENSE` — project license
