import { BotHandler } from './base.handler'
import { IBotContext } from '../types/context.interface'
import { Telegraf } from 'telegraf'
import { CALLBACKS, COMMANDS } from '../constants'
import { EventService } from '../../event/event.service'
import {
    createAdminEventsInlineMenu,
    createInlineEventsListWithoutBack,
} from '../keyboards/admin_keyboard'
import { SubscriptionService } from '../../subscription/subscription.service'
import { createEventsInlineMenu } from '../keyboards/event_menu'
import { Event } from '../../event/event.entity'
import { format } from 'date-fns'
import { isAdmin } from '../middlewares/isAdminGuard'

export class AdminHandler extends BotHandler {
    private readonly eventService: EventService
    private readonly subscriptionService: SubscriptionService

    constructor(bot: Telegraf<IBotContext>) {
        super(bot)
        this.eventService = new EventService()
        this.subscriptionService = new SubscriptionService()
    }

    public initCommands(): void {
        this.bot.hears(
            COMMANDS.adminEventsList,
            isAdmin,
            this.getListOfEvents.bind(this)
        )
        this.bot.hears(COMMANDS.create, isAdmin, this.createEvent.bind(this))
        this.bot.hears(
            COMMANDS.update,
            isAdmin,
            this.getEventsToUpdate.bind(this)
        )
        this.bot.hears(
            COMMANDS.delete,
            isAdmin,
            this.getEventsToDelete.bind(this)
        )
        this.bot.hears(
            COMMANDS.subscribers,
            isAdmin,
            this.getEventsToGetSubscribers.bind(this)
        )
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('show'),
            isAdmin,
            this.getSubscribers.bind(this)
        )
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('update'),
            isAdmin,
            this.updateEvent.bind(this)
        )
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('delete'),
            isAdmin,
            this.deleteEvent.bind(this)
        )
        this.bot.action(
            CALLBACKS.nextAdmin,
            isAdmin,
            this.getNextEventsPage.bind(this)
        )
        this.bot.action(
            CALLBACKS.prevAdmin,
            isAdmin,
            this.getPreviousEventsPage.bind(this)
        )
    }

    private async createEvent(ctx: IBotContext): Promise<void> {
        await ctx.scene.enter(COMMANDS.create)
    }

    private async getEventsToGetSubscribers(ctx: IBotContext): Promise<void> {
        const [events, count] = await this.eventService.getAll()
        await ctx.reply(
            'Нажмите на мероприятие, чтобы получить список записанных студентов',
            {
                reply_markup: createInlineEventsListWithoutBack(events, 'show')
                    .reply_markup,
            }
        )
    }

    private async getEventsToUpdate(ctx: IBotContext): Promise<void> {
        const [events, count] = await this.eventService.getAll()
        await ctx.reply('Нажмите на мероприятие, которое хотите обновить', {
            reply_markup: createInlineEventsListWithoutBack(events, 'update')
                .reply_markup,
        })
    }

    private async getEventsToDelete(ctx: IBotContext): Promise<void> {
        const [events, count] = await this.eventService.getAll()
        await ctx.reply('Нажмите на мероприятие, которое хотите удалить', {
            reply_markup: createInlineEventsListWithoutBack(events, 'delete')
                .reply_markup,
        })
    }

    private async getSubscribers(ctx: IBotContext): Promise<void> {
        // @ts-ignore
        const eventId = ctx.update.callback_query.data.split('_')[1]
        if (!eventId) {
            await ctx.answerCbQuery('Что то пошло не так...')
            return
        }
        const subscriptions = await this.subscriptionService.getByEvent(eventId)
        const subscribers = subscriptions.map(
            (subscription) => subscription.user
        )
        const message =
            subscriptions?.length > 0
                ? subscriptions
                      .map(
                          (subscription, index) =>
                              `${index + 1}: ${subscription.user.username} ${subscription.user.surname}  ${subscription.user.group} ${subscription.visited ? 'посетил' : 'не посетил'} \n\n`
                      )
                      .join('')
                : 'Никто не записан на данное мероприятие'

        await ctx.reply(message)
    }

    private async updateEvent(ctx: IBotContext): Promise<void> {
        // @ts-ignore
        const eventId = ctx.update.callback_query.data.split('_')[1]
        if (!eventId) {
            await ctx.answerCbQuery('Что то пошло не так...')
            return
        }
        ctx.session.eventToUpdateId = eventId
        await ctx.scene.enter(COMMANDS.update)
    }

    private async deleteEvent(ctx: IBotContext): Promise<void> {
        // @ts-ignore
        const eventId = ctx.update.callback_query.data.split('_')[1]
        if (!eventId) {
            await ctx.answerCbQuery('Что то пошло не так...')
            return
        }

        const eventToDelete = await this.eventService.getById(eventId)
        if (!eventToDelete) {
            await ctx.answerCbQuery('Кажется такого мероприятия уже нет...')
            return
        }

        const deletingResult = await this.eventService.delete(eventToDelete)
        if (!deletingResult) {
            await ctx.reply('Не удалось удалить мероприятие')
        }

        await ctx.reply('Мероприятие было успешно удалено')
    }

    private async getListOfEvents(ctx: IBotContext): Promise<void> {
        ctx.session.currentPage = 0
        const events = await this.getEvents(ctx)
        const message = this.formatToMessage(events, ctx.session.currentPage)
        await ctx.reply(message, {
            reply_markup: createAdminEventsInlineMenu(ctx).reply_markup,
            parse_mode: 'HTML',
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

    private async refreshListOfEvents(ctx: IBotContext): Promise<void> {
        const refreshedEvents = await this.getEvents(ctx)
        const refreshedMessage = this.formatToMessage(
            refreshedEvents,
            ctx.session.currentPage
        )
        await ctx.editMessageText(refreshedMessage, {
            reply_markup: createAdminEventsInlineMenu(ctx).reply_markup,
            parse_mode: 'HTML',
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

    private formatToMessage(events: Event[], currentPage: number): string {
        if (!events.length) {
            return '🚫 Вы еще ничего не создали'
        }
        const message = events
            .map(
                (event, index) =>
                    `<b>➤ ${index + 1 + currentPage * 3}: ${event.title}</b>
        <i>Описание:</i> ${event.description}
        <i>Время:</i> ${format(event.date, 'dd.MM.yyyy HH:mm')}
    `
            )
            .join('\n')

        return message
    }
}
