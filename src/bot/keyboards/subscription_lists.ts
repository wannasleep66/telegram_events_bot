import { Event } from '../../event/event.entity'
import { Markup } from 'telegraf'
import { buttonBack } from './event_menu'
import { IBotContext } from '../types/context.interface'
import { CALLBACKS, COMMANDS } from '../constants'

export const createInlineEventsListWithBack = (events: Event[], cb: string) => {
    const eventList = events.map((event) => [
        { text: event.title, callback_data: `${cb}_${event.id}` },
    ])
    // @ts-ignore
    return Markup.inlineKeyboard([...eventList, buttonBack])
}

export const userSubscriptionsNavigationButtons = (ctx: IBotContext) => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback(
                COMMANDS.prev,
                CALLBACKS.prevSubscription,
                ctx.session.currentPage < 1
            ),
            Markup.button.callback(
                COMMANDS.next,
                CALLBACKS.nextSubscription,
                ctx.session.countOfPages - 1 === ctx.session.currentPage ||
                    ctx.session.countOfPages == 0
            ),
        ],
        buttonBack,
    ])
}
