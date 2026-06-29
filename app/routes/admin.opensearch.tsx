/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { Button, ButtonGroup } from '@trussworks/react-uswds'

import { getUser } from './_auth/user.server'
import { adminGroup } from './admin'
import {
  createIndex,
  createOpenSearchDomain,
  getIndexSchemas,
} from '~/lib/opensearch.server'
import { getFormDataString } from '~/lib/utils'
import type { BreadcrumbHandle } from '~/root/Title'
import type { SEOHandle } from '~/root/seo'

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: 'OpenSearch',
  noIndex: true,
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)
  if (!user?.groups.includes(adminGroup))
    throw new Response(null, { status: 403 })
  const data = await getIndexSchemas() //getOpensearchDomainInfo()
  return {
    data,
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request)
  if (!user?.groups.includes(adminGroup))
    throw new Response(null, { status: 403 })
  const data = await request.formData()
  const intent = getFormDataString(data, 'intent')
  switch (intent) {
    case 'create-domain':
      const result = await createOpenSearchDomain()
      console.log(result)
      break
    case 'create-index':
      await createIndex()
    default:
      break
  }
  return null
}

export default function () {
  const { data } = useLoaderData<typeof loader>()
  return (
    <>
      <h1>OpenSearch</h1>
      <p>WIP Should allow ADMIN users to rebuild the opensearch index</p>
      <pre>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
      <Form method="POST">
        <ButtonGroup>
          <Button type="submit" name="intent" value="create-index">
            Create
          </Button>
          {/* <Button type="submit" name="intent" value="describe" >
            Reject
          </Button> */}
        </ButtonGroup>
      </Form>
    </>
  )
}
