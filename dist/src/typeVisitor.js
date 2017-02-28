"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rp = require("raml-1-parser");
var ti = rp.ds.rt;
var tsm = require("ts-model");
var ts_model_1 = require("ts-model");
var TypeKind;
(function (TypeKind) {
    TypeKind[TypeKind["VALUE"] = 0] = "VALUE";
    TypeKind[TypeKind["OBJECT"] = 1] = "OBJECT";
    TypeKind[TypeKind["ARRAY"] = 2] = "ARRAY";
    TypeKind[TypeKind["UNION"] = 3] = "UNION";
    TypeKind[TypeKind["EXTERNAL"] = 4] = "EXTERNAL";
})(TypeKind = exports.TypeKind || (exports.TypeKind = {}));
var TypeVisitorInfo = (function () {
    function TypeVisitorInfo() {
        this.superTypes = [];
    }
    return TypeVisitorInfo;
}());
exports.TypeVisitorInfo = TypeVisitorInfo;
var BasicPagingOperationTransformer = (function () {
    function BasicPagingOperationTransformer() {
    }
    BasicPagingOperationTransformer.prototype.operation = function (t) {
        var pg = t.annotations['basicPaging'];
        if (!pg) {
            return t;
        }
        if (pg) {
            t.parameters = t.parameters.filter(function (x) { return x.id != pg.page; });
        }
        if (t.result && pg.results) {
            t.result = t.result.properties[pg.results];
        }
        t.type = "view";
        Object.keys(t.annotations).forEach(function (a) {
            t[a] = t.annotations[a];
        });
        if (t.result) {
            Object.keys(t.result).forEach(function (x) {
                if (!t[x]) {
                    t[x] = t.result[x];
                }
            });
        }
        delete t.result;
        t["paging"] = true;
        return t;
    };
    return BasicPagingOperationTransformer;
}());
exports.BasicPagingOperationTransformer = BasicPagingOperationTransformer;
var CRUDOperationsTransformer = (function () {
    function CRUDOperationsTransformer() {
    }
    CRUDOperationsTransformer.prototype.operation = function (t, emmitter) {
        if (t.annotations) {
            this.recordLink(t, "create", emmitter, "constructors");
            this.recordLink(t, "update", emmitter, "updaters");
            this.recordLink(t, "delete", emmitter, "destructors");
            this.recordLink(t, "details", emmitter, "details");
            this.recordLink(t, "list", emmitter, "listers");
            this.recordLink(t, "memberCollection", emmitter, "memberCollections");
        }
        return t;
    };
    CRUDOperationsTransformer.prototype.recordLink = function (t, originalAName, emmitter, aName) {
        var pg = Object.keys(t.annotations).indexOf(originalAName);
        if (pg != -1) {
            var target;
            if (t.annotations[originalAName]) {
                target = emmitter.idToType[t.annotations[originalAName]];
            }
            else {
                t.parameters.forEach(function (x) {
                    if (x.location == "body") {
                        if (typeof x.type == "string") {
                            target = emmitter.idToType[x.type];
                        }
                    }
                });
                if (aName == "listers" && t.result) {
                    target = emmitter.idToType[t.result.itemType];
                    t.type = t.result;
                }
            }
            if (target) {
                if (aName == "memberCollections") {
                    if (!target.properties) {
                        target.properties = {};
                    }
                    target.properties[t.id] = {
                        id: "",
                        displayName: t.displayName,
                        description: t.description,
                        type: t.id
                    };
                    t.type = "view";
                    return;
                }
                emmitter.recordExtraMeta(aName, target, t.id);
            }
        }
    };
    return CRUDOperationsTransformer;
}());
exports.CRUDOperationsTransformer = CRUDOperationsTransformer;
var operationTransformers = [new CRUDOperationsTransformer(), new BasicPagingOperationTransformer()];
var TypeVisitor = (function () {
    function TypeVisitor() {
        this.tm = new Map();
        this.unitPaths = new Map();
        this.unitIds = {};
    }
    TypeVisitor.prototype.unitPath = function (pType) {
        var source = pType.getExtra("SOURCE");
        var name = pType.name();
        var p = source._node._unit._apath;
        return name;
    };
    TypeVisitor.prototype.unitId = function (pType) {
        var source = pType.getExtra("SOURCE");
        if (!source) {
            return null;
        }
        var path = "";
        if (!source.root) {
            source = source._node.unit().highLevel();
            path = source._node.unit().absolutePath();
        }
        else {
            path = source.lowLevel().unit().absolutePath();
        }
        if (this.unitIds[path]) {
            return this.unitIds[path];
        }
        source = source.root();
        var result = this.idOfUnit(source);
        this.unitIds[path] = result;
        return result;
    };
    TypeVisitor.prototype.hlRoot = function (pType) {
        var source = pType.getExtra("SOURCE");
        if (!source) {
            return null;
        }
        var path = "";
        if (!source.root) {
            source = source._node.unit().highLevel();
        }
        source = source.root();
        return source;
    };
    TypeVisitor.prototype.idOfUnit = function (source) {
        var result = null;
        source.children().forEach(function (x) {
            var a = x.asAttr();
            if (a) {
                if (a.name() == "annotations") {
                    var v = a.value();
                    var obj = v.lowLevel().dumpToObject();
                    if (obj["(id)"]) {
                        result = obj["(id)"];
                    }
                }
            }
        });
        return result;
    };
    TypeVisitor.prototype.visit = function (t) {
        return this.visitStructure(t.runtimeType());
    };
    TypeVisitor.prototype.visitObject = function (t, inf) {
    };
    TypeVisitor.prototype.visitOther = function (t, inf) {
    };
    TypeVisitor.prototype.visitStructure = function (t) {
        var _this = this;
        if (this.tm.has(t)) {
            return this.tm.get(t);
        }
        var ti = new TypeVisitorInfo();
        ti.name = t.nameId();
        this.tm.set(t, ti);
        if (t.isBuiltIn()) {
            ti.builtIn = true;
        }
        t.superTypes().forEach(function (s) {
            ti.superTypes.push(_this.visitStructure(s));
        });
        if (t.hasExternalInHierarchy()) {
            ti.kind = TypeKind.EXTERNAL;
        }
        else if (t.isObject()) {
            ti.kind = TypeKind.OBJECT;
            this.visitObject(t, ti);
        }
        else {
            this.visitOther(t, ti);
        }
        return ti;
    };
    return TypeVisitor;
}());
exports.TypeVisitor = TypeVisitor;
var NameId = {
    StringType: "string",
    IntegerType: "number",
    NumberType: "number",
    BooleanType: "boolean"
};
var NameIdJS = {
    StringType: "string",
    IntegerType: "integer",
    NumberType: "number",
    BooleanType: "boolean"
};
function parsedType(t) {
    return t.getAdapters()[1];
}
exports.parsedType = parsedType;
var TypeScriptInterfaceEmmitter = (function (_super) {
    __extends(TypeScriptInterfaceEmmitter, _super);
    function TypeScriptInterfaceEmmitter() {
        var _this = _super.apply(this, arguments) || this;
        _this.defaultModule = new ts_model_1.TSAPIModule();
        _this.modules = {};
        return _this;
    }
    TypeScriptInterfaceEmmitter.prototype.getModule = function (t) {
        return this.defaultModule;
    };
    TypeScriptInterfaceEmmitter.prototype.toRef = function (t, reuseDeclarations) {
        if (reuseDeclarations === void 0) { reuseDeclarations = true; }
        if (t.isBuiltIn()) {
            var name = NameId[t.nameId()];
            if (!name) {
                name = "any";
            }
            return new ts_model_1.TSSimpleTypeReference(null, name);
        }
        else {
            if ((!reuseDeclarations) || !t.nameId()) {
                if (t.isArray()) {
                    return new ts_model_1.TSArrayReference(this.toRef(t.array().componentType()));
                }
                if (t.isUnion()) {
                    var rs = new ts_model_1.TSUnionTypeReference();
                    rs.addChild(this.toRef(t.union().leftType()));
                    rs.addChild(this.toRef(t.union().rightType()));
                    return rs;
                }
            }
            else {
                var info = this.visitStructure(t);
                return new ts_model_1.TSSimpleTypeReference(null, t.nameId());
            }
        }
        return null;
    };
    TypeScriptInterfaceEmmitter.prototype.visitObject = function (t, inf) {
        var _this = this;
        if (t.isBuiltIn()) {
            return;
        }
        var module = this.getModule(t);
        var int = new ts_model_1.TSInterface(module, t.nameId());
        int.extends = inf.superTypes.filter(function (x) { return !x.builtIn; }).map(function (x) { return new ts_model_1.TSSimpleTypeReference(null, x.name); });
        t.properties().forEach(function (x) {
            var decl = new tsm.TSAPIElementDeclaration(int, x.nameId());
            decl.optional = !x.isRequired();
            decl.rangeType = _this.toRef(x.range());
        });
    };
    TypeScriptInterfaceEmmitter.prototype.visitOther = function (t, inf) {
        if (t.isBuiltIn()) {
            return;
        }
        var module = this.getModule(t);
        var res = new ts_model_1.TSTypeAssertion(module, t.nameId(), this.toRef(t, false));
        res.extends = [];
    };
    return TypeScriptInterfaceEmmitter;
}(TypeVisitor));
exports.TypeScriptInterfaceEmmitter = TypeScriptInterfaceEmmitter;
exports.Ignored = {
    hasProperty: true,
    notScalar: true,
    typeOf: true,
    hasPropertiesFacet: true
};
var ReferenceKind;
(function (ReferenceKind) {
    ReferenceKind[ReferenceKind["NONE"] = 0] = "NONE";
    ReferenceKind[ReferenceKind["TYPE"] = 1] = "TYPE";
    ReferenceKind[ReferenceKind["PROPERTY"] = 2] = "PROPERTY";
})(ReferenceKind = exports.ReferenceKind || (exports.ReferenceKind = {}));
function transfer(f, target) {
    target[f.facetName()] = f.value();
}
var JavaScriptMetaEmmitter = (function (_super) {
    __extends(JavaScriptMetaEmmitter, _super);
    function JavaScriptMetaEmmitter() {
        var _this = _super.call(this) || this;
        _this.facetMap = {};
        _this.extraTypes = {};
        _this.visited = new Map();
        _this.extraMeta = new Map();
        _this.idToType = {};
        _this.facetMap["discriminatorValue"] = function (t, f, target) {
            if (f.value() == t.name()) {
                return;
            }
            transfer(f, target);
        };
        _this.facetMap["items"] = function (t, f, target) {
            var vl = _this.emitType(f);
            if (!vl.id) {
                target["itemType"] = vl;
            }
            else {
                target["itemType"] = vl.id;
            }
        };
        _this.facetMap["propertyIs"] = function (t, f, target) {
            var vl = _this.emitType(f);
            if (!target["properties"]) {
                var p = {};
                target["properties"] = p;
            }
            if (!vl.id) {
                target["properties"][f.name] = vl;
            }
            else {
                target["properties"][f.name] = vl.id;
            }
        };
        _this.facetMap["mapPropertyIs"] = function (t, f, target) {
            var vl = _this.emitType(f);
            if (!target["componentType"]) {
                var p = {};
                target["componentType"] = p;
            }
            if (!vl.id) {
                target["componentType"] = vl;
            }
            else {
                target["componentType"] = vl.id;
            }
        };
        return _this;
    }
    JavaScriptMetaEmmitter.prototype.emitType = function (f) {
        var vl = this.processParsedType(f.type, false);
        return vl;
    };
    JavaScriptMetaEmmitter.prototype.visitResource = function (t) {
        var _this = this;
        return t.methods().map(function (x) { return _this.visitMethod(x); });
    };
    JavaScriptMetaEmmitter.prototype.visitSecurityDefinition = function (t) {
        return {
            id: t.name(),
            kind: t.type(),
            displayName: t.displayName(),
            description: t.description() ? t.description().value() : "",
            settings: t.settings() ? t.settings().toJSON() : {}
        };
    };
    JavaScriptMetaEmmitter.prototype.normalizeId = function (s) {
        var rs = "";
        for (var i = 0; i < s.length; i++) {
            var c = s.charAt(i);
            if (c == '/') {
                c = "_";
            }
            if (c == '{') {
                c = "_";
            }
            if (c == '}') {
                c = "_";
            }
            if (c == ' ') {
                c = "_";
            }
            if (c == ':') {
                c = "_";
            }
            rs += c;
        }
        return rs;
    };
    JavaScriptMetaEmmitter.prototype.needTransform = function (namespace, annotationName, t) {
        var usedLibrary = null;
        t.uses().forEach(function (x) {
            if (x.key() == namespace) {
                usedLibrary = x.ast();
            }
        });
        var result = ReferenceKind.NONE;
        usedLibrary.annotationTypes().forEach(function (x) {
            if (x.name() == annotationName) {
                var tp = x.type();
                tp.forEach(function (n) {
                    if (n.indexOf("RAMLReferenceExpression") != -1) {
                        result = ReferenceKind.PROPERTY;
                    }
                    if (n.indexOf("RAMLTypeName") != -1) {
                        result = ReferenceKind.TYPE;
                    }
                });
            }
        });
        return result;
    };
    JavaScriptMetaEmmitter.prototype.remapUnit = function (namespace, t) {
        var usedLibrary = null;
        t.uses().forEach(function (x) {
            if (x.key() == namespace) {
                usedLibrary = x.ast();
            }
        });
        if (usedLibrary) {
            var p = usedLibrary.highLevel().lowLevel().unit().absolutePath();
            var i = p.lastIndexOf('/');
            if (i != -1) {
                p = p.substring(i + 1);
            }
            i = p.lastIndexOf('.');
            if (i != -1) {
                p = p.substring(0, i);
            }
            return p;
        }
        return namespace;
    };
    JavaScriptMetaEmmitter.prototype.visitMethod = function (t) {
        var _this = this;
        var id = t.methodId();
        var dn = t.displayName() ? t.displayName() : t.parentResource().displayName();
        if (!dn) {
            dn = "";
        }
        if (dn.indexOf("/") == 0) {
            dn = dn.substring(1);
        }
        if (dn.length > 1) {
            dn = dn.charAt(0).toUpperCase() + dn.substring(1);
        }
        var result = {
            id: this.normalizeId(t.methodId()),
            baseUri: t.ownerApi().baseUri() ? t.ownerApi().baseUri().value() : null,
            displayName: dn,
            description: t.description() ? t.description().value() : null,
            url: t.parentResource().completeRelativeUri(),
            method: t.method(),
            parameters: [],
            annotations: {},
            result: null,
            executorId: "rest"
        };
        var sec = t.securedBy();
        if (!sec) {
            sec = t.parentResource().securedBy();
        }
        if (!sec) {
            sec = t.ownerApi().securedBy();
        }
        if (sec) {
            result.securedBy = sec.map(function (x) { return x ? x.name() : null; });
        }
        t.queryParameters().forEach(function (x) {
            var parameterInfo = _this.visitStructure(x.runtimeType()).payload;
            parameterInfo.location = "query";
            parameterInfo.id = x.name();
            parameterInfo.displayName = x.displayName();
            result.parameters.push(parameterInfo);
        });
        var pr = t.parentResource();
        while (pr) {
            pr.uriParameters().forEach(function (x) {
                var parameterInfo = _this.visitStructure(x.runtimeType()).payload;
                parameterInfo.required = true;
                parameterInfo.location = "uri";
                parameterInfo.id = x.name();
                parameterInfo.displayName = x.displayName();
                result.parameters.push(parameterInfo);
            });
            pr = pr.parentResource();
        }
        t.headers().forEach(function (x) {
            var parameterInfo = _this.visitStructure(x.runtimeType()).payload;
            parameterInfo.required = true;
            parameterInfo.location = "header";
            parameterInfo.id = x.name();
            parameterInfo.displayName = x.displayName();
            result.parameters.push(parameterInfo);
        });
        if (t.body() && t.body().length > 0) {
            var parameterInfo = this.visitStructure(t.body()[0].runtimeType()).payload;
            parameterInfo.required = true;
            parameterInfo.location = "body";
            result.parameters.push(parameterInfo);
        }
        var annotations = t.parentResource().annotations();
        var annotations = annotations.concat(t.annotations());
        var anDump = annotations.map(function (x) { return x.highLevel().lowLevel().dumpToObject(true); });
        var clearedAnnotations = {};
        anDump.forEach(function (x) {
            Object.keys(x).forEach(function (y) {
                var n = y.substring(1, y.length - 1);
                if (n.indexOf('.') != -1) {
                    var libPrefix = n.substring(0, n.indexOf('.'));
                    n = n.substring(n.indexOf('.') + 1);
                    var nt = _this.needTransform(libPrefix, n, t.ownerApi());
                    if (nt != ReferenceKind.NONE) {
                        var vl = x[y];
                        if (vl && typeof vl == "string") {
                            var fd = vl.indexOf('.');
                            if (fd != -1) {
                                var namespace = vl.substring(0, fd);
                                if (true) {
                                    var newName = _this.remapUnit(namespace, t.ownerApi());
                                    vl = newName + "_" + vl.substring(fd + 1);
                                    x[y] = vl;
                                }
                            }
                        }
                    }
                }
                clearedAnnotations[n] = x[y];
            });
        });
        result.annotations = clearedAnnotations;
        t.responses().forEach(function (x) {
            if (x.isOkRange()) {
                if (x.body()) {
                    var tp = _this.visitStructure(x.body()[0].runtimeType());
                    result.result = tp.payload;
                }
            }
        });
        for (var i = 0; i < operationTransformers.length; i++) {
            result = operationTransformers[i].operation(result, this);
        }
        return result;
    };
    JavaScriptMetaEmmitter.prototype.visitObject = function (t, inf) {
        if (t.isBuiltIn()) {
            return;
        }
        var rs = this.emit(t, inf);
    };
    JavaScriptMetaEmmitter.prototype.gatherTypes = function (t) {
        var _this = this;
        var rs = [];
        t.forEach(function (x) {
            if (x._options) {
                rs = rs.concat(_this.gatherTypes(x._options));
            }
            else {
                rs.push(x);
            }
        });
        return rs;
    };
    JavaScriptMetaEmmitter.prototype.emit = function (t, inf) {
        var pType = parsedType(t);
        inf.payload = this.processParsedType(pType);
        return inf.payload;
    };
    JavaScriptMetaEmmitter.prototype.simpleName = function (name) {
        var i = name.indexOf('.');
        if (name.indexOf('.') != -1) {
            return name.substring(i + 1);
        }
    };
    JavaScriptMetaEmmitter.prototype.alias = function (pType) {
        var source = pType.getExtra("SOURCE");
        var name = pType.name();
        var id = this.unitId(pType);
        if (id == "http://raml.org/core.extensions") {
            return name;
        }
        if (!name) {
            var nm = pType.getExtra("nominal");
            name = nm._name;
        }
        if (source && name) {
            var p = source._node.unit().absolutePath();
            if (p != this.defaultPath) {
                var i = p.lastIndexOf('/');
                if (i != -1) {
                    p = p.substring(i + 1);
                }
                i = p.lastIndexOf('.');
                if (i != -1) {
                    p = p.substring(0, i);
                }
                return p + '_' + name;
            }
            return name;
        }
        return name;
    };
    JavaScriptMetaEmmitter.prototype.isExternal = function (pType) {
        var source = pType.getExtra("SOURCE");
        if (!source) {
            return false;
        }
        var name = pType.name();
        var id = this.unitId(pType);
        if (id == "http://raml.org/core.extensions") {
            return false;
        }
        if (!name) {
            var nm = pType.getExtra("nominal");
            return false;
        }
        if (source) {
            var p = source._node.unit().absolutePath();
            if (p != this.defaultPath) {
                return true;
            }
        }
        return false;
    };
    JavaScriptMetaEmmitter.prototype.recordExtraMeta = function (name, t, value) {
        var mm = t;
        var meta = mm[name];
        if (!meta) {
            meta = [];
            mm[name] = meta;
        }
        meta.push(value);
    };
    JavaScriptMetaEmmitter.prototype.processParsedType = function (pType, global) {
        var _this = this;
        if (global === void 0) { global = true; }
        if (this.visited.has(pType)) {
            return this.visited.get(pType);
        }
        var s = this.alias(pType);
        if (!s) {
            if (pType.isArray()) {
                if (pType.subTypes().length == 1) {
                    s = pType.subTypes()[0].name();
                }
            }
        }
        else {
            global = true;
        }
        var superTypes = [];
        var supers = [];
        var f = pType.declaredFacets();
        pType.superTypes().forEach(function (x) {
            if (!x.name()) {
                f = f.concat(x.declaredFacets());
                supers = supers.concat(x.superTypes());
            }
            else {
                supers.push(x);
            }
        });
        supers.forEach(function (x) {
            _this.processParsedType(x);
            superTypes.push(_this.alias(x));
        });
        var rs = s ? { id: s } : {};
        if (global) {
            this.idToType[s] = rs;
        }
        this.visited.set(pType, rs);
        if (this.extraMeta.has(pType)) {
            var extra = this.extraMeta.get(pType);
            Object.keys(extra).forEach(function (x) {
                rs[x] = extra[x];
            });
        }
        if (pType.isUnion()) {
            if (superTypes.length == 0) {
                superTypes.push("union");
            }
            var v = this.gatherTypes(pType._options);
            rs["options"] = v.map(function (x) { return _this.alias(x); });
        }
        if (f.filter(function (x) { return x.facetName() == "mapPropertyIs"; }).length > 0) {
            superTypes = ["map"];
        }
        if (superTypes.length == 1) {
            rs["type"] = superTypes[0];
        }
        else {
            rs["type"] = superTypes;
        }
        f.forEach(function (x) {
            if (exports.Ignored[x.facetName()]) {
                return;
            }
            if (_this.facetMap[x.facetName()]) {
                _this.facetMap[x.facetName()](pType, x, rs);
                return;
            }
            if (x.kind() == ti.tsInterfaces.MetaInformationKind.Annotation) {
                var vl = x.value();
                var fn = x.facetName();
                var rsi = fn.indexOf('.');
                rs[_this.simpleName(x.facetName())] = x.value();
                if (rsi != -1) {
                    var libPrefix = fn.substring(0, rsi);
                    var n = fn.substring(rsi + 1);
                    var api = _this.hlRoot(pType).wrapperNode();
                    var nt = _this.needTransform(libPrefix, n, api);
                    if (nt != ReferenceKind.NONE) {
                        if (vl && typeof vl == "string") {
                            var fd = vl.indexOf('.');
                            if (fd != -1) {
                                var namespace = vl.substring(0, fd);
                                if (true) {
                                    var newName = _this.remapUnit(namespace, api);
                                    if (newName != namespace) {
                                        vl = newName + "_" + vl.substring(fd + 1);
                                        rs[_this.simpleName(x.facetName())] = vl;
                                    }
                                }
                            }
                        }
                    }
                }
                return;
            }
            rs[x.facetName()] = x.value();
        });
        this.appendRequiredInfo(pType, rs);
        var props = {};
        if (Object.keys(props).length > 0) {
            rs.properties = props;
        }
        if (this.isExternal(pType)) {
            if (rs.id) {
                this.extraTypes[rs.id] = rs;
            }
        }
        if (rs["computedProperties"]) {
            var cp = rs["computedProperties"];
            Object.keys(cp).forEach(function (x) {
                if (!rs["properties"]) {
                    rs["properties"] = {};
                }
                var props = rs["properties"];
                var prop = {};
                var val = cp[x];
                if (typeof val == "string") {
                    props[x] = {
                        type: "string",
                        computeFunction: val,
                        readonly: true,
                        virtual: true
                    };
                }
                else {
                    props[x] = val;
                }
            });
        }
        if (rs["foreignProperties"]) {
            var cp = rs["foreignProperties"];
            Object.keys(cp).forEach(function (x) {
                if (!rs["properties"]) {
                    rs["properties"] = {};
                }
                var props = rs["properties"];
                var prop = {};
                var val = cp[x];
                if (typeof val == "string") {
                    props[x] = {
                        type: "string",
                        remote: val,
                        readonly: true,
                        virtual: true
                    };
                }
                else {
                    props[x] = val;
                }
            });
        }
        return rs;
    };
    JavaScriptMetaEmmitter.prototype.appendRequiredInfo = function (pType, rs) {
        pType.declaredFacets().filter(function (x) { return x.facetName() == "hasProperty"; }).forEach(function (x) {
            var pr = rs["properties"][x.value()];
            if (!pr) {
                console.log("Ahtung");
            }
            else {
                if (typeof pr == "string") {
                    pr = {
                        type: pr
                    };
                    rs["properties"][x.value()] = pr;
                }
                pr["required"] = true;
            }
        });
    };
    JavaScriptMetaEmmitter.prototype.visitOther = function (t, inf) {
        if (t.isBuiltIn()) {
            return;
        }
        var rs = this.emit(t, inf);
    };
    return JavaScriptMetaEmmitter;
}(TypeVisitor));
exports.JavaScriptMetaEmmitter = JavaScriptMetaEmmitter;
//# sourceMappingURL=typeVisitor.js.map