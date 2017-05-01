import rp=require("raml-1-parser")
import ti=rp.ds.rt;
import tsm=require("ts-model");

import rtb=require("raml-type-bindings");
import {
    TSAPIModule, TSInterface, TSSimpleTypeReference, TSModelElement, TSMember, TSArrayReference,
    TSUnionTypeReference, TSTypeAssertion
} from "ts-model";
import {Operation} from "raml-1-parser/dist/raml1/artifacts/raml10parserapi";
import {type} from "os";

export enum TypeKind{
    VALUE,
    OBJECT,
    ARRAY,
    UNION,
    EXTERNAL
}

export class TypeVisitorInfo<Payload> {
    name: string
    namespace: string
    superTypes: TypeVisitorInfo<Payload>[] = [];
    kind: TypeKind
    builtIn: boolean
    payload: Payload
    //objectRepresentation: any
}

export interface OperationTransformer{
    operation(t:rtb.Operation,emmitter:JavaScriptMetaEmmitter):rtb.Operation
}
export class BasicPagingOperationTransformer implements OperationTransformer{

    operation(t:rtb.Operation):rtb.Operation{
        var pg=t.annotations['basicPaging'];
        if (!pg){
            return t;
        }
        if (pg){
            t.parameters=t.parameters.filter(x=>x.id!=pg.page)
        }
        if (t.result&&pg.results){
            t.result=<any>(<rtb.ObjectType>t.result).properties[pg.results];
        }
        (<any>t).type="view";
        Object.keys(t.annotations).forEach(a=>{
            t[a]=t.annotations[a];
        })
        if (t.result) {
            Object.keys(t.result).forEach(x => {
                if (!t[x]) {
                    t[x] = t.result[x];
                }
            })
        }
        //delete t.annotations;
        delete t.result;
        t["paging"]=true;
        return t;
    }
}

export class CRUDOperationsTransformer implements OperationTransformer{

    operation(t:rtb.Operation,emmitter:JavaScriptMetaEmmitter):rtb.Operation{
        if (t.annotations) {
            this.recordLink(t, "create", emmitter, "constructors");
            this.recordLink(t, "update", emmitter, "updaters");
            this.recordLink(t, "delete", emmitter, "destructors");
            this.recordLink(t, "details", emmitter, "details");
            this.recordLink(t, "list", emmitter, "listers");
            this.recordLink(t, "memberCollection", emmitter, "memberCollections");
        }
        return t;
    }

    private recordLink(t: rtb.Operation, originalAName: string, emmitter: JavaScriptMetaEmmitter, aName: string) {
        var pg = Object.keys(t.annotations).indexOf(originalAName);
        if (pg != -1) {
            var target: rtb.Type;
            if (t.annotations[originalAName]){
                target = emmitter.idToType[t.annotations[originalAName]];
            }
            else {
                t.parameters.forEach(x => {
                    if (x.location == "body") {
                        if (typeof x.type == "string") {
                            target = emmitter.idToType[x.type];
                        }
                    }
                })
                if (aName=="listers"&&t.result){
                    target=emmitter.idToType[<string>(<rtb.ArrayType>t.result).itemType];
                    t.type=t.result;
                    //delete t.result;
                }

            }
            if (target) {
                if (aName=="memberCollections"){
                    if (!(<rtb.ObjectType>target).properties){
                        (<rtb.ObjectType>target).properties={};
                    }
                    (<rtb.ObjectType>target).properties[t.id]={
                        id: "",
                        displayName: t.displayName,
                        description: t.description,
                        type: t.id
                    }
                    t.type="view";

                    //hehe
                    return;
                }
                emmitter.recordExtraMeta(aName, target, t.id);
            }
        }
    }
}

let operationTransformers:OperationTransformer[]=[new CRUDOperationsTransformer(),new BasicPagingOperationTransformer()]
export class TypeVisitor<T> {

    tm: Map<rp.hl.ITypeDefinition,TypeVisitorInfo<T> > = new Map();

    unitPaths: Map<ti.IParsedType,string> = new Map();
    unitIds: { [name:string]:string} ={};

    unitPath(pType: ti.IParsedType){
        var source=pType.getExtra("SOURCE");
        let name = pType.name();

        var p = source._node._unit._apath;

        return name;
    }

    unitId(pType: ti.IParsedType){
        var source:rp.hl.IHighLevelNode=pType.getExtra("SOURCE");
        if (!source){
            return null;
        }
        var path="";
        if (!source.root){
            source=(<any>source)._node.unit().highLevel();
            path=(<any>source)._node.unit().absolutePath();
        }
        else{
            path=source.lowLevel().unit().absolutePath();
        }
        if (this.unitIds[path]){
            return this.unitIds[path];
        }
        source=source.root();
        var result = this.idOfUnit(source);
        this.unitIds[path]=result;
        return result;
    }
    hlRoot(pType: ti.IParsedType){
        var source:rp.hl.IHighLevelNode=pType.getExtra("SOURCE");
        if (!source){
            return null;
        }
        var path="";
        if (!source.root){
            source=(<any>source)._node.unit().highLevel();
            //path=(<any>source)._node.unit().absolutePath();
        }
        source=source.root();
        return source;
    }
    private idOfUnit(source:rp.hl.IHighLevelNode) {
        var result: string = null;
        source.children().forEach(x => {
            let a = x.asAttr();
            if (a) {
                if (a.name() == "annotations") {
                    let v = a.value();
                    var obj = v.lowLevel().dumpToObject();
                    if (obj["(id)"]) {
                        result = obj["(id)"];
                    }
                }
            }
        })
        return result;
    }

    visit(t: rp.api10.TypeDeclaration) {
        return this.visitStructure(t.runtimeType());
    }




    visitObject(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<T>) {

    }

    visitOther(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<T>) {

    }

    visitStructure(t: rp.hl.ITypeDefinition): TypeVisitorInfo<T> {
        if (this.tm.has(t)) {
            return this.tm.get(t);
        }
        let ti = new TypeVisitorInfo<T>();
        ti.name = t.nameId();

        this.tm.set(t, ti);
        if (t.isBuiltIn()) {
            ti.builtIn = true;
        }
        t.superTypes().forEach(s => {
            ti.superTypes.push(this.visitStructure(s))
        })
        if (t.hasExternalInHierarchy()) {
            ti.kind = TypeKind.EXTERNAL
            //this is an external type
        }
        else if (t.isObject()) {
            ti.kind = TypeKind.OBJECT
            this.visitObject(t, ti);
            //object case
        }
        else {
            this.visitOther(t, ti)
        }
        return ti;
    }
}
const NameId = {
    StringType: "string",
    IntegerType: "number",
    NumberType: "number",
    BooleanType: "boolean"
}

const NameIdJS = {
    StringType: "string",
    IntegerType: "integer",
    NumberType: "number",
    BooleanType: "boolean"
}

export function parsedType(t: rp.hl.ITypeDefinition): ti.IParsedType {
    return t.getAdapters()[1]
}
export class TypeScriptInterfaceEmmitter extends TypeVisitor<TSModelElement<any>> {

    readonly defaultModule: TSAPIModule = new TSAPIModule();
    readonly modules: {[name: string]: TSAPIModule} = {};

    getModule(t: rp.hl.ITypeDefinition): TSAPIModule {
        return this.defaultModule;
    }



    toRef(t: rp.hl.ITypeDefinition, reuseDeclarations: boolean = true): tsm.TSTypeReference<any> {
        if (t.isBuiltIn()) {
            var name = NameId[t.nameId()];
            if (!name) {
                name = "any"
            }
            return new TSSimpleTypeReference(null, name);
        }
        else {
            if ((!reuseDeclarations) || !t.nameId()) {
                if (t.isArray()) {
                    return new TSArrayReference(this.toRef(t.array().componentType()));
                }
                if (t.isUnion()) {
                    var rs = new TSUnionTypeReference();
                    rs.addChild(this.toRef(t.union().leftType()));
                    rs.addChild(this.toRef(t.union().rightType()));
                    return rs;
                }
            }
            else {
                var info = this.visitStructure(t);
                return new TSSimpleTypeReference(null, t.nameId());
            }
        }
        return null;
    }

    visitObject(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<TSModelElement<any>>) {
        if (t.isBuiltIn()) {
            return;
        }
        var module = this.getModule(t);
        var int = new TSInterface(module, t.nameId());
        int.extends = inf.superTypes.filter(x => !x.builtIn).map(x => new TSSimpleTypeReference(null, x.name));
        t.properties().forEach(x => {
            var decl = new tsm.TSAPIElementDeclaration(int, x.nameId());
            decl.optional = !x.isRequired();
            //if (x.)
            decl.rangeType = this.toRef(x.range());

        })
    }

    visitOther(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<TSModelElement<any>>) {
        if (t.isBuiltIn()) {
            return;
        }
        var module = this.getModule(t);
        var res = new TSTypeAssertion(module, t.nameId(), this.toRef(t, false));
        (<any>res).extends = [];
    }
}

export const Ignored = {
    hasProperty: true,
    //propertyIs: true,
    notScalar: true,
    typeOf: true,
    hasPropertiesFacet: true
}
interface Emitter {
    (t: ti.IParsedType, f: ti.ITypeFacet, target: any);
}
export enum ReferenceKind{
    NONE,TYPE,PROPERTY
}

function transfer(f: ti.ITypeFacet, target: any) {
    target[f.facetName()] = f.value();
}

interface ITyped {
    type: ti.IParsedType
}
export class JavaScriptMetaEmmitter extends TypeVisitor<TSModelElement<any>> {


    private facetMap: {[name: string]: Emitter} = {}

    defaultPath:string

    emitType(f: ti.ITypeFacet) {

        var vl = this.processParsedType((<ITyped><any>f).type,false);
        return vl;
    }

    visitResource(t: rp.api10.Resource):rtb.Operation[] {
        return t.methods().map(x=>this.visitMethod(x));
    }

    visitSecurityDefinition(t: rp.api10.AbstractSecurityScheme):rtb.SecuritySchemeDefinition {
        return {
            id:t.name(),
            kind: t.type(),
            type: "securityDefinition",
            displayName: t.displayName(),
            description: t.description()?t.description().value():"",
            settings:t.settings()?t.settings().toJSON():{}
        }
    }
    normalizeId(s:string):string{
        var rs="";
        for (let i=0;i<s.length;i++){
            let c=s.charAt(i);
            if (c=='/'){
                c="_"
            }
            if (c=='{'){
                c="_"
            }
            if (c=='}'){
                c="_"
            }
            if (c==' '){
                c="_"
            }
            if (c==':'){
                c="_"
            }
            rs+=c;
        }
        return rs;
    }
    needTransform(namespace:string,annotationName:string,t:rp.api10.Api|rp.api10.Library):ReferenceKind{
        var usedLibrary:rp.api10.Library=null;
        t.uses().forEach(x=>{
            if (x.key()==namespace){
                usedLibrary=x.ast();
            }
        })
        var result=ReferenceKind.NONE;
        if (usedLibrary) {
            usedLibrary.annotationTypes().forEach(x => {
                if (x.name() == annotationName) {
                    var tp = x.type();
                    tp.forEach(n => {
                        if (n.indexOf("RAMLReferenceExpression") != -1) {
                            result = ReferenceKind.PROPERTY;
                        }
                        if (n.indexOf("RAMLTypeName") != -1) {
                            result = ReferenceKind.TYPE;
                        }
                    })
                }
            })
        }
        //this is strange
        return result;
    }
    remapUnit(namespace:string,t:rp.api10.Api|rp.api10.Library){
        var usedLibrary:rp.api10.Library=null;
        t.uses().forEach(x=>{
            if (x.key()==namespace){
                usedLibrary=x.ast();
            }
        })
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
    }
    visitMethod(t: rp.api10.Method) {
        var id=t.methodId();
        var dn=t.displayName()?t.displayName():t.parentResource().displayName();
        if (!dn){
            dn="";
        }
        if (dn.indexOf("/")==0){
            dn=dn.substring(1);

        }
        if (dn.length>1){
            dn=dn.charAt(0).toUpperCase()+dn.substring(1);
        }
        var result:rtb.Operation&any={
            id:this.normalizeId(t.methodId()),
            baseUri: t.ownerApi().baseUri()?t.ownerApi().baseUri().value():null,
            displayName:dn,
            description: t.description()?t.description().value():null,//
            url: t.parentResource().completeRelativeUri(),
            method: t.method(),
            parameters:[],
            annotations:{},
            relativeUrl:t.parentResource().relativeUri().value(),
            result:null,
            executorId: "rest"
        }
        var sec=t.securedBy();
        if (!sec){
            sec=t.parentResource().securedBy();
        }
        if (!sec){
            sec=t.ownerApi().securedBy();
        }
        if (sec){
            result.securedBy=sec.map(x=>x?x.name():null);
        }
        t.queryParameters().forEach(x=>{
            var parameterInfo:any=this.visitStructure(x.runtimeType()).payload;
            parameterInfo.location="query";
            parameterInfo.id=x.name();
            parameterInfo.displayName=x.displayName();
            result.parameters.push(parameterInfo);
        })
        var pr=t.parentResource();
        while (pr) {
            pr.uriParameters().forEach(x => {
                var parameterInfo: any = this.visitStructure(x.runtimeType()).payload;
                parameterInfo.required = true;
                parameterInfo.location = "uri";
                parameterInfo.id = x.name();
                parameterInfo.displayName = x.displayName();
                result.parameters.push(parameterInfo);
            });
            pr=pr.parentResource();
        }
        t.headers().forEach(x=>{
            var parameterInfo:any=this.visitStructure(x.runtimeType()).payload;
            parameterInfo.required=true;
            parameterInfo.location="header";
            parameterInfo.id=x.name();
            parameterInfo.displayName=x.displayName();
            result.parameters.push(parameterInfo);//
        });
        if (t.body()&&t.body().length>0){
            var parameterInfo:any=this.visitStructure(t.body()[0].runtimeType()).payload;
            parameterInfo.required=true;
            parameterInfo.location="body";
            result.parameters.push(parameterInfo);
        }
        var annotations=t.parentResource().annotations();
        var annotations=annotations.concat(t.annotations());
        var anDump=annotations.map(x=>x.highLevel().lowLevel().dumpToObject(true))
        var clearedAnnotations={};
        anDump.forEach(x=>{
            Object.keys(x).forEach(y=>{
                var n=y.substring(1,y.length-1);

                if (n.indexOf('.')!=-1){
                    //this is an annotation from a library
                    var libPrefix=n.substring(0,n.indexOf('.'));
                    n=n.substring(n.indexOf('.')+1);
                    var nt=this.needTransform(libPrefix,n,t.ownerApi());
                    if (nt!=ReferenceKind.NONE){

                        var vl=x[y];
                        if (vl&&typeof vl=="string") {
                            var fd = vl.indexOf('.');
                            if (fd != -1) {
                                var namespace = vl.substring(0,fd);
                                if (true){
                                    var newName=this.remapUnit(namespace,t.ownerApi());
                                    vl=newName+"_"+vl.substring(fd+1);
                                    x[y]=vl;
                                }
                                //console.log(vl);
                            }
                        }
                    }
                }
                clearedAnnotations[n]=x[y];
            })
        });
        (<any>result).annotations=clearedAnnotations;
        t.responses().forEach(x=>{
            if (x.isOkRange()){
                if (x.body()&&x.body().length>0){
                    var tp=this.visitStructure(x.body()[0].runtimeType());
                    result.result=<rtb.Type><any>tp.payload;
                }
            }
        })
        for (var i=0;i<operationTransformers.length;i++){
            result=operationTransformers[i].operation(result,this);
        }
        return result
    }



    constructor() {
        super()
        this.facetMap["discriminatorValue"] = (t: ti.IParsedType, f: ti.ITypeFacet, target: any) => {
            if (f.value() == t.name()) {
                return;
            }
            transfer(f, target);
        }
        this.facetMap["items"] = (t: ti.IParsedType, f: ti.ITypeFacet, target: any) => {
            var vl = this.emitType(f);
            if (!vl.id){
                target["itemType"]=vl;
            }
            else {
                target["itemType"] = vl.id;
            }
        }

        this.facetMap["propertyIs"] = (t: ti.IParsedType, f: ti.ITypeFacet, target: any) => {
            var vl = this.emitType(f);
            if (!target["properties"]){
                var p:any={};
                target["properties"]=p;
            }
            if (!vl.id) {
                target["properties"][(<any>f).name] = vl
            }
            else{
                target["properties"][(<any>f).name] = vl.id;
            }
        }
        this.facetMap["mapPropertyIs"] = (t: ti.IParsedType, f: ti.ITypeFacet, target: any) => {
            var vl = this.emitType(f);
            if (!target["componentType"]){
                var p:any={};
                target["componentType"]=p;
            }
            if (!vl.id) {
                target["componentType"] = vl
            }
            else{
                target["componentType"] = vl.id;
            }
        }
    }

    visitObject(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<any>) {
        if (t.isBuiltIn()) {
            return;
        }
        var rs = this.emit(t, inf);
        //console.log(JSON.stringify(rs,null,2))
    }
    gatherTypes(t:any[]):any[]{
        var rs=[];
        t.forEach(x=>{
            if (x._options){
                rs=rs.concat(this.gatherTypes(x._options));
            }
            else{
                rs.push(x);
            }
        })
        return rs;
    }

    private emit(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<any>): any {
        var pType = parsedType(t);
        inf.payload =this.processParsedType(pType);
        return inf.payload;
    }
    simpleName(name:string){
        var i=name.indexOf('.');
        if (name.indexOf('.')!=-1){
            return name.substring(i+1);
        }
    }

    extraTypes:{ [name:string]: any}={}

    visited:Map<ti.IParsedType,any>=new Map();

    alias(pType: ti.IParsedType){
        var source=pType.getExtra("SOURCE");
        let name = pType.name();
        var id=this.unitId(pType);
        if (id=="http://raml.org/core.extensions"){
            return name;
        }
        if (!name){
            var nm=pType.getExtra("nominal")
            name=nm._name;
        }
        if (source&&name) {
            var p =source._node.unit().absolutePath();
            if (p!=this.defaultPath){
               var i=p.lastIndexOf('/');
               if (i!=-1){
                   p=p.substring(i+1);
               }
               i=p.lastIndexOf('.');
               if (i!=-1){
                   p=p.substring(0,i);
               }

               return p+'_'+ name;
            }
            return name
        }
        return name;
    }
    isExternal(pType: ti.IParsedType){
        var source=pType.getExtra("SOURCE");
        if (!source){
            return false;
        }
        let name = pType.name();
        var id=this.unitId(pType);
        if (id=="http://raml.org/core.extensions"){
            return false;
        }
        if (!name){
            var nm=pType.getExtra("nominal")
            return false;
        }
        if (source) {
            var p = source._node.unit().absolutePath();
            if (p != this.defaultPath) {
                return true;
            }
        }
        return false;
    }
    extraMeta:Map<ti.IParsedType,any>=new Map();

    recordExtraMeta(name: string,t:rtb.Type,value:any){
        var mm=t;

        var meta=mm[name];
        if (!meta){
            meta=[]
            mm[name]=meta;
        }
        meta.push(value);
    }
    idToType: { [name:string]:any}={}
    private processParsedType(pType: ti.IParsedType,global=true) {
        if (this.visited.has(pType)){
            return this.visited.get(pType);
        }
        let s = this.alias(pType);
        if (!s){
            if (pType.isArray()){
                //it may be a global type definition
                if (pType.subTypes().length==1){
                    s=pType.subTypes()[0].name()
                }
            }


        }
        else{
            global=true;
        }
        var superTypes: string[] = []
        var supers:ti.IParsedType[]=[];
        var f=pType.declaredFacets();
        pType.superTypes().forEach(x=>{
            if (!x.name()){
                f=f.concat(x.declaredFacets());
                supers=supers.concat(x.superTypes());
            }
            else{
                supers.push(x);
            }
        })
        supers.forEach(x => {
            this.processParsedType(x);
            superTypes.push(this.alias(x));
        })
        var rs: any = s ? {id: s} : {};
        if (global) {
            this.idToType[s] = rs;
        }
        this.visited.set(pType,rs);
        if (this.extraMeta.has(pType)){
            var extra=this.extraMeta.get(pType);
            Object.keys(extra).forEach(x=>{
                rs[x]=extra[x];
            });
        }
        if (pType.isUnion()){
            if (superTypes.length==0){
                superTypes.push("union")
            }
            var opts=(<any>pType)._options;
            if (!opts){
                pType.superTypes().forEach(x=>{
                    if (!opts) {
                        opts = (<any>x)._options;
                    }
                })
            }
            var v=this.gatherTypes(opts);
            rs["options"]=v.map(x=>this.alias(x));
        }
        if (f.filter(x=>x.facetName()=="mapPropertyIs").length>0){
            superTypes=["map"]
        }
        if (superTypes.length == 1) {
            rs["type"] = superTypes[0];
        }
        else {
            rs["type"] = superTypes;
        }

        f.forEach(x => {
            if (Ignored[x.facetName()]) {
                return
            }
            if (this.facetMap[x.facetName()]) {
                this.facetMap[x.facetName()](pType, x, rs);
                return;
            }
            if (x.kind() == ti.tsInterfaces.MetaInformationKind.Annotation) {
                var vl=x.value();
                var fn=x.facetName();
                var rsi=fn.indexOf('.');
                rs[this.simpleName(x.facetName())] = x.value()
                if (rsi!=-1) {
                    var libPrefix=fn.substring(0,rsi);
                    var n=fn.substring(rsi+1);
                    var api=this.hlRoot(pType).wrapperNode();
                    var nt = this.needTransform(libPrefix, n,<rp.api10.Library>api);
                    if (nt != ReferenceKind.NONE) {

                        if (vl&&typeof  vl=="string") {
                            var fd = vl.indexOf('.');
                            if (fd != -1) {
                                var namespace = vl.substring(0, fd);
                                if (true) {
                                    var newName = this.remapUnit(namespace, <rp.api10.Library>api);
                                    if (newName!=namespace) {
                                        vl = newName + "_" + vl.substring(fd + 1);
                                        rs[this.simpleName(x.facetName())] = vl
                                    }
                                }
                                //console.log(vl);
                            }
                        }
                    }
                }
                return;
            }
            //console.log(x.facetName())
            rs[x.facetName()] = x.value()
        })
        this.appendRequiredInfo(pType, rs);
        var props = {};
        if (Object.keys(props).length > 0) {
            rs.properties = props;
        }
        if (this.isExternal(pType)){
            if (rs.id) {
                this.extraTypes[rs.id] = rs;
            }
        }
        if (rs["computedProperties"]){
            var cp=rs["computedProperties"];
            Object.keys(cp).forEach(x=>{
                if (!rs["properties"]){
                    rs["properties"]={};
                }
                var props=rs["properties"]
                var prop={};
                var val=cp[x];
                if (typeof val=="string"){
                    props[x]={
                        type: "string",
                        computeFunction: val,
                        readonly:true,
                        virtual: true
                    }

                }
                else{
                    props[x]=val;
                }
            })
        }
        if (rs["foreignProperties"]){
            var cp=rs["foreignProperties"];
            Object.keys(cp).forEach(x=>{
                if (!rs["properties"]){
                    rs["properties"]={};
                }
                var props=rs["properties"]
                var prop={};
                var val=cp[x];
                if (typeof val=="string"){
                    props[x]={
                        type: "string",
                        remote: val,
                        readonly:true,
                        virtual: true
                    }

                }
                else{
                    props[x]=val;
                }
            })
        }
        if (rs["actions"]){
            var cp=rs["actions"];
            Object.keys(cp).forEach(x=>{
                if (!rs["properties"]){
                    rs["properties"]={};
                }
                var props=rs["properties"]
                var prop={};
                var val=cp[x];
                if (typeof val=="string"){
                    props[x]={
                        type: "action",
                        body: val,
                        // readonly:true,
                        // virtual: true
                    }

                }
                else{
                    props[x]=val;
                    if (!val["type"]){
                        val["type"]="action";
                    }
                }
            })
        }
        delete rs["actions"];
        return rs;
    }
    private appendRequiredInfo(pType: ti.IParsedType, rs: any) {
        pType.declaredFacets().filter(x => x.facetName() == "hasProperty").forEach(x => {
            //console.log(x.facetName())
            var pr = rs["properties"][x.value()];
            if (!pr) {
                console.log("Ahtung")
            }
            else {
                if (typeof pr == "string") {
                    pr = {
                        type: pr
                    }
                    rs["properties"][x.value()] = pr;
                }
                pr["required"] = true;
            }
        })
    }
    visitOther(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<any>) {
        if (t.isBuiltIn()) {
            return;
        }
        var rs = this.emit(t, inf);
    }
}