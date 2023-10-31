/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
// Adapted from https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas/blob/master/SecretsManagerRotationTemplate/lambda_function.py
import { SecretsManager } from 'aws-sdk'

const client = new SecretsManager()

type SecretRotationEvent = {
  SecretId: string
  ClientRequestToken: string
  Step: string
}

export async function handler({ event }: { event: SecretRotationEvent }) {
  const arn = event.SecretId
  const token = event.ClientRequestToken
  const step = event.Step

  try {
    const metadata = await client.describeSecret({ SecretId: arn }).promise()

    if (!metadata.RotationEnabled) {
      throw new Error(`Secret ${arn} is not enabled for rotation`)
    }

    const versions = metadata.VersionIdsToStages

    if (!versions)
      throw new Error(
        `Versions are not defined. The provided metadata: ${JSON.stringify(
          metadata,
          null,
          2
        )}`
      )

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

async function createSecret(arn: string, token: string) {
  try {
    await client
      .getSecretValue({ SecretId: arn, VersionStage: 'AWSCURRENT' })
      .promise()
    try {
      await client
        .getSecretValue({
          SecretId: arn,
          VersionId: token,
          VersionStage: 'AWSPENDING',
        })
        .promise()
    } catch (error) {
      const excludeCharacters = process.env.EXCLUDE_CHARACTERS || '/@"\'\\'
      const passwd = await client
        .getRandomPassword({ ExcludeCharacters: excludeCharacters })
        .promise()
      await client
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

async function setSecret(arn: string, token: string) {
  // This is where the secret should be set in the service
  throw new Error('setSecret: Not implemented')
}

async function testSecret(arn: string, token: string) {
  // This is where the secret should be tested against the service
  throw new Error('testSecret: Not implemented')
}

async function finishSecret(arn: string, token: string) {
  try {
    const metadata = await client.describeSecret({ SecretId: arn }).promise()
    let currentVersion

    for (const version in metadata.VersionIdsToStages) {
      if ('AWSCURRENT' in metadata.VersionIdsToStages[version]) {
        if (version === token) {
          return
        }
        currentVersion = version
        break
      }
    }

    await client
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
