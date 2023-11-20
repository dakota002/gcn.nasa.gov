import type { DataFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'
import { Button, Card, CardGroup, TextInput } from '@trussworks/react-uswds'

import { search } from '~/lib/schema-data.server'

// import { getFormDataString } from '~/lib/utils'

export async function loader({ request: { url } }: DataFunctionArgs) {
  const { searchParams } = new URL(url)
  const searchString = searchParams.get('search') || undefined
  let result
  if (searchString) result = await search(searchString)
  return json(result)
}

export default function SchemaBrowserSearch() {
  const fetcher = useFetcher<typeof loader>()

  return (
    <>
      <fetcher.Form
        className="usa-search padding-bottom-2"
        role="search"
        action="/docs/schema/search"
      >
        <TextInput
          className="usa-input"
          id="search-field"
          type="search"
          name="search"
        />
        <Button className="usa-button" type="submit">
          <span className="usa-search__submit-text">Search</span>
        </Button>
      </fetcher.Form>
      {fetcher.data && (
        <CardGroup>
          {fetcher.data.map((item) => (
            <Card key={item.score}>This is a test {JSON.stringify(item)}</Card>
          ))}
        </CardGroup>
      )}
    </>
  )
}
