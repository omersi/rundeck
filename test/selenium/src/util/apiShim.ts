import CP from 'child_process'
import FS from 'fs'

import {envOpts} from 'test/selenium'

const skipTests = [
    // 'test-job-flip-scheduleEnabled.sh',
    'test-job-run-steps.sh',
    'test-job-run-webhook.sh',
    'test-job-run-without-deadlock.sh',
    'test-job-scheduled.sh',
    'test-jobs-import-jobref-renamed.sh',
    'test-jobs-import-jobref-validated-false.sh'
]

export function ShimApiTests(pattern: RegExp) {
    beforeAll(() => {
        const out = CP.execSync(`RDECK_URL=${envOpts.RUNDECK_URL} bash ./rundecklogin.sh - admin admin`, {cwd: '../api'})
    })

    let tests = FS.readdirSync('../api')

    tests = tests.filter(t => pattern.test(t) && t.endsWith('.sh'))

    tests.forEach(t => {
        if(skipTests.indexOf(t) > 0) {
            it.skip(t, () => {})
            return
        }

        it(t, () => {
            try {
                const out = CP.execSync(`RDECK_URL=${envOpts.RUNDECK_URL} bash ./${t} -`, {cwd: '../api'})
            } catch (e) {
                const ex = e as Error
                ex.message = `${e.stdout.toString()}\n${e.message}`
                throw e
            }
        })
    })
}
