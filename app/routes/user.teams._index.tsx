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
import { ToolbarButtonGroup } from '~/components/ToolbarButtonGroup'
import type { Team } from '~/lib/teams.server'
import { getUsersTeams } from '~/lib/teams.server'
import type { SEOHandle } from '~/root/seo'

export const handle: SEOHandle = { noIndex: true }

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (!user) throw new Response(null, { status: 403 })
  const teams = await getUsersTeams(user.sub)

  return { teams }
}

export default function () {
  const { teams } = useLoaderData<typeof loader>()
  return (
    <>
      <h1>Teams</h1>
      <p>Manage your team memberships. Add detail here</p>
      {JSON.stringify(teams)}
      <SegmentedCards>
        {teams.map((team) => (
          <TeamCard key={team.teamId} team={team} />
        ))}
      </SegmentedCards>
    </>
  )
}

function TeamCard({ team }: { team: Team }) {
  return (
    <>
      <Grid row>
        <div className="tablet:grid-col flex-fill">
          <div>
            <small>
              <strong>{team.teamName}</strong>{' '}
            </small>
          </div>
          <div>
            <small>Description: {team.description}</small>
          </div>
        </div>
        <div className="tablet:grid-col flex-auto margin-y-auto">
          <ToolbarButtonGroup>
            <Link
              to={team.teamId}
              type="button"
              className="usa-button usa-button--outline"
            >
              View
            </Link>
          </ToolbarButtonGroup>
        </div>
      </Grid>
    </>
  )
}
