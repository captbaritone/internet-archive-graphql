# Internet Archive Client-Side GraphQL API

The [Internet Archive](https://archive.org) is best known for the Wayback Machine which archives public websites. But it also features a vast collection of user-uploaded files. These files are can be downloaded without authentication and with permissive CORs headers. Additionally, metadata about these items can be searched and read via a collection of similarly public APIs.

The fact that these APIs and files can be read directly from the browser means it's possible to build web applications which let you explore and interact with this data. Further, these apps could be implemented purely client side which means these applications don't even need to maintain a server. This lowers the barrier to entry and increases scalability.

**I believe there are a bunch of interesting applications and experiences that individual hobbyists could make leveraging these APIs and files**.

However, doing so is challenging for a number of reasons:

1. Due to legacy reasons, the data model of these APIs is hard to reason about
2. The APIs are inconsistent in how they are called, and what they return
3. Calling these APIs and reading these files on the client requires a few non-obvious tricks
4. Efficiently orchestrating and caching calls to these APIs can be tricky

## Enter Client Side GraphQL

I believe a community maintained client-side GraphQL server wrapping these APIs could generically solve the above problems allowing other developers to more easily build these types of experiences. Here is how it would address the above problems:

1. Provide a thoughtfully designed and documented schema
2. Provide a unifying abstraction over all the underlying REST apis
3. Handle, in one place, the tricky details of invoking these APIs from the client
4. Provide a generic implementation of request orchestration and caching

The result is a unified, documented, explodable API that client developers can pull into their application easily to build experiences using this data.
