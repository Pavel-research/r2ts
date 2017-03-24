import rtb=require("raml-type-bindings");
import {
    TSAPIModule, TSInterface, TSSimpleTypeReference, TSModelElement, TSMember, TSArrayReference,
    TSUnionTypeReference, TSTypeAssertion, TSAPIElementDeclaration
} from "ts-model";


export class InterfaceGenerator{

    module:TSAPIModule=new TSAPIModule();

    visitType(t:rtb.Type){
        if (rtb.service.isObject(t)){
            var ti=new TSInterface(this.module,t.id);
            //ti.extends=[]
            rtb.service.superTypes(t).forEach(x=>{
                if (x.id!="object") {
                    ti.extends.push(new TSSimpleTypeReference(null, x.id))
                }
            })
            let ot:rtb.ObjectType=<rtb.ObjectType>t;
            Object.keys(ot.properties).forEach(x=>{
                var rp=new TSAPIElementDeclaration(ti,x);
                var pr=rtb.service.property(t,x);
                if (!pr.required){
                    rp.optional=true;
                }
                var tp=pr.type;

                tp=rtb.service.resolvedType(tp);
                if (!tp.id){
                    tp=tp.type;
                }
                if (rtb.service.isArray(tp)){
                    rp.rangeType = new TSArrayReference (new TSSimpleTypeReference(null, rtb.service.componentType(tp).id));
                }
                else {
                    rp.rangeType = new TSSimpleTypeReference(null, tp.id);
                }
            })
        }
    }

    toString(){
        return this.module.serializeToString();
    }
}