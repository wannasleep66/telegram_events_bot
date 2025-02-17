import { BotHandler } from './base.handler'
import { Input, Telegraf } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { COMMANDS } from '../constants'
import { toFile } from 'qrcode'
import { createInlineEventsListWithoutBack } from '../keyboards/admin_keyboard'
import * as path from 'node:path'
import { SubscriptionService } from '../../subscription/subscription.service'

export class QrCodeHandler extends BotHandler {
    private readonly subscriptionService: SubscriptionService

    constructor(bot: Telegraf<IBotContext>) {
        super(bot)
        this.subscriptionService = new SubscriptionService()
    }
    initCommands(): void {
        this.bot.hears(COMMANDS.QR, this.getEventsToGenerateQr.bind(this))
        this.bot.action(
            // @ts-ignore
            (cbData) => cbData.startsWith('qrevent'),
            this.getQrImage.bind(this)
        )
    }

    private async getEventsToGenerateQr(ctx: IBotContext): Promise<void> {
        const userId = ctx.session.userId
        const subscriptions = await this.subscriptionService.getByUser(userId)
        const userEvents = subscriptions.map(
            (subscription) => subscription.event
        )

        if (!userEvents.length) {
            await ctx.reply('Вы еще не записаны ни на одно мероприятие')
            return
        }

        await ctx.reply('Нажмите на мероприятие на котором хотите отметиться', {
            reply_markup: createInlineEventsListWithoutBack(
                userEvents,
                'qrevent'
            ).reply_markup,
        })
    }

    private async getQrImage(ctx: IBotContext): Promise<void> {
        // @ts-ignore
        const eventId = ctx.update.callback_query.data.split('_')[1]
        await this.generateQrCode(eventId, ctx.session.userId)
        await ctx.replyWithPhoto(
            Input.fromLocalFile(
                path.resolve(
                    __dirname,
                    '..',
                    '..',
                    '..',
                    'public',
                    'qrcode.png'
                )
            )
        )
    }

    private async generateQrCode(
        eventId: number,
        userId: string
    ): Promise<void> {
        const params = `https://t.me/eventExaplebot?start=${
            eventId + '-' + userId
        }`
        try {
            await toFile(
                path.join(__dirname, '..', '..', '..', 'public', 'qrcode.png'),
                params
            )
        } catch (error) {
            console.error(error)
        }
    }
}
