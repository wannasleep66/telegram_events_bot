import { Scenes } from 'telegraf'
import { COMMANDS } from '../constants'
import { IBotContext } from '../types/context.interface'
import {
    cancelCreateButton,
    createAdminMenu,
} from '../keyboards/admin_keyboard'
import { parseEventDate } from '../utils/date-formater'
import { EventService } from '../../event/event.service'
import { createUserMenu } from '../keyboards/user_keyboard'

export const createEventScene = new Scenes.WizardScene<IBotContext>(
    COMMANDS.create,
    async (ctx, next: () => void) => {
        await ctx.reply('Опишите название, мероприятия', {
            reply_markup: cancelCreateButton.reply_markup,
        })
        ctx.wizard.next()
    },
    async (ctx, next: () => void) => {
        // @ts-ignore
        const message = ctx.message.text
        if (!message) {
            await ctx.reply('Пустое название недопустимо')
            return ctx.wizard.back()
        }

        if (message === COMMANDS.cancel) {
            await ctx.scene.leave()
            return next()
        }
        ctx.scene.session.title = message
        await ctx.reply('Добавьте описание для задачи')
        ctx.wizard.next()
    },
    async (ctx, next: () => void) => {
        // @ts-ignore
        const message = ctx.message.text
        if (!message) {
            await ctx.reply('Пустое описание недопустимо')
            return ctx.wizard.back()
        }

        if (message === COMMANDS.cancel) {
            await ctx.scene.leave()
            return next()
        }

        ctx.scene.session.description = message
        await ctx.reply('Добавь те дату задачи в формате дд-мм-гггг чч:мм')
        ctx.wizard.next()
    },
    async (ctx, next: () => void) => {
        // @ts-ignore
        const message = ctx.message.text
        if (!message) {
            await ctx.reply('Дату нужно указать обязательно!')
            return ctx.wizard.back()
        }

        if (message === COMMANDS.cancel) {
            await ctx.scene.leave()
            return next()
        }
        const formatedDate = parseEventDate(message)
        if (!formatedDate) {
            await ctx.reply('Неверный формат!')
            return ctx.wizard.selectStep(3)
        }

        const eventService = new EventService()
        try {
            const newEvent = await eventService.create({
                title: ctx.scene.session.title,
                description: ctx.scene.session.description,
                date: formatedDate,
            })

            if (!newEvent) {
                await ctx.reply(
                    'Произошла ошибка при создании, попробуйте еще раз'
                )
                return ctx.scene.leave()
            }
            const keyboard = ctx.session.isAdmin
                ? createAdminMenu
                : createUserMenu(ctx)

            await ctx.reply('Мероприятие успешно создано!', {
                reply_markup: keyboard.reply_markup,
            })
        } catch (error) {
            const keyboard = ctx.session.isAdmin
                ? createAdminMenu
                : createUserMenu(ctx)

            await ctx.reply(
                'Произошла ошибка при создании, попробуйте еще раз',
                { reply_markup: keyboard.reply_markup }
            )
        } finally {
            await ctx.scene.leave()
        }
    }
)
