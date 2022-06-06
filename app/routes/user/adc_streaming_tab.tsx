import { Fragment } from 'react'

export default function AdcStreamingTab(props: {
  clientId: string
  clientSecret: string
}) {
  return (
    <Fragment>
      <h3>adc-streaming</h3>
      <p>
        To install{' '}
        <a
          href="https://pypi.org/project/adc-streaming/"
          rel="external"
          className="usa-link"
        >
          adc-streaming
        </a>
        :
      </p>
      <pre>
        <code className="hljs language-sh">
          <span className="hljs-comment">
            # pip install adc-streaming # once upstream packages are deployed
          </span>
          <br />
          pip install --extra-index-url
          https://asd.gsfc.nasa.gov/Leo.Singer/pypi
          adc_streaming==2.0.1.dev2+ga84d01f
          confluent-kafka==1.8.3+bleeding.edge.2
        </code>
      </pre>
      <p>Python sample code:</p>
      <pre>
        <code className="hljs language-Python tab-4">
          <span className="hljs-keyword">from</span> adc.consumer{' '}
          <span className="hljs-keyword">import</span> Consumer, ConsumerConfig,
          SASLAuth
          <br />
          <span className="hljs-keyword">from</span> uuid{' '}
          <span className="hljs-keyword">import</span> uuid4
          <br />
          <br />
          <span className="hljs-comment">
            # Fill in client credentials here
          </span>
          <br />
          client_id ={' '}
          <span className="hljs-string">
            {props.clientId ? "'" + props.clientId + "'" : '...'}
          </span>
          <br />
          client_secret ={' '}
          <span className="hljs-string">
            {props.clientSecret ? "'" + props.clientSecret + "'" : '...'}
          </span>
          <br />
          <br />
          auth = SASLAuth(
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;client_id, client_secret,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;token_endpoint=
          <span className="hljs-string">
            'https://auth.gcn.nasa.gov/oauth2/token'
          </span>
          )
          <br />
          <br />
          config = ConsumerConfig(
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;broker_urls=[
          <span className="hljs-string">'kafka.gcn.nasa.gov'</span>],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;group_id=
          <span className="hljs-built_in">str</span>(uuid4()), auth=auth)
          <br />
          <br />
          consumer = Consumer(config)
          <br />
          consumer.subscribe(<span className="hljs-string">'foobar'</span>)
          <br />
          <span className="hljs-keyword">for</span> message{' '}
          <span className="hljs-keyword">in</span> consumer.stream():
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="hljs-built_in">print</span>
          (message.value())
        </code>
      </pre>
    </Fragment>
  )
}
