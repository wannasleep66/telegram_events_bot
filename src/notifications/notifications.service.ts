import { SubscriptionService } from '../subscription/subscription.service'
import { TelegramService } from '../telegram/telegram.service'
import cron from 'node-cron'
import { format } from 'date-fns'

export class BotNotificationsController {
    private readonly subscriptionService: SubscriptionService
    private readonly telegramService: TelegramService

    constructor(
        subscriptionService: SubscriptionService,
        telegramService: TelegramService
    ) {
        this.subscriptionService = subscriptionService
        this.telegramService = telegramService
    }

    public init() {
        cron.schedule('0 9,14,18 * * *', async () => {
            await this.notify()
        })
    }

    private async notify(): Promise<void> {
        const subscriptions = await this.subscriptionService.getAll()
        const currentDate = new Date()

        const notifications = subscriptions.filter(
            (subscription) =>
                subscription.event.date > currentDate && !subscription.visited
        )

        try {
            for (const subscription of notifications) {
                await this.telegramService.sendMessage(
                    subscription.user.id,
                    `Не забудьте посетить ${subscription.event.title} в ${format(subscription.event.date, 'dd.MM.yyyy HH:mm')} 😊`
                )
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000)
                })
            }
        } catch (error: unknown) {
            console.error(error)
        }
    }
}
