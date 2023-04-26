import { NavLink, Outlet, useLoaderData } from '@remix-run/react'
import { Icon } from '@trussworks/react-uswds'
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
  path: string //'notices'
  mode?: string // '040000'
  type: string //'tree' | 'blob' // 'tree'
  sha: string // '27892ea22271447154d351967576be8502d80691'
  url: string // 'https://api.github.com/repos/nasa-gcn/gcn-schema/git/trees/27892ea22271447154d351967576be8502d80691'
  tree?: TreeItem[]
  name?: string
}

// Schema treeItem
type SchemaTreeItem = {
  name: string
  path: string
  children: SchemaTreeItem[]
}

// A valid url with one of the following hashes:
// Tree hashes:
// gcn:         71c01cb0e448ca44730b3ada34a50615cf46c6bb
// gcn/notices: 27892ea22271447154d351967576be8502d80691
//    - core:   34f958f1988d4d547bc1f05ed7d74cc76436b603
// etc...
// like: https://api.github.com/repos/nasa-gcn/gcn-schema/git/trees/27892ea22271447154d351967576be8502d80691
// as first URL and it will build the whole thing
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
        item.tree = results // await (await fetch(item.url)).json()
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

  // if no cached tree (using localDevDataTree for test),
  const dataTree = await treeLoader(
    'https://api.github.com/repos/nasa-gcn/gcn-schema/git/trees/06e3fe86a8e583af86d2fbba03edb833765c3cb8'
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
    <div className="grid-row grid-gap">
      <div className="desktop:grid-col-3">
        <SideNav items={items} />
      </div>
      <div className="desktop:grid-col-9">
        <Outlet />
      </div>
    </div>
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
