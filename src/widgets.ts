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
    for (let i = 0; i < sc.PARTY_OPTIONS.length; i++) {
        const playerName = sc.PARTY_OPTIONS[i]
        const image = getPlayerHeadConfig(playerName)
        sc.QuickRingMenuWidgets.addWidget({
            title: playerName,
            name: `chararacter_${playerName}`,
            description: `Click to play as ${playerName}`,
            image,
            pressEvent: () => {
                const config = sc.party.models[playerName].config
                sc.model.player.setConfig(config)
            },
        })
    }

    /* jetpack */
    let jetpackOn = false
    // prettier-ignore
    const keyboardJetpackOn = !(sc.OPTIONS_DEFINITION['keys-jump'] /* CCJetpack */ || sc.OPTIONS_DEFINITION['keys-jetpack'] /* CCSpeedrunUtilities */)
    if (keyboardJetpackOn) ig.input.bind(ig.KEY.CTRL, 'keys-jump')
    ig.ENTITY.Player.inject({
        update() {
            this.parent()
            if (jetpackOn && (ig.gamepad.isButtonDown(ig.BUTTONS.FACE0 /* a */) || (keyboardJetpackOn && ig.input.state('keys-jump'))))
                ig.game.playerEntity.doJump(150, 16, 250)
        },
    })
    sc.QuickRingMenuWidgets.addWidget({
        name: 'jetpack',
        title: 'Toggle jetpack',
        description: 'Press CTRL or gamepad A to fly.',
        pressEvent: () => {
            jetpackOn = !jetpackOn
        },
        keepPressed: true,
        image: () => ({
            gfx: new ig.Image('media/gui/widgetIcons.png'),
            srcPos: { x: 0, y: 0 },
            pos: { x: 9, y: 8 },
            size: { x: 16, y: 16 },
        }),
    })
}
