export {}
declare global {
    namespace sc {
        type QuickMenuWidgetImageConfig = (button: sc.RingMenuButton) => {
            gfx: ig.Image
            pos: Vec2
            srcPos: Vec2
            size: Vec2
        }
        type QuickMenuWidget = {
            key?: string /* if unsed, it's set to variable: name */
            name: string
            title: string
            pressEvent?: (button: sc.RingMenuButton) => void
            keepPressed?: boolean
            description?: string

            id?: number
            additionalInit?: (button: sc.RingMenuButton) => void
        } & (
            | {
                  image: QuickMenuWidgetImageConfig
                  _imageDataCached: ReturnType<QuickMenuWidgetImageConfig>
              }
            | {}
        )

        interface QuickRingMenuConstructor {
            addWidget(widget: sc.QuickMenuWidget): void
            addFunctionBeforeInit(func: () => void): void
        }
    }
}
