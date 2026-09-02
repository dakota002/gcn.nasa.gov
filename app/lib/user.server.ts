/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { tables } from '@architect/functions'

export type UserMetadata = {
  sub: string
  email: string
  username?: string
  affiliation?: string
}

// How to handle multiple accts with same email? hmmm
export async function getUserByEmail(email: string) {
  const db = await tables()
  return (
    await db.users.query({
      KeyConditionExpression: 'email = :email',
      IndexName: 'usersByEmail',
      ExpressionAttributeValues: {
        ':email': email,
      },
    })
  ).Items as UserMetadata[]
}
