import { IBotContext } from '../types/context.interface'

export function parseUserId(ctx: IBotContext, next: () => Promise<void>): void {
    if (ctx.from?.id) {
        ctx.session.userId = ctx.from.id.toString()
    }
    next()
}
