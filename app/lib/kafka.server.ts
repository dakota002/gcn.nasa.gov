/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { Kafka } from 'gcn-kafka'
import memoizee from 'memoizee'

import { domain, getEnvOrDie, hostname } from './env.server'

const client_id = getEnvOrDie('KAFKA_CLIENT_ID')
const client_secret = getEnvOrDie('KAFKA_CLIENT_SECRET')
const producer = new Kafka({
  client_id,
  client_secret,
  domain: domain as
    | 'gcn.nasa.gov'
    | 'test.gcn.nasa.gov'
    | 'dev.gcn.nasa.gov'
    | undefined,
}).producer()

process.on('SIGTERM', async () => {
  await producer.disconnect()
  process.exit(0)
})

export const sendKafka = memoizee(async function (topic: string, item: string) {
  await producer.connect()
  await producer.send({
    topic,
    messages: [
      {
        value: item,
      },
    ],
  })
  // FIXME: Sandbox does not emit SIGTERM, SIGINT, etc.
  if (hostname === 'localhost') await producer.disconnect()
})
