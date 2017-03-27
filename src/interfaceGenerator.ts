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
            export function client(options:any):_CLIENT_INTERFACE{
                return null;            
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

    addOperation(v:rtb.Operation){
        if (this.referencedIds[v.id]){
            return;
        }
        var opurl=(<any>v).url;
        //now we need to generate an http method for this operation;
        var segments:string[]=opurl.split("/");

           var element=new TSAPIElementDeclaration(this,v.id);
           element.isFunc=true;
           var q:any=v.result;
           v.parameters.forEach(x=>{
               element.parameters.push(new Param(element,x.id,null,this.gen.toRef(x.type)))
           })
           if (!q){
               q=(<any>v).itemType;
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
        new StaticBody(this.module,"a");
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
                        var range=this.toRef(rtb.service.componentType(mm));
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
            if (t.id==undefined){
                console.log("A")
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