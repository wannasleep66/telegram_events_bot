import { Markup } from 'telegraf'
import { CALLBACKS, COMMANDS } from '../constants'
import { IBotContext } from '../types/context.interface'

export const createUserMenu = (ctx: IBotContext) => {
    // @ts-ignore
    return Markup.keyboard([
        [{ text: COMMANDS.QR, callback_data: CALLBACKS.QR }],
        [
            { text: COMMANDS.list, callback_data: CALLBACKS.list },
            {
                text: 'Профиль',
                // web_app: {
                //     url: `${process.env.HOST}/profile/${ctx.session.userId}`,
                // },
            },
        ],
    ]).resize()
}
