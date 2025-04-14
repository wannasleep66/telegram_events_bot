import { BotHandler } from './base.handler'
import { Markup, Telegraf } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { SubscriptionService } from '../../subscription/subscription.service'
import { EventService } from '../../event/event.service'
import { CALLBACKS } from '../constants'
import {
    createInlineEventsListWithBack,
    userSubscriptionsNavigationButtons,
} from '../keyboards/subscription_lists'
import { buttonBack } from '../keyboards/event_menu'
import { format, isAfter, subDays } from 'date-fns'
import { Subscription } from '../../subscription/subscription.entity'

export class SubscriptionHandler extends BotHandler {
    private readonly subscriptionService: SubscriptionService
    private readonly eventService: EventService

    constructor(bot: Telegraf<IBotContext>) {
        super(bot)
        this.subscriptionService = new SubscriptionService()
        this.eventService = new EventService()
    }

    public initCommands(): void {
        this.bot.action(
            CALLBACKS.subscribe,
            this.getEventsToSubscribe.bind(this)
        )
        this.bot.action(
            CALLBACKS.unsubscribe,
            this.getEventsToUnsubscribe.bind(this)
        )
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('sub'),
            this.subscribeToEvent.bind(this)
        )
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('unsub'),
            this.unsubscribeFromEvent.bind(this)
        )
        this.bot.action(
            CALLBACKS.toUserEvents,
            this.getListOfUserSubscriptions.bind(this)
        )
        this.bot.action(
            CALLBACKS.nextSubscription,
            this.getNextUserSubscriptionsPage.bind(this)
        )
        this.bot.action(
            CALLBACKS.prevSubscription,
            this.getPreviousUserSubscriptionsPage.bind(this)
        )
    }

    private async getEventsToSubscribe(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        const [events, count] = await this.eventService.getAll()
        const availableEvents = events.filter((event) => {
            return (
                event.subscriptions.every((subscription) => {
                    return subscription.user.id !== userId
                }) && isAfter(event.date, subDays(new Date(), 1))
            )
        })
        if (!availableEvents.length) {
            await ctx.editMessageText(
                'Пока что нет доступных мероприятий для вас',
                {
                    reply_markup:
                        Markup.inlineKeyboard(buttonBack).reply_markup,
                }
            )
            return
        }
        await ctx.editMessageText('Мероприятия доступные для записи', {
            reply_markup: createInlineEventsListWithBack(availableEvents, 'sub')
                .reply_markup,
        })
    }

    private async getEventsToUnsubscribe(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        const subscriptions = await this.subscriptionService.getByUser(userId)
        const userEvents = subscriptions
            .filter((subscription) => !subscription.visited)
            .map((subscription) => subscription.event)
        if (!userEvents.length) {
            await ctx.editMessageText('Похоже вы еще ни на что не записаны', {
                reply_markup: Markup.inlineKeyboard(buttonBack).reply_markup,
            })
            return
        }
        await ctx.editMessageText('Нажмите на мероприятие, чтобы отписаться', {
            reply_markup: createInlineEventsListWithBack(userEvents, 'unsub')
                .reply_markup,
        })
    }

    private async subscribeToEvent(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        // @ts-ignore
        const eventId = ctx.update.callback_query.data.split('_')[1]
        const subscription = await this.subscriptionService.create(
            userId,
            +eventId
        )
        if (!subscription) {
            await ctx.answerCbQuery('Не удалось подписаться')
            return
        }

        await ctx.answerCbQuery(`Вы были успешно записаны!`)
        await this.getEventsToSubscribe(ctx)
    }

    private async unsubscribeFromEvent(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        // @ts-ignore
        const eventId = ctx.update.callback_query.data.split('_')[1]
        const subscription = await this.subscriptionService.getByUserAndEvent(
            userId,
            +eventId
        )
        if (!subscription) {
            await ctx.answerCbQuery('Вы не записаны на это мероприятие')
            return
        }

        const result = await this.subscriptionService.delete(subscription)
        if (!result) {
            await ctx.answerCbQuery('Произошла ошибка при отписке...')
        }

        await ctx.answerCbQuery('Вы успешно отписаны от мероприятия')
        await this.getEventsToUnsubscribe(ctx)
    }

    private async getListOfUserSubscriptions(ctx: IBotContext): Promise<void> {
        ctx.session.currentPage = 0
        const subscriptions = await this.getUserSubscriptions(ctx)
        const message = this.formatToMessage(
            subscriptions,
            ctx.session.currentPage
        )
        await ctx.editMessageText(`Вы записаны:\n\n` + message, {
            reply_markup: userSubscriptionsNavigationButtons(ctx).reply_markup,
        })
    }

    private async getNextUserSubscriptionsPage(
        ctx: IBotContext
    ): Promise<void> {
        const hasNextPage =
            ctx.session.currentPage + 1 < ctx.session.countOfPages
        if (!hasNextPage) {
            return
        }

        ctx.session.currentPage += 1
        await this.refreshListOfUserSubscriptions(ctx)
    }

    private async getPreviousUserSubscriptionsPage(
        ctx: IBotContext
    ): Promise<void> {
        const hasPreviousPage = ctx.session.currentPage > 0
        if (!hasPreviousPage) {
            return
        }

        ctx.session.currentPage -= 1
        await this.refreshListOfUserSubscriptions(ctx)
    }

    private async refreshListOfUserSubscriptions(
        ctx: IBotContext
    ): Promise<void> {
        const refreshedSubscriptions = await this.getUserSubscriptions(ctx)
        const refreshedMessage = this.formatToMessage(
            refreshedSubscriptions,
            ctx.session.currentPage
        )
        await ctx.editMessageText(refreshedMessage, {
            reply_markup: userSubscriptionsNavigationButtons(ctx).reply_markup,
            parse_mode: 'HTML',
        })
    }

    private async getUserSubscriptions(
        ctx: IBotContext
    ): Promise<Subscription[]> {
        const userId = ctx.session.userId
        const [subscriptions, count] =
            await this.subscriptionService.getByUserPaginated(
                userId,
                ctx.session.currentPage * 10,
                10
            )
        ctx.session.countOfPages = Math.ceil(count / 10)
        return subscriptions
    }

    private formatToMessage(
        subscriptions: Subscription[],
        currentPage: number
    ): string {
        if (!subscriptions.length) {
            return 'Тут пусто...'
        }

        return subscriptions
            .map(
                (subscription, index) =>
                    `🔹 ${index + 1 + currentPage * 10}: ${subscription.event.title}\n\n` +
                    `⏰ Время: ${format(subscription.event.date, 'dd.MM.yyyy HH:mm')}\n\n` +
                    `${subscription.visited ? 'Посетил' : 'Не посетил'}`
            )
            .join('\n\n')
    }
}
