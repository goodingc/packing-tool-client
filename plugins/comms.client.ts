import { Plugin } from '@nuxt/types'

declare module 'vue/types/vue' {
    interface Vue {
        $send(action: string, payload?: any, tag?: string): Promise<any>

        $registerAction(
            action: string,
            handler: (payload: any) => void,
            tag: string
        ): void

        $newTag(): string
    }
}

const commsPlugin: Plugin = ({ app }, inject) => {
    const serverUrl: string = `ws://${document.location.hostname}:8000`
    let ws = new WebSocket(serverUrl)

    const messageHandlers: MessageHandler[] = []

    const openHandler = () => {
        console.log(`[?] WebSocket connection opened`)
        ws.onclose = () => retry(1)
        ws.onmessage = handleMessage
        ws.send(
            JSON.stringify({
                action: 'connection/reestablish'
            })
        )
    }

    const handleMessage = (event: MessageEvent) => {
        const message = <Message>JSON.parse(event.data)
        let messageHandler
        for (messageHandler of messageHandlers) {
            if (messageHandler.handles(message)) {
                messageHandler.handle(message)
                return
            }
        }
        console.log(`[!] Unhandled message: `, message)
    }

    const retry = (attempt: number) => {
        console.log(
            `[!] WebSocket connection closed, attempting to retry, attempt: ${attempt}`
        )
        ws = new WebSocket(serverUrl)
        ws.onopen = openHandler
        ws.onerror = () => {
            if (attempt === 20) {
                console.log(
                    `[-] Unable to reestablish WebSocket connection, quitting`
                )
            }
            setTimeout(() => retry(attempt + 1), 500)
        }
    }

    ws.onopen = openHandler

    const wait = (execute: VoidFunction) => {
        if (ws.readyState === WebSocket.OPEN) {
            execute()
        } else {
            setTimeout(() => wait(execute), 500)
        }
    }

    inject('send', (action: string, payload?: any, tag?: string) => {
        payload = payload || {}
        tag = tag || newTag()

        return new Promise((resolve, reject) => {
            app.$registerAction(
                action + '/reply',
                (payload: any) => {
                    if (payload.success) {
                        resolve(payload.data)
                    } else {
                        reject(payload.error)
                    }
                },
                tag
            )
            wait(() => {
                ws.send(
                    JSON.stringify({
                        action,
                        payload,
                        tag
                    })
                )
            })
        })
    })

    inject(
        'registerAction',
        (action: string, handler: (payload: any) => void, tag: string) => {
            messageHandlers.push(new MessageHandler(action, tag, handler))
        }
    )

    const newTag = (): string =>
        Math.random()
            .toString(16)
            .substr(2)

    inject('newTag', newTag)
}

export default commsPlugin

class MessageHandler {
    action: string
    tag: string
    handler: (payload: any) => void

    constructor(action: string, tag: string, handler: (payload: any) => void) {
        this.action = action
        this.tag = tag
        this.handler = handler
    }

    handles(message: Message): boolean {
        return message.action === this.action && this.tag === message.tag
    }

    handle(message: Message): void {
        this.handler(message.payload)
    }
}

interface Message {
    action: string
    tag: string
    payload: any
}
