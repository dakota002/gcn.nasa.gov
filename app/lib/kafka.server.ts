/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { Kafka } from 'gcn-kafka'

import { domain, getEnvOrDie, hostname } from './env.server'

const client_id = getEnvOrDie('KAFKA_CLIENT_ID')
const client_secret = getEnvOrDie('KAFKA_CLIENT_SECRET')
const producer = new Kafka({
  client_id,
  client_secret,
  domain,
}).producer()

process.on('SIGTERM', async () => {
  await producer.disconnect()
  process.exit(0)
})

export async function sendKafka(item: any, topic: string) {
  await producer.connect()
  await producer.send({
    topic,
    messages: [
      {
        key: 'message',
        value: JSON.stringify(item),
      },
    ],
  })
  if (hostname === 'localhost') {
    await producer.disconnect()
  }
}
