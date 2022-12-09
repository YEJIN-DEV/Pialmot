import kindSelect from './KindSelect.svelte'
import singleSelect from './single/select.svelte'
import singleWrite from './single/write.svelte'
import multiSelect from './multi/select.svelte'

import main from './main.svelte'

const routes = {
    '/': main, // Note: 임시임
    '/main': main,
    '/select/:group': kindSelect,
    '/single/select': singleSelect,
    '/multi/select/:hash': multiSelect,
}

export default routes