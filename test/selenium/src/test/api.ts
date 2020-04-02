import {ParseBool} from 'util/parseBool'
import { RundeckCluster } from 'RundeckCluster'

jest.setTimeout(60000)

export const envOpts = {
    RUNDECK_URL: process.env.RUNDECK_URL || 'http://127.0.0.1:4440',
    CI: ParseBool(process.env.CI),
    HEADLESS: ParseBool(process.env.HEADLESS) || ParseBool(process.env.CI),
    S3_UPLOAD: ParseBool(process.env.S3_UPLOAD) || ParseBool(process.env.CI),
    S3_BASE: process.env.S3_BASE,
}

export async function CreateCluster() {
    const cluster = new RundeckCluster(envOpts.RUNDECK_URL!, 'admin', 'admin')
    return cluster
}
