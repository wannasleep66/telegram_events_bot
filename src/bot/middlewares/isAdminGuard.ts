import { IBotContext } from '../types/context.interface'

export async function isAdmin(
    ctx: IBotContext,
    next: () => void
): Promise<void> {
    const isAdmin = ctx.session.isAdmin
    if (!isAdmin) {
        await ctx.reply('У вас нет доступа к данному функционалу')
        return
    }
    next()
}
