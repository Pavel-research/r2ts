"use strict";
var rp = require("raml-1-parser");
var typeVisitor = require("./typeVisitor");
function process(x) {
    var c = x.highLevel().lowLevel().unit().contents();
    var rs = {
        ramlSource: c,
        types: {},
        annotations: {}
    };
    if (x.kind() == "Library") {
        var emmitter = new typeVisitor.JavaScriptMetaEmmitter();
        emmitter.defaultPath = x.highLevel().lowLevel().unit().absolutePath();
        x.types().forEach(function (x) {
            var res = emmitter.visit(x);
            if (res.payload["id"]) {
                rs.types[res.payload["id"]] = res.payload;
            }
        });
        Object.keys(emmitter.extraTypes).forEach(function (x) {
            rs.types[x] = emmitter.extraTypes[x];
        });
    }
    if (x.kind() == "Api") {
        var emmitter = new typeVisitor.JavaScriptMetaEmmitter();
        x = x.expand(false);
        emmitter.defaultPath = x.highLevel().lowLevel().unit().absolutePath();
        x.types().forEach(function (x) {
            var res = emmitter.visit(x);
            if (res.payload["id"]) {
                rs.types[res.payload["id"]] = res.payload;
            }
        });
        var operations = [];
        x.allResources().forEach(function (x) {
            var res = emmitter.visitResource(x);
            operations = operations.concat(res);
        });
        Object.keys(rs.types).forEach(function (x) {
            if (emmitter.idToType[x]) {
                rs.types[x] = emmitter.idToType[x];
            }
        });
        operations.forEach(function (x) {
            if (x.type) {
                rs.types[x.id] = x;
            }
            else {
                rs.types[x.id] = x;
                x.type = "operation";
            }
        });
        var secDefinitions = x.securitySchemes().map(function (x) { return emmitter.visitSecurityDefinition(x); });
        secDefinitions.forEach(function (s) {
            rs.types[s.id] = s;
        });
        rs.types['_module_'] = {};
        rs.types['_module_'].type = "module";
        x.highLevel().attrs().forEach(function (x) {
            if (x.name() == "annotations") {
                var obj = x.lowLevel().dumpToObject(true);
                var an = Object.keys(obj)[0];
                var av = obj[an];
                an = an.substring(1, an.length - 1);
                if (an.indexOf('.') != -1) {
                    an = an.substring(an.indexOf('.') + 1);
                }
                rs.types['_module_'][an] = av;
            }
        });
        Object.keys(emmitter.extraTypes).forEach(function (x) {
            rs.types[x] = emmitter.extraTypes[x];
        });
    }
    return rs;
}
exports.process = process;
function parseToJSON(url, f) {
    rp.loadRAML(url, []).then(function (x) {
        f(process(x));
    });
}
exports.parseToJSON = parseToJSON;
//# sourceMappingURL=main.js.map