/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import {
  Form,
  Link,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
} from '@remix-run/react'
import type { ModalRef } from '@trussworks/react-uswds'
import {
  Button,
  ButtonGroup,
  Checkbox,
  FormGroup,
  Grid,
  Icon,
  Label,
  Modal,
  ModalFooter,
  ModalHeading,
  ModalToggleButton,
  TextInput,
} from '@trussworks/react-uswds'
import classnames from 'classnames'
import { validate } from 'email-validator'
import { useRef, useState } from 'react'

import { getUser } from './_auth/user.server'
import { Highlight } from '~/components/Highlight'
import { ReCAPTCHA } from '~/components/ReCAPTCHA'
import SegmentedCards from '~/components/SegmentedCards'
import { ToolbarButtonGroup } from '~/components/ToolbarButtonGroup'
// import { createTeamAcls } from '~/lib/kafka.server'
import {
  type Team,
  addUserToTeam,
  createTeam,
  editTeam,
  getTeam,
  getUsersByTeamId,
  removeUserFromTeam, // teamNameAlreadyExists,
  topicExists,
  userIsTeamAdmin,
} from '~/lib/teams.server'
import type { UserMetadata } from '~/lib/user.server'
import { getFormDataString } from '~/lib/utils'
import { useRecaptchaSiteKey } from '~/root'

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request)
  if (!user) throw new Response(null, { status: 403 })

  const data = await request.formData()

  const teamId = getFormDataString(data, 'teamId')
  const teamName = getFormDataString(data, 'teamName')
  const description = getFormDataString(data, 'description') ?? ''
  const intent = getFormDataString(data, 'intent')
  const isPublic = getFormDataString(data, 'isPublic') == 'on'

  if (intent === 'create') {
    const topicName = getFormDataString(data, 'topic')
    if (!topicName || !teamName) return new Response(null, { status: 400 })
    if (await topicExists(topicName)) {
      return {
        topicNameError: 'Topic already exists',
      }
    }
    const team = await createTeam(teamName, description, topicName, isPublic)
    await addUserToTeam(user, team.teamId, 'admin')
    // await createTeamAcls(user, team.teamId)
    return redirect(`/user/teams/edit?teamId=${team.teamId}`)
  }

  if (intent === 'update') {
    if (!teamId || !teamName) throw new Response(null, { status: 403 })
    await editTeam(teamId, teamName, description, isPublic)
  }

  if (intent === 'delete') {
    const sub = getFormDataString(data, 'sub')
    if (!sub) throw new Response(null, { status: 403 })
    if (!teamId) throw new Response(null, { status: 400 })
    await removeUserFromTeam(sub, teamId)
    return null
  }

  if (intent === 'invite') {
    const emails = getFormDataString(data, 'users')
    console.log(emails)
    return null
  }

  return redirect('/user/teams')
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (!user) throw new Response(null, { status: 403 })
  const { teamId } = Object.fromEntries(new URL(request.url).searchParams)
  if (teamId && !userIsTeamAdmin(user.sub, teamId))
    throw new Response(null, { status: 403 })

  let team: Team = {
    teamId: '',
    teamName: '',
    description: '',
    topic: '',
    isPublic: false,
  }
  let members: (UserMetadata & { permission: string })[] = []
  if (teamId !== undefined) {
    team = await getTeam(teamId)
    members = await getUsersByTeamId(teamId)
  }

  return {
    team,
    members,
  }
}

export default function () {
  const { team, members } = useLoaderData<typeof loader>()
  const actionResults = useActionData<typeof action>()
  const [recaptchaValid, setRecaptchaValid] = useState(!useRecaptchaSiteKey())
  const [nameValid, setNameValid] = useState(Boolean(team.teamName))
  const [topicName, setTopicName] = useState(team.topic)
  const [topicValid, setTopicValid] = useState(Boolean(topicName))
  const [usersToInvite, setUsersToInvite] = useState<string[]>([])
  const [emailValid, setEmailValid] = useState(true)
  const ref = useRef<ModalRef>(null)
  const fetcher = useFetcher()

  // Any characters that are NOT alphanumeric, periods, underscores, or hyphens
  const invalidChars = /[^a-zA-Z0-9._-]/g

  const handleTopicInputChange = (value: string) => {
    if (!team.teamId) {
      const newValue = value.toLowerCase().replaceAll(invalidChars, '_')
      setTopicName(newValue)
      setTopicValid(!invalidChars.test(newValue))
    }
  }

  return (
    <>
      <h1>{team.teamId ? 'Edit' : 'New'} Team</h1>
      <Form method="POST">
        {team.teamId && (
          <input type="hidden" name="teamId" value={team.teamId} />
        )}
        <Label htmlFor="name">
          Name
          <span title="required" className="usa-label--required">
            *
          </span>
        </Label>
        <TextInput
          autoFocus
          id="teamName"
          name="teamName"
          type="text"
          defaultValue={team.teamName}
          autoCorrect="off"
          className={classnames(
            'maxw-full',
            !nameValid ? 'usa-input--error' : ''
          )}
          onChange={(e) => {
            setNameValid(Boolean(e.target.value))
            handleTopicInputChange(e.target.value)
          }}
        />
        <div className="text-base margin-bottom-1" id="nameDescription">
          <small>
            Your team name will be parsed to create your topics. Spaces will be
            replaced with underscores.
          </small>
        </div>
        <Label htmlFor="topic">Topic</Label>
        {!team.teamId ? (
          <TextInput
            disabled={Boolean(team.teamId)}
            id="topic"
            name="topic"
            value={topicName}
            className={classnames(!topicValid ? 'usa-input--error' : '')}
            onChange={(event) => handleTopicInputChange(event.target.value)}
            type="text"
          />
        ) : (
          <Highlight code={`gcn.notices.${topicName}`} language="txt" />
        )}

        {actionResults?.topicNameError && (
          <span className="text-red">{actionResults.topicNameError}</span>
        )}

        <div className="text-base margin-bottom-1" id="nameDescription">
          <small>
            By default, your topic is parsed from your team name and prefixed
            with `gcn.notices.`. Spaces will be replaced with underscores. You
            may alter this to be a shorthand that is more convenient. Once set,
            this value can NOT be changed. follow the If this topic conflicts
            with existing topics, you may edit it.
          </small>
        </div>
        <Checkbox
          id="isPublic"
          name="isPublic"
          label="Make topics publicly available to all users"
        />
        <div className="text-base margin-bottom-1" id="nameDescription">
          <small>
            If checked, all users will be able to consume your topics.
          </small>
        </div>
        <Label htmlFor="description">Description</Label>
        <TextInput
          id="description"
          name="description"
          type="text"
          defaultValue={team.description}
          autoCorrect="off"
        />
        {!team.teamId && (
          <ReCAPTCHA
            onChange={(value) => {
              setRecaptchaValid(Boolean(value))
            }}
          />
        )}
        <FormGroup>
          <ButtonGroup>
            <Link
              to=".."
              type="button"
              className="usa-button usa-button--outline"
            >
              Cancel
            </Link>
            <Button
              name="intent"
              value={team.teamId ? 'update' : 'create'}
              disabled={!(nameValid && recaptchaValid)}
              type="submit"
            >
              Submit
            </Button>
          </ButtonGroup>
        </FormGroup>
      </Form>
      {team.teamId && (
        <Grid row>
          <Grid tablet={{ col: 'fill' }}>
            <h3>Members</h3>
          </Grid>
          <Grid tablet={{ col: 'auto' }}>
            <ModalToggleButton
              opener
              disabled={!team.teamId}
              modalRef={ref}
              type="button"
              className="usa-button"
            >
              <Icon.Add role="presentation" className="margin-y-neg-2px" />
              Add
            </ModalToggleButton>
          </Grid>
        </Grid>
      )}
      <SegmentedCards>
        {members.map((user) => (
          <UserPermissionCard
            key={user.sub}
            name={user.username ?? ''}
            sub={user.sub}
            affiliation={user.affiliation ?? ''}
            permission={user.permission}
          />
        ))}
      </SegmentedCards>
      <Modal
        ref={ref}
        id="modal-add"
        aria-labelledby="modal-add-heading"
        aria-describedby="modal-add-description"
        renderToPortal={false} // FIXME: https://github.com/trussworks/react-uswds/pull/1890#issuecomment-1023730448
      >
        <ModalHeading id="modal-add-heading">Add Users to Team</ModalHeading>
        <TextInput
          type="email"
          id="new-user"
          name="new-user"
          className={classnames('maxw-full', {
            'usa-input--error': !emailValid,
            '': emailValid,
          })}
          onKeyDown={(event) => {
            const valid = validate(event.currentTarget.value)
            setEmailValid(valid)
            if (
              event.key === 'Enter' &&
              !usersToInvite.includes(event.currentTarget.value) &&
              valid
            ) {
              setUsersToInvite([...usersToInvite, event.currentTarget.value])
              event.currentTarget.value = ''
            }
          }}
        />
        <fetcher.Form method="POST">
          <input type="hidden" name="intent" value="invite" />
          <input type="hidden" name="users" value={usersToInvite} />
          <p id="modal-add-description">
            Enter the email addresses of users you want to invite to your team
          </p>
          {usersToInvite.map((addr) => (
            <div key={addr}>
              <Grid>
                <Grid row>
                  <div className="tablet:grid-col flex-fill">{addr}</div>
                  <div className="tablet:grid-col flex-auto margin-y-auto">
                    <Button
                      type="button"
                      secondary
                      outline
                      onClick={() =>
                        setUsersToInvite(
                          usersToInvite.filter((x) => x !== addr)
                        )
                      }
                    >
                      <Icon.Delete />
                    </Button>
                  </div>
                </Grid>
              </Grid>
            </div>
          ))}
          <ModalFooter>
            <ModalToggleButton modalRef={ref} closer outline>
              Cancel
            </ModalToggleButton>
            <Button
              data-close-modal
              type="submit"
              disabled={usersToInvite.length == 0}
            >
              Send
            </Button>
          </ModalFooter>
        </fetcher.Form>
      </Modal>
    </>
  )
}

export function UserPermissionCard({
  name,
  sub,
  affiliation,
  permission,
}: {
  name: string
  sub: string
  affiliation: string
  permission: string
}) {
  const ref = useRef<ModalRef>(null)
  const permissionRef = useRef<ModalRef>(null)
  const fetcher = useFetcher()
  const disabled = fetcher.state !== 'idle'

  return (
    <>
      <Grid row style={disabled ? { opacity: '50%' } : undefined}>
        <div className="tablet:grid-col flex-fill">
          <div>
            <strong>{name}</strong>
          </div>
          <div>Affiliation: {affiliation}</div>
          <div>
            Team Permission: {permission}{' '}
            <ModalToggleButton
              opener
              disabled={disabled}
              modalRef={permissionRef}
              type="button"
              unstyled
            >
              update
            </ModalToggleButton>
          </div>
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
          <input type="hidden" name="sub" value={sub} />
          <ModalHeading id="modal-delete-heading">Remove User</ModalHeading>
          <p id="modal-delete-description">
            Are you sure that you want to remove {name} from this team?
          </p>
          <ModalFooter>
            <ModalToggleButton modalRef={ref} closer outline>
              Cancel
            </ModalToggleButton>
            <Button data-close-modal type="submit">
              Remove
            </Button>
          </ModalFooter>
        </fetcher.Form>
      </Modal>
      <Modal
        id="modal-permissions"
        ref={permissionRef}
        aria-labelledby="modal-permissions-heading"
        aria-describedby="modal-permissions-description"
        renderToPortal={false} // FIXME: https://github.com/trussworks/react-uswds/pull/1890#issuecomment-1023730448
      >
        <fetcher.Form method="POST">
          <input type="hidden" name="intent" value="permissions" />
          <input type="hidden" name="sub" value={sub} />
          <ModalHeading id="modal-permissions-heading">
            Update User's Permissions
          </ModalHeading>
          <p id="modal-permissions-description">
            Are you sure that you want to remove {name} from this team?
          </p>
          <ModalFooter>
            <ModalToggleButton modalRef={ref} closer outline>
              Cancel
            </ModalToggleButton>
            <Button data-close-modal type="submit">
              Update
            </Button>
          </ModalFooter>
        </fetcher.Form>
      </Modal>
    </>
  )
}
