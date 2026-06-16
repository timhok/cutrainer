# CU INT 0 memory trainer

A small mobile-friendly web game for memorizing the **Drugs** and **Medical** item
names from the [SCAV Prototype wiki](https://scavprototype.wiki.gg/wiki/Items).

Shows an item icon and three name buttons — pick the right one. Tracks **Total /
Correct / Incorrect** guesses and a **Score** (+1 correct, −1 incorrect). All
interface text is shown in both English and Russian (the answer buttons stay as the
item's in-game name). The answer buttons use the wiki's pixel font **Retro Gaming**
(self-hosted in `fonts/`); the rest of the UI uses the system default font.

## Run locally
Just open `index.html`, or serve the folder:

    python3 -m http.server 8000
    # then visit http://localhost:8000

## Deploy to GitHub Pages
1. Create a repo and push the contents of this folder (keep `icons/` and `data.js`).
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pick your branch and the `/ (root)` folder (or put these files in `/docs`).
3. Your game will be live at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so all asset files are served as-is.

## Files
- `index.html` — layout
- `style.css` — styling (dark UI, Retro Gaming pixel font, pixel-perfect icons)
- `game.js` — game logic
- `data.js` — generated item list (name, group, icon path)
- `icons/` — 55 item PNGs (22 Drugs + 33 Medical)
- `fonts/` — Retro Gaming pixel font (woff2 + woff)
