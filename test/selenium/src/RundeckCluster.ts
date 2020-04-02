import CP from 'child_process'
import FS from 'fs'

import {promisify} from 'util'

import {DockerCompose} from './DockerCompose'
import {Readable} from 'stream'

import URL from 'url'
import { Rundeck, PasswordCredentialProvider } from 'ts-rundeck'
import { readFile } from 'fs'

const readfileAsync = promisify(FS.readFile)

export class RundeckCluster {
    url: URL

    client: Rundeck

    nodes: RundeckInstance[]

    constructor(url: string, username: string, password: string) {
        this.client = new Rundeck(new PasswordCredentialProvider(url, username, password), {baseUri: url})
    }
}

export class RundeckInstance {
    constructor(readonly base: URL.UrlWithStringQuery)  {}

    async readRundeckFile(file: string) {
        const readUrl = `${this.base.href}/${file}`
        return await readFileUrl(URL.parse(readUrl))
    }

    async readFile(file: string) {
        const readUrl = `${this.base.protocol}://${this.base}`
        return await readFileUrl(URL.parse(`${this.base.protocol}`))
    }
}

function readFileUrl(url: URL.UrlWithStringQuery): Promise<Buffer> {
    switch(url.protocol) {
        case('docker:'):
            return readDockerFile(url)
        case('file:'):
            return readLocalFile(url)
        default:
            throw new Error(`Unsupported protocol ${url.protocol}`)
    }
}

async function readLocalFile(url: URL.UrlWithStringQuery): Promise<Buffer> {
    return readfileAsync(url.pathname)
}

async function readDockerFile(url: URL.UrlWithStringQuery): Promise<Buffer> {
    const cp = CP.spawn('docker', ['exec', url.host, 'cat', url.pathname])
    return new Promise((res, rej) => {
        const output = [] as Buffer[]
        const error = [] as Buffer[]

        cp.stdout.on('data', (chunk: Buffer) => {
            output.push(chunk)
        })

        cp.stderr.on('data', (chunk: Buffer) => {
            error.push(chunk)
        })

        cp.on('exit', (code, sig) => {
            if (code != 0)
                rej(new Error(`Error reading file ${url}\n\n${Buffer.concat(error).toString()}`))
            else
                res(Buffer.concat(output))
        })
    })
}

async function writeDockerFile(url: URL.UrlWithStringQuery, data: Buffer): Promise<void> {
    const cp = CP.spawn('docker', ['exec', '-i', url.host, 'bash', '-c', `cat > ${url.pathname}`])
    return new Promise((res, rej) => {
        const output = [] as Buffer[]
        const error = [] as Buffer[]

        cp.stdout.on('data', (chunk: Buffer) => {
            output.push(chunk)
        })

        cp.stderr.on('data', (chunk: Buffer) => {
            error.push(chunk)
        })

        cp.on('exit', (code, sig) => {
            if (code != 0)
                rej(new Error(`Error writing file ${url}\n\n${Buffer.concat(error).toString()}`))
            else
                res()
        })

        cp.stdin.write(data)
        cp.stdin.end()
    })
}
