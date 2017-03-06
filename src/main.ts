import rp=require("raml-1-parser");
import typeVisitor=require("./typeVisitor")
import rtb=require("raml-type-bindings")
export interface ProcessingResult{

    ramlSource: string

    types:{

        [name:string]:any
    }
}
export function process(x:rp.api10.LibraryBase):ProcessingResult{
    var c=x.highLevel().lowLevel().unit().contents();
    var rs={
        ramlSource:c,
        types:{},
        annotations:{}
    }
    if (x.kind()=="Library"){
        var emmitter=new typeVisitor.JavaScriptMetaEmmitter();
        emmitter.defaultPath=x.highLevel().lowLevel().unit().absolutePath();
        (<rp.api10.Library>x).types().forEach(x=>{
            var res=emmitter.visit(x);
            if (res.payload["id"]) {
                rs.types[res.payload["id"]] = res.payload;
            }
        })
        Object.keys(emmitter.extraTypes).forEach(x=>{
            rs.types[x]=emmitter.extraTypes[x];
        })
    }
    if (x.kind()=="Api"){
        var emmitter=new typeVisitor.JavaScriptMetaEmmitter();
        x=(<rp.api10.Api>x).expand(false)
        emmitter.defaultPath=x.highLevel().lowLevel().unit().absolutePath();
        (<rp.api10.Api>x).types().forEach(x=>{
            var res=emmitter.visit(x);
            if (res.payload["id"]) {
                rs.types[res.payload["id"]] = res.payload;
            }
        });
        var operations:rtb.Operation[]=[];
        (<rp.api10.Api>x).allResources().forEach(x=>{
            var res=emmitter.visitResource(x);
            operations=operations.concat(res);
        })
        Object.keys(rs.types).forEach(x=>{
            if (emmitter.idToType[x]){
                rs.types[x]=emmitter.idToType[x];
            }
        })
        operations.forEach(x=>{
            if ((<any>x).type){
                rs.types[x.id]=x;
            }
            else {
                rs.types[x.id] = x;
                x.type="operation";
            }
        })
        var secDefinitions=(<rp.api10.Api>x).securitySchemes().map(x=>emmitter.visitSecurityDefinition(x));
        secDefinitions.forEach(s=>{
            rs.types[s.id]=s;
        });//
        rs.types['_module_']={};
        rs.types['_module_'].type="module";
        (<rp.api10.Api>x).highLevel().attrs().forEach(x=>{
            if (x.name()=="annotations"){
                var obj=x.lowLevel().dumpToObject(true);
                var an=Object.keys(obj)[0];
                var av=obj[an];
                an=an.substring(1,an.length-1);
                if (an.indexOf('.')!=-1){
                    an=an.substring(an.indexOf('.')+1);
                }
                rs.types['_module_'][an]=av;
            }
        })
        Object.keys(emmitter.extraTypes).forEach(x=>{
            rs.types[x]=emmitter.extraTypes[x];
        })
        Object.keys(rs.types).forEach(k=>{
            createAiliases(rs.types[k])
        })

    }
    return rs;
}
function createAiliases(t:rtb.Type){
    var am:any={};
    if ((<any>t).properties){
        Object.keys((<any>t).properties).forEach(z=>{
            if (z.charAt(0)=='_'){
                console.log(z);
                var mm=((<any>t).properties)[z];
                if (mm.displayName){
                    am[mm.displayName.toLowerCase()]=z;
                }
            }

        })
    }
    if (Object.keys(am).length>0){
        (<any>t).aliases=am;
    }

}
export function parseToJSON(url:string,f:(v:ProcessingResult)=>void){

    rp.loadRAML(url,[]).then( (x)=>{
        f(process(<any>x));
    })
}