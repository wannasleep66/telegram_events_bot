import { Telegraf } from 'telegraf'

export class TelegramService {
    private readonly bot: Telegraf

    constructor(token: string) {
        this.bot = new Telegraf(token)
    }

    public async answerWebApp(queryId: string): Promise<void> {
        await this.bot.telegram.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Пользователь успешно зарегистрирован',
            input_message_content: {
                message_text: 'Вы были успешно зарегистрированы',
            },
            hide_url: true,
        })
    }

    public async sendMessage(username: string, message: string): Promise<void> {
        await this.bot.telegram.sendMessage(username, message)
    }
}
