import express from 'express'
import cors from 'cors'
import { IController } from './types/controller.interface'

export class App {
    private readonly port: number
    private app: express.Application

    constructor(port: number, controllers: IController[]) {
        this.app = express()
        this.port = port

        this.initMiddlewares()
        this.initControllers(controllers)
    }

    private initMiddlewares(): void {
        this.app.use(express.json())
        this.app.use(cors())
    }

    private initControllers(controllers: IController[]): void {
        controllers.forEach((controller) =>
            this.app.use('/api', controller.router)
        )
    }

    public listen(): void {
        this.app.listen(this.port, () =>
            console.log(`application started on PORT: ${this.port}`)
        )
    }
}
