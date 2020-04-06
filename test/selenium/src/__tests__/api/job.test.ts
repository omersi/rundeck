import {RundeckCluster} from 'RundeckCluster'
import {CreateCluster} from 'test/api'
import {parse} from 'fast-xml-parser'

import {readStream} from 'async/stream'
import {readFile} from 'async/fs'
import 'test/rundeck'
import {runJobAndWait} from 'util/RundeckAPI'

// We will initialize and cleanup in the before/after methods
let cluster: RundeckCluster

beforeAll( async () => {
    cluster = await CreateCluster()
})

describe('Jobs', () => {
    it('Scooby Doos', async () => {
        /** Load files onto cluster */
        for (let node of cluster.nodes) {
            let buffer = await readFile('./lib/job/job-run-steps-test-script1.txt')
            await node.writeFile('/home/rundeck/job-run-steps-test-script1.txt', buffer)

            buffer = await readFile('./lib/job/job-run-steps-test-script2.txt')
            await node.writeFile('/home/rundeck/job-run-steps-test-script2.txt', buffer)
        }

        /** Import job definition */
        const createREsp = await cluster.client.projectJobsImport('test', Buffer.from(job), {jobImportOptions: {dupeOption: 'update'}})
        const body = (await readStream(createREsp.readableStreamBody)).toString()
        const obj = parse(body, {ignoreAttributes: false, attributeNamePrefix: '$_'})

        expect(obj.result.succeeded.$_count).toEqual('2')

        /** Run job and collect log output */
        const jobId = obj.result.succeeded.job[0].id
        const runResp = await runJobAndWait(cluster.client, jobId, {request: {options:{opt2: 'a'}}})
        const log = await cluster.client.executionOutputGet(runResp.id.toString())

        /** Compare log output to expected */
        const expectedOut = [
            'hello there',
            'option opt1: testvalue',
            'option opt1: testvalue',
            expect.any(String),
            'option opt2: a',
            'this is script 2, opt1 is testvalue',
            'hello there',
            'this is script 1, opt1 is testvalue',
        ]
        let logTxt = log.entries.map(e => e.log)
        expect(logTxt).toEqual(expectedOut)
    })
})


const command = 'echo hello there'

const SCRIPT_FILE_1='/home/rundeck/job-run-steps-test-script1.txt'
const SCRIPT_FILE_2='/home/rundeck/job-run-steps-test-script2.txt'

const DOS_LINE_SCRIPT=`\
#!/bin/bash

echo "this is script 2, opt1 is $RD_OPTION_OPT1"
`

const job = `
<joblist>
   <job>
      <name>test job</name>
      <group>api-test/job-run-steps</group>
      <description></description>
      <loglevel>INFO</loglevel>
      <context>
          <options>
              <option name="opt1" value="testvalue" required="true"/>
              <option name="opt2" values="a,b,c" required="true"/>
          </options>
      </context>
      <dispatch>
        <threadcount>1</threadcount>
        <keepgoing>true</keepgoing>
      </dispatch>
      <sequence>
        <command>
        <exec>${command}</exec>
        </command>
         <command>
        <scriptargs>\${option.opt2}</scriptargs>
        <script><![CDATA[#!/bin/bash

echo "option opt1: \$RD_OPTION_OPT1"
echo "option opt1: @option.opt1@"
echo "node: @node.name@"
echo "option opt2: \$1"]]></script>
      </command>
         <command>
        <scriptargs>\${option.opt2}</scriptargs>
        <script><![CDATA[${DOS_LINE_SCRIPT}]]></script>
      </command>
      <command>
        <jobref name='secondary job' group='api-test/job-run-steps'>
          <arg line='-opt1 asdf -opt2 asdf2' />
        </jobref>
      </command>
      <command>
        <scriptfile>${SCRIPT_FILE_1}</scriptfile>
        <scriptargs />
      </command>
      </sequence>
   </job>
   <job>
      <name>secondary job</name>
      <group>api-test/job-run-steps</group>
      <description></description>
      <loglevel>INFO</loglevel>
      <context>
          <options>
              <option name="opt1" value="testvalue" required="true"/>
              <option name="opt2" values="a,b,c" required="true"/>
          </options>
      </context>
      <dispatch>
        <threadcount>1</threadcount>
        <keepgoing>true</keepgoing>
      </dispatch>
      <sequence>
        <command>
        <exec>${command}</exec>
        </command>
      </sequence>
   </job>
</joblist>
`