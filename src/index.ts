import 'reflect-metadata'
import { orm } from './orm'
import { App } from './app'
import { Bot } from './bot/bot'
import { UserService } from './user/user.service'
import { TelegramService } from './telegram/telegram.service'
import { UserController } from './user/user.controller'
import dotenv from 'dotenv'
import { BotNotificationsController } from './notifications/notifications.service'
import { SubscriptionService } from './subscription/subscription.service'
dotenv.config()

const main = async () => {
    await orm.initialize()
    const app = new App(80, [
        new UserController(
            new UserService(),
            new TelegramService(process.env.TELEGRAM_TOKEN as string)
        ),
    ])
    const notifications = new BotNotificationsController(
        new SubscriptionService(),
        new TelegramService(process.env.TELEGRAM_TOKEN as string)
    )
    const bot = new Bot(process.env.TELEGRAM_TOKEN as string)
    app.listen()
    notifications.init()
    await bot.launch()
}

;(async () => main())()
