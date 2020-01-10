import { Plugin } from '@nuxt/types'

declare module 'vue/types/vue' {
    interface Vue {
        $print(id: string, printOptions?: PrintOptions): Promise<void>
    }
}

const printPlugin: Plugin = ({ app }, inject) => {
    const addStyles = (win: Window, styles: string[]) => {
        styles.forEach((style) => {
            const link = win.document.createElement('link')
            link.setAttribute('rel', 'stylesheet')
            link.setAttribute('type', 'text/css')
            link.setAttribute('href', style)
            win.document.getElementsByTagName('head')[0].appendChild(link)
        })
    }

    inject(
        'print',
        (
            id: string,
            { landscape = true }: PrintOptions = {
                landscape: true
            }
        ) =>
            new Promise((resolve, reject) => {
                landscape = landscape || true
                const name = '_blank'
                const specsArray = [
                    'fullscreen=yes',
                    'titlebar=yes',
                    'scrollbars=yes'
                ]
                const replace = true
                const styles: string[] = [
                    'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css',
                    'https://unpkg.com/bootstrap-vue@latest/dist/bootstrap-vue.min.js'
                ]
                const specs = specsArray.length ? specsArray.join(',') : ''

                const element = document.getElementById(id)

                if (!element) {
                    reject(new Error(`Element to print #${id} not found!`))
                    return
                }

                const url = ''
                const win = window.open(url, name, specs, replace)
                if (win) {
                    win.document.write(`
            <html>
              <head>
                <title>${document.title}</title>

              </head>
              <body>
              ${landscape &&
                  `<style type="text/css" media="print">@page{size: landscape;}</style>`}
                ${element.innerHTML}
              </body>
            </html>
          `)

                    addStyles(win, styles)

                    setTimeout(() => {
                        win.document.close()
                        win.focus()
                        win.print()
                        win.close()
                        resolve()
                    }, 1000)
                }
            })
    )
}

export default printPlugin

interface PrintOptions {
    landscape?: boolean
}
