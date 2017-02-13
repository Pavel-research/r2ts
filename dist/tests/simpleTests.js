"use strict";
var chai = require("chai");
var assert = chai.assert;
var rp = require("raml-1-parser");
var path = require("path");
var main = require("../src/main");
describe("Simple bindings tests", function () {
    it("github2", function () {
        var rs = rp.loadRAMLSync(path.resolve(__dirname, "../../tests/github20.raml"), []);
        var pr = main.process(rs);
        assert(pr.types["Issue"].constructors.length == 1);
        assert(pr.types["Issue"].updaters.length == 1);
    });
});
//# sourceMappingURL=simpleTests.js.map