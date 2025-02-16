import { Scenes } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { COMMANDS } from '../constants'
import {
    cancelAndSkipUpdateButton,
    createAdminMenu,
    createDevMenu,
} from '../keyboards/admin_keyboard'
import { parseEventDate } from '../utils/date-formater'
import { EventService } from '../../event/event.service'

export const updateEventScene = new Scenes.WizardScene<IBotContext>(
    COMMANDS.update,
    async (ctx, next: () => void) => {
        await ctx.reply(
            'Укажите новое название или нажмите кнопку пропустить',
            {
                reply_markup: cancelAndSkipUpdateButton.reply_markup,
            }
        )
        ctx.wizard.next()
    },
    async (ctx, next: () => void) => {
        // @ts-ignore
        const message = ctx.message.text
        if (message === COMMANDS.cancel) {
            await ctx.scene.leave()
            return next()
        }

        if (message === COMMANDS.skip) {
            ctx.scene.session.title = ''
            await ctx.reply('Добавьте описание для задачи')
            return ctx.wizard.next()
        }

        ctx.scene.session.title = message
        await ctx.reply('Добавьте описание для задачи')
        ctx.wizard.next()
    },
    async (ctx, next: () => void) => {
        // @ts-ignore
        const message = ctx.message.text
        if (message === COMMANDS.cancel) {
            await ctx.scene.leave()
            return next()
        }

        if (message === COMMANDS.skip) {
            ctx.scene.session.description = ''
            await ctx.reply('Добавь те дату задачи в формате дд-мм-гггг чч:мм')
            return ctx.wizard.next()
        }

        ctx.scene.session.description = message
        await ctx.reply('Добавь те дату задачи в формате дд-мм-гггг чч:мм')
        ctx.wizard.next()
    },
    async (ctx, next: () => void) => {
        // @ts-ignore
        const message = ctx.message.text
        if (message === COMMANDS.cancel) {
            await ctx.scene.leave()
            return next()
        }

        const eventService = new EventService()

        if (message === COMMANDS.skip) {
            await updateEvent(
                ctx.session.eventToUpdateId,
                ctx.scene.session.title,
                ctx.scene.session.description,
                undefined,
                ctx
            )
            return ctx.scene.leave()
        }

        const formatedDate = parseEventDate(message)
        if (!formatedDate) {
            await ctx.reply('Неверный формат!')
            return ctx.wizard.selectStep(3)
        }

        await updateEvent(
            ctx.session.eventToUpdateId,
            ctx.scene.session.title,
            ctx.scene.session.description,
            formatedDate,
            ctx
        )
    }
)

async function updateEvent(
    eventId: number,
    title: string | undefined,
    description: string | undefined,
    date: Date | undefined,
    ctx: IBotContext
) {
    const eventService = new EventService()
    const keyboard = ctx.session.isAdmin ? createAdminMenu : createDevMenu
    try {
        const eventToUpdate = await eventService.getById(eventId)
        if (!eventToUpdate) {
            await ctx.reply(
                'Не удалось найти мероприятие, попробуйте еще раз',
                { reply_markup: keyboard.reply_markup }
            )
            return ctx.scene.leave()
        }

        const updatedEvent = eventService.update(eventToUpdate, {
            title: title || eventToUpdate.title,
            description: description || eventToUpdate.description,
            date: date || eventToUpdate.date,
        })
        if (!updatedEvent) {
            await ctx.reply(
                'Произошла ошибка при создании, попробуйте еще раз',
                {
                    reply_markup: keyboard.reply_markup,
                }
            )
            return ctx.scene.leave()
        }

        await ctx.reply('Мероприятие успешно обновлено!', {
            reply_markup: keyboard.reply_markup,
        })
    } catch (error) {
        await ctx.reply('Произошла ошибка при создании, попробуйте еще раз', {
            reply_markup: keyboard.reply_markup,
        })
    } finally {
        await ctx.scene.leave()
    }
}
