import { Scenes } from 'telegraf'
import { IBotContext } from '../types/context.interface'
import { createEventScene } from './create_event.scene'
import { updateEventScene } from './update_event.scene'

export const stage = new Scenes.Stage<IBotContext>()

stage.register(createEventScene, updateEventScene)
