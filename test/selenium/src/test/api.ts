import {ParseBool} from 'util/parseBool'
import { RundeckCluster, RundeckInstance } from 'RundeckCluster'
import { parse } from 'url'
import { TestProject, IRequiredResources } from 'TestProject'
import { passwordAuthPolicy, Rundeck, RundeckExtended } from 'ts-rundeck'
import { CredProviderCookieEnricher, cookieEnrichPolicy } from 'util/RundeckAPI'
import { DockerClusterManager } from 'ClusterManager'
import { BaseCredentialProvider } from 'ts-rundeck/dist/baseCredProvider'
import { RequestPolicyFactory } from '@azure/ms-rest-js'

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
    const rundeckUrl = envOpts.RUNDECK_URL!

    const clusterManager = new DockerClusterManager('./lib/compose/cluster', {
        licenseFile: './license.key',
        image: 'rundeckpro/enterprise:SNAPSHOT'
    })

    const cluster = new RundeckCluster(envOpts.RUNDECK_URL!, 'admin', 'admin', clusterManager)

    cluster.nodes = [
        new RundeckInstance(parse('docker://cluster_rundeck-1_1/home/rundeck'), clientForBackend(rundeckUrl, 'rundeck-1')),
        new RundeckInstance(parse('docker://cluster_rundeck-2_1/home/rundeck'), clientForBackend(rundeckUrl, 'rundeck-2')),
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

function clientForBackend(url: string, backend: string): Rundeck {
    const credProvider = passwordAuthPolicy(url, 'admin', 'admin')

    const cookiePolicy = cookieEnrichPolicy([`backend=${backend}`])

    return new Rundeck(new BaseCredentialProvider, {
        baseUri: url,
        noRetryPolicy: true,
        requestPolicyFactories: (def: RequestPolicyFactory[]) => {
            return [cookiePolicy, credProvider, ...def]
        }
    })
}