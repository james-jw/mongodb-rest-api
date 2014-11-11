<div class="container">
    <h1>mongodb-rest-api API v1</h1>

    Documentation on using the mongodb REST API.<p>

    Raw endpoint: <code>/rest/v1/{collection-name}</code><br>
    For example: <code>/rest/v1/events</code></p><p>

    </p><h2>Querying</h2>
    <h3>Query parameters</h3>

    Query parameters can be provided to manage the output results during querying and grouping operations.<p>

    </p><table>
      <tbody><tr>
        <th>Parameter</th>
        <th>Description</th>
        <th>Usage</th>
        <th>Default</th>
        <th>Example</th>
      </tr>
      <tr>
        <td>{Path Expression}</td>
        <td>Queries against the path provided. Available paths depends on the document structure.</td>
        <td>Querying and grouping</td>
        <td></td>
        <td><code>name.firstName=John&amp;name.lastName!=Does</code></td>
      </tr>
      <tr>
        <td>$skip</td>
        <td>Skips to the result index provided.</td>
        <td>Querying and grouping</td>
        <td><code>0</code></td>
        <td><code>$skip=100</code></td>
      </tr><tr>
      </tr><tr>
        <td>$limit</td>
        <td>Limits the number of returned results.</td>
        <td>Querying and grouping</td>
        <td><code>25</code></td>
        <td><code>$limit=30</code></td>
      </tr>
      <tr>
        <td>$sort</td>
        <td>Sorts the results by the path and direction provided</td>
        <td>Querying and grouping</td>
        <td><code>{path} desc</code></td>
        <td><code>$sort=age asc</code></td>
      </tr>
      <tr>
        <td>$group-by</td>
        <td>Performs an aggregation using the path provided as the grouping variable. Multiple group bys are allowed.</td>
        <td>Grouping</td>
        <td></td>
        <td><code>$group-by=parameters.WorkspaceType</code></td>
      </tr>
      <tr>
        <td>$having({path})</td>
        <td>Performs predication on a group result set.</td>
        <td>Grouping</td>
        <td></td>
        <td><code>$having(sum-count)&gt;=2000</code></td>
      </tr>
    </tbody></table>

    <h3>Query Operators</h3>
    Mongodb collections can be queried via the /rest/v1/{collection-name} endpoint using standard query parameters.

    <table>
      <tbody><tr>
        <th>Operator</th>
        <th>Description</th>
        <th>Example</th>
      </tr>
      <tr>
        <td>=</td>
        <td>Equates that the property is equals to one of the provided values. You can either provide the param multiple times or seperate values with the | character.</td>
        <td><code>firstName=John&amp;firstName=Jane</code></td>
      </tr>
      <tr>
        <td>*=</td>
        <td>Equates that the property contains the supplied text.</td>
        <td><code>name*=son</code></td>
      </tr>
      <tr>
        <td>~=</td>
        <td>Equates that the property matches the supplied regular expression.</td>
        <td><code>name~=jef.*son</code></td>
      </tr>
      <tr>
        <td>!=</td>
        <td>Equates that the property does not equal one of the provided values. You can either provide the param multiple times or seperate values with the | character.</td>
        <td><code>lastName=Smith|Doe</code></td>
      </tr>
      <tr>
        <td>&gt;=</td>
        <td>Equates that the property is greater than or equal to the supplied value or expression.</td>
        <td><code>age&gt;=23</code></td>
      </tr>
      <tr>
        <td>&lt;=</td>
        <td>Equates that the property is less than or equal to the supplied value or expression.</td>
        <td><code>birthdate&lt;=2012-10-12</code></td>
      </tr>
    </tbody></table>

    <h3>Querying Dates</h3>

    Dates can be queried using standard UTC time formats for example <code>startTimeUtc&lt;=2014-10-11</code>. Alternatively deltas can be used as well. <p>

    Deltas take the form of <code>[+-]{quantity}[smhdwMQy]</code> </p><p>

    For example: <code>startTimeUtc&gt;=-2d</code> quieries for all events created withing the last 2 days (48 hours).<br>
    This is equivalent: <code>startTimeUtc&gt;=-48h</code></p><p>

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

    When an aggergate function is used the resulting group field will be named using this logic:<br>
    <code>{final-field-name}-{function-name}</code>. For example: <code>$avg=parameters.Duration</code> would become <code>duration-avg</code> on the resulting groups.
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
        <td>$avg=parameters.Duration</td>
      </tr>
      <tr>
        <td>$min</td>
        <td>Selects the min value of the path provided for each group</td>
        <td>$min=income</td>
      </tr>
      <tr>
        <td>$max</td>
        <td>Selects the max value of the path provided for each group</td>
        <td>$max=age</td>
      </tr>
      <tr>
        <td>$sum</td>
        <td>Sums the values of the path provided for each group</td>
        <td>$sum=parameters.count</td>
      </tr>
    </tbody></table>
    
    <h3>Grouping on dates</h3>
    
    Date fields can be used when grouping. By default the exact value will be used to match groups however an interval can be defined instead. The interval follows a similar pattern as is used for querying dates. The format is <br>
    <code>{field-path} interval {quantity}[mshdwMQy]</code><p>
    
    For example: <code>$group-by=startTimeUtc interval 1w</code> would create a group for each week of events from now.

    </p><h3>Grouping pipelines (Proposed)</h3>
    Mongodb allows for grouping pipelines to be defined to perform more sophisticated groupings. The approached defined thus far only allows for one level of grouping. If additional post grouping is required you can use the following format:<p />
    
    <code>{parameter-name({function-params}?, {pipeline-index}? || 0)}{operator}?={value or path}</code><br> Note: pipeline-index defaults to <code>0</code><p />
    
    For example: <code>$group-by(1)=sum-Duration</code><br>
    Or with function parameters: <code>$having(sum-duration, 1)&gt;=100</code><p />
    
    Full example: <br /> <code>/rest/v1/events?$group-by=domain&amp;$avg=count&amp;$sum=count&amp;$group-by(1)=count-avg&amp;$min(1)=count-sum&amp;$max(1)=count-sum</code><p /> would group by domain, calculating the avg and sum count during the first pass. On the second pass, the resulting groups will themselves be grouped by the average count and for each group the min and max count-sum will be returned. 
        
    </p><h2>Examples</h2>

    Find all events with a domain name equal to MINER or NAM and a startTimeUtc within the last week <br>
    <code>/rest/v1/events?domain=MINER|NAM&amp;startTimeUtc&gt;=-1w</code><p>

    Group by domain, showing all groups having more than 2000 events <br>
    <code>/rest/v1/events?$group-by=domain&amp;$having(count)&gt;=2000</code></p><p>

    Group by domain and eventName showing all groups having an average paramters.Duration less than 10<br>
    <code>/rest/v1/events?$group-by=domain&amp;$group-by=eventName&amp;$avg=parameters.Duration&amp;$having(duration-avg)&lt;=10</code></p><p>
  </p></div>
