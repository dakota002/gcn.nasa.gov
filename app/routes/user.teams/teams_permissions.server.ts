/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { tables } from '@architect/functions'

export async function userIsTeamAdmin(sub: string, teamId: string) {
  const db = await tables()
  const user_permisson = await db.user_permissions.get({
    sub,
    teamId,
  })

  return user_permisson && user_permisson.permission == 'admin'
}
