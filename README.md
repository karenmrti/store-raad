# MediaMarkt Store Grand Prix – Roulette

An animated prize wheel for the MediaMarkt Store Grand Prix competition.
Built with React, TypeScript, Vite, Tailwind CSS and Framer Motion. It is a fully static site
for GitHub Pages: no backend, no database, nothing saved in the browser.

## Changing the wheel

**Everything is set in one file: [`src/config/rouletteConfig.ts`](src/config/rouletteConfig.ts).**

Change it, commit, push to `main`. GitHub Actions rebuilds the site, and after about 1–2 minutes
every visitor on every computer sees the same new wheel. (Visitors may need to refresh the page.)

| Setting | What it does |
| --- | --- |
| `title`, `subtitle`, `spinButtonText` | Texts on the page |
| `spinDuration` | Length of a spin in milliseconds (`8000` = 8 s) |
| `minFullRotations` | Minimum full turns per spin |
| `segmentSizing` | `"equal"`: all segments the same size. `"weighted"`: size follows the winning chance |
| `showPrizeList` / `showProbabilities` | Show the prize list and the % chance of each prize |
| `confetti` | Confetti on win |
| `sound.enabled`, `sound.volume`, `sound.spinStart`, `sound.ticks`, `sound.win` | Sound effects (all generated in the browser, no audio files) |
| `items` | The prizes (see below) |

Each item:

```ts
{
  id: "flex",                 // unique id
  name: "FLEX",               // text on the wheel (keep it short)
  description: "Win a FLEX challenge for your team.",
  reward: "Bonus points",
  color: "#E30613",           // segment color
  textColor: "#FFFFFF",       // optional; picked automatically when left out
  weight: 3,                  // relative chance (weight 4 is twice as likely as weight 2)
  enabled: true,              // false = hidden from the wheel and can never be won
  icon: "💪",                 // optional emoji, or null
  image: null,                // optional image, e.g. "items/tv.png", or null
}
```

- **Add a prize:** copy an item block and change the values (use a new `id`).
- **Remove a prize:** delete its block, or set `enabled: false`.
- **Change the odds:** change the `weight` values. Chance = weight ÷ sum of all enabled weights.
- **Use an image:** put the file in `public/items/` (for example `public/items/tv.png`) and set
  `image: "items/tv.png"`. Square images look best.

Mistakes in the config (duplicate ids, a weight of 0, no enabled items) are reported as a warning
in the browser console.

### Hidden admin mode (local changes)

Open it in any of these ways:

- click the logo **5 times** quickly (works on touch screens too)
- press **Ctrl + Shift + A**
- add **`#admin`** to the URL

It asks for the PIN in `admin.pin` (default `1234`; set it to `""` for no PIN, or set
`admin.enabled: false` to switch the admin off). The PIN keeps customers out, but it is not real
security: anyone who reads the site's code can find it.

In the admin you can change the subtitle, spin duration, segment sizing and toggles, and per item
the name, color, icon, description, reward, image, chance (%), active status and order. You can also
add and delete items.

Changes apply **only in that browser tab** and are lost when the page is refreshed; nothing is
saved and other visitors don't see them. To make them permanent for everyone, click
**Kopieer config-code**, paste it over everything from `export const rouletteConfig` to the end of
`src/config/rouletteConfig.ts`, and push.

### How the winner is chosen

The winner is drawn by weight (using the browser's crypto random generator) when you press SPIN.
The wheel is then animated to stop on that prize, and the result is only shown after the wheel has
stopped. The announced result is read back from the wheel's final position, so the pointer and the
pop-up always agree.

## Running it locally

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install      # once
npm run dev      # start a local server, open the URL it prints
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Deploying to GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys
the site on every push to `main`.

One-time setup:

1. Create a repository on GitHub and push this project to its `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Store Grand Prix roulette"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub, open **Settings → Pages** and under **Build and deployment → Source** choose
   **GitHub Actions**.
3. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to finish (re-run it if the first
   run started before step 2). The site is at `https://<your-user>.github.io/<your-repo>/`.

After that, every push to `main` updates the live site.

`vite.config.ts` uses `base: "./"`, so all asset paths are relative and the site works under any
repository name without changes.

## Project structure

```
src/
  config/rouletteConfig.ts   ← the only file you need to edit
  assets/                    logo
  components/                Wheel, SpinButton, WinnerModal, PrizeList, Background
  hooks/useRouletteSpin.ts   spin animation and result handling
  lib/wheel.ts               weighted draw, wheel geometry, easing
  lib/sound.ts               synthesized sound effects
public/items/                images for wheel items
```

## Accessibility

- Respects the operating system's "reduce motion" setting: shorter, simpler spin, no confetti,
  no background animation.
- The spin button and pop-up are keyboard accessible (Space spins, Escape closes the pop-up), and
  results are announced to screen readers.
