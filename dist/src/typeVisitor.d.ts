import rp = require("raml-1-parser");
import ti = rp.ds.rt;
import tsm = require("ts-model");
import rtb = require("raml-type-bindings");
import { TSAPIModule, TSModelElement } from "ts-model";
export declare enum TypeKind {
    VALUE = 0,
    OBJECT = 1,
    ARRAY = 2,
    UNION = 3,
    EXTERNAL = 4,
}
export declare class TypeVisitorInfo<Payload> {
    name: string;
    namespace: string;
    superTypes: TypeVisitorInfo<Payload>[];
    kind: TypeKind;
    builtIn: boolean;
    payload: Payload;
}
export interface OperationTransformer {
    operation(t: rtb.Operation, emmitter: JavaScriptMetaEmmitter): rtb.Operation;
}
export declare class BasicPagingOperationTransformer implements OperationTransformer {
    operation(t: rtb.Operation): rtb.Operation;
}
export declare class CRUDOperationsTransformer implements OperationTransformer {
    operation(t: rtb.Operation, emmitter: JavaScriptMetaEmmitter): rtb.Operation;
    private recordLink(t, originalAName, emmitter, aName);
}
export declare class TypeVisitor<T> {
    tm: Map<rp.hl.ITypeDefinition, TypeVisitorInfo<T>>;
    unitPaths: Map<ti.IParsedType, string>;
    unitIds: {
        [name: string]: string;
    };
    unitPath(pType: ti.IParsedType): string;
    unitId(pType: ti.IParsedType): string;
    hlRoot(pType: ti.IParsedType): rp.hl.IHighLevelNode;
    private idOfUnit(source);
    visit(t: rp.api10.TypeDeclaration): TypeVisitorInfo<T>;
    visitObject(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<T>): void;
    visitOther(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<T>): void;
    visitStructure(t: rp.hl.ITypeDefinition): TypeVisitorInfo<T>;
}
export declare function parsedType(t: rp.hl.ITypeDefinition): ti.IParsedType;
export declare class TypeScriptInterfaceEmmitter extends TypeVisitor<TSModelElement<any>> {
    readonly defaultModule: TSAPIModule;
    readonly modules: {
        [name: string]: TSAPIModule;
    };
    getModule(t: rp.hl.ITypeDefinition): TSAPIModule;
    toRef(t: rp.hl.ITypeDefinition, reuseDeclarations?: boolean): tsm.TSTypeReference<any>;
    visitObject(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<TSModelElement<any>>): void;
    visitOther(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<TSModelElement<any>>): void;
}
export declare const Ignored: {
    hasProperty: boolean;
    notScalar: boolean;
    typeOf: boolean;
    hasPropertiesFacet: boolean;
};
export declare enum ReferenceKind {
    NONE = 0,
    TYPE = 1,
    PROPERTY = 2,
}
export declare class JavaScriptMetaEmmitter extends TypeVisitor<TSModelElement<any>> {
    private facetMap;
    defaultPath: string;
    emitType(f: ti.ITypeFacet): any;
    visitResource(t: rp.api10.Resource): rtb.Operation[];
    visitSecurityDefinition(t: rp.api10.AbstractSecurityScheme): rtb.SecuritySchemeDefinition;
    normalizeId(s: string): string;
    needTransform(namespace: string, annotationName: string, t: rp.api10.Api | rp.api10.Library): ReferenceKind;
    remapUnit(namespace: string, t: rp.api10.Api | rp.api10.Library): string;
    visitMethod(t: rp.api10.Method): rtb.Operation;
    constructor();
    visitObject(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<any>): void;
    gatherTypes(t: any[]): any[];
    private emit(t, inf);
    simpleName(name: string): string;
    extraTypes: {
        [name: string]: any;
    };
    visited: Map<ti.IParsedType, any>;
    alias(pType: ti.IParsedType): string;
    isExternal(pType: ti.IParsedType): boolean;
    extraMeta: Map<ti.IParsedType, any>;
    recordExtraMeta(name: string, t: rtb.Type, value: any): void;
    idToType: {
        [name: string]: any;
    };
    private processParsedType(pType, global?);
    private appendRequiredInfo(pType, rs);
    visitOther(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<any>): void;
}
