import { Telegraf } from 'telegraf'
import LocalSession from 'telegraf-session-local'
import { IBotContext } from './types/context.interface'
import { BotHandler } from './handlers/base.handler'
import { stage } from './scenes'
import { parseUserId } from './middlewares/parsing'
import { logging } from './middlewares/logging'
import { UserHandler } from './handlers/user.handler'
import { EventHandler } from './handlers/event.handler'
import { SubscriptionHandler } from './handlers/subscription.handler'
import { AdminHandler } from './handlers/admin.handler'
import { QrCodeHandler } from './handlers/qrcode.handler'
import { checkPermission } from './middlewares/checkPermission'

export class Bot {
    private readonly bot: Telegraf<IBotContext>
    private controllers: BotHandler[]

    constructor(token: string) {
        this.bot = new Telegraf<IBotContext>(token)
        this.controllers = [
            new UserHandler(this.bot),
            new EventHandler(this.bot),
            new SubscriptionHandler(this.bot),
            new AdminHandler(this.bot),
            new QrCodeHandler(this.bot),
        ]
    }

    public async launch(): Promise<void> {
        this.initMiddlewares()
        this.initControllers()
        await this.bot.launch()
    }

    private initControllers(): void {
        this.controllers.forEach((controller) => controller.initCommands())
    }

    private initMiddlewares(): void {
        this.bot.use(
            new LocalSession({ database: 'session.json' }).middleware()
        )
        this.bot.use(stage.middleware())
        // this.bot.use(logging)
        this.bot.use(parseUserId)
        this.bot.use(checkPermission)
    }
}
