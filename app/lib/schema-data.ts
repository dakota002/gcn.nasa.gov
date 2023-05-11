/*!
 * Copyright © 2022 United States Government as represented by the Administrator
 * of the National Aeronautics and Space Administration. No copyright is claimed
 * in the United States under Title 17, U.S. Code. All Other Rights Reserved.
 *
 * SPDX-License-Identifier: NASA-1.3
 */
import { readFile } from 'fs/promises'
import { dirname, extname, join } from 'path'

import type { Schema } from '~/components/SchemaBrowserElements'

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  return e instanceof Error && 'code' in e && 'errno' in e
}
export async function loadJson(filePath: string): Promise<Schema> {
  if (!filePath) throw new Error('path must be defined')

  if (extname(filePath) !== '.json')
    throw new Response('not found', { status: 404 })

  const path = join(dirname(require.resolve('@nasa-gcn/schema')), filePath)

  let body: Schema
  try {
    body = JSON.parse(
      await readFile(path, {
        encoding: 'utf-8',
      })
    )

    if (body.allOf?.find((x) => x.$ref)) {
      //"/schema/gcn/notices/core/Event.schema.json"
      body.allOf.forEach((x) => {
        const subSchemaPath = join(
          dirname(require.resolve('@nasa-gcn/schema')),
          x.$ref.replace('schema/', '')
        )

        console.log(subSchemaPath)
      })
    }
    if (body.anyOf?.find((x) => x.$ref)) {
      //"/schema/gcn/notices/core/Event.schema.json"
      body.anyOf.forEach(async (x) => {
        if (!x.$ref.startsWith('#')) {
          const subSchemaPath = join(
            dirname(require.resolve('@nasa-gcn/schema')),
            x.$ref.replace('schema/', '')
          )

          x.schema = JSON.parse(
            await readFile(subSchemaPath, {
              encoding: 'utf-8',
            })
          )
        }
      })
    }
  } catch (e) {
    if (isErrnoException(e) && e.code === 'ENOENT') {
      throw new Response('Not found', { status: 404 })
    }
    throw e
  }

  return body
}
