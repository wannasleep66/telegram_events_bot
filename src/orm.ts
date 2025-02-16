import { join } from 'path'
import { DataSource } from 'typeorm'
import dotenv from 'dotenv'
dotenv.config()

export const orm = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [join(__dirname, 'src/../**/**.entity{.ts,.js}')],
    synchronize: true,
})
