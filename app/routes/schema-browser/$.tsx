import type { DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Table } from '@trussworks/react-uswds'

import { Highlight } from '~/components/Highlight'
import type {
  ReferencedSchema,
  Schema,
} from '~/components/SchemaBrowserElements'
import { ReferencedElementRow } from '~/components/SchemaBrowserElements'

export async function loader({ params: { '*': path } }: DataFunctionArgs) {
  if (!path) throw new Response('schemaName must be defined', { status: 400 })
  let result: Schema
  if (!path.includes('.schema.json')) {
    result = { title: path, description: path, type: 'dir' }
    return {
      path,
      result,
      isTree: true,
      exampleJSON: null,
    }
  }
  result = await getJSONFromGithub(path)
  const examplePath = path.replace('.schema.', '.example.')
  let exampleJSON
  try {
    exampleJSON = await getJSONFromGithub(examplePath)
  } catch (error) {
    console.log(`No example for ${path}`)
  }

  return { path, result, isTree: false, exampleJSON }
}

export default function () {
  const { path, result, isTree, exampleJSON } = useLoaderData<typeof loader>()
  return isTree ? (
    <>Placeholder</>
  ) : (
    <>
      <h1>{result.title ?? path}</h1>
      <p>{result.description}</p>
      <h2>Properties</h2>
      <p>
        <small>* = required</small>
      </p>
      {result.properties && (
        <Table bordered={false} stackedStyle="default">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(result.properties).map((itemKey) => (
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
            ))}
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
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {result.allOf.map((item: ReferencedSchema) => (
                <ReferencedElementRow item={item} key={item.$ref} />
              ))}
            </tbody>
          </Table>
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
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {result.anyOf.map((item: ReferencedSchema) => (
                <ReferencedElementRow item={item} key={item.$ref} />
              ))}
            </tbody>
          </Table>
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
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {result.oneOf.map((item: ReferencedSchema) => (
                <ReferencedElementRow item={item} key={item.$ref} />
              ))}
            </tbody>
          </Table>
        </>
      )}

      {result.$defs && (
        <>
          <h3>Locally defined sub-schemas</h3>
          <Table>
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

function formatFieldType(item: any): string {
  if (item['type']) return item['type']
  if (item['enum']) return 'enum'
  return ''
}

async function getJSONFromGithub(path: string) {
  return await (
    await fetch(
      `https://raw.githubusercontent.com/nasa-gcn/gcn-schema/main/${path}`
    )
  ).json()
}
