import { IController } from '../types/controller.interface'
import { Router, Request, Response } from 'express'
import { UserService } from './user.service'
import { CreateUserInputDto } from './dto/CreateUserInput.dto'
import { TelegramService } from '../telegram/telegram.service'

export class UserController implements IController {
    path = '/user'
    router = Router()

    constructor(
        private readonly userService: UserService,
        private readonly telegramService: TelegramService
    ) {
        this.initRoutes()
    }

    private initRoutes(): void {
        this.router.post('/user', this.create.bind(this))
    }

    private async create(req: Request, res: Response): Promise<void> {
        const createUserInput: CreateUserInputDto = req.body
        try {
            const newUser = await this.userService.create(createUserInput.user)
            await this.telegramService.answerWebApp(createUserInput.queryId)
            res.status(201).json(newUser)
        } catch (error: unknown) {
            console.error(error)
        }
    }

    private async getAll(req: Request, res: Response): Promise<void> {
        const users = await this.userService.getAll()
        res.status(200).json(users)
    }

    private async getOne(req: Request, res: Response): Promise<void> {
        const userId = req.params.userId
        const user = await this.userService.getById(userId)
        if (!user) {
            res.status(404).json({ error: 'Пользователь с таким id не найден' })
        }
        res.status(200).json(user)
    }
}
