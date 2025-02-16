import { Context, Scenes } from 'telegraf'
import { WizardContextWizard, WizardSessionData } from 'telegraf/scenes'

export interface SceneSession extends Scenes.WizardSessionData {
    title: string
    description: string
    date: string
    wizardData?: WizardSessionData
}

export interface Session extends Scenes.SceneSession<SceneSession> {
    userId: string
    eventToUpdateId: number
    isAuth: boolean
    isAdmin: boolean
    currentPage: number
    countOfPages: number
}

export interface IBotContext extends Context {
    session: Session
    scene: Scenes.SceneContextScene<IBotContext, SceneSession>
    wizard: WizardContextWizard<IBotContext>
}
