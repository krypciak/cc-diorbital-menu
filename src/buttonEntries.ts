export function addButtonEntries() {
    /* character swap */
    function getPlayerHeadConfig(playerName: string): sc.AdditionalRingButton.ImageConfig {
        return () => {
            const headIdx = sc.party.models[playerName].getHeadIdx()
            return {
                gfx: new ig.Image('media/gui/severed-heads.png'),
                pos: { x: 4, y: 1 },
                srcPos: { x: headIdx * 24, y: 0 },
                size: { x: 24, y: 24 },
            }
        }
    }
    sc.QuickRingMenu.addConfigFunctionList.push(() => {
        for (let i = 0; i < sc.PARTY_OPTIONS.length; i++) {
            const playerName = sc.PARTY_OPTIONS[i]
            const image = getPlayerHeadConfig(playerName)
            sc.QuickRingMenu.ringConfigs[2][i] = {
                name: playerName,
                description: `Click to play as ${playerName}`,
                image,
                pressEvent: () => {
                    const config = sc.party.models[playerName].config
                    sc.model.player.setConfig(config)
                },
            }
        }
    })

    if (window.vim) {
        sc.QuickRingMenu.ringConfigs[0][1] = {
            name: 'reload',
            description: 'Reload the game',
            pressEvent: () => window.vim.executeString('reload'),
            image: () => ({
                gfx: new ig.Image('media/gui/menu.png'),
                srcPos: { x: 449, y: 464 },
                pos: { x: 9, y: 8 },
                size: { x: 16, y: 16 },
            }),
        }
        sc.QuickRingMenu.ringConfigs[0][3] = {
            name: 'reload map',
            description: 'Reload the map',
            pressEvent: () => window.vim.executeString('reload-level'),
            image: () => ({
                gfx: new ig.Image('media/gui/menu.png'),
                srcPos: { x: 433, y: 464 },
                pos: { x: 9, y: 8 },
                size: { x: 16, y: 16 },
            }),
        }
    }
}
