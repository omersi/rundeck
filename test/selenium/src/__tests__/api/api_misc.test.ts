import FS, { fstat } from 'fs'
import CP from 'child_process'

import {ShimApiTests} from 'util/apiShim'

import {envOpts} from 'test/selenium'

describe('Legacy API Project Tests', ()=> {
    [
        /^test-history/,
        /^test-invalid/,
        /^test-metrics/,
        /^test-require-version/,
        /^test-resource/,
        /^test-run/,
        /^test-storage/,
        /^test-v23/,
        /^test-workflow/,
    ].forEach(t => {
        ShimApiTests(t)
    })
})