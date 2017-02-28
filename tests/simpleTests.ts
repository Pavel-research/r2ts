"use strict";
var chai = require("chai");
var assert = chai.assert;
import  mocha=require("mocha")
import rp=require("raml-1-parser");
import path=require("path")
import tsm=require("ts-model");
import {JavaScriptMetaEmmitter} from "../src/typeVisitor";
import main=require("../src/main")


describe("Simple bindings tests", function () {
    it("schema with reference, example is valid", function () {
        var rs = <rp.api10.Library>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/types.raml"), []);

        var nmm = new JavaScriptMetaEmmitter();
        nmm.defaultPath = rs.highLevel().lowLevel().unit().absolutePath();
        rs.types().forEach(x => {
            if (x.name() == "HasId") {
                var rs = nmm.visit(x);
                assert.deepEqual(rs.payload, {
                    id: 'HasId',
                    type: 'object',
                    properties: {id: {type: 'integer', required: true}}
                })
            }
            if (x.name() == "Named") {
                var rs = nmm.visit(x);
                assert.deepEqual(rs.payload, {
                    id: 'Named',
                    type: 'object',
                    properties: {name: {type: 'string', required: true}}
                })
            }
            if (x.name() == "Person") {
                var rs = nmm.visit(x);

                assert.deepEqual(rs.payload, {
                    id: 'Person',
                    type: ['HasId', 'Named'],
                    properties: {
                        lastName: {type: 'string', required: true},
                        age: {type: 'number', required: true},
                        pets: {type: 'array', itemType: 'Named'}
                    }
                })
            }
            if (x.name() == "Persons") {
                var rs = nmm.visit(x);
                assert.deepEqual(rs.payload, {id: 'Persons', type: 'array', itemType: 'Person'})
            }
            if (x.name() == "Items") {
                var rs = nmm.visit(x);
                assert.deepEqual(rs.payload, {
                    "id": "Items",
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "required": true},
                        "commonNames": {
                            "type": "array",
                            "default": ["Pavel", "Denis", "Max"],
                            "itemType": "string",
                            "required": true
                        }
                    }
                })
            }
            if (x.name() == "Map") {
                var rs = nmm.visit(x);
                assert.deepEqual(rs.payload, {"id": "Map", "type": "map", "componentType": "string"})
            }
            if (x.name() == "OwnedBy") {
                var rs = nmm.visit(x);
                assert.deepEqual(rs.payload, {
                    id: 'OwnedBy',
                    options: ['Company', 'Person', 'string'],
                    type: 'union'
                })
            }
            if (x.name() == "Company") {
                var rs = nmm.visit(x);
                //console.log(JSON.stringify(rs.payload));
                assert.deepEqual(rs.payload, {
                    "id": "Company",
                    "type": "HasId",
                    "displayName": "Company",
                    "description": "Company of Heroes",
                    "Elements": ["name"],
                    "properties": {
                        "name": {"type": "string", "required": true},
                        "public": "boolean",
                        "members": {"type": "array", "itemType": "Person", "required": true},
                        "ownedBy": {"options": ["Company", "Person", "string"], "type": "union", "required": true}
                    }
                })
            }
            if (x.name() == "Pet") {
                var rs = nmm.visit(x);
                assert.deepEqual(rs.payload, {
                    "id": "Pet",
                    "type": "animals_Pet",
                    "properties": {"ExtraInfo": {"type": "string", "required": true}}
                })
            }
        })
        //console.log(nmm.defaultModule.serializeToString());
    });
    it("core types should not be prefixed", function () {
        var rs = <rp.api10.Library>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/tp2.raml"), []);
        var pr = main.process(rs);
        assert.deepEqual(pr.types, {
            "Type": {
                "id": "Type",
                "type": "object",
                "properties": {
                    "name": {"type": "string", "unique": true, "required": true},
                    "description": "markdown",
                    "type": {"type": "string", "required": true}
                }
            },
            "Library": {
                "id": "Library",
                "type": "object",
                "properties": {
                    "name": {"type": "string", "required": true},
                    "types": {"type": "array", "itemType": "Type", "required": true}
                }
            }
        })

    })
    it("library types should be prefixed", function () {
        var rs = <rp.api10.Library>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/tp3.raml"), []);
        var pr = main.process(rs);
        assert.deepEqual(pr.types, {
                "HasAnimals": {
                    "id": "HasAnimals",
                    "type": "object",
                    "properties": {"animals": {"type": "array", "itemType": "animals_Pet", "required": true}}
                },
                "animals_Pet": {
                    "id": "animals_Pet",
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "required": true},
                        "food": {"type": "string", "required": true},
                        "specie": {"type": "string", "required": true}
                    }
                }
            }
        )
    })
    it("library types should be prefixed", function () {
        var rs = <rp.api10.Library>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/tp4.raml"), []);
        var pr = main.process(rs);
        assert.deepEqual(pr.types, {
            "Type": {
                "id": "Type",
                "type": "object",
                "properties": {
                    "name": {"type": "string", "unique": true, "required": true},
                    "description": "markdown",
                    "type": {"type": "string", "enum": ["object", "string", "number", "boolean"], "required": true},
                    "properties": {
                        "type": "array",
                        "visibleWhen": "$.type='object'",
                        "itemType": "Type",
                        "required": true
                    }
                }
            },
            "Library": {
                "id": "Library",
                "type": "object",
                "properties": {
                    "name": {"type": "string", "required": true},
                    "types": {"type": "array", "itemType": "Type", "required": true}
                }
            }
        })
    })
    it("github0", function () {
        var rs = <rp.api10.LibraryBase>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/github0.raml"), []);
        var pr = main.process(rs);
    })
    it("github1", function () {
        var rs = <rp.api10.LibraryBase>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/github1.raml"), []);
        var pr = main.process(rs);
        assert(pr.types["Issue"].constructors.length==1)
        assert(pr.types["Issue"].updaters.length==1)
    })
    it("github2", function () {
        var rs = <rp.api10.LibraryBase>rp.loadRAMLSync(path.resolve(__dirname, "../../tests/github20.raml"), []);
        var pr = main.process(rs);
        assert(pr.types["githubTypes_Issue"].constructors.length == 1);
        assert(pr.types["githubTypes_Issue"].updaters.length == 1);
    })
})