#RAML2TS

At this moment goal of this module is to convert RAML files into JSON structures, 
which can be easily parsed and processed by type bindings module.

In a few words it performs following transformations:

* expand all type expressions
* collect used types from libraries and put them into main namespace with unique name
* collect information about CRUD operations/member collections related to types and insert this information in a serialized types
* merge facets and annotations into single namespace (types only).
* few more minor transforms.

One example of transform is:

```yaml
#%RAML 1.0 Library
uses:
  core: coreLib.raml
types:
  StudentClass:
    properties:
      name: string
      teacherFullName: string
      courseDescription: core.text
      numberOfHours:
       type: integer
       minimum: 1
       maximum: 192

```
transforms to:

```json
{
  "StudentClass": {
    "id": "StudentClass",
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "required": true
      },
      "teacherFullName": {
        "type": "string",
        "required": true
      },
      "courseDescription": {
        "type": "text",
        "required": true
      },
      "numberOfHours": {
        "type": "integer",
        "minimum": 1,
        "maximum": 192,
        "required": true
      }
    }
  }
}


```

Used format is not thought as final, it is just a very temporary solution to play with. 

Actually this format is pretty similar 
to the one used in JS Parser now, (with except of addition of operations related connections, 
and more simple way to access type information, so it mmight be a good idea to check if it might be done in a more elegant way
basing on latest changes in parser serialization)

Main function of the module is: `parseToJSON(url: string, f: (v: ProcessingResult) => void): void` which actually performs transformation

It is planned to add typescript client gen using this representation as internal information storage to this repository later.