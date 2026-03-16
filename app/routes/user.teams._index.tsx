/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import type { LoaderFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import type { ModalRef } from '@trussworks/react-uswds'
import {
  Button,
  Grid,
  Icon,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalToggleButton,
} from '@trussworks/react-uswds'
import { useRef } from 'react'

import { getUser } from './_auth/user.server'
import HeadingWithAddButton from '~/components/HeadingWithAddButton'
import SegmentedCards from '~/components/SegmentedCards'
import { ToolbarButtonGroup } from '~/components/ToolbarButtonGroup'
import { getTeamsByUserId } from '~/lib/teams.server'
import type { SEOHandle } from '~/root/seo'

export const handle: SEOHandle = { noIndex: true }

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (!user) throw new Response(null, { status: 403 })

  const teams = await getTeamsByUserId(user.sub)
  return {
    teams,
  }
}

export default function () {
  const { teams } = useLoaderData<typeof loader>()

  return (
    <>
      <HeadingWithAddButton headingLevel={1}>Teams</HeadingWithAddButton>
      <p>
        Manage your created GCN Kafka Teams and your membership to Teams created
        by other users here. Team membership grants you access to Kafka Topics
        based on your access level.
      </p>
      {teams.length > 0 && (
        <SegmentedCards>
          {teams.map((team) => (
            <TeamCard
              key={team.teamId}
              teamId={team.teamId}
              teamName={team.teamName}
              description={team.description}
            />
          ))}
        </SegmentedCards>
      )}
    </>
  )
}

function TeamCard({
  teamName,
  teamId,
  description,
}: {
  teamName: string
  teamId: string
  description?: string
}) {
  const ref = useRef<ModalRef>(null)
  const fetcher = useFetcher()
  const disabled = fetcher.state !== 'idle'

  return (
    <>
      <Grid row style={disabled ? { opacity: '50%' } : undefined}>
        <div className="tablet:grid-col flex-fill">
          <div>
            <strong>{teamName}</strong>
          </div>
          <div>{description}</div>
        </div>
        <div className="tablet:grid-col flex-auto margin-y-auto">
          <ToolbarButtonGroup>
            <ModalToggleButton
              opener
              disabled={disabled}
              modalRef={ref}
              type="button"
              className="usa-button--secondary"
            >
              <Icon.Delete role="presentation" className="margin-y-neg-2px" />
              Delete
            </ModalToggleButton>
            <Link to={`edit?teamId=${teamId}`} className="usa-button">
              Edit
              <Icon.Edit role="presentation" className="margin-y-neg-2px" />
            </Link>
          </ToolbarButtonGroup>
        </div>
      </Grid>
      <Modal
        id="modal-delete"
        ref={ref}
        aria-labelledby="modal-delete-heading"
        aria-describedby="modal-delete-description"
        renderToPortal={false} // FIXME: https://github.com/trussworks/react-uswds/pull/1890#issuecomment-1023730448
      >
        <fetcher.Form method="POST">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="teamId" value={teamId} />
          <ModalHeading id="modal-delete-heading">Remove User</ModalHeading>
          <p id="modal-delete-description">
            Are you sure that you want to delete this team?
          </p>
          <ModalFooter>
            <ModalToggleButton modalRef={ref} closer outline>
              Cancel
            </ModalToggleButton>
            <Button data-close-modal type="submit">
              Delete
            </Button>
          </ModalFooter>
        </fetcher.Form>
      </Modal>
    </>
  )
}
