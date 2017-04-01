export={
  "ramlSource": "#%RAML 1.0\r\ntitle: Github\r\nbaseUri: https://api.github.com/\r\nmediaType: application/json\r\nuses:\r\n  core: coreLib2.raml\r\n  client: clients.raml\r\n  ght: githubTypes.raml\r\nresourceTypes:\r\n  list:\r\n    get:\r\n      displayName: <<resourcePathName | !uppercamelcase>>\r\n      (core.list):\r\n      (core.basicPaging): { page: page}\r\n      responses:\r\n        200:\r\n          body: <<ItemType>>[]\r\nsecuritySchemes:\r\n  basic:\r\n    type: Basic Authentication\r\nsecuredBy: basic\r\n/user/orgs:\r\n  type:  { list: {ItemType : ght.Organization} }\r\n  (core.columns): ['login']\r\n  (client.methodName): getUserOrgs\r\n/orgs/{org}:\r\n  uriParameters:\r\n    org:\r\n      (core.reference): ght.Organization.login\r\n  /repos:\r\n    (core.memberCollection): ght.Organization\r\n    type: {list: { ItemType: ght.Repository}}\r\n    (core.columns): ['name']\r\n  /members:\r\n    (core.memberCollection): ght.Organization\r\n    type: {list: { ItemType: ght.User}}\r\n    (core.columns): ['login']\r\n/repos/{owner}/{repo}:\r\n  uriParameters:\r\n    repo:\r\n      (core.reference): ght.Repository.name\r\n    owner:\r\n      (core.reference): ght.Repository.owner.login\r\n  /milestones:\r\n    (core.memberCollection): ght.Repository\r\n    type:  { list: {ItemType : ght.Milestone} }\r\n  /labels:\r\n    (core.memberCollection): ght.Repository\r\n    type:  { list: {ItemType : ght.Label} }\r\n  /issues:\r\n    get:\r\n      displayName: Issues\r\n      (core.errorMessageIn): message\r\n      (core.basicPaging): { page: page}\r\n      (core.memberCollection): ght.Repository\r\n      queryParameters:\r\n        state:\r\n            enum: [open, closed, all]\r\n            default: open\r\n            displayName: Issue State\r\n        sort:\r\n          enum: [comments, created, updated]\r\n          default: created\r\n          displayName: Order by\r\n        page: integer\r\n      responses:\r\n        200:\r\n          body:\r\n              type: ght.Issue[]\r\n              (core.columns):  [ title, created_at, updated_at, state ]\r\n    post:\r\n      (core.create): ght.Issue\r\n      displayName: Create Issue\r\n      body: ght.CreateIssue\r\n      responses:\r\n          200:\r\n            body: ght.Issue\r\n    /{issueNum}:\r\n      uriParameters:\r\n        issueNum:\r\n          type: integer\r\n          (core.reference): ght.Issue.number\r\n      patch:\r\n        (core.update): ght.Issue\r\n        body: ght.EditIssue\r\n        responses:\r\n          200:\r\n            body: ght.Issue\r\n      /comments:\r\n          (core.memberCollection): ght.Issue\r\n          type:  { list: {ItemType : ght.Comment } }\r\n          (core.columns): [updated_at, body ]\r\n(core.conversionRules):\r\n  MileStoneToInteger:\r\n    from: ght.Milestone\r\n    to: integer\r\n    selfRule: this.number",
  "types": {
    "_user_orgs_get": {
      "id": "_user_orgs_get",
      "baseUri": "https://api.github.com/",
      "displayName": "Orgs",
      "description": null,
      "url": "/user/orgs",
      "method": "get",
      "parameters": [],
      "annotations": {
        "columns": [
          "login"
        ],
        "methodName": "getUserOrgs",
        "basicPaging": {
          "page": "page"
        }
      },
      "relativeUrl": "/user/orgs",
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "view",
      "columns": [
        "login"
      ],
      "methodName": "getUserOrgs",
      "basicPaging": {
        "page": "page"
      },
      "itemType": "githubTypes_Organization",
      "paging": true
    },
    "_orgs__org__repos_get": {
      "id": "_orgs__org__repos_get",
      "baseUri": "https://api.github.com/",
      "displayName": "Repos",
      "description": null,
      "url": "/orgs/{org}/repos",
      "method": "get",
      "parameters": [
        {
          "id": "org",
          "type": "string",
          "reference": "githubTypes_Organization.login",
          "required": true,
          "location": "uri",
          "displayName": "org"
        }
      ],
      "annotations": {
        "memberCollection": "githubTypes_Organization",
        "columns": [
          "name"
        ],
        "basicPaging": {
          "page": "page"
        }
      },
      "relativeUrl": "/repos",
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "view",
      "memberCollection": "githubTypes_Organization",
      "columns": [
        "name"
      ],
      "basicPaging": {
        "page": "page"
      },
      "itemType": "githubTypes_Repository",
      "paging": true
    },
    "_orgs__org__members_get": {
      "id": "_orgs__org__members_get",
      "baseUri": "https://api.github.com/",
      "displayName": "Members",
      "description": null,
      "url": "/orgs/{org}/members",
      "method": "get",
      "parameters": [
        {
          "id": "org",
          "type": "string",
          "reference": "githubTypes_Organization.login",
          "required": true,
          "location": "uri",
          "displayName": "org"
        }
      ],
      "annotations": {
        "memberCollection": "githubTypes_Organization",
        "columns": [
          "login"
        ],
        "basicPaging": {
          "page": "page"
        }
      },
      "relativeUrl": "/members",
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "view",
      "memberCollection": "githubTypes_Organization",
      "columns": [
        "login"
      ],
      "basicPaging": {
        "page": "page"
      },
      "itemType": "githubTypes_User",
      "paging": true
    },
    "_repos__owner___repo__milestones_get": {
      "id": "_repos__owner___repo__milestones_get",
      "baseUri": "https://api.github.com/",
      "displayName": "Milestones",
      "description": null,
      "url": "/repos/{owner}/{repo}/milestones",
      "method": "get",
      "parameters": [
        {
          "id": "owner",
          "type": "string",
          "reference": "githubTypes_Repository.owner.login",
          "required": true,
          "location": "uri",
          "displayName": "owner"
        },
        {
          "id": "repo",
          "type": "string",
          "reference": "githubTypes_Repository.name",
          "required": true,
          "location": "uri",
          "displayName": "repo"
        }
      ],
      "annotations": {
        "memberCollection": "githubTypes_Repository",
        "basicPaging": {
          "page": "page"
        }
      },
      "relativeUrl": "/milestones",
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "view",
      "memberCollection": "githubTypes_Repository",
      "basicPaging": {
        "page": "page"
      },
      "itemType": "githubTypes_Milestone",
      "paging": true
    },
    "_repos__owner___repo__labels_get": {
      "id": "_repos__owner___repo__labels_get",
      "baseUri": "https://api.github.com/",
      "displayName": "Labels",
      "description": null,
      "url": "/repos/{owner}/{repo}/labels",
      "method": "get",
      "parameters": [
        {
          "id": "owner",
          "type": "string",
          "reference": "githubTypes_Repository.owner.login",
          "required": true,
          "location": "uri",
          "displayName": "owner"
        },
        {
          "id": "repo",
          "type": "string",
          "reference": "githubTypes_Repository.name",
          "required": true,
          "location": "uri",
          "displayName": "repo"
        }
      ],
      "annotations": {
        "memberCollection": "githubTypes_Repository",
        "basicPaging": {
          "page": "page"
        }
      },
      "relativeUrl": "/labels",
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "view",
      "memberCollection": "githubTypes_Repository",
      "basicPaging": {
        "page": "page"
      },
      "itemType": "githubTypes_Label",
      "paging": true
    },
    "_repos__owner___repo__issues_get": {
      "id": "_repos__owner___repo__issues_get",
      "baseUri": "https://api.github.com/",
      "displayName": "Issues",
      "description": null,
      "url": "/repos/{owner}/{repo}/issues",
      "method": "get",
      "parameters": [
        {
          "id": "state",
          "type": "string",
          "enum": [
            "open",
            "closed",
            "all"
          ],
          "default": "open",
          "displayName": "Issue State",
          "location": "query"
        },
        {
          "id": "sort",
          "type": "string",
          "enum": [
            "comments",
            "created",
            "updated"
          ],
          "default": "created",
          "displayName": "Order by",
          "location": "query"
        },
        {
          "id": "owner",
          "type": "string",
          "reference": "githubTypes_Repository.owner.login",
          "required": true,
          "location": "uri",
          "displayName": "owner"
        },
        {
          "id": "repo",
          "type": "string",
          "reference": "githubTypes_Repository.name",
          "required": true,
          "location": "uri",
          "displayName": "repo"
        }
      ],
      "annotations": {
        "errorMessageIn": "message",
        "basicPaging": {
          "page": "page"
        },
        "memberCollection": "githubTypes_Repository"
      },
      "relativeUrl": "/issues",
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "view",
      "errorMessageIn": "message",
      "basicPaging": {
        "page": "page"
      },
      "memberCollection": "githubTypes_Repository",
      "columns": [
        "title",
        "created_at",
        "updated_at",
        "state"
      ],
      "itemType": "githubTypes_Issue",
      "paging": true
    },
    "_repos__owner___repo__issues_post": {
      "id": "_repos__owner___repo__issues_post",
      "baseUri": "https://api.github.com/",
      "displayName": "Create Issue",
      "description": null,
      "url": "/repos/{owner}/{repo}/issues",
      "method": "post",
      "parameters": [
        {
          "id": "owner",
          "type": "string",
          "reference": "githubTypes_Repository.owner.login",
          "required": true,
          "location": "uri",
          "displayName": "owner"
        },
        {
          "id": "repo",
          "type": "string",
          "reference": "githubTypes_Repository.name",
          "required": true,
          "location": "uri",
          "displayName": "repo"
        },
        {
          "id": "body",
          "type": "githubTypes_CreateIssue",
          "required": true,
          "location": "body"
        }
      ],
      "annotations": {
        "create": "githubTypes_Issue"
      },
      "relativeUrl": "/issues",
      "result": {
        "id": "body",
        "type": "githubTypes_Issue"
      },
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "operation"
    },
    "_repos__owner___repo__issues__issueNum__patch": {
      "id": "_repos__owner___repo__issues__issueNum__patch",
      "baseUri": "https://api.github.com/",
      "displayName": "{issueNum}",
      "description": null,
      "url": "/repos/{owner}/{repo}/issues/{issueNum}",
      "method": "patch",
      "parameters": [
        {
          "id": "issueNum",
          "type": "integer",
          "reference": "githubTypes_Issue.number",
          "required": true,
          "location": "uri",
          "displayName": "issueNum"
        },
        {
          "id": "owner",
          "type": "string",
          "reference": "githubTypes_Repository.owner.login",
          "required": true,
          "location": "uri",
          "displayName": "owner"
        },
        {
          "id": "repo",
          "type": "string",
          "reference": "githubTypes_Repository.name",
          "required": true,
          "location": "uri",
          "displayName": "repo"
        },
        {
          "id": "body",
          "type": "githubTypes_EditIssue",
          "required": true,
          "location": "body"
        }
      ],
      "annotations": {
        "update": "githubTypes_Issue"
      },
      "relativeUrl": "/{issueNum}",
      "result": {
        "id": "body",
        "type": "githubTypes_Issue"
      },
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "operation"
    },
    "_repos__owner___repo__issues__issueNum__comments_get": {
      "id": "_repos__owner___repo__issues__issueNum__comments_get",
      "baseUri": "https://api.github.com/",
      "displayName": "Comments",
      "description": null,
      "url": "/repos/{owner}/{repo}/issues/{issueNum}/comments",
      "method": "get",
      "parameters": [
        {
          "id": "issueNum",
          "type": "integer",
          "reference": "githubTypes_Issue.number",
          "required": true,
          "location": "uri",
          "displayName": "issueNum"
        },
        {
          "id": "owner",
          "type": "string",
          "reference": "githubTypes_Repository.owner.login",
          "required": true,
          "location": "uri",
          "displayName": "owner"
        },
        {
          "id": "repo",
          "type": "string",
          "reference": "githubTypes_Repository.name",
          "required": true,
          "location": "uri",
          "displayName": "repo"
        }
      ],
      "annotations": {
        "memberCollection": "githubTypes_Issue",
        "columns": [
          "updated_at",
          "body"
        ],
        "basicPaging": {
          "page": "page"
        }
      },
      "relativeUrl": "/comments",
      "executorId": "rest",
      "securedBy": [
        "basic"
      ],
      "type": "view",
      "memberCollection": "githubTypes_Issue",
      "columns": [
        "updated_at",
        "body"
      ],
      "basicPaging": {
        "page": "page"
      },
      "itemType": "githubTypes_Comment",
      "paging": true
    },
    "basic": {
      "id": "basic",
      "kind": "Basic Authentication",
      "type": "securityDefinition",
      "displayName": "Basic",
      "description": "",
      "settings": {}
    },
    "_module_": {
      "type": "module",
      "conversionRules": {
        "MileStoneToInteger": {
          "from": "ght.Milestone",
          "to": "integer",
          "selfRule": "this.number"
        }
      }
    },
    "githubTypes_HasId": {
      "id": "githubTypes_HasId",
      "type": "object",
      "properties": {
        "id": {
          "type": "integer",
          "key": true,
          "visibleWhen": false,
          "readonly": true,
          "required": true
        }
      },
      "displayName": "Github Types Has Id"
    },
    "githubTypes_Organization": {
      "id": "githubTypes_Organization",
      "type": "githubTypes_HasId",
      "icon": "avatar_url",
      "properties": {
        "login": {
          "type": "string",
          "required": true
        },
        "description": {
          "type": "string",
          "required": true
        },
        "_orgs__org__repos_get": {
          "id": "",
          "displayName": "Repos",
          "description": null,
          "type": "_orgs__org__repos_get"
        },
        "_orgs__org__members_get": {
          "id": "",
          "displayName": "Members",
          "description": null,
          "type": "_orgs__org__members_get"
        }
      },
      "listers": [
        "_user_orgs_get"
      ],
      "aliases": {
        "repos": "_orgs__org__repos_get",
        "members": "_orgs__org__members_get"
      },
      "displayName": "Github Types Organization"
    },
    "githubTypes_Repository": {
      "id": "githubTypes_Repository",
      "type": "githubTypes_HasId",
      "icon": "https://maxcdn.icons8.com/Color/PNG/24/Programming/github-24.png",
      "properties": {
        "name": {
          "type": "string",
          "required": true
        },
        "full_name": {
          "type": "string",
          "required": true
        },
        "description": {
          "type": "string",
          "required": true
        },
        "_repos__owner___repo__milestones_get": {
          "id": "",
          "displayName": "Milestones",
          "description": null,
          "type": "_repos__owner___repo__milestones_get"
        },
        "_repos__owner___repo__labels_get": {
          "id": "",
          "displayName": "Labels",
          "description": null,
          "type": "_repos__owner___repo__labels_get"
        },
        "_repos__owner___repo__issues_get": {
          "id": "",
          "displayName": "Issues",
          "description": null,
          "type": "_repos__owner___repo__issues_get"
        }
      },
      "listers": [
        "_orgs__org__repos_get"
      ],
      "aliases": {
        "milestones": "_repos__owner___repo__milestones_get",
        "labels": "_repos__owner___repo__labels_get",
        "issues": "_repos__owner___repo__issues_get"
      },
      "displayName": "Github Types Repository"
    },
    "githubTypes_User": {
      "id": "githubTypes_User",
      "type": "object",
      "icon": "avatar_url",
      "label": "login",
      "properties": {
        "login": {
          "type": "string",
          "required": true
        }
      },
      "listers": [
        "_orgs__org__members_get"
      ],
      "displayName": "Github Types User"
    },
    "githubTypes_Milestone": {
      "id": "githubTypes_Milestone",
      "type": "githubTypes_HasId",
      "properties": {
        "number": {
          "type": "integer",
          "required": true
        },
        "title": {
          "type": "string",
          "required": true
        }
      },
      "listers": [
        "_repos__owner___repo__milestones_get"
      ],
      "displayName": "Github Types Milestone"
    },
    "githubTypes_Label": {
      "id": "githubTypes_Label",
      "type": "githubTypes_HasId",
      "properties": {
        "name": {
          "type": "string",
          "required": true
        }
      },
      "listers": [
        "_repos__owner___repo__labels_get"
      ],
      "displayName": "Github Types Label"
    },
    "githubTypes_Base": {
      "id": "githubTypes_Base",
      "type": "githubTypes_HasId",
      "properties": {
        "created_at": {
          "type": "datetime",
          "readonly": true,
          "required": true
        },
        "updated_at": {
          "type": "datetime",
          "readonly": true,
          "required": true
        },
        "body": "markdown"
      },
      "displayName": "Github Types Base"
    },
    "githubTypes_Issue": {
      "id": "githubTypes_Issue",
      "type": "githubTypes_Base",
      "icon": "https://maxcdn.icons8.com/office/PNG/16/Animals/bug-16.png",
      "properties": {
        "number": {
          "type": "string",
          "readonly": true,
          "visibleWhen": false,
          "required": true
        },
        "title": {
          "type": "string",
          "required": true
        },
        "labels": {
          "type": "array",
          "reference": true,
          "uniqueItems": true,
          "itemType": "githubTypes_Label",
          "required": true
        },
        "milestone": {
          "type": "githubTypes_Milestone",
          "reference": true
        },
        "state": {
          "type": "string",
          "enum": [
            "open",
            "closed"
          ],
          "required": true
        },
        "repository": {
          "type": "githubTypes_Repository",
          "required": true
        },
        "_repos__owner___repo__issues__issueNum__comments_get": {
          "id": "",
          "displayName": "Comments",
          "description": null,
          "type": "_repos__owner___repo__issues__issueNum__comments_get"
        }
      },
      "constructors": [
        "_repos__owner___repo__issues_post"
      ],
      "updaters": [
        "_repos__owner___repo__issues__issueNum__patch"
      ],
      "aliases": {
        "comments": "_repos__owner___repo__issues__issueNum__comments_get"
      },
      "displayName": "Github Types Issue"
    },
    "githubTypes_CreateIssue": {
      "id": "githubTypes_CreateIssue",
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "required": true
        },
        "milestone": {
          "type": "integer",
          "reference": "Milestone.number"
        },
        "labels": {
          "type": "array",
          "reference": "Label.name",
          "uniqueItems": true,
          "itemType": "string",
          "required": true
        },
        "body": "markdown"
      },
      "displayName": "Github Types Create Issue"
    },
    "githubTypes_EditIssue": {
      "id": "githubTypes_EditIssue",
      "type": "githubTypes_CreateIssue",
      "properties": {
        "state": {
          "type": "string",
          "enum": [
            "open",
            "closed"
          ],
          "default": "open",
          "required": true
        }
      },
      "displayName": "Github Types Edit Issue"
    },
    "githubTypes_Comment": {
      "id": "githubTypes_Comment",
      "type": "githubTypes_Base",
      "listers": [
        "_repos__owner___repo__issues__issueNum__comments_get"
      ],
      "displayName": "Github Types Comment"
    }
  },
  "annotations": {}
}