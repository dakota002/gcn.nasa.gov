/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { Kafka } from 'gcn-kafka'

import { getEnvOrDie } from './env.server'
import type { Circular } from '~/routes/circulars/circulars.lib'

const client_id = getEnvOrDie('KAFKA_CLIENT_ID')
const client_secret = getEnvOrDie('KAFKA_CLIENT_SECRET')

const producer = new Kafka({
  client_id,
  client_secret,
  domain: 'dev.gcn.nasa.gov', // Intentionally set to dev for testing
}).producer()

export async function sendKafka(circular: Circular, topic: string) {
  await producer.connect()
  await producer.send({
    topic,
    messages: [
      {
        key: 'message',
        value: JSON.stringify(circular),
      },
    ],
  })
  await producer.disconnect()
}
