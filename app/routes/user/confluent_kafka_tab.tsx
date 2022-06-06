import { Fragment } from 'react'

export default function ConfluentKafkaTab(props: {
  clientId: string
  clientSecret: string
}) {
  return (
    <Fragment>
      <h3>confluent-kafka</h3>
      <p>
        To install{' '}
        <a
          href="https://pypi.org/project/confluent-kafka/"
          rel="external"
          className="usa-link"
        >
          confluent-kafka
        </a>
        :
      </p>
      <pre>
        <code className="hljs language-sh">
          <span className="hljs-comment">
            # pip install confluent-kafka # once upstream packages are deployed
          </span>
          <br />
          pip install --extra-index-url
          https://asd.gsfc.nasa.gov/Leo.Singer/pypi
          confluent-kafka==1.8.3+bleeding.edge.2
        </code>
      </pre>
      <p>Python sample code:</p>
      <pre>
        <code className="hljs language-python">
          <span className="hljs-keyword">from</span> confluent_kafka{' '}
          <span className="hljs-keyword">import</span> Consumer
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
          config = {'{'}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">'sasl.oauthbearer.client.id'</span>:
          client_id,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">'sasl.oauthbearer.client.secret'</span>:
          client_secret,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">'bootstrap.servers'</span>:{' '}
          <span className="hljs-string">'kafka.gcn.nasa.gov'</span>,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">
            'sasl.oauthbearer.token.endpoint.url'
          </span>
          :{' '}
          <span className="hljs-string">
            'https://auth.gcn.nasa.gov/oauth2/token'
          </span>
          ,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">'sasl.mechanisms'</span>:{' '}
          <span className="hljs-string">'OAUTHBEARER'</span>,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">'sasl.oauthbearer.method'</span>:{' '}
          <span className="hljs-string">'oidc'</span>,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">'security.protocol'</span>:{' '}
          <span className="hljs-string">'sasl_ssl'</span>,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hljs-string">'group.id'</span>:{' '}
          <span className="hljs-built_in">str</span>(uuid4())
          <br />
          {'}'}
          <br />
          <br />
          consumer = Consumer(config)
          <br />
          consumer.subscribe([<span className="hljs-string">'foobar'</span>])
          <br />
          <span className="hljs-keyword">for</span> message{' '}
          <span className="hljs-keyword">in</span> consumer.consume():
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="hljs-built_in">print</span>
          (message.value())
        </code>
      </pre>
    </Fragment>
  )
}
