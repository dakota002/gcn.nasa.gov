/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Grid } from '@trussworks/react-uswds'

import { getUser } from './_auth/user.server'
import SegmentedCards from '~/components/SegmentedCards'
import type { FullMemberInfo } from '~/lib/teams.server'
import { getTeam, getTeamTopics, userIsTeamAdmin } from '~/lib/teams.server'

export async function loader({
  params: { teamId },
  request,
}: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (!user) throw new Response(null, { status: 403 })
  if (!teamId) throw new Response(null, { status: 404 })
  const team = await getTeam(teamId)
  const teamAdmin = await userIsTeamAdmin(user.sub, teamId)
  const topics = await getTeamTopics(teamId)
  return { team, teamAdmin, topics }
}

export default function () {
  const { team, teamAdmin, topics } = useLoaderData<typeof loader>()
  return (
    <>
      <h1>{team.teamName}</h1>
      {teamAdmin && <Link to={`new/${team.teamId}`}>Edit</Link>}
      <p>{team.description}</p>

      <h3>Team Members</h3>
      <SegmentedCards>
        {team.teamMembers.map((member) => (
          <MemberCard
            key={member.sub}
            member={member}
            topic={topics.find((x) => x.topicId == member.topicId)?.topicName}
          />
        ))}
      </SegmentedCards>
      {JSON.stringify(team)}
    </>
  )
}

function MemberCard({
  member,
  topic,
}: {
  member: FullMemberInfo
  topic?: string
}) {
  return (
    <>
      {JSON.stringify(member)}
      <Grid row>
        <div className="tablet:grid-col flex-fill">
          <div>
            <small>
              <strong>{member.name}</strong>
            </small>
          </div>
          <div>
            <small>{member.email}</small>
          </div>
          <div>
            <small>
              <strong>Topic:</strong>
              {topic}
            </small>
          </div>
        </div>
        <div className="tablet:grid-col flex-auto margin-y-auto">
          {/* <ToolbarButtonGroup>
          <Link
            to={team.teamId}
            type="button"
            className="usa-button usa-button--outline"
          >
            View
          </Link>
        </ToolbarButtonGroup> */}
        </div>
      </Grid>
    </>
  )
}
