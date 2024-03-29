export {}
declare global {
    namespace sc {
        enum QUICK_MENU_WIDGET_EVENT {
            CLICK = 0,
        }

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

        interface QuickRingMenuWidgets extends sc.Model {
            addWidget(widget: sc.QuickMenuWidget): void
        }
        var QuickRingMenuWidgets: QuickRingMenuWidgets
    }
}
