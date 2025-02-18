import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Subscription } from '../subscription/subscription.entity'

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public title: string

    @Column()
    public description: string

    @Column('timestamp')
    public date: Date

    @OneToMany(() => Subscription, (subscription) => subscription.event, {
        onDelete: 'CASCADE',
    })
    public subscriptions: Subscription[]
}
