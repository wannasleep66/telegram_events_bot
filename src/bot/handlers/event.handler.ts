import { BotHandler } from './base.handler'
import { Telegraf } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { Event } from '../../event/event.entity'
import { EventService } from '../../event/event.service'
import { COMMANDS, CALLBACKS } from '../constants'
import { createEventsInlineMenu } from '../keyboards/event_menu'
import { format } from 'date-fns'

export class EventHandler extends BotHandler {
    private readonly eventService: EventService

    constructor(bot: Telegraf<IBotContext>) {
        super(bot)
        this.eventService = new EventService()
    }

    public initCommands(): void {
        this.bot.hears(COMMANDS.list, this.getListOfEvents.bind(this))
        this.bot.action(CALLBACKS.next, this.getNextEventsPage.bind(this))
        this.bot.action(CALLBACKS.prev, this.getPreviousEventsPage.bind(this))
        this.bot.action(CALLBACKS.toEvents, this.resetListOfEvents.bind(this))
    }

    private async getListOfEvents(ctx: IBotContext): Promise<void> {
        ctx.session.currentPage = 0
        const events = await this.getEvents(ctx)
        const message = this.formatToMessage(events)
        await ctx.reply(message, {
            reply_markup: createEventsInlineMenu(ctx).reply_markup,
        })
    }

    private async getNextEventsPage(ctx: IBotContext): Promise<void> {
        const hasNextPage =
            ctx.session.currentPage + 1 < ctx.session.countOfPages
        if (!hasNextPage) {
            return
        }
        ctx.session.currentPage += 1
        await this.refreshListOfEvents(ctx)
    }

    private async getPreviousEventsPage(ctx: IBotContext): Promise<void> {
        const hasPreviousPage = ctx.session.currentPage > 0
        if (!hasPreviousPage) {
            return
        }
        ctx.session.currentPage -= 1
        await this.refreshListOfEvents(ctx)
    }

    private async resetListOfEvents(ctx: IBotContext): Promise<void> {
        ctx.session.currentPage = 0
        await this.refreshListOfEvents(ctx)
    }

    private async refreshListOfEvents(ctx: IBotContext): Promise<void> {
        const refreshedEvents = await this.getEvents(ctx)
        const refreshedMessage = this.formatToMessage(refreshedEvents)
        await ctx.editMessageText(refreshedMessage, {
            reply_markup: createEventsInlineMenu(ctx).reply_markup,
        })
    }

    private async getEvents(ctx: IBotContext): Promise<Event[]> {
        const [events, count] = await this.eventService.getAll(
            ctx.session.currentPage * 3,
            3
        )
        ctx.session.countOfPages = Math.ceil(count / 3)
        return events
    }

    private formatToMessage(events: Event[]): string {
        if (!events.length) {
            return '🚫 Ничего не найдено'
        }
        const message = events
            .map(
                (event, index) =>
                    `🔹 **${index + 1}: ${event.title}**\n\n` +
                    `📝 *Описание:* ${event.description}\n\n` +
                    `⏰ *Время:* ${format(event.date, 'dd.MM.yyyy HH:mm')}\n\n` +
                    `-----------------------------------------\n\n`
            )
            .join('')

        return message
    }
}
