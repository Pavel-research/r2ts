#RAML2TS

At this moment goal of this module is to convert RAML files into JSON structures, 
which can be easily parsed and processed by type bindings module.

In a few words it performs following transformations:

* expand all type expressions
* collect used types from libraries and put them into main namespace with unique name
* collect information about CRUD operations/member collections related to types and insert this information in a serialized types
* merge facets and annotations into single namespace (types only).
* few more minor transforms.


Used format is not thought as final, it is just a very temporary solution to play with.

Main function of the module is: `parseToJSON(url: string, f: (v: ProcessingResult) => void): void` which actually performs transformation

It is planned to add typescript client gen using this representation as internal information storage to this repository later.