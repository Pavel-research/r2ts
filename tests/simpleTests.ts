"use strict";
var chai = require("chai");
var assert = chai.assert;
import  mocha=require("mocha")
import rp=require("raml-1-parser");
import path=require("path")
import tsm=require("ts-model");
import {TSAPIModule, TSInterface} from "ts-model";
import typescript=require("typescript");
import {TypeScriptInterfaceEmmitter,JavaScriptMetaEmmitter} from "../src/typeVisitor";

describe("Simple bindings tests", function () {
    it("schema with reference, example is valid", function () {
        var rs=<rp.api10.Library>rp.loadRAMLSync(path.resolve(__dirname,"../../tests/types.raml"),[]);
        var nmm=new JavaScriptMetaEmmitter();
        rs.types().forEach(x=>{
            if (x.name()=="Company") {
                nmm.visit(x);
            }
        })
        //console.log(nmm.defaultModule.serializeToString());
    });
});
