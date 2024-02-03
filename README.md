<!-- markdownlint-disable MD013 MD024 MD001 MD045 -->

# Quick menu extension


https://github.com/krypciak/cc-diorbital-menu/assets/115574014/a359412f-6359-481c-bc80-d7be821e1970




The action button is right click or press X on gamepad.  
To switch rings on gamepad, use L1 and R1.  

### Mods that add more widgets
- [cc-vim](https://github.com/krypciak/cc-vim) add some useful widgets for mod developers
- [cc-speedrun-utilities](https://github.com/CCDirectLink/cc-speedrun-utilities) add speedrun related widgets

# For developers

## Adding your own widget

```ts
/* check if the mod is installed */
if (sc.QuickRingMenuWidgets) {
    sc.QuickRingMenuWidgets.addWidget({
        name: 'freesp',
        title: 'Give SP',
        description: 'Gives the player SP',
        pressEvent: () => {
            ig.game.playerEntity.params.currentSp += 4
        },
        image: () => ({
            gfx: new ig.Image('media/gui/menu.png'),
            srcPos: { x: 593, y: 18 },
            pos: { x: 11, y: 10 },
            size: { x: 12, y: 12 },
        }),
    })
}
```

## Typescript setup
Run
```bash
npm install -d krypciak/cc-diorbital-menu
```
Then add this to your `tsconfig.json`:
```json
{
    "include": [
        "node_modules/cc-quick-menu-ext/src/global.d.ts"
    ]
}
```
Add this entry to the `include` array, don't entirely replace it.  

## Building

```bash
git clone https://github.com/krypciak/cc-quick-menu-ext
cd cc-quick-menu-ext
npm install
npm run start
# this should return no errors (hopefully)
npx tsc
```
