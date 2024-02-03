<!-- markdownlint-disable MD013 MD024 MD001 MD045 -->

# Quick menu extensions library

![image](https://github.com/krypciak/cc-quick-menu-ext/assets/115574014/92c6cf1b-a18c-4e5c-a6e3-b3d819242b0b)

To add a new widget, right click (or press X on gamepad).  


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

## Building

```bash
git clone https://github.com/krypciak/cc-quick-menu-ext
cd cc-quick-menu-ext
npm install
npm run start
# this should return no errors (hopefully)
npx tsc
```
