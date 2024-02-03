export function addWidgets() {
    /* character swap */
    function getPlayerHeadConfig(playerName: string): sc.QuickMenuWidgetImageConfig {
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
    sc.QuickRingMenuWidgets.addFunctionBeforeInit(() => {
        for (let i = 0; i < sc.PARTY_OPTIONS.length; i++) {
            const playerName = sc.PARTY_OPTIONS[i]
            const image = getPlayerHeadConfig(playerName)
            sc.QuickRingMenuWidgets.addWidget({
                title: `charSelect${playerName}`,
                name: playerName,
                description: `Click to play as ${playerName}`,
                image,
                pressEvent: () => {
                    const config = sc.party.models[playerName].config
                    sc.model.player.setConfig(config)
                },
            })
        }
    })
}
