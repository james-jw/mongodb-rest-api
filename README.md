<div class="container">
    <h1>mongodb-rest-api v1</h1>

    Documentation on a proposed Mongodb compliant REST API for use with generic collections.<p>
    
    The api leverages a REST style with query/grouping operations being describable via URLs. Below is a proposed URL mapping to support querying a set of mongodb collections. <p />

    Endpoint: <code>{service-path}/rest/v1/{collection-name}?{query-parameters}</code><br />
    
    For example: <code>http://localhost:8080/rest/v1/events?eventName=Design_Closed</code></p><br />
    
    All Requests described here should be performed with the standard HTTP verb: <code>GET</code>.
    
    <h2>Hydra: Hypermedia-Driven API Protocol</h2>
    This api is designed to be in full compliance with the <a href="http://www.w3.org/ns/hydra/">Hydra Hypermedia Driven API</a> specification. This specification defines a client agnostic way to discover Entry and Action points within the api dynamically allowing for rapid API evolution and development.
    
    <h2>Discovery</h2>
    The mechanis for API entry point discovery is also handled by the Hydra Specification. 
    See <a href="http://www.w3.org/ns/hydra/">Hydra Hypermedia Driven API</a> for more details.
    
    Here is an example of a simple EntryPoint ld+json response:
    <pre><code>{
    "@context": {
        "hydra": "http://www.w3.org/ns/hydra/core#",
        "vocab": "../rest/v1/vocab#",
        "EntryPoint": "vocab:EntryPoint",
        "events": {
            "@id": "vocab:EntryPoint/events",
            "@type": "@id"
        },
        "domains": {
            "@id": "vocab:EntryPoint/domain",
            "@type": "@id"
        },
        "users": {
            "@id": "vocab:EntryPoint/users",
            "@type": "@id"
        }
    }
}</code></pre>
    
    <h2>Versioning</h2>
    Currently the api is at version 1. The endpoints URL should include the version number in order to allow for multiple versions of the API.
    <pre><code>/rest/{version-number}/{endpoints...}</code></pre>
    <pre><code>/rest/v1/people</code></pre>
    
    <h2>Response Format</h2>
    Objects returned from a query will more or less resemble the document they originate from with a few exceptions:
    
    <ol>
        <li>JSON-LD keywords are added as neccessary to describe the output format. See 
<a href="http://www.w3.org/TR/json-ld/#the-context">JSON-LD @context</a> for more details JSON-LD</li>
        <li>_id is replaced with a '@id' item to match the JSON-LD specification.</li>
    </ol>
    
    For example:
    <pre><code>{
    "@context": "../rest/v1/context/User.jsonld",
    "name": "John",
    "details": {
        "income": 32465,
        "maritalStatus": "Single"
    }
    "age": 15,
    "@id": "/rest/v1/people/38923jf8DSD8334j?$version=0",
    "__v": 0 
}</code></pre>
    
    <h2>Pagination</h2>
    All collection endpoints, whether querying or grouping will return a pageable list. For example:
    
    <pre><code>{
  "@context": [ ... ],
  "@id": "/rest/v1/people?$group-by=state&$group-by=city&$skip=25",
  "@type": "PagedCollection",
  "totalItems": 2089,
  "firstPage": "/rest/v1/people?$group-by=state&$group-by=city",
  "nextPage": "/rest/v1/people?$group-by=state&$group-by=city&$skip=50",
  "previousPage": "/rest/v1/people?$group-by=state&$group-by=city",
  "lastPage": "/rest/v1/people?$group-by=state&$group-by=city&$skip=2075",
  "member": [{
      "state": "Arizona",
      "city": "Tucson",
      "count": 23,
      "@id": "/rest/v1/people?state=Arizona&city=Tucson"
  },
  {
      "state": "Arizona",
      "city": "Phoenix",
      "count": 340,
      "@id": "/rest/v1/people?state=Arizona&city=Phoenix"
  } ... ]
 }</code>
    </pre>
    
    Property descriptions:
    <table>
        <tr>
            <td>@context</td>
            <td>The metadata context or base path of the page.</td>
        </tr>
        <tr>
            <td>@type</td>
            <td>The type of results returned.</td>
        </tr>
        <tr>
            <td>count</td>
            <td>Full count of results</td>
        </tr>
        <tr>
            <td>list</td>
            <td>Actual list of results</td>
        </tr>
        <tr>
            <td>next</td>
            <td>Link to next page of results.</td>
        </tr>
        <tr>
            <td>previous</td>
            <td>Link to previous page of results.</td>
        </tr>
    </table>
    
    <h2>Metadata</h2>
    
    Metadata is referenced and provided via the same mechanism as JSON-LD. See the <a href="http://www.w3.org/TR/json-ld/#syntax-tokens-and-keywords">JSON-LD Specification</a> for more details on how meta information is handled via the @context, @type and other keywords.
    
    Here is an example out from a grouping operation with the @context embedded:
    <pre><code>{
  "@context": [
    "http://www.w3.org/ns/hydra/context.jsonld",
    {
      "vocab": "../rest/v1/vocab#",
      "state": "vocab:State#name",
      "city": "vocab:City#name",
      "count": "vocab:Count"
    }
  ],
  "@id": "/rest/v1/people?$group-by=state&$group-by=city&$skip=25",
  "@type": "PagedCollection",
  "totalItems": 2089,
  "firstPage": "/rest/v1/people?$group-by=state&$group-by=city",
  "nextPage": "/rest/v1/people?$group-by=state&$group-by=city&$skip=50",
  "previousPage": "/rest/v1/people?$group-by=state&$group-by=city",
  "lastPage": "/rest/v1/people?$group-by=state&$group-by=city&$skip=2075",
  "member": [{
      "state": "Arizona",
      "city": "Tucson",
      "count": 23,
      "@id": "/rest/v1/people?state=Arizona&city=Tucson"
  },
  {
      "state": "Arizona",
      "city": "Phoenix",
      "count": 340,
      "@id": "/rest/v1/people?state=Arizona&city=Phoenix"
  } ... ]
 }</code></pre>
    
    <h2>Querying</h2>
    <h3>Query parameters</h3>

    Query parameters can be provided to manage the output results during querying and grouping operations.<p>

    </p><table>
      <tbody><tr>
        <th>Parameter</th>
        <th>Description</th>
        <th>Default</th>
        <th>Example</th>
      </tr>
      <tr>
        <td>Path Expression</td>
        <td>Queries against the path provided. Available paths depends on the document structure.</td>
        <td></td>
        <td><pre><code>name.firstName=John&amp;age>=20</code></pre></td>
      </tr>
      <tr>
        <td>{Calculation} (Proposed)</td>
        <td>Queries against the path provided using a dynamic javascript expression as the input. The expression must be encapsulated within the <code>{ }</code> brackets. Additionally variables must be prefixed with the <code>$</code> sign.</td>
        <td></td>
        <td><pre><code>{$firstName + $lastName}=JohnDoe
{$price * $tax}&lt;=200</code></pre></td>
      </tr>
      <tr>
        <td>$skip</td>
        <td>Skips to the result index provided.</td>
        <td><code>0</code></td>
        <td><pre><code>$skip=100</code></pre></td>
      </tr><tr>
      </tr><tr>
        <td>$limit</td>
        <td>Limits the number of returned results.</td>
        <td><code>25</code></td>
        <td><pre><code>$limit=30</code></pre></td>
      </tr>
      <tr>
        <td>$sort</td>
        <td>Sorts the results by the path and direction provided</td>
        <td><code>{path} desc</code></td>
        <td><pre><code>$sort=age asc</code></pre></td>
      </tr>
      <tr>
        <td>$group-by</td>
        <td>Performs an aggregation using the path provided as the grouping variable. Multiple group bys are allowed.</td>
        <td></td>
        <td><pre><code>$group-by=details.class</code></pre></td>
      </tr>
    </tbody></table>
    
    <h4>Expressions</h4>

    Expressions can be used to generate dynamic values for use in querying and grouping. Expressions are permitted on either side of any operators. Brackets <code>{ }</code> are used to denote the extent of an expression and variable paths are prefixed with the <code>$</code> sign. For example to group orders by their final after tax price you could write:
    
    <pre><code>$group-by={$price * ($taxRate + 1)}</code></pre>

    <h3>Query Operators</h3>
    Mongodb collections can be queried via the /rest/v1/{collection-name} endpoint using standard query parameters. Here is a list of the currently implemented query operators:

    <table>
      <tbody><tr>
        <th>Operator</th>
        <th>Description</th>
        <th>Example</th>
      </tr>
      <tr>
        <td>=</td>
        <td>Equates that the property is equals to one of the provided values.</td>
        <td><pre><code>firstName=John&amp;firstName=Jane</code></pre></td>
      </tr>
      <tr>
        <td>*=</td>
        <td>Equates that the property contains the supplied text.</td>
        <td><pre><code>name*=son</code></pre></td>
      </tr>
      <tr>
        <td>!*=</td>
        <td>Equates that the property does not contain the supplied text.</td>
        <td><pre><code>name!*=son</code></pre></td>
      </tr>
      <tr>
        <td>~=</td>
        <td>Equates that the property matches one or more of the supplied regular expressions.</td>
        <td>
           <pre><code>name~=jef.*son
eventName~=Designer.*Count|Session.*Count</code></pre>
        </td>
      </tr>
      <tr>
        <td>!~=</td>
        <td>Equates that the property does not match any of the supplied regular expressions.</td>
        <td>
           <pre><code>name!~=jef.*son</code></pre>
        </td>
      </tr>
      <tr>
        <td>!=</td>
        <td>Equates that the property does not equal one of the provided values.</td>
        <td><pre><code>lastName!=Smith|Doe</code></pre></td>
      </tr>
      <tr>
        <td>&gt;=</td>
        <td>Equates that the property is greater than or equal to the supplied value or expression.</td>
        <td><pre><code>age&gt;=23</code></pre></td>
      </tr>
      <tr>
        <td>&lt;=</td>
        <td>Equates that the property is less than or equal to the supplied value or expression.</td>
        <td><pre><code>birthdate&lt;=2012-10-12</code></pre></td>
      </tr>
    </tbody></table>
    
    All operators with the exception of the <code>&lt;= and >=</code> can be passed multiple values. You can either provide the param multiple times or as a single string with values seperated with the <code>|</code> character.
    
    <h3>Boolean Operators</h3>
    
    Boolean operators can be used to group conditions and create more complex expressions. Boolean operators accept two parameters. A <code>{path || group-reference}</code> and an optional <code>{group-index}</code> parameter. If no <code>group-index</code> is provided, the operation is assumed to be against group <code>0</code>. Boolean operators use the following pattern:
    <pre><code>${boolean-operator}({path}, {group-index}? || 0){operator}={expression}</code></pre>
    
    The <code>{group-index}</code> is used to construct groups of parameters. The <code>{path}</code> parameter can either reference a document path including support for 'dot notation' or a <code>{group-index}</code> to allow for sub grouping.<br />
    
    Here is a list of the avaiable operators and some examples:
    <table>
        <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Example</th>
        </tr>
        <tr>
            <td>$and</td>
            <td>Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions</td>
            <td><pre><code>$and(name)~=tony&$and(name)!~=ant</code></pre></td>
        </tr>
        <tr>
            <td>$not</td>
            <td>Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.</td>
            <td><pre><code>$not(age)&lt;=20</code></pre>
            </td>
        </tr>
        <tr>
            <td>$or</td>
            <td>Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.</td>
            <td><pre><code>$and(name, 1)~=tony&$and(name, 1)!~=ant&$or(age, 2)>=20&$or(1, 2)</code></pre></td>
        </tr>
        <tr>
    </table>
    
    <h4>Boolean grouping</h4>
    Sub-grouping is accomplished via group references in the place of the <code>{path}</code> parameter. Note, that in the following expression <code>$or(name, 1)&$or(0, 1)</code>, both <code>$or</code> operations are in group <code>1</code>. The second <code>$or</code> operation; however, references group <code>0</code>. This group is used as its input thus resulting in group <code>0</code> as a sub group of group <code>1</code>. Both $and operations are in group <code>0</code> since they do not reference a group-index.
    <pre><code>$and(name)~=tony&$and(name)!~=ant&or(name, 1)=antony&$or(0, 1)</code></pre>
            The above query translates to :
            <pre><code>{$or: [ 
    { $and: [{ name: { $regex: "tony" }}, { name: { $not: {$regex: "ant" }}} ]},
    { name: "anthony"}
]</code></pre> In plain english:
            All documents with a name matching <code>tony</code> but not <code>ant</code>, or having the exact name of      <code>antony</code>. 
    
    <h3>Querying Dates</h3>

    Dates can be queried using standard UTC time format. For example: <pre><code>startTimeUtc&lt;=2014-10-11</code></pre>
    Alternatively durations can be used: <p>

    Durations take the form of <code>[-]{quantity}[smhdwMQy]</code> </p><p>

    For example, the following expression would query for all documents with a startTimeUtc property having a value within the last 2 days (48 hours).   
    <pre><code>startTimeUtc&gt;=-2d</code></pre>
    This is equivalent: <pre><code>startTimeUtc&gt;=-48h</code></pre>

    The possible durations are:
    </p><table>
      <tbody><tr>
        <th>Symbol</th>
        <th>Meaning</th>
      </tr>
      <tr>
        <td>s</td>
        <td>second</td>
      </tr>
      <tr>
        <td>m</td>
        <td>minute</td>
      </tr>
      <tr>
        <td>h</td>
        <td>hour</td>
      </tr>
      <tr>
        <td>d</td>
        <td>day</td>
      </tr>
      <tr>
        <td>w</td>
        <td>week</td>
      </tr>
      <tr>
        <td>M</td>
        <td>month</td>
      </tr>
      <tr>
        <td>Q</td>
        <td>quarter</td>
      </tr>
      <tr>
        <td>y</td>
        <td>year</td>
      </tr>
    </tbody></table>

    <h2>Grouping</h2>

    When a $group-by paramter is provided to the query endpoint, an aggregation is performed. Paths can reference deep properties via standard javascript 'dot notation'. Additionally, multiple group bys are allowed. <p>

    <h3>Default Aliasing</h3>
    
    When an aggergate function is used. The resulting group's corresponding property will be named using the following logic:
    <pre><code>{field-name}-{function-name}</code></pre> For example: <code>$avg=parameters.Duration</code> would become <code>Duration-avg</code> on the resulting groups.
    </p><p>
    
    <h3>Defined Aliasing</h3>
    An alias can be defined to circumvent this logic and is provided using the following pattern:
    <pre><code>$agg-function({params}?) as {alias}</code></pre>
    
    For example, the following would return the last five orders from the group with the alias of 'lastFiveOrders':
    <pre><code>$last(5) as lastFiveOrders=orders</code></pre> 
    
    <h3>Response Projection</h3>
    All grouping and querying responses will be returned within a pageable list's <code>member</code> property as described above. When grouping, all groups will have their keys flattened. For example:
    <pre><code>/rest/v1/people?$group-by=state&$group-by=city</code></pre>
    
    will result in:
    <pre><code>{
    "@context" [ ... ],
     ...
    "member": [{
        "state": 'Arizona',
        "city": 'Tucson',
        "count": 23,
        "@id": '/rest/v1/people?state=Arizona&city=Tucson'
    } ... ]
  }
}</code></pre>
    
    as opposed to:
    <pre><code>{
    "@context": [ ... ],
      ...
    "member": [{
    "_id": {
        "state": 'Arizona',
        "city": 'Tucson'
    },
    "count": 23,
    "@id": "/rest/v1/people?state=Arizona&city=Tucson"
}, ... ]</code></pre>
    
    <h3>Aggregation Functions</h3>
    Below is a list of functions which can be performed on the groups:

    </p><table>
      <tbody><tr>
        <th>Function</th>
        <th>Description</th>
        <th>Example</th>
      </tr>
      <tr>
        <td>$avg</td>
        <td>Averages the values of the path provided for each group</td>
        <td><pre><code>$avg=parameters.Duration
$avg={$price * ($taxRate + 1)}</code></pre></td>
      </tr>
      <tr>
        <td>$min</td>
        <td>Selects the min value of the path provided for each group</td>
        <td><pre><code>$min=income</code></pre></td>
      </tr>
      <tr>
        <td>$max</td>
        <td>Selects the max value of the path provided for each group</td>
        <td><pre><code>$max=age
$max:1=age-sum</code></pre></td>
      </tr>
      <tr>
        <td>$sum</td>
        <td>Sums the values of the path provided for each group</td>
        <td><pre><code>$sum=parameters.count</code></pre></td>
      </tr>
      <tr>
        <td>$last({count}?)</td>
        <td>Returns the last item(s) in a group. A count can be provided to select a number of items.</td>
        <td><pre><code>$last=employee</code></pre></td>
      </tr>
      <tr>
        <td>$first({count}?)</td>
        <td>Returns the first item(s) in a group. A count can be provided to select a number of items.</td>
        <td><pre><code>$first(5)=employee</code></pre></td>
      </tr>
    </tbody></table>
    
    All aggregative functions can operate on multiple fields. You can either supply the parameter multiple times or seperate a single aggregate functions param values with a <code>,</code>. For example, the following would sum both the orders and returns fields:
    <pre><code>$sum=orders,returns</code></pre>
    
    <h3>Grouping on dates</h3>
    
    Date fields can be used when grouping. By default the exact value will be used to match groups however an interval can be defined instead. The interval follows a similar pattern as is used for querying dates. The format is: 
    <pre><code>$group-by={field-path} interval {quantity}[mshdwMQy]</code></pre>
    
    For example, the following would create a group for each week of events from now.
    <pre><code>$group-by=startTimeUtc interval 1w</code></pre>

    Dates can also be grouped on standard date components:
    <ul>
        <li>dayOfYear</li>
        <li>dayOfMonth</li>
        <li>dayOfWeek</li>
        <li>monthOfYear</li>
        <li>weekOfYear</li>
        <li>hourOfDay</li>
        <li>minuteOfHour</li>
        <li>secondOfMinute</li>
        <li>millisecondOfSecond</li>
    </ul>
    
    For example, to group by the day of the week (monday, tuesday ...) you could use:
    <pre><code>$group-by=endTimeUtc dayOfWeek</code></pre>
    
    <h3>Predication, Projection, and Grouping pipelines (Proposed)</h3>
    Mongodb allows for pipelines to be defined to perform more sophisticated predication, projection, and grouping. The approached defined thus far only allows for one level of grouping. If additional post grouping is required you can use the following format:<p />
    
    <pre><code>{parameter-name({function-params}?):{pipeline-index? || 0}{operator}?={expression}</code></pre> 
    
    For example, the following would group by <code>Duration-sum</code> on the second stage of pipeline. The first state is 0 and is implied by default if no <code>pipeline-index</code> is specified:         
    <pre><code>$group-by=domain&$sum=parameters.Duration&$group-by:1=Duration-sum</code></pre>
    
    Here is what it looks like if a function also accepts one or more parameters:
    <pre><code>$last(5):1=people</code></pre>
    
    Predicating on groups can be accomplished with this technique as well. Its similar to sql's <code>having</code> keyword.
    <pre><code>$group-by=eventName&$sum=parameters.Duration&Duration-sum:1&gt;=100</code></pre>
    
    Here is another way to write this query explicitly denoting <code>pipeline-index</code> <code>0</code>
    <pre><code>$group-by:0=eventName&$sum:0=parameters.Duration&Duration-sum:1&gt;=100</code></pre>
    
    The following would group by <code>domain</code>, calculating the <code>avg</code> and <code>sum</code> <code>count</code> during the first pass. On the second pass, the resulting groups will themselves be grouped by the <code>count-avg</code> and for each group the <code>min</code> <code>count-sum</code> will be returned.  <pre><code>/rest/v1/events?$group-by=domain&amp;$avg=count&amp;$sum=count&amp;$group-by:1=count-avg&amp;$min:1=count-sum</code></pre> 
        
    </p><h2>Further Examples</h2>

    Find all events with a domain name equal to ZEPPELIN or NAM and a <code>startTimeUtc</code> within the last week 
    <pre><code>/rest/v1/events?domain=ZEPPELIN|NAM&amp;startTimeUtc&gt;=-1w</code></pre>

    Group by <code>domain</code>, showing all groups <code>having</code> more than 2000 events
    <pre><code>/rest/v1/events?$group-by=domain&amp;count:1&gt;=2000</code></pre>

    Group by <code>domain</code> and <code>eventName</code> showing all groups having an average <code>paramters.Duration</code> less than 10
    <pre><code>/rest/v1/events?$group-by=domain&amp;$group-by=eventName&amp;$avg=parameters.Duration&amp;Duration-avg:1&lt;=10</code></pre>
    
    Return largest and smallest cities by state. (Taken from mongdb documentation)
    <pre><code>/rest/v1/cities?
$group-by=state,city&$sum=pop&$sort=pop asc
&$group-by:1=state&$last() as biggestCity:1=city&$last() as biggestPop:1=pop-sum
&$first() as smallestCity:1=city&$first() as smallestPop:1=pop-sum</pre></code>
    
  </p>
</div>
