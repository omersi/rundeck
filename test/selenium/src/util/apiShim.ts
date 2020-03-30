import CP from 'child_process'
import FS from 'fs'

import {envOpts} from 'test/selenium'

const skipTests = [
    'test-job-run-steps.sh', // Requires file on Rundeck server(s)
    'test-job-run-webhook.sh', // Requires NC running
    'test-job-run-without-deadlock.sh', // Requires inspecting log output

    'test-execution-cleaner-job.sh', // Does not handle `null` for execution server UUID in a cluster
    'test-execution-output-plain-lastlines.sh',
    'test-execution-output-plain.sh',
    'test-execution-output-utf8.sh',
    'test-execution-state.sh', // Reads framework.properties
]

export function ShimApiTests(pattern: RegExp) {
    beforeAll(() => {
        const out = CP.execSync(`RDECK_URL=${envOpts.RUNDECK_URL} bash ./rundecklogin.sh - admin admin`, {cwd: '../api'})
    })

    let tests = FS.readdirSync('../api')

    tests = tests.filter(t => pattern.test(t) && t.endsWith('.sh'))

    tests.forEach(t => {
        if(skipTests.indexOf(t) > -1) {
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
