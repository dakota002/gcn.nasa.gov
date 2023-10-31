/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
// Adapted from https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas/blob/master/SecretsManagerRotationTemplate/lambda_function.py
import { SecretsManager } from 'aws-sdk'

const aws_SM = new SecretsManager()

export async function handler(event, context) {
  const arn = event.SecretId
  const token = event.ClientRequestToken
  const step = event.Step

  try {
    const metadata = await aws_SM.describeSecret({ SecretId: arn }).promise()

    if (!metadata.RotationEnabled) {
      throw new Error(`Secret ${arn} is not enabled for rotation`)
    }

    const versions = metadata.VersionIdsToStages

    if (!(token in versions)) {
      throw new Error(
        `Secret version ${token} has no stage for rotation of secret ${arn}`
      )
    }

    if ('AWSCURRENT' in versions[token]) {
      return
    } else if (!('AWSPENDING' in versions[token])) {
      throw new Error(
        `Secret version ${token} not set as AWSPENDING for rotation of secret ${arn}`
      )
    }

    if (step === 'createSecret') {
      await createSecret(arn, token)
    } else if (step === 'setSecret') {
      await setSecret(arn, token)
    } else if (step === 'testSecret') {
      await testSecret(arn, token)
    } else if (step === 'finishSecret') {
      await finishSecret(arn, token)
    } else {
      throw new Error('Invalid step parameter')
    }
  } catch (error) {
    throw error
  }
}

async function createSecret(arn, token) {
  try {
    await aws_SM
      .getSecretValue({ SecretId: arn, VersionStage: 'AWSCURRENT' })
      .promise()
    try {
      await aws_SM
        .getSecretValue({
          SecretId: arn,
          VersionId: token,
          VersionStage: 'AWSPENDING',
        })
        .promise()
    } catch (error) {
      const excludeCharacters = process.env.EXCLUDE_CHARACTERS || '/@"\'\\'
      const passwd = await aws_SM
        .getRandomPassword({ ExcludeCharacters: excludeCharacters })
        .promise()
      await aws_SM
        .putSecretValue({
          SecretId: arn,
          ClientRequestToken: token,
          SecretString: passwd.RandomPassword,
          VersionStages: ['AWSPENDING'],
        })
        .promise()
    }
  } catch (error) {
    throw error
  }
}

async function setSecret(arn, token) {
  // This is where the secret should be set in the service
  throw new Error('setSecret: Not implemented')
}

async function testSecret(arn, token) {
  // This is where the secret should be tested against the service
  throw new Error('testSecret: Not implemented')
}

async function finishSecret(arn, token) {
  try {
    const metadata = await aws_SM.describeSecret({ SecretId: arn }).promise()
    let currentVersion = null

    for (const version in metadata.VersionIdsToStages) {
      if ('AWSCURRENT' in metadata.VersionIdsToStages[version]) {
        if (version === token) {
          return
        }
        currentVersion = version
        break
      }
    }

    await aws_SM
      .updateSecretVersionStage({
        SecretId: arn,
        VersionStage: 'AWSCURRENT',
        MoveToVersionId: token,
        RemoveFromVersionId: currentVersion,
      })
      .promise()
  } catch (error) {
    throw error
  }
}
