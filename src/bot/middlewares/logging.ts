import { IBotContext } from '../types/context.interface'

export function logging(ctx: IBotContext, next: () => Promise<void>): void {
    console.log(ctx)
    next()
}
