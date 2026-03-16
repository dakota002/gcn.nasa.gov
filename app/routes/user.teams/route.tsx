/*!
 * Copyright © 2023 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { feature } from '~/lib/env.server'
import type { BreadcrumbHandle } from '~/root/Title'
import type { SEOHandle } from '~/root/seo'

export { Outlet as default } from '@remix-run/react'

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: 'Teams',
  noIndex: true,
}

export async function loader() {
  if (!feature('TEAMS')) throw new Response(null, { status: 404 })
  return null
}
