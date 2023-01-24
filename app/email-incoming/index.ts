/*!
 * Copyright © 2022 United States Government as represented by the Administrator
 * of the National Aeronautics and Space Administration. No copyright is claimed
 * in the United States under Title 17, U.S. Code. All Other Rights Reserved.
 *
 * SPDX-License-Identifier: NASA-1.3
 */

import {
  ListUsersInGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { DynamoDBAutoIncrement } from '@nasa-gcn/dynamodb-autoincrement'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import type { S3Event, S3EventRecord } from 'aws-lambda'

import type { Source } from 'mailparser'
import { simpleParser } from 'mailparser'

import {
  subjectIsValid,
  formatAuthor,
  bodyIsValid,
} from '../routes/circulars/circulars.lib'

import { tables } from '@architect/functions'
import { extractAttributeRequired, extractAttribute } from '~/lib/cognito'

const s3 = new S3Client({})
const client = new CognitoIdentityProviderClient({})
const sesClient = new SESv2Client({})
const doc = DynamoDBDocument.from(new DynamoDBClient({}))

const domain = process.env.DOMAIN

// Type guarding to get around an error when trying to access `reason`
const isRejected = (
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult => input.status === 'rejected'

async function handleRecord(
  record: S3EventRecord,
  autoIncrement: DynamoDBAutoIncrement
) {
  // Get data from S3
  const object = await s3.send(
    new GetObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: decodeURIComponent(record.s3.object.key.replace(/\+/g, ' ')),
    })
  )
  if (!object.Body) throw new Error('S3 object has no body')

  const parsed = await simpleParser(object.Body as Source)
  if (!parsed.from) throw new Error('S3 object has no sender')

  const userEmail = parsed.from.value[0].address
  if (!userEmail)
    throw new Error(
      'Error parsing sender email from model: ' + JSON.stringify(parsed.from)
    )

  if (
    !parsed.subject ||
    !subjectIsValid(parsed.subject) ||
    !parsed.text ||
    !bodyIsValid(parsed.text)
  ) {
    await sendEmail(
      userEmail,
      'GCN Circular Submission Warning: Invalid subject or body structure',
      `The submission of your Circular has been rejected, as the subject line and body do not conform to the appropriate format. Please see https://${domain}gcn.nasa.gov/circulars/classic#submission-process for more information.`
    )
    return
  }

  // Check if submitter is in the submitters group
  var listUsersParams = {
    GroupName: 'gcn.nasa.gov/circular-submitter',
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
  }

  const data = await client.send(new ListUsersInGroupCommand(listUsersParams))

  const userTypeData = data.Users?.find(
    (user) => extractAttributeRequired(user, 'email') == userEmail
  )
  if (!userTypeData) {
    await sendEmail(
      userEmail,
      'GCN Circular Submission Warning: Missing permissions',
      'You do not have the required permissions to submit GCN Circulars. If you believe this to be a mistake, please fill out the form at https://heasarc.gsfc.nasa.gov/cgi-bin/Feedback?selected=kafkagcn, and we will look into resolving it as soon as possible.'
    )
    return
  }

  const userData = {
    sub: extractAttributeRequired(userTypeData, 'sub'),
    email: extractAttributeRequired(userTypeData, 'email'),
    name: extractAttribute(userTypeData, 'name'),
    affiliation: extractAttribute(userTypeData, 'custom:affiliation'),
  }

  const circular = {
    dummy: 0,
    createdOn: Date.now(),
    subject: parsed.subject,
    body: parsed.text,
    sub: userData.sub,
    submitter: formatAuthor(userData),
  }

  const newCircularId = await autoIncrement.put(circular)

  // Send a success email
  await sendEmail(
    userEmail,
    `Successfully submitted Circular: ${newCircularId}`,
    `Your circular has been successfully submitted. You may view it at http://${domain}gcn.nasa.gov/circulars/${newCircularId}`
  )
}

export async function handler(event: S3Event) {
  // Get tables for autoincrement
  const db = await tables()
  const tableName = db.name('circulars')
  const counterTableName = db.name('auto_increment_metadata')
  if (!tableName || !counterTableName) {
    throw new Error('Could not find tables')
  }

  const autoIncrement = new DynamoDBAutoIncrement({
    doc,
    counterTableName,
    counterTableKey: { tableName: 'circulars' },
    counterTableAttributeName: 'circularId',
    tableName: tableName,
    tableAttributeName: 'circularId',
    initialValue: 1,
  })
  const handlerPromises = event.Records.filter(
    (record) => record.eventName == 'ObjectCreated:Put'
  ).map((record) => handleRecord(record, autoIncrement))
  const results = await Promise.allSettled(handlerPromises)
  const rejections = results.filter(isRejected).map(({ reason }) => reason)
  if (rejections.length) throw rejections
}

async function sendEmail(recipient: string, subject: string, body: string) {
  const sendEmailCommand = new SendEmailCommand({
    Destination: {
      ToAddresses: [recipient],
    },
    FromEmailAddress: `no-reply@${domain}gcn.nasa.gov`,
    Content: {
      Simple: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: body,
          },
        },
      },
    },
  })

  await sesClient.send(sendEmailCommand)
}
