import { BotHandler } from './base.handler'
import { Markup, Telegraf } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { SubscriptionService } from '../../subscription/subscription.service'
import { createInlineEventsListWithoutBack } from '../keyboards/admin_keyboard'
import { UserService } from '../../user/user.service'
import { EventService } from '../../event/event.service'
import { COMMANDS } from '../constants'

export class VideoHandler extends BotHandler {
    private readonly subscriptionService: SubscriptionService
    private readonly userService: UserService
    private readonly eventService: EventService

    constructor(bot: Telegraf<IBotContext>) {
        super(bot)
        this.subscriptionService = new SubscriptionService()
        this.eventService = new EventService()
        this.userService = new UserService()
    }

    initCommands(): void {
        this.bot.hears(COMMANDS.Video, this.getEventsToSendVideo.bind(this))
        this.bot.on('video_note', this.handleVideoToMark.bind(this))
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('markvideo'),
            this.handleEventToSendVideo.bind(this)
        )
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('accept_user'),
            this.handleAcceptMark.bind(this)
        )
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('decline_user'),
            this.handleDeclineMark.bind(this)
        )
    }

    private async getEventsToSendVideo(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        const subscriptions = await this.subscriptionService.getByUser(userId)
        const userEvents = subscriptions
            .filter((subscription) => !subscription.visited)
            .map((subscription) => subscription.event)

        if (!userEvents.length) {
            await ctx.reply('Вы еще не записаны ни на одно мероприятие')
            return
        }

        await ctx.reply(
            'Нажмите на мероприятие, на котором хотите отметиться',
            {
                reply_markup: createInlineEventsListWithoutBack(
                    userEvents,
                    'markvideo'
                ).reply_markup,
            }
        )
    }

    private async handleEventToSendVideo(ctx: IBotContext): Promise<void> {
        // @ts-ignore
        const eventId = ctx.update.callback_query.data.split('_')[1]
        ctx.session.eventToSendVideoId = eventId
        await ctx.reply(
            'Теперь отправьте кружок, чтобы подтвредтить что вы были на мероприятии'
        )
    }

    private async handleVideoToMark(ctx: IBotContext): Promise<void> {
        // @ts-ignore
        const videoId = ctx.message.video_note.file_id
        const admins = await this.userService.getAdmins()
        try {
            for (const admin of admins) {
                await ctx.telegram.sendVideoNote(admin.id, videoId, {
                    reply_markup: Markup.inlineKeyboard([
                        [
                            {
                                text: 'Отметить',
                                callback_data: `accept_user-${ctx.session.userId}:eventId-${ctx.session.eventToSendVideoId}`,
                            },
                            {
                                text: 'Отказать или убрать отметку',
                                callback_data: `decline_user-${ctx.session.userId}:eventId-${ctx.session.eventToSendVideoId}`,
                            },
                        ],
                    ]).reply_markup,
                })
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000)
                })
            }
        } catch (error: unknown) {
            console.log(error)
        }
    }

    public async handleAcceptMark(ctx: IBotContext): Promise<void> {
        const [
            userQuery,
            eventQuery, // @ts-ignore
        ] = ctx.update.callback_query.data.split(':')
        const userId = userQuery.split('-')[1]
        const eventId = eventQuery.split('-')[1]

        if (!userId || !eventId) {
            await ctx.reply('Что то пошло не так...')
            return
        }

        const [user, event] = await Promise.all([
            this.userService.getById(userId),
            this.eventService.getById(+eventId),
        ])

        if (!user || !event) {
            await ctx.reply('Данные видимо устарели...')
            return
        }

        const subscription = await this.subscriptionService.getByUserAndEvent(
            user.id,
            event.id
        )
        if (!subscription) {
            await ctx.reply(
                'Похоже пользователь не был записан на это меропрятие'
            )
            return
        }

        if (subscription.visited) {
            await ctx.answerCbQuery('Студент уже отмечен на данном мероприятии')
            return
        }

        const markedSubscription = await this.subscriptionService.update(
            subscription,
            true
        )
        if (!markedSubscription) {
            await ctx.telegram.sendMessage(user.id, 'Не удалось вас отметить')
            return
        }

        await ctx.telegram.sendMessage(user.id, 'Вы были успешно отмечены')
        await ctx.reply(`Студен ${user.username} ${user.surname} был отмечен`)
    }

    public async handleDeclineMark(ctx: IBotContext): Promise<void> {
        const [
            userQuery,
            eventQuery, // @ts-ignore
        ] = ctx.update.callback_query.data.split(':')
        const userId = userQuery.split('-')[1]
        const eventId = eventQuery.split('-')[1]

        const [user, event] = await Promise.all([
            this.userService.getById(userId),
            this.eventService.getById(+eventId),
        ])
        if (!user || !event) {
            await ctx.reply('Что то пошло не так...')
            return
        }

        const subscription = await this.subscriptionService.getByUserAndEvent(
            user.id,
            event.id
        )
        if (!subscription) {
            await ctx.reply('Пользователь не был записан на данное мероприятие')
            return
        }

        await this.subscriptionService.update(subscription, false)

        await ctx.telegram.sendMessage(
            user.id,
            'Ваш кружок не был принят, попробуйте еще раз или свяжитесь с учителем'
        )
        await ctx.reply(`Кружок ${user.username} ${user.surname} не был принят`)
    }
}
