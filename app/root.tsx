/*!
 * Copyright © 2022 United States Government as represented by the Administrator
 * of the National Aeronautics and Space Administration. No copyright is claimed
 * in the United States under Title 17, U.S. Code. All Other Rights Reserved.
 *
 * SPDX-License-Identifier: NASA-1.3
 *
 *
 *                                +-------------+
 *                                | TACH! TACH! |
 *                                +-------------+
 *                         \\    /
 *                 \\      (o>  /
 *                 (o>     //\
 *             ____(()_____V_/_____
 *                 ||      ||
 *                         ||
 *
 *
 */

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useTransition,
} from '@remix-run/react'
import type {
  MetaFunction,
  LinksFunction,
  DataFunctionArgs,
} from '@remix-run/node'
import { GovBanner, GridContainer } from '@trussworks/react-uswds'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import highlightStyle from 'highlight.js/styles/github.css'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DevBanner } from './components/DevBanner'
import { useSpinDelay } from 'spin-delay'
import { getUser } from './routes/__auth/user.server'

TopBarProgress.config({
  barColors: {
    '0': '#e52207',
    '0.5': '#ffffff',
    '1.0': '#0050d8',
  },
})

export const meta: MetaFunction = () => {
  return { title: 'GCN - General Coordinates Network' }
}

export const links: LinksFunction = () => [
  {
    rel: 'stylesheet',
    href: '/_static/theme/css/custom.css',
  },
  {
    rel: 'stylesheet',
    href: highlightStyle,
  },
  ...[16, 40, 57, 72, 114, 144, 192].map((size) => ({
    rel: 'icon',
    href: `/_static/theme/img/favicons/favicon-${size}.png`,
    sizes: `${size}x${size}`,
  })),
]

export async function loader({ request }: DataFunctionArgs) {
  const url = new URL(request.url)
  const hostname = url.hostname

  const user = await getUser(request)
  const email = user?.email

  return { hostname, email }
}

export default function App() {
  const { pathname } = useLocation()
  const { hostname, email } =
    useLoaderData<Awaited<ReturnType<typeof loader>>>()
  const transition = useTransition()
  const showProgress = useSpinDelay(transition.state !== 'idle')

  return (
    <html lang="en-US">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <a className="usa-skipnav" href="#main-content">
          Skip to main content
        </a>
        {showProgress && <TopBarProgress />}
        <GovBanner />
        <DevBanner hostname={hostname} />
        <Header pathname={pathname} email={email} />
        <section className="usa-section main-content">
          <GridContainer>
            <Outlet />
          </GridContainer>
        </section>
        <Footer />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
