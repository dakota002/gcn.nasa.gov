import { Link } from '@remix-run/react'
import { Table } from '@trussworks/react-uswds'
import { useState } from 'react'

export type ReferencedSchema = {
  $ref: string
  type: string
}

export type SchemaProperty = {
  description: string
  type?: string
  enum?: string[]
  $ref?: string
}

export type Schema = {
  $id?: string
  $schema?: string
  type: string
  title?: string
  description?: string
  properties?: { [key: string]: SchemaProperty }
  $defs?: { [key: string]: SchemaProperty }
  anyOf?: ReferencedSchema[]
  allOf?: ReferencedSchema[]
  oneOf?: ReferencedSchema[]
  required?: string[]
}

function ReferencedElementRow({ item }: { item: ReferencedSchema }) {
  const [showHiddenRow, toggleHiddenRow] = useState(true)
  const locallyDefined = item.$ref?.startsWith('#')

  return (
    <>
      <tr onClick={() => toggleHiddenRow(!showHiddenRow)}>
        {locallyDefined ? (
          <>
            <td>{item.$ref && item.$ref.split('/').slice(-1)[0]}</td>
            <td>See below</td>
          </>
        ) : (
          <>
            <td>
              <Link to={formatLinkString(item.$ref ?? '')}>
                {item.$ref && item.$ref.split('/').slice(-1)[0]}
              </Link>
            </td>
            <td>
              {item.$ref && item.$ref.split('/').slice(-2)[0]} schema object{' '}
              <small>(click to expand)</small>
            </td>
          </>
        )}
      </tr>
      {!locallyDefined && (
        <tr hidden={showHiddenRow}>
          <td>Put the content of the schema here</td>
          <td></td>
        </tr>
      )}
    </>
  )
}

export function ReferencedElementTable({
  items,
}: {
  items: ReferencedSchema[]
}) {
  return (
    <Table fullWidth>
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <ReferencedElementRow item={item} key={item.$ref} />
        ))}
      </tbody>
    </Table>
  )
}

function formatLinkString(schemaLinkString: string) {
  return schemaLinkString.replace('schema', 'schema-browser')
}
