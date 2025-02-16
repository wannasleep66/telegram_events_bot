import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm'
import { Subscription } from '../subscription/subscription.entity'

@Entity()
export class User {
    @PrimaryColumn()
    public id: string

    @Column()
    public username: string

    @Column()
    public surname: string

    @Column()
    public group: string

    @Column({ default: false })
    public isAdmin: boolean

    @OneToMany(() => Subscription, (subscription) => subscription.user)
    public subscriptions: Subscription[]
}
