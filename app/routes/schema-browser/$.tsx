/*!
 * Copyright © 2022 United States Government as represented by the Administrator
 * of the National Aeronautics and Space Administration. No copyright is claimed
 * in the United States under Title 17, U.S. Code. All Other Rights Reserved.
 *
 * SPDX-License-Identifier: NASA-1.3
 */
import type { DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Table } from '@trussworks/react-uswds'

import { loadJson } from '../../lib/schema-data'
import { Highlight } from '~/components/Highlight'
import type { Schema, SchemaProperty } from '~/components/SchemaBrowserElements'
import { SchemaPropertiesTableBody } from '~/components/SchemaBrowserElements'
import { ReferencedElementTable } from '~/components/SchemaBrowserElements'

export async function loader({ params: { '*': path } }: DataFunctionArgs) {
  if (!path) throw new Response('schemaName must be defined', { status: 400 })
  let result: Schema
  if (!path.includes('.schema.json'))
    throw new Response('Only schema paths allowed', { status: 400 })
  result = await loadJson(path)
  const examplePath = path.replace('.schema.', '.example.')
  let exampleJSON
  try {
    exampleJSON = await loadJson(examplePath)
  } catch (error) {
    console.log(`No example for ${path}`)
  }

  return { path, result, isTree: false, exampleJSON }
}

export default function () {
  const { path, result, exampleJSON } = useLoaderData<typeof loader>()
  return (
    <>
      <h1>{result.title ?? path}</h1>
      <p>{result.description}</p>
      <h2>Properties</h2>
      <p>
        <small>* = required</small>
      </p>
      {result.properties && (
        <Table stackedStyle="default">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <SchemaPropertiesTableBody schema={result} />
            {/* {Object.keys(result.properties).map((itemKey) => (
              <tr key={itemKey}>
                <th scope="row">{formatFieldName(itemKey, result.required)}</th>
                <td>
                  {result.properties &&
                    formatFieldType(result.properties[itemKey])}
                </td>
                <td>
                  {(result.properties &&
                    result.properties[itemKey].description) ??
                    ''}
                  {result.properties && result.properties[itemKey].enum && (
                    <>
                      <br />
                      Options: {result.properties[itemKey].enum?.join(', ')}
                    </>
                  )}
                </td>
              </tr>
            ))} */}
          </tbody>
        </Table>
      )}

      {result.allOf && (
        <>
          <h3>Properties from all of the following:</h3>
          <p>
            These properties are inherited using the <code>allOf</code> syntax.
            See{' '}
            <Link
              rel="external"
              to="https://json-schema.org/understanding-json-schema/reference/combining.html#allof"
            >
              allOf
            </Link>{' '}
            for more information.
          </p>
          <ReferencedElementTable items={result.allOf} />
        </>
      )}

      {result.anyOf && (
        <>
          <h3>Properties from any of the following:</h3>
          <p>
            These properties are inherited using the <code>anyOf</code> syntax.
            See{' '}
            <Link
              rel="external"
              to="https://json-schema.org/understanding-json-schema/reference/combining.html#anyof"
            >
              anyOf
            </Link>{' '}
            for more information.
          </p>
          <ReferencedElementTable items={result.anyOf} />
        </>
      )}

      {result.oneOf && (
        <>
          <h3>Properties from one of the following:</h3>
          <p>
            These properties are inherited using the <code>oneOf</code> syntax.
            See{' '}
            <Link
              rel="external"
              to="https://json-schema.org/understanding-json-schema/reference/combining.html#oneof"
            >
              allOf
            </Link>{' '}
            for more information.
          </p>
          <ReferencedElementTable items={result.oneOf} />
        </>
      )}

      {result.$defs && (
        <>
          <h3>Locally defined sub-schemas</h3>
          <Table fullWidth>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(result.$defs).map((itemKey) => (
                <tr key={itemKey}>
                  <th scope="row">
                    {formatFieldName(itemKey, result.required)}
                  </th>
                  <td>
                    {result.$defs && formatFieldType(result.$defs[itemKey])}
                  </td>
                  <td>
                    {(result.$defs && result.$defs[itemKey].description) ?? ''}
                    {result.$defs && result.$defs[itemKey].enum && (
                      <>
                        <br />
                        Options: {result.$defs[itemKey].enum?.join(', ')}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {exampleJSON && (
        <>
          <h2>Example</h2>
          <Highlight
            language="json"
            code={JSON.stringify(exampleJSON, null, 2)}
          />
        </>
      )}
      <div>
        View the source on{' '}
        <Link
          rel="external"
          to={`https://github.com/nasa-gcn/gcn-schema/blob/main/${path}`}
        >
          Github
        </Link>
      </div>
    </>
  )
}

function formatFieldName(name: string, requiredProps?: string[]) {
  let formattedName = name
  if (requiredProps && requiredProps.includes(name)) formattedName += '*'
  return formattedName
}

function formatFieldType(item: SchemaProperty): string {
  if (item.type) return item.type
  if (item.enum) return 'enum'
  if (item.$ref) return item.$ref.split('/').slice(-1)[0]
  return ''
}
