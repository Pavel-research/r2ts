import rp=require("raml-1-parser")
import ti=rp.ds.rt;
import tsm=require("ts-model");
import {
    TSAPIModule, TSInterface, TSSimpleTypeReference, TSModelElement, TSMember, TSArrayReference,
    TSUnionTypeReference, TSTypeAssertion
} from "ts-model";

export enum TypeKind{
    VALUE,
    OBJECT,
    ARRAY,
    UNION,
    EXTERNAL
}

export class TypeVisitorInfo<Payload>{
    name: string
    namespace: string
    superTypes:TypeVisitorInfo<Payload>[]=[];
    kind: TypeKind
    builtIn:boolean
    payload: Payload
    //objectRepresentation: any
}

export class TypeVisitor<T>{

    tm:Map<rp.hl.ITypeDefinition,TypeVisitorInfo<T> >=new Map();

    visit(t:rp.api10.TypeDeclaration){
        this.visitStructure(t.runtimeType());
    }

    visitObject(t:rp.hl.ITypeDefinition,inf:TypeVisitorInfo<T>){

    }
    visitOther(t:rp.hl.ITypeDefinition,inf:TypeVisitorInfo<T>){

    }

    visitStructure(t:rp.hl.ITypeDefinition):TypeVisitorInfo<T>{
        if (this.tm.has(t)){
            return this.tm.get(t);
        }
        let ti=new TypeVisitorInfo<T>();
        ti.name=t.nameId();
        this.tm.set(t,ti);
        if (t.isBuiltIn()){
            ti.builtIn=true;
        }
        t.superTypes().forEach(s=>{
            ti.superTypes.push(this.visitStructure(s))
        })
        if (t.hasExternalInHierarchy()){
            ti.kind=TypeKind.EXTERNAL
            //this is an external type
        }
        else
        if (t.isObject()){
            ti.kind=TypeKind.OBJECT
            this.visitObject(t,ti);
            //object case
        }
        else {
            this.visitOther(t,ti)
        }
        return ti;
    }
}
const NameId={
    StringType:"string",
    IntegerType:"number",
    NumberType:"number",
    BooleanType:"boolean"
}

export function parsedType(t:rp.hl.ITypeDefinition):ti.IParsedType{
    return t.getAdapters()[1]
}
export class TypeScriptInterfaceEmmitter extends TypeVisitor<TSModelElement<any>>{

    readonly defaultModule:TSAPIModule=new TSAPIModule();
    readonly modules:{ [name:string]:TSAPIModule}={};

    getModule(t:rp.hl.ITypeDefinition):TSAPIModule{
        return this.defaultModule;
    }

    toRef(t:rp.hl.ITypeDefinition,reuseDeclarations:boolean=true):tsm.TSTypeReference<any>{
        if (t.isBuiltIn()){
            var name=NameId[t.nameId()];
            if (!name){
                name="any"
            }
            return new TSSimpleTypeReference(null,name);
        }
        else{
            if ((!reuseDeclarations)||!t.nameId()){
                if (t.isArray()){
                   return new TSArrayReference(this.toRef(t.array().componentType()));
                }
                if (t.isUnion()){
                    var rs=new TSUnionTypeReference();
                    rs.addChild(this.toRef(t.union().leftType()));
                    rs.addChild(this.toRef(t.union().rightType()));
                    return rs;
                }
            }
            else{
                var info=this.visitStructure(t);
                return new TSSimpleTypeReference(null,t.nameId());
            }
        }
        return null;
    }

    visitObject(t:rp.hl.ITypeDefinition,inf:TypeVisitorInfo<TSModelElement<any>>){
        if (t.isBuiltIn()){
            return;
        }
        var module=this.getModule(t);
        var int=new TSInterface(module,t.nameId());
        int.extends=inf.superTypes.filter(x=>!x.builtIn).map(x=>new TSSimpleTypeReference(null,x.name));
        t.properties().forEach(x=>{
            var decl=new tsm.TSAPIElementDeclaration(int,x.nameId());
            decl.optional=!x.isRequired();
            //if (x.)
            decl.rangeType=this.toRef(x.range());

        })
    }

    visitOther(t:rp.hl.ITypeDefinition,inf:TypeVisitorInfo<TSModelElement<any>>){
        if (t.isBuiltIn()){
            return;
        }
        var module=this.getModule(t);
        var res=new TSTypeAssertion(module,t.nameId(),this.toRef(t,false));
        (<any>res).extends=[];
    }
}

export const Ignored={
    hasProperty: true,
    propertyIs: true,
    notScalar: true,
    items: true,
    typeOf: true,
    hasPropertiesFacet: true
}
export class JavaScriptMetaEmmitter extends TypeVisitor<TSModelElement<any>>{

    names: string[];

    visitObject(t:rp.hl.ITypeDefinition,inf:TypeVisitorInfo<any>){
        if (t.isBuiltIn()){
            return;
        }
        var rs = this.emit(t, inf);
        console.log(JSON.stringify(rs,null,2))
    }


    private emit(t: rp.hl.ITypeDefinition, inf: TypeVisitorInfo<any>) {
        var rs: any = {id: t.nameId()};
        inf.payload = rs;
        var pType = parsedType(t);
        pType.allFacets().forEach(x => {

            if (Ignored[x.facetName()]) {
                return
            }
            if (x.kind() == ti.tsInterfaces.MetaInformationKind.Annotation) {
                //console.log(x.facetName())
            }
            //console.log(x.facetName())
            rs[x.facetName()] = x.value()
        })
        var props = {};
        t.properties().forEach(x => {
            var desc = this.visitStructure(x.range());
            if (desc.name){
                if (desc.builtIn) {
                   var q=NameId[ desc.name];
                   if (!q){
                       q="any";
                   }
                   props[x.nameId()]=q;
                }
            }
            else{
                if (desc.name){
                    props[x.nameId()]=desc.name;
                }
                else {
                    props[x.nameId()] = desc.payload
                }
            }

        })
        if (Object.keys(props).length > 0) {
            rs.properties = props;
        }
        return rs;
    }

    visitOther(t:rp.hl.ITypeDefinition,inf:TypeVisitorInfo<any>){
        if (t.isBuiltIn()){
            return;
        }
        var rs = this.emit(t, inf);
    }
}