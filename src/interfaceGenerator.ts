import rtb=require("raml-type-bindings");
import {
    TSAPIModule, TSInterface, TSSimpleTypeReference, TSModelElement, TSMember, TSArrayReference,
    TSUnionTypeReference, TSTypeAssertion, TSAPIElementDeclaration, TSTypeReference, Param
} from "ts-model";
import {type} from "os";

export class MapPropertyReference extends TSModelElement<any> {

    constructor(private name: string, private property: TSTypeReference<any>) {
        super(null);
    }

    serializeToString() {
        return '[' + this.name + ':string ]:' + this.property.serializeToString();
    }
}
export class TypeDeclReference extends TSModelElement<any> {

    constructor(private name: string, private property: TSTypeReference<any>) {
        super(null);
    }

    serializeToString() {
        return 'type ' + this.name + '=' + this.property.serializeToString();
    }
}
export class ViewManager{

}

function getNotConflictingName(tp:any,t:rtb.Type):string{
    var mm=rtb.service.resolvedType(tp);
    var url=(<any>mm).relativeUrl;
    var pr = rtb.service.property(t, url);
    if (pr){
        return mm.id;
    }
    var result=true;
    rtb.service.properties(t).forEach(x=>{
        if (rtb.service.isView(x.type)){
            var mm=rtb.service.resolvedType(x.type);
            var murl=(<any>mm).relativeUrl;
            if (murl==url){
                if (x.type!=tp){
                    result=false;
                }
            }
            return;
        }
    })
    if (result) {
        return url.substring(1);
    }
    return mm.id
}
export class StaticBody extends TSInterface{

    serializeToString():string{
        return `
            declare function require(v:string):any
            export function client(options:any):_CLIENT_INTERFACE{
                var module=require('./types');
                var rtb:any=require('raml-type-bindings');
                return rtb.createClient(module,options)
            }
        `
    }
}



export class ClientGenerator extends TSInterface{

    referencedIds:{ [name:string]: boolean}={}

    refefence(c:string){
        this.referencedIds[c]=true;
    }

    constructor(parent:TSAPIModule,name:string,private gen:InterfaceGenerator){
        super(parent,name);
    }
    types:{[name:string]:rtb.Type}

    setTypes(v:{[name:string]:rtb.Type}){
        this.types=v;
    }
    collectMethods(name:string,t:rtb.Type,op:rtb.Operation[]){
        var vl:string[]=t[name];
        if (vl){
            vl.forEach(x=>{op.push(<any>this.types[x])})
        }
    }
    recordType(t:rtb.Type){
        var ops:rtb.Operation[]=[];
        //this.collectMethods("details",t,ops);
        this.collectMethods("constructors",t,ops);
        //this.collectMethods("actions",t,ops);
        this.collectMethods("updaters",t,ops);
        //this.collectMethods("destructors",t,ops);
        this.collectMethods("listers",t,ops);
        if (ops.length==0){
            return;
        }
        var name=t.id;
        if (name.indexOf('_')!=-1){
            name=name.substring(name.indexOf('_')+1).toLowerCase();
        }


        var ss=new TSInterface(this.parent(),t.id+"Service");

        ops.forEach(x=>this.addOp(ss,x));
        if (ss.children().length==0){
            this.parent().removeChild(ss);
            return;
        }
        var type=new TSAPIElementDeclaration(this,name);
        type.rangeType=new TSSimpleTypeReference(null, ss.name)
    }

    typeFromRef(r0:string):rtb.Type{

        if (r0.indexOf('.')!=-1){
            r0=r0.substring(0,r0.indexOf('.'))
        }
        return this.types[r0];
    }

    isComputable(r0:string,r1:string){
        var t0=this.typeFromRef(r0);
        var t1=this.typeFromRef(r1);
        if (t0==t1){
            return true;
        }
        var rs=false;
        rtb.service.properties(t0).forEach(x=>{
            if (rtb.service.isSubtypeOf(x,t1)){
                rs=true
            }
        });
        return rs;
    }
    serializeToString(){
        return super.serializeToString()+`export interface Collection<T>{
    count(): number
    all(): Promise<T[]>
    forEach( f:(c:T)=>void|Promise<any>): Promise<void>
    map<A>( f:(c:T)=>A): Collection<A>
    filter(options:any):Collection<T>
    sort(options:any):Collection<T>
}`
    }
    addOp(parent:TSInterface,v:rtb.Operation){
        var name=v.id;
        if (v.type=="view"&&(<any>v).memberCollection){
            return;
        }
        if (Object.keys(v).indexOf('list')!=-1){
            name="list";
        }
        if (Object.keys(v).indexOf('create')!=-1){
            name="create";
        }
        if (Object.keys(v).indexOf('update')!=-1){
            name="update";
        }
        if ((<any>v).method){
            name=(<any>v).method;
        }
        if ((<any>v).methodName){
            name=(<any>v).methodName;
        }

        var allRefs=v.parameters.filter(x=>(<any>x).reference)
        for (var i=0;i<allRefs.length;i++){
            for (var j=0;j<allRefs.length;j++){
                if (i!=j) {
                    var r0 = (<any>allRefs[i]).reference;
                    var r1 = (<any>allRefs[j]).reference;
                    if (this.isComputable(r0, r1)) {
                        allRefs=allRefs.filter(x=>x!=allRefs[j]);
                    }
                    else if (this.isComputable(r1, r0)) {
                        allRefs=allRefs.filter(x=>x!=allRefs[i]);
                    }
                }
            }
        }
        if (allRefs.length>0) {
            var baseType = this.typeFromRef((<any>allRefs[0]).reference).id;
            this.parent().children().forEach(x => {
                if (x instanceof TSInterface) {
                    if (baseType.endsWith(x.name)) {
                        parent = x;
                    }
                }
            })
            var rr=allRefs[0]
            allRefs=allRefs.filter(x=>x!=rr);
        }
        var element=new TSAPIElementDeclaration(parent,name);
        element.isFunc=true;
        var q:any=v.result;
        allRefs.forEach(x=>{
            //if (!(<any>x).reference) {
                element.parameters.push(new Param(element, x.id, null, new TSSimpleTypeReference(null,this.typeFromRef((<any>x).reference).id)))
            //}
        })
        v.parameters.forEach(x=>{
            if (!(<any>x).reference) {
                element.parameters.push(new Param(element, x.id, null, this.gen.toRef(x.type)))
            }
        })
        var collection=false;
        if (!q){
            q=(<any>v).itemType;
            collection=true;
        }
        if (q) {
            if (typeof q=="string"){
                element.rangeType = new TSSimpleTypeReference(null,q);
            }
            else  if (q.type){
                return element.rangeType = this.gen.toRef(q.type);
            }
        }
        else{
            element.rangeType=new TSSimpleTypeReference(null,"void");
        }
        if (collection){
            element.rangeType=new CollectionReference(element.rangeType);
        }
    }
    addOperation(v:rtb.Operation){
        if (this.referencedIds[v.id]){
            return;
        }
        var opurl=(<any>v).url;
        //now we need to generate an http method for this operation;
        var segments:string[]=opurl.split("/");
        var parent:TSInterface=this;
        this.addOp(parent,v);
    }
}
export class CollectionReference extends TSArrayReference{

    serializeToString(){
        return "Collection<"+this.componentType.serializeToString()+">"
    }
}
export class InterfaceGenerator {

    module: TSAPIModule = new TSAPIModule();
    client=new ClientGenerator(this.module,"_CLIENT_INTERFACE",this);

    process(t: {types: {[name: string]: rtb.Type}}) {

        Object.keys(t.types).forEach(x => rtb.service.register(t.types[x]))
        Object.keys(t.types).forEach(x => this.visitType(t.types[x]))
        Object.keys(t.types).forEach(x => {
            var tp=t.types[x];
            if (rtb.service.isSubtypeOf(tp,rtb.TYPE_OPERATION)){
                this.client.addOperation(<any>tp);
                return;
            }
            if (rtb.service.isSubtypeOf(tp,rtb.TYPE_VIEW)){
                this.client.addOperation(<any>tp);
                return;
            }
        })
        this.client.setTypes(t.types);
        Object.keys(t.types).forEach(x => {
            var tp=t.types[x];
            if (rtb.service.isSubtypeOf(tp,rtb.TYPE_OBJECT)){
                this.client.recordType(<any>tp);
                return;
            }
        })
        new StaticBody(this.module,"a");
    }
    addMethods(me:(rtb.Operation | string)[],i:TSInterface,ot:rtb.ObjectType){
        if (me){
            me.forEach(x=>{
                if (typeof x=="string"){
                    this.client.refefence(x);
                }
            })
        }
    }
    visitType(t: rtb.Type) {

        if (rtb.service.isObject(t)) {
            var ti = new TSInterface(this.module, t.id);
            //ti.extends=[]
            rtb.service.superTypes(t).forEach(x => {
                if (x.id != "object") {
                    ti.extends.push(new TSSimpleTypeReference(null, x.id))
                }
            })
            let ot: rtb.ObjectType = <rtb.ObjectType>t;
            if (ot.properties) {
                Object.keys(ot.properties).forEach(x => {
                    var pr = rtb.service.property(t, x);
                    var tp = pr.type;
                    if (rtb.service.isView(tp)){
                        var mm=rtb.service.resolvedType(tp);
                        var name=getNotConflictingName(tp,t);
                        this.client.refefence(tp.type);
                        var rp = new TSAPIElementDeclaration(ti, name);
                        rp.isFunc=true;
                        var range=new CollectionReference(this.toRef(rtb.service.componentType(mm)));
                        rp.rangeType=range;
                        return;
                    }
                    var rp = new TSAPIElementDeclaration(ti, x);
                    if (!pr.required) {
                        rp.optional = true;
                    }

                    rp.rangeType = this.toRef(tp);
                    //rp._body=`_q:string`
                })
            }
            this.addMethods(ot.details,ti,ot);
            this.addMethods(ot.constructors,ti,ot);
            this.addMethods(ot.updaters,ti,ot);
            this.addMethods(ot.listers,ti,ot);

        }
        else if (rtb.service.isMap(t)) {
            var ti = new TSInterface(this.module, t.id);
            var rr = new MapPropertyReference("name", this.toRef(rtb.service.componentType(t)));
            ti.addChild(<any>rr);
        }
        else {
            if (rtb.service.isSubtypeOf(t,rtb.TYPE_OPERATION)){
                //this.client.addOperation(<any>t);
                return;
            }
            if (rtb.service.isSubtypeOf(t,rtb.TYPE_VIEW)){
                //this.client.addOperation(<any>t);
                return;
            }
            if (rtb.service.isSubtypeOf(t,rtb.TYPE_MODULE)){
                return;
            }
            if (rtb.service.isSubtypeOf(t,rtb.TYPE_SECURITYDEFINITION)){
                return;
            }
            var ttt = new TypeDeclReference(t.id, this.toRef(t));
            (<any>ttt).extends = [];
            this.module.addChild(<any>ttt);
        }
    }

    toRef(tp: any) {
        var ref: TSTypeReference<any> = null;
        tp = rtb.service.resolvedType(tp);
        if (!tp.id) {
            tp = rtb.service.superTypes(tp)[0];
        }
        if (rtb.service.isSubtypeOf(tp, rtb.TYPE_UNION)) {
            var ut = (<rtb.UnionType>tp);
            var ur = new TSUnionTypeReference(null, tp.id);
            ut.options.forEach(x => ur.addChild(this.toRef(x)));
            ref = ur;
        }
        else if (rtb.service.isArray(tp)) {
            ref = new TSArrayReference(new TSSimpleTypeReference(null, rtb.service.componentType(tp).id));
        }
        else {
            ref = new TSSimpleTypeReference(null, this.cleanId(tp));
        }
        return ref;
    }

    private cleanId(tp: any) {
        if (rtb.service.isNumber(tp)){
            return "number"
        }
        if (rtb.service.isString(tp)){
            return "string"
        }
        if (rtb.service.isDate(tp)){
            return "string"
        }
        if (rtb.service.isBoolean(tp)){
            return "boolean"
        }
        return tp.id;
    }

    toString() {
        return this.module.serializeToString();
    }
}