import { BotHandler } from './base.handler'
import { Markup, Telegraf } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { SubscriptionService } from '../../subscription/subscription.service'
import { EventService } from '../../event/event.service'
import { CALLBACKS } from '../constants'
import { createInlineEventsListWithBack } from '../keyboards/subscription_lists'
import { buttonBack } from '../keyboards/event_menu'

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
            this.getUserSubscriptions.bind(this)
        )
    }

    private async getEventsToSubscribe(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        const [events, count] = await this.eventService.getAll()
        const availableEvents = events.filter((event) =>
            event.subscriptions.every(
                (subscription) => subscription.user.id !== userId
            )
        )
        if (!availableEvents.length) {
            await ctx.answerCbQuery(
                'Пока что нет доступных мероприяйтий для вас'
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
        if (!subscriptions.length) {
            await ctx.answerCbQuery('Вы еще ни на что не записаны')
            return
        }
        const userEvents = subscriptions.map(
            (subscription) => subscription.event
        )
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
    }

    private async getUserSubscriptions(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        const subscriptions = await this.subscriptionService.getByUser(userId)
        const userEvents = subscriptions.map(
            (subscription) => subscription.event
        )
        const message =
            userEvents?.length > 0
                ? userEvents
                      .map(
                          (event, index) =>
                              `${index + 1}: ${event.title}. \t ${event.date} \n\n`
                      )
                      .join('')
                : 'Вы еще ни на что не записаны'
        await ctx.editMessageText(`Вы записаны\n\n` + message, {
            reply_markup: Markup.inlineKeyboard(buttonBack).reply_markup,
        })
    }
}
