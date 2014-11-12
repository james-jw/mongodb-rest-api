<div class="container">
    <h1>mongodb-rest-api v1</h1>

    Documentation on a proposed Mongodb compliant REST API for use with generic collections.<p>
    
    The api leverages a REST style with query/grouping operations being describable via URLs. Below is a proposed URL mapping to support querying a set of mongodb collections.

    Raw endpoint: <code>/rest/v1/{collection-name}</code><br />
    For example: <code>/rest/v1/events</code></p>
    
    <h2>Versioning</h2>
    Currently the api is at version 1. The endpoints URL should include the version number in order to allow for multiple versions of the API.
    <pre><code>/rest/{version-number}/{endpoints...}</code></pre>
    
    <h2>Pagination</h2>
    All collection endpoints, whether querying or grouping will return a pageable list. For example:
    
    <pre><code>{
    "@context": "{metadata-base-reference}",
    "@type": "{metadata-type}"
    count: {full-result-count},
    list: [ ... {items/groups} ... ],
    next: "/rest/v1/{collection}?query&$skip=50,
    previous: "/rest/v1/{collection}?query&$skip=25
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
    
    Metadata is provided via the same mechanism as JSON-LD. See git-hub JSON-LD for more details. In particular through the use of the <code>@context</code> and <code>@type</code> response properties. The mechanics around describing entities is outside the scope of this API. 
    
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
      <tr>
        <td>$having({path})</td>
        <td>Performs predication on an aggregation result set.</td>
        <td></td>
        <td><pre><code>$having(sum-count)&gt;=2000</code></pre></td>
      </tr>
    </tbody></table>
    
    <h4>Expressions</h4>

    Expressions have already been mentioned via the above {Calculate} parameter. Expressions can be used on either side of operator. For example to group orders by their final after tax price you could write:
    
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
    
    Boolean operators can be used to group conditions and create more complex expressions. Boolean operators accept two parameters. First, the {path} and additionally an optional {group-index} parameter. If not index is provided, it is assumed to be against group 0. They follow the pattern:
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
            <td><pre><code>$not(age)&tl;=20</code></pre>
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
    Sub-grouping is accomplished via group references in the place of the <code>{path}</code> parameter. Note in the following expression <code>$or(name, 1)&$or(0, 1)</code>. Both $or operations are in group 1. The second $or operatio however references group 0 as its input thus adding group 0 as a sub group. Both $and operations are in group zero since they do not reference a group-index.
    <pre><code>$and(name)~=tony&$and(name)!~=ant&or(name, 1)=antony&$or(0, 1)</code></pre>
            The above query translates to 
            <pre><code>{$or: 
    [{ $and: [{ name: { $regex: "tony" }}, { name: { $not: {$regex: "ant" }}} ]},
    { name: "anthony"}
]</code></pre> In plain english:
            All documents with a name matching <code>tony</code> but not <code>ant</code>, or having the exact name of      <code>antony</code>. 
    
    <h3>Querying Dates</h3>

    Dates can be queried using standard UTC time formats For example <pre><code>startTimeUtc&lt;=2014-10-11</code></pre>
    Alternatively deltas can be used as well. <p>

    Deltas take the form of <code>[+-]{quantity}[smhdwMQy]</code> </p><p>

    For example, the following expression would query for all documents with a startTimeUtc property having a value withing the last 2 days (48 hours).   
    <pre><code>startTimeUtc&gt;=-2d</code></pre>
    This is equivalent: <pre><code>startTimeUtc&gt;=-48h</code></pre>

    The possible intervals are:
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

    When a $group-by paramter is provided to the query endpoint above, an aggregation is performed. Multiple group bys are allowed. Additionally functions can reference deep paths via the standard javascript 'dot notation'; <p>

    When an aggergate function is used the resulting group field will be named using this logic:
    <pre><code>{field-name}-{function-name}</code></pre> For example: <code>$avg=parameters.Duration</code> would become <code>Duration-avg</code> on the resulting groups.
    </p><p>
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
$max(2)=age-sum</code></pre></td>
      </tr>
      <tr>
        <td>$sum</td>
        <td>Sums the values of the path provided for each group</td>
        <td><pre><code>$sum=parameters.count</code></pre></td>
      </tr>
    </tbody></table>
    
    All aggregative functions accept a single parameter and follow the pattern:
    <pre><code>$agg-function({aggregation-pipeline-index})</code></pre>
    
    You can see an example above on the $max row. The <code>{aggregation-pipeline-index}</code> is used to place query parameters in the correct index in the aggregation pipeline. See grouping pipelines below:
    
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
        <li>month</li>
        <li>week</li>
        <li>hour</li>
        <li>minute</li>
        <li>second</li>
        <li>millisecond</li>
    </ul>
    
    For example, to group by the day of the week (monday, tuesday ...) you could use:
    <pre><code>$group-by=endTimeUtc dayOfWeek</code></pre>
    
    <h3>Grouping pipelines (Proposed)</h3>
    Mongodb allows for grouping pipelines to be defined to perform more sophisticated groupings. The approached defined thus far only allows for one level of grouping. If additional post grouping is required you can use the following format:<p />
    
    <pre><code>{parameter-name({function-params}?, {pipeline-index}? || 0)}{operator}?={expression}</code></pre> 
    
    For example: <pre><code>$group-by(1)=Duration-sum</code></pre>
    Or with function parameters: <pre><code>$having(Duration-sum, 1)&gt;=100</code></pre>
    
    The following would group by domain, calculating the avg and sum count during the first pass. On the second pass, the resulting groups will themselves be grouped by the average count and for each group the min count-sum will be returned.  <pre><code>/rest/v1/events?$group-by=domain&amp;$avg=count&amp;$sum=count&amp;$group-by(1)=count-avg&amp;$min(1)=count-sum</code></pre> 
        
    </p><h2>Examples</h2>

    Find all events with a domain name equal to ZEPPELIN or NAM and a startTimeUtc within the last week 
    <pre><code>/rest/v1/events?domain=ZEPPELIN|NAM&amp;startTimeUtc&gt;=-1w</code></pre>

    Group by domain, showing all groups having more than 2000 events
    <pre><code>/rest/v1/events?$group-by=domain&amp;$having(count)&gt;=2000</code></pre>

    Group by domain and eventName showing all groups having an average paramters.Duration less than 10
    <pre><code>/rest/v1/events?$group-by=domain&amp;$group-by=eventName&amp;$avg=parameters.Duration&amp;$having(duration-avg)&lt;=10</code></pre>
    
  </p>
</div>
