import { IBotContext } from '../types/context.interface'
import { UserService } from '../../user/user.service'
import { registrationInlineButton } from '../keyboards/user_keyboard'

export async function checkPermission(
    ctx: IBotContext,
    next: () => void
): Promise<void> {
    const userId = ctx.session.userId
    if (!userId) {
        await ctx.reply('Не получилось определить кто вы...')
        return
    }

    const userService = new UserService()
    const user = await userService.getById(userId)
    if (!user) {
        await ctx.reply(
            'Кажется вы не зарегестрированы! Для регистрации перейдите в webapp',
            registrationInlineButton
        )
        return
    }

    ctx.session.isAdmin = user.isAdmin
    next()
}
