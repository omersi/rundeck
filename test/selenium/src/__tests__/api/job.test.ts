import {RundeckCluster} from 'RundeckCluster'
import {CreateCluster} from 'test/api'

import 'test/rundeck'
import { sleep } from 'async/util';

// We will initialize and cleanup in the before/after methods
let cluster: RundeckCluster

beforeAll( async () => {
    cluster = await CreateCluster()
})

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
        <exec>$xmlargs</exec>
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
        <script><![CDATA[$DOS_LINE_SCRIPT]]></script>
      </command>
      <command>
        <jobref name='secondary job' group='api-test/job-run-steps'>
          <arg line='-opt1 asdf -opt2 asdf2' />
        </jobref>
      </command>
      <command>
        <scriptfile>$SCRIPT_FILE_1</scriptfile>
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
        <exec>$xmlargs</exec>
        </command>
      </sequence>
   </job>
</joblist>
`

describe('Jobs', () => {
    it('Scooby Doos', async () => {
        await cluster.client.projectJobsImport('test', Buffer.from(job), {jobImportOptions: {dupeOption: 'update'}})
    })
})