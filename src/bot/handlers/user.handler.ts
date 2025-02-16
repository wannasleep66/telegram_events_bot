import { BotHandler } from './base.handler'
import { Markup, Telegraf } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { SubscriptionService } from '../../subscription/subscription.service'
import { EventService } from '../../event/event.service'
import { UserService } from '../../user/user.service'
import { createAdminMenu, createDevMenu } from '../keyboards/admin_keyboard'
import { createUserMenu } from '../keyboards/user_keyboard'
import { COMMANDS } from '../constants'

export class UserHandler extends BotHandler {
    private readonly userService: UserService
    private readonly eventService: EventService
    private readonly subscriptionService: SubscriptionService

    constructor(bot: Telegraf<IBotContext>) {
        super(bot)
        this.userService = new UserService()
        this.eventService = new EventService()
        this.subscriptionService = new SubscriptionService()
    }

    public initCommands(): void {
        this.bot.start(this.start.bind(this))
        this.bot.hears(
            'Вы успешно зарегистрированы',
            this.authorizeUser.bind(this)
        )
        this.bot.hears(COMMANDS.cancel, this.backToMenu.bind(this))
        this.bot.hears(COMMANDS.return, this.backToMenu.bind(this))
    }

    private async start(ctx: IBotContext): Promise<void> {
        // @ts-ignore
        const deepLinkParams = ctx.startPayload
        if (deepLinkParams) {
            await this.markUserByDeepLink(deepLinkParams, ctx)
        }

        if (!ctx.session.isAuth) {
            await ctx.reply(
                'Для начала работы со мной вам нужно зарегистрироваться!',
                Markup.inlineKeyboard([
                    Markup.button.webApp(
                        'Регистрация',
                        'https://superb-sprite-8ab024.netlify.app/'
                    ),
                ])
            )
            return
        }

        const keyboard = ctx.session.isAdmin ? createAdminMenu : createDevMenu

        await ctx.reply('И снова здравствуй!', {
            reply_markup: keyboard.reply_markup,
        })
    }

    private async backToMenu(ctx: IBotContext): Promise<void> {
        const keyboard = ctx.session.isAdmin ? createAdminMenu : createDevMenu
        await ctx.reply(COMMANDS.return, {
            reply_markup: keyboard.reply_markup,
        })
    }

    private async authorizeUser(ctx: IBotContext): Promise<void> {
        ctx.session.isAuth = true
        const userId = ctx.session.userId
        if (!userId) {
            await ctx.reply('Не удалось определить кто вы простите...')
            return
        }

        const user = await this.userService.getById(userId)
        if (!user) {
            await ctx.reply(
                'Вы еще не были зарегистрированы, ссылка на регистрацию'
            )
            return
        }

        const keyboard = ctx.session.isAdmin
            ? createAdminMenu
            : createUserMenu(ctx)

        await ctx.reply('Добро пожаловать!', {
            reply_markup: keyboard.reply_markup,
        })
    }

    private async markUserByDeepLink(
        deepLinkParams: string,
        ctx: IBotContext
    ): Promise<void> {
        const [eventId, userId] = deepLinkParams.split('-')
        try {
            const [user, event] = await Promise.all([
                this.userService.getById(userId),
                this.eventService.getById(+eventId),
            ])
            if (!user || !event) {
                await ctx.reply('Данные в qr коде не верны')
                return
            }

            const subscription =
                await this.subscriptionService.getByUserAndEvent(
                    user.id,
                    event.id
                )
            if (!subscription) {
                await ctx.reply('Похоже пользователь не был записан')
                return
            }

            const markedSubscription =
                await this.subscriptionService.update(subscription)
            if (!markedSubscription) {
                await ctx.reply('Не получилось отметить...')
            }

            await ctx.reply('Студент успешно отмечен')
            return
        } catch (error: any) {
            await ctx.reply(
                'Произошла какая то ошибка при попытке отметить студента...'
            )
        }
    }
}
