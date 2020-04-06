import {Rundeck} from 'ts-rundeck'
import {Status, ExecutionStatusGetResponse, RundeckJobExecutionRunOptionalParams} from 'ts-rundeck/dist/lib/models'

import {sleep} from 'async/util'

export async function waitForRundeckReady(client: Rundeck, timeout = 120000) {
    const start = Date.now()
    while (Date.now() - start < timeout) {
        try {
            await client.systemInfoGet()
            return
        } catch  (e) {
            console.log(e)
            await sleep(5000)
        }
    }
    throw new Error('Timeout exceeded waiting for Rundeck to be ready.')
}

const STATUS_FINAL = [
    Status.Aborted,
    Status.Failed,
    Status.Succeeded,
    Status.Timedout
]

export async function waitForExecutionComplete(client: Rundeck, id: number) {
    let resp: ExecutionStatusGetResponse

    let curStatus = Status.Running
    while(true) {
        resp = await client.executionStatusGet(id.toString())
        curStatus = resp.status

        if (STATUS_FINAL.includes(curStatus))
            break
        else
            await sleep(1000)
    }

    return resp
}

export async function runJobAndWait(client: Rundeck, id: string, options?: RundeckJobExecutionRunOptionalParams) {
    const resp = await client.jobExecutionRun(id, options)

    return await waitForExecutionComplete(client, resp.id)
}