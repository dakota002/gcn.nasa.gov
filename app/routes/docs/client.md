---
meta:
  title: GCN - Client Configuration
---

import ADCSample from '~/routes/docs/adc-sample.mdx'
import ConfluentKafkaSample from '~/routes/docs/confluent-kafka-sample.mdx'

# Client Configuration

Note that these instructions will get a bit simpler once changes are in upstream packages and deployed.

## hop-client

To install [hop-client](https://pypi.org/project/hop-client/):

```sh
# pip install hop-client  # once upstream packages are deployed
pip install --extra-index-url https://asd.gsfc.nasa.gov/Leo.Singer/pypi hop-client==0.5.1.dev38+g8eeac6f adc_streaming==2.0.1.dev2+ga84d01f confluent-kafka==1.8.3+bleeding.edge.2
```

```sh
$ hop auth add
Username: ...
Password: ...
Hostname (may be empty): kafka.gcn.nasa.gov
Token endpoint (empty if not applicable): https://auth.gcn.nasa.gov/oauth2/token
$ hop subscribe kafka://kafka.gcn.nasa.gov/foobar
```

<ADCSample/>

<ConfluentKafkaSample/>
