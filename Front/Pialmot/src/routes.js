import select from './exam/select.svelte'
import write from './exam/write.svelte'

const routes = {
    '/': select, // Note: 임시임
    '/select': select,
    '/write': write
}

export default routes