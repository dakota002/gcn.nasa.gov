/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


function getLambdaName(key) {
  return `${key}-kafka-incoming`
}

export const set = {
  events({ arc: { 'kafka-incoming': kafkaIncoming } }) {
    return kafkaIncoming.map((item) => {
      const [[key, { src }]] = Object.entries(item)
      return {
        name: getLambdaName(key),
        src,
      }
    })
  },
}

export const deploy = {
  start({ cloudformation, arc: { 'kafka-incoming': kafkaIncoming } }) {
    cloudformation.Resources.KafkaIncomingBucket = {
      Type: 'AWS::S3::Bucket',
      Properties: {
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerEnforced',
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      },
    }

    cloudformation.Resources.KafkaIncomingBucketPolicy = {
      Type: 'AWS::S3::BucketPolicy',
      Properties: {
        Bucket: { Ref: 'KafkaIncomingBucket' },
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowSESPuts',
              Effect: 'Allow',
              Principal: {
                Service: 'ses.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: {
                'Fn::Sub': [
                  `\${bukkit}/*`,
                  { bukkit: { 'Fn::GetAtt': 'KafkaIncomingBucket.Arn' } },
                ],
              },
              Condition: {
                StringEquals: {
                  'AWS:SourceAccount': { Ref: 'AWS::AccountId' },
                },
                // StringLike: {
                //   'AWS:SourceArn': {
                //     'Fn::Sub': [
                //       `arn:\${AWS::Partition}:ses:\${AWS::Region}:\${AWS::AccountId}:receipt-rule-set/\${RuleSetName}:receipt-rule/*`,
                //       { RuleSetName: { Ref: '`EmailIncoming`ReceiptRuleSet' } },
                //     ],
                //   },
                // },
              },
            },
          ],
        },
      },
    }

    cloudformation.Resources.Role.Properties.Policies.push({
      PolicyName: 'KafkaIncomingBucketAccess',
      PolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject'],
            Resource: [
              {
                'Fn::Sub': [
                  `arn:aws:s3:::\${bukkit}`,
                  { bukkit: { Ref: 'KafkaIncomingBucket' } },
                ],
              },
              {
                'Fn::Sub': [
                  `arn:aws:s3:::\${bukkit}/*`,
                  { bukkit: { Ref: 'KafkaIncomingBucket' } },
                ],
              },
            ],
          },
        ],
      },
    })


    return cloudformation
  },
}