import { DeleteResult, Repository } from 'typeorm'
import { Event } from './event.entity'
import { orm } from '../orm'
import { CreateEventDto } from './dto/CreateEvent.dto'
import { UpdateEventDto } from './dto/UpdateEvent.dto'

export class EventService {
    private readonly eventRepository: Repository<Event>

    constructor() {
        this.eventRepository = orm.getRepository(Event)
    }

    public async create(eventData: CreateEventDto): Promise<Event> {
        const event = this.eventRepository.create(eventData)
        await this.eventRepository.save(event)
        return event
    }

    public async getAll(
        skip?: number,
        limit?: number
    ): Promise<[events: Event[], count: number]> {
        const query = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.subscriptions', 'subscription')
            .leftJoinAndSelect('subscription.user', 'user')
            .orderBy('event.date', 'DESC')

        limit && query.take(limit)
        skip && query.skip(skip)

        const events = await query.getManyAndCount()
        return events
    }

    public async getById(eventId: number): Promise<Event | null> {
        const event = await this.eventRepository
            .createQueryBuilder('event')
            .where('event.id = :id', { id: eventId })
            .getOne()

        return event
    }

    public async update(
        prevEvent: Event,
        updateData: UpdateEventDto
    ): Promise<Event> {
        prevEvent.title = updateData.title || prevEvent.title
        prevEvent.description = updateData.description || prevEvent.description
        prevEvent.date = updateData.date || prevEvent.date

        const updatedEvent = await this.eventRepository.save(prevEvent)
        return updatedEvent
    }

    public async delete(eventToDelete: Event): Promise<DeleteResult> {
        const deletingResult = await this.eventRepository.delete(
            eventToDelete.id
        )
        return deletingResult
    }
}
