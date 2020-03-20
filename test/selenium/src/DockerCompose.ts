import CP from 'child_process'

import readline from 'readline'

export class DockerCompose {
    workDir: string

    constructor(readonly worDir: string) {}

    async containers(): Promise<String[]> {
        const cp = CP.spawn('docker-compose', ['ps'], {cwd: this.worDir})

        const stdout = (async () => {
            let output = [] as String[]
            let burnedHeader = false
            const rl = readline.createInterface(cp.stdout)
            for await (let l of rl) {
                if (burnedHeader)
                    output.push(l.split(/\s+/)[0])
                if (l.startsWith('----'))
                    burnedHeader = true
            }
            return output
        })()

        return stdout
    }
}

const compose = new DockerCompose('./lib/compose/cluster')

compose.containers().then( s => console.log(s))