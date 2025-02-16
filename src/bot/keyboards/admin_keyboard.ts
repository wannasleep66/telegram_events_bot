import { CALLBACKS, COMMANDS } from '../constants'
import { Markup } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { Event } from '../../event/event.entity'

// @ts-ignore
export const createAdminMenu = Markup.keyboard([
    [
        { text: COMMANDS.create, callback_data: CALLBACKS.create },
        { text: COMMANDS.update, callback_data: CALLBACKS.update },
        { text: COMMANDS.delete, callback_data: CALLBACKS.delete },
    ],
    [
        { text: COMMANDS.subscribers, callback_data: CALLBACKS.subscribers },
        {
            text: COMMANDS.adminEventsList,
            callback_data: COMMANDS.adminEventsList,
        },
    ],
]).resize()

// @ts-ignore
export const createDevMenu = Markup.keyboard([
    [
        { text: COMMANDS.create, callback_data: CALLBACKS.create },
        { text: COMMANDS.update, callback_data: CALLBACKS.update },
        { text: COMMANDS.delete, callback_data: CALLBACKS.delete },
    ],
    [
        { text: COMMANDS.subscribers, callback_data: CALLBACKS.subscribers },
        {
            text: COMMANDS.adminEventsList,
            callback_data: COMMANDS.adminEventsList,
        },
    ],
    [{ text: COMMANDS.QR, callback_data: CALLBACKS.QR }],
    [{ text: COMMANDS.list, callback_data: CALLBACKS.list }],
]).resize()

export const cancelCreateButton = Markup.keyboard([
    [{ text: COMMANDS.cancel }],
]).resize()

export const createInlineEventsListWithoutBack = (
    events: Event[],
    cb: string
) => {
    const eventList = events.map((event) => [
        { text: event.title, callback_data: `${cb}_${event.id}` },
    ])
    // @ts-ignore
    return Markup.inlineKeyboard([...eventList])
}

export const cancelAndSkipUpdateButton = Markup.keyboard([
    [{ text: COMMANDS.cancel }, { text: COMMANDS.skip }],
]).resize()

export const createAdminEventsInlineMenu = (ctx: IBotContext) => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                COMMANDS.prev,
                CALLBACKS.prevAdmin,
                ctx.session.currentPage < 1
            ),
            Markup.button.callback(
                COMMANDS.next,
                CALLBACKS.nextAdmin,
                ctx.session.countOfPages - 1 === ctx.session.currentPage
            ),
        ],
    ])
}
