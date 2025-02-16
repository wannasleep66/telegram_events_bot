import { Repository } from 'typeorm'
import { User } from './user.entity'
import { orm } from '../orm'
import { CreateUserDto } from './dto/CreateUser.dto'

export class UserService {
    private readonly userRepository: Repository<User>

    constructor() {
        this.userRepository = orm.getRepository(User)
    }

    public async create(userData: CreateUserDto): Promise<User> {
        const user = this.userRepository.create(userData)
        await this.userRepository.save(user)
        return user
    }

    public async getAll(): Promise<User[]> {
        const users = await this.userRepository
            .createQueryBuilder('user')
            .getMany()

        return users
    }

    public async getById(userId: string): Promise<User | null> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .where('user.id = :id', { id: userId })
            .getOne()

        return user
    }
}
