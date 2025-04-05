import { Repository } from 'typeorm'
import { User } from './user.entity'
import { orm } from '../orm'
import { CreateUserDto } from './dto/CreateUser.dto'
import { UpdateUserDto } from './dto/UpdateUser.dto'

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

    public async getAll(
        skip?: number,
        limit?: number
    ): Promise<[users: User[], count: number]> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.subscriptions', 'subscription')
            .leftJoinAndSelect('subscription.event', 'event')
            .orderBy('user.username', 'DESC')

        limit && query.take(limit)
        skip && query.skip(skip)

        const users = await query.getManyAndCount()
        return users
    }

    public async getAdmins(): Promise<User[]> {
        const admins = await this.userRepository
            .createQueryBuilder('user')
            .where('user.isAdmin = true')
            .getMany()

        return admins
    }

    public async getById(userId: string): Promise<User | null> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .where('user.id = :id', { id: userId })
            .getOne()

        return user
    }

    public async update(
        prevUser: User,
        updateData: UpdateUserDto
    ): Promise<User> {
        prevUser.username = updateData.username || prevUser.username
        prevUser.surname = updateData.surname || prevUser.surname
        prevUser.group = updateData.group || prevUser.group
        prevUser.isAdmin = updateData.isAdmin || prevUser.isAdmin

        const updatedUser = await this.userRepository.save(prevUser)
        return updatedUser
    }
}
