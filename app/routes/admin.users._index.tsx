/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { Button, Label } from '@trussworks/react-uswds'
import { useState } from 'react'

import { getUser } from './_auth/user.server'
import { adminGroup } from './admin'
import { UserLookupComboBox } from '~/components/UserLookup'
import { extractAttribute, getSingleUserFromEmail } from '~/lib/cognito.server'
import { getFormDataString } from '~/lib/utils'
import type { BreadcrumbHandle } from '~/root/Title'
import type { SEOHandle } from '~/root/seo'

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: 'Users',
  noIndex: true,
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (!user?.groups.includes(adminGroup))
    throw new Response(null, { status: 403 })
  return null
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request)
  if (!user?.groups.includes(adminGroup))
    throw new Response(null, { status: 403 })
  const data = await request.formData()
  const userEmail = getFormDataString(data, 'userEmail')
  if (!userEmail) throw new Response('Missing user email', { status: 400 })
  const userToUpdate = await getSingleUserFromEmail(userEmail)

  return redirect(
    `/admin/users/${extractAttribute(userToUpdate.Attributes, 'sub')}`
  )
}

export default function () {
  const [userEmail, setUserEmail] = useState('')
  return (
    <>
      <h1>Users</h1>
      <p>Manage users and their group associations</p>
      <Form method="POST">
        <Label htmlFor="emailFilter">Filter</Label>
        <input type="hidden" name="userEmail" value={userEmail} />
        <UserLookupComboBox
          onSelectedItemChange={({ selectedItem }) =>
            setUserEmail(selectedItem?.email ?? '')
          }
        />
        <Button type="submit" className="margin-y-1" disabled={!userEmail}>
          Edit
        </Button>
      </Form>
    </>
  )
}
