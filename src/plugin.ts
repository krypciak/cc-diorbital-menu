import { Mod1 } from './types'
import { initExtensionVars, quickMenuExtension } from './quick-menu-extension'
import { addWidgets } from './widgets'

export default class QuickMenuExtensions {
    static dir: string
    static mod: Mod1

    constructor(mod: Mod1) {
        QuickMenuExtensions.dir = mod.baseDirectory
        QuickMenuExtensions.mod = mod
        QuickMenuExtensions.mod.isCCL3 = mod.findAllAssets ? true : false
        QuickMenuExtensions.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')

        initExtensionVars()
    }

    async prestart() {
        quickMenuExtension()
    }

    async poststart() {
        addWidgets()
    }
}
