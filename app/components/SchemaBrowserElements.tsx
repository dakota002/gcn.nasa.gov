import { Link } from '@remix-run/react'

export type ReferencedSchema = {
  $ref: string
}

export type SchemaProperty = {
  description: string
  type?: string
  enum?: string[]
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

export function ReferencedElementRow({ item }: { item: ReferencedSchema }) {
  const locallyDefined = item.$ref.startsWith('#')
  return (
    <tr>
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
          <td>See referenced schema element</td>
        </>
      )}
    </tr>
  )
}

function formatLinkString(schemaLinkString: string) {
  return schemaLinkString.replace('schema', 'schema-browser')
}
