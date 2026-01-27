/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { tables } from '@architect/functions'
import crypto from 'crypto'

import type { UserMetadata } from './user.server'
import type { User } from '~/routes/_auth/user.server'

export type Team = {
  teamId: string
  teamName: string
  description: string
  topic: string
  isPublic: boolean
}

export type TeamMember = {
  sub: string
  teamId: string
  permission: string
}

export async function createTeam(
  name: string,
  description: string,
  topic: string,
  isPublic: boolean
) {
  const db = await tables()

  const team: Team = {
    teamId: crypto.randomUUID(),
    teamName: name,
    description,
    topic,
    isPublic,
  }
  await db.teams.put(team)
  return team
}

export async function deleteTeam(teamId: string) {
  const db = await tables()
  await db.teams.delete({ teamId })
  const teamPermissions = (
    await db.team_members.query({
      IndexName: 'usersByTeam',
      KeyConditionExpression: 'teamId = :teamId',
      ExpressionAttributeValues: {
        ':teamId': teamId,
      },
    })
  ).Items as TeamMember[]

  await Promise.all(
    teamPermissions.map((x) => db.team_members.delete({ sub: x.sub, teamId }))
  )
}

export async function addUserToTeam(
  user: User,
  teamId: string,
  permission: 'admin' | 'producer' | 'consumer'
) {
  const db = await tables()

  await db.team_members.put({
    sub: user.sub,
    teamId,
    permission,
  })
}

export async function getUsersByTeamId(teamId: string) {
  const db = await tables()
  const { Items } = await db.team_members.query({
    IndexName: 'usersByTeam',
    KeyConditionExpression: 'teamId = :teamId',
    ExpressionAttributeValues: {
      ':teamId': teamId,
    },
  })

  const members = await Promise.all(
    Items.map((user) => {
      return {
        permission: user.permission,
        ...db.users.get({ sub: user.sub }),
      }
    })
  )

  return members as (UserMetadata & { permission: string })[]
}

export async function teamNameAlreadyExists(
  teamName: string
): Promise<Boolean> {
  const db = await tables()
  return (
    (
      await db.teams.query({
        IndexName: 'teamsByName',
        KeyConditionExpression: 'teamName = :teamName',
        ExpressionAttributeValues: {
          ':teamName': teamName,
        },
      })
    ).Items.length > 0
  )
}

export async function editTeam(
  teamId: string,
  teamName: string,
  description: string
) {
  const db = await tables()
  await db.teams.update({
    Key: { teamId },
    UpdateExpression: 'set teamName = :teamName, description = :description',
    ExpressionAttributeValues: {
      ':teamName': teamName,
      ':description': description,
    },
  })
}

export async function removeUserFromTeam(sub: string, teamId: string) {
  const db = await tables()
  await db.team_members.delete({ sub, teamId })
}

export async function getTeam(teamId: string): Promise<Team> {
  const db = await tables()
  return await db.teams.get({ teamId })
}

export async function getTeamsByUserId(sub: string) {
  const db = await tables()
  const { Items } = await db.team_members.query({
    KeyConditionExpression: '#sub = :sub',
    ExpressionAttributeNames: {
      '#sub': 'sub',
    },
    ExpressionAttributeValues: {
      ':sub': sub,
    },
  })

  return await Promise.all(Items.map((x) => db.teams.get({ teamId: x.teamId })))
}

export async function userIsTeamAdmin(
  sub: string,
  teamId: string
): Promise<boolean> {
  const db = await tables()
  const membership = await db.team_members.get({
    sub,
    teamId,
  })

  return membership && membership.permission === 'admin'
}
