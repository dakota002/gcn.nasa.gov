import { NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { GridContainer, Icon } from '@trussworks/react-uswds'
import { useState } from 'react'
import { json } from 'react-router'

import { SideNav, SideNavSub } from '~/components/SideNav'
import { feature, getEnvOrDieInProduction, getOrigin } from '~/lib/env.server'
import {
  getCanonicalUrlHeaders,
  publicStaticCacheControlHeaders,
} from '~/lib/headers.server'

// Github treeitem
type TreeItem = {
  path: string
  mode?: string
  type: string
  sha: string
  url: string
  tree?: TreeItem[]
  name?: string
}

// Schema treeItem
type SchemaTreeItem = {
  name: string
  path: string
  children: SchemaTreeItem[]
}

async function treeLoader(url: string, schemaPath?: string) {
  const GITHUB_API_TOKEN = getEnvOrDieInProduction('GITHUB_API_ACCESS')
  let schemaTree: TreeItem = await (
    await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_API_TOKEN}`,
      },
    })
  ).json()

  if (schemaTree.tree) {
    for (const item of schemaTree.tree) {
      const pathNodeName = [schemaPath ?? 'gcn', item.path].join('/')
      if (item.type == 'tree') {
        const results = await treeLoader(item.url, pathNodeName)
        item.tree = results
      } else {
        item.name = pathNodeName
      }
    }
  }
  return schemaTree.tree ?? []
}

function buildSchemaTreeItem(
  item: TreeItem,
  parentPath: string
): SchemaTreeItem {
  const path = parentPath ? `${parentPath}/${item.path}` : item.path
  const name = item.path ?? path
  const children = item.tree
    ? item.tree.map((child) => buildSchemaTreeItem(child, path))
    : []

  return {
    name,
    path,
    children,
  }
}

export async function loader() {
  if (!feature('SCHEMA')) throw new Response(null, { status: 404 })

  const dataTree = await treeLoader(
    'https://api.github.com/repos/nasa-gcn/gcn-schema/git/trees/9b2052c1b784cb11fa1e6b32ff337023d5712512'
  )

  const schemaData: SchemaTreeItem[] = dataTree // localDevDataTree
    .filter((item) => item.type === 'tree')
    .map((item): SchemaTreeItem => buildSchemaTreeItem(item, 'gcn'))

  return json(schemaData, {
    headers: {
      ...publicStaticCacheControlHeaders,
      ...getCanonicalUrlHeaders(new URL(`/schema-browser/`, getOrigin())),
    },
  })
}

export default function Schema() {
  const schemaData = useLoaderData<typeof loader>()
  const items: React.ReactNode[] = (schemaData as SchemaTreeItem[])
    .filter((x) => !x.name.includes('.example.json'))
    .map(RenderSchemaTreeItem)

  return (
    <GridContainer className="usa-section">
      <div className="grid-row grid-gap">
        <div className="desktop:grid-col-3">
          <SideNav items={items} />
        </div>
        <div className="desktop:grid-col-9">
          <Outlet />
        </div>
      </div>
    </GridContainer>
  )
}

function filterOutExampleChildren(childrenArray: SchemaTreeItem[]) {
  return childrenArray.filter(
    (childItem) => !childItem.name.includes('.example.json')
  )
}

function renderNavLink(
  item: SchemaTreeItem,
  onClick?: () => void
): React.ReactNode {
  return (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <span className="display-flex flex-align-center">
        {item.children.length > 0 && (
          <span className="margin-top-05 padding-right-05">
            <Icon.FolderOpen />
          </span>
        )}
        <span>{item.name}</span>
        <small className="margin-left-auto">
          {filterOutExampleChildren(item.children).length > 0
            ? filterOutExampleChildren(item.children).length
            : ''}
        </small>
      </span>
    </NavLink>
  )
}

function RenderSchemaTreeItem(item: SchemaTreeItem) {
  const [showChildren, toggleShowChildren] = useState(false)

  if (item.children.length === 0) {
    return renderNavLink(item)
  }

  const filteredChildren = item.children.filter(
    (childItem) => !childItem.name.includes('.example.json')
  )

  const childNodes = filteredChildren.map((childItem) =>
    RenderSchemaTreeItem(childItem)
  )

  return (
    <>
      {renderNavLink(item, () => {
        toggleShowChildren(!showChildren)
      })}
      <SideNavSub
        base={item.path}
        items={childNodes}
        isVisible={showChildren}
      />
    </>
  )
}
