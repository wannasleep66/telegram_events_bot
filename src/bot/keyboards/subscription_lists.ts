import { Event } from '../../event/event.entity'
import { Markup } from 'telegraf'
import { buttonBack } from './event_menu'

export const createInlineEventsListWithBack = (events: Event[], cb: string) => {
    const eventList = events.map((event) => [
        { text: event.title, callback_data: `${cb}_${event.id}` },
    ])
    // @ts-ignore
    return Markup.inlineKeyboard([...eventList, buttonBack])
}
