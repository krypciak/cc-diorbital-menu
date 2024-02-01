import { Mod1 } from './types'
import { quickMenuExtension } from './quick-menu-extension'
import { addButtonEntries } from './buttonEntries'

export default class QuickMenuExtensions {
    static dir: string
    static mod: Mod1

    constructor(mod: Mod1) {
        QuickMenuExtensions.dir = mod.baseDirectory
        QuickMenuExtensions.mod = mod
        QuickMenuExtensions.mod.isCCL3 = mod.findAllAssets ? true : false
        QuickMenuExtensions.mod.isCCModPacked = mod.baseDirectory.endsWith('.ccmod/')
    }

    async prestart() {
        quickMenuExtension()
        addButtonEntries()
    }

    async poststart() {}
}
