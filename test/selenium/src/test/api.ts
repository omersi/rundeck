import {ParseBool} from 'util/parseBool'
import { RundeckCluster, RundeckInstance } from 'RundeckCluster'
import { parse } from 'url'
import { TestProject, IRequiredResources } from 'TestProject'

jest.setTimeout(60000)

export interface ITestContext {
    cluster: RundeckCluster
}

export const envOpts = {
    RUNDECK_URL: process.env.RUNDECK_URL || 'http://127.0.0.1:4440',
    CI: ParseBool(process.env.CI),
    HEADLESS: ParseBool(process.env.HEADLESS) || ParseBool(process.env.CI),
    S3_UPLOAD: ParseBool(process.env.S3_UPLOAD) || ParseBool(process.env.CI),
    S3_BASE: process.env.S3_BASE,
}

export async function CreateCluster() {
    const cluster = new RundeckCluster(envOpts.RUNDECK_URL!, 'admin', 'admin')

    cluster.nodes = [
        new RundeckInstance(parse('docker://cluster_rundeck-1_1/home/rundeck')),
        new RundeckInstance(parse('docker://cluster_rundeck-2_1/home/rundeck')),
    ]

    return cluster
}

export function CreateTestContext(resources: IRequiredResources) {
    let context = {cluster: null}

    beforeAll( async () => {
        context.cluster = await CreateCluster()
        await TestProject.LoadResources(context.cluster.client, resources)
    })

    return context as ITestContext
}