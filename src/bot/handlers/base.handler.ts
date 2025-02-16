import { IBotContext } from '../types/context.interface'
import { Telegraf } from 'telegraf'

export abstract class BotHandler {
    constructor(protected readonly bot: Telegraf<IBotContext>) {}
    public abstract initCommands(): void
}
