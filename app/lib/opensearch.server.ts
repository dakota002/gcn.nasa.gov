/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  CreateDomainCommand,
  DescribeDomainCommand,
  DescribeDomainConfigCommand,
  DescribeDomainHealthCommand,
  DescribeDomainNodesCommand,
  OpenSearchClient,
} from '@aws-sdk/client-opensearch'
// import { search as getSearchClient } from '@nasa-gcn/architect-functions-search'
import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'

const client = new OpenSearchClient({})

function createOsClient() {
  return new Client({
    ...AwsSigv4Signer({
      region: 'us-east-1',
    }),
    node: '', // Domain http link here
  })
}

// Trying the opensearch functions
export async function getIndexes() {
  // const nodes = await getNodes()
  const osCLient = createOsClient()
  const data = await osCLient.cat.indices({ h: 'index' })
  return data
}

export async function getIndexSchemas() {
  const osCLient = createOsClient()
  const indexes = (await getIndexes()).body.split('\n')
  const mappings = []
  for (const index of indexes) {
    mappings.push((await osCLient.indices.getMapping({ index })).body)
  }
  return mappings
}

export async function bulkPutCircularsIndex() {
  const osCLient = createOsClient()
  const response = osCLient.bulk({
    index: 'circulars',
    // circulars ,
    body: [
      //https://github.com/opensearch-project/opensearch-js/blob/e82c1cc8df693b22c8102a25e3c2e27f97859734/guides/bulk.md
    ],
  })
  return response
}

export async function getOpenSearchConfig() {
  const data = await client.send(
    new DescribeDomainConfigCommand({
      DomainName: 'opensearch-thu-jun-25-2026',
    })
  )
  return data
}

export async function createIndex() {
  const osCLient = createOsClient()
  // Works, but may take longer than 10 secs. to resolve, whichcan cause the lambda to timeout.
  // Call in fetcher?
  if (!(await osCLient.indices.exists({ index: 'test_index' })).body)
    await osCLient.indices.create({ index: 'test_index' })
}

export async function getNodes(DomainName: string) {
  return await client.send(new DescribeDomainNodesCommand({ DomainName }))
}

export async function getOpensearchDomainInfo(DomainName: string) {
  const data = await client.send(new DescribeDomainCommand({ DomainName })) // From TEST domain since it is green
  return data
}

export async function getDomainHealth(DomainName: string) {
  const data = await client.send(
    new DescribeDomainHealthCommand({ DomainName })
  )
  return data
}

export async function createOpenSearchDomain() {
  const response = await client.send(
    new CreateDomainCommand({
      // Copied from current definition, some fields may be excess and removed
      DomainName:
        `opensearch-${new Date().toDateString().replaceAll(' ', '-')}`.toLowerCase(),
      EngineVersion: 'OpenSearch_3.5',
      ClusterConfig: {
        InstanceCount: 3,
        InstanceType: 't3.small.search',
        DedicatedMasterEnabled: true,
        DedicatedMasterCount: 3,
        ZoneAwarenessEnabled: true,
        ZoneAwarenessConfig: {
          AvailabilityZoneCount: 3,
        },
        WarmEnabled: false,
        ColdStorageOptions: {
          Enabled: false,
        },
        MultiAZWithStandbyEnabled: false,
      },
      EBSOptions: {
        EBSEnabled: true,
        VolumeType: 'gp3',
        VolumeSize: 10,
        Iops: 3000,
        Throughput: 125,
      },
      AccessPolicies: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: '', // Principal arn here
            },
            Action: 'es:ESHttp*',
            Resource: '*',
          },
        ],
      }),
      IPAddressType: 'dualstack',
      SnapshotOptions: {
        AutomatedSnapshotStartHour: 0,
      },
      CognitoOptions: {
        Enabled: false,
      },
      EncryptionAtRestOptions: {
        Enabled: true,
        KmsKeyId: '', // TODO: update this
      },
      NodeToNodeEncryptionOptions: {
        Enabled: true,
      },
      AdvancedOptions: {
        'rest.action.multi.allow_explicit_index': 'true',
        override_main_response_version: 'true',
      },
      LogPublishingOptions: {
        ES_APPLICATION_LOGS: {
          CloudWatchLogsLogGroupArn: '', // TODO: Add this
          Enabled: true,
        },
        AUDIT_LOGS: {
          Enabled: false,
        },
      },
      DomainEndpointOptions: {
        EnforceHTTPS: true,
        TLSSecurityPolicy: 'Policy-Min-TLS-1-2-PFS-2023-10',
        CustomEndpointEnabled: false,
      },
      AdvancedSecurityOptions: {
        Enabled: true,
        InternalUserDatabaseEnabled: true,
        AnonymousAuthEnabled: false,
        MasterUserOptions: {
          // TODO: This?
          MasterUserName: '',
          MasterUserPassword: '',
        },
      },
      AutoTuneOptions: {
        DesiredState: 'DISABLED',
        UseOffPeakWindow: false,
      },
      OffPeakWindowOptions: {
        Enabled: true,
        OffPeakWindow: {
          WindowStartTime: {
            Hours: 3,
            Minutes: 0,
          },
        },
      },
      SoftwareUpdateOptions: {
        AutoSoftwareUpdateEnabled: true,
      },
      AIMLOptions: {
        NaturalLanguageQueryGenerationOptions: {
          DesiredState: 'ENABLED',
        },
      },
      DeploymentStrategyOptions: {
        DeploymentStrategy: 'CapacityOptimized',
      },
      AutomatedSnapshotPauseOptions: {
        Enabled: false,
      },
    })
  )
  return response
}
