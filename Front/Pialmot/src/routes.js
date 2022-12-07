import singleSelect from './single/select.svelte'
import singleWrite from './single/write.svelte'

import multiSelect from './multi/select.svelte'

import main from './main.svelte'

const routes = {
    '/': main, // Note: 임시임
    '/main': main,
    '/select/:group': singleSelect,
    '/write/:group': singleWrite,
    '/multi/select/:hash': multiSelect,
}

export default routes