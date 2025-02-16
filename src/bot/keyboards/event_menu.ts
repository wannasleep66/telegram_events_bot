import { IBotContext } from '../types/context.interface'
import { Markup } from 'telegraf'
import { CALLBACKS, COMMANDS } from '../constants'

export const createEventsInlineMenu = (ctx: IBotContext) => {
    return Markup.inlineKeyboard([
        [
            { text: COMMANDS.subscribe, callback_data: CALLBACKS.subscribe },
            {
                text: COMMANDS.subscribed,
                callback_data: CALLBACKS.toUserEvents,
            },
            {
                text: COMMANDS.unsubscribe,
                callback_data: CALLBACKS.unsubscribe,
            },
        ],
        [
            Markup.button.callback(
                COMMANDS.prev,
                CALLBACKS.prev,
                ctx.session.currentPage < 1
            ),
            Markup.button.callback(
                COMMANDS.next,
                CALLBACKS.next,
                ctx.session.countOfPages - 1 === ctx.session.currentPage
            ),
        ],
    ])
}

export const buttonBack = [
    { text: COMMANDS.toEvents, callback_data: CALLBACKS.toEvents },
]
