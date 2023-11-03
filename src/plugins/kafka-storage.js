/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export const set = {
  events({ arc }) {
    console.log(arc)
    return [
      {
        name: 'kafka-storage',
        src: 'build/kafka',
      },
    ]
  },
}

export const deploy = {
  start({ cloudformation, arc }) {
    console.log('From deploy:')
    console.log(JSON.stringify(cloudformation, null, 2))
    // cloudformation.
    // cloudformation.Resources.kafkaStorageBucket = {
    //   Type: 'AWS::S3::Bucket',
    //   Properties: {
    //     OwnershipControls: {
    //       Rules: [
    //         {
    //           ObjectOwnership: 'BucketOwnerEnforced',
    //         },
    //       ],
    //     },
    //     PublicAccessBlockConfiguration: {
    //       BlockPublicAcls: true,
    //       BlockPublicPolicy: true,
    //       IgnorePublicAcls: true,
    //       RestrictPublicBuckets: true,
    //     },
    //   },
    // }

    // cloudformation.Resources.kafkaStorageBucketPolicy = {
    //   Type: 'AWS::S3::BucketPolicy',
    //   Properties: {
    //     Bucket: { Ref: 'kafkaStorageBucket' },
    //     PolicyDocument: {
    //       Version: '2012-10-17',
    //       Statement: [
    //         {
    //           Sid: 'AllowSESPuts',
    //           Effect: 'Allow',
    //           Principal: {
    //             Service: 'ses.amazonaws.com',
    //           },
    //           Action: 's3:PutObject',
    //           Resource: {
    //             'Fn::Sub': [
    //               `\${bukkit}/*`,
    //               { bukkit: { 'Fn::GetAtt': 'kafkaStorageBucket.Arn' } },
    //             ],
    //           },
    //           Condition: {
    //             StringEquals: {
    //               'AWS:SourceAccount': { Ref: 'AWS::AccountId' },
    //             },
    //             // StringLike: {
    //             //   'AWS:SourceArn': {
    //             //     'Fn::Sub': [
    //             //       `arn:\${AWS::Partition}:ses:\${AWS::Region}:\${AWS::AccountId}:receipt-rule-set/\${RuleSetName}:receipt-rule/*`,
    //             //       { RuleSetName: { Ref: '`EmailIncoming`ReceiptRuleSet' } },
    //             //     ],
    //             //   },
    //             // },
    //           },
    //         },
    //       ],
    //     },
    //   },
    // }

    // cloudformation.Resources.Role.Properties.Policies.push({
    //   PolicyName: 'kafkaStorageBucketAccess',
    //   PolicyDocument: {
    //     Statement: [
    //       {
    //         Effect: 'Allow',
    //         Action: ['s3:GetObject'],
    //         Resource: [
    //           {
    //             'Fn::Sub': [
    //               `arn:aws:s3:::\${bukkit}`,
    //               { bukkit: { Ref: 'kafkaStorageBucket' } },
    //             ],
    //           },
    //           {
    //             'Fn::Sub': [
    //               `arn:aws:s3:::\${bukkit}/*`,
    //               { bukkit: { Ref: 'KafkaIncomingBucket' } },
    //             ],
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // })

    return cloudformation
  },
}
