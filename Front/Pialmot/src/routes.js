import select from './exam/select.svelte'
import write from './exam/write.svelte'
import main from './main.svelte'

const routes = {
    '/': main, // Note: 임시임
    '/main': main,
    '/select/:group': select,
    '/write/:group': write
}

export default routes