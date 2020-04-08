import { CreateTestContext } from "test/api"
import { waitForRundeckReady } from "util/RundeckAPI"

const context = CreateTestContext({})

describe('Cluster test featureset', () => {
    it('Talks to individual nodes', async () => {
        const {cluster} = context

        const nodeSysInfos = await Promise.all(cluster.nodes.map(n => n.client.systemInfoGet()))

        const seen = []

        nodeSysInfos.forEach(info => {
            const nodeId = info.system.rundeckProperty.node
            expect(seen).not.toContain(nodeId)
            seen.push(nodeId)
        })
    })

    it('Stops and starts nodes', async () => {
        jest.setTimeout(120000)

        const {cluster} = context

        await cluster.stopNode(cluster.nodes[0])

        await cluster.startNode(cluster.nodes[0])

        await waitForRundeckReady(cluster.nodes[0].client)
    })
})