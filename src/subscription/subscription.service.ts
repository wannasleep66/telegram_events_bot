import { Subscription } from './subscription.entity'
import { DeleteResult, Repository } from 'typeorm'
import { orm } from '../orm'

export class SubscriptionService {
    private readonly subscriptionRepository: Repository<Subscription>

    constructor() {
        this.subscriptionRepository = orm.getRepository(Subscription)
    }

    public async create(
        userId: string,
        eventId: number
    ): Promise<Subscription> {
        const subscription = this.subscriptionRepository.create({
            userId: userId,
            eventId: eventId,
        })

        await this.subscriptionRepository.save(subscription)
        return subscription
    }

    public async getAll(): Promise<Subscription[]> {
        const subscriptions = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.user', 'user')
            .leftJoinAndSelect('subscription.event', 'event')
            .getMany()

        return subscriptions
    }

    public async getByUserAndEvent(
        userId: string,
        eventId: number
    ): Promise<Subscription | null> {
        const subscription = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .where('subscription.eventId = :eventId', { eventId: eventId })
            .andWhere('subscription.userId = :userId', { userId: userId })
            .getOne()

        return subscription
    }

    public async getByUser(userId: string): Promise<Subscription[]> {
        const subscription = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.user', 'user')
            .leftJoinAndSelect('subscription.event', 'event')
            .where('user.id = :id', { id: userId })
            .getMany()

        return subscription
    }

    public async getByUserPaginated(
        userId: string,
        skip: number,
        limit: number
    ): Promise<[subscriptions: Subscription[], count: number]> {
        const subscriptions = this.subscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.user', 'user')
            .leftJoinAndSelect('subscription.event', 'event')
            .where('user.id = :id', { id: userId })
            .take(limit)
            .skip(skip)
            .getManyAndCount()

        return subscriptions
    }

    public async getByEvent(eventId: number): Promise<Subscription[]> {
        const subscription = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.user', 'user')
            .leftJoinAndSelect('subscription.event', 'event')
            .where('event.id = :id', { id: eventId })
            .getMany()

        return subscription
    }

    public async update(
        prevSubscription: Subscription,
        visited: boolean = true
    ): Promise<Subscription> {
        prevSubscription.visited = visited

        await this.subscriptionRepository.save(prevSubscription)
        return prevSubscription
    }

    public async delete(
        subscriptionToDelete: Subscription
    ): Promise<DeleteResult> {
        const result = await this.subscriptionRepository.delete(
            subscriptionToDelete.id
        )
        return result
    }
}
