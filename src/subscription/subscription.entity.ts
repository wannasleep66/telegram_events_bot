import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm'
import { User } from '../user/user.entity'
import { Event } from '../event/event.entity'

@Entity()
@Unique('idx_userId_eventId', ['userId', 'eventId'])
export class Subscription {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ default: false })
    public visited: boolean

    @Column()
    public userId: string

    @Column()
    public eventId: number

    @ManyToOne(() => User, (user) => user.subscriptions)
    public user: User

    @ManyToOne(() => Event, (event) => event.subscriptions)
    public event: Event
}
